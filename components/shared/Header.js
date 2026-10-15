import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { colors, fontSize, spacing } from '../../theme/theme';

// Renders a large module title on the page background, tinted with the module accent.
// `right` is an optional element (such as a close button) aligned with the title.
const Header = ({ title, subtitle, theme, right }) => {
  const isFocused = useIsFocused();

  return (
    <View style={styles.wrapper}>
      {isFocused ? <StatusBar style="dark" /> : null}
      <View style={styles.text}>
        <Text style={[styles.title, { color: theme.accent }]}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      {right ?? null}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xs,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xs
  },
  text: {
    flex: 1
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
