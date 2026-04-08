import { StyleSheet, View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius } from '@/constants/Colors';
import { Fonts } from '@/constants/Typography';
import { useTheme } from '@/lib/ThemeContext';

interface EmptyStateProps {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  title: string;
  subtitle: string;
  actionLabel?: string;
  onAction?: () => void;
  /** Optional tint color for the icon and icon background. Defaults to Colors.accent. */
  tintColor?: string;
}

export function EmptyState({
  icon,
  title,
  subtitle,
  actionLabel,
  onAction,
  tintColor = Colors.accent,
}: EmptyStateProps) {
  const { colors } = useTheme();

  return (
    <View style={styles.container} accessible accessibilityRole="alert" accessibilityLabel={`${title}. ${subtitle}`}>
      {/* Circular icon container with tinted background */}
      <View style={[styles.iconCircle, { backgroundColor: tintColor + '1A' }]}>
        <Ionicons name={icon} size={64} color={tintColor} />
      </View>

      <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{subtitle}</Text>

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
    fontFamily: Fonts.manrope.bold,
    fontSize: 18,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  subtitle: {
    fontFamily: Fonts.manrope.regular,
    fontSize: 14,
    textAlign: 'center',
    maxWidth: 280,
    lineHeight: 20,
    marginBottom: Spacing.lg,
  },
  actionButton: {
    backgroundColor: Colors.accent,
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: BorderRadius.button,
  },
  actionButtonPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.97 }],
  },
  actionButtonText: {
    fontFamily: Fonts.manrope.bold,
    fontSize: 15,
    color: Colors.white,
  },
});
