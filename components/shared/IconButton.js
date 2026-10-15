import React from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, radius } from '../../theme/theme';

// Round icon-only button, used for close and settings actions in headers.
const IconButton = ({ icon, label, onPress, color = colors.ink, style }) => (
  <TouchableOpacity
    style={[styles.button, style]}
    onPress={onPress}
    hitSlop={8}
    accessibilityRole="button"
    accessibilityLabel={label}
  >
    <MaterialIcons name={icon} size={22} color={color} />
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  button: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface
  }
});

export default IconButton;
