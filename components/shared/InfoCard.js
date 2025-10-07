import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

// Displays a concise card with an icon and message for quick status updates.
const InfoCard = ({ icon = 'info', title, message }) => {
  return (
    <View style={styles.card}>
      <MaterialIcons name={icon} size={28} color="#0f172a" style={styles.icon} />
      <View style={styles.content}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.message}>{message}</Text>
      </View>
    </View>
  );
};

// Crafts a reusable visual layout for module summaries.
const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e2e8f0',
    borderRadius: 16,
    padding: 16,
    marginTop: 16
  },
  icon: {
    marginRight: 12
  },
  content: {
    flex: 1
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a'
  },
  message: {
    marginTop: 4,
    fontSize: 13,
    color: '#1e293b'
  }
});

export default InfoCard;
