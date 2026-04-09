import { useCallback } from 'react';
import { StyleSheet, View, Text, Pressable, Platform } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { useSSO } from '@clerk/clerk-expo';
import * as WebBrowser from 'expo-web-browser';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Shield, Zap, Lock, Mail } from 'lucide-react-native';
import { Colors, Spacing, colors as designColors } from '@/constants/Colors';
import { Fonts } from '@/constants/Typography';
import { useTheme } from '@/lib/ThemeContext';

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  const { startSSOFlow } = useSSO();
  const router = useRouter();
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
    <View style={[s.root, { backgroundColor: colors.background }]}>
      <SafeAreaView style={s.safe}>
        {/* ── Shield icon with blue glow ── */}
        <View style={s.iconWrap}>
          <View style={s.iconGlowDark} />
          <View style={[s.iconCircle, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Shield size={32} color={colors.accent} strokeWidth={1.5} />
          </View>
        </View>

        {/* ── Brand ── */}
        <View style={s.brandWrap}>
          <Text style={[s.logo, { color: colors.text }]}>QuidSafe</Text>
          <Text style={[s.tagline, { color: colors.textSecondary }]}>Your tax. Sorted. Safe.</Text>
        </View>

        {/* ── Value props ── */}
        <View style={s.content}>
          <View style={s.propsRow}>
            {[
              { icon: Zap, text: 'Auto-track income' },
              { icon: Shield, text: 'Real-time tax' },
              { icon: Shield, text: 'MTD ready' },
            ].map((p) => (
              <View key={p.text} style={[s.propChip, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <p.icon size={11} color={colors.accent} strokeWidth={1.5} />
                <Text style={[s.propText, { color: colors.textSecondary }]}>{p.text}</Text>
              </View>
            ))}
          </View>

          {/* Trust badge */}
          <View style={[s.trustBadge, { backgroundColor: colors.accentGlow, borderColor: 'rgba(0,102,255,0.2)' }]}>
            <Lock size={10} color={colors.accent} strokeWidth={1.5} />
            <Text style={[s.trustText, { color: colors.textSecondary }]}>
              Bank-grade encryption  ·  Read-only access  ·  HMRC compliant
            </Text>
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
            <Mail size={18} color="#FFF" strokeWidth={1.5} />
            <Text style={s.googleText}>Continue with Google</Text>
          </Pressable>

          {/* Divider */}
          <View style={s.divider}>
            <View style={[s.dividerLine, { backgroundColor: colors.border }]} />
            <Text style={[s.dividerText, { color: colors.textMuted }]}>or</Text>
            <View style={[s.dividerLine, { backgroundColor: colors.border }]} />
          </View>

          {/* Email */}
          <Pressable
            style={({ pressed }) => [s.emailBtn, { borderColor: colors.border, backgroundColor: colors.surface }, pressed && s.pressed]}
            onPress={() => router.push('/(auth)/signup')}
            accessibilityRole="button"
            accessibilityLabel="Continue with Email"
          >
            <Mail size={16} color={colors.text} strokeWidth={1.5} style={{ marginRight: 10 }} />
            <Text style={[s.emailText, { color: colors.text }]}>Continue with Email</Text>
          </Pressable>
        </View>

        {/* ── Footer ── */}
        <View style={s.footer}>
          <Text style={[s.footerText, { color: colors.textMuted }]}>
            By continuing, you agree to our{' '}
            <Link href="/terms"><Text style={s.footerLink}>Terms of Service</Text></Link>
            {' '}and{' '}
            <Link href="/privacy"><Text style={s.footerLink}>Privacy Policy</Text></Link>
          </Text>
          <Text style={[s.footerSub, { color: colors.textMuted }]}>
            Tax tracking for UK sole traders
          </Text>
        </View>
      </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  root: {
    flex: 1,
  },
  safe: {
    flex: 1,
    paddingHorizontal: Spacing.lg + 4,
    justifyContent: 'center',
  },

  // Shield icon
  iconWrap: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
    position: 'relative',
  },
  iconGlow: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'transparent',
  },
  iconGlowDark: {
    backgroundColor: designColors.accentGlow,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Brand
  brandWrap: {
    alignItems: 'center',
    marginBottom: 36,
  },
  logo: {
    fontFamily: Fonts.lexend.semiBold,
    fontSize: 40,
    letterSpacing: -0.5,
  },
  tagline: {
    fontFamily: Fonts.sourceSans.regular,
    fontSize: 15,
    marginTop: 8,
    letterSpacing: 0.2,
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
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderWidth: 1,
  },
  propText: {
    fontFamily: Fonts.sourceSans.regular,
    fontSize: 12,
  },

  // Trust
  trustBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderWidth: 1,
  },
  trustText: {
    fontFamily: Fonts.sourceSans.regular,
    fontSize: 11,
    letterSpacing: 0.2,
  },

  // Auth section
  authSection: {
    gap: 14,
    marginBottom: 32,
  },

  // Google button - electric blue, flat
  googleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: designColors.accent,
    paddingVertical: 16,
    borderRadius: 8,
  },
  googleText: {
    fontFamily: Fonts.sourceSans.semiBold,
    fontSize: 16,
    color: designColors.text,
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
  },
  dividerText: {
    fontFamily: Fonts.sourceSans.regular,
    fontSize: 13,
  },

  // Email button - outlined
  emailBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    borderRadius: 8,
    borderWidth: 1,
  },
  emailText: {
    fontFamily: Fonts.sourceSans.semiBold,
    fontSize: 15,
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
    fontFamily: Fonts.sourceSans.regular,
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
  footerLink: {
    color: designColors.accent,
    textDecorationLine: 'underline',
  },
  footerSub: {
    fontFamily: Fonts.sourceSans.regular,
    fontSize: 11,
  },
});
