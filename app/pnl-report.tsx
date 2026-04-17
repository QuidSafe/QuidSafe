import { useState, useMemo } from 'react';
import { StyleSheet, View, Text, Pressable, ScrollView, Platform, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, Download, Share2 } from 'lucide-react-native';
import { colors, Colors, Spacing, BorderRadius } from '@/constants/Colors';
import { Fonts } from '@/constants/Typography';
import { useDashboard, useExpenses, useQuarterlyBreakdown } from '@/lib/hooks/useApi';
import { formatCurrency } from '@/lib/tax-engine';
import { downloadCSV } from '@/lib/export';

const TAX_YEARS = ['2025/26', '2024/25'] as const;

function Row({ label, amount, bold, indent, color }: {
  label: string; amount: number; bold?: boolean; indent?: boolean; color?: string;
}) {
  return (
    <View style={[s.row, indent && s.rowIndent]}>
      <Text style={[s.rowLabel, bold && s.rowLabelBold, indent && s.rowLabelIndent]}>
        {label}
      </Text>
      <Text style={[s.rowAmount, bold && s.rowAmountBold, color ? { color } : null]}>
        {formatCurrency(amount)}
      </Text>
    </View>
  );
}

function Divider() {
  return <View style={s.divider} />;
}

function SectionHeader({ title }: { title: string }) {
  return <Text style={s.sectionHeader}>{title}</Text>;
}

