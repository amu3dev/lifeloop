import { decodeState, hydrateState, initialState, STORAGE_KEY } from '../lib/storage';
import { createTimer, getRemainingSeconds, getSuggestedFocusMinutes } from '../lib/focusTimer';
import { toggleFocusTimer, settleFocusTimer, resetFocusTimer, selectFocusDuration } from '../lib/loopState';
import { getLoopDateKey, getPrayerTimes } from '../lib/loopTime';
import { getSevenDayHistory } from '../lib/history';

const MINUTE = 60000;
const T0 = new Date(2026, 9, 15, 9).getTime();
const fixture = () => ({ ...initialState, days: { '2026-10-15': {
  checkIn: { at: new Date(T0).toISOString(), energy: 2, mood: 'low', sleep: 'poor' },
  priorities: [{ id: 'a', title: 'Original', completed: false }, { id: 'b', title: 'Other', completed: false }],
  focusSessions: []
} } });
const restart = state => decodeState(JSON.stringify(state));

describe('storage recovery', () => {
  it('initializes missing storage and restores older valid records without a timer', async () => {
    expect(decodeState(null)).toEqual(initialState);
    expect(restart(fixture())).toEqual(fixture());
    const storage = { getItem: jest.fn().mockResolvedValue(null) };
    expect((await hydrateState(storage)).state).toEqual(initialState);
    expect(storage.getItem).toHaveBeenCalledWith(STORAGE_KEY);
  });
  it.each(['{broken', '', 'null', '[]', '{"settings":{},"days":[]}'])('does not write unreadable data: %s', async raw => {
    const storage = { getItem: jest.fn().mockResolvedValue(raw), setItem: jest.fn() };
    expect((await hydrateState(storage)).error).toBeTruthy();
    expect(storage.setItem).not.toHaveBeenCalled();
  });
  it('does not write after a read failure', async () => {
    const storage = { getItem: jest.fn().mockRejectedValue(new Error('IO')), setItem: jest.fn() };
    expect((await hydrateState(storage)).state).toBeNull();
    expect(storage.setItem).not.toHaveBeenCalled();
  });
  it.each([null, { priorities: [null] }, { focusSessions: [{ minutes: -1 }] }, { checkIn: {} }])('rejects unsafe day records', day => {
    expect(() => decodeState(JSON.stringify({ ...initialState, days: { '2026-10-15': day } }))).toThrow();
  });
});

describe('persisted focus blocks', () => {
  it.each([15, 25])('restores a running %i-minute block and records it once', minutes => {
    let state = selectFocusDuration(fixture(), minutes);
    state = restart(toggleFocusTimer(state, 'a', T0, 'session-1'));
    expect(getRemainingSeconds(state.timer, T0 + 5 * MINUTE)).toBe((minutes - 5) * 60);
    state = settleFocusTimer(state, T0 + minutes * MINUTE, 'next');
    expect(state.days['2026-10-15'].focusSessions).toHaveLength(1);
    expect(state.days['2026-10-15'].focusSessions[0].minutes).toBe(minutes);
    const restored = restart(state);
    expect(settleFocusTimer(restored, T0 + minutes * MINUTE, 'next')).toBe(restored);
  });
  it('restores pause and resumes using the remaining time', () => {
    let state = toggleFocusTimer(fixture(), 'a', T0, 'id');
    state = restart(toggleFocusTimer(state, 'b', T0 + 5 * MINUTE, 'unused'));
    expect(getRemainingSeconds(state.timer, T0 + 60 * MINUTE)).toBe(20 * 60);
    state = toggleFocusTimer(state, 'b', T0 + 60 * MINUTE, 'unused');
    expect(getRemainingSeconds(state.timer, T0 + 70 * MINUTE)).toBe(10 * 60);
    expect(state.timer.session.priorityId).toBe('a');
  });
  it.each(['selection', 'completion', 'deletion'])('preserves attribution after priority %s', change => {
    let state = toggleFocusTimer(fixture(), 'a', T0, 'id');
    const day = state.days['2026-10-15'];
    state = { ...state, days: { ...state.days, '2026-10-15': { ...day, priorities: change === 'deletion' ? day.priorities.slice(1) : day.priorities.map(p => ({ ...p, completed: change === 'completion' })) } } };
    state = settleFocusTimer(restart(state), T0 + 25 * MINUTE, 'next');
    expect(state.days['2026-10-15'].focusSessions[0]).toMatchObject({ priorityId: 'a', priorityTitle: 'Original', minutes: 25, id: 'id' });
  });
  it('reset discards unfinished time and retains the selected duration', () => {
    const state = toggleFocusTimer(selectFocusDuration(fixture(), 15), 'a', T0, 'id');
    const next = resetFocusTimer(state, T0 + MINUTE, 'next');
    expect(next.timer).toEqual(createTimer(900));
    expect(next.days['2026-10-15'].focusSessions).toEqual([]);
  });
  it('settles an expired focus before reset instead of losing its completion', () => {
    const state = toggleFocusTimer(fixture(), 'a', T0, 'id');
    expect(resetFocusTimer(state, T0 + 25 * MINUTE, 'next').days['2026-10-15'].focusSessions).toHaveLength(1);
  });
  it('long background absence logs only the original block and returns idle', () => {
    const next = settleFocusTimer(restart(toggleFocusTimer(fixture(), 'a', T0, 'id')), T0 + 120 * MINUTE, 'next');
    expect(next.timer).toEqual(createTimer());
    expect(next.days['2026-10-15'].focusSessions).toHaveLength(1);
  });
  it('retains duration across a break and binds the automatically started next focus', () => {
    let state = toggleFocusTimer(selectFocusDuration(fixture(), 15), 'a', T0, 'id');
    state = settleFocusTimer(state, T0 + 15 * MINUTE, 'next');
    expect(state.timer.pausedRemaining).toBe(300);
    state = restart(settleFocusTimer(state, T0 + 20 * MINUTE, 'second'));
    expect(state.timer.session.id).toBe('second');
    expect(getRemainingSeconds(state.timer, T0 + 20 * MINUTE)).toBe(900);
    expect(settleFocusTimer(state, T0 + 35 * MINUTE, 'third').days['2026-10-15'].focusSessions).toHaveLength(2);
  });
  it.each(['fixed', 'prayer'])('retains owning loop day across %s boundary and restart', timingMode => {
    const settings = { ...initialState.settings, timingMode };
    const boundary = timingMode === 'fixed' ? new Date(2026, 9, 16, 4).getTime() : getPrayerTimes('cairo', new Date(2026, 9, 16, 12)).fajr.getTime();
    const start = boundary - 5 * MINUTE;
    const date = getLoopDateKey(settings, new Date(start));
    let state = toggleFocusTimer({ settings, days: {} }, null, start, 'id');
    state = settleFocusTimer(restart(state), boundary + 21 * MINUTE, 'next');
    expect(Object.keys(state.days)).toEqual([date]);
    expect(state.days[date].focusSessions).toHaveLength(1);
  });
});

