import { View, Text, StyleSheet } from 'react-native';
import { colors, Spacing } from '@/constants/Colors';
import { Fonts } from '@/constants/Typography';

interface DonutSegment {
  label: string;
  value: number;
  color: string;
}

interface DonutChartProps {
  segments: DonutSegment[];
  size?: number;
  strokeWidth?: number;
  centerLabel?: string;
  centerValue?: string;
}

const CATEGORY_COLORS: Record<string, string> = {
  'Office & admin': '#3B82F6',
  'Travel': '#8B5CF6',
  'Clothing': '#EC4899',
  'Staff costs': '#F59E0B',
  'Stock & materials': '#10B981',
  'Financial costs': '#6366F1',
  'Business premises': '#14B8A6',
  'Legal & professional': '#F97316',
  'Marketing': '#EF4444',
  'Training': '#06B6D4',
  'Other': '#6B7280',
  'office_costs': '#3B82F6',
  'travel': '#8B5CF6',
  'clothing': '#EC4899',
  'staff': '#F59E0B',
  'stock': '#10B981',
  'financial': '#6366F1',
  'premises': '#14B8A6',
  'legal': '#F97316',
  'marketing': '#EF4444',
  'training': '#06B6D4',
  'other': '#6B7280',
};

export { CATEGORY_COLORS };

export function DonutChart({
  segments,
  centerLabel,
  centerValue,
}: DonutChartProps) {
  const total = segments.reduce((sum, s) => sum + s.value, 0);
  if (total === 0 || segments.length === 0) return null;

  const sorted = [...segments].sort((a, b) => b.value - a.value);

  return (
    <View style={styles.container}>
      {(centerLabel || centerValue) && (
        <View style={styles.centerArea}>
          {centerValue && (
            <Text style={styles.centerValue}>{centerValue}</Text>
          )}
          {centerLabel && (
            <Text style={styles.centerLabel}>{centerLabel}</Text>
          )}
        </View>
      )}

      <View style={styles.barContainer}>
        {sorted.map((segment, index) => {
          const percentage = (segment.value / total) * 100;
          if (percentage < 0.5) return null;
          return (
            <View
              key={`${segment.label}-${index}`}
              style={[
                styles.barSegment,
                {
                  width: `${percentage}%` as unknown as number,
                  backgroundColor: segment.color,
                },
                index === 0 && styles.barSegmentFirst,
                index === sorted.length - 1 && styles.barSegmentLast,
              ]}
            />
          );
        })}
      </View>

      <View style={styles.legend}>
        {sorted.map((segment, index) => {
          const percentage = ((segment.value / total) * 100).toFixed(1);
          return (
            <View key={`legend-${segment.label}-${index}`} style={styles.legendRow}>
              <View style={styles.legendLeft}>
                <View style={[styles.legendDot, { backgroundColor: segment.color }]} />
                <Text style={styles.legendLabel} numberOfLines={1}>
                  {segment.label}
                </Text>
              </View>
              <View style={styles.legendRight}>
                <Text style={styles.legendAmount}>
                  {formatAmount(segment.value)}
                </Text>
                <Text style={styles.legendPercent}>
                  {percentage}%
                </Text>
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}

function formatAmount(value: number): string {
  if (value >= 1000) {
    return `\u00A3${value.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  return `\u00A3${value.toFixed(2)}`;
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    gap: Spacing.md,
  },
  centerArea: {
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  centerValue: {
    fontFamily: Fonts.mono.semiBold,
    fontSize: 22,
    color: colors.text,
  },
  centerLabel: {
    fontFamily: Fonts.sourceSans.regular,
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 2,
    color: colors.textSecondary,
  },
  barContainer: {
    flexDirection: 'row',
    height: 14,
    borderRadius: 7,
    overflow: 'hidden',
    backgroundColor: colors.border,
  },
  barSegment: {
    height: '100%',
  },
  barSegmentFirst: {
    borderTopLeftRadius: 7,
    borderBottomLeftRadius: 7,
  },
  barSegmentLast: {
    borderTopRightRadius: 7,
    borderBottomRightRadius: 7,
  },
  legend: {
    gap: Spacing.sm,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  legendLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: Spacing.sm,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: Spacing.sm,
  },
  legendLabel: {
    fontFamily: Fonts.sourceSans.regular,
    fontSize: 13,
    flex: 1,
    color: colors.text,
  },
  legendRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  legendAmount: {
    fontFamily: Fonts.mono.semiBold,
    fontSize: 13,
    minWidth: 60,
    textAlign: 'right',
    color: colors.text,
  },
  legendPercent: {
    fontFamily: Fonts.sourceSans.regular,
    fontSize: 12,
    minWidth: 44,
    textAlign: 'right',
    color: colors.textSecondary,
  },
});
