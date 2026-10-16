import { shiftDateKey } from './loopTime';
import { buildDailyContext } from '../contract/dailyContext';

export const getSevenDayHistory = (days, todayKey) =>
  Array.from({ length: 7 }, (_, offset) => {
    const date = shiftDateKey(todayKey, -offset);
    const day = days[date];
    return {
      date,
      hasRecord: Boolean(day),
      checkedIn: Boolean(day?.checkIn),
      reviewed: Boolean(day?.review),
      completedPriorities: day ? (day.priorities ?? []).filter(priority => priority.completed).length : null,
      focusMinutes: day ? buildDailyContext(date, day).focusMinutes : null,
      energy: day?.checkIn?.energy ?? null
    };
  });
