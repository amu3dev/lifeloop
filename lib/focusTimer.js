// Pomodoro timer driven by wall-clock timestamps, so it stays correct while the
// app is in the background and JS timers are paused.

export const FOCUS_DURATION = 25 * 60;
export const BREAK_DURATION = 5 * 60;

const durationOf = phase => (phase === 'focus' ? FOCUS_DURATION : BREAK_DURATION);

/**
 * @typedef {Object} TimerState
 * @property {'focus'|'break'} phase
 * @property {number|null} endAt ms timestamp when the running phase ends; null when paused
 * @property {number} pausedRemaining seconds left while paused
 */

/** @returns {TimerState} */
export const createTimer = () => ({
  phase: 'focus',
  endAt: null,
  pausedRemaining: FOCUS_DURATION
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
  const nextEndAt = timer.endAt + durationOf(nextPhase) * 1000;

  if (nextEndAt > nowMs) {
    return {
      timer: { phase: nextPhase, endAt: nextEndAt, pausedRemaining: durationOf(nextPhase) },
      completedFocus
    };
  }

  return { timer: createTimer(), completedFocus };
};

export const getPhaseDuration = timer => durationOf(timer.phase);
