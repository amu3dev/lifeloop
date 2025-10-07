import React, { useContext } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import Header from '../../components/shared/Header';
import InfoCard from '../../components/shared/InfoCard';
import { AppContext } from '../../context/AppContext';

// Presents a lightweight dashboard for the Meal Mood module.
const MealMoodScreen = () => {
  const { state } = useContext(AppContext);

  return (
    <View style={styles.container}>
      <Header title="Meal Mood" subtitle="Plan meals that match your energy" />
      <ScrollView contentContainerStyle={styles.content}>
        <InfoCard
          icon="restaurant"
          title="Suggested Pairing"
          message="Try a protein-rich lunch to maintain stable energy." />
        <Text style={styles.note}>
          Wallet balance snapshot: ${state.walletBalance}. Consider meal-prep options.
        </Text>
      </ScrollView>
    </View>
  );
};

// Controls layout spacing and paragraph typography for the module.
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f1f5f9'
  },
  content: {
    padding: 24
  },
  note: {
    marginTop: 24,
    fontSize: 15,
    lineHeight: 22,
    color: '#1e293b'
  }
});

export default MealMoodScreen;
