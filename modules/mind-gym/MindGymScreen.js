import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity
} from 'react-native';
import Header from '../../components/shared/Header';
import InfoCard from '../../components/shared/InfoCard';
import { useAppContext } from '../../context/AppContext';

const generateTarget = () => Math.floor(Math.random() * 100) + 1;

// Builds a lightweight number guessing game that rewards correct answers.
const MindGymScreen = () => {
  const { state, addPoints } = useAppContext();
  const [target, setTarget] = useState(() => generateTarget());
  const [guess, setGuess] = useState('');
  const [feedback, setFeedback] = useState(
    'Guess a number between 1 and 100 to flex your focus.'
  );
  const [attempts, setAttempts] = useState(0);

  const handleGuess = () => {
    const numericGuess = Number.parseInt(guess, 10);

    if (!Number.isFinite(numericGuess)) {
      setFeedback('Enter a valid number to continue the game.');
      return;
    }

    setAttempts(prev => prev + 1);

    if (numericGuess === target) {
      addPoints(10);
      setFeedback(
        `Correct! You nailed it in ${attempts + 1} tries. Points awarded: +10.`
      );
      setTarget(generateTarget());
      setGuess('');
      setAttempts(0);
      return;
    }

    if (numericGuess < target) {
      setFeedback('Higher — aim a bit above that number.');
      return;
    }

    setFeedback('Lower — the target number sits below that guess.');
  };

  const pointsMessage = useMemo(
    () =>
      `Total points: ${state.points}. Keep guessing correctly to boost your score.`,
    [state.points]
  );

  return (
    <View style={styles.container}>
      <Header title="Mind Gym" subtitle="Prime your mindset for the day" />
      <ScrollView contentContainerStyle={styles.content}>
        <InfoCard
          icon="psychology"
          title="Focus Warm Up"
          message={pointsMessage}
        />
        <View style={styles.gameCard}>
          <Text style={styles.instructions}>{feedback}</Text>
          <TextInput
            style={styles.input}
            keyboardType="number-pad"
            placeholder="Enter your guess"
            value={guess}
            onChangeText={setGuess}
            returnKeyType="done"
          />
          <TouchableOpacity style={styles.button} onPress={handleGuess}>
            <Text style={styles.buttonLabel}>Submit Guess</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc'
  },
  content: {
    padding: 24
  },
  gameCard: {
    marginTop: 24,
    backgroundColor: '#e2e8f0',
    borderRadius: 16,
    padding: 20
  },
  instructions: {
    fontSize: 15,
    lineHeight: 22,
    color: '#1e293b'
  },
  input: {
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#94a3b8',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#0f172a'
  },
  button: {
    marginTop: 16,
    backgroundColor: '#0f172a',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center'
  },
  buttonLabel: {
    color: '#f8fafc',
    fontWeight: '600',
    fontSize: 16
  }
});

export default MindGymScreen;
