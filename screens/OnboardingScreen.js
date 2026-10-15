import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { MaterialIcons } from '@expo/vector-icons';
import Button from '../components/shared/Button';
import TimingSettingsForm, { isTimingValid } from '../components/shared/TimingSettingsForm';
import { useAppContext } from '../context/AppContext';
import { colors, fontSize, moduleThemes, radius, spacing } from '../theme/theme';

const theme = moduleThemes.Loop;

const LOOP_STEPS = [
  { icon: 'wb-twilight', title: 'Check in', detail: 'Energy, mood, sleep, and your top 3. About 30 seconds.' },
  { icon: 'hourglass-empty', title: 'Focus', detail: 'Work through your top 3 in 25-minute blocks.' },
  { icon: 'nights-stay', title: 'Review', detail: 'Mark what got done and how the day felt.' }
];

// First-run screen: explains the loop and asks how it should be timed.
const OnboardingScreen = () => {
  const { state, completeOnboarding } = useAppContext();
  const [timing, setTiming] = useState(state.settings);

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.intro}>
          <Text style={styles.eyebrow}>Welcome to LifeLoop</Text>
          <Text style={styles.title}>One small loop, every day</Text>
        </View>

        <View style={styles.steps}>
          {LOOP_STEPS.map((step, index) => (
            <View key={step.title} style={styles.step}>
              <View style={styles.stepIcon}>
                <MaterialIcons name={step.icon} size={20} color={theme.accent} />
              </View>
              <View style={styles.stepText}>
                <Text style={styles.stepTitle}>
                  {index + 1}. {step.title}
                </Text>
                <Text style={styles.stepDetail}>{step.detail}</Text>
              </View>
            </View>
          ))}
        </View>

        <Text style={styles.sectionTitle}>When does your day start and end?</Text>
        <TimingSettingsForm value={timing} onChange={setTiming} theme={theme} />
        <Text style={styles.note}>You can change this any time in settings.</Text>

        <Button
          label="Start my loop"
          icon="arrow-forward"
          onPress={() => completeOnboarding(timing)}
          theme={theme}
          disabled={!isTimingValid(timing)}
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
  intro: {
    paddingHorizontal: spacing.xs,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.sm
  },
  eyebrow: {
    fontSize: fontSize.caption,
    color: colors.inkMuted
  },
  title: {
    marginTop: 2,
    fontSize: fontSize.title,
    fontWeight: '600',
    color: colors.ink
  },
  steps: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.lg,
    gap: spacing.lg
  },
  step: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  stepIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.background,
    marginRight: spacing.md
  },
  stepText: {
    flex: 1
  },
  stepTitle: {
    fontSize: fontSize.body,
    fontWeight: '600',
    color: colors.ink
  },
  stepDetail: {
    marginTop: 2,
    fontSize: fontSize.caption,
    lineHeight: 17,
    color: colors.inkMuted
  },
  sectionTitle: {
    marginTop: spacing.md,
    marginHorizontal: spacing.xs,
    fontSize: fontSize.heading,
    fontWeight: '600',
    color: colors.ink
  },
  note: {
    marginHorizontal: spacing.xs,
    marginBottom: spacing.sm,
    fontSize: fontSize.caption,
    color: colors.inkMuted
  }
});

export default OnboardingScreen;
