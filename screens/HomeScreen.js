import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useIsFocused } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialIcons } from '@expo/vector-icons';
import ProgressRing from '../components/shared/ProgressRing';
import { useAppContext } from '../context/AppContext';
import { MEAL_STORAGE_KEY } from '../modules/meal-mood/MealMoodScreen';
import {
  colors,
  fontSize,
  moduleThemes,
  radius,
  spacing,
  statThemes
} from '../theme/theme';

const FOCUS_GOAL = 4;
const STREAK_WEEK = 7;

const MOOD_ICONS = {
  Happy: 'sentiment-satisfied-alt',
  Tired: 'bedtime',
  Hungry: 'restaurant'
};

const MODULES = [
  { key: 'MindGym', label: 'Mind Gym', icon: 'psychology' },
  { key: 'MealMood', label: 'Meal Mood', icon: 'restaurant-menu' },
  { key: 'SmartWallet', label: 'Smart Wallet', icon: 'account-balance-wallet' },
  { key: 'FocusFlow', label: 'Focus Flow', icon: 'hourglass-empty' }
];

const getGreeting = date => {
  const hour = date.getHours();
  if (hour < 12) {
    return 'Good morning';
  }
  if (hour < 18) {
    return 'Good afternoon';
  }
  return 'Good evening';
};

