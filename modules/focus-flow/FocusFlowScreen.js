import React, { useContext } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import Header from '../../components/shared/Header';
import InfoCard from '../../components/shared/InfoCard';
import { AppContext } from '../../context/AppContext';

// Highlights the user's focus metrics for the Focus Flow module.
const FocusFlowScreen = () => {
  const { state } = useContext(AppContext);

  return (
    <View style={styles.container}>
      <Header title="Focus Flow" subtitle="Move through deep work with ease" />
      <ScrollView contentContainerStyle={styles.content}>
        <InfoCard
          icon="timer"
          title="Focus Minutes"
          message={`You logged ${state.focusMinutesToday} focus minutes today. Start another session.`}
        />
        <Text style={styles.encouragement}>
          Engage the mind gym module to warm up before the next focus sprint.
        </Text>
      </ScrollView>
    </View>
  );
};

// Sets consistent colors and spacing for productivity stats.
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#eef2ff'
  },
  content: {
    padding: 24
  },
  encouragement: {
    marginTop: 24,
    fontSize: 15,
    lineHeight: 22,
    color: '#1e293b'
  }
});

export default FocusFlowScreen;
