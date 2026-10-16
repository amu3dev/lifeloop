import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  useRef
} from 'react';
import { AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { buildDailyContext } from '../contract/dailyContext';
import { getLoopDateKey, shiftDateKey } from '../lib/loopTime';
import { getStreak } from '../lib/streak';
import { STORAGE_KEY, initialState, hydrateState } from '../lib/storage';
import { createTimer } from '../lib/focusTimer';
import {
  EMPTY_DAY,
  updateDay,
  toggleFocusTimer,
  settleFocusTimer,
  resetFocusTimer,
  selectFocusDuration
} from '../lib/loopState';

export const MAX_PRIORITIES = 3;
export const FOCUS_GOAL_MINUTES = 100;

const createId = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;

// Applies `update` to the record of the loop day happening right now.
const updateToday = (prev, update) => updateDay(prev, getLoopDateKey(prev.settings), update);

const updatePriorities = (prev, update) =>
  updateToday(prev, day => ({ ...day, priorities: update(day.priorities) }));

export const AppContext = createContext(null);

export const AppProvider = ({ children }) => {
  const [state, setState] = useState(initialState);
  const [isHydrated, setIsHydrated] = useState(false);
  const [now, setNow] = useState(() => new Date());

  const [storageError, setStorageError] = useState(null);
  const [saveError, setSaveError] = useState(false);
  const [saveAttempt, setSaveAttempt] = useState(0);
  const writeQueue = useRef(Promise.resolve());

  const retryHydration = useCallback(async () => {
    setStorageError(null);
    const result = await hydrateState(AsyncStorage);
    if (result.error) {
      setStorageError(result.error);
      return;
    }
    setState(result.state);
    setIsHydrated(true);
  }, []);

  useEffect(() => { retryHydration(); }, [retryHydration]);

  useEffect(() => {
    if (!isHydrated) return;
    // Serialize writes so an older slow write cannot replace a newer timer/history.
    writeQueue.current = writeQueue.current
      .catch(() => {})
      .then(() => AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state)))
      .then(() => setSaveError(false))
      .catch(() => setSaveError(true));
  }, [state, isHydrated, saveAttempt]);

  const retrySave = useCallback(() => setSaveAttempt(value => value + 1), []);

  const toggleTimer = useCallback(priorityId => {
    const at = Date.now();
    const id = createId();
    setState(prev => toggleFocusTimer(prev, priorityId, at, id));
  }, []);
  const resetTimer = useCallback(() => {
    const at = Date.now();
    const id = createId();
    setState(prev => resetFocusTimer(prev, at, id));
  }, []);
  const selectDuration = useCallback(minutes => setState(prev => selectFocusDuration(prev, minutes)), []);

  // Provider ownership keeps timing and completion alive across screen remounts.
  useEffect(() => {
    if (!isHydrated) return undefined;
    const tick = () => {
      const at = Date.now();
      const id = createId();
      setState(prev => settleFocusTimer(prev, at, id));
    };
    tick();
    const interval = setInterval(tick, 500);
    const subscription = AppState.addEventListener('change', status => {
      if (status === 'active') tick();
    });
    return () => { clearInterval(interval); subscription.remove(); };
  }, [isHydrated]);

  // Keeps "today" correct across the day boundary and when the app returns to the foreground.
  useEffect(() => {
    const intervalId = setInterval(() => setNow(new Date()), 60 * 1000);
    const subscription = AppState.addEventListener('change', status => {
      if (status === 'active') {
        setNow(new Date());
      }
    });

    return () => {
      clearInterval(intervalId);
      subscription.remove();
    };
  }, []);

  const completeOnboarding = useCallback(settings => {
    setState(prev => ({
      ...prev,
      settings: { ...prev.settings, ...settings, onboarded: true }
    }));
  }, []);

  const updateSettings = useCallback(patch => {
    setState(prev => ({ ...prev, settings: { ...prev.settings, ...patch } }));
  }, []);

  // Records the morning check-in and today's top priorities in one step.
  const submitCheckIn = useCallback(({ date, energy, mood, sleep, priorities }) => {
    setState(prev =>
      updateDay(prev, date ?? getLoopDateKey(prev.settings), day => ({
        ...day,
        checkIn: { at: new Date().toISOString(), energy, mood, sleep },
        priorities: priorities.slice(0, MAX_PRIORITIES).map(priority => ({
          id: priority.id ?? createId(),
          title: priority.title,
          effort: priority.effort ?? 'medium',
          source: priority.source ?? 'lifeloop',
          completed: Boolean(priority.completed)
        }))
      }))
    );
  }, []);

  const addPriority = useCallback((title, effort = 'medium') => {
    setState(prev =>
      updatePriorities(prev, priorities =>
        priorities.length >= MAX_PRIORITIES
          ? priorities
          : [
              ...priorities,
              { id: createId(), title, effort, source: 'lifeloop', completed: false }
            ]
      )
    );
  }, []);

  const updatePriority = useCallback((priorityId, updates) => {
    setState(prev =>
      updatePriorities(prev, priorities =>
        priorities.map(priority =>
          priority.id === priorityId ? { ...priority, ...updates } : priority
        )
      )
    );
  }, []);

  const removePriority = useCallback(priorityId => {
    setState(prev =>
      updatePriorities(prev, priorities =>
        priorities.filter(priority => priority.id !== priorityId)
      )
    );
  }, []);

  const togglePriority = useCallback(priorityId => {
    setState(prev =>
      updatePriorities(prev, priorities =>
        priorities.map(priority =>
          priority.id === priorityId
            ? { ...priority, completed: !priority.completed }
            : priority
        )
      )
    );
  }, []);

  // Closes the day; `completedIds`, when given, sets which priorities are done.
  const submitReview = useCallback(({ date, feeling, completedIds }) => {
    setState(prev =>
      updateDay(prev, date ?? getLoopDateKey(prev.settings), day => ({
        ...day,
        priorities: completedIds
          ? day.priorities.map(priority => ({
              ...priority,
              completed: completedIds.includes(priority.id)
            }))
          : day.priorities,
        review: { at: new Date().toISOString(), feeling }
      }))
    );
  }, []);

  const todayKey = getLoopDateKey(state.settings, now);
  const today = { ...EMPTY_DAY, ...state.days[todayKey] };
  const yesterday = state.days[shiftDateKey(todayKey, -1)];

  const derived = useMemo(
    () => ({
      todayKey,
      today,
      dailyContext: buildDailyContext(todayKey, today),
      streak: getStreak(state.days, todayKey),
      // Unfinished priorities from yesterday, offered again at check-in.
      carryOver: (yesterday?.priorities ?? []).filter(priority => !priority.completed)
    }),
    // `today` and `yesterday` are rebuilt from state.days on each render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [state.days, todayKey]
  );

  const value = useMemo(
    () => ({
      state,
      isHydrated,
      storageError,
      retryHydration,
      saveError,
      retrySave,
      timer: state.timer ?? createTimer(),
      now,
      ...derived,
      completeOnboarding,
      updateSettings,
      submitCheckIn,
      addPriority,
      updatePriority,
      removePriority,
      togglePriority,
      toggleTimer,
      resetTimer,
      selectDuration,
      submitReview
    }),
    [
      state,
      isHydrated,
      storageError,
      retryHydration,
      saveError,
      retrySave,
      now,
      derived,
      completeOnboarding,
      updateSettings,
      submitCheckIn,
      addPriority,
      updatePriority,
      removePriority,
      togglePriority,
      toggleTimer,
      resetTimer,
      selectDuration,
      submitReview
    ]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppContext = () => {
  const context = useContext(AppContext);

  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }

  return context;
};
