import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@lifeloop/app-context';

const initialState = {
  points: 0,
  streaks: 0,
  todayMood: '',
  focusSessionsToday: 0,
  walletHistory: [],
  todos: []
};

export const AppContext = createContext(null);

export const AppProvider = ({ children }) => {
  const [state, setState] = useState(initialState);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    const loadState = async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);

        if (stored) {
          const parsed = JSON.parse(stored);

          setState(prev => ({
            ...prev,
            ...parsed
          }));
        }
      } catch (error) {
        console.warn('Failed to load app state', error);
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
      console.warn('Failed to persist app state', error);
    });
  }, [state, isHydrated]);

  // Adds points to the running total so modules can reward daily actions.
  const addPoints = useCallback(amount => {
    const safeAmount = Number.isFinite(amount) ? amount : 0;

    setState(prev => ({
      ...prev,
      points: prev.points + safeAmount
    }));
  }, []);

  // Resets daily progress and advances the streak to acknowledge completion.
  const resetDay = useCallback(() => {
    setState(prev => ({
      ...prev,
      points: 0,
      streaks: prev.streaks + 1,
      todayMood: '',
      focusSessionsToday: 0,
      todos: prev.todos.map(todo => ({
        ...todo,
        completed: false
      }))
    }));
  }, []);

  // Rewards a finished focus block and counts it toward today's goal.
  const completeFocusSession = useCallback(() => {
    setState(prev => ({
      ...prev,
      points: prev.points + 5,
      focusSessionsToday: (prev.focusSessionsToday ?? 0) + 1
    }));
  }, []);

  // Appends a new record to the wallet history for smart-wallet insights.
  const addWalletEntry = useCallback(entry => {
    const nextEntry = entry ?? {};

    setState(prev => ({
      ...prev,
      walletHistory: [nextEntry, ...prev.walletHistory]
    }));
  }, []);

  // Adds a todo item so focus-flow can track upcoming tasks.
  const addTodo = useCallback(todo => {
    if (!todo) {
      return;
    }

    const normalizedTodo =
      typeof todo === 'string'
        ? { id: Date.now().toString(), title: todo, completed: false }
        : {
            id: todo.id ?? Date.now().toString(),
            title: todo.title ?? '',
            completed: Boolean(todo.completed)
          };

    setState(prev => ({
      ...prev,
      todos: [...prev.todos, normalizedTodo]
    }));
  }, []);

  // Updates an existing todo item, enabling rename or status adjustments.
  const updateTodo = useCallback((todoId, updates) => {
    if (!todoId || !updates) {
      return;
    }

    setState(prev => ({
      ...prev,
      todos: prev.todos.map(todo =>
        todo.id === todoId
          ? {
              ...todo,
              ...updates
            }
          : todo
      )
    }));
  }, []);

  // Removes a todo item so the list supports full CRUD interactions.
  const removeTodo = useCallback(todoId => {
    if (!todoId) {
      return;
    }

    setState(prev => ({
      ...prev,
      todos: prev.todos.filter(todo => todo.id !== todoId)
    }));
  }, []);

  // Toggles completion status for a tracked todo item.
  const toggleTodo = useCallback(todoId => {
    if (!todoId) {
      return;
    }

    setState(prev => ({
      ...prev,
      todos: prev.todos.map(todo =>
        todo.id === todoId
          ? {
              ...todo,
              completed: !todo.completed
            }
          : todo
      )
    }));
  }, []);

  // Updates the stored mood so the UI mirrors the latest self-report.
  const setMood = useCallback(mood => {
    const nextMood = typeof mood === 'string' ? mood : '';

    setState(prev => ({
      ...prev,
      todayMood: nextMood
    }));
  }, []);

  const value = useMemo(
    () => ({
      state,
      isHydrated,
      addPoints,
      resetDay,
      completeFocusSession,
      addWalletEntry,
      addTodo,
      updateTodo,
      removeTodo,
      toggleTodo,
      setMood
    }),
    [
      state,
      isHydrated,
      addPoints,
      resetDay,
      completeFocusSession,
      addWalletEntry,
      addTodo,
      updateTodo,
      removeTodo,
      toggleTodo,
      setMood
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
