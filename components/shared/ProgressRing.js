import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

// Draws a circular progress indicator with a centred label, or custom centred children.
const ProgressRing = ({
  progress,
  label,
  size = 56,
  strokeWidth = 6,
  trackColor,
  fillColor,
  labelColor,
  children
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.min(Math.max(progress, 0), 1);
  const center = size / 2;

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size}>
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke={trackColor}
          strokeWidth={strokeWidth}
          fill="none"
        />
        {clamped > 0 ? (
          <Circle
            cx={center}
            cy={center}
            r={radius}
            stroke={fillColor}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={`${circumference * clamped} ${circumference}`}
            fill="none"
            transform={`rotate(-90 ${center} ${center})`}
          />
        ) : null}
      </Svg>
      <View style={styles.labelWrap}>
        {children ?? (
          <Text style={[styles.label, { color: labelColor }]}>{label}</Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  labelWrap: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center'
  },
  label: {
    fontSize: 14,
    fontWeight: '600'
  }
});

export default ProgressRing;
