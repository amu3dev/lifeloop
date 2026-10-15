import { CalculationMethod, Coordinates, PrayerTimes } from 'adhan';
import { getCity } from './cities';

// Late nights before this hour still belong to the previous loop day.
const FIXED_DAY_BOUNDARY_HOUR = 4;

const pad = value => value.toString().padStart(2, '0');

export const toDateKey = date =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

export const fromDateKey = key => {
  const [year, month, day] = key.split('-').map(Number);
  return new Date(year, month - 1, day);
};

export const shiftDateKey = (key, days) => {
  const date = fromDateKey(key);
  date.setDate(date.getDate() + days);
  return toDateKey(date);
};

const toMinutes = time => {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
};

// Minutes since the 04:00 boundary, so 00:30 sorts after 22:00 within one loop day.
export const minutesIntoLoopDay = time =>
  (toMinutes(time) - FIXED_DAY_BOUNDARY_HOUR * 60 + 1440) % 1440;

// The day must start before it winds down, both inside the same 04:00-to-04:00 loop day.
export const isValidFixedWindow = (wakeTime, windDownTime) =>
  minutesIntoLoopDay(wakeTime) < minutesIntoLoopDay(windDownTime);

// Parses "HH:MM" into a Date on the given calendar day.
const atTime = (date, time) => {
  const [hours, minutes] = time.split(':').map(Number);
  const result = new Date(date);
  result.setHours(hours, minutes, 0, 0);
  return result;
};

// Like atTime, but times before the 04:00 boundary belong to the next calendar day.
const atLoopTime = (date, time) => {
  const result = atTime(date, time);
  if (toMinutes(time) < FIXED_DAY_BOUNDARY_HOUR * 60) {
    result.setDate(result.getDate() + 1);
  }
  return result;
};

export const getPrayerTimes = (cityId, date) => {
  const city = getCity(cityId);
  const params = CalculationMethod[city.method]();
  return new PrayerTimes(new Coordinates(city.latitude, city.longitude), date, params);
};

// The loop day `now` belongs to: before the boundary (04:00 or Fajr) it is still yesterday.
export const getLoopDateKey = (settings, now = new Date()) => {
  const boundary =
    settings?.timingMode === 'prayer'
      ? getPrayerTimes(settings.cityId, now).fajr
      : atTime(now, `${pad(FIXED_DAY_BOUNDARY_HOUR)}:00`);

  if (now < boundary) {
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    return toDateKey(yesterday);
  }

  return toDateKey(now);
};

/**
 * When the check-in and review nudges start for a loop day.
 * @returns {{ checkInAt: Date, reviewAt: Date, checkInLabel: string, reviewLabel: string }}
 */
export const getLoopAnchors = (settings, dateKey) => {
  const date = fromDateKey(dateKey);

  if (settings?.timingMode === 'prayer') {
    const times = getPrayerTimes(settings.cityId, date);
    return {
      checkInAt: times.fajr,
      reviewAt: times.isha,
      checkInLabel: `after Fajr (${formatTime(times.fajr)})`,
      reviewLabel: `after Isha (${formatTime(times.isha)})`
    };
  }

  const checkInAt = atLoopTime(date, settings?.wakeTime ?? '07:00');
  const reviewAt = atLoopTime(date, settings?.windDownTime ?? '22:00');
  return {
    checkInAt,
    reviewAt,
    checkInLabel: `at ${formatTime(checkInAt)}`,
    reviewLabel: `at ${formatTime(reviewAt)}`
  };
};

export const formatTime = date =>
  date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });

// Shifts an "HH:MM" string by a number of minutes, wrapping around midnight.
export const shiftTime = (time, minutes) => {
  const [hours, mins] = time.split(':').map(Number);
  const total = (((hours * 60 + mins + minutes) % 1440) + 1440) % 1440;
  return `${pad(Math.floor(total / 60))}:${pad(total % 60)}`;
};

export const formatClock = time => formatTime(atTime(new Date(), time));
