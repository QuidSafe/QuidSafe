import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { Card } from '@/components/ui/Card';
import { Colors, Spacing } from '@/constants/Colors';
import { Fonts } from '@/constants/Typography';
import { formatCurrency } from '@/lib/tax-engine';
import { useTheme } from '@/lib/ThemeContext';

export interface ExpenseMetricsProps {
  totalClaimed: number;
  taxSaved: number;
  thisMonthTotal: number;
}

export default function ExpenseMetrics({ totalClaimed, taxSaved, thisMonthTotal }: ExpenseMetricsProps) {
  const { colors } = useTheme();

  return (
    <>
      <View style={styles.metricsRow}>
        <Card variant="elevated" style={styles.metricCard} accessibilityLabel={`Total claimed: ${formatCurrency(totalClaimed)}`}>
          <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>Total claimed</Text>
          <Text style={[styles.metricValue, { color: Colors.success }]}>
            {formatCurrency(totalClaimed)}
          </Text>
        </Card>
        <Card variant="elevated" style={styles.metricCard} accessibilityLabel={`Tax saved: ${formatCurrency(taxSaved)}`}>
          <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>Tax saved</Text>
          <Text style={[styles.metricValue, { color: Colors.secondary }]}>
            {formatCurrency(taxSaved)}
          </Text>
        </Card>
      </View>
      <Card variant="elevated" style={styles.metricCardFull}>
        <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>This month</Text>
        <Text style={[styles.metricValue, { color: colors.text }]}>
          {formatCurrency(thisMonthTotal)}
        </Text>
      </Card>
    </>
  );
}

const styles = StyleSheet.create({
  metricsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  metricCard: {
    flex: 1,
    padding: Spacing.md,
  },
  metricCardFull: {
    width: '100%',
    padding: Spacing.md,
  },
  metricLabel: {
    fontFamily: Fonts.sourceSans.regular,
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  metricValue: {
    fontFamily: Fonts.mono.semiBold,
    fontSize: 22,
    marginTop: 6,
  },
});
