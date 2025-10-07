import React from 'react';
import { View, StyleSheet } from 'react-native';
import { BottomTabBar } from '@react-navigation/bottom-tabs';

// Wraps the default BottomTabBar to give consistent padding and elevation.
const BottomNav = (props) => {
  return (
    <View style={styles.container}>
      <BottomTabBar {...props} />
    </View>
  );
};

// Applies light theming to match the rest of the app shell.
const styles = StyleSheet.create({
  container: {
    backgroundColor: '#0f172a',
    paddingTop: 8,
    paddingBottom: 4,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#0f172a',
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: -2 },
    elevation: 12,
    overflow: 'hidden'
  }
});

export default BottomNav;
