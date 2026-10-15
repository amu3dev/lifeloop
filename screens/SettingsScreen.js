import React, { useState } from 'react';
import { Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Header from '../components/shared/Header';
import Button from '../components/shared/Button';
import TimingSettingsForm from '../components/shared/TimingSettingsForm';
import { useAppContext } from '../context/AppContext';
import { colors, fontSize, moduleThemes, spacing } from '../theme/theme';

const theme = moduleThemes.Loop;

// Changes how the loop is timed after onboarding.
const SettingsScreen = ({ navigation }) => {
  const { state, updateSettings } = useAppContext();
  const [timing, setTiming] = useState(state.settings);

  const handleSave = () => {
    updateSettings({
      timingMode: timing.timingMode,
      wakeTime: timing.wakeTime,
      windDownTime: timing.windDownTime,
      cityId: timing.cityId
    });
    navigation.goBack();
  };

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Header title="Settings" subtitle="How your loop is timed" theme={theme} />
        <TimingSettingsForm value={timing} onChange={setTiming} theme={theme} />
        <Text style={styles.note}>
          Switching modes can move today's boundary, so check-ins near midnight or Fajr may land on
          a different day.
        </Text>
        <Button label="Save" onPress={handleSave} theme={theme} />
        <Button label="Cancel" onPress={() => navigation.goBack()} theme={theme} variant="secondary" />
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
  note: {
    marginHorizontal: spacing.xs,
    fontSize: fontSize.caption,
    lineHeight: 17,
    color: colors.inkMuted
  }
});

export default SettingsScreen;
