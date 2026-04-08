import { useCallback } from 'react';
import { StyleSheet, View, Text, Pressable } from 'react-native';
import { Link } from 'expo-router';
import { useSSO } from '@clerk/clerk-expo';
import * as WebBrowser from 'expo-web-browser';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Colors, BorderRadius, Spacing, Shadows } from '@/constants/Colors';
import { Fonts } from '@/constants/Typography';
import { useTheme } from '@/lib/ThemeContext';

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  const { startSSOFlow } = useSSO();
  const { colors } = useTheme();

  const handleGoogleSignIn = useCallback(async () => {
    try {
      const { createdSessionId, setActive } = await startSSOFlow({ strategy: 'oauth_google' });
      if (createdSessionId && setActive) {
        await setActive({ session: createdSessionId });
      }
    } catch (err) {
      console.error('Google sign-in error:', err);
    }
  }, [startSSOFlow]);

  return (
    <View style={s.root}>
      <LinearGradient
        colors={['#080C18', '#0C1222', '#142044', '#0C1222', '#080C18']}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFill}
      />


      <SafeAreaView style={s.safe}>
        {/* ── Brand ── */}
        <View style={s.brandWrap}>
          <Text style={s.logo}>QuidSafe</Text>
          <View style={s.accentBar} />
          <Text style={s.tagline}>Your tax. Sorted. Safe.</Text>
        </View>

        {/* ── Content ── */}
        <View style={s.content}>
          {/* Value props */}
          <View style={s.propsRow}>
            {[
              { icon: 'bolt' as const, text: 'Auto-track income' },
              { icon: 'calculator' as const, text: 'Real-time tax' },
              { icon: 'shield' as const, text: 'MTD ready' },
            ].map((p) => (
              <View key={p.text} style={s.propChip}>
                <FontAwesome name={p.icon} size={11} color={Colors.accent} />
                <Text style={s.propText}>{p.text}</Text>
              </View>
            ))}
          </View>

          {/* Trust badge */}
          <View style={s.trustBadge}>
            <FontAwesome name="lock" size={10} color="rgba(202,138,4,0.6)" />
            <Text style={s.trustText}>Bank-grade encryption  ·  Read-only access  ·  HMRC compliant</Text>
          </View>
        </View>

        {/* ── Auth buttons ── */}
        <View style={s.authSection}>
          {/* Google SSO */}
          <Pressable
            style={({ pressed }) => [s.googleBtn, pressed && s.pressed]}
            onPress={handleGoogleSignIn}
            accessibilityRole="button"
            accessibilityLabel="Continue with Google"
          >
            <LinearGradient
              colors={['#D4A017', '#CA8A04', '#A16207']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={s.googleGradient}
            >
              <FontAwesome name="google" size={18} color="#FFF" />
              <Text style={s.googleText}>Continue with Google</Text>
            </LinearGradient>
          </Pressable>

          {/* Divider */}
          <View style={s.divider}>
            <View style={s.dividerLine} />
            <Text style={s.dividerText}>or</Text>
            <View style={s.dividerLine} />
          </View>

          {/* Email */}
          <Link href="/(auth)/signup" asChild>
            <Pressable
              style={({ pressed }) => [s.emailBtn, pressed && s.pressed]}
              accessibilityRole="button"
              accessibilityLabel="Continue with Email"
            >
              <FontAwesome name="envelope-o" size={16} color={Colors.white} style={{ marginRight: 10 }} />
              <Text style={s.emailText}>Continue with Email</Text>
            </Pressable>
          </Link>
        </View>

        {/* ── Footer ── */}
        <View style={s.footer}>
          <Text style={s.footerText}>
            By continuing, you agree to our{' '}
            <Link href="/terms"><Text style={s.footerLink}>Terms of Service</Text></Link>
            {' '}and{' '}
            <Link href="/privacy"><Text style={s.footerLink}>Privacy Policy</Text></Link>
          </Text>
          <Text style={s.footerSub}>Tax tracking for UK sole traders</Text>
        </View>
      </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#080C18',
  },
  safe: {
    flex: 1,
    paddingHorizontal: Spacing.lg + 4,
    justifyContent: 'center',
  },

  // Atmospheric glows
  glowGold: {
    position: 'absolute',
    top: '15%',
    right: -60,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(202, 138, 4, 0.08)',
  },
  glowBlue: {
    position: 'absolute',
    bottom: '20%',
    left: -80,
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: 'rgba(30, 58, 138, 0.12)',
  },

  // Brand
  brandWrap: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logo: {
    fontFamily: Fonts.playfair.bold,
    fontSize: 48,
    color: Colors.white,
    letterSpacing: -1,
  },
  accentBar: {
    width: 40,
    height: 3,
    borderRadius: 2,
    backgroundColor: Colors.accent,
    marginTop: 12,
    marginBottom: 14,
  },
  tagline: {
    fontFamily: Fonts.manrope.medium,
    fontSize: 15,
    color: 'rgba(255,255,255,0.5)',
    letterSpacing: 0.3,
  },

  // Value props
  content: {
    marginBottom: 32,
  },
  propsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  propChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: BorderRadius.pill,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  propText: {
    fontFamily: Fonts.manrope.medium,
    fontSize: 12,
    color: 'rgba(255,255,255,0.55)',
  },

  // Trust
  trustBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(202, 138, 4, 0.06)',
    borderRadius: BorderRadius.pill,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: 'rgba(202, 138, 4, 0.12)',
  },
  trustText: {
    fontFamily: Fonts.manrope.medium,
    fontSize: 11,
    color: 'rgba(255,255,255,0.4)',
    letterSpacing: 0.2,
  },

  // Auth section
  authSection: {
    gap: 14,
    marginBottom: 32,
  },

  // Google button — gold gradient
  googleBtn: {
    borderRadius: 14,
    overflow: 'hidden',
    ...Shadows.medium,
  },
  googleGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 16,
  },
  googleText: {
    fontFamily: Fonts.manrope.extraBold,
    fontSize: 16,
    color: Colors.white,
    letterSpacing: -0.2,
  },

  // Divider
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  dividerText: {
    fontFamily: Fonts.manrope.regular,
    fontSize: 13,
    color: 'rgba(255,255,255,0.3)',
  },

  // Email button — glass outline
  emailBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.12)',
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  emailText: {
    fontFamily: Fonts.manrope.semiBold,
    fontSize: 15,
    color: Colors.white,
  },

  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.97 }],
  },

  // Footer
  footer: {
    alignItems: 'center',
    gap: 8,
  },
  footerText: {
    fontFamily: Fonts.manrope.regular,
    fontSize: 12,
    color: 'rgba(255,255,255,0.35)',
    textAlign: 'center',
    lineHeight: 18,
  },
  footerLink: {
    color: Colors.accent,
    textDecorationLine: 'underline',
  },
  footerSub: {
    fontFamily: Fonts.manrope.regular,
    fontSize: 11,
    color: 'rgba(255,255,255,0.2)',
  },
});
