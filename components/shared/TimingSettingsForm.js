import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import OptionChips from './OptionChips';
import { CITIES } from '../../lib/cities';
import { formatClock, formatTime, getPrayerTimes, shiftTime } from '../../lib/loopTime';
import { colors, fontSize, radius, spacing } from '../../theme/theme';

const MODES = [
  {
    value: 'fixed',
    icon: 'schedule',
    title: 'Fixed times',
    detail: 'You pick when your day starts and winds down.'
  },
  {
    value: 'prayer',
    icon: 'brightness-4',
    title: 'Prayer times',
    detail: 'Check in after Fajr, review after Isha. Calculated on your phone.'
  }
];

// Steps a "HH:MM" time in 30-minute increments.
const TimeStepper = ({ label, value, onChange, theme }) => (
  <View style={styles.stepperRow}>
    <Text style={styles.stepperLabel}>{label}</Text>
    <View style={styles.stepper}>
      <TouchableOpacity
        onPress={() => onChange(shiftTime(value, -30))}
        style={[styles.stepButton, { backgroundColor: theme.background }]}
        accessibilityLabel={`${label} 30 minutes earlier`}
      >
        <MaterialIcons name="remove" size={18} color={theme.accent} />
      </TouchableOpacity>
      <Text style={styles.stepValue}>{formatClock(value)}</Text>
      <TouchableOpacity
        onPress={() => onChange(shiftTime(value, 30))}
        style={[styles.stepButton, { backgroundColor: theme.background }]}
        accessibilityLabel={`${label} 30 minutes later`}
      >
        <MaterialIcons name="add" size={18} color={theme.accent} />
      </TouchableOpacity>
    </View>
  </View>
);

// Lets the user choose how the loop is timed: fixed clock times or prayer times.
const TimingSettingsForm = ({ value, onChange, theme }) => {
  const update = patch => onChange({ ...value, ...patch });
  const prayerTimes =
    value.timingMode === 'prayer' ? getPrayerTimes(value.cityId, new Date()) : null;

  return (
    <View style={styles.wrapper}>
      {MODES.map(mode => {
        const isActive = value.timingMode === mode.value;

        return (
          <TouchableOpacity
            key={mode.value}
            style={[styles.modeCard, isActive && { borderColor: theme.accent }]}
            onPress={() => update({ timingMode: mode.value })}
            activeOpacity={0.85}
            accessibilityRole="radio"
            accessibilityState={{ selected: isActive }}
          >
            <MaterialIcons
              name={mode.icon}
              size={22}
              color={isActive ? theme.accent : colors.inkSubtle}
            />
            <View style={styles.modeText}>
              <Text style={styles.modeTitle}>{mode.title}</Text>
              <Text style={styles.modeDetail}>{mode.detail}</Text>
            </View>
            <MaterialIcons
              name={isActive ? 'radio-button-checked' : 'radio-button-unchecked'}
              size={22}
              color={isActive ? theme.accent : colors.border}
            />
          </TouchableOpacity>
        );
      })}

      {value.timingMode === 'fixed' ? (
        <View style={styles.detailCard}>
          <TimeStepper
            label="Day starts"
            value={value.wakeTime}
            onChange={wakeTime => update({ wakeTime })}
            theme={theme}
          />
          <TimeStepper
            label="Wind down"
            value={value.windDownTime}
            onChange={windDownTime => update({ windDownTime })}
            theme={theme}
          />
          <Text style={styles.hint}>Late nights until 4:00 AM still count toward the same day.</Text>
        </View>
      ) : (
        <View style={styles.detailCard}>
          <Text style={styles.stepperLabel}>Your city</Text>
          <OptionChips
            options={CITIES.map(city => ({ value: city.id, label: city.name }))}
            value={value.cityId}
            onChange={cityId => update({ cityId })}
            theme={theme}
            style={styles.cities}
          />
          {prayerTimes ? (
            <Text style={styles.hint}>
              Today: Fajr {formatTime(prayerTimes.fajr)}, Isha {formatTime(prayerTimes.isha)}. No
              location access needed.
            </Text>
          ) : null}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    gap: spacing.sm
  },
  modeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.surface,
    padding: spacing.lg
  },
  modeText: {
    flex: 1,
    marginHorizontal: spacing.md
  },
  modeTitle: {
    fontSize: fontSize.body,
    fontWeight: '600',
    color: colors.ink
  },
  modeDetail: {
    marginTop: 2,
    fontSize: fontSize.caption,
    lineHeight: 17,
    color: colors.inkMuted
  },
  detailCard: {
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.lg
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  stepperLabel: {
    fontSize: fontSize.body,
    fontWeight: '600',
    color: colors.ink
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  stepButton: {
    width: 32,
    height: 32,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center'
  },
  stepValue: {
    minWidth: 84,
    textAlign: 'center',
    fontSize: fontSize.body,
    fontVariant: ['tabular-nums'],
    color: colors.ink
  },
  cities: {
    marginTop: -spacing.xs
  },
  hint: {
    fontSize: fontSize.caption,
    lineHeight: 17,
    color: colors.inkMuted
  }
});

export default TimingSettingsForm;
