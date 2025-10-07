import React, { useContext } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import Header from '../../components/shared/Header';
import InfoCard from '../../components/shared/InfoCard';
import { AppContext } from '../../context/AppContext';

// Offers quick financial insights for the Smart Wallet module.
const SmartWalletScreen = () => {
  const { state } = useContext(AppContext);

  return (
    <View style={styles.container}>
      <Header title="Smart Wallet" subtitle="Stay on top of your spend" />
      <ScrollView contentContainerStyle={styles.content}>
        <InfoCard
          icon="account-balance-wallet"
          title="Today's Balance"
          message={`You have $${state.walletBalance} ready for planned habits.`}
        />
        <Text style={styles.tip}>
          Add expenses or savings goals to see your loop tighten over time.
        </Text>
      </ScrollView>
    </View>
  );
};

// Applies consistent spacing and text styles to financial summaries.
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc'
  },
  content: {
    padding: 24
  },
  tip: {
    marginTop: 24,
    fontSize: 15,
    color: '#0f172a'
  }
});

export default SmartWalletScreen;
