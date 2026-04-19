import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View, Text, Platform } from 'react-native';
import { Check } from 'lucide-react-native';
import { Colors, Spacing } from '@/constants/Colors';
import { Fonts } from '@/constants/Typography';
import { ProgressRing } from '@/components/ui/ProgressRing';
import { Shimmer } from '@/components/ui/Shimmer';

export interface OnboardingCompleteRevealProps {
  /** Called when the reveal animation finishes. Parent should then route. */
  onDone: () => void;
  /** First name for a personal touch. */
  firstName?: string;
}

/**
 * Full-screen premium reveal shown after onboarding completes.
 * Sequence (total ~1700ms):
 *   0ms   backdrop fades in
 *   120ms ring fill starts (0 -> 1 over 900ms)
 *   600ms check icon scales in
 *   800ms headline + shimmer sweep
 *   1700ms onDone()
 */
export function OnboardingCompleteReveal({ onDone, firstName }: OnboardingCompleteRevealProps) {
  const backdrop = useRef(new Animated.Value(0)).current;
  const ringFill = useRef(new Animated.Value(0)).current;
  const checkScale = useRef(new Animated.Value(0)).current;
  const headlineOpacity = useRef(new Animated.Value(0)).current;
  const headlineTranslate = useRef(new Animated.Value(8)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.timing(backdrop, { toValue: 1, duration: 220, useNativeDriver: true, easing: Easing.out(Easing.cubic) }),
      Animated.delay(80),
      Animated.parallel([
        Animated.timing(ringFill, { toValue: 1, duration: 900, useNativeDriver: false, easing: Easing.out(Easing.cubic) }),
        Animated.sequence([
          Animated.delay(520),
          Animated.spring(checkScale, { toValue: 1, useNativeDriver: true, friction: 6, tension: 120 }),
        ]),
        Animated.sequence([
          Animated.delay(720),
          Animated.parallel([
            Animated.timing(headlineOpacity, { toValue: 1, duration: 420, useNativeDriver: true, easing: Easing.out(Easing.cubic) }),
            Animated.timing(headlineTranslate, { toValue: 0, duration: 420, useNativeDriver: true, easing: Easing.out(Easing.cubic) }),
          ]),
        ]),
      ]),
      Animated.delay(700),
    ]).start(({ finished }) => {
      if (finished) onDone();
    });
  }, [backdrop, ringFill, checkScale, headlineOpacity, headlineTranslate, onDone]);

  // Pull animated progress value for the ring. We drive the ring manually
  // via its `progress` prop, which animates internally - so here we sync by
  // remapping to a discrete set of checkpoints is unnecessary. We keep it
  // simple: the ring's own 900ms fill lines up with our phase.
  // We pass progress as a plain number by reading the animated value's
  // current state via addListener, but ProgressRing animates when progress
  // changes - so stepping 0 -> 1 once triggers its own eased fill.
  return (
    <Animated.View
      style={[styles.overlay, { opacity: backdrop }]}
      pointerEvents="auto"
      accessibilityLiveRegion="polite"
      accessibilityLabel="Setup complete"
    >
      <View style={styles.content}>
        <View style={styles.ringWrap}>
          <ProgressRing progress={1} size={140} strokeWidth={6} durationMs={900}>
            <Animated.View
              style={{
                transform: [{ scale: checkScale }],
                opacity: checkScale,
              }}
            >
              <View style={styles.checkBubble}>
                <Check size={28} color={Colors.white} strokeWidth={2.5} />
              </View>
            </Animated.View>
          </ProgressRing>
        </View>

        <Animated.View
          style={{
            opacity: headlineOpacity,
            transform: [{ translateY: headlineTranslate }],
          }}
        >
          <Shimmer durationMs={1400} delayMs={200}>
            <Text style={styles.headline} accessibilityRole="header">
              {firstName ? `You're all set, ${firstName}` : "You're all set"}
            </Text>
          </Shimmer>
          <Text style={styles.subhead}>Your tax assistant is ready.</Text>
        </Animated.View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Platform.OS === 'web' ? 'rgba(255,255,255,0.98)' : 'rgba(0,0,0,0.96)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
  },
  content: {
    alignItems: 'center',
    gap: Spacing.xl,
  },
  ringWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkBubble: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.electricBlue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headline: {
    fontFamily: Fonts.lexend.semiBold,
    fontSize: 28,
    lineHeight: 34,
    color: Colors.white,
    textAlign: 'center',
    letterSpacing: -0.4,
    paddingHorizontal: Spacing.md,
    paddingVertical: 4,
  },
  subhead: {
    fontFamily: Fonts.sourceSans.regular,
    fontSize: 15,
    lineHeight: 22,
    color: Colors.lightGrey,
    textAlign: 'center',
    marginTop: Spacing.sm,
  },
});
