import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
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
import TextField from '../../components/shared/TextField';
import ProgressRing from '../../components/shared/ProgressRing';
import { useAppContext } from '../../context/AppContext';
import {
  colors,
  fontSize,
  moduleThemes,
  radius,
  spacing,
  statThemes
} from '../../theme/theme';

const theme = moduleThemes.FocusFlow;

const FOCUS_DURATION = 25 * 60;
const BREAK_DURATION = 5 * 60;

const formatTime = seconds => {
  const minutes = Math.floor(seconds / 60)
    .toString()
    .padStart(2, '0');
  const remainingSeconds = (seconds % 60).toString().padStart(2, '0');
  return `${minutes}:${remainingSeconds}`;
};

// Small icon-only button for todo row actions.
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

// Runs a todo-driven Pomodoro loop that syncs streaks with the global context.
const FocusFlowScreen = () => {
  const {
    state,
    addTodo,
    updateTodo,
    removeTodo,
    toggleTodo,
    completeFocusSession,
    resetDay
  } = useAppContext();
  const [newTodo, setNewTodo] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editingValue, setEditingValue] = useState('');
  const [timerPhase, setTimerPhase] = useState('focus');
  const [remainingSeconds, setRemainingSeconds] = useState(FOCUS_DURATION);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    if (!isRunning) {
      return undefined;
    }

    const intervalId = setInterval(() => {
      setRemainingSeconds(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(intervalId);
  }, [isRunning]);

  useEffect(() => {
    if (!isRunning) {
      return;
    }

    if (remainingSeconds === 0) {
      if (timerPhase === 'focus') {
        completeFocusSession();
        setTimerPhase('break');
        setRemainingSeconds(BREAK_DURATION);
      } else {
        setTimerPhase('focus');
        setRemainingSeconds(FOCUS_DURATION);
      }
    }
  }, [remainingSeconds, timerPhase, isRunning, completeFocusSession]);

  const handleAddTodo = useCallback(() => {
    const trimmed = newTodo.trim();

    if (!trimmed) {
      return;
    }

    addTodo({ title: trimmed, completed: false });
    setNewTodo('');
  }, [newTodo, addTodo]);

  const handleStartEdit = useCallback(todo => {
    setEditingId(todo.id);
    setEditingValue(todo.title);
  }, []);

  const handleSaveEdit = useCallback(() => {
    const trimmed = editingValue.trim();

    if (!trimmed || !editingId) {
      setEditingId(null);
      setEditingValue('');
      return;
    }

    updateTodo(editingId, { title: trimmed });
    setEditingId(null);
    setEditingValue('');
  }, [editingId, editingValue, updateTodo]);

  const handleCancelEdit = useCallback(() => {
    setEditingId(null);
    setEditingValue('');
  }, []);

  const allTodosComplete = useMemo(
    () => state.todos.length > 0 && state.todos.every(todo => todo.completed),
    [state.todos]
  );

  const streakMessage = useMemo(() => {
    if (allTodosComplete) {
      return `Loop complete! Current streak: ${state.streaks}. Use reset to start a new day.`;
    }

    return `Current streak: ${state.streaks}. Complete todos to keep momentum.`;
  }, [allTodosComplete, state.streaks]);

  const handleTimerToggle = useCallback(() => {
    setIsRunning(prev => !prev);
  }, []);

  const handleTimerReset = useCallback(() => {
    setIsRunning(false);
    setTimerPhase('focus');
    setRemainingSeconds(FOCUS_DURATION);
  }, []);

  const handleResetDay = useCallback(() => {
    resetDay();
    handleTimerReset();
  }, [resetDay, handleTimerReset]);

  const phaseDuration = timerPhase === 'focus' ? FOCUS_DURATION : BREAK_DURATION;

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets
        showsVerticalScrollIndicator={false}
      >
        <Header title="Focus Flow" subtitle="Move through deep work with ease" theme={theme} />
        <Card style={styles.timerCard}>
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
        <Text style={styles.sectionTitle}>Todo loop</Text>
        <Card>
          <View style={styles.addRow}>
            <TextField
              style={styles.input}
              placeholder="Add a focus task"
              value={newTodo}
              onChangeText={setNewTodo}
              onSubmitEditing={handleAddTodo}
            />
            <TouchableOpacity
              style={styles.addButton}
              onPress={handleAddTodo}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel="Add todo"
            >
              <MaterialIcons name="add" size={22} color={colors.surface} />
            </TouchableOpacity>
          </View>
          {state.todos.map(todo => {
            const isEditing = editingId === todo.id;

            return (
              <View key={todo.id} style={styles.todoItem}>
                <TouchableOpacity
                  style={styles.todoToggle}
                  onPress={() => toggleTodo(todo.id)}
                >
                  <MaterialIcons
                    name={todo.completed ? 'check-circle' : 'radio-button-unchecked'}
                    size={24}
                    color={todo.completed ? statThemes.todos.fill : colors.border}
                  />
                </TouchableOpacity>
                {isEditing ? (
                  <TextField
                    style={styles.todoInput}
                    value={editingValue}
                    onChangeText={setEditingValue}
                    autoFocus
                  />
                ) : (
                  <Text
                    style={[
                      styles.todoText,
                      todo.completed && styles.todoTextCompleted
                    ]}
                  >
                    {todo.title}
                  </Text>
                )}
                <View style={styles.todoActions}>
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
                        onPress={() => handleStartEdit(todo)}
                      />
                      <IconAction
                        icon="delete-outline"
                        label="Delete"
                        onPress={() => removeTodo(todo.id)}
                      />
                    </>
                  )}
                </View>
              </View>
            );
          })}
          {state.todos.length === 0 ? (
            <Text style={styles.emptyState}>
              No todos yet. Add a focus task to kickstart your loop.
            </Text>
          ) : null}
        </Card>
        <InfoCard
          icon="emoji-events"
          title="Streak tracker"
          message={streakMessage}
          theme={theme}
        />
        {allTodosComplete ? (
          <Button label="Reset day & keep streak" onPress={handleResetDay} theme={theme} />
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
  timerControls: {
    flexDirection: 'row',
    alignSelf: 'stretch',
    gap: spacing.sm,
    marginTop: spacing.xxl
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
  todoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border
  },
  todoToggle: {
    marginRight: spacing.md
  },
  todoText: {
    flex: 1,
    fontSize: fontSize.body,
    color: colors.ink
  },
  todoTextCompleted: {
    textDecorationLine: 'line-through',
    color: colors.inkSubtle
  },
  todoInput: {
    flex: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm
  },
  todoActions: {
    flexDirection: 'row',
    marginLeft: spacing.sm
  },
  iconAction: {
    padding: spacing.xs,
    marginLeft: spacing.xs
  },
  emptyState: {
    marginTop: spacing.md,
    fontSize: fontSize.caption,
    lineHeight: 18,
    color: colors.inkMuted
  }
});

export default FocusFlowScreen;
