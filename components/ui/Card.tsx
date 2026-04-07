import { StyleSheet, View, ViewProps, Pressable } from 'react-native';
import { BorderRadius, Spacing, Shadows, PressedState } from '@/constants/Colors';
import { useTheme } from '@/lib/ThemeContext';

interface CardProps extends ViewProps {
  children: React.ReactNode;
  variant?: 'default' | 'glass' | 'elevated';
  onPress?: () => void;
  accessibilityLabel?: string;
}

export function Card({ children, variant = 'default', style, onPress, accessibilityLabel, ...props }: CardProps) {
  const { colors, isDark } = useTheme();

  const variantStyles = {
    default: {
      backgroundColor: isDark ? '#17171F' : colors.surface,
      borderColor: isDark ? 'rgba(255,255,255,0.07)' : colors.cardBorder,
      ...(isDark ? Shadows.darkSoft : Shadows.soft),
    },
    glass: {
      backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : colors.surfaceGlass,
      borderColor: isDark ? 'rgba(255,255,255,0.08)' : colors.cardBorder,
      ...(isDark ? Shadows.darkSoft : Shadows.soft),
    },
    elevated: {
      backgroundColor: isDark ? '#1A1A24' : colors.surface,
      borderColor: isDark ? 'rgba(255,255,255,0.09)' : colors.cardBorder,
      ...(isDark ? Shadows.darkMedium : Shadows.medium),
    },
  };

  if (variant === 'elevated' && onPress) {
    return (
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        style={({ pressed }) => [
          styles.card,
          variantStyles[variant],
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
      style={[styles.card, variantStyles[variant], style]}
      accessibilityRole="summary"
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
