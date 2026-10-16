import React, { useCallback, useEffect, useState } from 'react';
import {
  AppState,
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import Header from '../../components/shared/Header';
import InfoCard from '../../components/shared/InfoCard';
import Card from '../../components/shared/Card';
import Button from '../../components/shared/Button';
import OptionChips from '../../components/shared/OptionChips';
import TextField from '../../components/shared/TextField';
import ProgressRing from '../../components/shared/ProgressRing';
import { FOCUS_GOAL_MINUTES, MAX_PRIORITIES, useAppContext } from '../../context/AppContext';
import {
  getSuggestedFocusMinutes,
  getPhaseDuration,
  getRemainingSeconds,
  isTimerRunning
} from '../../lib/focusTimer';
import {
  colors,
  fontSize,
  moduleThemes,
  radius,
  spacing,
  statThemes
} from '../../theme/theme';

const theme = moduleThemes.FocusFlow;

const formatTime = seconds => {
  const minutes = Math.floor(seconds / 60)
    .toString()
    .padStart(2, '0');
  const remainingSeconds = (seconds % 60).toString().padStart(2, '0');
  return `${minutes}:${remainingSeconds}`;
};

// Small icon-only button for priority row actions.
const IconAction = ({ icon, label, onPress, color = colors.inkSubtle }) => (
  <TouchableOpacity
    style={styles.iconAction}
    onPress={onPress}
    hitSlop={8}
    accessibilityRole="button"
    accessibilityLabel={label}
  >
    <MaterialIcons name={icon} size={20} color={color} />
  </TouchableOpacity>
);

// Pomodoro timer that logs each finished block against one of today's top 3.
const FocusFlowScreen = ({ navigation }) => {
  const {
    today,
    dailyContext,
    addPriority,
    updatePriority,
    removePriority,
    togglePriority,
    timer,
    toggleTimer,
    resetTimer,
    selectDuration
  } = useAppContext();
  const [newPriority, setNewPriority] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editingValue, setEditingValue] = useState('');
  const [selectedId, setSelectedId] = useState(null);

  const [, setClock] = useState(() => Date.now());

  const isRunning = isTimerRunning(timer);
  const remainingSeconds = getRemainingSeconds(timer, Date.now());

  const openPriorities = today.priorities.filter(priority => !priority.completed);
  // Falls back to the first open priority when the chosen one is done or removed.
  const focusTargetId = openPriorities.some(priority => priority.id === selectedId)
    ? selectedId
    : openPriorities[0]?.id ?? null;

  // Re-reads the clock while running, and immediately when the app returns to the foreground.
  useEffect(() => {
    if (!isRunning) {
      return undefined;
    }

    const intervalId = setInterval(() => setClock(Date.now()), 500);
    const subscription = AppState.addEventListener('change', status => {
      if (status === 'active') {
        setClock(Date.now());
      }
    });

    return () => {
      clearInterval(intervalId);
      subscription.remove();
    };
  }, [isRunning]);

  // Return-key submits pass the field's own text, which can be newer than `newPriority`.
  const handleAddPriority = useCallback(text => {
    const trimmed = (typeof text === 'string' ? text : newPriority).trim();

    if (!trimmed) {
      return;
    }

    addPriority(trimmed);
    setNewPriority('');
  }, [newPriority, addPriority]);

  const handleStartEdit = useCallback(priority => {
    setEditingId(priority.id);
    setEditingValue(priority.title);
  }, []);

  const handleSaveEdit = useCallback(() => {
    const trimmed = editingValue.trim();

    if (trimmed && editingId) {
      updatePriority(editingId, { title: trimmed });
    }

    setEditingId(null);
    setEditingValue('');
  }, [editingId, editingValue, updatePriority]);

  const handleCancelEdit = useCallback(() => {
    setEditingId(null);
    setEditingValue('');
  }, []);

  const handleTimerToggle = () => {
    setClock(Date.now());
    toggleTimer(focusTargetId);
  };
  const handleTimerReset = () => {
    setClock(Date.now());
    resetTimer();
  };
  const canSelectDuration = !isRunning && timer.phase === 'focus' && !timer.session;
  const suggestedMinutes = getSuggestedFocusMinutes(today.checkIn);

  const timerPhase = timer.phase;
  const phaseDuration = getPhaseDuration(timer);
  const sessionCount = today.focusSessions.length;

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets
        showsVerticalScrollIndicator={false}
      >
        <Header title="Focus" subtitle="Work through today's top 3" theme={theme} />
        <Card style={styles.timerCard}>
          {canSelectDuration ? (
            <View style={styles.targetBlock}>
              {suggestedMinutes === 15 ? (
                <Text style={styles.targetLabel}>Low energy today? Start with a 15-minute focus session.</Text>
              ) : null}
              <OptionChips
                options={[{ value: 15, label: '15 min' }, { value: 25, label: '25 min' }]}
                value={timer.focusDuration / 60}
                onChange={selectDuration}
                theme={theme}
              />
            </View>
          ) : null}
          {timer.session ? (
            <Text style={styles.targetLabel}>{timer.phase === 'focus' ? 'This block' : 'Last block'}: {timer.session.priorityTitle ?? 'Open focus'} · {timer.session.date}</Text>
          ) : null}
          <ProgressRing
            progress={remainingSeconds / phaseDuration}
            size={220}
            strokeWidth={12}
            trackColor={theme.background}
            fillColor={theme.accent}
          >
            <Text style={styles.timerPhase}>
              {timerPhase === 'focus' ? 'Focus' : 'Break'}
            </Text>
            <Text style={styles.timerValue}>{formatTime(remainingSeconds)}</Text>
          </ProgressRing>
          {!timer.session && timer.phase === 'focus' && openPriorities.length > 1 ? (
            <View style={styles.targetBlock}>
              <Text style={styles.targetLabel}>Focusing on</Text>
              <OptionChips
                options={openPriorities.map(priority => ({
                  value: priority.id,
                  label: priority.title
                }))}
                value={focusTargetId}
                onChange={setSelectedId}
                theme={theme}
                style={styles.targetChips}
              />
            </View>
          ) : !timer.session && timer.phase === 'focus' && openPriorities.length === 1 ? (
            <Text style={styles.targetSingle} numberOfLines={1}>
              Focusing on {openPriorities[0].title}
            </Text>
          ) : null}
          <View style={styles.timerControls}>
            <Button
              label={isRunning ? 'Pause' : 'Start'}
              icon={isRunning ? 'pause' : 'play-arrow'}
              onPress={handleTimerToggle}
              theme={theme}
              style={styles.primaryControl}
            />
            <Button
              label="Reset"
              icon="replay"
              onPress={handleTimerReset}
              theme={theme}
              variant="secondary"
            />
          </View>
        </Card>
        <Text style={styles.sectionTitle}>Today's top {MAX_PRIORITIES}</Text>
        <Card>
          {today.priorities.length < MAX_PRIORITIES ? (
            <View style={styles.addRow}>
              <TextField
                style={styles.input}
                placeholder="Add a priority"
                value={newPriority}
                onChangeText={setNewPriority}
                onSubmitEditing={event => handleAddPriority(event.nativeEvent.text)}
              />
              <TouchableOpacity
                style={styles.addButton}
                onPress={() => handleAddPriority()}
                activeOpacity={0.85}
                accessibilityRole="button"
                accessibilityLabel="Add priority"
              >
                <MaterialIcons name="add" size={22} color={colors.surface} />
              </TouchableOpacity>
            </View>
          ) : null}
          {today.priorities.map((priority, index) => {
            const isEditing = editingId === priority.id;
            const hasDivider = index > 0 || today.priorities.length < MAX_PRIORITIES;

            return (
              <View
                key={priority.id}
                style={[styles.priorityItem, hasDivider && styles.priorityDivider]}
              >
                <TouchableOpacity
                  style={styles.priorityToggle}
                  onPress={() => togglePriority(priority.id)}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: priority.completed }}
                >
                  <MaterialIcons
                    name={priority.completed ? 'check-circle' : 'radio-button-unchecked'}
                    size={24}
                    color={priority.completed ? statThemes.todos.fill : colors.border}
                  />
                </TouchableOpacity>
                {isEditing ? (
                  <TextField
                    style={styles.priorityInput}
                    value={editingValue}
                    onChangeText={setEditingValue}
                    autoFocus
                  />
                ) : (
                  <Text
                    style={[
                      styles.priorityText,
                      priority.completed && styles.priorityTextCompleted
                    ]}
                  >
                    {priority.title}
                  </Text>
                )}
                <View style={styles.priorityActions}>
                  {isEditing ? (
                    <>
                      <IconAction
                        icon="check"
                        label="Save"
                        onPress={handleSaveEdit}
                        color={theme.accent}
                      />
                      <IconAction icon="close" label="Cancel" onPress={handleCancelEdit} />
                    </>
                  ) : (
                    <>
                      <IconAction
                        icon="edit"
                        label="Edit"
                        onPress={() => handleStartEdit(priority)}
                      />
                      <IconAction
                        icon="delete-outline"
                        label="Delete"
                        onPress={() => removePriority(priority.id)}
                      />
                    </>
                  )}
                </View>
              </View>
            );
          })}
          {today.priorities.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>
                No priorities yet. Add one here, or set your top 3 in the morning check-in.
              </Text>
              {!today.checkIn ? (
                <Button
                  label="Check in"
                  onPress={() => navigation.navigate('CheckIn')}
                  theme={theme}
                  variant="secondary"
                />
              ) : null}
            </View>
          ) : null}
        </Card>
        <InfoCard
          icon="timer"
          title="Focus today"
          message={`${dailyContext.focusMinutes} of ${FOCUS_GOAL_MINUTES} minutes across ${sessionCount} ${
            sessionCount === 1 ? 'session' : 'sessions'
          }.`}
          theme={theme}
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
  timerCard: {
    alignItems: 'center',
    paddingVertical: spacing.xxl
  },
  timerPhase: {
    fontSize: fontSize.caption,
    fontWeight: '600',
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: theme.accent
  },
  timerValue: {
    fontSize: fontSize.hero,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
    color: theme.ink
  },
  targetBlock: {
    alignSelf: 'stretch',
    marginTop: spacing.xl
  },
  targetLabel: {
    marginBottom: spacing.sm,
    fontSize: fontSize.caption,
    color: colors.inkMuted
  },
  targetChips: {
    justifyContent: 'flex-start'
  },
  targetSingle: {
    alignSelf: 'stretch',
    marginTop: spacing.xl,
    textAlign: 'center',
    fontSize: fontSize.body,
    color: colors.inkMuted
  },
  timerControls: {
    flexDirection: 'row',
    alignSelf: 'stretch',
    gap: spacing.sm,
    marginTop: spacing.xl
  },
  primaryControl: {
    flex: 1
  },
  sectionTitle: {
    marginTop: spacing.md,
    marginHorizontal: spacing.xs,
    fontSize: fontSize.heading,
    fontWeight: '600',
    color: colors.ink
  },
  addRow: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  input: {
    flex: 1
  },
  addButton: {
    marginLeft: spacing.sm,
    width: 44,
    height: 44,
    borderRadius: radius.sm,
    backgroundColor: theme.accent,
    alignItems: 'center',
    justifyContent: 'center'
  },
  priorityItem: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  priorityDivider: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border
  },
  priorityToggle: {
    marginRight: spacing.md
  },
  priorityText: {
    flex: 1,
    fontSize: fontSize.body,
    color: colors.ink
  },
  priorityTextCompleted: {
    textDecorationLine: 'line-through',
    color: colors.inkSubtle
  },
  priorityInput: {
    flex: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm
  },
  priorityActions: {
    flexDirection: 'row',
    marginLeft: spacing.sm
  },
  iconAction: {
    padding: spacing.xs,
    marginLeft: spacing.xs
  },
  emptyState: {
    gap: spacing.md,
    marginTop: spacing.md
  },
  emptyText: {
    fontSize: fontSize.caption,
    lineHeight: 18,
    color: colors.inkMuted
  }
});

export default FocusFlowScreen;
