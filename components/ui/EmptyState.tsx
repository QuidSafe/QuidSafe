import { StyleSheet, View, Text, Pressable } from 'react-native';
import { colors, Spacing, BorderRadius } from '@/constants/Colors';
import { Fonts } from '@/constants/Typography';

interface EmptyStateProps {
  icon: React.ComponentType<{ size: number; color: string; strokeWidth?: number }>;
  title: string;
  subtitle: string;
  actionLabel?: string;
  onAction?: () => void;
  tintColor?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  subtitle,
  actionLabel,
  onAction,
  tintColor = colors.accent,
}: EmptyStateProps) {
  return (
    <View style={styles.container} accessible accessibilityRole="alert" accessibilityLabel={`${title}. ${subtitle}`}>
      <View style={[styles.iconCircle, { backgroundColor: tintColor + '1A' }]}>
        <Icon size={64} color={tintColor} strokeWidth={1.5} />
      </View>

      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>

      {actionLabel && onAction ? (
        <Pressable
          style={({ pressed }) => [styles.actionButton, pressed && styles.actionButtonPressed]}
          onPress={onAction}
          accessibilityRole="button"
          accessibilityLabel={actionLabel}
          accessibilityHint={`Tap to ${actionLabel.toLowerCase()}`}
        >
          <Text style={styles.actionButtonText}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.xxl,
  },
  iconCircle: {
    width: 112,
    height: 112,
    borderRadius: 56,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  title: {
    fontFamily: Fonts.lexend.semiBold,
    fontSize: 18,
    textAlign: 'center',
    marginBottom: Spacing.sm,
    color: colors.text,
  },
  subtitle: {
    fontFamily: Fonts.sourceSans.regular,
    fontSize: 14,
    textAlign: 'center',
    maxWidth: 280,
    lineHeight: 20,
    marginBottom: Spacing.lg,
    color: colors.textSecondary,
  },
  actionButton: {
    backgroundColor: colors.accent,
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: BorderRadius.button,
  },
  actionButtonPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.97 }],
  },
  actionButtonText: {
    fontFamily: Fonts.sourceSans.semiBold,
    fontSize: 15,
    color: colors.text,
  },
});
