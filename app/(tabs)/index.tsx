import { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Text, ScrollView, RefreshControl, Pressable, Alert, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as WebBrowser from 'expo-web-browser';
import { useUser } from '@clerk/clerk-expo';
import { useRouter } from 'expo-router';
import { ArrowUp, ArrowDown, Landmark, Lock, Lightbulb, Check, ChevronRight, ArrowLeftRight, Calculator, Wallet, ShieldCheck, Clock, CheckCircle } from 'lucide-react-native';
import { Card } from '@/components/ui/Card';
import { ActionCard } from '@/components/ui/ActionCard';
import { MiniChart } from '@/components/ui/MiniChart';
import { QuarterTimeline } from '@/components/ui/QuarterTimeline';
import { DashboardSkeleton } from '@/components/ui/Skeleton';
import { Colors, Spacing, BorderRadius, Shadows } from '@/constants/Colors';
import { Fonts } from '@/constants/Typography';
import { useDashboard } from '@/lib/hooks/useApi';
import { api } from '@/lib/api';
import { formatCurrency } from '@/lib/tax-engine';
import { useTheme } from '@/lib/ThemeContext';

/** Calculate YoY income growth from byMonth data.
 *  Compares last 6 months total vs prior 6 months.
 *  Returns null if fewer than 12 months of data. */
function calcYoYGrowth(byMonth?: { month: string; income: number }[]): number | null {
  if (!byMonth || byMonth.length < 12) return null;
  const sorted = [...byMonth].sort((a, b) => a.month.localeCompare(b.month));
  const recent6 = sorted.slice(-6);
  const prior6 = sorted.slice(-12, -6);
  const recentTotal = recent6.reduce((s, m) => s + m.income, 0);
  const priorTotal = prior6.reduce((s, m) => s + m.income, 0);
  if (priorTotal === 0) return null;
  return Math.round(((recentTotal - priorTotal) / priorTotal) * 100);
}

const SOURCE_COLORS = [
  '#0066FF',          // Blue
  '#0066FF',          // Blue
  '#00C853',          // Green
  '#0066FF',          // Blue
  '#EC4899',          // Pink
  '#06B6D4',          // Cyan
  '#FF3B30',          // Red
  '#F97316',          // Orange
];

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

export default function DashboardScreen() {
  const { user } = useUser();
  const router = useRouter();
  const { data, isLoading, refetch, isRefetching } = useDashboard();
  const { colors } = useTheme();

  const [isConnecting, setIsConnecting] = useState(false);

  // Single subtle fade-in for the whole page (200ms, not 1.5s stagger)
  const pageFade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isLoading) return;
    Animated.timing(pageFade, { toValue: 1, duration: 200, useNativeDriver: true }).start();
  }, [isLoading]); // eslint-disable-line react-hooks/exhaustive-deps

  const firstName = user?.firstName ?? data?.user?.name?.split(' ')[0] ?? '';
  const tax = data?.tax;
  const income = data?.income;
  const yoyGrowth = calcYoYGrowth(income?.byMonth);
  const quarter = data?.quarters?.current?.quarter ?? 1;
  const taxYear = data?.quarters?.current?.taxYear ?? '2026/27';
  const actions = data?.actions;
  const isWelcome = (income?.total ?? 0) === 0 && (!actions || actions.length === 0);

  const handleConnectBank = async () => {
    if (isConnecting) return;
    setIsConnecting(true);
    try {
      const { url } = await api.getConnectUrl();
      await WebBrowser.openBrowserAsync(url);
    } catch {
      Alert.alert('Connection Error', 'Could not start bank connection. Please try again.');
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        accessibilityRole="list"
        accessibilityLabel="Dashboard"
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.tint} />}
      >
        {/* Header / Greeting */}
        <Animated.View
          style={[styles.header, { opacity: pageFade }]}
          accessible={true}
          accessibilityRole="header"
        >
          <View style={styles.headerLeft}>
            <Text style={[styles.greeting, { color: colors.textSecondary }]}>{getGreeting()}</Text>
            <Text style={[styles.name, { color: colors.text }]} accessibilityRole="header">
              {firstName || 'Welcome'}
            </Text>
          </View>
          <View style={styles.headerRight}>
            {/* Health badge -- income growth indicator (YoY from byMonth data) */}
            {yoyGrowth !== null && (
              <View
                style={[styles.healthBadge, { backgroundColor: yoyGrowth >= 0 ? 'rgba(0,200,83,0.1)' : 'rgba(255,59,48,0.1)' }]}
                accessibilityLabel={`Income growth: ${yoyGrowth >= 0 ? 'plus' : 'minus'} ${Math.abs(yoyGrowth)} percent`}
              >
                {yoyGrowth >= 0 ? (
                  <ArrowUp size={11} color="#00C853" strokeWidth={1.5} />
                ) : (
                  <ArrowDown size={11} color="#FF3B30" strokeWidth={1.5} />
                )}
                <Text style={[styles.healthText, { color: yoyGrowth >= 0 ? '#00C853' : '#FF3B30' }]}>
                  {yoyGrowth >= 0 ? '+' : ''}{yoyGrowth}%
                </Text>
              </View>
            )}
            {/* Avatar circle */}
            {firstName ? (
              <View style={styles.avatar} accessibilityLabel={`Profile avatar for ${firstName}`}>
                <Text style={styles.avatarText}>{firstName.charAt(0).toUpperCase()}</Text>
              </View>
            ) : null}
          </View>
        </Animated.View>

        {isLoading ? (
          <DashboardSkeleton />
        ) : isWelcome ? (
          <>
            {/* ── WELCOME: Hero with dashboard preview ── */}
            <View>
              <View
                style={[ws.hero, { backgroundColor: '#000000' }]}
              >
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

                {/* Mocked dashboard preview — staggered reveal */}
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
                  <View
                    style={[ws.previewFade, { backgroundColor: 'rgba(0,0,0,0.85)' }]}
                  />
                </View>

                <Text style={ws.heroSub}>
                  Connect your bank account and this dashboard fills itself — income tracked, tax calculated, nothing to configure.
                </Text>

                {/* Primary CTA — spring pop entrance */}
                <View>
                  <Pressable
                    style={({ pressed }) => [ws.cta, pressed && ws.ctaPressed]}
                    onPress={handleConnectBank}
                    disabled={isConnecting}
                    accessibilityRole="button"
                    accessibilityLabel="Connect your bank account"
                  >
                    <View
                      style={[ws.ctaGradient, { backgroundColor: '#0066FF' }]}
                    >
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

            {/* ── FEATURES: Cascading staggered cards ── */}
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
              <View
                key={f.title}
              >
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

            {/* ── HOW IT WORKS: Numbered timeline ── */}
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

            {/* ── BOTTOM CTA ── */}
            <View>
              <Pressable
                style={({ pressed }) => [ws.bottomCta, { borderColor: colors.border }, pressed && ws.ctaPressed]}
                onPress={handleConnectBank}
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
        ) : (
          <>
            {/* Hero Tax Card */}
            <View>
              <Pressable
                accessible={true}
                accessibilityRole="summary"
                accessibilityLabel={`Tax summary. Set aside ${formatCurrency(tax?.totalTaxOwed ?? 0)} for tax based on ${formatCurrency(tax?.totalIncome ?? 0)} income this tax year`}
                style={({ pressed }) => [pressed && styles.pressedCard]}
              >
                <View
                  style={[styles.heroCard, { backgroundColor: '#000000' }]}
                >
                  {/* Radial gold glow overlays */}
                  <View style={styles.heroGlow} importantForAccessibility="no" accessibilityElementsHidden={true} />
                  <View style={styles.heroGlowSecondary} importantForAccessibility="no" accessibilityElementsHidden={true} />

                  {/* Label row with gold dot */}
                  <View style={styles.heroLabelRow}>
                    <View style={styles.heroLabelDot} importantForAccessibility="no" accessibilityElementsHidden={true} />
                    <Text style={styles.heroLabel}>SET ASIDE FOR TAX</Text>
                  </View>

                  <Text style={styles.heroAmount}>
                    {formatCurrency(tax?.totalTaxOwed ?? 0)}
                  </Text>
                  <Text style={styles.heroSubtext}>
                    Based on {formatCurrency(tax?.totalIncome ?? 0)} income this tax year
                  </Text>

                  {/* 3 glassmorphic boxes */}
                  <View style={styles.heroRow}>
                    <View style={styles.heroBox} accessibilityLabel={`Income Tax: ${formatCurrency(tax?.incomeTax?.total ?? 0)}`}>
                      <Text style={styles.heroBoxLabel}>Income Tax</Text>
                      <Text style={styles.heroBoxValue}>
                        {formatCurrency(tax?.incomeTax?.total ?? 0)}
                      </Text>
                    </View>
                    <View style={styles.heroBox} accessibilityLabel={`National Insurance Class 4: ${formatCurrency(tax?.nationalInsurance?.total ?? 0)}`}>
                      <Text style={styles.heroBoxLabel}>NI (Class 4)</Text>
                      <Text style={styles.heroBoxValue}>
                        {formatCurrency(tax?.nationalInsurance?.total ?? 0)}
                      </Text>
                    </View>
                    <View style={styles.heroBox} accessibilityLabel={`Expenses: minus ${formatCurrency(tax?.totalExpenses ?? 0)}`}>
                      <Text style={styles.heroBoxLabel}>Expenses</Text>
                      <Text style={[styles.heroBoxValue, styles.heroBoxExpenses]}>
                        -{formatCurrency(tax?.totalExpenses ?? 0)}
                      </Text>
                    </View>
                  </View>

                  {/* Monthly set-aside -- gold highlight inside hero */}
                  <View style={styles.heroSetAside} accessibilityLabel={`Set aside this month: ${formatCurrency(tax?.setAsideMonthly ?? 0)}`}>
                    <Text style={styles.heroSetAsideLabel}>SET ASIDE THIS MONTH</Text>
                    <Text style={styles.heroSetAsideAmount}>
                      {formatCurrency(tax?.setAsideMonthly ?? 0)}
                    </Text>
                  </View>
                </View>
              </Pressable>
            </View>

            {/* Income Trend Chart */}
            {income?.byMonth && income.byMonth.length > 0 && (() => {
              const sorted = [...income.byMonth].sort((a, b) => a.month.localeCompare(b.month));
              const last6 = sorted.slice(-6);
              const MONTH_SHORT: Record<string, string> = {
                '01': 'J', '02': 'F', '03': 'M', '04': 'A', '05': 'M', '06': 'J',
                '07': 'J', '08': 'A', '09': 'S', '10': 'O', '11': 'N', '12': 'D',
              };
              const chartData = last6.map((m) => ({
                label: MONTH_SHORT[m.month.split('-')[1]] ?? m.month.slice(-2),
                value: m.income,
              }));
              const periodTotal = last6.reduce((s, m) => s + m.income, 0);

              return (
                <View>
                  <Card>
                    <View style={styles.chartHeader}>
                      <Text style={[styles.chartTitle, { color: colors.text }]} accessibilityRole="header">Income Trend</Text>
                      <Text style={[styles.chartSubtitle, { color: colors.textSecondary }]}>
                        {formatCurrency(periodTotal)} over {last6.length} months
                      </Text>
                    </View>
                    <MiniChart data={chartData} color="#00C853" height={72} />
                  </Card>
                </View>
              );
            })()}

            <View>
              {/* Plain English Insight */}
              {tax?.plainEnglish ? (
                <Pressable
                  accessible={true}
                  accessibilityRole="text"
                  accessibilityLabel={`Tax insight: ${tax.plainEnglish}`}
                  style={({ pressed }) => [
                    styles.insightBanner,
                    {
                      backgroundColor: 'rgba(0,102,255,0.08)',
                      borderColor: 'rgba(0,102,255,0.12)',
                    },
                    pressed && styles.pressedCard,
                  ]}
                >
                  <View style={styles.insightIcon}>
                    <Lightbulb size={14} color="#0066FF" strokeWidth={1.5} />
                  </View>
                  <Text style={[styles.insightText, { color: '#0066FF' }]}>
                    {tax.plainEnglish}
                  </Text>
                </Pressable>
              ) : null}

              {/* Set aside card -- effective rate with "On track" badge */}
              <Pressable
                accessible={true}
                accessibilityRole="summary"
                accessibilityLabel={`Set aside this month ${formatCurrency(tax?.setAsideMonthly ?? 0)}. Effective tax rate ${tax?.effectiveRate ? `${tax.effectiveRate}%` : '0%'}`}
                style={({ pressed }) => [
                  styles.setAsideCard,
                  { backgroundColor: '#0A0A0A' },
                  pressed && styles.pressedCard,
                ]}
              >
                <View>
                  <Text style={styles.setAsideLabel}>SET ASIDE THIS MONTH</Text>
                  <Text style={[styles.setAsideAmount, { color: colors.text }]}>
                    {formatCurrency(tax?.setAsideMonthly ?? 0)}
                  </Text>
                </View>
                <View style={styles.setAsideRight}>
                  <View style={styles.onTrackBadge} accessibilityLabel="Status: On track">
                    <Check size={11} color="#00C853" strokeWidth={1.5} />
                    <Text style={styles.onTrackText}>On track</Text>
                  </View>
                </View>
              </Pressable>

              {/* Section heading */}
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionHeading, { color: colors.text }]} accessibilityRole="header">What needs doing</Text>
              </View>

              {/* Action Items */}
              <View style={styles.actions} accessibilityRole="list" accessibilityLabel="Action items">
                {actions && actions.length > 0 ? (
                  actions.map((action) => (
                    <ActionCard
                      key={action.id}
                      type={(action.type as 'warning' | 'info' | 'action') ?? 'info'}
                      title={action.title}
                      description={action.subtitle}
                      onPress={
                        action.id === 'uncategorised' || action.title.toLowerCase().includes('uncategorised')
                          ? () => router.push('/transactions?filter=uncategorised')
                          : undefined
                      }
                    />
                  ))
                ) : (
                  <>
                    {(income?.total ?? 0) === 0 && (
                      <ActionCard
                        type="action"
                        title="Connect your bank"
                        description="Link your bank account to automatically track income and expenses."
                        icon={Landmark}
                        onPress={handleConnectBank}
                      />
                    )}
                    <ActionCard
                      type="warning"
                      title={`Q${quarter} payment due`}
                      description="Submit your quarterly update to HMRC before the deadline."
                      icon={Clock}
                      onPress={() => router.push('/mtd')}
                    />
                    <ActionCard
                      type="success"
                      title="Tax pot on track"
                      description="You're setting aside enough to cover your tax bill."
                      icon={CheckCircle}
                      onPress={() => router.push('/(tabs)/settings')}
                    />
                  </>
                )}
              </View>

              {/* Quarter Timeline */}
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionHeading, { color: colors.text }]} accessibilityRole="header">Tax year quarters</Text>
              </View>
              <Card>
                <QuarterTimeline currentQuarter={quarter} taxYear={taxYear} />
              </Card>
              <Pressable
                style={({ pressed }) => [styles.taxHistoryLink, { borderColor: colors.border }, pressed && styles.pressedCard]}
                onPress={() => router.push('/tax-history')}
                accessibilityRole="button"
                accessibilityLabel="View full tax history"
              >
                <Clock size={14} color="#0066FF" strokeWidth={1.5} style={{ marginRight: 8 }} />
                <Text style={[styles.taxHistoryText, { color: colors.text }]}>View Tax History</Text>
                <ChevronRight size={11} color={colors.textSecondary} strokeWidth={1.5} />
              </Pressable>

              {/* Income by Source */}
              {income && income.bySource.length > 0 && (
                <>
                  <View style={styles.sectionHeader}>
                    <Text style={[styles.sectionHeading, { color: colors.text }]} accessibilityRole="header">Income by Source</Text>
                  </View>
                  <Card>
                    {income.bySource.map((src, index) => {
                      const isLast = index === income.bySource.length - 1;
                      return (
                        <View
                          key={src.name}
                          style={[
                            styles.sourceRow,
                            !isLast && { borderBottomColor: colors.border, borderBottomWidth: 1 },
                          ]}
                          accessible
                          accessibilityLabel={`${src.name}: ${formatCurrency(src.amount)}, ${src.percentage}% of income`}
                        >
                          <View style={styles.sourceLeft}>
                            <View style={[styles.sourceDot, { backgroundColor: SOURCE_COLORS[index % SOURCE_COLORS.length] }]} importantForAccessibility="no" accessibilityElementsHidden={true} />
                            <Text style={[styles.sourceName, { color: colors.text }]}>{src.name}</Text>
                          </View>
                          <View style={styles.sourceRight}>
                            <Text style={[styles.sourceAmount, { color: colors.text }]}>{formatCurrency(src.amount)}</Text>
                            <View style={[styles.sourceBar, { backgroundColor: '#666666' }]} importantForAccessibility="no" accessibilityElementsHidden={true}>
                              <View style={[styles.sourceBarFill, { width: `${src.percentage}%`, backgroundColor: SOURCE_COLORS[index % SOURCE_COLORS.length] }]} />
                            </View>
                          </View>
                        </View>
                      );
                    })}
                  </Card>
                </>
              )}
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    padding: Spacing.lg,
    gap: Spacing.lg,
    paddingBottom: Spacing.xxl + Spacing.lg,
  },

  // Header / Greeting
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  headerLeft: {
    flex: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  greeting: {
    fontFamily: Fonts.sourceSans.regular,
    fontSize: 12.5,
  },
  name: {
    fontFamily: Fonts.lexend.semiBold,
    fontSize: 28,
    marginTop: 2,
    letterSpacing: -0.3,
  },

  // Avatar circle (mockup style)
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#0066FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontFamily: Fonts.mono.semiBold,
    fontSize: 15,
    color: Colors.white,
  },

  // Health badge
  healthBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: BorderRadius.pill,
  },
  healthText: {
    fontFamily: Fonts.sourceSans.semiBold,
    fontSize: 11.5,
  },

  // Press state for interactive cards
  pressedCard: {
    transform: [{ scale: 0.98 }],
    opacity: 0.95,
  },

  // Hero Tax Card
  heroCard: {
    borderRadius: 22,
    padding: Spacing.lg,
    paddingBottom: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    shadowColor: 'rgba(0,0,0,0.5)',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 1,
    shadowRadius: 28,
    elevation: 8,
  },
  heroGlow: {
    position: 'absolute',
    top: -60,
    right: -60,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(0,102,255,0.1)',
  },
  heroGlowSecondary: {
    position: 'absolute',
    bottom: -40,
    left: -40,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(0,102,255,0.12)',
  },
  heroLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 5,
  },
  heroLabelDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#0066FF',
  },
  heroLabel: {
    fontFamily: Fonts.lexend.semiBold,
    fontSize: 10,
    color: 'rgba(255,255,255,0.55)',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  heroAmount: {
    fontFamily: Fonts.lexend.semiBold,
    fontSize: 40,
    color: Colors.white,
    lineHeight: 42,
    letterSpacing: -1,
  },
  heroSubtext: {
    fontFamily: Fonts.sourceSans.regular,
    fontSize: 11.5,
    color: 'rgba(255,255,255,0.45)',
    marginTop: Spacing.xs,
  },

  // 3 glassmorphic metric boxes
  heroRow: {
    flexDirection: 'row',
    gap: 7,
    marginTop: 16,
  },
  heroBox: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  heroBoxLabel: {
    fontFamily: Fonts.sourceSans.semiBold,
    fontSize: 9.5,
    color: 'rgba(255,255,255,0.5)',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    marginBottom: 2,
  },
  heroBoxValue: {
    fontFamily: Fonts.lexend.semiBold,
    fontSize: 16,
    color: Colors.white,
  },
  heroBoxExpenses: {
    color: '#86EFAC',
  },

  // Monthly set-aside callout inside hero
  heroSetAside: {
    marginTop: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(0,102,255,0.12)',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  heroSetAsideLabel: {
    fontFamily: Fonts.lexend.semiBold,
    fontSize: 10.5,
    color: '#0066FF',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  heroSetAsideAmount: {
    fontFamily: Fonts.mono.semiBold,
    fontSize: 22,
    color: '#0066FF',
  },

  // Insight banner
  insightBanner: {
    borderRadius: BorderRadius.card,
    padding: 11,
    paddingHorizontal: 13,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 9,
  },
  insightIcon: {
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  insightText: {
    fontFamily: Fonts.sourceSans.regular,
    fontSize: 12.5,
    lineHeight: 18,
    flex: 1,
  },

  // Set Aside card
  setAsideCard: {
    borderRadius: BorderRadius.card,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 2,
    borderColor: '#0066FF',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  setAsideLabel: {
    fontFamily: Fonts.lexend.semiBold,
    fontSize: 10.5,
    color: '#0066FF',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  setAsideAmount: {
    fontFamily: Fonts.mono.semiBold,
    fontSize: 26,
    marginTop: 2,
  },
  setAsideRight: {
    alignItems: 'flex-end',
  },
  onTrackBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0,200,83,0.1)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: BorderRadius.pill,
  },
  onTrackText: {
    fontFamily: Fonts.sourceSans.semiBold,
    fontSize: 13,
    color: '#00C853',
  },

  // Actions
  actions: {
    gap: 8,
  },

  // Section headers
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  sectionHeading: {
    fontFamily: Fonts.lexend.semiBold,
    fontSize: 16,
    letterSpacing: -0.2,
  },

  // Income trend chart
  chartHeader: {
    marginBottom: 12,
  },
  chartTitle: {
    fontFamily: Fonts.lexend.semiBold,
    fontSize: 16,
    letterSpacing: -0.2,
  },
  chartSubtitle: {
    fontFamily: Fonts.sourceSans.regular,
    fontSize: 12,
    marginTop: 2,
  },

  // Income sources
  sourceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  sourceLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  sourceDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  sourceName: {
    fontFamily: Fonts.sourceSans.regular,
    fontSize: 14,
  },
  sourceRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  sourceAmount: {
    fontFamily: Fonts.sourceSans.semiBold,
    fontSize: 14,
  },
  sourceBar: {
    width: 60,
    height: 4,
    borderRadius: 2,
  },
  sourceBarFill: {
    height: 4,
    backgroundColor: '#0066FF',
    borderRadius: 2,
  },
  taxHistoryLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginTop: 8,
    borderWidth: 1,
    borderRadius: BorderRadius.card,
  },
  taxHistoryText: {
    fontFamily: Fonts.sourceSans.semiBold,
    fontSize: 13,
    flex: 1,
  },
});

/* ── Welcome State Styles (ws) ── */
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
