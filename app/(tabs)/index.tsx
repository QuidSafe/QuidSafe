import { useState, useEffect, useRef, useMemo } from 'react';
import { StyleSheet, View, Text, ScrollView, RefreshControl, Pressable, Alert, Animated, Platform, BackHandler } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as WebBrowser from 'expo-web-browser';
import { useUser } from '@clerk/clerk-expo';
import { useRouter } from 'expo-router';
import { ArrowUp, ArrowDown, Landmark, Lightbulb, Check, ChevronRight, Clock, CheckCircle, Receipt, Users, Car, TrendingUp } from 'lucide-react-native';
import { Card } from '@/components/ui/Card';
import { ActionCard } from '@/components/ui/ActionCard';
import { MiniChart } from '@/components/ui/MiniChart';
import { QuarterTimeline } from '@/components/ui/QuarterTimeline';
import { DashboardSkeleton } from '@/components/ui/Skeleton';
import { TaxHeroCard } from '@/components/ui/TaxHeroCard';
import { WelcomeState } from '@/components/ui/WelcomeState';
import { IncomeBySource } from '@/components/ui/IncomeBySource';
import { colors, Colors, Spacing, BorderRadius } from '@/constants/Colors';
import { Fonts } from '@/constants/Typography';
import { useDashboard } from '@/lib/hooks/useApi';
import { api } from '@/lib/api';
import { formatCurrency } from '@/lib/tax-engine';

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
  Colors.electricBlue,
  Colors.electricBlue,
  Colors.success,
  Colors.electricBlue,
  '#EC4899',
  '#06B6D4',
  Colors.error,
  Colors.warning,
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
  const quarter = data?.quarters?.current?.quarter ?? 1;
  const taxYear = data?.quarters?.current?.taxYear ?? '2026/27';
  const actions = data?.actions;
  const isWelcome = (income?.total ?? 0) === 0 && (!actions || actions.length === 0);

  // Memoise derived income chart data - was recomputing on every render
  const { yoyGrowth, incomeChart } = useMemo(() => {
    const byMonth = income?.byMonth;
    const growth = calcYoYGrowth(byMonth);
    if (!byMonth || byMonth.length === 0) {
      return { yoyGrowth: growth, incomeChart: null };
    }
    const sorted = [...byMonth].sort((a, b) => a.month.localeCompare(b.month));
    const last6 = sorted.slice(-6);
    const MONTH_SHORT: Record<string, string> = {
      '01': 'J', '02': 'F', '03': 'M', '04': 'A', '05': 'M', '06': 'J',
      '07': 'J', '08': 'A', '09': 'S', '10': 'O', '11': 'N', '12': 'D',
    };
    return {
      yoyGrowth: growth,
      incomeChart: {
        data: last6.map((m) => ({
          label: MONTH_SHORT[m.month.split('-')[1]] ?? m.month.slice(-2),
          value: m.income,
        })),
        periodTotal: last6.reduce((s, m) => s + m.income, 0),
        monthCount: last6.length,
      },
    };
  }, [income?.byMonth]);

  // Android: dismiss browser on hardware back press during OAuth flow
  useEffect(() => {
    if (Platform.OS !== 'android' || !isConnecting) return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      WebBrowser.dismissBrowser();
      setIsConnecting(false);
      return true;
    });
    return () => sub.remove();
  }, [isConnecting]);

  const handleConnectBank = async () => {
    if (isConnecting) return;
    setIsConnecting(true);
    try {
      const { url } = await api.getConnectUrl(Platform.OS !== 'web' ? 'native' : undefined);
      if (Platform.OS === 'web') {
        // Native's WebBrowser.openBrowserAsync no-ops on web. Use window.open
        // so the TrueLayer OAuth page actually loads in a new tab.
        window.open(url, '_blank', 'noopener,noreferrer');
      } else {
        await WebBrowser.openBrowserAsync(url);
      }
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
            {firstName ? (
              <>
                <Text style={[styles.greeting, { color: colors.textSecondary }]}>{getGreeting()}</Text>
                <Text style={[styles.name, { color: colors.text }]} accessibilityRole="header">
                  {firstName}
                </Text>
              </>
            ) : (
              <Text style={[styles.name, { color: colors.text }]} accessibilityRole="header">
                {getGreeting()}
              </Text>
            )}
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
                <Text style={[styles.healthText, { color: yoyGrowth >= 0 ? Colors.success : Colors.error }]}>
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
          <WelcomeState isConnecting={isConnecting} onConnectBank={handleConnectBank} />
        ) : (
          <>
            {/* Hero Tax Card */}
            <View>
              <TaxHeroCard tax={tax} />
            </View>

            {/* Income Trend Chart */}
            {incomeChart && (
              <View>
                <Card>
                  <View style={styles.chartHeader}>
                    <Text style={[styles.chartTitle, { color: colors.text }]} accessibilityRole="header">Income Trend</Text>
                    <Text style={[styles.chartSubtitle, { color: colors.textSecondary }]}>
                      {formatCurrency(incomeChart.periodTotal)} over {incomeChart.monthCount} months
                    </Text>
                  </View>
                  <MiniChart data={incomeChart.data} color="#00C853" height={72} />
                </Card>
              </View>
            )}

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
                  <Text style={[styles.insightText, { color: Colors.electricBlue }]}>
                    {tax.plainEnglish}
                  </Text>
                </Pressable>
              ) : null}

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
                <Pressable
                  onPress={() => router.push('/tax-history')}
                  accessibilityRole="link"
                  accessibilityLabel="View full tax history"
                  hitSlop={8}
                >
                  <Text style={styles.sectionLink}>View history →</Text>
                </Pressable>
              </View>
              <Card>
                <QuarterTimeline currentQuarter={quarter} taxYear={taxYear} />
              </Card>

              {/* Quick links to tools */}
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionHeading, { color: colors.text }]} accessibilityRole="header">Your tools</Text>
              </View>
              <View style={styles.quickLinks}>
                <Pressable style={({ pressed }) => [styles.quickLink, pressed && styles.pressedCard]} onPress={() => router.push('/invoices')} accessibilityRole="button">
                  <Receipt size={16} color={Colors.electricBlue} strokeWidth={1.5} />
                  <Text style={styles.quickLinkText}>Invoices</Text>
                  <ChevronRight size={12} color={colors.textMuted} strokeWidth={1.5} />
                </Pressable>
                <Pressable style={({ pressed }) => [styles.quickLink, pressed && styles.pressedCard]} onPress={() => router.push('/clients' as any)} accessibilityRole="button">
                  <Users size={16} color={Colors.electricBlue} strokeWidth={1.5} />
                  <Text style={styles.quickLinkText}>Clients</Text>
                  <ChevronRight size={12} color={colors.textMuted} strokeWidth={1.5} />
                </Pressable>
                <Pressable style={({ pressed }) => [styles.quickLink, pressed && styles.pressedCard]} onPress={() => router.push('/mileage' as any)} accessibilityRole="button">
                  <Car size={16} color={Colors.electricBlue} strokeWidth={1.5} />
                  <Text style={styles.quickLinkText}>Mileage</Text>
                  <ChevronRight size={12} color={colors.textMuted} strokeWidth={1.5} />
                </Pressable>
                <Pressable style={({ pressed }) => [styles.quickLink, pressed && styles.pressedCard]} onPress={() => router.push('/pnl-report' as any)} accessibilityRole="button">
                  <TrendingUp size={16} color={Colors.electricBlue} strokeWidth={1.5} />
                  <Text style={styles.quickLinkText}>P&L Report</Text>
                  <ChevronRight size={12} color={colors.textMuted} strokeWidth={1.5} />
                </Pressable>
              </View>

              {/* Income by Source */}
              {income && income.bySource.length > 0 && (
                <>
                  <View style={styles.sectionHeader}>
                    <Text style={[styles.sectionHeading, { color: colors.text }]} accessibilityRole="header">Income by Source</Text>
                  </View>
                  <Card>
                    <IncomeBySource sources={income.bySource} sourceColors={SOURCE_COLORS} />
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
    fontSize: 14,
    lineHeight: 20,
  },
  name: {
    fontFamily: Fonts.lexend.semiBold,
    fontSize: 28,
    lineHeight: 34,
    marginTop: 2,
    letterSpacing: -0.3,
  },

  // Avatar circle
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.electricBlue,
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
    fontSize: 12,
    lineHeight: 16,
  },

  // Press state for interactive cards
  pressedCard: {
    transform: [{ scale: 0.98 }],
    opacity: 0.95,
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
    fontSize: 14,
    lineHeight: 20,
    flex: 1,
  },

  // Set Aside card
  setAsideCard: {
    borderRadius: BorderRadius.card,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 2,
    borderColor: Colors.electricBlue,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  setAsideLabel: {
    fontFamily: Fonts.lexend.semiBold,
    fontSize: 10.5,
    color: Colors.electricBlue,
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
    color: Colors.success,
  },

  // Actions
  actions: {
    gap: 8,
  },

  // Section headers - room to breathe between groups
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginTop: Spacing.md + 4,
    marginBottom: 4,
  },
  sectionHeading: {
    fontFamily: Fonts.lexend.semiBold,
    fontSize: 18,
    lineHeight: 22,
    letterSpacing: -0.3,
  },
  sectionLink: {
    fontFamily: Fonts.sourceSans.semiBold,
    fontSize: 13,
    lineHeight: 18,
    color: Colors.electricBlue,
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
    fontSize: 13,
    lineHeight: 18,
    marginTop: 4,
  },

  // Quick links - 2-column grid so it feels like a dashboard,
  // not a list. On narrow widths, flexWrap keeps things readable.
  quickLinks: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: Spacing.sm,
  },
  quickLink: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 10,
    backgroundColor: Colors.charcoal,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: Spacing.md,
    flexBasis: '48%',
    flexGrow: 1,
    minWidth: 160,
  },
  quickLinkText: {
    fontFamily: Fonts.sourceSans.semiBold,
    fontSize: 14,
    lineHeight: 18,
    color: colors.text,
    flex: 1,
  },
});
