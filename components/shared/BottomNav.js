import React from 'react';
import { View, StyleSheet } from 'react-native';
import { BottomTabBar } from '@react-navigation/bottom-tabs';
import { colors, spacing } from '../../theme/theme';

// Wraps the default BottomTabBar with a light surface and hairline divider.
const BottomNav = (props) => {
  return (
    <View style={styles.container}>
      <BottomTabBar {...props} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    paddingTop: spacing.xs
  }
});

export default BottomNav;
