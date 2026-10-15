import React from 'react';
import { Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, fontSize, radius, spacing } from '../../theme/theme';

// Pill button in the module accent: solid for primary actions, tinted for secondary ones.
const Button = ({ label, onPress, theme, variant = 'primary', icon, style, disabled = false }) => {
  const isPrimary = variant === 'primary';
  const foreground = isPrimary ? colors.surface : theme.accent;

  return (
    <TouchableOpacity
      style={[
        styles.button,
        { backgroundColor: isPrimary ? theme.accent : theme.background },
        disabled && styles.disabled,
        style
      ]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.85}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
    >
      {icon ? (
        <MaterialIcons name={icon} size={20} color={foreground} style={styles.icon} />
      ) : null}
      <Text style={[styles.label, { color: foreground }]}>{label}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.pill,
    paddingVertical: spacing.md + 2,
    paddingHorizontal: spacing.xl
  },
  disabled: {
    opacity: 0.4
  },
  icon: {
    marginRight: spacing.xs
  },
  label: {
    fontSize: fontSize.body,
    fontWeight: '600'
  }
});

export default Button;
