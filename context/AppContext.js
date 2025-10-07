import React, { createContext, useMemo, useState } from 'react';

// Defines the shape of the global data shared across modules.
const initialState = {
  userName: 'LifeLoop Explorer',
  moodLevel: 'balanced',
  walletBalance: 1200,
  focusMinutesToday: 35
};

// Creates the context object that other components can consume.
export const AppContext = createContext({
  state: initialState,
  setState: () => undefined
});

// Provides the context value and exposes setters for updates.
export const AppProvider = ({ children }) => {
  const [state, setState] = useState(initialState);

  // Memoizes the provider value to avoid unnecessary re-renders.
  const value = useMemo(() => ({ state, setState }), [state]);

  // Wraps children with the context so any module can access global data.
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};
