import { useState, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  Pressable,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Card } from '@/components/ui/Card';
import { Colors, Spacing, BorderRadius } from '@/constants/Colors';
import { useDashboard, useQuarterlyBreakdown, useExpenses } from '@/lib/hooks/useApi';
import { useTheme } from '@/lib/ThemeContext';
import { exportTaxSummaryCSV, downloadCSV } from '@/lib/export';
import type { TaxCalculation, Expense } from '@/lib/types';

// --------------- Constants ---------------

const TAX_YEAR = '2025/26';
const FILING_DEADLINE = new Date('2027-01-31');
const PAYMENT_DEADLINE = new Date('2027-01-31');
const TRADING_INCOME_ALLOWANCE = 1000;

// --------------- Helpers ---------------

function fmt(amount: number): string {
  return `£${Math.abs(amount).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function daysUntil(target: Date): number {
  const now = new Date();
  const diff = target.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

function formatDeadline(date: Date): string {
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
}

// --------------- SA103 Box Descriptions ---------------

const SA103_BOX_INFO: Record<string, string> = {
  '15': 'Your total business turnover — all income from self-employment before expenses.',
  '17': 'If your total trading income is under £1,000, you can use the trading income allowance instead of deducting expenses.',
  '20': 'The cost of goods you bought for resale, or raw materials used in your business.',
  '25': 'Total of all allowable business expenses you can deduct from your turnover.',
  '27': 'Your net business profit: turnover minus allowable expenses.',
  '30': 'The profit figure on which you pay tax, after adjustments.',
};

// Expense category labels for the breakdown
const EXPENSE_CATEGORIES = [
  { key: 'office', label: 'Office costs' },
  { key: 'travel', label: 'Travel' },
  { key: 'clothing', label: 'Clothing' },
  { key: 'staff', label: 'Staff costs' },
  { key: 'stock', label: 'Stock/materials' },
  { key: 'financial', label: 'Financial costs' },
  { key: 'premises', label: 'Business premises' },
  { key: 'legal', label: 'Legal/professional' },
  { key: 'marketing', label: 'Marketing' },
  { key: 'training', label: 'Training' },
  { key: 'other', label: 'Other' },
] as const;

// --------------- Expense Breakdown Helper ---------------

function buildExpenseBreakdown(expenses: Expense[]): Record<string, number> {
  const breakdown: Record<string, number> = {};
  for (const cat of EXPENSE_CATEGORIES) {
    breakdown[cat.key] = 0;
  }
  for (const expense of expenses) {
    const raw = (expense.hmrcCategory ?? 'other').toLowerCase();
    if (raw in breakdown) {
      breakdown[raw] += expense.amount;
    } else {
      breakdown['other'] += expense.amount;
    }
  }
  return breakdown;
}

// --------------- Components ---------------

function BoxBadge({ box }: { box: string }) {
  return (
    <View style={badgeStyles.container}>
      <Text style={badgeStyles.text}>Box {box}</Text>
    </View>
  );
}

const badgeStyles = StyleSheet.create({
  container: {
    backgroundColor: Colors.grey[200],
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.pill,
    alignSelf: 'flex-start',
  },
  text: {
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 10,
    color: Colors.grey[600],
  },
});

function InfoTooltip({ boxNumber, visible, onToggle }: { boxNumber: string; visible: boolean; onToggle: () => void }) {
  const { colors } = useTheme();
  return (
    <View>
      <Pressable
        onPress={onToggle}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel={`Info about SA103 Box ${boxNumber}`}
      >
        <FontAwesome name="info-circle" size={14} color={Colors.grey[400]} />
      </Pressable>
      {visible && (
        <View style={[tooltipStyles.bubble, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[tooltipStyles.text, { color: colors.textSecondary }]}>
            {SA103_BOX_INFO[boxNumber] ?? ''}
          </Text>
        </View>
      )}
    </View>
  );
}

const tooltipStyles = StyleSheet.create({
  bubble: {
    position: 'absolute',
    top: 22,
    right: 0,
    width: 220,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    zIndex: 100,
    elevation: 10,
  },
  text: {
    fontFamily: 'Manrope_400Regular',
    fontSize: 11,
    lineHeight: 16,
  },
});

function SA103Row({
  box,
  label,
  amount,
  activeTooltip,
  onToggleTooltip,
  isLast = false,
  children,
}: {
  box: string;
  label: string;
  amount: number;
  activeTooltip: string | null;
  onToggleTooltip: (box: string) => void;
  isLast?: boolean;
  children?: React.ReactNode;
}) {
  const { colors } = useTheme();
  return (
    <View style={[rowStyles.container, !isLast && { borderBottomWidth: 1, borderBottomColor: colors.border }]}>
      <View style={rowStyles.header}>
        <View style={rowStyles.left}>
          <BoxBadge box={box} />
          <Text style={[rowStyles.label, { color: colors.text }]}>{label}</Text>
        </View>
        <View style={rowStyles.right}>
          <Text style={[rowStyles.amount, { color: colors.text }]}>{fmt(amount)}</Text>
          <InfoTooltip
            boxNumber={box}
            visible={activeTooltip === box}
            onToggle={() => onToggleTooltip(box)}
          />
        </View>
      </View>
      {children}
    </View>
  );
}

const rowStyles = StyleSheet.create({
  container: {
    paddingVertical: 14,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  label: {
    fontFamily: 'Manrope_500Medium',
    fontSize: 13,
    flex: 1,
  },
  amount: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 14,
  },
});

function TaxLine({ label, amount, isBold = false }: { label: string; amount: number; isBold?: boolean }) {
  const { colors } = useTheme();
  return (
    <View style={taxLineStyles.row}>
      <Text
        style={[
          taxLineStyles.label,
          { color: isBold ? colors.text : colors.textSecondary },
          isBold && taxLineStyles.bold,
        ]}
      >
        {label}
      </Text>
      <Text
        style={[
          taxLineStyles.amount,
          { color: isBold ? colors.text : colors.textSecondary },
          isBold && taxLineStyles.bold,
        ]}
      >
        {fmt(amount)}
      </Text>
    </View>
  );
}

const taxLineStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  label: {
    fontFamily: 'Manrope_400Regular',
    fontSize: 12.5,
  },
  amount: {
    fontFamily: 'Manrope_500Medium',
    fontSize: 12.5,
  },
  bold: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 13.5,
  },
});

function ExpenseBreakdownRow({ label, amount }: { label: string; amount: number }) {
  const { colors } = useTheme();
  return (
    <View style={expenseStyles.row}>
      <Text style={[expenseStyles.label, { color: colors.textSecondary }]}>{label}</Text>
      <Text style={[expenseStyles.amount, { color: colors.textSecondary }]}>{fmt(amount)}</Text>
    </View>
  );
}

const expenseStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 3,
    paddingLeft: 20,
  },
  label: {
    fontFamily: 'Manrope_400Regular',
    fontSize: 11.5,
  },
  amount: {
    fontFamily: 'Manrope_500Medium',
    fontSize: 11.5,
  },
});

function DeadlineRow({ label, date, daysLeft }: { label: string; date: Date; daysLeft: number }) {
  const { colors } = useTheme();
  const urgencyColor = daysLeft <= 30 ? Colors.error : daysLeft <= 90 ? Colors.warning : Colors.success;
  return (
    <View style={deadlineStyles.row}>
      <View style={deadlineStyles.left}>
        <FontAwesome name="calendar" size={13} color={Colors.grey[400]} />
        <View>
          <Text style={[deadlineStyles.label, { color: colors.text }]}>{label}</Text>
          <Text style={[deadlineStyles.date, { color: colors.textSecondary }]}>{formatDeadline(date)}</Text>
        </View>
      </View>
      <View style={[deadlineStyles.badge, { backgroundColor: urgencyColor + '18' }]}>
        <Text style={[deadlineStyles.badgeText, { color: urgencyColor }]}>
          {daysLeft} days
        </Text>
      </View>
    </View>
  );
}

const deadlineStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  label: {
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 12.5,
  },
  date: {
    fontFamily: 'Manrope_400Regular',
    fontSize: 11,
    marginTop: 1,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.pill,
  },
  badgeText: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 11,
  },
});

// --------------- Build SA103 CSV ---------------

function buildSA103CSV(tax: TaxCalculation, breakdown: Record<string, number>): string {
  const headers = ['SA103 Box', 'Description', 'Amount'];
  const rows: string[][] = [
    ['Box 15', 'Turnover (total income)', fmt(tax.totalIncome)],
    ['Box 17', 'Trading income allowance', tax.totalIncome <= TRADING_INCOME_ALLOWANCE ? fmt(TRADING_INCOME_ALLOWANCE) : 'N/A'],
    ['Box 20', 'Cost of goods bought', fmt(breakdown['stock'] ?? 0)],
    ['Box 25', 'Total allowable expenses', fmt(tax.totalExpenses)],
  ];
  for (const cat of EXPENSE_CATEGORIES) {
    const amount = breakdown[cat.key] ?? 0;
    if (amount > 0) {
      rows.push(['', `  ${cat.label}`, fmt(amount)]);
    }
  }
  rows.push(
    ['Box 27', 'Net profit', fmt(tax.netProfit)],
    ['Box 30', 'Taxable profit', fmt(tax.taxableIncome)],
    ['', '', ''],
    ['', 'TAX CALCULATION', ''],
    ['', 'Personal allowance', fmt(tax.personalAllowance)],
    ['', 'Income tax (basic rate)', fmt(tax.incomeTax.basicRate)],
    ['', 'Income tax (higher rate)', fmt(tax.incomeTax.higherRate)],
    ['', 'Income tax (additional rate)', fmt(tax.incomeTax.additionalRate)],
    ['', 'Income tax total', fmt(tax.incomeTax.total)],
    ['', 'National Insurance Class 2', fmt(tax.nationalInsurance.class2)],
    ['', 'National Insurance Class 4', fmt(tax.nationalInsurance.class4)],
    ['', 'National Insurance total', fmt(tax.nationalInsurance.total)],
    ['', 'Total tax liability', fmt(tax.totalTaxOwed)],
  );
  const escape = (v: string) => (v.includes(',') || v.includes('"') ? `"${v.replace(/"/g, '""')}"` : v);
  return [headers.map(escape).join(','), ...rows.map((r) => r.map(escape).join(','))].join('\n');
}

