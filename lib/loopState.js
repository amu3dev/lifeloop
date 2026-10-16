import { getLoopDateKey } from './loopTime';
import { advanceTimer, createTimer, isTimerRunning, getRemainingSeconds, pauseTimer, startTimer } from './focusTimer';

export const EMPTY_DAY = { priorities: [], focusSessions: [] };
export const updateDay = (state, date, update) => ({
  ...state,
  days: { ...state.days, [date]: update({ ...EMPTY_DAY, ...state.days[date] }) }
});

// Timer advancement and completion history are one persisted state transition.
export const settleFocusTimer = (state, nowMs, nextId) => {
  const timer = state.timer;
  if (!timer || !isTimerRunning(timer) || getRemainingSeconds(timer, nowMs) > 0) return state;
  const result = advanceTimer(timer, nowMs);
  let next = state;
  if (result.completedFocus && timer.session) {
    const session = timer.session;
    next = updateDay(next, session.date, day => ({
      ...day,
      focusSessions: day.focusSessions.some(record => record.id === session.id)
        ? day.focusSessions
        : [...day.focusSessions, {
            id: session.id, at: new Date(timer.endAt).toISOString(),
            minutes: timer.focusDuration / 60, priorityId: session.priorityId,
            priorityTitle: session.priorityTitle ?? null
          }]
    }));
    // Retain the chosen target through the break for the next Pomodoro.
    if (result.timer.phase === 'break') result.timer.session = session;
  }
  // The existing Pomodoro starts a focus block after a break. Bind it at that
  // boundary, even when restoring later; never borrow the new day's selection.
  if (result.timer.phase === 'focus' && isTimerRunning(result.timer)) {
    const date = getLoopDateKey(state.settings, new Date(timer.endAt));
    const priorities = state.days[date]?.priorities ?? [];
    const priority = priorities.find(item => item.id === timer.session?.priorityId && !item.completed)
      ?? priorities.find(item => !item.completed);
    result.timer.session = { id: nextId, date, priorityId: priority?.id ?? null, priorityTitle: priority?.title ?? null };
  }
  return { ...next, timer: result.timer };
};

export const toggleFocusTimer = (state, priorityId, nowMs, id) => {
  const settled = settleFocusTimer(state, nowMs, id);
  // A tap on an expired phase settles it; it must not pause/reset the new phase.
  if (settled !== state) return settled;
  let timer = state.timer ?? createTimer();
  if (isTimerRunning(timer)) return { ...state, timer: pauseTimer(timer, nowMs) };
  if (timer.phase === 'focus' && !timer.session) {
    const date = getLoopDateKey(state.settings, new Date(nowMs));
    const priority = state.days[date]?.priorities?.find(item => item.id === priorityId);
    timer = { ...timer, session: { id, date, priorityId: priorityId ?? null, priorityTitle: priority?.title ?? null } };
  }
  return { ...state, timer: startTimer(timer, nowMs) };
};

export const resetFocusTimer = (state, nowMs, id) => {
  const settled = settleFocusTimer(state, nowMs, id);
  return { ...settled, timer: createTimer(settled.timer?.focusDuration) };
};

export const selectFocusDuration = (state, minutes) => {
  const timer = state.timer ?? createTimer();
  if (![15, 25].includes(minutes) || timer.session || timer.phase !== 'focus' || isTimerRunning(timer)) return state;
  return { ...state, timer: createTimer(minutes * 60) };
};
