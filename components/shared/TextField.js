import React from 'react';
import { TextInput, StyleSheet } from 'react-native';
import { colors, fontSize, radius, spacing } from '../../theme/theme';

// Themed text input for forms that sit on a surface card.
const TextField = ({ style, ...props }) => (
  <TextInput
    placeholderTextColor={colors.inkSubtle}
    style={[styles.input, style]}
    {...props}
  />
);

const styles = StyleSheet.create({
  input: {
    backgroundColor: colors.background,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    fontSize: fontSize.body,
    color: colors.ink
  }
});

export default TextField;
