import { useEffect, useRef, type ReactNode } from 'react';
import { Animated, Easing, StyleSheet, View, type ViewStyle, type StyleProp } from 'react-native';

export interface ShimmerProps {
  children: ReactNode;
  /** Trigger shimmer on mount. Pass a changing key to re-trigger. Default true. */
  active?: boolean;
  /** ms. Default 1400. */
  durationMs?: number;
  /** ms delay before the sweep starts. Default 0. */
  delayMs?: number;
  /** Sweep only once (default) or loop. */
  loop?: boolean;
  style?: StyleProp<ViewStyle>;
}

/**
 * One-shot diagonal shimmer over children - used to underscore premium
 * moments (first tax reveal, subscription confirmed). Deliberately subtle:
 * a single swipe of light, not a disco.
 */
export function Shimmer({ children, active = true, durationMs = 1400, delayMs = 0, loop = false, style }: ShimmerProps) {
  const translate = useRef(new Animated.Value(-1)).current;

  useEffect(() => {
    if (!active) return;
    const run = () => {
      translate.setValue(-1);
      const tween = Animated.timing(translate, {
        toValue: 1,
        duration: durationMs,
        delay: delayMs,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      });
      if (loop) {
        Animated.loop(tween).start();
      } else {
        tween.start();
      }
    };
    run();
  }, [active, durationMs, delayMs, loop, translate]);

  const translateX = translate.interpolate({
    inputRange: [-1, 1],
    outputRange: ['-120%', '120%'],
  });

  return (
    <View style={[styles.root, style]}>
      {children}
      {active ? (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.sweep,
            { transform: [{ translateX }, { skewX: '-18deg' }] },
          ]}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    position: 'relative',
    overflow: 'hidden',
  },
  sweep: {
    position: 'absolute',
    top: -10,
    bottom: -10,
    left: 0,
    width: '40%',
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
    opacity: 0.8,
  },
});