describe('optional focus suggestion', () => {
  it.each([[1, 15], [2, 15], [3, 25], [5, 25], [undefined, 25]])('energy %s suggests %i', (energy, minutes) => {
    expect(getSuggestedFocusMinutes(energy ? { energy } : undefined)).toBe(minutes);
  });
  it('does not change a running or paused block when energy/duration changes', () => {
    const state = toggleFocusTimer(fixture(), 'a', T0, 'id');
    expect(selectFocusDuration(state, 15)).toBe(state);
    const paused = toggleFocusTimer(state, 'b', T0 + MINUTE, 'unused');
    expect(selectFocusDuration(paused, 15)).toBe(paused);
  });
});

describe('seven loop days', () => {
  it('shows missing dates separately from recorded zero activity', () => {
    const empty = getSevenDayHistory({}, '2027-01-03');
    expect(empty).toHaveLength(7);
    expect(empty.every(day => !day.hasRecord && day.focusMinutes === null)).toBe(true);
    expect(empty.map(day => day.date)).toEqual(['2027-01-03', '2027-01-02', '2027-01-01', '2026-12-31', '2026-12-30', '2026-12-29', '2026-12-28']);
    const history = getSevenDayHistory({ '2027-01-01': {} }, '2027-01-03');
    expect(history[2]).toMatchObject({ hasRecord: true, focusMinutes: 0, completedPriorities: 0, checkedIn: false, reviewed: false });
  });
  it('computes historical totals without requiring a completed loop', () => {
    const state = fixture();
    state.days['2026-10-15'].priorities[0].completed = true;
    state.days['2026-10-15'].focusSessions = [{ minutes: 15 }, { minutes: 25 }];
    expect(getSevenDayHistory(state.days, '2026-10-15')[0]).toMatchObject({ checkedIn: true, reviewed: false, energy: 2, focusMinutes: 40, completedPriorities: 1 });
  });
  it('shows seven recorded days in descending order across leap day', () => {
    const days = Object.fromEntries(getSevenDayHistory({}, '2028-03-03').map(day => [day.date, {}]));
    const history = getSevenDayHistory(days, '2028-03-03');
    expect(history.every(day => day.hasRecord)).toBe(true);
    expect(history[3].date).toBe('2028-02-29');
  });
});

it('keeps the selected open priority for the next Pomodoro after a break', () => {
  let state = toggleFocusTimer(fixture(), 'b', T0, 'first');
  state = restart(settleFocusTimer(state, T0 + 25 * MINUTE, 'unused'));
  state = settleFocusTimer(state, T0 + 30 * MINUTE, 'second');
  expect(state.timer.session).toMatchObject({ id: 'second', priorityId: 'b' });
});
it('rejects corrupted timer metadata without changing existing day records', () => {
  const state = toggleFocusTimer(fixture(), 'a', T0, 'first');
  for (const timer of [
    { ...state.timer, endAt: 1e20 },
    { ...state.timer, focusDuration: 3600 },
    { ...state.timer, pausedRemaining: -1 },
    { ...state.timer, session: { ...state.timer.session, date: '2026-02-30' } },
    { ...state.timer, session: { ...state.timer.session, priorityTitle: {} } }
  ]) {
    expect(() => restart({ ...state, timer })).toThrow();
  }
});
