import { shiftDateKey } from './loopTime';

export const isClosed = day => Boolean(day?.checkIn && day?.review);

// Counts consecutive closed loops, starting today if it is closed, else yesterday.
export const getStreak = (days, todayKey) => {
  let key = isClosed(days[todayKey]) ? todayKey : shiftDateKey(todayKey, -1);
  let streak = 0;

  while (isClosed(days[key])) {
    streak += 1;
    key = shiftDateKey(key, -1);
  }

  return streak;
};
