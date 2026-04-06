import { StyleSheet, Pressable, Text, PressableProps, ViewStyle } from 'react-native';
import { Colors, BorderRadius, Spacing, Shadows } from '@/constants/Colors';
import { useTheme } from '@/lib/ThemeContext';

interface ButtonProps extends PressableProps {
  title: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

export function Button({ title, variant = 'primary', size = 'md', style, ...props }: ButtonProps) {
  const { colors } = useTheme();

  const variantTextColor =
    variant === 'primary' || variant === 'secondary'
      ? Colors.white
      : colors.tint;

  const variantBorderColor = variant === 'outline' ? colors.tint : undefined;

  return (
    <Pressable
      style={({ pressed }) => [
        styles.base,
        styles[variant],
        styles[size],
        variantBorderColor ? { borderColor: variantBorderColor } : undefined,
        pressed && styles.pressed,
        style as ViewStyle,
      ]}
      {...props}
    >
      <Text style={[styles.text, { color: variantTextColor }]}>
        {title}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: BorderRadius.button,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.soft,
  },
  pressed: {
    opacity: 0.85,
  },
  primary: {
    backgroundColor: Colors.primary,
  },
  secondary: {
    backgroundColor: Colors.secondary,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    shadowOpacity: 0,
    elevation: 0,
  },
  ghost: {
    backgroundColor: 'transparent',
    shadowOpacity: 0,
    elevation: 0,
  },
  sm: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
  },
  md: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
  },
  lg: {
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xl,
  },
  text: {
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 16,
  },
});
