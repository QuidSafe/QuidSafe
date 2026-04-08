import { StyleSheet, Pressable, Text, PressableProps, ViewStyle } from 'react-native';
import { colors, BorderRadius, Spacing, PressedState } from '@/constants/Colors';
import { Fonts } from '@/constants/Typography';
import { hapticLight } from '@/lib/haptics';

interface ButtonProps extends PressableProps {
  title: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'cta';
  size?: 'sm' | 'md' | 'lg';
  accessibilityLabel?: string;
  accessibilityHint?: string;
}

export function Button({ title, variant = 'primary', size = 'md', style, accessibilityLabel, accessibilityHint, onPress, ...props }: ButtonProps) {
  const handlePress = (e: Parameters<NonNullable<PressableProps['onPress']>>[0]) => {
    hapticLight();
    onPress?.(e);
  };

  const variantTextColor =
    variant === 'primary' || variant === 'secondary' || variant === 'cta'
      ? colors.text
      : colors.accent;

  const variantBorderColor = variant === 'outline' ? colors.accent : undefined;

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
  },
  primary: {
    backgroundColor: colors.background,
  },
  secondary: {
    backgroundColor: colors.accent,
  },
  cta: {
    backgroundColor: colors.accent,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
  },
  ghost: {
    backgroundColor: 'transparent',
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
