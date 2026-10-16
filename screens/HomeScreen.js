import React, { useEffect, useRef } from 'react';
import { Animated, View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useIsFocused } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { MaterialIcons } from '@expo/vector-icons';
import ProgressRing from '../components/shared/ProgressRing';
import Card from '../components/shared/Card';
import { getSevenDayHistory } from '../lib/history';
import IconButton from '../components/shared/IconButton';
import { FOCUS_GOAL_MINUTES, useAppContext } from '../context/AppContext';
import { getMoodOption } from '../lib/checkInOptions';
import { fromDateKey, getLoopAnchors } from '../lib/loopTime';
import { getNextAction } from '../lib/nextAction';
import {
  colors,
  fontSize,
  moduleThemes,
  radius,
  spacing,
  statThemes
} from '../theme/theme';

const STREAK_WEEK = 7;

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

// "Your day": loop status, the next step, today's top 3, and focus progress.
const HomeScreen = ({ navigation }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const isFocused = useIsFocused();
  const { state, now, today, todayKey, dailyContext, streak, togglePriority } = useAppContext();

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true
    }).start();
  }, [fadeAnim]);

  const anchors = getLoopAnchors(state.settings, todayKey);
  const next = getNextAction({ today, anchors, now });
  const dateLabel = fromDateKey(todayKey).toLocaleDateString(undefined, {
    weekday: 'long',
    day: 'numeric',
    month: 'long'
  });

  const completed = today.priorities.filter(priority => priority.completed).length;
  const total = today.priorities.length;
  const mood = getMoodOption(today.checkIn?.mood);
  const loopSteps = [
    { label: 'Check-in', done: Boolean(today.checkIn), route: 'CheckIn' },
    { label: 'Focus', done: dailyContext.focusMinutes > 0, route: 'FocusFlow' },
    { label: 'Review', done: Boolean(today.review), route: 'Review' }
  ];

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      {isFocused ? <StatusBar style="dark" /> : null}
      <Animated.View style={[styles.animatedContainer, { opacity: fadeAnim }]}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.greetingRow}>
            <View style={styles.greetingText}>
              <Text style={styles.dateLabel}>{dateLabel}</Text>
              <Text style={styles.greeting}>{getGreeting(now)}</Text>
            </View>
            <IconButton
              icon="tune"
              label="Settings"
              onPress={() => navigation.navigate('Settings')}
            />
          </View>

          <View style={styles.hero}>
            <View style={styles.heroStreak}>
              <View style={styles.heroLabelRow}>
                <MaterialIcons name="local-fire-department" size={14} color={colors.streak} />
                <Text style={styles.heroLabel}>Loop streak</Text>
              </View>
              <Text style={styles.heroValue}>
                {streak}
                <Text style={styles.heroUnit}>{streak === 1 ? ' day' : ' days'}</Text>
              </Text>
              <View style={styles.streakBar}>
                {Array.from({ length: STREAK_WEEK }, (_, index) => (
                  <View
                    key={index}
                    style={[
                      styles.streakSegment,
                      index < Math.min(streak, STREAK_WEEK) && styles.streakSegmentFilled
                    ]}
                  />
                ))}
              </View>
            </View>
            <View style={styles.heroSteps}>
              {loopSteps.map(step => (
                <TouchableOpacity
                  key={step.label}
                  style={styles.heroStep}
                  onPress={() => navigation.navigate(step.route)}
                  hitSlop={6}
                  accessibilityRole="button"
                  accessibilityLabel={`${step.label}${step.done ? ', done' : ''}`}
                >
                  <MaterialIcons
                    name={step.done ? 'check-circle' : 'radio-button-unchecked'}
                    size={16}
                    color={step.done ? colors.positive : colors.heroDivider}
                  />
                  <Text style={[styles.heroStepLabel, step.done && styles.heroStepDone]}>
                    {step.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.nextCard}>
            <View style={styles.nextIcon}>
              <MaterialIcons name={next.icon} size={20} color={moduleThemes.Loop.accent} />
            </View>
            <View style={styles.nextText}>
              <Text style={styles.nextLabel}>{next.label}</Text>
              <Text style={styles.nextTitle} numberOfLines={2}>
                {next.title}
              </Text>
            </View>
            {next.action ? (
              <TouchableOpacity
                style={styles.nextButton}
                onPress={() => navigation.navigate(next.action.route)}
                activeOpacity={0.85}
              >
                <MaterialIcons name={next.action.icon} size={16} color={colors.surface} />
                <Text style={styles.nextButtonLabel}>{next.action.label}</Text>
              </TouchableOpacity>
            ) : null}
          </View>

          <View style={styles.statRow}>
            <TouchableOpacity
              style={styles.statTile}
              onPress={() => navigation.navigate('FocusFlow')}
              activeOpacity={0.85}
            >
              <ProgressRing
                progress={total ? completed / total : 0}
                label={`${completed}/${total}`}
                trackColor={statThemes.todos.track}
                fillColor={statThemes.todos.fill}
                labelColor={statThemes.todos.ink}
              />
              <Text style={styles.statLabel}>Top 3</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.statTile}
              onPress={() => navigation.navigate('FocusFlow')}
              activeOpacity={0.85}
            >
              <ProgressRing
                progress={dailyContext.focusMinutes / FOCUS_GOAL_MINUTES}
                label={`${dailyContext.focusMinutes}`}
                trackColor={statThemes.focus.track}
                fillColor={statThemes.focus.fill}
                labelColor={statThemes.focus.ink}
              />
              <Text style={styles.statLabel}>Focus min</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.statTile}
              onPress={() => navigation.navigate('CheckIn')}
              activeOpacity={0.85}
            >
              <View style={styles.moodBadge}>
                <MaterialIcons
                  name={mood?.icon ?? 'add-reaction'}
                  size={26}
                  color={statThemes.mood.ink}
                />
              </View>
              <Text style={styles.statLabel} numberOfLines={1}>
                {today.checkIn ? `Energy ${today.checkIn.energy}/5` : 'Check in'}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Today's top 3</Text>
            {today.checkIn ? (
              <TouchableOpacity onPress={() => navigation.navigate('CheckIn')} hitSlop={8}>
                <Text style={styles.sectionAction}>Edit</Text>
              </TouchableOpacity>
            ) : null}
          </View>
          <View style={styles.priorityCard}>
            {total === 0 ? (
              <Text style={styles.emptyText}>
                Your top 3 will show here after your morning check-in.
              </Text>
            ) : (
              today.priorities.map((priority, index) => (
                <TouchableOpacity
                  key={priority.id}
                  style={[styles.priorityRow, index > 0 && styles.priorityDivider]}
                  onPress={() => togglePriority(priority.id)}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: priority.completed }}
                >
                  <MaterialIcons
                    name={priority.completed ? 'check-circle' : 'radio-button-unchecked'}
                    size={22}
                    color={priority.completed ? statThemes.todos.fill : colors.border}
                  />
                  <Text
                    style={[styles.priorityTitle, priority.completed && styles.priorityDone]}
                    numberOfLines={1}
                  >
                    {priority.title}
                  </Text>
                </TouchableOpacity>
              ))
            )}
          </View>

          <Text style={[styles.sectionTitle, { marginTop: spacing.xxl, marginBottom: spacing.md }]}>Last seven loop days</Text>
          <Card>
            {getSevenDayHistory(state.days, todayKey).map(day => (
              <View key={day.date} style={styles.priorityRow} accessible>
                <View style={{ flex: 1 }}>
                  <Text style={styles.priorityTitle}>{day.date}</Text>
                  <Text style={styles.emptyText}>
                    {day.hasRecord
                      ? `Check-in: ${day.checkedIn ? 'done' : 'not recorded'} · Review: ${day.reviewed ? 'done' : 'not recorded'}\n${day.completedPriorities} priorities done · ${day.focusMinutes} focus min · Energy: ${day.energy === null ? 'not recorded' : `${day.energy}/5`}`
                      : 'No records · Check-in, review, priorities, focus and energy not recorded'}
                  </Text>
                </View>
              </View>
            ))}
          </Card>

          <Text style={styles.footnote}>
            Review {anchors.reviewLabel}
            {state.settings.timingMode === 'prayer' ? '' : ' · change times in settings'}
          </Text>
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
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xs,
    paddingTop: spacing.lg,
    paddingBottom: spacing.lg
  },
  greetingText: {
    flex: 1
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
  heroSteps: {
    gap: spacing.sm,
    borderLeftWidth: StyleSheet.hairlineWidth,
    borderLeftColor: colors.heroDivider,
    paddingLeft: spacing.lg
  },
  heroStep: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  heroStepLabel: {
    marginLeft: spacing.xs,
    fontSize: fontSize.caption,
    color: colors.heroMuted
  },
  heroStepDone: {
    color: colors.heroText
  },
  nextCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md
  },
  nextIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: moduleThemes.Loop.background
  },
  nextText: {
    flex: 1,
    marginHorizontal: spacing.md
  },
  nextLabel: {
    fontSize: fontSize.caption,
    color: colors.inkMuted
  },
  nextTitle: {
    fontSize: fontSize.body,
    fontWeight: '600',
    color: colors.ink
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: moduleThemes.Loop.accent,
    borderRadius: radius.pill,
    paddingVertical: 7,
    paddingHorizontal: spacing.md
  },
  nextButtonLabel: {
    marginLeft: 2,
    fontSize: 13,
    fontWeight: '600',
    color: colors.surface
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
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginTop: spacing.xxl,
    marginBottom: spacing.md,
    marginHorizontal: spacing.xs
  },
  sectionTitle: {
    fontSize: fontSize.heading,
    fontWeight: '600',
    color: colors.ink
  },
  sectionAction: {
    fontSize: fontSize.body,
    fontWeight: '600',
    color: moduleThemes.FocusFlow.accent
  },
  priorityCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs
  },
  priorityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md
  },
  priorityDivider: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border
  },
  priorityTitle: {
    flex: 1,
    marginLeft: spacing.md,
    fontSize: fontSize.body,
    color: colors.ink
  },
  priorityDone: {
    textDecorationLine: 'line-through',
    color: colors.inkSubtle
  },
  emptyText: {
    paddingVertical: spacing.md,
    fontSize: fontSize.caption,
    lineHeight: 17,
    color: colors.inkMuted
  },
  footnote: {
    marginTop: spacing.md,
    marginHorizontal: spacing.xs,
    fontSize: fontSize.caption,
    color: colors.inkSubtle
  }
});

export default HomeScreen;
