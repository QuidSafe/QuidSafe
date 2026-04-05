import { StyleSheet, View, Text } from 'react-native';
import { Colors, BorderRadius, Spacing } from '@/constants/Colors';

interface BadgeProps {
  label: string;
  variant?: 'primary' | 'success' | 'warning' | 'error' | 'info';
}

const variantColors = {
  primary: { bg: Colors.primary + '15', text: Colors.primary },
  success: { bg: Colors.success + '15', text: Colors.success },
  warning: { bg: Colors.warning + '15', text: Colors.warning },
  error: { bg: Colors.error + '15', text: Colors.error },
  info: { bg: Colors.info + '15', text: Colors.info },
};

export function Badge({ label, variant = 'primary' }: BadgeProps) {
  const colors = variantColors[variant];
  return (
    <View style={[styles.badge, { backgroundColor: colors.bg }]}>
      <Text style={[styles.text, { color: colors.text }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.pill,
    alignSelf: 'flex-start',
  },
  text: {
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 12,
  },
});
