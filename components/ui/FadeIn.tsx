import { useEffect, useRef, type ReactNode } from 'react';
import { Animated, type ViewStyle } from 'react-native';

export interface FadeInProps {
  children: ReactNode;
  /** Milliseconds to wait before starting the fade. Use to stagger siblings. */
  delay?: number;
  /** Fade duration in ms. */
  duration?: number;
  /** Vertical slide distance in px. The view starts at +translateY and lands at 0. */
  translateY?: number;
  style?: ViewStyle;
}

/**
 * Lightweight mount-once fade+slide. Uses the native driver so it stays smooth
 * on low-end Androids. `delay` is what makes stagger cheap: render siblings in
 * order with 40-80ms between them.
 */
export function FadeIn({
  children,
  delay = 0,
  duration = 260,
  translateY = 8,
  style,
}: FadeInProps) {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(progress, {
      toValue: 1,
      duration,
      delay,
      useNativeDriver: true,
    }).start();
  }, [progress, delay, duration]);

  const translateYAnim = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [translateY, 0],
  });

  return (
    <Animated.View
      style={[{ opacity: progress, transform: [{ translateY: translateYAnim }] }, style]}
    >
      {children}
    </Animated.View>
  );
}
