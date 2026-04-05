import { StyleSheet, View, ViewProps } from 'react-native';
import { Colors, BorderRadius, Spacing, Shadows } from '@/constants/Colors';

interface CardProps extends ViewProps {
  children: React.ReactNode;
}

export function Card({ children, style, ...props }: CardProps) {
  return (
    <View style={[styles.card, style]} {...props}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.card,
    padding: Spacing.lg,
    ...Shadows.soft,
  },
});
