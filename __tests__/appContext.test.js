import React from 'react';
import { act, create } from 'react-test-renderer';
import { AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppProvider, useAppContext } from '../context/AppContext';
import { initialState, STORAGE_KEY } from '../lib/storage';
import { getPrayerTimes } from '../lib/loopTime';

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(), setItem: jest.fn()
}));

let context;
const Probe = () => { context = useAppContext(); return null; };
const flush = async () => { for (let i = 0; i < 15; i += 1) await Promise.resolve(); };
let tree;
let foregroundHandlers;
const foreground = status => foregroundHandlers.forEach(handler => handler(status));
const mount = async () => {
  await act(async () => {
    tree = create(<AppProvider><Probe /></AppProvider>);
    await flush();
  });
  await act(flush);
};
const invoke = async fn => { await act(async () => { fn(); await flush(); }); await act(flush); };
const unmount = async () => { if (tree) { await act(async () => tree.unmount()); tree = null; } };

beforeEach(() => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  jest.useFakeTimers();
  jest.setSystemTime(new Date(2026, 9, 15, 9));
  foregroundHandlers = new Set();
  jest.spyOn(AppState, 'addEventListener').mockImplementation((event, handler) => {
    foregroundHandlers.add(handler);
    return { remove: () => foregroundHandlers.delete(handler) };
  });
  AsyncStorage.getItem.mockReset().mockResolvedValue(null);
  AsyncStorage.setItem.mockReset().mockResolvedValue(undefined);
});
afterEach(async () => { await unmount(); jest.useRealTimers(); jest.restoreAllMocks(); });

it('blocks persistence on malformed data and recovers by retry without clearing storage', async () => {
  AsyncStorage.getItem.mockResolvedValue('{unreadable');
  await mount();
  expect(context.isHydrated).toBe(false);
  expect(context.storageError).toMatch(/untouched/);
  expect(AsyncStorage.setItem).not.toHaveBeenCalled();
  AsyncStorage.getItem.mockResolvedValue(JSON.stringify(initialState));
  await invoke(() => context.retryHydration());
  expect(context.isHydrated).toBe(true);
  expect(context.storageError).toBeNull();
  expect(AsyncStorage.setItem).toHaveBeenCalledWith(STORAGE_KEY, JSON.stringify(initialState));
});
it('blocks persistence on read failure', async () => {
  AsyncStorage.getItem.mockRejectedValue(new Error('read failed'));
  await mount();
  await invoke(() => jest.advanceTimersByTime(2000));
  expect(context.isHydrated).toBe(false);
  expect(AsyncStorage.setItem).not.toHaveBeenCalled();
});
it('reports save failure and allows a successful retry', async () => {
  AsyncStorage.setItem.mockRejectedValue(new Error('full'));
  await mount();
  expect(context.saveError).toBe(true);
  AsyncStorage.setItem.mockResolvedValue(undefined);
  await invoke(() => context.retrySave());
  expect(context.saveError).toBe(false);
});
it('keeps user records and a running timer through an ordinary provider restart', async () => {
  let stored = null;
  AsyncStorage.getItem.mockImplementation(async () => stored);
  AsyncStorage.setItem.mockImplementation(async (key, value) => { stored = value; });
  await mount();
  await invoke(() => context.submitCheckIn({ date: '2026-10-15', energy: 1, mood: 'low', sleep: 'poor', priorities: [{ id: 'a', title: 'Write' }] }));
  await invoke(() => context.selectDuration(15));
  await invoke(() => context.toggleTimer('a'));
  const session = context.timer.session;
  await unmount();
  jest.setSystemTime(new Date(2026, 9, 15, 9, 16));
  await mount();
  expect(context.timer.phase).toBe('break');
  expect(context.today.checkIn.energy).toBe(1);
  expect(context.today.focusSessions).toHaveLength(1);
  expect(context.today.focusSessions[0]).toMatchObject({ id: session.id, priorityId: 'a', minutes: 15 });
  await invoke(() => jest.advanceTimersByTime(1000));
  await unmount();
  await mount();
  expect(context.today.focusSessions).toHaveLength(1);
});
it('retains a paused timer across provider restart', async () => {
  let stored;
  AsyncStorage.getItem.mockImplementation(async () => stored ?? null);
  AsyncStorage.setItem.mockImplementation(async (key, value) => { stored = value; });
  await mount();
  await invoke(() => context.toggleTimer(null));
  jest.setSystemTime(new Date(2026, 9, 15, 9, 5));
  await invoke(() => context.toggleTimer(null));
  await unmount();
  jest.setSystemTime(new Date(2026, 9, 16, 10));
  await mount();
  expect(context.timer.endAt).toBeNull();
  expect(context.timer.pausedRemaining).toBe(20 * 60);
  expect(context.timer.session.date).toBe('2026-10-15');
});
it('settles on foreground without requiring a mounted Focus screen', async () => {
  await mount();
  await invoke(() => context.toggleTimer(null));
  jest.setSystemTime(new Date(2026, 9, 15, 9, 26));
  await invoke(() => foreground('active'));
  expect(context.today.focusSessions).toHaveLength(1);
  expect(context.timer.phase).toBe('break');
});
it.each(['fixed', 'prayer'])('saves check-in/review to explicit date after %s boundary', async timingMode => {
  const boundary = timingMode === 'fixed' ? new Date(2026, 9, 16, 4) : getPrayerTimes('cairo', new Date(2026, 9, 16, 12)).fajr;
  AsyncStorage.getItem.mockResolvedValue(JSON.stringify({ ...initialState, settings: { ...initialState.settings, timingMode } }));
  jest.setSystemTime(new Date(boundary.getTime() - 60000));
  await mount();
  const draftDate = context.todayKey;
  jest.setSystemTime(new Date(boundary.getTime() + 60000));
  await invoke(() => foreground('active'));
  expect(context.todayKey).toBe('2026-10-16');
  await invoke(() => context.submitCheckIn({ date: draftDate, energy: 3, mood: 'good', sleep: 'ok', priorities: [{ id: 'a', title: 'Write' }] }));
  await invoke(() => context.submitReview({ date: draftDate, feeling: 'good', completedIds: ['a'] }));
  expect(context.state.days[draftDate].checkIn.energy).toBe(3);
  expect(context.state.days[draftDate].review.feeling).toBe('good');
  expect(context.state.days[draftDate].priorities[0].completed).toBe(true);
  expect(context.state.days['2026-10-16']).toBeUndefined();
});
it('serializes slow writes so the final saved state is newest', async () => {
  let release;
  AsyncStorage.setItem.mockImplementationOnce(() => new Promise(resolve => { release = resolve; }));
  await mount();
  await invoke(() => context.updateSettings({ wakeTime: '08:00' }));
  await invoke(() => context.updateSettings({ wakeTime: '09:00' }));
  expect(AsyncStorage.setItem).toHaveBeenCalledTimes(1);
  await invoke(() => release());
  const calls = AsyncStorage.setItem.mock.calls;
  expect(JSON.parse(calls[calls.length - 1][1]).settings.wakeTime).toBe('09:00');
});
