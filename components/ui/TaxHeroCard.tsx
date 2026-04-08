import { StyleSheet, View, Text, Pressable } from 'react-native';
import { Colors, Spacing, BorderRadius } from '@/constants/Colors';
import { Fonts } from '@/constants/Typography';
import { formatCurrency } from '@/lib/tax-engine';
import type { TaxCalculation } from '@/lib/types';

export interface TaxHeroCardProps {
  tax: TaxCalculation | undefined;
}

export function TaxHeroCard({ tax }: TaxHeroCardProps) {
  return (
    <Pressable
      accessible={true}
      accessibilityRole="summary"
      accessibilityLabel={`Tax summary. Set aside ${formatCurrency(tax?.totalTaxOwed ?? 0)} for tax based on ${formatCurrency(tax?.totalIncome ?? 0)} income this tax year`}
      style={({ pressed }) => [pressed && styles.pressedCard]}
    >
      <View style={[styles.heroCard, { backgroundColor: '#000000' }]}>
        {/* Radial glow overlays */}
        <View style={styles.heroGlow} importantForAccessibility="no" accessibilityElementsHidden={true} />
        <View style={styles.heroGlowSecondary} importantForAccessibility="no" accessibilityElementsHidden={true} />

        {/* Label row with dot */}
        <View style={styles.heroLabelRow}>
          <View style={styles.heroLabelDot} importantForAccessibility="no" accessibilityElementsHidden={true} />
          <Text style={styles.heroLabel}>SET ASIDE FOR TAX</Text>
        </View>

        <Text style={styles.heroAmount}>{formatCurrency(tax?.totalTaxOwed ?? 0)}</Text>
        <Text style={styles.heroSubtext}>
          Based on {formatCurrency(tax?.totalIncome ?? 0)} income this tax year
        </Text>

        {/* 3 glassmorphic boxes */}
        <View style={styles.heroRow}>
          <View style={styles.heroBox} accessibilityLabel={`Income Tax: ${formatCurrency(tax?.incomeTax?.total ?? 0)}`}>
            <Text style={styles.heroBoxLabel}>Income Tax</Text>
            <Text style={styles.heroBoxValue}>{formatCurrency(tax?.incomeTax?.total ?? 0)}</Text>
          </View>
          <View style={styles.heroBox} accessibilityLabel={`National Insurance Class 4: ${formatCurrency(tax?.nationalInsurance?.total ?? 0)}`}>
            <Text style={styles.heroBoxLabel}>NI (Class 4)</Text>
            <Text style={styles.heroBoxValue}>{formatCurrency(tax?.nationalInsurance?.total ?? 0)}</Text>
          </View>
          <View style={styles.heroBox} accessibilityLabel={`Expenses: minus ${formatCurrency(tax?.totalExpenses ?? 0)}`}>
            <Text style={styles.heroBoxLabel}>Expenses</Text>
            <Text style={[styles.heroBoxValue, styles.heroBoxExpenses]}>
              -{formatCurrency(tax?.totalExpenses ?? 0)}
            </Text>
          </View>
        </View>

        {/* Monthly set-aside callout inside hero */}
        <View style={styles.heroSetAside} accessibilityLabel={`Set aside this month: ${formatCurrency(tax?.setAsideMonthly ?? 0)}`}>
          <Text style={styles.heroSetAsideLabel}>SET ASIDE THIS MONTH</Text>
          <Text style={styles.heroSetAsideAmount}>{formatCurrency(tax?.setAsideMonthly ?? 0)}</Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressedCard: {
    transform: [{ scale: 0.98 }],
    opacity: 0.95,
  },
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
});
