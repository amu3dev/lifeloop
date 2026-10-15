import { getNextAction } from '../lib/nextAction';

const anchors = {
  checkInAt: new Date(2026, 9, 15, 7, 0),
  reviewAt: new Date(2026, 9, 15, 22, 0),
  checkInLabel: 'at 7:00 AM',
  reviewLabel: 'at 10:00 PM'
};
const midday = new Date(2026, 9, 15, 12, 0);
const night = new Date(2026, 9, 15, 22, 30);
const checkIn = { at: 'morning', energy: 3, mood: 'good', sleep: 'ok' };
const day = overrides => ({ priorities: [], focusSessions: [], ...overrides });

describe('getNextAction', () => {
  it('asks for a check-in first', () => {
    const next = getNextAction({ today: day(), anchors, now: midday });
    expect(next.action.route).toBe('CheckIn');
    expect(next.label).toBe('Start your day');
  });

  it('says when the check-in opens before the start time', () => {
    const next = getNextAction({ today: day(), anchors, now: new Date(2026, 9, 15, 6, 0) });
    expect(next.label).toBe('Check-in opens at 7:00 AM');
  });

  it('points at the first open priority during the day', () => {
    const today = day({
      checkIn,
      priorities: [
        { id: 'a', title: 'Done', completed: true },
        { id: 'b', title: 'Write', completed: false }
      ]
    });
    const next = getNextAction({ today, anchors, now: midday });
    expect(next.title).toBe('Write');
    expect(next.action.route).toBe('FocusFlow');
  });

  it('asks for a priority instead of "Top 3 done" when the list is empty', () => {
    const next = getNextAction({ today: day({ checkIn }), anchors, now: midday });
    expect(next.label).toBe('No priorities yet');
    expect(next.action.route).toBe('CheckIn');
  });

  it('offers the review once everything is done', () => {
    const today = day({ checkIn, priorities: [{ id: 'a', title: 'Done', completed: true }] });
    const next = getNextAction({ today, anchors, now: midday });
    expect(next.label).toBe('Top 3 done');
    expect(next.action.route).toBe('Review');
  });

  it('offers the review at wind-down even with open priorities', () => {
    const today = day({ checkIn, priorities: [{ id: 'a', title: 'Write', completed: false }] });
    const next = getNextAction({ today, anchors, now: night });
    expect(next.label).toBe('Time to wind down');
  });

  it('has no action once the loop is closed', () => {
    const next = getNextAction({ today: day({ checkIn, review: { at: 'x' } }), anchors, now: night });
    expect(next.action).toBeNull();
  });
});
