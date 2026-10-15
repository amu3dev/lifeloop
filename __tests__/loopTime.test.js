import {
  getLoopAnchors,
  getLoopDateKey,
  getPrayerTimes,
  isValidFixedWindow,
  shiftDateKey,
  shiftTime
} from '../lib/loopTime';

// `npm test` runs with TZ=Africa/Cairo so prayer times line up with the device clock.
const fixed = { timingMode: 'fixed', wakeTime: '07:00', windDownTime: '22:00' };
const prayer = { timingMode: 'prayer', cityId: 'cairo' };

describe('getLoopDateKey', () => {
  it('keeps late nights before 04:00 on the previous day in fixed mode', () => {
    expect(getLoopDateKey(fixed, new Date(2026, 9, 15, 3, 59))).toBe('2026-10-14');
    expect(getLoopDateKey(fixed, new Date(2026, 9, 15, 4, 0))).toBe('2026-10-15');
    expect(getLoopDateKey(fixed, new Date(2026, 9, 15, 23, 30))).toBe('2026-10-15');
  });

  it('starts the day at Fajr in prayer mode', () => {
    const { fajr } = getPrayerTimes('cairo', new Date(2026, 9, 15, 12));
    expect(getLoopDateKey(prayer, new Date(fajr.getTime() - 60 * 1000))).toBe('2026-10-14');
    expect(getLoopDateKey(prayer, new Date(fajr.getTime() + 60 * 1000))).toBe('2026-10-15');
  });
});

describe('getLoopAnchors', () => {
  it('uses Fajr and Isha in prayer mode', () => {
    const anchors = getLoopAnchors(prayer, '2026-10-15');
    expect(anchors.checkInAt < anchors.reviewAt).toBe(true);
    expect(anchors.checkInLabel).toMatch(/^after Fajr/);
    expect(anchors.reviewLabel).toMatch(/^after Isha/);
  });

  it('places a wind-down after midnight on the next calendar day', () => {
    const anchors = getLoopAnchors({ ...fixed, windDownTime: '00:30' }, '2026-10-15');
    expect(anchors.reviewAt).toEqual(new Date(2026, 9, 16, 0, 30));
    expect(anchors.checkInAt).toEqual(new Date(2026, 9, 15, 7, 0));
  });
});

describe('isValidFixedWindow', () => {
  it('accepts a normal day and a late night wind-down', () => {
    expect(isValidFixedWindow('07:00', '22:00')).toBe(true);
    expect(isValidFixedWindow('09:00', '01:30')).toBe(true);
  });

  it('rejects a wind-down before the start of the day', () => {
    expect(isValidFixedWindow('22:00', '07:00')).toBe(false);
    expect(isValidFixedWindow('08:00', '08:00')).toBe(false);
    expect(isValidFixedWindow('03:00', '22:00')).toBe(false); // 03:00 belongs to the previous day
  });
});

describe('date and time helpers', () => {
  it('shifts date keys across month ends', () => {
    expect(shiftDateKey('2026-03-01', -1)).toBe('2026-02-28');
    expect(shiftDateKey('2026-12-31', 1)).toBe('2027-01-01');
  });

  it('wraps times around midnight', () => {
    expect(shiftTime('23:30', 60)).toBe('00:30');
    expect(shiftTime('00:15', -30)).toBe('23:45');
  });
});
