import { StyleSheet, Pressable, Text, PressableProps, ViewStyle } from 'react-native';
import { Colors, BorderRadius, Spacing, Shadows, PressedState } from '@/constants/Colors';
import { Fonts } from '@/constants/Typography';
import { useTheme } from '@/lib/ThemeContext';
import { hapticLight } from '@/lib/haptics';

interface ButtonProps extends PressableProps {
  title: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'cta';
  size?: 'sm' | 'md' | 'lg';
  accessibilityLabel?: string;
  accessibilityHint?: string;
}

export function Button({ title, variant = 'primary', size = 'md', style, accessibilityLabel, accessibilityHint, onPress, ...props }: ButtonProps) {
  const { colors } = useTheme();

  const handlePress = (e: Parameters<NonNullable<PressableProps['onPress']>>[0]) => {
    hapticLight();
    onPress?.(e);
  };

  const variantTextColor =
    variant === 'primary' || variant === 'secondary' || variant === 'cta'
      ? Colors.white
      : colors.tint;

  const variantBorderColor = variant === 'outline' ? colors.tint : undefined;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
      accessibilityHint={accessibilityHint}
      onPress={handlePress}
      style={({ pressed }) => [
        styles.base,
        styles[variant],
        styles[size],
        variantBorderColor ? { borderColor: variantBorderColor } : undefined,
        pressed && PressedState,
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
  primary: {
    backgroundColor: Colors.primary,
  },
  secondary: {
    backgroundColor: Colors.secondary,
  },
  cta: {
    backgroundColor: Colors.accent,
    ...Shadows.medium,
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
    fontFamily: Fonts.sourceSans.semiBold,
    fontSize: 16,
  },
});
