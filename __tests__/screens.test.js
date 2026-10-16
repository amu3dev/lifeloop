import React from 'react';
import { act, create } from 'react-test-renderer';
import { Alert, Text } from 'react-native';
import { AppProvider, useAppContext } from '../context/AppContext';
import CheckInScreen from '../screens/CheckInScreen';
import ReviewScreen from '../screens/ReviewScreen';
import FocusFlowScreen from '../modules/focus-flow/FocusFlowScreen';
import Button from '../components/shared/Button';
import OptionChips from '../components/shared/OptionChips';
import TextField from '../components/shared/TextField';
import { initialState } from '../lib/storage';
import { getPrayerTimes } from '../lib/loopTime';
import AsyncStorage from '@react-native-async-storage/async-storage';

jest.mock('@react-native-async-storage/async-storage', () => ({ getItem: jest.fn(), setItem: jest.fn() }));
jest.mock('@react-navigation/native', () => ({ useIsFocused: () => true }));
jest.mock('@expo/vector-icons', () => ({ MaterialIcons: 'Icon' }));
jest.mock('react-native-safe-area-context', () => ({ SafeAreaView: 'SafeAreaView' }));
jest.mock('../components/shared/ProgressRing', () => 'ProgressRing');

let context;
const Probe = () => { context = useAppContext(); return null; };
const flush = async () => { for (let i = 0; i < 15; i += 1) await Promise.resolve(); };
const invoke = async fn => { await act(async () => { fn(); await flush(); }); await act(flush); };
let tree;
const navigation = { goBack: jest.fn(), navigate: jest.fn() };
const render = async (Screen, visible = true) => {
  const element = <AppProvider><Probe />{visible ? <Screen navigation={navigation} /> : null}</AppProvider>;
  await act(async () => { if (tree) tree.update(element); else tree = create(element); await flush(); });
  await act(flush);
};
const press = async label => invoke(() => tree.root.findAllByType(Button).find(button => button.props.label === label).props.onPress());
const textIncludes = value => tree.root.findAllByType(Text).some(node => node.props.children?.toString().includes(value));

beforeEach(() => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  jest.useFakeTimers();
  jest.setSystemTime(new Date(2026, 9, 16, 3, 59));
  AsyncStorage.getItem.mockReset().mockResolvedValue(JSON.stringify({ ...initialState, days: { '2026-10-15': {
    checkIn: { at: '2026-10-15T07:00:00Z', energy: 2, mood: 'low', sleep: 'poor' },
    priorities: [{ id: 'a', title: 'Original', completed: false }], focusSessions: [],
    review: { at: '2026-10-15T23:00:00Z', feeling: 'good' }
  } } }));
  AsyncStorage.setItem.mockReset().mockResolvedValue(undefined);
  jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  navigation.goBack.mockClear();
});
afterEach(async () => { if (tree) { await act(async () => tree.unmount()); tree = null; } jest.useRealTimers(); jest.restoreAllMocks(); });

it.each([
  [CheckInScreen, 'Update check-in'], [ReviewScreen, 'Update review']
])('keeps an open form bound to its original day at 04:00', async (Screen, label) => {
  // Hydrate before mounting a screen, matching the actual navigation gate.
  await render(Screen, false);
  await render(Screen);
  if (Screen === CheckInScreen) {
    const field = tree.root.findAllByType(TextField)[0];
    await invoke(() => field.props.onChangeText('Keep this input'));
  }
  jest.setSystemTime(new Date(2026, 9, 16, 4, 1));
  await invoke(() => jest.advanceTimersByTime(60000));
  expect(textIncludes('A new loop day has started.')).toBe(true);
  await press(label);
  expect(navigation.goBack).not.toHaveBeenCalled();
  const buttons = Alert.alert.mock.calls[0][2];
  expect(buttons[0].text).toBe('Keep editing');
  expect(buttons[1].text).toBe('Save to 2026-10-15');
  await invoke(() => buttons[1].onPress());
  expect(context.state.days['2026-10-16']).toBeUndefined();
  if (Screen === CheckInScreen) expect(context.state.days['2026-10-15'].priorities[1].title).toBe('Keep this input');
  expect(navigation.goBack).toHaveBeenCalledTimes(1);
});
it('checks the real boundary on submit even before the next clock refresh', async () => {
  await render(ReviewScreen, false);
  await render(ReviewScreen);
  jest.setSystemTime(new Date(2026, 9, 16, 4, 0, 1));
  await press('Update review');
  expect(Alert.alert).toHaveBeenCalled();
  expect(navigation.goBack).not.toHaveBeenCalled();
});
it('keeps a prayer-mode review draft on its pre-Fajr day', async () => {
  const { fajr } = getPrayerTimes('cairo', new Date(2026, 9, 16, 12));
  const stored = JSON.parse(await AsyncStorage.getItem());
  stored.settings.timingMode = 'prayer';
  AsyncStorage.getItem.mockResolvedValue(JSON.stringify(stored));
  jest.setSystemTime(new Date(fajr.getTime() - 60000));
  await render(ReviewScreen, false);
  await render(ReviewScreen);
  jest.setSystemTime(new Date(fajr.getTime() + 60000));
  await press('Update review');
  await invoke(() => Alert.alert.mock.calls[0][2][1].onPress());
  expect(context.state.days['2026-10-16']).toBeUndefined();
  expect(context.state.days['2026-10-15'].review).toBeTruthy();
});
it('uses the suggested duration in the real timer and retains it on screen remount', async () => {
  await render(FocusFlowScreen, false);
  await render(FocusFlowScreen);
  expect(textIncludes('Low energy today?')).toBe(true);
  const duration = tree.root.findAllByType(OptionChips).find(node => node.props.options[0].value === 15);
  await invoke(() => duration.props.onChange(15));
  await press('Start');
  expect(context.timer.endAt - Date.now()).toBe(15 * 60000);
  const session = context.timer.session;
  await render(FocusFlowScreen, false);
  jest.setSystemTime(new Date(2026, 9, 16, 4, 4));
  await render(FocusFlowScreen);
  expect(context.timer.session).toEqual(session);
  expect(textIncludes('10:00')).toBe(true);
  expect(tree.root.findAllByType(OptionChips).some(node => node.props.options[0].value === 15)).toBe(false);
  await press('Pause');
  await render(FocusFlowScreen, false);
  await render(FocusFlowScreen);
  expect(textIncludes('10:00')).toBe(true);
  expect(context.timer.endAt).toBeNull();
});
