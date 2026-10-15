import {
  SCHEMA_VERSION,
  buildDailyContext,
  deriveDayLoad,
  validateDailyContext
} from '../contract/dailyContext';

describe('deriveDayLoad', () => {
  it('maps total effort to light, normal and heavy', () => {
    expect(deriveDayLoad([])).toBeUndefined();
    expect(deriveDayLoad([{ effort: 'small' }, { effort: 'small' }])).toBe('light');
    expect(deriveDayLoad([{ effort: 'medium' }, { effort: 'medium' }])).toBe('normal');
    expect(
      deriveDayLoad([{ effort: 'large' }, { effort: 'large' }, { effort: 'medium' }])
    ).toBe('heavy');
  });
});

describe('buildDailyContext', () => {
  const day = {
    checkIn: { at: '2026-10-15T05:40:00.000Z', energy: 2, mood: 'low', sleep: 'poor' },
    priorities: [{ id: 'p1', title: 'Ship', effort: 'large', completed: true }],
    focusSessions: [{ minutes: 25 }, { minutes: 25 }],
    review: { at: '2026-10-15T18:00:00.000Z', feeling: 'good' }
  };

  it('produces a valid context from a full day', () => {
    const context = buildDailyContext('2026-10-15', day);

    expect(validateDailyContext(context)).toEqual([]);
    expect(context).toEqual({
      schemaVersion: SCHEMA_VERSION,
      date: '2026-10-15',
      checkedInAt: day.checkIn.at,
      energy: 2,
      mood: 'low',
      sleep: 'poor',
      dayLoad: 'light',
      topPriorities: [{ id: 'p1', title: 'Ship', source: 'lifeloop' }],
      focusMinutes: 50,
      reviewedAt: day.review.at
    });
  });

  it('produces a valid context for an empty day', () => {
    const context = buildDailyContext('2026-10-15');
    expect(validateDailyContext(context)).toEqual([]);
    expect(context.focusMinutes).toBe(0);
  });
});

describe('validateDailyContext', () => {
  it('reports out-of-range values', () => {
    const context = buildDailyContext('2026-10-15');
    expect(validateDailyContext({ ...context, energy: 9 })).toEqual(['energy must be 1-5']);
    expect(validateDailyContext({ ...context, date: '15/10/2026' })).toEqual([
      'date must be YYYY-MM-DD'
    ]);
    expect(validateDailyContext(null)).toEqual(['context must be an object']);
  });
});
