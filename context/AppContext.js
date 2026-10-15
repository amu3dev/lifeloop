import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState
} from 'react';
import { AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { buildDailyContext } from '../contract/dailyContext';
import { getLoopDateKey, shiftDateKey } from '../lib/loopTime';
import { getStreak } from '../lib/streak';

const STORAGE_KEY = '@lifeloop/loop-state-v1';

export const MAX_PRIORITIES = 3;
export const FOCUS_GOAL_MINUTES = 100;

const initialState = {
  settings: {
    onboarded: false,
    timingMode: 'fixed',
    wakeTime: '07:00',
    windDownTime: '22:00',
    cityId: 'cairo'
  },
  // Day records keyed by loop date (YYYY-MM-DD).
  days: {}
};

const EMPTY_DAY = { priorities: [], focusSessions: [] };

const createId = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;

// Applies `update` to the record of the loop day happening right now.
const updateToday = (prev, update) => {
  const key = getLoopDateKey(prev.settings);
  const day = { ...EMPTY_DAY, ...prev.days[key] };
  return { ...prev, days: { ...prev.days, [key]: update(day) } };
};

const updatePriorities = (prev, update) =>
  updateToday(prev, day => ({ ...day, priorities: update(day.priorities) }));

export const AppContext = createContext(null);

export const AppProvider = ({ children }) => {
  const [state, setState] = useState(initialState);
  const [isHydrated, setIsHydrated] = useState(false);
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const loadState = async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);

        if (stored) {
          const parsed = JSON.parse(stored);

          setState(prev => ({
            settings: { ...prev.settings, ...parsed.settings },
            days: parsed.days ?? {}
          }));
        }
      } catch (error) {
        console.warn('Failed to load loop state', error);
      } finally {
        setIsHydrated(true);
      }
    };

    loadState();
  }, []);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state)).catch(error => {
      console.warn('Failed to persist loop state', error);
    });
  }, [state, isHydrated]);

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
  const submitCheckIn = useCallback(({ energy, mood, sleep, priorities }) => {
    setState(prev =>
      updateToday(prev, day => ({
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

  const completeFocusSession = useCallback(({ minutes, priorityId }) => {
    setState(prev =>
      updateToday(prev, day => ({
        ...day,
        focusSessions: [
          ...day.focusSessions,
          { at: new Date().toISOString(), minutes, priorityId: priorityId ?? null }
        ]
      }))
    );
  }, []);

  const submitReview = useCallback(({ feeling }) => {
    setState(prev =>
      updateToday(prev, day => ({
        ...day,
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
      now,
      ...derived,
      completeOnboarding,
      updateSettings,
      submitCheckIn,
      addPriority,
      updatePriority,
      removePriority,
      togglePriority,
      completeFocusSession,
      submitReview
    }),
    [
      state,
      isHydrated,
      now,
      derived,
      completeOnboarding,
      updateSettings,
      submitCheckIn,
      addPriority,
      updatePriority,
      removePriority,
      togglePriority,
      completeFocusSession,
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
