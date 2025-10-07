import React, { useEffect, useMemo, useRef } from 'react';
import {
  Animated,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import Header from '../components/shared/Header';
import InfoCard from '../components/shared/InfoCard';
import { useAppContext } from '../context/AppContext';

const MODULES = [
  { key: 'MindGym', label: 'Mind Gym', emoji: '🧠', subtitle: 'Sharpen focus' },
  { key: 'MealMood', label: 'Meal Mood', emoji: '🍽️', subtitle: 'Nourish smart' },
  { key: 'SmartWallet', label: 'Smart Wallet', emoji: '💼', subtitle: 'Track gains' },
  { key: 'FocusFlow', label: 'Focus Flow', emoji: '⏱️', subtitle: 'Deep work loop' }
];

// Provides a welcoming dashboard with a subtle fade-in animation.
const HomeScreen = ({ navigation }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const { state } = useAppContext();

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true
    }).start();
  }, [fadeAnim]);

  const quickStats = useMemo(
    () => [
      {
        icon: 'military-tech',
        title: 'Points',
        message: `${state.points} earned today`
      },
      {
        icon: 'local-fire-department',
        title: 'Streaks',
        message: `${state.streaks} day streak`
      },
      {
        icon: 'emoji-emotions',
        title: 'Mood',
        message: state.todayMood ? state.todayMood : 'Mood not set yet'
      },
      {
        icon: 'check-circle',
        title: 'Todos',
        message: `${state.todos.filter(todo => todo.completed).length}/${
          state.todos.length
        } complete`
      }
    ],
    [state.points, state.streaks, state.todayMood, state.todos]
  );

  const walletSnapshot = useMemo(() => {
    if (!state.walletHistory.length) {
      return 'No wallet entries yet.';
    }

    const [latest] = state.walletHistory;
    const name = latest?.name ? latest.name : 'recent entry';
    const profit =
      typeof latest?.profitPercent === 'number'
        ? `${latest.profitPercent}%`
        : 'n/a';

    return `Latest margin: ${profit} on ${name}.`;
  }, [state.walletHistory]);

  const handleNavigateToModule = moduleKey => {
    navigation.navigate(moduleKey);
  };

  return (
    <View style={styles.container}>
      <Header title="LifeLoop" subtitle="Daily balance at a glance" />
      <Animated.View style={[styles.animatedContainer, { opacity: fadeAnim }]}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.sectionTitle}>Today&apos;s Loop</Text>
          <View>
            {quickStats.map(stat => (
              <InfoCard key={stat.title} icon={stat.icon} title={stat.title} message={stat.message} />
            ))}
          </View>

          <InfoCard
            icon="account-balance-wallet"
            title="Wallet pulse"
            message={walletSnapshot}
          />

          <Text style={[styles.sectionTitle, styles.moduleTitle]}>
            Jump back into a module
          </Text>
          <View style={styles.moduleGrid}>
            {MODULES.map(module => (
              <TouchableOpacity
                key={module.key}
                style={styles.moduleCard}
                onPress={() => handleNavigateToModule(module.key)}
                activeOpacity={0.85}
              >
                <Text style={styles.moduleEmoji}>{module.emoji}</Text>
                <Text style={styles.moduleLabel}>{module.label}</Text>
                <Text style={styles.moduleSubtitle}>{module.subtitle}</Text>
                <View style={styles.moduleIcon}>
                  <MaterialIcons name="arrow-forward" size={20} color="#0f172a" />
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc'
  },
  animatedContainer: {
    flex: 1
  },
  scroll: {
    flex: 1
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 100
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 12
  },
  moduleTitle: {
    marginTop: 32
  },
  moduleGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between'
  },
  moduleCard: {
    flexBasis: '48%',
    minWidth: '48%',
    backgroundColor: '#e2e8f0',
    borderRadius: 16,
    paddingVertical: 20,
    paddingHorizontal: 16,
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 16
  },
  moduleEmoji: {
    fontSize: 24,
    marginBottom: 12
  },
  moduleLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a'
  },
  moduleSubtitle: {
    marginTop: 4,
    fontSize: 13,
    color: '#475569'
  },
  moduleIcon: {
    marginTop: 16,
    alignSelf: 'flex-end',
    backgroundColor: '#bae6fd',
    borderRadius: 999,
    padding: 6
  }
});

export default HomeScreen;
