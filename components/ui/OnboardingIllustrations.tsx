import { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet } from 'react-native';
import { PoundSterling, Check, Pencil, Lock, CheckCircle } from 'lucide-react-native';
import { Colors } from '@/constants/Colors';

const SIZE = 200;

/* ------------------------------------------------------------------ */
/*  Illustration 1 — Welcome (Shield + Pound + Orbiting Circles)       */
/* ------------------------------------------------------------------ */
export function WelcomeIllustration() {
  const scaleAnim = useRef(new Animated.Value(0.5)).current;
  const orbit1 = useRef(new Animated.Value(0)).current;
  const orbit2 = useRef(new Animated.Value(0)).current;
  const orbit3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Entrance: spring scale
    Animated.spring(scaleAnim, {
      toValue: 1,
      tension: 60,
      friction: 7,
      useNativeDriver: true,
    }).start();

    // Continuous orbit/pulse for floating circles
    const loopAnim = (anim: Animated.Value, duration: number) =>
      Animated.loop(
        Animated.timing(anim, {
          toValue: 1,
          duration,
          useNativeDriver: true,
        })
      ).start();

    loopAnim(orbit1, 3000);
    loopAnim(orbit2, 4000);
    loopAnim(orbit3, 3500);
  }, [scaleAnim, orbit1, orbit2, orbit3]);

  // Orbit positions using sin/cos via interpolation
  const makeOrbit = (anim: Animated.Value, radius: number, offsetDeg: number) => {
    const translateX = anim.interpolate({
      inputRange: [0, 0.25, 0.5, 0.75, 1],
      outputRange: [
        Math.cos((offsetDeg * Math.PI) / 180) * radius,
        Math.cos(((offsetDeg + 90) * Math.PI) / 180) * radius,
        Math.cos(((offsetDeg + 180) * Math.PI) / 180) * radius,
        Math.cos(((offsetDeg + 270) * Math.PI) / 180) * radius,
        Math.cos((offsetDeg * Math.PI) / 180) * radius,
      ],
    });
    const translateY = anim.interpolate({
      inputRange: [0, 0.25, 0.5, 0.75, 1],
      outputRange: [
        Math.sin((offsetDeg * Math.PI) / 180) * radius,
        Math.sin(((offsetDeg + 90) * Math.PI) / 180) * radius,
        Math.sin(((offsetDeg + 180) * Math.PI) / 180) * radius,
        Math.sin(((offsetDeg + 270) * Math.PI) / 180) * radius,
        Math.sin((offsetDeg * Math.PI) / 180) * radius,
      ],
    });
    const scale = anim.interpolate({
      inputRange: [0, 0.5, 1],
      outputRange: [1, 1.3, 1],
    });
    return { translateX, translateY, scale };
  };

  const o1 = makeOrbit(orbit1, 80, 0);
  const o2 = makeOrbit(orbit2, 75, 120);
  const o3 = makeOrbit(orbit3, 85, 240);

  return (
    <View style={s.container}>
      {/* Floating circles */}
      <Animated.View
        style={[
          s.floatingCircle,
          s.floatingCircle1,
          { transform: [{ translateX: o1.translateX }, { translateY: o1.translateY }, { scale: o1.scale }] },
        ]}
      />
      <Animated.View
        style={[
          s.floatingCircle,
          s.floatingCircle2,
          { transform: [{ translateX: o2.translateX }, { translateY: o2.translateY }, { scale: o2.scale }] },
        ]}
      />
      <Animated.View
        style={[
          s.floatingCircle,
          s.floatingCircle3,
          { transform: [{ translateX: o3.translateX }, { translateY: o3.translateY }, { scale: o3.scale }] },
        ]}
      />

      {/* Shield */}
      <Animated.View style={[s.shield, { transform: [{ scale: scaleAnim }] }]}>
        <View style={s.shieldTop} />
        <View style={s.shieldBottom} />
        {/* Pound icon */}
        <View style={s.shieldIconWrap}>
          <PoundSterling size={36} color={Colors.accent} strokeWidth={1.5} />
        </View>
      </Animated.View>
    </View>
  );
}

