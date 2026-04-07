import { useRef } from 'react';
import { StyleSheet, View, ViewProps, Pressable, Animated } from 'react-native';
import { BorderRadius, Spacing, Shadows } from '@/constants/Colors';
import { useTheme } from '@/lib/ThemeContext';

interface CardProps extends ViewProps {
  children: React.ReactNode;
  variant?: 'default' | 'glass' | 'elevated';
  onPress?: () => void;
  accessibilityLabel?: string;
}

export function Card({ children, variant = 'default', style, onPress, accessibilityLabel, ...props }: CardProps) {
  const { colors, isDark } = useTheme();

  const darkShadow = {
    shadowColor: 'rgba(0,0,0,0.4)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 3,
  };

  const darkShadowMedium = {
    shadowColor: 'rgba(0,0,0,0.5)',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 1,
    shadowRadius: 16,
    elevation: 5,
  };

  const variantStyles = {
    default: {
      backgroundColor: isDark ? '#17171F' : colors.surface,
      borderColor: isDark ? 'rgba(255,255,255,0.07)' : colors.cardBorder,
      ...(isDark ? darkShadow : Shadows.soft),
    },
    glass: {
      backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : colors.surfaceGlass,
      borderColor: isDark ? 'rgba(255,255,255,0.08)' : colors.cardBorder,
      ...(isDark ? darkShadow : Shadows.soft),
    },
    elevated: {
      backgroundColor: isDark ? '#1A1A24' : colors.surface,
      borderColor: isDark ? 'rgba(255,255,255,0.09)' : colors.cardBorder,
      ...(isDark ? darkShadowMedium : Shadows.medium),
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
          pressed && styles.elevatedPressed,
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
  elevatedPressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.95,
  },
});
