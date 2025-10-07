import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StatusBar } from 'expo-status-bar';
import { MaterialIcons } from '@expo/vector-icons';

// Shared context and components.
import { AppProvider } from './context/AppContext';
import HomeScreen from './screens/HomeScreen';
import MindGymScreen from './modules/mind-gym/MindGymScreen';
import MealMoodScreen from './modules/meal-mood/MealMoodScreen';
import SmartWalletScreen from './modules/smart-wallet/SmartWalletScreen';
import FocusFlowScreen from './modules/focus-flow/FocusFlowScreen';
import BottomNav from './components/shared/BottomNav';

// Configures navigation primitives for the app shell.
const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();
const LAST_TAB_KEY = 'lifeloop:last-tab';

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

// Renders the bottom tab navigator with four modules and iconography.
const ModuleTabs = ({ initialRouteName }) => (
  <Tab.Navigator
    initialRouteName={initialRouteName}
    tabBar={(props) => <BottomNav {...props} />}
    screenOptions={({ route }) => ({
      headerShown: false,
      tabBarActiveTintColor: '#38bdf8',
      tabBarInactiveTintColor: '#94a3b8',
      tabBarStyle: { backgroundColor: '#0f172a', borderTopWidth: 0 },
      tabBarIcon: ({ color, size }) => {
        const iconMap = {
          Home: 'dashboard',
          MindGym: 'psychology',
          MealMood: 'restaurant-menu',
          SmartWallet: 'savings',
          FocusFlow: 'timer'
        };
        return <MaterialIcons name={iconMap[route.name]} size={size} color={color} />;
      }
    })}>
    <Tab.Screen name="Home" component={HomeScreen} options={{ title: 'Home' }} />
    <Tab.Screen name="MindGym" component={MindGymScreen} options={{ title: 'Mind Gym' }} />
    <Tab.Screen name="MealMood" component={MealMoodScreen} options={{ title: 'Meal Mood' }} />
    <Tab.Screen name="SmartWallet" component={SmartWalletScreen} options={{ title: 'Smart Wallet' }} />
    <Tab.Screen name="FocusFlow" component={FocusFlowScreen} options={{ title: 'Focus Flow' }} />
  </Tab.Navigator>
);

// Coordinates persistence of the last visited tab using AsyncStorage.
const AppNavigation = () => {
  const [initialTab, setInitialTab] = useState('Home');
  const [isBootstrapped, setIsBootstrapped] = useState(false);

  useEffect(() => {
    const loadLastTab = async () => {
      try {
        const savedTab = await AsyncStorage.getItem(LAST_TAB_KEY);
        if (savedTab) {
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
    if (currentRoute) {
      await AsyncStorage.setItem(LAST_TAB_KEY, currentRoute);
    }
  };

  if (!isBootstrapped) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#0f172a" />
        <Text style={styles.loaderText}>Preparing LifeLoop...</Text>
      </View>
    );
  }

  return (
    <NavigationContainer onStateChange={handleStateChange}>
      <StatusBar style="light" />
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="LifeLoopTabs">
          {() => <ModuleTabs initialRouteName={initialTab} />}
        </Stack.Screen>
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
    backgroundColor: '#0f172a'
  },
  loaderText: {
    marginTop: 12,
    color: '#e2e8f0',
    fontSize: 15
  }
});

export default App;
