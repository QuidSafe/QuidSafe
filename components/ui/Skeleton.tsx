// Skeleton loading component — Soft UI style shimmer effect

import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, ViewStyle } from 'react-native';
import { Colors, BorderRadius } from '@/constants/Colors';
import { useTheme } from '@/lib/ThemeContext';

interface SkeletonProps {
  width?: number | `${number}%`;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export function Skeleton({ width = '100%', height = 20, borderRadius = BorderRadius.input, style }: SkeletonProps) {
  const { isDark } = useTheme();
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.7, duration: 800, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.3, duration: 800, useNativeDriver: true }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        styles.skeleton,
        { width, height, borderRadius, opacity, backgroundColor: isDark ? Colors.grey[700] : Colors.grey[200] },
        style,
      ]}
    />
  );
}

export function SkeletonCard() {
  const { colors } = useTheme();
  return (
    <Animated.View style={[styles.card, { backgroundColor: colors.surface }]}>
      <Skeleton width="40%" height={14} />
      <Skeleton width="60%" height={32} style={{ marginTop: 8 }} />
      <Skeleton width="80%" height={14} style={{ marginTop: 8 }} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: Colors.grey[200],
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.card,
    padding: 24,
    gap: 4,
  },
});