// Shows today's progress at a glance and links into each module.
const HomeScreen = ({ navigation }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const isFocused = useIsFocused();
  const { state } = useAppContext();
  const [mealTitle, setMealTitle] = useState(null);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true
    }).start();
  }, [fadeAnim]);

  // Re-reads the latest meal suggestion whenever Home comes back into view.
  useFocusEffect(
    useCallback(() => {
      AsyncStorage.getItem(MEAL_STORAGE_KEY)
        .then(stored => {
          setMealTitle(stored ? JSON.parse(stored).title : null);
        })
        .catch(error => console.warn('Failed to read meal suggestion', error));
    }, [])
  );

  const now = new Date();
  const dateLabel = now.toLocaleDateString(undefined, {
    weekday: 'long',
    day: 'numeric',
    month: 'long'
  });

  const completedTodos = state.todos.filter(todo => todo.completed).length;
  const totalTodos = state.todos.length;
  const focusSessions = state.focusSessionsToday ?? 0;
  const streakDaysFilled = Math.min(state.streaks, STREAK_WEEK);
  const nextTodo = state.todos.find(todo => !todo.completed);

  const moduleDetails = useMemo(() => {
    const [latestWallet] = state.walletHistory;
    const walletDetail =
      typeof latestWallet?.profitPercent === 'number'
        ? `${latestWallet.profitPercent}% on ${latestWallet.name}`
        : 'Log a margin';

    return {
      MindGym: 'Guess 1 to 100',
      MealMood: mealTitle ?? 'Get a meal idea',
      SmartWallet: walletDetail,
      FocusFlow: `${focusSessions * 25} min today`
    };
  }, [state.walletHistory, mealTitle, focusSessions]);

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      {isFocused ? <StatusBar style="dark" /> : null}
      <Animated.View style={[styles.animatedContainer, { opacity: fadeAnim }]}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.greetingRow}>
            <Text style={styles.dateLabel}>{dateLabel}</Text>
            <Text style={styles.greeting}>{getGreeting(now)}</Text>
          </View>

          <View style={styles.hero}>
            <View style={styles.heroStreak}>
              <View style={styles.heroLabelRow}>
                <MaterialIcons
                  name="local-fire-department"
                  size={14}
                  color={colors.streak}
                />
                <Text style={styles.heroLabel}>Current streak</Text>
              </View>
              <Text style={styles.heroValue}>
                {state.streaks}
                <Text style={styles.heroUnit}>
                  {state.streaks === 1 ? ' day' : ' days'}
                </Text>
              </Text>
              <View style={styles.streakBar}>
                {Array.from({ length: STREAK_WEEK }, (_, index) => (
                  <View
                    key={index}
                    style={[
                      styles.streakSegment,
                      index < streakDaysFilled && styles.streakSegmentFilled
                    ]}
                  />
                ))}
              </View>
            </View>
            <View style={styles.heroPoints}>
              <Text style={styles.heroLabel}>Points today</Text>
              <Text style={styles.heroValue}>{state.points}</Text>
            </View>
          </View>

          <View style={styles.statRow}>
            <TouchableOpacity
              style={styles.statTile}
              onPress={() => navigation.navigate('FocusFlow')}
              activeOpacity={0.85}
            >
              <ProgressRing
                progress={totalTodos ? completedTodos / totalTodos : 0}
                label={`${completedTodos}/${totalTodos}`}
                trackColor={statThemes.todos.track}
                fillColor={statThemes.todos.fill}
                labelColor={statThemes.todos.ink}
              />
              <Text style={styles.statLabel}>Todos</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.statTile}
              onPress={() => navigation.navigate('FocusFlow')}
              activeOpacity={0.85}
            >
              <ProgressRing
                progress={focusSessions / FOCUS_GOAL}
                label={`${focusSessions}/${FOCUS_GOAL}`}
                trackColor={statThemes.focus.track}
                fillColor={statThemes.focus.fill}
                labelColor={statThemes.focus.ink}
              />
              <Text style={styles.statLabel}>Focus blocks</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.statTile}
              onPress={() => navigation.navigate('MealMood')}
              activeOpacity={0.85}
            >
              <View style={styles.moodBadge}>
                <MaterialIcons
                  name={MOOD_ICONS[state.todayMood] ?? 'add-reaction'}
                  size={26}
                  color={statThemes.mood.ink}
                />
              </View>
              <Text style={styles.statLabel} numberOfLines={1}>
                {state.todayMood ? `Feeling ${state.todayMood.toLowerCase()}` : 'Set mood'}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.upNext}>
            <View style={styles.upNextIcon}>
              <MaterialIcons
                name="track-changes"
                size={20}
                color={moduleThemes.FocusFlow.accent}
              />
            </View>
            <View style={styles.upNextText}>
              <Text style={styles.upNextLabel}>Up next</Text>
              <Text style={styles.upNextTitle} numberOfLines={1}>
                {nextTodo ? nextTodo.title : totalTodos ? 'All todos done' : 'Add your first todo'}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.upNextButton}
              onPress={() => navigation.navigate('FocusFlow')}
              activeOpacity={0.85}
            >
              <MaterialIcons
                name={nextTodo ? 'play-arrow' : 'add'}
                size={16}
                color={colors.surface}
              />
              <Text style={styles.upNextButtonLabel}>
                {nextTodo ? '25 min' : 'Add'}
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.sectionTitle}>Your modules</Text>
          <View style={styles.moduleGrid}>
            {MODULES.map(module => {
              const theme = moduleThemes[module.key];

              return (
                <TouchableOpacity
                  key={module.key}
                  style={[styles.moduleTile, { backgroundColor: theme.background }]}
                  onPress={() => navigation.navigate(module.key)}
                  activeOpacity={0.85}
                >
                  <MaterialIcons name={module.icon} size={24} color={theme.accent} />
                  <Text style={[styles.moduleLabel, { color: theme.ink }]}>
                    {module.label}
                  </Text>
                  <Text
                    style={[styles.moduleDetail, { color: theme.accent }]}
                    numberOfLines={1}
                  >
                    {moduleDetails[module.key]}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>
      </Animated.View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background
  },
  animatedContainer: {
    flex: 1
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl
  },
  greetingRow: {
    paddingHorizontal: spacing.xs,
    paddingTop: spacing.lg,
    paddingBottom: spacing.lg
  },
  dateLabel: {
    fontSize: fontSize.caption,
    color: colors.inkMuted
  },
  greeting: {
    marginTop: 2,
    fontSize: fontSize.title,
    fontWeight: '600',
    color: colors.ink
  },
  hero: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.hero,
    borderRadius: radius.lg,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl
  },
  heroStreak: {
    flex: 1
  },
  heroLabelRow: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  heroLabel: {
    marginLeft: spacing.xs,
    fontSize: fontSize.caption,
    color: colors.heroMuted
  },
  heroValue: {
    fontSize: fontSize.display,
    fontWeight: '600',
    color: colors.heroText
  },
  heroUnit: {
    fontSize: fontSize.body,
    fontWeight: '400',
    color: colors.heroMuted
  },
  streakBar: {
    flexDirection: 'row',
    marginTop: spacing.sm
  },
  streakSegment: {
    width: 22,
    height: 6,
    borderRadius: 3,
    marginRight: spacing.xs,
    backgroundColor: colors.heroDivider
  },
  streakSegmentFilled: {
    backgroundColor: colors.streak
  },
  heroPoints: {
    alignItems: 'flex-end',
    borderLeftWidth: StyleSheet.hairlineWidth,
    borderLeftColor: colors.heroDivider,
    paddingLeft: spacing.lg
  },
  statRow: {
    flexDirection: 'row',
    marginTop: spacing.md,
    marginHorizontal: -spacing.xs
  },
  statTile: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xs,
    marginHorizontal: spacing.xs
  },
  statLabel: {
    marginTop: spacing.sm,
    fontSize: fontSize.caption,
    color: colors.inkMuted
  },
  moodBadge: {
    width: 56,
    height: 56,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: statThemes.mood.background
  },
  upNext: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md
  },
  upNextIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: moduleThemes.FocusFlow.background
  },
  upNextText: {
    flex: 1,
    marginHorizontal: spacing.md
  },
  upNextLabel: {
    fontSize: fontSize.caption,
    color: colors.inkMuted
  },
  upNextTitle: {
    fontSize: fontSize.body,
    fontWeight: '600',
    color: colors.ink
  },
  upNextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: moduleThemes.FocusFlow.accent,
    borderRadius: radius.pill,
    paddingVertical: 7,
    paddingHorizontal: spacing.md
  },
  upNextButtonLabel: {
    marginLeft: 2,
    fontSize: 13,
    fontWeight: '600',
    color: colors.surface
  },
  sectionTitle: {
    marginTop: spacing.xxl,
    marginBottom: spacing.md,
    marginHorizontal: spacing.xs,
    fontSize: fontSize.heading,
    fontWeight: '600',
    color: colors.ink
  },
  moduleGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between'
  },
  moduleTile: {
    width: '48.5%',
    borderRadius: radius.md,
    padding: spacing.lg,
    marginBottom: spacing.sm
  },
  moduleLabel: {
    marginTop: spacing.sm,
    fontSize: fontSize.body,
    fontWeight: '600'
  },
  moduleDetail: {
    marginTop: 2,
    fontSize: fontSize.caption
  }
});

export default HomeScreen;
