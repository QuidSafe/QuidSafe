import { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, Pressable, StyleSheet, AppState, Animated, Platform } from 'react-native';
import { Lock } from 'lucide-react-native';
import { colors, BorderRadius } from '@/constants/Colors';
import { Fonts } from '@/constants/Typography';
import { authenticate, isBiometricEnabled } from '@/lib/biometrics';

export function BiometricGate({ children }: { children: React.ReactNode }) {
  const [locked, setLocked] = useState(false);
  const [checking, setChecking] = useState(true);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const appState = useRef(AppState.currentState);

  const unlock = useCallback(async () => {
    const success = await authenticate();
    if (success) {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        setLocked(false);
      });
    }
  }, [fadeAnim]);

  const checkAndLock = useCallback(async () => {
    const enabled = await isBiometricEnabled();
    if (enabled) {
      setLocked(true);
      fadeAnim.setValue(1);
      unlock();
    }
    setChecking(false);
  }, [fadeAnim, unlock]);

  useEffect(() => {
    checkAndLock();
  }, [checkAndLock]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', async (nextAppState) => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        const enabled = await isBiometricEnabled();
        if (enabled) {
          setLocked(true);
          fadeAnim.setValue(1);
          unlock();
        }
      }
      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, [fadeAnim, unlock]);

  if (Platform.OS === 'web') {
    return <>{children}</>;
  }

  if (checking) {
    return null;
  }

  return (
    <>
      {children}
      {locked && (
        <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
          <View style={styles.content}>
            <View style={styles.iconCircle}>
              <Lock size={40} color={colors.accent} strokeWidth={1.5} />
            </View>
            <Text style={styles.brandText}>QuidSafe</Text>
            <Text style={styles.subtitle}>Your finances are protected</Text>
            <Pressable
              onPress={unlock}
              style={({ pressed }) => [styles.unlockButton, pressed && styles.unlockButtonPressed]}
              accessibilityRole="button"
              accessibilityLabel="Tap to unlock"
            >
              <Lock size={16} color={colors.text} strokeWidth={1.5} style={styles.unlockIcon} />
              <Text style={styles.unlockText}>Tap to unlock</Text>
            </Pressable>
          </View>
        </Animated.View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  iconCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: colors.accentGlow,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  brandText: {
    fontFamily: Fonts.lexend.semiBold,
    fontSize: 32,
    color: colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: Fonts.sourceSans.regular,
    fontSize: 15,
    color: colors.textSecondary,
    marginBottom: 48,
  },
  unlockButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.accent,
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: BorderRadius.button,
  },
  unlockButtonPressed: {
    opacity: 0.85,
  },
  unlockIcon: {
    marginRight: 8,
  },
  unlockText: {
    fontFamily: Fonts.sourceSans.semiBold,
    fontSize: 16,
    color: colors.text,
  },
});
