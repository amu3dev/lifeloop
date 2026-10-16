import {
  validateDailyContext,
  buildDailyContext,
  isCalendarDate,
  ENERGY_LEVELS,
  MOODS,
  SLEEP_LEVELS,
  EFFORTS
} from '../contract/dailyContext';
import { isValidTimer } from './focusTimer';

export const STORAGE_KEY = '@lifeloop/loop-state-v1';
export const initialState = {
  settings: {
    onboarded: false,
    timingMode: 'fixed',
    wakeTime: '07:00',
    windDownTime: '22:00',
    cityId: 'cairo'
  },
  days: {}
};
const isObject = value => value !== null && typeof value === 'object' && !Array.isArray(value);

// Reject unsafe records instead of normalizing them away and overwriting the original.
export const decodeState = raw => {
  if (raw === null) return initialState;
  const parsed = JSON.parse(raw);
  if (!isObject(parsed) || !isObject(parsed.settings) || !isObject(parsed.days)) {
    throw new Error('Invalid saved state');
  }
  const settings = { ...initialState.settings, ...parsed.settings };
  const validTimes = ['wakeTime', 'windDownTime'].every(key =>
    typeof settings[key] === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(settings[key])
  );
  if (!['fixed', 'prayer'].includes(settings.timingMode) ||
      typeof settings.onboarded !== 'boolean' || !validTimes ||
      typeof settings.cityId !== 'string') {
    throw new Error('Invalid settings');
  }
  for (const [date, day] of Object.entries(parsed.days)) {
    if (!isCalendarDate(date) || !isObject(day)) throw new Error('Invalid day record');
    if (day.priorities !== undefined && (
      !Array.isArray(day.priorities) || day.priorities.some(priority =>
        !isObject(priority) ||
        (priority.effort !== undefined && !EFFORTS.includes(priority.effort)) ||
        (priority.completed !== undefined && typeof priority.completed !== 'boolean')
      )
    )) throw new Error('Invalid priorities');
    if (day.focusSessions !== undefined && (
      !Array.isArray(day.focusSessions) || day.focusSessions.some(session =>
        !isObject(session) || !Number.isFinite(session.minutes) || session.minutes < 0
      )
    )) throw new Error('Invalid focus sessions');
    if (day.checkIn !== undefined && (
      !isObject(day.checkIn) || typeof day.checkIn.at !== 'string' ||
      !ENERGY_LEVELS.includes(day.checkIn.energy) || !MOODS.includes(day.checkIn.mood) ||
      !SLEEP_LEVELS.includes(day.checkIn.sleep)
    )) throw new Error('Invalid check-in');
    if (day.review !== undefined && (
      !isObject(day.review) || typeof day.review.at !== 'string' || !MOODS.includes(day.review.feeling)
    )) throw new Error('Invalid review');
    if (validateDailyContext(buildDailyContext(date, day)).length) throw new Error('Invalid day context');
  }
  if (parsed.timer !== undefined && (
    !isValidTimer(parsed.timer) ||
    (parsed.timer.session && !isCalendarDate(parsed.timer.session.date))
  )) throw new Error('Invalid saved timer');
  return { ...parsed, settings };
};

// A failed read/parse never enables writes. The raw value remains in AsyncStorage.
export const hydrateState = async storage => {
  try {
    return { state: decodeState(await storage.getItem(STORAGE_KEY)), error: null };
  } catch {
    return {
      state: null,
      error: 'LifeLoop could not safely read your saved data. Your stored data has been left untouched. Try again to reload it.'
    };
  }
};