export default function PnLReportScreen() {
  const router = useRouter();
  const [selectedYear, setSelectedYear] = useState<string>(TAX_YEARS[0]);

  const { data: dashboard } = useDashboard();
  const { data: quarterly } = useQuarterlyBreakdown(selectedYear);
  const { data: expenseData } = useExpenses();

  const report = useMemo(() => {
    const yearTotal = quarterly?.yearTotal;
    const totalIncome = yearTotal?.income ?? dashboard?.tax?.totalIncome ?? 0;
    const totalExpenses = yearTotal?.expenses ?? dashboard?.tax?.totalExpenses ?? 0;
    const grossProfit = totalIncome;
    const netProfit = totalIncome - totalExpenses;

    const totalTax = yearTotal?.totalTaxOwed ?? dashboard?.tax?.totalTaxOwed ?? 0;
    const incomeTax = dashboard?.tax?.incomeTax?.total ?? totalTax * 0.6;
    const ni = dashboard?.tax?.nationalInsurance?.total ?? totalTax * 0.4;
    const effectiveRate = netProfit > 0 ? ((totalTax / netProfit) * 100).toFixed(1) : '0.0';

    // Group expenses by category
    const expensesByCategory: Record<string, number> = {};
    if (expenseData?.expenses) {
      for (const exp of expenseData.expenses) {
        const cat = exp.categoryId || 'Uncategorised';
        expensesByCategory[cat] = (expensesByCategory[cat] || 0) + exp.amount;
      }
    }
    const sortedExpenses = Object.entries(expensesByCategory)
      .sort(([, a], [, b]) => b - a);

    // Income by source
    const incomeBySource = dashboard?.income?.bySource ?? [];

    return {
      totalIncome,
      totalExpenses,
      grossProfit,
      netProfit,
      incomeTax,
      ni,
      totalTax,
      effectiveRate,
      sortedExpenses,
      incomeBySource,
    };
  }, [dashboard, quarterly, expenseData]);

  const handleExportCSV = () => {
    const lines = [
      `Profit & Loss Statement - ${selectedYear}`,
      `Generated ${new Date().toLocaleDateString('en-GB')}`,
      '',
      'INCOME',
      ...report.incomeBySource.map((s) => `  ${s.name},${s.amount.toFixed(2)}`),
      `Total Income,,${report.totalIncome.toFixed(2)}`,
      '',
      'EXPENSES',
      ...report.sortedExpenses.map(([cat, amt]) => `  ${cat},${amt.toFixed(2)}`),
      `Total Expenses,,${report.totalExpenses.toFixed(2)}`,
      '',
      `NET PROFIT,,${report.netProfit.toFixed(2)}`,
      '',
      'TAX LIABILITY',
      `  Income Tax,,${report.incomeTax.toFixed(2)}`,
      `  National Insurance,,${report.ni.toFixed(2)}`,
      `  Total Tax,,${report.totalTax.toFixed(2)}`,
      `  Effective Rate,,${report.effectiveRate}%`,
    ];
    const csv = lines.join('\n');
    downloadCSV(csv, `PnL-${selectedYear.replace('/', '-')}.csv`);
    if (Platform.OS !== 'web') {
      Alert.alert('Exported', `Profit & Loss report saved as CSV`);
    }
  };

  return (
    <SafeAreaView style={s.container} edges={['top']}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={s.header}>
          <Pressable onPress={() => router.back()} hitSlop={12} accessibilityRole="button" accessibilityLabel="Go back">
            <ArrowLeft size={18} color={colors.text} strokeWidth={1.5} />
          </Pressable>
          <Pressable onPress={handleExportCSV} hitSlop={12} style={s.exportBtn} accessibilityRole="button" accessibilityLabel="Export as CSV">
            <Download size={16} color={Colors.electricBlue} strokeWidth={1.5} />
            <Text style={s.exportText}>Export CSV</Text>
          </Pressable>
        </View>

        <Text style={s.eyebrow}>FINANCIAL REPORT</Text>
        <Text style={s.title} accessibilityRole="header">Profit & Loss</Text>
        <Text style={s.subtitle}>For the tax year {selectedYear}</Text>

        {/* Year selector */}
        <View style={s.yearRow}>
          {TAX_YEARS.map((year) => (
            <Pressable
              key={year}
              onPress={() => setSelectedYear(year)}
              style={[s.yearPill, selectedYear === year && s.yearPillActive]}
              accessibilityRole="button"
              accessibilityState={{ selected: selectedYear === year }}
            >
              <Text style={[s.yearPillText, selectedYear === year && s.yearPillTextActive]}>
                {year}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Report card */}
        <View style={s.reportCard}>
          {/* Income */}
          <SectionHeader title="Income" />
          {report.incomeBySource.length > 0 ? (
            report.incomeBySource.map((src) => (
              <Row key={src.name} label={src.name} amount={src.amount} indent />
            ))
          ) : (
            <Row label="Trading income" amount={report.totalIncome} indent />
          )}
          <Divider />
          <Row label="Total Income" amount={report.totalIncome} bold />

          {/* Expenses */}
          <View style={{ marginTop: Spacing.lg }} />
          <SectionHeader title="Allowable Expenses" />
          {report.sortedExpenses.length > 0 ? (
            report.sortedExpenses.map(([cat, amt]) => (
              <Row key={cat} label={cat.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())} amount={amt} indent />
            ))
          ) : (
            <Row label="No expenses recorded" amount={0} indent />
          )}
          <Divider />
          <Row label="Total Expenses" amount={report.totalExpenses} bold color={Colors.error} />

          {/* Net Profit */}
          <View style={{ marginTop: Spacing.lg }} />
          <View style={s.netProfitRow}>
            <Text style={s.netProfitLabel}>Net Profit</Text>
            <Text style={[s.netProfitAmount, { color: report.netProfit >= 0 ? Colors.success : Colors.error }]}>
              {formatCurrency(report.netProfit)}
            </Text>
          </View>

          {/* Tax */}
          <View style={{ marginTop: Spacing.lg }} />
          <SectionHeader title="Tax Liability" />
          <Row label="Income Tax" amount={report.incomeTax} indent />
          <Row label="National Insurance (Class 2 + 4)" amount={report.ni} indent />
          <Divider />
          <Row label="Total Tax Owed" amount={report.totalTax} bold color={Colors.electricBlue} />
          <Row label={`Effective tax rate: ${report.effectiveRate}%`} amount={0} indent />

          {/* Retained */}
          <View style={{ marginTop: Spacing.lg }} />
          <View style={s.retainedRow}>
            <Text style={s.retainedLabel}>Retained After Tax</Text>
            <Text style={s.retainedAmount}>
              {formatCurrency(Math.max(0, report.netProfit - report.totalTax))}
            </Text>
          </View>
        </View>

        {/* Disclaimer */}
        <Text style={s.disclaimer}>
          This is an estimate based on your recorded income and expenses. It is not a substitute for professional accounting advice.
          Always verify figures with your accountant or HMRC.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: Spacing.lg, paddingBottom: Spacing.xxl * 2, maxWidth: 640, width: '100%', alignSelf: 'center' },

  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md },
  exportBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: Colors.blueGlow, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  exportText: { fontFamily: Fonts.sourceSans.semiBold, fontSize: 13, color: Colors.electricBlue },

  eyebrow: { fontFamily: Fonts.sourceSans.semiBold, fontSize: 11, color: Colors.electricBlue, letterSpacing: 1.4 },
  title: { fontFamily: Fonts.lexend.semiBold, fontSize: 28, letterSpacing: -0.6, color: Colors.white, marginTop: 4 },
  subtitle: { fontFamily: Fonts.sourceSans.regular, fontSize: 14, color: colors.textSecondary, marginTop: 2, marginBottom: Spacing.md },

  yearRow: { flexDirection: 'row', gap: 6, marginBottom: Spacing.lg },
  yearPill: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 8, backgroundColor: Colors.charcoal, borderWidth: 1, borderColor: colors.border },
  yearPillActive: { backgroundColor: Colors.electricBlue, borderColor: Colors.electricBlue },
  yearPillText: { fontFamily: Fonts.sourceSans.semiBold, fontSize: 13, color: colors.textSecondary },
  yearPillTextActive: { color: Colors.white },

  reportCard: {
    backgroundColor: Colors.charcoal, borderWidth: 1, borderColor: colors.border,
    borderRadius: 12, padding: Spacing.lg,
  },

  sectionHeader: { fontFamily: Fonts.lexend.semiBold, fontSize: 14, color: colors.textSecondary, letterSpacing: 0.3, marginBottom: 8 },

  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 5 },
  rowIndent: { paddingLeft: Spacing.md },
  rowLabel: { fontFamily: Fonts.sourceSans.regular, fontSize: 14, color: colors.text, flex: 1 },
  rowLabelBold: { fontFamily: Fonts.sourceSans.semiBold },
  rowLabelIndent: { color: colors.textSecondary },
  rowAmount: { fontFamily: Fonts.mono.regular, fontSize: 14, color: colors.text },
  rowAmountBold: { fontFamily: Fonts.mono.semiBold, fontSize: 15 },

  divider: { height: 1, backgroundColor: colors.border, marginVertical: 8 },

  netProfitRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: Colors.darkGrey, borderRadius: 8, padding: 14,
  },
  netProfitLabel: { fontFamily: Fonts.lexend.semiBold, fontSize: 16, color: Colors.white },
  netProfitAmount: { fontFamily: Fonts.mono.semiBold, fontSize: 22, letterSpacing: -0.5 },

  retainedRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: Colors.blueGlow, borderRadius: 8, padding: 14,
  },
  retainedLabel: { fontFamily: Fonts.lexend.semiBold, fontSize: 14, color: Colors.electricBlue },
  retainedAmount: { fontFamily: Fonts.mono.semiBold, fontSize: 18, color: Colors.electricBlue, letterSpacing: -0.5 },

  disclaimer: { fontFamily: Fonts.sourceSans.regular, fontSize: 11, lineHeight: 16, color: colors.textMuted, marginTop: Spacing.lg, textAlign: 'center' },
});
