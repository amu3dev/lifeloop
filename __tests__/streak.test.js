import { getStreak } from '../lib/streak';

const closed = { checkIn: { at: 'morning' }, review: { at: 'evening' } };
const checkedInOnly = { checkIn: { at: 'morning' } };

describe('getStreak', () => {
  it('counts from yesterday while today is still open', () => {
    const days = { '2026-10-13': closed, '2026-10-14': closed, '2026-10-15': checkedInOnly };
    expect(getStreak(days, '2026-10-15')).toBe(2);
  });

  it('includes today once it is closed', () => {
    const days = { '2026-10-13': closed, '2026-10-14': closed, '2026-10-15': closed };
    expect(getStreak(days, '2026-10-15')).toBe(3);
  });

  it('breaks on a missed day', () => {
    expect(getStreak({ '2026-10-13': closed }, '2026-10-15')).toBe(0);
  });

  it('does not count a review without a check-in', () => {
    const days = { '2026-10-14': { review: { at: 'evening' } } };
    expect(getStreak(days, '2026-10-15')).toBe(0);
  });
});
