import {
  BREAK_DURATION,
  FOCUS_DURATION,
  advanceTimer,
  createTimer,
  getRemainingSeconds,
  pauseTimer,
  startTimer
} from '../lib/focusTimer';

const MINUTE = 60 * 1000;
const T0 = new Date(2026, 9, 15, 9, 0).getTime();

describe('focus timer', () => {
  it('counts down from wall-clock time, so a locked screen does not slow it', () => {
    const timer = startTimer(createTimer(), T0);
    expect(getRemainingSeconds(timer, T0)).toBe(FOCUS_DURATION);
    expect(getRemainingSeconds(timer, T0 + 10 * MINUTE)).toBe(15 * 60);
    expect(getRemainingSeconds(timer, T0 + 40 * MINUTE)).toBe(0);
  });

  it('keeps the remaining time across pause and resume', () => {
    const paused = pauseTimer(startTimer(createTimer(), T0), T0 + 5 * MINUTE);
    expect(getRemainingSeconds(paused, T0 + 60 * MINUTE)).toBe(20 * 60);

    const resumed = startTimer(paused, T0 + 60 * MINUTE);
    expect(getRemainingSeconds(resumed, T0 + 70 * MINUTE)).toBe(10 * 60);
  });

  it('moves from focus to a break timed from when focus ended', () => {
    const timer = startTimer(createTimer(), T0);
    const { timer: next, completedFocus } = advanceTimer(timer, T0 + 26 * MINUTE);

    expect(completedFocus).toBe(true);
    expect(next.phase).toBe('break');
    expect(getRemainingSeconds(next, T0 + 26 * MINUTE)).toBe(BREAK_DURATION - 60);
  });

  it('logs one focus block and stops when the break also ended in the background', () => {
    const timer = startTimer(createTimer(), T0);
    const { timer: next, completedFocus } = advanceTimer(timer, T0 + 2 * 60 * MINUTE);

    expect(completedFocus).toBe(true);
    expect(next).toEqual(createTimer());
  });

  it('starts the next focus block after a break without counting a session', () => {
    const breakTimer = { phase: 'break', endAt: T0, pausedRemaining: BREAK_DURATION };
    const { timer: next, completedFocus } = advanceTimer(breakTimer, T0 + 1000);

    expect(completedFocus).toBe(false);
    expect(next.phase).toBe('focus');
    expect(next.endAt).toBe(T0 + FOCUS_DURATION * 1000);
  });
});
