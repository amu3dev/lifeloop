import React from 'react';
import { View, StyleSheet } from 'react-native';
import { colors, radius, spacing } from '../../theme/theme';

// Wraps content in the white surface card used across module screens.
const Card = ({ style, children }) => <View style={[styles.card, style]}>{children}</View>;

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.lg
  }
});

export default Card;
