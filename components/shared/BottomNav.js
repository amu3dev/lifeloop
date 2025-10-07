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
    backgroundColor: '#0f172a'
  }
});

export default BottomNav;
