import { StyleSheet, View, Text, Pressable, useWindowDimensions } from 'react-native';
import { Colors, Spacing } from '@/constants/Colors';
import { Fonts } from '@/constants/Typography';
import { formatCurrency } from '@/lib/tax-engine';
import type { TaxCalculation } from '@/lib/types';

export interface TaxHeroCardProps {
  tax: TaxCalculation | undefined;
}

/**
 * Apple-style hero tax summary: dramatic typography, subtle glow, minimal chrome.
 * The primary number dominates. Secondary stats are quiet and tabular.
 */
export function TaxHeroCard({ tax }: TaxHeroCardProps) {
  const { width } = useWindowDimensions();
  const isNarrow = width < 400;

  const totalOwed = tax?.totalTaxOwed ?? 0;
  const totalIncome = tax?.totalIncome ?? 0;
  const setAsideMonthly = tax?.setAsideMonthly ?? 0;
  const incomeTax = tax?.incomeTax?.total ?? 0;
  const nationalInsurance = tax?.nationalInsurance?.total ?? 0;
  const totalExpenses = tax?.totalExpenses ?? 0;

  // Responsive hero type - 56-72px
  const heroFontSize = isNarrow ? 52 : 68;

  return (
    <Pressable
      accessible={true}
      accessibilityRole="summary"
      accessibilityLabel={`Set aside ${formatCurrency(totalOwed)} for tax based on ${formatCurrency(totalIncome)} income this tax year. Monthly set aside: ${formatCurrency(setAsideMonthly)}.`}
      style={({ pressed }) => [styles.root, pressed && styles.pressed]}
    >
      {/* Subtle radial glow */}
      <View style={styles.glow} pointerEvents="none" />

      {/* Tiny uppercase label */}
      <Text style={styles.eyebrow}>TOTAL TAX DUE THIS YEAR</Text>

      {/* The hero number - everything else is secondary to this */}
      <Text
        style={[
          styles.heroAmount,
          { fontSize: heroFontSize, lineHeight: heroFontSize * 1.02 },
        ]}
        numberOfLines={1}
        adjustsFontSizeToFit
      >
        {formatCurrency(totalOwed)}
      </Text>

      <Text style={styles.sub}>
        On {formatCurrency(totalIncome)} of income
      </Text>

      {/* Monthly set-aside prominent CTA-style band */}
      <View style={styles.monthlyBand}>
        <View style={styles.monthlyLeft}>
          <Text style={styles.monthlyLabel}>Set aside each month</Text>
          <Text style={styles.monthlyAmount}>{formatCurrency(setAsideMonthly)}</Text>
        </View>
        <View style={styles.monthlyBadge}>
          <View style={styles.monthlyBadgeDot} />
          <Text style={styles.monthlyBadgeText}>On track</Text>
        </View>
      </View>

      {/* Quiet breakdown - tabular, no boxes */}
      <View style={styles.breakdown}>
        <View style={styles.breakdownRow}>
          <Text style={styles.breakdownLabel}>Income Tax</Text>
          <Text style={styles.breakdownValue}>{formatCurrency(incomeTax)}</Text>
        </View>
        <View style={styles.breakdownRow}>
          <Text style={styles.breakdownLabel}>National Insurance</Text>
          <Text style={styles.breakdownValue}>{formatCurrency(nationalInsurance)}</Text>
        </View>
        <View style={styles.breakdownRow}>
          <Text style={styles.breakdownLabel}>Expenses</Text>
          <Text style={[styles.breakdownValue, styles.expensesValue]}>
            -{formatCurrency(totalExpenses)}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: {
    position: 'relative',
    backgroundColor: Colors.charcoal,
    borderRadius: 20,
    padding: Spacing.lg + 4,
    borderWidth: 1,
    borderColor: Colors.midGrey,
    overflow: 'hidden',
  },
  pressed: {
    opacity: 0.92,
  },
  glow: {
    position: 'absolute',
    top: -120,
    right: -120,
    width: 400,
    height: 400,
    borderRadius: 200,
    backgroundColor: Colors.electricBlue,
    opacity: 0.08,
  },

  eyebrow: {
    fontFamily: Fonts.sourceSans.semiBold,
    fontSize: 11,
    letterSpacing: 1.4,
    color: Colors.electricBlue,
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  heroAmount: {
    fontFamily: Fonts.lexend.semiBold,
    color: Colors.white,
    letterSpacing: -2,
  },
  sub: {
    fontFamily: Fonts.sourceSans.regular,
    fontSize: 14,
    color: Colors.lightGrey,
    marginTop: 8,
  },

  // Monthly band
  monthlyBand: {
    marginTop: 24,
    backgroundColor: Colors.blueGlow,
    borderWidth: 1,
    borderColor: 'rgba(0, 102, 255, 0.25)',
    borderRadius: 14,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  monthlyLeft: {
    flex: 1,
  },
  monthlyLabel: {
    fontFamily: Fonts.sourceSans.regular,
    fontSize: 12,
    color: Colors.lightGrey,
    marginBottom: 4,
  },
  monthlyAmount: {
    fontFamily: Fonts.mono.semiBold,
    fontSize: 28,
    color: Colors.electricBlue,
    letterSpacing: -0.5,
  },
  monthlyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(0, 200, 83, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(0, 200, 83, 0.25)',
  },
  monthlyBadgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.success,
  },
  monthlyBadgeText: {
    fontFamily: Fonts.sourceSans.semiBold,
    fontSize: 11,
    color: Colors.success,
  },

  // Breakdown
  breakdown: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: Colors.midGrey,
    gap: 12,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  breakdownLabel: {
    fontFamily: Fonts.sourceSans.regular,
    fontSize: 14,
    color: Colors.lightGrey,
  },
  breakdownValue: {
    fontFamily: Fonts.mono.regular,
    fontSize: 15,
    color: Colors.white,
  },
  expensesValue: {
    color: Colors.success,
  },
});
