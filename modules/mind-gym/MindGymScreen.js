import React, { useContext } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import Header from '../../components/shared/Header';
import InfoCard from '../../components/shared/InfoCard';
import { AppContext } from '../../context/AppContext';

// Shows the entry point for the Mind Gym module with contextual data.
const MindGymScreen = () => {
  const { state } = useContext(AppContext);

  return (
    <View style={styles.container}>
      <Header title="Mind Gym" subtitle="Prime your mindset for the day" />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.greeting}>Welcome back, {state.userName}!</Text>
        <InfoCard
          icon="self-improvement"
          title="Current Mood"
          message={`Your mood is tracking as ${state.moodLevel}. Start a 5-minute clarity session.`}
        />
      </ScrollView>
    </View>
  );
};

// Provides spacing guidelines and text styling for the module.
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc'
  },
  content: {
    padding: 24
  },
  greeting: {
    fontSize: 20,
    fontWeight: '600',
    color: '#0f172a'
  }
});

export default MindGymScreen;
