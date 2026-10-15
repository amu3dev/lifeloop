import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, fontSize, radius, spacing } from '../../theme/theme';

// Displays a concise card with an icon and message for quick status updates.
const InfoCard = ({ icon = 'info', title, message, theme }) => {
  return (
    <View style={styles.card}>
      <View style={[styles.iconBadge, { backgroundColor: theme.background }]}>
        <MaterialIcons name={icon} size={20} color={theme.accent} />
      </View>
      <View style={styles.content}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.message}>{message}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.lg
  },
  iconBadge: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md
  },
  content: {
    flex: 1
  },
  title: {
    fontSize: fontSize.body,
    fontWeight: '600',
    color: colors.ink
  },
  message: {
    marginTop: 2,
    fontSize: fontSize.body,
    lineHeight: 21,
    color: colors.inkMuted
  }
});

export default InfoCard;
