import { useMemo } from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { Colors, Spacing, BorderRadius } from '@/constants/Colors';
import { Fonts } from '@/constants/Typography';
import { formatCurrency } from '@/lib/tax-engine';
import type { TaxCalculation } from '@/lib/types';

export interface TaxWaterfallProps {
  tax: TaxCalculation | undefined;
}

type Step = {
  key: string;
  label: string;
  amount: number;
  /** 'add' is the starting income, 'subtract' reduces, 'tax' highlights tax-line, 'total' is final. */
  kind: 'add' | 'subtract' | 'tax' | 'total';
};

/**
 * Vertical waterfall that turns the abstract tax formula into something a user
 * can read top-to-bottom: income -> deductions -> taxable -> tax lines -> total.
 * Bar widths are percent-of-income so the eye can compare magnitudes.
 */
export function TaxWaterfall({ tax }: TaxWaterfallProps) {
  const steps = useMemo<Step[]>(() => {
    if (!tax) return [];
    const s: Step[] = [
      { key: 'income', label: 'Total income', amount: tax.totalIncome, kind: 'add' },
      { key: 'expenses', label: 'Allowable expenses', amount: tax.totalExpenses, kind: 'subtract' },
      { key: 'profit', label: 'Net profit', amount: tax.netProfit, kind: 'add' },
      { key: 'allowance', label: 'Personal allowance', amount: tax.personalAllowance, kind: 'subtract' },
      { key: 'taxable', label: 'Taxable income', amount: tax.taxableIncome, kind: 'add' },
    ];
    if (tax.incomeTax.basicRate > 0) {
      s.push({ key: 'it-basic', label: 'Income tax (20%)', amount: tax.incomeTax.basicRate, kind: 'tax' });
    }
    if (tax.incomeTax.higherRate > 0) {
      s.push({ key: 'it-higher', label: 'Income tax (40%)', amount: tax.incomeTax.higherRate, kind: 'tax' });
    }
    if (tax.incomeTax.additionalRate > 0) {
      s.push({ key: 'it-add', label: 'Income tax (45%)', amount: tax.incomeTax.additionalRate, kind: 'tax' });
    }
    if (tax.nationalInsurance.class2 > 0) {
      s.push({ key: 'ni-2', label: 'Class 2 NI', amount: tax.nationalInsurance.class2, kind: 'tax' });
    }
    if (tax.nationalInsurance.class4 > 0) {
      s.push({ key: 'ni-4', label: 'Class 4 NI', amount: tax.nationalInsurance.class4, kind: 'tax' });
    }
    s.push({ key: 'total', label: 'Total tax owed', amount: tax.totalTaxOwed, kind: 'total' });
    return s;
  }, [tax]);

  if (!tax || steps.length === 0) return null;

  // Scale all bars against income so reductions are visually proportionate.
  const scale = Math.max(tax.totalIncome, 1);

  return (
    <View style={styles.root} accessible accessibilityRole="summary" accessibilityLabel="How your tax is calculated, step by step.">
      <View style={styles.header}>
        <Text style={styles.title} accessibilityRole="header">How this breaks down</Text>
        <Text style={styles.subtitle}>
          Effective rate <Text style={styles.subtitleStrong}>{Math.round(tax.effectiveRate * 100) / 100}%</Text>
        </Text>
      </View>

      <View style={styles.list}>
        {steps.map((step) => {
          const widthPct = Math.min(100, Math.max(3, (step.amount / scale) * 100));
          const color = colorFor(step.kind);
          const sign = step.kind === 'subtract' ? '-' : '';

          return (
            <View key={step.key} style={styles.row} accessible accessibilityLabel={`${step.label}: ${sign}${formatCurrency(step.amount)}`}>
              <Text style={styles.label} numberOfLines={1}>{step.label}</Text>
              <View style={styles.track}>
                <View style={[styles.bar, { width: `${widthPct}%`, backgroundColor: color }]} />
              </View>
              <Text style={[styles.amount, step.kind === 'total' && styles.amountTotal, step.kind === 'subtract' && styles.amountSubtract]}>
                {sign}{formatCurrency(step.amount)}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

function colorFor(kind: Step['kind']): string {
  switch (kind) {
    case 'add': return Colors.electricBlue;
    case 'subtract': return Colors.success;
    case 'tax': return Colors.warning;
    case 'total': return Colors.error;
  }
}

const styles = StyleSheet.create({
  root: {
    gap: Spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  title: {
    fontFamily: Fonts.lexend.semiBold,
    fontSize: 16,
    color: Colors.white,
    letterSpacing: -0.2,
  },
  subtitle: {
    fontFamily: Fonts.sourceSans.regular,
    fontSize: 12,
    color: Colors.lightGrey,
  },
  subtitleStrong: {
    fontFamily: Fonts.mono.semiBold,
    color: Colors.electricBlue,
  },
  list: {
    gap: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  label: {
    fontFamily: Fonts.sourceSans.regular,
    fontSize: 13,
    color: Colors.lightGrey,
    width: 140,
    flexShrink: 0,
  },
  track: {
    flex: 1,
    height: 8,
    borderRadius: BorderRadius.pill,
    backgroundColor: 'rgba(255,255,255,0.04)',
    overflow: 'hidden',
  },
  bar: {
    height: '100%',
    borderRadius: BorderRadius.pill,
  },
  amount: {
    fontFamily: Fonts.mono.regular,
    fontSize: 13,
    color: Colors.white,
    minWidth: 88,
    textAlign: 'right',
  },
  amountSubtract: {
    color: Colors.success,
  },
  amountTotal: {
    fontFamily: Fonts.mono.semiBold,
    color: Colors.error,
  },
});
