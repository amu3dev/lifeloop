import React, { useMemo, useState } from 'react';
import { Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Header from '../../components/shared/Header';
import InfoCard from '../../components/shared/InfoCard';
import Card from '../../components/shared/Card';
import Button from '../../components/shared/Button';
import TextField from '../../components/shared/TextField';
import { useAppContext } from '../../context/AppContext';
import { colors, fontSize, moduleThemes, spacing } from '../../theme/theme';

const theme = moduleThemes.MindGym;

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
    <SafeAreaView edges={['top']} style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets
        showsVerticalScrollIndicator={false}
      >
        <Header title="Mind Gym" subtitle="Prime your mindset for the day" theme={theme} />
        <InfoCard
          icon="psychology"
          title="Focus Warm Up"
          message={pointsMessage}
          theme={theme}
        />
        <Card>
          <Text style={styles.instructions}>{feedback}</Text>
          <TextField
            style={styles.input}
            keyboardType="number-pad"
            placeholder="Enter your guess"
            value={guess}
            onChangeText={setGuess}
            returnKeyType="done"
          />
          <Button label="Submit Guess" onPress={handleGuess} theme={theme} />
        </Card>
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
  instructions: {
    fontSize: fontSize.body,
    lineHeight: 22,
    color: theme.ink
  },
  input: {
    marginVertical: spacing.lg
  }
});

export default MindGymScreen;
