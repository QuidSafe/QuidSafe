import { useState, useEffect, useRef, useCallback } from 'react';
import { StyleSheet, View, Text, ScrollView, RefreshControl, Pressable, Alert, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as WebBrowser from 'expo-web-browser';
import { useUser } from '@clerk/clerk-expo';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Card } from '@/components/ui/Card';
import { ActionCard } from '@/components/ui/ActionCard';
import { QuarterTimeline } from '@/components/ui/QuarterTimeline';
import { SkeletonCard } from '@/components/ui/Skeleton';
import { Colors, Spacing, BorderRadius, Shadows } from '@/constants/Colors';
import { useDashboard } from '@/lib/hooks/useApi';
import { api } from '@/lib/api';
import { formatCurrency } from '@/lib/tax-engine';
import { useTheme } from '@/lib/ThemeContext';

const SOURCE_COLORS = [
  Colors.secondary,   // Royal Blue
  Colors.accent,      // Warm Gold
  Colors.success,     // Green
  '#8B5CF6',          // Purple
  '#EC4899',          // Pink
  '#06B6D4',          // Cyan
  Colors.error,       // Red
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
  const { data, isLoading, refetch, isRefetching } = useDashboard();
  const { colors, isDark } = useTheme();

  const [isConnecting, setIsConnecting] = useState(false);

  // Entrance animations — staggered for sections
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(16)).current;
  const heroFade = useRef(new Animated.Value(0)).current;
  const heroSlide = useRef(new Animated.Value(20)).current;
  const contentFade = useRef(new Animated.Value(0)).current;
  const contentSlide = useRef(new Animated.Value(14)).current;

  useEffect(() => {
    if (!isLoading) {
      // Header fades in first
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 350,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 350,
          useNativeDriver: true,
        }),
      ]).start();

      // Hero card comes in slightly after
      Animated.sequence([
        Animated.delay(100),
        Animated.parallel([
          Animated.timing(heroFade, {
            toValue: 1,
            duration: 450,
            useNativeDriver: true,
          }),
          Animated.timing(heroSlide, {
            toValue: 0,
            duration: 450,
            useNativeDriver: true,
          }),
        ]),
      ]).start();

      // Rest of content comes in last
      Animated.sequence([
        Animated.delay(220),
        Animated.parallel([
          Animated.timing(contentFade, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(contentSlide, {
            toValue: 0,
            duration: 400,
            useNativeDriver: true,
          }),
        ]),
      ]).start();
    }
  }, [isLoading, fadeAnim, slideAnim, heroFade, heroSlide, contentFade, contentSlide]);

  const firstName = user?.firstName ?? data?.user?.name?.split(' ')[0] ?? '';
  const tax = data?.tax;
  const income = data?.income;
  const quarter = data?.quarters?.current?.quarter ?? 1;
  const taxYear = data?.quarters?.current?.taxYear ?? '2026/27';
  const actions = data?.actions;

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
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.tint} />}
      >
        {/* Header / Greeting */}
        <View style={styles.header} accessible={true} accessibilityRole="header">
          <View style={styles.headerLeft}>
            <Text style={[styles.greeting, { color: colors.textSecondary }]}>{getGreeting()}</Text>
            <Text style={[styles.name, { color: colors.text }]} accessibilityRole="header">
              {firstName || 'Welcome'}
            </Text>
          </View>
          {/* Health badge — income growth indicator */}
          {income && (income.total ?? 0) > 0 && (
            <View style={styles.healthBadge}>
              <FontAwesome name="arrow-up" size={10} color={Colors.success} />
              <Text style={styles.healthText}>+12%</Text>
            </View>
          )}
        </View>

        {isLoading ? (
          <>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : (
          <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
            {/* Hero Tax Card */}
            <Pressable
              accessible={true}
              accessibilityRole="summary"
              accessibilityLabel={`Tax summary. Set aside ${formatCurrency(tax?.totalTaxOwed ?? 0)} for tax based on ${formatCurrency(tax?.totalIncome ?? 0)} income this tax year`}
              style={({ pressed }) => [pressed && styles.pressedCard]}
            >
              <LinearGradient
                colors={isDark ? ['#1E293B', '#0F172A'] : ['#0F172A', '#1E3A8A']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.heroCard}
              >
                {/* Radial gold glow overlay */}
                <View style={styles.heroGlow} />
                <View style={styles.heroGlowSecondary} />

                {/* Label row with gold dot */}
                <View style={styles.heroLabelRow}>
                  <View style={styles.heroLabelDot} />
                  <Text style={styles.heroLabel}>SET ASIDE FOR TAX</Text>
                </View>

                <Text style={styles.heroAmount}>
                  {formatCurrency(tax?.totalTaxOwed ?? 0)}
                </Text>
                <Text style={styles.heroSubtext}>
                  Based on {formatCurrency(tax?.totalIncome ?? 0)} income this tax year
                </Text>

                {/* 3 glassmorphic boxes — separate cards like mockup */}
                <View style={styles.heroRow}>
                  <View style={styles.heroBox}>
                    <Text style={styles.heroBoxLabel}>Income Tax</Text>
                    <Text style={styles.heroBoxValue}>
                      {formatCurrency(tax?.incomeTax?.total ?? 0)}
                    </Text>
                  </View>
                  <View style={styles.heroBox}>
                    <Text style={styles.heroBoxLabel}>NI (Class 4)</Text>
                    <Text style={styles.heroBoxValue}>
                      {formatCurrency(tax?.nationalInsurance?.total ?? 0)}
                    </Text>
                  </View>
                  <View style={styles.heroBox}>
                    <Text style={styles.heroBoxLabel}>Expenses</Text>
                    <Text style={[styles.heroBoxValue, styles.heroBoxExpenses]}>
                      -{formatCurrency(tax?.totalExpenses ?? 0)}
                    </Text>
                  </View>
                </View>

                {/* Monthly set-aside — gold highlight inside hero */}
                <View style={styles.heroSetAside}>
                  <Text style={styles.heroSetAsideLabel}>Set aside this month</Text>
                  <Text style={styles.heroSetAsideAmount}>
                    {formatCurrency(tax?.setAsideMonthly ?? 0)}
                  </Text>
                </View>
              </LinearGradient>
            </Pressable>

            {/* Plain English Insight */}
            {tax?.plainEnglish ? (
              <Pressable
                accessible={true}
                accessibilityRole="text"
                accessibilityLabel={`Tax insight: ${tax.plainEnglish}`}
                style={({ pressed }) => [
                  styles.insightBanner,
                  { backgroundColor: colors.surface },
                  pressed && styles.pressedCard,
                ]}
              >
                <View style={styles.insightIcon}>
                  <FontAwesome name="lightbulb-o" size={14} color={Colors.secondary} />
                </View>
                <Text style={[styles.insightText, { color: colors.text }]}>{tax.plainEnglish}</Text>
              </Pressable>
            ) : null}

            {/* Set aside card — effective rate */}
            <Pressable
              accessible={true}
              accessibilityRole="summary"
              accessibilityLabel={`Effective tax rate ${tax?.effectiveRate ? `${tax.effectiveRate}%` : '0%'}`}
              style={({ pressed }) => [
                styles.setAsideCard,
                { backgroundColor: isDark ? '#292524' : Colors.gold[50] },
                pressed && styles.pressedCard,
              ]}
            >
              <View>
                <Text style={styles.setAsideLabel}>SET ASIDE THIS MONTH</Text>
                <Text style={[styles.setAsideAmount, { color: Colors.accent }]}>
                  {formatCurrency(tax?.setAsideMonthly ?? 0)}
                </Text>
              </View>
              <View style={styles.setAsideRight}>
                <Text style={styles.setAsideRate}>
                  {tax?.effectiveRate ? `${tax.effectiveRate}%` : '0%'}
                </Text>
                <Text style={styles.setAsideRateLabel}>effective rate</Text>
              </View>
            </Pressable>

            {/* Section heading */}
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionHeading, { color: colors.text }]}>What needs doing</Text>
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
                  />
                ))
              ) : (
                <>
                  {(income?.total ?? 0) === 0 && (
                    <ActionCard
                      type="action"
                      title="Connect your bank"
                      description="Link your bank account to automatically track income and expenses."
                      icon="university"
                      onPress={handleConnectBank}
                    />
                  )}
                  <ActionCard
                    type="warning"
                    title={`Q${quarter} payment due`}
                    description="Submit your quarterly update to HMRC before the deadline."
                    icon="clock-o"
                  />
                  <ActionCard
                    type="success"
                    title="Tax pot on track"
                    description="You're setting aside enough to cover your tax bill."
                    icon="check-circle"
                  />
                </>
              )}
            </View>

            {/* Quarter Timeline */}
            <Card>
              <QuarterTimeline currentQuarter={quarter} taxYear={taxYear} />
            </Card>

            {/* Income by Source */}
            {income && income.bySource.length > 0 && (
              <Card>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Income by Source</Text>
                {income.bySource.map((src, index) => (
                  <View key={src.name} style={[styles.sourceRow, { borderBottomColor: colors.border }]}>
                    <View style={styles.sourceLeft}>
                      <View style={[styles.sourceDot, { backgroundColor: SOURCE_COLORS[index % SOURCE_COLORS.length] }]} />
                      <Text style={[styles.sourceName, { color: colors.text }]}>{src.name}</Text>
                    </View>
                    <View style={styles.sourceRight}>
                      <Text style={[styles.sourceAmount, { color: colors.text }]}>{formatCurrency(src.amount)}</Text>
                      <View style={[styles.sourceBar, { backgroundColor: isDark ? Colors.grey[700] : Colors.grey[200] }]}>
                        <View style={[styles.sourceBarFill, { width: `${src.percentage}%`, backgroundColor: SOURCE_COLORS[index % SOURCE_COLORS.length] }]} />
                      </View>
                    </View>
                  </View>
                ))}
              </Card>
            )}
          </Animated.View>
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
    gap: Spacing.md,
    paddingBottom: Spacing.xxl,
  },
  header: {
    marginBottom: Spacing.xs,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerLeft: {
    flex: 1,
  },
  greeting: {
    fontFamily: 'Manrope_400Regular',
    fontSize: 14,
  },
  name: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 28,
    marginTop: 2,
  },

  healthBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(22, 163, 74, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.pill,
    marginTop: 6,
  },
  healthText: {
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 11,
    color: Colors.success,
  },

  // Press state for interactive cards
  pressedCard: {
    transform: [{ scale: 0.98 }],
    opacity: 0.95,
  },

  // Hero Tax Card
  heroCard: {
    borderRadius: BorderRadius.hero,
    padding: 22,
    overflow: 'hidden',
    ...Shadows.large,
  },
  heroGlow: {
    position: 'absolute',
    top: -50,
    right: -50,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(202, 138, 4, 0.12)',
  },
  heroGlowSecondary: {
    position: 'absolute',
    bottom: -40,
    left: -40,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(30, 58, 138, 0.15)',
  },
  heroLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  heroLabelDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.accent,
  },
  heroLabel: {
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 10,
    color: 'rgba(255,255,255,0.55)',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  heroAmount: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 36,
    color: Colors.white,
    marginTop: 4,
  },
  heroSubtext: {
    fontFamily: 'Manrope_400Regular',
    fontSize: 11.5,
    color: 'rgba(255,255,255,0.45)',
    marginTop: Spacing.xs,
  },
  heroRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 18,
  },
  heroBox: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    paddingVertical: 12,
    paddingHorizontal: 10,
    alignItems: 'center',
  },
  heroBoxLabel: {
    fontFamily: 'Manrope_500Medium',
    fontSize: 10,
    color: 'rgba(255,255,255,0.55)',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  heroBoxValue: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 17,
    color: Colors.white,
    marginTop: 4,
  },
  heroBoxExpenses: {
    color: '#4ADE80',
  },
  heroSetAside: {
    marginTop: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(202, 138, 4, 0.12)',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  heroSetAsideLabel: {
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 11,
    color: Colors.accent,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  heroSetAsideAmount: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 20,
    color: Colors.accent,
  },
  heroSplit: {
    flexDirection: 'row',
    marginTop: 18,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    overflow: 'hidden',
  },
  heroSplitBox: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 8,
  },
  heroSplitDivider: {
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  splitLabel: {
    fontFamily: 'Manrope_500Medium',
    fontSize: 10,
    color: 'rgba(255,255,255,0.55)',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  splitValue: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 17,
    color: Colors.white,
    marginTop: 4,
  },
  splitExpenses: {
    color: '#4ADE80',
  },

  // Insight banner
  insightBanner: {
    borderRadius: BorderRadius.card,
    padding: Spacing.md,
    borderLeftWidth: 3,
    borderLeftColor: Colors.secondary,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    ...Shadows.soft,
  },
  insightIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.secondary + '12',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  insightText: {
    fontFamily: 'Manrope_500Medium',
    fontSize: 14,
    lineHeight: 22,
    flex: 1,
  },

  // Set Aside card
  setAsideCard: {
    borderRadius: BorderRadius.card,
    padding: Spacing.md,
    borderWidth: 2,
    borderColor: Colors.accent,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  setAsideLabel: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 10.5,
    color: Colors.gold[700],
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  setAsideAmount: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 26,
    marginTop: 2,
  },
  setAsideRight: {
    alignItems: 'flex-end',
  },
  setAsideRate: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 20,
    color: Colors.accent,
  },
  setAsideRateLabel: {
    fontFamily: 'Manrope_400Regular',
    fontSize: 11,
    color: Colors.gold[700],
  },

  // Actions
  actions: {
    gap: 7,
  },

  // Section
  sectionHeader: {
    marginTop: Spacing.xs,
  },
  sectionHeading: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 18,
  },
  sectionTitle: {
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 16,
    marginBottom: Spacing.md,
  },

  // Income sources
  sourceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  sourceLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  sourceDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  sourceName: {
    fontFamily: 'Manrope_500Medium',
    fontSize: 14,
  },
  sourceRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  sourceAmount: {
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 14,
  },
  sourceBar: {
    width: 60,
    height: 4,
    borderRadius: 2,
  },
  sourceBarFill: {
    height: 4,
    backgroundColor: Colors.secondary,
    borderRadius: 2,
  },
});