// --------------- Main Screen ---------------

export default function SelfAssessmentScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { data: dashboardData, isLoading: dashLoading } = useDashboard();
  const { data: quarterlyData, isLoading: quarterLoading } = useQuarterlyBreakdown();
  const { data: expensesData, isLoading: expensesLoading } = useExpenses();

  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);

  const handleToggleTooltip = useCallback((box: string) => {
    setActiveTooltip((prev) => (prev === box ? null : box));
  }, []);

  const tax = dashboardData?.tax;
  const yearTotal = quarterlyData?.yearTotal;
  const expenses = expensesData?.expenses ?? [];
  const expenseBreakdown = buildExpenseBreakdown(expenses);
  const isLoading = dashLoading || quarterLoading || expensesLoading;

  // Use yearTotal if available for annual figures, otherwise fall back to dashboard tax
  const totalIncome = yearTotal?.income ?? tax?.totalIncome ?? 0;
  const totalExpenses = yearTotal?.expenses ?? tax?.totalExpenses ?? 0;
  const netProfit = totalIncome - totalExpenses;
  const useTradingAllowance = totalIncome <= TRADING_INCOME_ALLOWANCE;
  const taxableProfit = tax?.taxableIncome ?? Math.max(0, netProfit);

  const filingDaysLeft = daysUntil(FILING_DEADLINE);
  const paymentDaysLeft = daysUntil(PAYMENT_DEADLINE);

  // Payments on account: 50% of total tax for next year, if tax > £1000
  const totalTax = tax?.totalTaxOwed ?? 0;
  const paymentsOnAccount = totalTax > 1000 ? totalTax / 2 : 0;

  const handleExportCSV = useCallback(() => {
    if (!tax) return;
    const csv = buildSA103CSV(tax, expenseBreakdown);
    downloadCSV(csv, `SA103-Summary-${TAX_YEAR.replace('/', '-')}.csv`);
    Alert.alert('Exported', 'SA103 summary downloaded as CSV.');
  }, [tax]);

  const handleCopyClipboard = useCallback(async () => {
    if (!tax) return;
    const csv = buildSA103CSV(tax, expenseBreakdown);
    try {
      if (Platform.OS === 'web') {
        await navigator.clipboard.writeText(csv);
      } else {
        const { Clipboard } = await import('react-native');
        if (Clipboard?.setString) {
          Clipboard.setString(csv);
        }
      }
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch {
      Alert.alert('Error', 'Could not copy to clipboard.');
    }
  }, [tax]);

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.secondary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading tax data...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Back button */}
        <Pressable
          onPress={() => router.back()}
          style={styles.backButton}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <FontAwesome name="chevron-left" size={14} color={colors.text} />
          <Text style={[styles.backText, { color: colors.text }]}>Back</Text>
        </Pressable>

        {/* Header */}
        <Text style={[styles.title, { color: colors.text }]} accessibilityRole="header">
          Self Assessment Summary
        </Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Tax Year {TAX_YEAR}
        </Text>

        {/* SA103 Form Boxes */}
        <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>SA103 SELF EMPLOYMENT</Text>
        <Card style={styles.cardPadding}>
          {/* Box 15 — Turnover */}
          <SA103Row
            box="15"
            label="Turnover (total income)"
            amount={totalIncome}
            activeTooltip={activeTooltip}
            onToggleTooltip={handleToggleTooltip}
          />

          {/* Box 17 — Trading income allowance */}
          <SA103Row
            box="17"
            label="Trading income allowance"
            amount={useTradingAllowance ? TRADING_INCOME_ALLOWANCE : 0}
            activeTooltip={activeTooltip}
            onToggleTooltip={handleToggleTooltip}
          >
            {!useTradingAllowance && (
              <Text style={[styles.noteText, { color: colors.textSecondary }]}>
                Not applicable — income exceeds £1,000
              </Text>
            )}
          </SA103Row>

          {/* Box 20 — Cost of goods */}
          <SA103Row
            box="20"
            label="Cost of goods bought"
            amount={expenseBreakdown['stock'] ?? 0}
            activeTooltip={activeTooltip}
            onToggleTooltip={handleToggleTooltip}
          >
            {(expenseBreakdown['stock'] ?? 0) === 0 && (
              <Text style={[styles.noteText, { color: colors.textSecondary }]}>
                No stock/materials expenses recorded
              </Text>
            )}
          </SA103Row>

          {/* Box 25 — Total allowable expenses */}
          <SA103Row
            box="25"
            label="Total allowable expenses"
            amount={totalExpenses}
            activeTooltip={activeTooltip}
            onToggleTooltip={handleToggleTooltip}
          >
            <View style={styles.expenseBreakdown}>
              {EXPENSE_CATEGORIES.filter((cat) => (expenseBreakdown[cat.key] ?? 0) > 0).map((cat) => (
                <ExpenseBreakdownRow
                  key={cat.key}
                  label={cat.label}
                  amount={expenseBreakdown[cat.key] ?? 0}
                />
              ))}
              <Text style={[styles.noteText, { color: colors.textSecondary, marginTop: 4 }]}>
                Breakdown auto-populated from categorised expenses
              </Text>
            </View>
          </SA103Row>

          {/* Box 27 — Net profit */}
          <SA103Row
            box="27"
            label="Net profit"
            amount={netProfit}
            activeTooltip={activeTooltip}
            onToggleTooltip={handleToggleTooltip}
          />

          {/* Box 30 — Taxable profit */}
          <SA103Row
            box="30"
            label="Taxable profit"
            amount={taxableProfit}
            activeTooltip={activeTooltip}
            onToggleTooltip={handleToggleTooltip}
            isLast
          />
        </Card>

        {/* Tax Calculation Summary */}
        <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>TAX CALCULATION</Text>
        <Card style={styles.cardPadding}>
          <TaxLine label="Personal allowance" amount={tax?.personalAllowance ?? 12570} />

          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <Text style={[styles.subSectionLabel, { color: colors.textSecondary }]}>Income Tax</Text>
          <TaxLine label="Basic rate (20%)" amount={tax?.incomeTax.basicRate ?? 0} />
          <TaxLine label="Higher rate (40%)" amount={tax?.incomeTax.higherRate ?? 0} />
          <TaxLine label="Additional rate (45%)" amount={tax?.incomeTax.additionalRate ?? 0} />
          <TaxLine label="Income tax total" amount={tax?.incomeTax.total ?? 0} isBold />

          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <Text style={[styles.subSectionLabel, { color: colors.textSecondary }]}>National Insurance</Text>
          <TaxLine label="Class 2" amount={tax?.nationalInsurance.class2 ?? 0} />
          <TaxLine label="Class 4" amount={tax?.nationalInsurance.class4 ?? 0} />
          <TaxLine label="NI total" amount={tax?.nationalInsurance.total ?? 0} isBold />

          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <TaxLine label="Total tax liability" amount={totalTax} isBold />

          {paymentsOnAccount > 0 && (
            <>
              <View style={[styles.divider, { backgroundColor: colors.border }]} />
              <Text style={[styles.subSectionLabel, { color: colors.textSecondary }]}>Payments on Account</Text>
              <TaxLine label="1st payment (31 Jan)" amount={paymentsOnAccount} />
              <TaxLine label="2nd payment (31 Jul)" amount={paymentsOnAccount} />
              <Text style={[styles.noteText, { color: colors.textSecondary, marginTop: 4 }]}>
                Each payment is 50% of your total tax bill
              </Text>
            </>
          )}
        </Card>

        {/* Export Section */}
        <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>EXPORT</Text>
        <Card style={styles.cardPadding}>
          <Pressable
            onPress={handleExportCSV}
            disabled={!tax}
            style={({ pressed }) => [styles.exportButton, pressed && styles.pressed]}
            accessibilityRole="button"
            accessibilityLabel="Download SA103 summary as CSV"
          >
            <FontAwesome name="download" size={14} color={Colors.white} />
            <Text style={styles.exportButtonText}>Download SA103 Summary (CSV)</Text>
          </Pressable>

          <Pressable
            onPress={handleCopyClipboard}
            disabled={!tax}
            style={({ pressed }) => [styles.copyButton, { borderColor: colors.border }, pressed && styles.pressed]}
            accessibilityRole="button"
            accessibilityLabel="Copy SA103 summary to clipboard"
          >
            <FontAwesome name={isCopied ? 'check' : 'clipboard'} size={14} color={isCopied ? Colors.success : colors.text} />
            <Text style={[styles.copyButtonText, { color: colors.text }]}>
              {isCopied ? 'Copied!' : 'Copy to clipboard'}
            </Text>
          </Pressable>
        </Card>

        {/* Important Dates */}
        <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>IMPORTANT DATES</Text>
        <Card style={styles.cardPadding}>
          <DeadlineRow label="Filing deadline" date={FILING_DEADLINE} daysLeft={filingDaysLeft} />
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <DeadlineRow label="Payment deadline" date={PAYMENT_DEADLINE} daysLeft={paymentDaysLeft} />
        </Card>

        {/* Disclaimer */}
        <View style={styles.disclaimerContainer}>
          <FontAwesome name="exclamation-triangle" size={12} color={Colors.warning} />
          <Text style={[styles.disclaimerText, { color: colors.textSecondary }]}>
            This summary is for guidance only. Always check figures against your HMRC Self Assessment
            tax return. QuidSafe is not a substitute for professional tax advice.
          </Text>
        </View>
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
    gap: Spacing.sm,
    paddingBottom: Spacing.xxl,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.md,
  },
  loadingText: {
    fontFamily: 'Manrope_500Medium',
    fontSize: 14,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: Spacing.sm,
    alignSelf: 'flex-start',
  },
  backText: {
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 14,
  },
  title: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 28,
  },
  subtitle: {
    fontFamily: 'Manrope_500Medium',
    fontSize: 14,
    marginBottom: Spacing.sm,
  },
  sectionLabel: {
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 10,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginTop: Spacing.md,
    marginBottom: Spacing.xs,
    marginLeft: Spacing.xs,
  },
  subSectionLabel: {
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 10.5,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 4,
    marginTop: 4,
  },
  cardPadding: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  noteText: {
    fontFamily: 'Manrope_400Regular',
    fontSize: 10.5,
    fontStyle: 'italic',
    marginTop: 2,
  },
  expenseBreakdown: {
    marginTop: 8,
  },
  divider: {
    height: 1,
    marginVertical: 8,
  },
  exportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.secondary,
    paddingVertical: 14,
    borderRadius: BorderRadius.button,
    marginBottom: 10,
  },
  exportButtonText: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 13,
    color: Colors.white,
  },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: BorderRadius.button,
    borderWidth: 1.5,
  },
  copyButtonText: {
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 13,
  },
  pressed: {
    opacity: 0.85,
  },
  disclaimerContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginTop: Spacing.md,
    paddingHorizontal: Spacing.xs,
  },
  disclaimerText: {
    fontFamily: 'Manrope_400Regular',
    fontSize: 11,
    lineHeight: 16,
    flex: 1,
  },
});
