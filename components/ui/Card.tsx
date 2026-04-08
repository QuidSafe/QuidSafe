import { useMemo } from 'react';
import { StyleSheet, View, ViewProps, Pressable } from 'react-native';
import { colors, BorderRadius, Spacing, PressedState } from '@/constants/Colors';

interface CardProps extends ViewProps {
  children: React.ReactNode;
  variant?: 'default' | 'glass' | 'elevated';
  onPress?: () => void;
  accessibilityLabel?: string;
}

export function Card({ children, variant = 'default', style, onPress, accessibilityLabel, ...props }: CardProps) {

  const variantStyle = useMemo(() => {
    switch (variant) {
      case 'glass':
        return {
          backgroundColor: 'rgba(255,255,255,0.04)',
          borderColor: 'rgba(255,255,255,0.08)',
        };
      case 'elevated':
        return {
          backgroundColor: colors.surface,
          borderColor: 'rgba(255,255,255,0.09)',
        };
      default:
        return {
          backgroundColor: colors.surface,
          borderColor: colors.border,
        };
    }
  }, [variant]);

  if (variant === 'elevated' && onPress) {
    return (
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        style={({ pressed }) => [
          styles.card,
          variantStyle,
          pressed && PressedState,
          style,
        ]}
        {...props}
      >
        {children}
      </Pressable>
    );
  }

  return (
    <View
      style={[styles.card, variantStyle, style]}
      accessibilityRole="none"
      accessibilityLabel={accessibilityLabel}
      {...props}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: BorderRadius.card,
    padding: Spacing.lg,
    borderWidth: 1,
  },
});
