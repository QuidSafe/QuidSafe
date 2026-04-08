import { StyleSheet, View, Text, Pressable } from 'react-native';
import { Landmark, Lock, ArrowLeftRight, Calculator, Wallet, ShieldCheck, ChevronRight } from 'lucide-react-native';
import { Colors, BorderRadius, Shadows } from '@/constants/Colors';
import { Fonts } from '@/constants/Typography';
import { useTheme } from '@/lib/ThemeContext';

export interface WelcomeStateProps {
  isConnecting: boolean;
  onConnectBank: () => void;
}

export function WelcomeState({ isConnecting, onConnectBank }: WelcomeStateProps) {
  const { colors } = useTheme();

  return (
    <>
      {/* ── Hero with dashboard preview ── */}
      <View>
        <View style={[ws.hero, { backgroundColor: '#000000' }]}>
          {/* Layered atmospheric glows */}
          <View style={ws.glowGold} />
          <View style={ws.glowBlue} />
          <View style={ws.glowSoft} />

          {/* Gold accent line — asymmetric top-left */}
          <View style={ws.accentLine} />

          {/* Oversized headline */}
          <Text style={ws.heroEyebrow}>SOLE TRADER TAX</Text>

          <Text style={ws.heroHeadline}>
            Know exactly{'\n'}what to set aside
          </Text>

          {/* Mocked dashboard preview */}
          <View style={ws.previewCard}>
            <View style={ws.previewHeader}>
              <View style={ws.previewDot} />
              <Text style={ws.previewLabel}>SET ASIDE FOR TAX</Text>
            </View>
            <Text style={ws.previewAmount}>£0.00</Text>
            <View style={ws.previewRow}>
              <View style={ws.previewBox}>
                <Text style={ws.previewBoxLabel}>Income Tax</Text>
                <Text style={ws.previewBoxVal}>—</Text>
              </View>
              <View style={ws.previewBox}>
                <Text style={ws.previewBoxLabel}>NI (Class 4)</Text>
                <Text style={ws.previewBoxVal}>—</Text>
              </View>
              <View style={ws.previewBox}>
                <Text style={ws.previewBoxLabel}>Expenses</Text>
                <Text style={ws.previewBoxVal}>—</Text>
              </View>
            </View>
            <View style={[ws.previewFade, { backgroundColor: 'rgba(0,0,0,0.85)' }]} />
          </View>

          <Text style={ws.heroSub}>
            Connect your bank account and this dashboard fills itself — income tracked, tax calculated, nothing to configure.
          </Text>

          {/* Primary CTA */}
          <View>
            <Pressable
              style={({ pressed }) => [ws.cta, pressed && ws.ctaPressed]}
              onPress={onConnectBank}
              disabled={isConnecting}
              accessibilityRole="button"
              accessibilityLabel="Connect your bank account"
            >
              <View style={[ws.ctaGradient, { backgroundColor: '#0066FF' }]}>
                <Landmark size={16} color="#FFF" strokeWidth={1.5} />
                <Text style={ws.ctaText}>
                  {isConnecting ? 'Connecting...' : 'Connect Your Bank'}
                </Text>
              </View>
            </Pressable>
          </View>

          {/* Trust chips */}
          <View style={ws.trustRow}>
            {['256-bit encrypted', 'Read-only access', 'Bank-grade security'].map((t) => (
              <View key={t} style={ws.trustChip}>
                <Lock size={9} color="rgba(0,102,255,0.6)" strokeWidth={1.5} />
                <Text style={ws.trustText}>{t}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>

      {/* ── Features: Cascading staggered cards ── */}
      {([
        {
          IconComponent: ArrowLeftRight,
          title: 'Auto-track income',
          desc: 'Transactions imported via Open Banking and categorised by AI — no manual entry.',
          accent: '#0066FF',
        },
        {
          IconComponent: Calculator,
          title: 'Real-time tax calculation',
          desc: 'Income Tax + NI Class 2 & 4, updated live as you earn. Personal allowance and thresholds built in.',
          accent: '#0066FF',
        },
        {
          IconComponent: Wallet,
          title: 'Monthly set-aside amount',
          desc: 'Tells you exactly what to put away each month so January never surprises you.',
          accent: '#00C853',
        },
        {
          IconComponent: ShieldCheck,
          title: 'Making Tax Digital ready',
          desc: 'Quarterly updates pre-formatted for HMRC. Deadlines tracked on your dashboard.',
          accent: '#0066FF',
        },
      ] as const).map((f) => (
        <View key={f.title}>
          <View
            style={[
              ws.featureItem,
              {
                backgroundColor: colors.surface,
                borderColor: colors.cardBorder,
                borderLeftColor: f.accent,
              },
            ]}
          >
            <View style={[ws.featureIcon, { backgroundColor: f.accent + '14' }]}>
              <f.IconComponent size={22} color={f.accent} strokeWidth={1.5} />
            </View>
            <View style={ws.featureBody}>
              <Text style={[ws.featureTitle, { color: colors.text }]}>{f.title}</Text>
              <Text style={[ws.featureDesc, { color: colors.textSecondary }]}>{f.desc}</Text>
            </View>
          </View>
        </View>
      ))}

      {/* ── How it works: Numbered timeline ── */}
      <View>
        <View style={ws.timelineSection}>
          <Text style={[ws.timelineHeading, { color: colors.text }]}>
            Two minutes to set up
          </Text>
          <View style={ws.timeline}>
            {[
              { n: '1', title: 'Link your bank', desc: 'Secure Open Banking — we never see your password.' },
              { n: '2', title: 'AI categorises everything', desc: 'Income, expenses, and sources — sorted automatically.' },
              { n: '3', title: 'Dashboard goes live', desc: 'Tax owed, set-aside amount, and quarterly deadlines — all in real time.' },
            ].map((step, i) => (
              <View key={step.n} style={ws.timelineStep}>
                {i < 2 && <View style={[ws.timelineConnector, { backgroundColor: i === 0 ? '#0066FF' : colors.border }]} />}
                <View style={[
                  ws.timelineNum,
                  {
                    backgroundColor: i === 0 ? '#0066FF' : 'transparent',
                    borderColor: i === 0 ? '#0066FF' : colors.border,
                  },
                ]}>
                  <Text style={[ws.timelineNumText, { color: i === 0 ? '#FFF' : colors.textSecondary }]}>
                    {step.n}
                  </Text>
                </View>
                <View style={ws.timelineBody}>
                  <Text style={[ws.timelineTitle, { color: i === 0 ? colors.text : colors.textSecondary }]}>
                    {step.title}
                  </Text>
                  <Text style={[ws.timelineDesc, { color: colors.textSecondary }]}>{step.desc}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      </View>

      {/* ── Bottom CTA ── */}
      <View>
        <Pressable
          style={({ pressed }) => [ws.bottomCta, { borderColor: colors.border }, pressed && ws.ctaPressed]}
          onPress={onConnectBank}
          disabled={isConnecting}
          accessibilityRole="button"
        >
          <View style={ws.bottomCtaInner}>
            <View style={ws.bottomCtaIconWrap}>
              <Landmark size={16} color="#0066FF" strokeWidth={1.5} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[ws.bottomCtaTitle, { color: colors.text }]}>Ready to get started?</Text>
              <Text style={[ws.bottomCtaDesc, { color: colors.textSecondary }]}>
                Takes 2 minutes — connect your bank and let QuidSafe handle the rest.
              </Text>
            </View>
            <ChevronRight size={14} color="#0066FF" strokeWidth={1.5} />
          </View>
        </Pressable>
      </View>
    </>
  );
}

const ws = StyleSheet.create({
  // Hero card
  hero: {
    borderRadius: 22,
    padding: 28,
    paddingTop: 32,
    paddingBottom: 28,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    shadowColor: 'rgba(0,0,0,0.5)',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 1,
    shadowRadius: 28,
    elevation: 8,
  },
  glowGold: {
    position: 'absolute',
    top: -80,
    right: -60,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(0,102,255,0.12)',
  },
  glowBlue: {
    position: 'absolute',
    bottom: -60,
    left: -50,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(0,102,255,0.18)',
  },
  glowSoft: {
    position: 'absolute',
    top: '50%' as any,
    right: '10%' as any,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(0,102,255,0.03)',
  },
  accentLine: {
    width: 40,
    height: 3,
    backgroundColor: '#0066FF',
    borderRadius: 2,
    marginBottom: 16,
    opacity: 0.8,
  },
  heroEyebrow: {
    fontFamily: Fonts.lexend.semiBold,
    fontSize: 10,
    color: 'rgba(0,102,255,0.65)',
    letterSpacing: 2.5,
    marginBottom: 10,
  },
  heroHeadline: {
    fontFamily: Fonts.lexend.semiBold,
    fontSize: 34,
    color: Colors.white,
    lineHeight: 42,
    letterSpacing: -0.8,
    marginBottom: 20,
  },

  // Dashboard preview mock
  previewCard: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    padding: 18,
    marginBottom: 20,
    overflow: 'hidden',
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  previewDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#0066FF',
  },
  previewLabel: {
    fontFamily: Fonts.lexend.semiBold,
    fontSize: 9,
    color: 'rgba(255,255,255,0.4)',
    letterSpacing: 1.5,
  },
  previewAmount: {
    fontFamily: Fonts.mono.semiBold,
    fontSize: 32,
    color: 'rgba(255,255,255,0.2)',
    letterSpacing: -1,
    marginBottom: 14,
  },
  previewRow: {
    flexDirection: 'row',
    gap: 8,
  },
  previewBox: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  previewBoxLabel: {
    fontFamily: Fonts.sourceSans.semiBold,
    fontSize: 8.5,
    color: 'rgba(255,255,255,0.3)',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  previewBoxVal: {
    fontFamily: Fonts.lexend.semiBold,
    fontSize: 15,
    color: 'rgba(255,255,255,0.15)',
  },
  previewFade: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 50,
  },

  heroSub: {
    fontFamily: Fonts.sourceSans.regular,
    fontSize: 14,
    color: 'rgba(255,255,255,0.55)',
    lineHeight: 21,
    marginBottom: 24,
  },

  // CTA button
  cta: {
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: 'rgba(0,102,255,0.35)',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 20,
    elevation: 6,
    marginBottom: 16,
  },
  ctaPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.97 }],
  },
  ctaGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 16,
    paddingHorizontal: 32,
  },
  ctaText: {
    fontFamily: Fonts.mono.semiBold,
    fontSize: 16,
    color: Colors.white,
    letterSpacing: -0.2,
  },

  // Trust chips
  trustRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  trustChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: BorderRadius.pill,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  trustText: {
    fontFamily: Fonts.sourceSans.regular,
    fontSize: 10,
    color: 'rgba(255,255,255,0.35)',
  },

  // Feature items — vertical stack with left accent border
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: BorderRadius.card,
    borderWidth: 1,
    borderLeftWidth: 3,
    padding: 16,
    gap: 14,
    ...Shadows.soft,
  },
  featureIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureBody: {
    flex: 1,
    paddingTop: 2,
  },
  featureTitle: {
    fontFamily: Fonts.lexend.semiBold,
    fontSize: 14,
    letterSpacing: -0.1,
    marginBottom: 3,
  },
  featureDesc: {
    fontFamily: Fonts.sourceSans.regular,
    fontSize: 12.5,
    lineHeight: 18,
  },

  // Timeline section
  timelineSection: {
    marginTop: 8,
  },
  timelineHeading: {
    fontFamily: Fonts.lexend.semiBold,
    fontSize: 20,
    letterSpacing: -0.3,
    marginBottom: 16,
  },
  timeline: {
    gap: 0,
  },
  timelineStep: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
    paddingBottom: 22,
  },
  timelineConnector: {
    position: 'absolute',
    left: 15,
    top: 34,
    width: 2,
    height: 30,
    borderRadius: 1,
    opacity: 0.3,
  },
  timelineNum: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timelineNumText: {
    fontFamily: Fonts.mono.semiBold,
    fontSize: 13,
  },
  timelineBody: {
    flex: 1,
    paddingTop: 4,
  },
  timelineTitle: {
    fontFamily: Fonts.lexend.semiBold,
    fontSize: 14.5,
    letterSpacing: -0.1,
  },
  timelineDesc: {
    fontFamily: Fonts.sourceSans.regular,
    fontSize: 12.5,
    lineHeight: 18,
    marginTop: 2,
  },

  // Bottom CTA card
  bottomCta: {
    borderRadius: BorderRadius.card,
    borderWidth: 1,
    padding: 18,
    ...Shadows.soft,
  },
  bottomCtaInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  bottomCtaIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(0,102,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomCtaTitle: {
    fontFamily: Fonts.lexend.semiBold,
    fontSize: 14.5,
    letterSpacing: -0.1,
  },
  bottomCtaDesc: {
    fontFamily: Fonts.sourceSans.regular,
    fontSize: 12,
    lineHeight: 17,
    marginTop: 2,
  },
});
