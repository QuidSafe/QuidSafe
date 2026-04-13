import { StyleSheet, View, Text } from 'react-native';
import { Fonts } from '@/constants/Typography';
import { formatCurrency } from '@/lib/tax-engine';
import { colors } from '@/constants/Colors';

export interface IncomeSource {
  name: string;
  amount: number;
  percentage: number;
}

export interface IncomeBySourceProps {
  sources: IncomeSource[];
  sourceColors: string[];
}

export function IncomeBySource({ sources, sourceColors }: IncomeBySourceProps) {

  return (
    <>
      {sources.map((src, index) => {
        const isLast = index === sources.length - 1;
        const dotColor = sourceColors[index % sourceColors.length];
        return (
          <View
            key={src.name}
            style={[
              styles.sourceRow,
              !isLast && { borderBottomColor: colors.border, borderBottomWidth: 1 },
            ]}
            accessible
            accessibilityLabel={`${src.name}: ${formatCurrency(src.amount)}, ${src.percentage}% of income`}
          >
            <View style={styles.sourceLeft}>
              <View
                style={[styles.sourceDot, { backgroundColor: dotColor }]}
                importantForAccessibility="no"
                accessibilityElementsHidden={true}
              />
              <Text style={[styles.sourceName, { color: colors.text }]}>{src.name}</Text>
            </View>
            <View style={styles.sourceRight}>
              <Text style={[styles.sourceAmount, { color: colors.text }]}>{formatCurrency(src.amount)}</Text>
              <View
                style={[styles.sourceBar, { backgroundColor: '#666666' }]}
                importantForAccessibility="no"
                accessibilityElementsHidden={true}
              >
                <View style={[styles.sourceBarFill, { width: `${src.percentage}%` as any, backgroundColor: dotColor }]} />
              </View>
            </View>
          </View>
        );
      })}
    </>
  );
}

const styles = StyleSheet.create({
  sourceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  sourceLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  sourceDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  sourceName: {
    fontFamily: Fonts.sourceSans.regular,
    fontSize: 14,
  },
  sourceRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  sourceAmount: {
    fontFamily: Fonts.sourceSans.semiBold,
    fontSize: 14,
  },
  sourceBar: {
    width: 60,
    height: 4,
    borderRadius: 2,
  },
  sourceBarFill: {
    height: 4,
    borderRadius: 2,
  },
});
