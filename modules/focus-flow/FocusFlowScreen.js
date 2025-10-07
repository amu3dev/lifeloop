import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import Header from '../../components/shared/Header';
import InfoCard from '../../components/shared/InfoCard';
import { useAppContext } from '../../context/AppContext';

const FOCUS_DURATION = 25 * 60;
const BREAK_DURATION = 5 * 60;

const formatTime = seconds => {
  const minutes = Math.floor(seconds / 60)
    .toString()
    .padStart(2, '0');
  const remainingSeconds = (seconds % 60).toString().padStart(2, '0');
  return `${minutes}:${remainingSeconds}`;
};

// Runs a todo-driven Pomodoro loop that syncs streaks with the global context.
const FocusFlowScreen = () => {
  const {
    state,
    addTodo,
    updateTodo,
    removeTodo,
    toggleTodo,
    addPoints,
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
        addPoints(5);
        setTimerPhase('break');
        setRemainingSeconds(BREAK_DURATION);
      } else {
        setTimerPhase('focus');
        setRemainingSeconds(FOCUS_DURATION);
      }
    }
  }, [remainingSeconds, timerPhase, isRunning, addPoints]);

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

  return (
    <View style={styles.container}>
      <Header title="Focus Flow" subtitle="Move through deep work with ease" />
      <ScrollView contentContainerStyle={styles.content}>
        <InfoCard
          icon="timer"
          title="Pomodoro timer"
          message={`Phase: ${timerPhase.toUpperCase()} • Remaining: ${formatTime(
            remainingSeconds
          )}`}
        />
        <View style={styles.timerControls}>
          <TouchableOpacity style={styles.controlButton} onPress={handleTimerToggle}>
            <Text style={styles.controlLabel}>{isRunning ? 'Pause' : 'Start'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.controlButton} onPress={handleTimerReset}>
            <Text style={styles.controlLabel}>Reset</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Todo loop</Text>
          <View style={styles.addRow}>
            <TextInput
              style={styles.input}
              placeholder="Add a focus task"
              value={newTodo}
              onChangeText={setNewTodo}
              onSubmitEditing={handleAddTodo}
            />
            <TouchableOpacity style={styles.addButton} onPress={handleAddTodo}>
              <MaterialIcons name="add" size={20} color="#f8fafc" />
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
                    color={todo.completed ? '#16a34a' : '#94a3b8'}
                  />
                </TouchableOpacity>
                {isEditing ? (
                  <TextInput
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
                      <TouchableOpacity
                        style={styles.actionButton}
                        onPress={handleSaveEdit}
                      >
                        <Text style={styles.actionText}>Save</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.actionButton}
                        onPress={handleCancelEdit}
                      >
                        <Text style={styles.actionText}>Cancel</Text>
                      </TouchableOpacity>
                    </>
                  ) : (
                    <>
                      <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => handleStartEdit(todo)}
                      >
                        <Text style={styles.actionText}>Edit</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => removeTodo(todo.id)}
                      >
                        <Text style={styles.actionText}>Delete</Text>
                      </TouchableOpacity>
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
        </View>
        <InfoCard icon="emoji-events" title="Streak tracker" message={streakMessage} />
        {allTodosComplete ? (
          <TouchableOpacity style={styles.resetButton} onPress={handleResetDay}>
            <Text style={styles.resetButtonLabel}>Reset day & keep streak</Text>
          </TouchableOpacity>
        ) : null}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#eef2ff'
  },
  content: {
    padding: 24
  },
  timerControls: {
    flexDirection: 'row',
    marginTop: 16,
    justifyContent: 'space-between'
  },
  controlButton: {
    flex: 1,
    backgroundColor: '#0f172a',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    marginRight: 12
  },
  controlLabel: {
    color: '#f8fafc',
    fontWeight: '600',
    fontSize: 16
  },
  section: {
    marginTop: 32
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a'
  },
  addRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#94a3b8',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#0f172a',
    backgroundColor: '#f8fafc'
  },
  addButton: {
    marginLeft: 12,
    backgroundColor: '#16a34a',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center'
  },
  todoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: '#cbd5f5'
  },
  todoToggle: {
    marginRight: 12
  },
  todoText: {
    flex: 1,
    fontSize: 15,
    color: '#0f172a'
  },
  todoTextCompleted: {
    textDecorationLine: 'line-through',
    color: '#64748b'
  },
  todoActions: {
    flexDirection: 'row'
  },
  actionButton: {
    marginLeft: 8
  },
  actionText: {
    color: '#0f172a',
    fontWeight: '600'
  },
  emptyState: {
    marginTop: 12,
    fontSize: 14,
    color: '#64748b'
  },
  todoInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#94a3b8',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 15,
    color: '#0f172a',
    backgroundColor: '#f8fafc'
  },
  resetButton: {
    marginTop: 24,
    backgroundColor: '#0f172a',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center'
  },
  resetButtonLabel: {
    color: '#f8fafc',
    fontWeight: '600',
    fontSize: 16
  }
});

export default FocusFlowScreen;