/* ------------------------------------------------------------------ */
/*  Illustration 2 — Business (Clipboard + Text Lines + Check + Pen)   */
/* ------------------------------------------------------------------ */
export function BusinessIllustration() {
  const slideY = useRef(new Animated.Value(40)).current;
  const fadeIn = useRef(new Animated.Value(0)).current;
  const penFloat = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Entrance: slide up + fade
    Animated.parallel([
      Animated.spring(slideY, {
        toValue: 0,
        tension: 60,
        friction: 9,
        useNativeDriver: true,
      }),
      Animated.timing(fadeIn, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();

    // Pen floats up and down
    Animated.loop(
      Animated.sequence([
        Animated.timing(penFloat, {
          toValue: -8,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(penFloat, {
          toValue: 8,
          duration: 1200,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [slideY, fadeIn, penFloat]);

  return (
    <View style={s.container}>
      <Animated.View
        style={[
          s.clipboardWrap,
          { transform: [{ translateY: slideY }], opacity: fadeIn },
        ]}
      >
        {/* Clipboard clip */}
        <View style={s.clipboardClip} />

        {/* Document body */}
        <View style={s.clipboard}>
          {/* Text lines */}
          <View style={[s.textLine, { width: '80%' }]} />
          <View style={[s.textLine, { width: '60%' }]} />
          <View style={[s.textLine, { width: '70%' }]} />
          <View style={[s.textLine, { width: '50%' }]} />

          {/* Checkmark */}
          <View style={s.checkCircle}>
            <Check size={18} color={Colors.white} strokeWidth={1.5} />
          </View>
        </View>

        {/* Floating pen */}
        <Animated.View
          style={[s.penWrap, { transform: [{ translateY: penFloat }] }]}
        >
          <Pencil size={22} color={Colors.accent} strokeWidth={1.5} />
        </Animated.View>
      </Animated.View>
    </View>
  );
}

/* ------------------------------------------------------------------ */
/*  Illustration 3 — Bank (Building + Connection + Phone + Lock)       */
/* ------------------------------------------------------------------ */
export function BankIllustration() {
  const pulseAnim = useRef(new Animated.Value(0.4)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    // Entrance
    Animated.spring(scaleAnim, {
      toValue: 1,
      tension: 50,
      friction: 8,
      useNativeDriver: true,
    }).start();

    // Pulse on connection line
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.4,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [pulseAnim, scaleAnim]);

  return (
    <View style={s.container}>
      <Animated.View
        style={[s.bankScene, { transform: [{ scale: scaleAnim }] }]}
      >
        {/* Bank building */}
        <View style={s.bankBuilding}>
          {/* Triangle roof via border trick */}
          <View style={s.bankRoof} />
          {/* Building body */}
          <View style={s.bankBody}>
            {/* Columns */}
            <View style={s.bankColumn} />
            <View style={s.bankColumn} />
            <View style={s.bankColumn} />
          </View>
          {/* Base */}
          <View style={s.bankBase} />
        </View>

        {/* Connection line */}
        <View style={s.connectionArea}>
          <Animated.View style={[s.connectionLine, { opacity: pulseAnim }]} />
          <Animated.View
            style={[s.connectionLineLower, { opacity: pulseAnim }]}
          />
          {/* Lock icon */}
          <View style={s.lockCircle}>
            <Lock size={14} color={Colors.white} strokeWidth={1.5} />
          </View>
        </View>

        {/* Phone shape */}
        <View style={s.phone}>
          <View style={s.phoneScreen}>
            <CheckCircle size={18} color={Colors.success} strokeWidth={1.5} />
          </View>
          <View style={s.phoneButton} />
        </View>
      </Animated.View>
    </View>
  );
}

/* ================================================================== */
/*  Styles                                                            */
/* ================================================================== */
const s = StyleSheet.create({
  container: {
    width: SIZE,
    height: SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* --- Welcome --- */
  shield: {
    width: 90,
    height: 110,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shieldTop: {
    position: 'absolute',
    top: 0,
    width: 90,
    height: 60,
    backgroundColor: Colors.secondary,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  shieldBottom: {
    position: 'absolute',
    top: 50,
    width: 0,
    height: 0,
    borderLeftWidth: 45,
    borderRightWidth: 45,
    borderTopWidth: 60,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: Colors.secondary,
  },
  shieldIconWrap: {
    zIndex: 1,
    marginTop: -8,
  },
  floatingCircle: {
    position: 'absolute',
    borderRadius: 50,
  },
  floatingCircle1: {
    width: 14,
    height: 14,
    backgroundColor: Colors.accent,
    opacity: 0.8,
  },
  floatingCircle2: {
    width: 10,
    height: 10,
    backgroundColor: Colors.secondary,
    opacity: 0.6,
  },
  floatingCircle3: {
    width: 12,
    height: 12,
    backgroundColor: Colors.accent,
    opacity: 0.5,
  },

  /* --- Business --- */
  clipboardWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  clipboard: {
    width: 110,
    height: 140,
    backgroundColor: Colors.primary,
    borderRadius: 12,
    padding: 16,
    paddingTop: 24,
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
  },
  clipboardClip: {
    position: 'absolute',
    top: -8,
    alignSelf: 'center',
    width: 40,
    height: 16,
    backgroundColor: '#666666',
    borderRadius: 4,
    zIndex: 2,
  },
  textLine: {
    height: 6,
    backgroundColor: '#666666',
    borderRadius: 3,
    marginBottom: 10,
  },
  checkCircle: {
    position: 'absolute',
    bottom: 14,
    alignSelf: 'center',
    left: 38,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: Colors.success,
    alignItems: 'center',
    justifyContent: 'center',
  },
  penWrap: {
    position: 'absolute',
    right: -24,
    top: 30,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.accent + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* --- Bank --- */
  bankScene: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  bankBuilding: {
    alignItems: 'center',
    width: 70,
  },
  bankRoof: {
    width: 0,
    height: 0,
    borderLeftWidth: 40,
    borderRightWidth: 40,
    borderBottomWidth: 28,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: Colors.secondary,
  },
  bankBody: {
    width: 68,
    height: 50,
    backgroundColor: Colors.secondary,
    flexDirection: 'row',
    alignItems: 'stretch',
    justifyContent: 'space-evenly',
    paddingHorizontal: 8,
    paddingTop: 4,
  },
  bankColumn: {
    width: 8,
    backgroundColor: Colors.primary,
    borderRadius: 2,
  },
  bankBase: {
    width: 76,
    height: 8,
    backgroundColor: Colors.secondary,
    borderBottomLeftRadius: 3,
    borderBottomRightRadius: 3,
  },
  connectionArea: {
    width: 40,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  connectionLine: {
    position: 'absolute',
    top: 18,
    width: 40,
    height: 3,
    backgroundColor: Colors.accent,
    borderRadius: 2,
  },
  connectionLineLower: {
    position: 'absolute',
    top: 38,
    width: 40,
    height: 3,
    backgroundColor: Colors.accent,
    borderRadius: 2,
  },
  lockCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.success,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  phone: {
    width: 48,
    height: 80,
    backgroundColor: Colors.primary,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#666666',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 4,
  },
  phoneScreen: {
    flex: 1,
    width: '100%',
    backgroundColor: '#0A0A0A',
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  phoneButton: {
    width: 16,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#666666',
    marginTop: 4,
    marginBottom: 2,
  },
});
