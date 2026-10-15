import React, { useEffect, useRef, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StatusBar } from 'expo-status-bar';
import { MaterialIcons } from '@expo/vector-icons';

// Shared context and components.
import { AppProvider, useAppContext } from './context/AppContext';
import HomeScreen from './screens/HomeScreen';
import OnboardingScreen from './screens/OnboardingScreen';
import CheckInScreen from './screens/CheckInScreen';
import ReviewScreen from './screens/ReviewScreen';
import SettingsScreen from './screens/SettingsScreen';
import FocusFlowScreen from './modules/focus-flow/FocusFlowScreen';
import BottomNav from './components/shared/BottomNav';
import { colors, fontSize, moduleThemes, spacing } from './theme/theme';

// Configures navigation primitives for the app shell.
const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();
const LAST_TAB_KEY = 'lifeloop:last-tab';
const TAB_NAMES = ['Home', 'FocusFlow'];

// Resolves the active route name from nested navigation state.
const getActiveRouteName = (state) => {
  if (!state || !state.routes || typeof state.index !== 'number') {
    return undefined;
  }
  const route = state.routes[state.index];
  if (route.state) {
    return getActiveRouteName(route.state);
  }
  return route.name;
};

// Renders the two tabs: today's loop and the focus timer.
const ModuleTabs = ({ initialRouteName }) => (
  <Tab.Navigator
    initialRouteName={initialRouteName}
    tabBar={(props) => <BottomNav {...props} />}
    screenOptions={({ route }) => ({
      headerShown: false,
      tabBarActiveTintColor: colors.ink,
      tabBarInactiveTintColor: colors.inkSubtle,
      tabBarStyle: { backgroundColor: colors.surface, borderTopWidth: 0, elevation: 0 },
      tabBarIcon: ({ color, size }) => {
        const iconMap = {
          Home: 'wb-sunny',
          FocusFlow: 'hourglass-empty'
        };
        return <MaterialIcons name={iconMap[route.name]} size={size} color={color} />;
      }
    })}>
    <Tab.Screen name="Home" component={HomeScreen} options={{ title: 'Today' }} />
    <Tab.Screen name="FocusFlow" component={FocusFlowScreen} options={{ title: 'Focus' }} />
  </Tab.Navigator>
);

// Coordinates persistence of the last visited tab using AsyncStorage.
const AppNavigation = () => {
  const { isHydrated, state } = useAppContext();
  const [initialTab, setInitialTab] = useState('Home');
  const [isBootstrapped, setIsBootstrapped] = useState(false);
  // A user who onboards in this launch starts on Today, not a tab saved by an older version.
  const onboardedAtLaunch = useRef(null);
  if (isHydrated && onboardedAtLaunch.current === null) {
    onboardedAtLaunch.current = state.settings.onboarded;
  }

  useEffect(() => {
    const loadLastTab = async () => {
      try {
        const savedTab = await AsyncStorage.getItem(LAST_TAB_KEY);
        // Ignores tabs that no longer exist and non-tab routes such as CheckIn.
        if (TAB_NAMES.includes(savedTab)) {
          setInitialTab(savedTab);
        }
      } finally {
        setIsBootstrapped(true);
      }
    };
    loadLastTab();
  }, []);

  const handleStateChange = async (state) => {
    const currentRoute = getActiveRouteName(state);
    if (TAB_NAMES.includes(currentRoute)) {
      await AsyncStorage.setItem(LAST_TAB_KEY, currentRoute);
    }
  };

  // Holds the UI until saved state loads so early actions are not overwritten.
  if (!isBootstrapped || !isHydrated) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color={moduleThemes.FocusFlow.accent} />
        <Text style={styles.loaderText}>Preparing LifeLoop...</Text>
      </View>
    );
  }

  return (
    <NavigationContainer onStateChange={handleStateChange}>
      <StatusBar style="dark" />
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {state.settings.onboarded ? (
          <>
            <Stack.Screen name="LifeLoopTabs">
              {() => (
                <ModuleTabs initialRouteName={onboardedAtLaunch.current ? initialTab : 'Home'} />
              )}
            </Stack.Screen>
            <Stack.Group screenOptions={{ presentation: 'modal' }}>
              <Stack.Screen name="CheckIn" component={CheckInScreen} />
              <Stack.Screen name="Review" component={ReviewScreen} />
              <Stack.Screen name="Settings" component={SettingsScreen} />
            </Stack.Group>
          </>
        ) : (
          <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

// Sets up the context provider so every screen can consume global state.
const App = () => {
  return (
    <AppProvider>
      <AppNavigation />
    </AppProvider>
  );
};

// Establishes fallback styles for the loading gate.
const styles = StyleSheet.create({
  loaderContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background
  },
  loaderText: {
    marginTop: spacing.md,
    color: colors.inkMuted,
    fontSize: fontSize.body
  }
});

export default App;
