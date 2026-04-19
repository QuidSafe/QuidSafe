import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View, Platform } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import { Colors } from '@/constants/Colors';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export interface ProgressRingProps {
  /** 0 to 1. Ignored when `spin` is true. */
  progress?: number;
  size?: number;
  strokeWidth?: number;
  /** Animation duration for progress changes, in ms. */
  durationMs?: number;
  /** Optional children rendered centered inside the ring. */
  children?: React.ReactNode;
  /** Track (background) colour. */
  trackColor?: string;
  /** Progress colour - defaults to a subtle blue gradient. */
  color?: string;
  /** When true, renders a perpetually rotating arc (brand spinner). Ignores `progress`. */
  spin?: boolean;
  /** Start angle for the progress arc, in degrees. 0 = top. */
  startAngle?: number;
}

/**
 * Signature concentric ring - used for the tax-pot hero, onboarding reveal,
 * loading states, and empty-state glyphs. Single source of the brand motif.
 *
 * When `spin` is true it renders an infinitely rotating quarter-arc - the
 * brand's loading spinner.
 */
export function ProgressRing({
  progress,
  size = 120,
  strokeWidth = 8,
  durationMs = 1200,
  children,
  trackColor,
  color,
  spin = false,
  startAngle = 0,
}: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  // Animated value holds progress 0..1 (or rotation 0..1 when spinning).
  const animated = useRef(new Animated.Value(spin ? 0 : clamp01(progress ?? 0))).current;

  useEffect(() => {
    if (spin) {
      animated.setValue(0);
      const loop = Animated.loop(
        Animated.timing(animated, {
          toValue: 1,
          duration: 1100,
          easing: Easing.linear,
          // SVG transforms don't work with native driver on web; keep JS driver.
          useNativeDriver: false,
        }),
      );
      loop.start();
      return () => loop.stop();
    }

    Animated.timing(animated, {
      toValue: clamp01(progress ?? 0),
      duration: durationMs,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [progress, spin, durationMs, animated]);

  // Dash-offset drives the progress arc. When spinning, we hold a fixed 25%
  // arc and animate rotation instead.
  const dashOffset = spin
    ? circumference * 0.75
    : animated.interpolate({
        inputRange: [0, 1],
        outputRange: [circumference, 0],
      });

  const rotation = spin
    ? animated.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg'],
      })
    : `${startAngle - 90}deg`;

  const progressColor = color ?? Colors.electricBlue;
  const bgColor = trackColor ?? 'rgba(0, 102, 255, 0.08)';

  return (
    <View style={[styles.root, { width: size, height: size }]}>
      <Animated.View
        style={[
          styles.ringWrap,
          {
            width: size,
            height: size,
            transform: [{ rotate: rotation }],
          },
        ]}
        pointerEvents="none"
      >
        <Svg width={size} height={size}>
          <Defs>
            <LinearGradient id="qsRingGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor={progressColor} stopOpacity="1" />
              <Stop offset="100%" stopColor={progressColor} stopOpacity="0.65" />
            </LinearGradient>
          </Defs>
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={bgColor}
            strokeWidth={strokeWidth}
            fill="none"
          />
          <AnimatedCircle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={color ? progressColor : 'url(#qsRingGradient)'}
            strokeWidth={strokeWidth}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset as unknown as number}
          />
        </Svg>
      </Animated.View>
      {children ? <View style={styles.content}>{children}</View> : null}
    </View>
  );
}

/**
 * Brand loading spinner - the concentric ring motif, perpetually rotating.
 * Replace `ActivityIndicator` with this everywhere that shows a long-form
 * load (page skeletons, bank-sync in-flight, invoice PDF generation).
 */
export function BrandSpinner({ size = 24, color }: { size?: number; color?: string }) {
  return (
    <ProgressRing
      spin
      size={size}
      strokeWidth={Math.max(2, Math.round(size / 10))}
      color={color}
      trackColor="rgba(255, 255, 255, 0.06)"
    />
  );
}

function clamp01(n: number): number {
  if (!Number.isFinite(n)) return 0;
  if (n < 0) return 0;
  if (n > 1) return 1;
  return n;
}

const styles = StyleSheet.create({
  root: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  ringWrap: {
    position: 'absolute',
    top: 0,
    left: 0,
    // Web fallback: Platform-conditional is overkill here, the transform works
    // fine on both. But SVG doesn't auto-size on web without explicit display.
    ...(Platform.OS === 'web' ? { display: 'flex' as const } : null),
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
