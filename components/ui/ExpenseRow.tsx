import React from 'react';
import { StyleSheet, View, Text, Pressable } from 'react-native';
import { Car, Phone, Briefcase, Laptop, Plane, Utensils, Code, Shield, FileText, Trash2 } from 'lucide-react-native';
import { colors, Colors, Spacing, BorderRadius, colors as designColors } from '@/constants/Colors';
import { Fonts } from '@/constants/Typography';
import { formatCurrency } from '@/lib/tax-engine';

export const CATEGORY_ICONS: Record<string, { IconComponent: React.ComponentType<{ size: number; color: string; strokeWidth: number }>; bg: string; color: string }> = {
  mileage: { IconComponent: Car, bg: 'rgba(0,102,255,0.12)', color: '#0066FF' },
  phone: { IconComponent: Phone, bg: 'rgba(0,200,83,0.12)', color: '#00C853' },
  office: { IconComponent: Briefcase, bg: 'rgba(0,102,255,0.12)', color: '#0066FF' },
  equipment: { IconComponent: Laptop, bg: 'rgba(0,102,255,0.12)', color: '#0066FF' },
  travel: { IconComponent: Plane, bg: 'rgba(255,149,0,0.12)', color: '#EA580C' },
  food: { IconComponent: Utensils, bg: 'rgba(255,59,48,0.12)', color: '#FF3B30' },
  software: { IconComponent: Code, bg: 'rgba(0,102,255,0.12)', color: '#0066FF' },
  insurance: { IconComponent: Shield, bg: 'rgba(0,200,83,0.12)', color: '#00C853' },
  default: { IconComponent: FileText, bg: '#1A1A1A', color: '#666666' },
};

export function getCategoryMeta(category?: string) {
  if (!category) return CATEGORY_ICONS.default;
  const key = category.toLowerCase();
  for (const k of Object.keys(CATEGORY_ICONS)) {
    if (key.includes(k)) return CATEGORY_ICONS[k];
  }
  return CATEGORY_ICONS.default;
}

export const HMRC_CATEGORY_LABELS: Record<string, string> = {
  office_costs: 'Office costs',
  travel: 'Travel',
  clothing: 'Clothing',
  staff: 'Staff',
  stock: 'Stock',
  financial: 'Financial',
  premises: 'Premises',
  legal: 'Legal',
  marketing: 'Marketing',
  training: 'Training',
  other: 'Other',
};

export function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${d.getDate()} ${months[d.getMonth()]}`;
}

export type ExpenseItem = {
  id: string;
  amount: number;
  description: string;
  date: string;
  hmrc_category?: string;
};

export interface ExpenseRowProps {
  item: ExpenseItem;
  index: number;
  totalCount: number;
  onPress: (id: string) => void;
  onDelete: (id: string, desc: string) => void;
  colors: { text: string; textSecondary: string; border: string };
}

const ExpenseRow = React.memo(function ExpenseRow({
  item: exp,
  index,
  totalCount,
  onPress,
  onDelete,
  colors,
}: ExpenseRowProps) {
  const meta = getCategoryMeta(exp.hmrc_category);
  return (
    <Pressable
      onPress={() => onPress(exp.id)}
      style={({ pressed }) => [
        styles.expenseRow,
        index < totalCount - 1 && [styles.expenseRowBorder, { borderBottomColor: colors.border }],
        pressed && styles.pressed,
      ]}
      accessibilityRole="button"
      accessibilityLabel={`View expense: ${exp.description}`}
      accessibilityHint="Tap to view expense details"
    >
      <View style={[styles.iconBadge, { backgroundColor: meta.bg }]}>
        <meta.IconComponent size={16} color={meta.color} strokeWidth={1.5} />
      </View>
      <View style={styles.expenseMiddle}>
        <Text style={[styles.expenseDesc, { color: colors.text }]} numberOfLines={1}>
          {exp.description}
        </Text>
        <View style={styles.expenseSubRow}>
          {exp.hmrc_category ? (
            <View style={[styles.hmrcBadge, { backgroundColor: meta.bg }]}>
              <Text style={[styles.hmrcBadgeText, { color: meta.color }]}>
                {HMRC_CATEGORY_LABELS[exp.hmrc_category] || exp.hmrc_category}
              </Text>
            </View>
          ) : null}
          <Text style={[styles.expenseSub, { color: colors.textSecondary }]} numberOfLines={1}>
            {formatDate(exp.date)}
          </Text>
        </View>
      </View>
      <View style={styles.expenseRight}>
        <Text style={[styles.expenseAmount, { color: colors.text }]}>{formatCurrency(exp.amount)}</Text>
        <View style={styles.claimedBadge} accessibilityLabel="Status: Claimed">
          <Text style={styles.claimedBadgeText}>Claimed</Text>
        </View>
      </View>
      <Pressable
        style={({ pressed: p }) => [styles.deleteButton, p && styles.pressed]}
        onPress={(e) => { e.stopPropagation(); onDelete(exp.id, exp.description); }}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel={`Delete expense: ${exp.description}`}
        accessibilityHint="Tap to delete this expense"
      >
        <Trash2 size={16} color="#FF3B30" strokeWidth={1.5} />
      </Pressable>
    </Pressable>
  );
});

export default ExpenseRow;

export const expenseRowStyles = StyleSheet.create({
  expenseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: Spacing.md,
  },
  expenseRowBorder: {
    borderBottomWidth: 1,
  },
  iconBadge: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  expenseMiddle: {
    flex: 1,
    marginRight: Spacing.sm,
  },
  expenseDesc: {
    fontFamily: Fonts.sourceSans.semiBold,
    fontSize: 14,
  },
  expenseSubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginTop: 2,
  },
  hmrcBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 9999,
  },
  hmrcBadgeText: {
    fontFamily: Fonts.sourceSans.semiBold,
    fontSize: 11,
  },
  expenseSub: {
    fontFamily: Fonts.sourceSans.regular,
    fontSize: 12,
    marginTop: 2,
  },
  expenseRight: {
    alignItems: 'flex-end',
  },
  expenseAmount: {
    fontFamily: Fonts.lexend.bold,
    fontSize: 14,
  },
  deleteButton: {
    marginLeft: 10,
    padding: 4,
  },
});

const styles = StyleSheet.create({
  pressed: {
    opacity: 0.85,
  },
  expenseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: Spacing.md,
  },
  expenseRowBorder: {
    borderBottomWidth: 1,
  },
  iconBadge: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  expenseMiddle: {
    flex: 1,
    marginRight: Spacing.sm,
  },
  expenseDesc: {
    fontFamily: Fonts.sourceSans.semiBold,
    fontSize: 14,
  },
  expenseSubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginTop: 2,
  },
  hmrcBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 9999,
  },
  hmrcBadgeText: {
    fontFamily: Fonts.sourceSans.semiBold,
    fontSize: 11,
  },
  expenseSub: {
    fontFamily: Fonts.sourceSans.regular,
    fontSize: 12,
    marginTop: 2,
  },
  expenseRight: {
    alignItems: 'flex-end',
  },
  expenseAmount: {
    fontFamily: Fonts.lexend.bold,
    fontSize: 14,
  },
  claimedBadge: {
    backgroundColor: designColors.successGlow,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.pill,
    marginTop: 3,
  },
  claimedBadgeText: {
    fontFamily: Fonts.sourceSans.semiBold,
    fontSize: 11,
    color: Colors.success,
  },
  deleteButton: {
    marginLeft: 10,
    padding: 4,
  },
});
