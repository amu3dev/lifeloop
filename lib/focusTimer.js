// Pomodoro timer driven by wall-clock timestamps, so it stays correct while the
// app is in the background and JS timers are paused.

export const FOCUS_DURATION = 25 * 60;
export const BREAK_DURATION = 5 * 60;

const durationOf = (phase, focusDuration = FOCUS_DURATION) => (phase === 'focus' ? focusDuration : BREAK_DURATION);

/**
 * @typedef {Object} TimerState
 * @property {'focus'|'break'} phase
 * @property {number|null} endAt ms timestamp when the running phase ends; null when paused
 * @property {number} pausedRemaining seconds left while paused
 * @property {number} focusDuration selected focus duration in seconds
 * @property {{id: string, date: string, priorityId: string|null, priorityTitle: string|null}} [session] owning block
 */

/** @returns {TimerState} */
export const createTimer = (focusDuration = FOCUS_DURATION) => ({
  phase: 'focus',
  endAt: null,
  pausedRemaining: focusDuration,
  focusDuration
});

export const isTimerRunning = timer => timer.endAt !== null;

export const getRemainingSeconds = (timer, nowMs) =>
  isTimerRunning(timer)
    ? Math.max(0, Math.ceil((timer.endAt - nowMs) / 1000))
    : timer.pausedRemaining;

export const startTimer = (timer, nowMs) => ({
  ...timer,
  endAt: nowMs + timer.pausedRemaining * 1000
});

export const pauseTimer = (timer, nowMs) => ({
  ...timer,
  endAt: null,
  pausedRemaining: getRemainingSeconds(timer, nowMs)
});

/**
 * Moves past a phase that has ended. The next phase is timed from when the
 * previous one actually ended. If that next phase has also already ended (the
 * app was in the background), the timer stops at a fresh focus block instead
 * of counting focus time nobody saw.
 * @returns {{ timer: TimerState, completedFocus: boolean }}
 */
export const advanceTimer = (timer, nowMs) => {
  const completedFocus = timer.phase === 'focus';
  const nextPhase = completedFocus ? 'break' : 'focus';
  const nextEndAt = timer.endAt + durationOf(nextPhase, timer.focusDuration) * 1000;

  if (nextEndAt > nowMs) {
    return {
      timer: { phase: nextPhase, endAt: nextEndAt, pausedRemaining: durationOf(nextPhase, timer.focusDuration), focusDuration: timer.focusDuration ?? FOCUS_DURATION },
      completedFocus
    };
  }

  return { timer: createTimer(timer.focusDuration), completedFocus };
};

export const getPhaseDuration = timer => durationOf(timer.phase, timer.focusDuration);

// Only these two user-selected focus durations are supported; the break remains five minutes.
export const getSuggestedFocusMinutes = checkIn =>
  checkIn?.energy >= 1 && checkIn.energy <= 2 ? 15 : 25;

export const isValidTimer = timer => Boolean(
  timer && ['focus', 'break'].includes(timer.phase) &&
  [15 * 60, FOCUS_DURATION].includes(timer.focusDuration) &&
  (timer.endAt === null || (Number.isFinite(timer.endAt) && timer.endAt >= 0 && Number.isFinite(new Date(timer.endAt).getTime()))) &&
  Number.isFinite(timer.pausedRemaining) && timer.pausedRemaining >= 0 &&
  timer.pausedRemaining <= getPhaseDuration(timer) &&
  (timer.session === undefined || (timer.session &&
    typeof timer.session.id === 'string' && timer.session.id.length > 0 &&
    /^\d{4}-\d{2}-\d{2}$/.test(timer.session.date) &&
    (timer.session.priorityId === null || typeof timer.session.priorityId === 'string') &&
    (timer.session.priorityTitle == null || typeof timer.session.priorityTitle === 'string'))) &&
  (!(timer.endAt !== null || timer.pausedRemaining < getPhaseDuration(timer)) ||
    timer.phase !== 'focus' || timer.session)
);
