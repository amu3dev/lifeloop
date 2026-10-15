import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import Header from '../components/shared/Header';
import Card from '../components/shared/Card';
import Button from '../components/shared/Button';
import IconButton from '../components/shared/IconButton';
import OptionChips from '../components/shared/OptionChips';
import { useAppContext } from '../context/AppContext';
import { getMoodOption, MOOD_OPTIONS } from '../lib/checkInOptions';
import { colors, fontSize, moduleThemes, radius, spacing, statThemes } from '../theme/theme';

const theme = moduleThemes.Loop;

// Evening review: mark what got done and how the day felt, which closes the loop.
const ReviewScreen = ({ navigation }) => {
  const { today, dailyContext, submitReview } = useAppContext();
  const [feeling, setFeeling] = useState(today.review?.feeling);
  // Ticks stay a draft until "Close the loop", so closing with ✕ changes nothing.
  const [doneIds, setDoneIds] = useState(
    () => new Set(today.priorities.filter(priority => priority.completed).map(priority => priority.id))
  );

  const toggleDone = priorityId =>
    setDoneIds(prev => {
      const next = new Set(prev);
      if (next.has(priorityId)) {
        next.delete(priorityId);
      } else {
        next.add(priorityId);
      }
      return next;
    });

  const doneCount = today.priorities.filter(priority => doneIds.has(priority.id)).length;
  const morningMood = getMoodOption(today.checkIn?.mood);

  const handleSubmit = () => {
    submitReview({ feeling, completedIds: [...doneIds] });
    navigation.goBack();
  };

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Header
          title={today.review ? 'Your review' : 'Close your day'}
          subtitle="Mark what got done and how it felt"
          theme={theme}
          right={<IconButton icon="close" label="Close" onPress={() => navigation.goBack()} />}
        />

        <View style={styles.summaryRow}>
          <View style={styles.summaryTile}>
            <Text style={styles.summaryValue}>
              {doneCount}/{today.priorities.length}
            </Text>
            <Text style={styles.summaryLabel}>Priorities done</Text>
          </View>
          <View style={styles.summaryTile}>
            <Text style={styles.summaryValue}>{dailyContext.focusMinutes}</Text>
            <Text style={styles.summaryLabel}>Focus minutes</Text>
          </View>
          <View style={styles.summaryTile}>
            <MaterialIcons
              name={morningMood?.icon ?? 'remove'}
              size={28}
              color={statThemes.mood.ink}
            />
            <Text style={styles.summaryLabel}>
              {morningMood ? `${morningMood.label} this morning` : 'No check-in'}
            </Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>What got done?</Text>
        <Card style={styles.priorities}>
          {today.priorities.length === 0 ? (
            <Text style={styles.hint}>No priorities were set today.</Text>
          ) : (
            today.priorities.map(priority => {
              const isDone = doneIds.has(priority.id);

              return (
                <TouchableOpacity
                  key={priority.id}
                  style={styles.priorityRow}
                  onPress={() => toggleDone(priority.id)}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: isDone }}
                >
                  <MaterialIcons
                    name={isDone ? 'check-circle' : 'radio-button-unchecked'}
                    size={24}
                    color={isDone ? statThemes.todos.fill : colors.border}
                  />
                  <Text style={[styles.priorityTitle, isDone && styles.priorityDone]}>
                    {priority.title}
                  </Text>
                </TouchableOpacity>
              );
            })
          )}
        </Card>

        <Text style={styles.sectionTitle}>How did today feel?</Text>
        <OptionChips options={MOOD_OPTIONS} value={feeling} onChange={setFeeling} theme={theme} />

        {!today.checkIn ? (
          <Text style={styles.hint}>
            You didn't check in today, so this day won't count toward your streak.
          </Text>
        ) : null}

        <Button
          label={today.review ? 'Update review' : 'Close the loop'}
          icon="nights-stay"
          onPress={handleSubmit}
          theme={theme}
          disabled={!feeling}
          style={styles.submit}
        />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background
  },
  content: {
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl
  },
  summaryRow: {
    flexDirection: 'row',
    gap: spacing.sm
  },
  summaryTile: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 92,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md
  },
  summaryValue: {
    fontSize: fontSize.title,
    fontWeight: '600',
    color: colors.ink
  },
  summaryLabel: {
    marginTop: spacing.xs,
    textAlign: 'center',
    fontSize: fontSize.caption,
    color: colors.inkMuted
  },
  sectionTitle: {
    marginTop: spacing.md,
    marginHorizontal: spacing.xs,
    fontSize: fontSize.heading,
    fontWeight: '600',
    color: colors.ink
  },
  priorities: {
    gap: spacing.md
  },
  priorityRow: {
    flexDirection: 'row',
    alignItems: 'center'
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
  hint: {
    marginHorizontal: spacing.xs,
    fontSize: fontSize.caption,
    lineHeight: 17,
    color: colors.inkMuted
  },
  submit: {
    marginTop: spacing.md
  }
});

export default ReviewScreen;
