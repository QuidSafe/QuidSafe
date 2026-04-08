import { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Text, ScrollView, RefreshControl, Pressable, Alert, Animated, Platform, BackHandler } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as WebBrowser from 'expo-web-browser';
import { useUser } from '@clerk/clerk-expo';
import { useRouter } from 'expo-router';
import { ArrowUp, ArrowDown, Landmark, Lightbulb, Check, ChevronRight, Clock, CheckCircle } from 'lucide-react-native';
import { Card } from '@/components/ui/Card';
import { ActionCard } from '@/components/ui/ActionCard';
import { MiniChart } from '@/components/ui/MiniChart';
import { QuarterTimeline } from '@/components/ui/QuarterTimeline';
import { DashboardSkeleton } from '@/components/ui/Skeleton';
import { TaxHeroCard } from '@/components/ui/TaxHeroCard';
import { WelcomeState } from '@/components/ui/WelcomeState';
import { IncomeBySource } from '@/components/ui/IncomeBySource';
import { Colors, Spacing, BorderRadius } from '@/constants/Colors';
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
  '#0066FF',
  '#0066FF',
  '#00C853',
  '#0066FF',
  '#EC4899',
  '#06B6D4',
  '#FF3B30',
  '#F97316',
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
          <WelcomeState isConnecting={isConnecting} onConnectBank={handleConnectBank} />
        ) : (
          <>
            {/* Hero Tax Card */}
            <View>
              <TaxHeroCard tax={tax} />
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
    fontSize: 12.5,
  },
  name: {
    fontFamily: Fonts.lexend.semiBold,
    fontSize: 28,
    marginTop: 2,
    letterSpacing: -0.3,
  },

  // Avatar circle
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
