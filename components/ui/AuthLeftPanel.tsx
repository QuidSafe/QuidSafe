import { StyleSheet, View, Text } from 'react-native';
import { Shield, Zap, Lock } from 'lucide-react-native';
import { Colors, Spacing } from '@/constants/Colors';
import { Fonts } from '@/constants/Typography';

/**
 * Desktop-only left panel for split-screen auth layouts.
 * Apple-style brand presence with hero headline and minimal feature hints.
 */
export function AuthLeftPanel() {
  return (
    <View style={styles.panel}>
      {/* Subtle radial glow */}
      <View style={styles.glow} />

      <View style={styles.content}>
        {/* Brand */}
        <View style={styles.brandRow}>
          <View style={styles.iconCircle}>
            <Shield size={18} color={Colors.electricBlue} strokeWidth={1.5} />
          </View>
          <Text style={styles.brand}>QuidSafe</Text>
        </View>

        {/* Hero headline */}
        <Text style={styles.hero}>
          Tax,{'\n'}sorted.
        </Text>

        <Text style={styles.subhero}>
          The smartest way for UK sole traders to track income, expenses and tax.
        </Text>

        {/* Feature list */}
        <View style={styles.features}>
          <View style={styles.feature}>
            <Zap size={16} color={Colors.electricBlue} strokeWidth={1.5} />
            <Text style={styles.featureText}>Auto-categorise every transaction</Text>
          </View>
          <View style={styles.feature}>
            <Shield size={16} color={Colors.electricBlue} strokeWidth={1.5} />
            <Text style={styles.featureText}>Real-time tax calculator, updated daily</Text>
          </View>
          <View style={styles.feature}>
            <Lock size={16} color={Colors.electricBlue} strokeWidth={1.5} />
            <Text style={styles.featureText}>MTD compliant, read-only bank access</Text>
          </View>
        </View>
      </View>

      {/* Footer */}
      <Text style={styles.footer}>Trusted by UK sole traders. £7.99/month, all inclusive.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    flex: 1,
    backgroundColor: Colors.black,
    paddingVertical: 64,
    paddingHorizontal: 64,
    position: 'relative' as const,
    overflow: 'hidden' as const,
    justifyContent: 'space-between',
    borderRightWidth: 1,
    borderRightColor: Colors.midGrey,
  },
  glow: {
    position: 'absolute' as const,
    top: -200,
    left: -200,
    width: 600,
    height: 600,
    borderRadius: 300,
    backgroundColor: Colors.electricBlue,
    opacity: 0.08,
  },
  content: {
    maxWidth: 520,
    zIndex: 1,
  },
  brandRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 12,
    marginBottom: 80,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.charcoal,
    borderWidth: 1,
    borderColor: Colors.midGrey,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brand: {
    fontFamily: Fonts.lexend.semiBold,
    fontSize: 20,
    color: Colors.white,
    letterSpacing: -0.3,
  },
  hero: {
    fontFamily: Fonts.lexend.semiBold,
    fontSize: 72,
    lineHeight: 76,
    color: Colors.white,
    letterSpacing: -2,
    marginBottom: Spacing.lg,
  },
  subhero: {
    fontFamily: Fonts.sourceSans.regular,
    fontSize: 18,
    lineHeight: 28,
    color: Colors.lightGrey,
    marginBottom: Spacing.xxl,
    maxWidth: 440,
  },
  features: {
    gap: 16,
  },
  feature: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 12,
  },
  featureText: {
    fontFamily: Fonts.sourceSans.regular,
    fontSize: 15,
    color: Colors.lightGrey,
  },
  footer: {
    fontFamily: Fonts.sourceSans.regular,
    fontSize: 13,
    color: Colors.muted,
    zIndex: 1,
  },
});
