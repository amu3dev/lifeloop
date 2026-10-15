import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import Header from '../components/shared/Header';
import Card from '../components/shared/Card';
import Button from '../components/shared/Button';
import IconButton from '../components/shared/IconButton';
import OptionChips from '../components/shared/OptionChips';
import TextField from '../components/shared/TextField';
import { MAX_PRIORITIES, useAppContext } from '../context/AppContext';
import {
  EFFORT_OPTIONS,
  ENERGY_OPTIONS,
  MOOD_OPTIONS,
  SLEEP_OPTIONS
} from '../lib/checkInOptions';
import { fromDateKey } from '../lib/loopTime';
import { colors, fontSize, moduleThemes, radius, spacing } from '../theme/theme';

const theme = moduleThemes.Loop;

let draftCounter = 0;
const draftId = () => `draft-${Date.now().toString(36)}-${(draftCounter += 1)}`;

// Morning check-in: how you feel plus today's top 3. Re-opening it edits today's check-in.
const CheckInScreen = ({ navigation }) => {
  const { today, todayKey, carryOver, submitCheckIn } = useAppContext();
  const existing = today.checkIn;

  const [energy, setEnergy] = useState(existing?.energy);
  const [mood, setMood] = useState(existing?.mood);
  const [sleep, setSleep] = useState(existing?.sleep);
  const [priorities, setPriorities] = useState(today.priorities);
  const [newTitle, setNewTitle] = useState('');
  const [newEffort, setNewEffort] = useState('medium');

  const isFull = priorities.length >= MAX_PRIORITIES;
  const draftTitles = new Set(priorities.map(priority => priority.title));
  const suggestions = carryOver.filter(priority => !draftTitles.has(priority.title));
  const canSubmit = Boolean(energy && mood && sleep && priorities.length > 0);

  const addDraft = (title, effort) => {
    const trimmed = title.trim();
    if (!trimmed || isFull) {
      return;
    }
    setPriorities(prev => [...prev, { id: draftId(), title: trimmed, effort, completed: false }]);
  };

  // Return-key submits pass the field's own text, which can be newer than `newTitle`.
  const handleAdd = text => {
    addDraft(typeof text === 'string' ? text : newTitle, newEffort);
    setNewTitle('');
    setNewEffort('medium');
  };

  const handleSubmit = () => {
    submitCheckIn({
      energy,
      mood,
      sleep,
      // Drafts get real ids from the context; saved priorities keep theirs.
      priorities: priorities.map(({ id, ...rest }) =>
        id.startsWith('draft-') ? rest : { id, ...rest }
      )
    });
    navigation.goBack();
  };

  const dateLabel = fromDateKey(todayKey).toLocaleDateString(undefined, {
    weekday: 'long',
    day: 'numeric',
    month: 'long'
  });

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets
        showsVerticalScrollIndicator={false}
      >
        <Header
          title={existing ? 'Your check-in' : 'Morning check-in'}
          subtitle={dateLabel}
          theme={theme}
          right={<IconButton icon="close" label="Close" onPress={() => navigation.goBack()} />}
        />

        <Card style={styles.questions}>
          <View>
            <View style={styles.questionRow}>
              <Text style={styles.question}>Energy</Text>
              <Text style={styles.scale}>1 drained · 5 charged</Text>
            </View>
            <OptionChips options={ENERGY_OPTIONS} value={energy} onChange={setEnergy} theme={theme} />
          </View>
          <View>
            <Text style={[styles.question, styles.questionSpacing]}>Mood</Text>
            <OptionChips options={MOOD_OPTIONS} value={mood} onChange={setMood} theme={theme} />
          </View>
          <View>
            <Text style={[styles.question, styles.questionSpacing]}>How did you sleep?</Text>
            <OptionChips options={SLEEP_OPTIONS} value={sleep} onChange={setSleep} theme={theme} />
          </View>
        </Card>

        <Text style={styles.sectionTitle}>Today's top {MAX_PRIORITIES}</Text>
        <Card style={styles.prioritiesCard}>
          {priorities.map((priority, index) => (
            <View key={priority.id} style={styles.priorityRow}>
              <Text style={styles.priorityIndex}>{index + 1}</Text>
              <View style={styles.priorityText}>
                <Text style={styles.priorityTitle}>{priority.title}</Text>
                <Text style={styles.priorityEffort}>
                  {EFFORT_OPTIONS.find(option => option.value === priority.effort)?.label}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() =>
                  setPriorities(prev => prev.filter(item => item.id !== priority.id))
                }
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel={`Remove ${priority.title}`}
              >
                <MaterialIcons name="close" size={20} color={colors.inkSubtle} />
              </TouchableOpacity>
            </View>
          ))}

          {isFull ? (
            <Text style={styles.hint}>That's your three. Remove one to swap it out.</Text>
          ) : (
            <View style={styles.addBlock}>
              <TextField
                placeholder={priorities.length ? 'Add another priority' : 'What matters most today?'}
                value={newTitle}
                onChangeText={setNewTitle}
                onSubmitEditing={event => handleAdd(event.nativeEvent.text)}
                returnKeyType="done"
              />
              <View style={styles.addRow}>
                <OptionChips
                  options={EFFORT_OPTIONS}
                  value={newEffort}
                  onChange={setNewEffort}
                  theme={theme}
                  style={styles.effortChips}
                />
                <Button
                  label="Add"
                  icon="add"
                  onPress={() => handleAdd()}
                  theme={theme}
                  variant="secondary"
                  style={styles.addButton}
                />
              </View>
            </View>
          )}

          {suggestions.length && !isFull ? (
            <View style={styles.suggestions}>
              <Text style={styles.hint}>Unfinished from yesterday</Text>
              {suggestions.map(priority => (
                <TouchableOpacity
                  key={priority.id}
                  style={styles.suggestion}
                  onPress={() => addDraft(priority.title, priority.effort)}
                  accessibilityRole="button"
                  accessibilityLabel={`Add ${priority.title}`}
                >
                  <MaterialIcons name="add" size={18} color={theme.accent} />
                  <Text style={styles.suggestionText}>{priority.title}</Text>
                </TouchableOpacity>
              ))}
            </View>
          ) : null}
        </Card>

        <Button
          label={existing ? 'Update check-in' : 'Start my day'}
          icon="wb-sunny"
          onPress={handleSubmit}
          theme={theme}
          disabled={!canSubmit}
        />
        {!canSubmit ? (
          <Text style={styles.footnote}>Pick energy, mood and sleep, and add at least one priority.</Text>
        ) : null}
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
  questions: {
    gap: spacing.lg
  },
  questionRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginBottom: spacing.sm
  },
  question: {
    fontSize: fontSize.body,
    fontWeight: '600',
    color: colors.ink
  },
  questionSpacing: {
    marginBottom: spacing.sm
  },
  scale: {
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
  prioritiesCard: {
    gap: spacing.md
  },
  priorityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border
  },
  priorityIndex: {
    width: 28,
    height: 28,
    borderRadius: radius.pill,
    overflow: 'hidden',
    textAlign: 'center',
    lineHeight: 28,
    marginRight: spacing.md,
    fontSize: fontSize.caption,
    fontWeight: '600',
    color: theme.accent,
    backgroundColor: theme.background
  },
  priorityText: {
    flex: 1
  },
  priorityTitle: {
    fontSize: fontSize.body,
    color: colors.ink
  },
  priorityEffort: {
    marginTop: 2,
    fontSize: fontSize.caption,
    color: colors.inkMuted
  },
  addBlock: {
    gap: spacing.md
  },
  addRow: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  effortChips: {
    flex: 1
  },
  addButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg
  },
  suggestions: {
    gap: spacing.sm
  },
  suggestion: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.xs
  },
  suggestionText: {
    marginLeft: spacing.sm,
    fontSize: fontSize.body,
    color: colors.ink
  },
  hint: {
    fontSize: fontSize.caption,
    color: colors.inkMuted
  },
  footnote: {
    textAlign: 'center',
    fontSize: fontSize.caption,
    color: colors.inkMuted
  }
});

export default CheckInScreen;
