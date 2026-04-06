import { StyleSheet, View, ViewProps, Pressable } from 'react-native';
import { BorderRadius, Spacing, Shadows } from '@/constants/Colors';
import { useTheme } from '@/lib/ThemeContext';

interface CardProps extends ViewProps {
  children: React.ReactNode;
  variant?: 'default' | 'glass' | 'elevated';
  onPress?: () => void;
}

export function Card({ children, variant = 'default', style, onPress, ...props }: CardProps) {
  const { colors, isDark } = useTheme();

  const darkShadow = {
    shadowColor: 'rgba(0,0,0,0.3)',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 3,
    elevation: 2,
  };

  const darkShadowMedium = {
    shadowColor: 'rgba(0,0,0,0.3)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 4,
  };

  const variantStyles = {
    default: {
      backgroundColor: colors.surface,
      borderColor: colors.cardBorder,
      ...(isDark ? darkShadow : Shadows.soft),
    },
    glass: {
      backgroundColor: colors.surfaceGlass,
      borderColor: colors.cardBorder,
      ...(isDark ? darkShadow : Shadows.soft),
    },
    elevated: {
      backgroundColor: colors.surface,
      borderColor: colors.cardBorder,
      ...(isDark ? darkShadowMedium : Shadows.medium),
    },
  };

  if (variant === 'elevated' && onPress) {
    return (
      <Pressable
        onPress={onPress}
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
    <View style={[styles.card, variantStyles[variant], style]} {...props}>
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
