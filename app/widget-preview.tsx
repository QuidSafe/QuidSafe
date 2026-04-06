import { View, Text, ScrollView, Pressable, StyleSheet, Platform } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors, BorderRadius, Spacing } from '@/constants/Colors';
import { useTheme } from '@/lib/ThemeContext';
import { useDashboard, useTaxCalculation } from '@/lib/hooks/useApi';
import { SafeAreaView } from 'react-native-safe-area-context';

// --------------- Helpers ---------------

function formatGBP(amount: number): string {
  return `\u00A3${amount.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function getQuarterProgress(quarter: number): number {
  // Approximate progress through current quarter (0-1)
  const month = new Date().getMonth();
  const monthInQuarter = month % 3;
  return Math.min(1, (monthInQuarter + 1) / 3);
}

// --------------- Small Widget (2x2) ---------------

function SmallWidget({ taxSetAside, isDark }: { taxSetAside: number; isDark: boolean }) {
  return (
    <View style={[styles.widgetSmall, isDark ? styles.widgetDark : styles.widgetLight]}>
      <View style={styles.widgetSmallInner}>
        <FontAwesome name="gbp" size={14} color={Colors.accent} style={{ marginBottom: 6 }} />
        <Text style={[styles.widgetLabel, isDark && styles.widgetLabelDark]}>Tax Set Aside</Text>
        <Text style={styles.widgetAmountGold}>{formatGBP(taxSetAside)}</Text>
        <Text style={[styles.widgetBranding, isDark && styles.widgetBrandingDark]}>QuidSafe</Text>
      </View>
    </View>
  );
}

// --------------- Medium Widget (4x2) ---------------

function MediumWidget({
  taxSetAside,
  incomeThisMonth,
  expensesThisMonth,
  monthlyData,
  isDark,
}: {
  taxSetAside: number;
  incomeThisMonth: number;
  expensesThisMonth: number;
  monthlyData: { income: number; expenses: number }[];
  isDark: boolean;
}) {
  const maxVal = Math.max(...monthlyData.map((m) => Math.max(m.income, m.expenses)), 1);

  return (
    <View style={[styles.widgetMedium, isDark ? styles.widgetDark : styles.widgetLight]}>
      <View style={styles.widgetMediumTop}>
        <View style={styles.widgetMediumStat}>
          <Text style={[styles.widgetLabel, isDark && styles.widgetLabelDark]}>Tax Set Aside</Text>
          <Text style={styles.widgetAmountGold}>{formatGBP(taxSetAside)}</Text>
        </View>
        <View style={styles.widgetMediumDivider} />
        <View style={styles.widgetMediumStat}>
          <Text style={[styles.widgetLabel, isDark && styles.widgetLabelDark]}>Income</Text>
          <Text style={[styles.widgetAmountSmall, isDark && styles.widgetTextDark]}>
            {formatGBP(incomeThisMonth)}
          </Text>
        </View>
        <View style={styles.widgetMediumDivider} />
        <View style={styles.widgetMediumStat}>
          <Text style={[styles.widgetLabel, isDark && styles.widgetLabelDark]}>Expenses</Text>
          <Text style={[styles.widgetAmountSmall, isDark && styles.widgetTextDark]}>
            {formatGBP(expensesThisMonth)}
          </Text>
        </View>
      </View>
      <View style={styles.miniChart}>
        {monthlyData.slice(-6).map((m, i) => (
          <View key={i} style={styles.miniChartBar}>
            <View
              style={[
                styles.miniChartBarFill,
                { height: Math.max(2, (m.income / maxVal) * 24), backgroundColor: Colors.success },
              ]}
            />
            <View
              style={[
                styles.miniChartBarFill,
                { height: Math.max(2, (m.expenses / maxVal) * 24), backgroundColor: Colors.error, marginTop: 1 },
              ]}
            />
          </View>
        ))}
      </View>
      <Text style={[styles.widgetBranding, isDark && styles.widgetBrandingDark, { position: 'absolute', bottom: 8, right: 12 }]}>
        QuidSafe
      </Text>
    </View>
  );
}

// --------------- Large Widget (4x4) ---------------

function LargeWidget({
  taxSetAside,
  totalTaxOwed,
  totalIncome,
  totalExpenses,
  quarter,
  recentTransactions,
  isDark,
}: {
  taxSetAside: number;
  totalTaxOwed: number;
  totalIncome: number;
  totalExpenses: number;
  quarter: number;
  recentTransactions: { description: string; amount: number; type: string }[];
  isDark: boolean;
}) {
  const quarterProgress = getQuarterProgress(quarter);

  return (
    <View style={[styles.widgetLarge, isDark ? styles.widgetDark : styles.widgetLight]}>
      {/* Tax summary header */}
      <View style={styles.widgetLargeHeader}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.widgetLabel, isDark && styles.widgetLabelDark]}>Tax Set Aside</Text>
          <Text style={styles.widgetAmountGold}>{formatGBP(taxSetAside)}</Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={[styles.widgetLabel, isDark && styles.widgetLabelDark]}>Total Tax Owed</Text>
          <Text style={[styles.widgetAmountSmall, isDark && styles.widgetTextDark]}>
            {formatGBP(totalTaxOwed)}
          </Text>
        </View>
      </View>

      {/* Income / Expenses row */}
      <View style={styles.widgetLargeStats}>
        <View style={styles.widgetLargeStat}>
          <Text style={[styles.widgetLabelTiny, isDark && styles.widgetLabelDark]}>Income</Text>
          <Text style={[styles.widgetAmountTiny, { color: Colors.success }]}>{formatGBP(totalIncome)}</Text>
        </View>
        <View style={styles.widgetLargeStat}>
          <Text style={[styles.widgetLabelTiny, isDark && styles.widgetLabelDark]}>Expenses</Text>
          <Text style={[styles.widgetAmountTiny, { color: Colors.error }]}>{formatGBP(totalExpenses)}</Text>
        </View>
      </View>

      {/* Recent transactions */}
      <Text style={[styles.widgetSectionTitle, isDark && styles.widgetLabelDark]}>Recent</Text>
      {recentTransactions.slice(0, 3).map((tx, i) => (
        <View key={i} style={styles.widgetTransaction}>
          <Text
            style={[styles.widgetTxDesc, isDark && styles.widgetTextDark]}
            numberOfLines={1}
          >
            {tx.description}
          </Text>
          <Text
            style={[
              styles.widgetTxAmount,
              { color: tx.type === 'income' ? Colors.success : Colors.error },
            ]}
          >
            {tx.type === 'income' ? '+' : '-'}{formatGBP(Math.abs(tx.amount))}
          </Text>
        </View>
      ))}

      {/* Quarter progress */}
      <View style={styles.widgetQuarterRow}>
        <Text style={[styles.widgetLabelTiny, isDark && styles.widgetLabelDark]}>Q{quarter} Progress</Text>
        <View style={styles.widgetProgressTrack}>
          <View style={[styles.widgetProgressFill, { width: `${quarterProgress * 100}%` }]} />
        </View>
      </View>

      <Text style={[styles.widgetBranding, isDark && styles.widgetBrandingDark, { position: 'absolute', bottom: 8, right: 12 }]}>
        QuidSafe
      </Text>
    </View>
  );
}

// --------------- Main Screen ---------------

export default function WidgetPreviewScreen() {
  const { colors, isDark } = useTheme();
  const router = useRouter();
  const { data: taxData } = useTaxCalculation();
  const { data: dashData } = useDashboard();

  const taxSetAside = taxData?.setAsideMonthly ?? 0;
  const totalTaxOwed = taxData?.totalTaxOwed ?? 0;
  const totalIncome = taxData?.totalIncome ?? 0;
  const totalExpenses = taxData?.totalExpenses ?? 0;
  const quarter = taxData?.quarter ?? 1;

  const incomeThisMonth = dashData?.income?.byMonth?.slice(-1)?.[0]?.income ?? 0;
  const expensesThisMonth = dashData?.income?.byMonth?.slice(-1)?.[0]?.expenses ?? 0;
  const monthlyData = (dashData?.income?.byMonth ?? []).map((m) => ({
    income: m.income,
    expenses: m.expenses,
  }));

  // Placeholder recent transactions
  const recentTransactions = [
    { description: 'Client payment - Web design', amount: 1200, type: 'income' },
    { description: 'Adobe Creative Cloud', amount: 49.99, type: 'expense' },
    { description: 'Freelance consulting', amount: 450, type: 'income' },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <FontAwesome name="chevron-left" size={16} color={colors.text} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Home Screen Widget</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Small Widget */}
        <Text style={[styles.sizeLabel, { color: colors.textSecondary }]}>SMALL (2x2)</Text>
        <View style={styles.widgetWrapper}>
          <SmallWidget taxSetAside={taxSetAside} isDark={isDark} />
        </View>

        {/* Medium Widget */}
        <Text style={[styles.sizeLabel, { color: colors.textSecondary }]}>MEDIUM (4x2)</Text>
        <View style={styles.widgetWrapper}>
          <MediumWidget
            taxSetAside={taxSetAside}
            incomeThisMonth={incomeThisMonth}
            expensesThisMonth={expensesThisMonth}
            monthlyData={monthlyData.length > 0 ? monthlyData : [
              { income: 800, expenses: 200 },
              { income: 1200, expenses: 350 },
              { income: 950, expenses: 280 },
              { income: 1400, expenses: 400 },
              { income: 1100, expenses: 320 },
              { income: 1300, expenses: 380 },
            ]}
            isDark={isDark}
          />
        </View>

        {/* Large Widget */}
        <Text style={[styles.sizeLabel, { color: colors.textSecondary }]}>LARGE (4x4)</Text>
        <View style={styles.widgetWrapper}>
          <LargeWidget
            taxSetAside={taxSetAside}
            totalTaxOwed={totalTaxOwed}
            totalIncome={totalIncome}
            totalExpenses={totalExpenses}
            quarter={quarter}
            recentTransactions={recentTransactions}
            isDark={isDark}
          />
        </View>

        {/* Setup Instructions */}
        <View style={[styles.instructionsCard, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}>
          <View style={styles.instructionsHeader}>
            <View style={styles.comingSoonBadge}>
              <Text style={styles.comingSoonText}>Coming Soon</Text>
            </View>
          </View>
          <Text style={[styles.instructionsTitle, { color: colors.text }]}>
            Native widgets are on the way
          </Text>
          <Text style={[styles.instructionsBody, { color: colors.textSecondary }]}>
            Home screen widgets will be available in a future update. They will show your tax set-aside amount at a glance without opening the app.
          </Text>
          <Text style={[styles.instructionsSubhead, { color: colors.text }]}>
            For now, add QuidSafe to your home screen for quick access:
          </Text>

          {Platform.OS === 'ios' ? (
            <View style={styles.instructionRow}>
              <FontAwesome name="apple" size={16} color={colors.textSecondary} />
              <Text style={[styles.instructionText, { color: colors.textSecondary }]}>
                Tap Share then Add to Home Screen
              </Text>
            </View>
          ) : Platform.OS === 'android' ? (
            <View style={styles.instructionRow}>
              <FontAwesome name="android" size={16} color={colors.textSecondary} />
              <Text style={[styles.instructionText, { color: colors.textSecondary }]}>
                Tap Menu then Add to Home Screen
              </Text>
            </View>
          ) : (
            <>
              <View style={styles.instructionRow}>
                <FontAwesome name="apple" size={16} color={colors.textSecondary} />
                <Text style={[styles.instructionText, { color: colors.textSecondary }]}>
                  iOS: Tap Share then Add to Home Screen
                </Text>
              </View>
              <View style={styles.instructionRow}>
                <FontAwesome name="android" size={16} color={colors.textSecondary} />
                <Text style={[styles.instructionText, { color: colors.textSecondary }]}>
                  Android: Tap Menu then Add to Home Screen
                </Text>
              </View>
              <View style={styles.instructionRow}>
                <FontAwesome name="globe" size={16} color={colors.textSecondary} />
                <Text style={[styles.instructionText, { color: colors.textSecondary }]}>
                  Web: Your browser may support installing as a PWA
                </Text>
              </View>
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// --------------- Styles ---------------

const WIDGET_BG_LIGHT = 'rgba(255,255,255,0.95)';
const WIDGET_BG_DARK = 'rgba(255,255,255,0.07)';

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 20,
  },
  scroll: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  sizeLabel: {
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 10,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
    marginLeft: Spacing.xs,
  },
  widgetWrapper: {
    alignItems: 'center',
  },
  pressed: {
    opacity: 0.85,
  },

  // Widget shared
  widgetLight: {
    backgroundColor: WIDGET_BG_LIGHT,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 6,
  },
  widgetDark: {
    backgroundColor: WIDGET_BG_DARK,
    shadowColor: 'rgba(0,0,0,0.5)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 6,
  },
  widgetLabel: {
    fontFamily: 'Manrope_500Medium',
    fontSize: 10,
    color: Colors.grey[500],
  },
  widgetLabelDark: {
    color: Colors.grey[400],
  },
  widgetAmountGold: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 20,
    color: Colors.accent,
    marginTop: 2,
  },
  widgetAmountSmall: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 14,
    color: Colors.grey[800],
    marginTop: 2,
  },
  widgetTextDark: {
    color: Colors.grey[100],
  },
  widgetBranding: {
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 8,
    color: Colors.grey[400],
    letterSpacing: 0.5,
  },
  widgetBrandingDark: {
    color: Colors.grey[500],
  },

  // Small Widget
  widgetSmall: {
    width: 155,
    height: 155,
    borderRadius: 20,
    padding: 14,
  },
  widgetSmallInner: {
    flex: 1,
    justifyContent: 'space-between',
  },

  // Medium Widget
  widgetMedium: {
    width: '100%',
    maxWidth: 340,
    height: 155,
    borderRadius: 20,
    padding: 14,
  },
  widgetMediumTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    flex: 1,
  },
  widgetMediumStat: {
    flex: 1,
  },
  widgetMediumDivider: {
    width: 1,
    height: 36,
    backgroundColor: Colors.grey[300],
    marginHorizontal: 8,
    opacity: 0.4,
  },
  miniChart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 4,
    marginTop: 8,
    height: 28,
  },
  miniChartBar: {
    flex: 1,
    alignItems: 'center',
  },
  miniChartBarFill: {
    width: '80%',
    borderRadius: 2,
  },

  // Large Widget
  widgetLarge: {
    width: '100%',
    maxWidth: 340,
    minHeight: 310,
    borderRadius: 20,
    padding: 16,
  },
  widgetLargeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  widgetLargeStats: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12,
  },
  widgetLargeStat: {
    flex: 1,
  },
  widgetLabelTiny: {
    fontFamily: 'Manrope_500Medium',
    fontSize: 9,
    color: Colors.grey[500],
  },
  widgetAmountTiny: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 12,
    marginTop: 1,
  },
  widgetSectionTitle: {
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 9,
    color: Colors.grey[500],
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  widgetTransaction: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  widgetTxDesc: {
    fontFamily: 'Manrope_400Regular',
    fontSize: 11,
    color: Colors.grey[700],
    flex: 1,
    marginRight: 8,
  },
  widgetTxAmount: {
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 11,
  },
  widgetQuarterRow: {
    marginTop: 12,
  },
  widgetProgressTrack: {
    height: 4,
    backgroundColor: Colors.grey[200],
    borderRadius: 2,
    marginTop: 4,
    overflow: 'hidden',
  },
  widgetProgressFill: {
    height: '100%',
    backgroundColor: Colors.accent,
    borderRadius: 2,
  },

  // Instructions
  instructionsCard: {
    borderRadius: BorderRadius.card,
    borderWidth: 1,
    padding: Spacing.lg,
    marginTop: Spacing.xl,
  },
  instructionsHeader: {
    flexDirection: 'row',
    marginBottom: Spacing.md,
  },
  comingSoonBadge: {
    backgroundColor: Colors.grey[200],
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.pill,
  },
  comingSoonText: {
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 11,
    color: Colors.grey[500],
  },
  instructionsTitle: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 16,
    marginBottom: Spacing.sm,
  },
  instructionsBody: {
    fontFamily: 'Manrope_400Regular',
    fontSize: 13,
    lineHeight: 20,
    marginBottom: Spacing.md,
  },
  instructionsSubhead: {
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 13,
    marginBottom: Spacing.md,
  },
  instructionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: Spacing.sm,
  },
  instructionText: {
    fontFamily: 'Manrope_400Regular',
    fontSize: 13,
    flex: 1,
  },
});
