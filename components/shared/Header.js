import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { colors, fontSize, spacing } from '../../theme/theme';

// Renders a large module title on the page background, tinted with the module accent.
const Header = ({ title, subtitle, theme }) => {
  const isFocused = useIsFocused();

  return (
    <View style={styles.wrapper}>
      {isFocused ? <StatusBar style="dark" /> : null}
      <Text style={[styles.title, { color: theme.accent }]}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    paddingHorizontal: spacing.xs,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xs
  },
  title: {
    fontSize: fontSize.title,
    fontWeight: '600'
  },
  subtitle: {
    marginTop: 2,
    fontSize: fontSize.caption,
    color: colors.inkMuted
  }
});

export default Header;
