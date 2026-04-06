import { StyleSheet, View, ViewProps } from 'react-native';
import { BorderRadius, Spacing, Shadows } from '@/constants/Colors';
import { useTheme } from '@/lib/ThemeContext';

interface CardProps extends ViewProps {
  children: React.ReactNode;
}

export function Card({ children, style, ...props }: CardProps) {
  const { colors } = useTheme();

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }, style]} {...props}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: BorderRadius.card,
    padding: Spacing.lg,
    borderWidth: 1,
    ...Shadows.soft,
  },
});
