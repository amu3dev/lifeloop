import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Renders a branded header that can be shared between screens.
const Header = ({ title, subtitle }) => {
  return (
    <SafeAreaView edges={['top']} style={styles.wrapper}>
      <View>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
    </SafeAreaView>
  );
};

// Defines visual tokens for the header presentation.
const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: '#0f172a',
    paddingHorizontal: 24,
    paddingBottom: 16,
    paddingTop: 12
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#f8fafc'
  },
  subtitle: {
    marginTop: 4,
    fontSize: 14,
    color: '#cbd5f5'
  }
});

export default Header;
