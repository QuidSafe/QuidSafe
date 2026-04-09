import { useState, useEffect } from 'react';
import { StyleSheet, View, Text, Pressable, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors, Spacing, BorderRadius } from '@/constants/Colors';
import { Fonts } from '@/constants/Typography';

export function CookieConsent() {
  const router = useRouter();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (Platform.OS !== 'web') return;

    try {
      const consent = localStorage.getItem('qs_cookie_consent');
      if (!consent) {
        setVisible(true);
      }
    } catch {
      // localStorage unavailable (SSR or private browsing)
    }
  }, []);

  if (Platform.OS !== 'web' || !visible) return null;

  const handleAccept = () => {
    try {
      localStorage.setItem(
        'qs_cookie_consent',
        JSON.stringify({ status: 'accepted', date: new Date().toISOString().split('T')[0] }),
      );
    } catch {
      // localStorage unavailable
    }
    setVisible(false);
  };

  return (
    <View style={styles.overlay}>
      <View style={styles.banner}>
        <Text style={styles.text}>
          QuidSafe uses essential cookies only to keep you signed in and remember your preferences. No tracking or advertising cookies.
        </Text>
        <View style={styles.actions}>
          <Pressable
            style={({ pressed }) => [styles.acceptButton, pressed && styles.pressed]}
            onPress={handleAccept}
          >
            <Text style={styles.acceptText}>Accept</Text>
          </Pressable>
          <Pressable
            onPress={() => router.push('/cookie-policy')}
            style={({ pressed }) => [styles.learnMore, pressed && styles.pressed]}
          >
            <Text style={styles.learnMoreText}>Learn more</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute' as const,
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
    padding: Spacing.md,
    alignItems: 'center',
  },
  banner: {
    backgroundColor: Colors.charcoal,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    borderRadius: BorderRadius.card,
    padding: Spacing.lg,
    maxWidth: 640,
    width: '100%' as unknown as number,
    flexDirection: 'column' as const,
    gap: Spacing.md,
  },
  text: {
    fontFamily: Fonts.sourceSans.regular,
    fontSize: 14,
    lineHeight: 22,
    color: Colors.dark.textSecondary,
  },
  actions: {
    flexDirection: 'row' as const,
    alignItems: 'center',
    gap: Spacing.md,
  },
  acceptButton: {
    backgroundColor: Colors.electricBlue,
    borderRadius: BorderRadius.button,
    paddingHorizontal: Spacing.lg,
    paddingVertical: 10,
  },
  acceptText: {
    fontFamily: Fonts.sourceSans.semiBold,
    fontSize: 14,
    color: Colors.white,
  },
  learnMore: {
    paddingVertical: 10,
  },
  learnMoreText: {
    fontFamily: Fonts.sourceSans.regular,
    fontSize: 14,
    color: Colors.electricBlue,
  },
  pressed: {
    opacity: 0.7,
  },
});
