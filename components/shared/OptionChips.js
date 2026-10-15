import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, fontSize, radius, spacing } from '../../theme/theme';

// Single-choice row of pill chips; the selected chip fills with the accent.
const OptionChips = ({ options, value, onChange, theme, style }) => (
  <View style={[styles.row, style]}>
    {options.map(option => {
      const isActive = option.value === value;
      const foreground = isActive ? colors.surface : colors.ink;

      return (
        <TouchableOpacity
          key={String(option.value)}
          style={[
            styles.chip,
            isActive && { backgroundColor: theme.accent, borderColor: theme.accent }
          ]}
          onPress={() => onChange(option.value)}
          activeOpacity={0.85}
          accessibilityRole="radio"
          accessibilityState={{ selected: isActive }}
          accessibilityLabel={option.accessibilityLabel ?? option.label}
        >
          {option.icon ? (
            <MaterialIcons
              name={option.icon}
              size={18}
              color={foreground}
              style={option.label ? styles.icon : null}
            />
          ) : null}
          {option.label ? (
            <Text style={[styles.label, { color: foreground }]}>{option.label}</Text>
          ) : null}
        </TouchableOpacity>
      );
    })}
  </View>
);

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md + 2,
    borderRadius: radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    backgroundColor: colors.surface
  },
  icon: {
    marginRight: spacing.xs
  },
  label: {
    fontSize: fontSize.body,
    fontWeight: '500'
  }
});

export default OptionChips;
