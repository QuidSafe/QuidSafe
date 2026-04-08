// Action item card — tappable with left colour border + icon

import { StyleSheet, View, Text, Pressable } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { colors, BorderRadius, PressedState } from '@/constants/Colors';
import { Fonts } from '@/constants/Typography';

interface ActionCardProps {
  title: string;
  description: string;
  type: 'warning' | 'info' | 'action' | 'success' | 'error' | 'urgent';
  icon?: React.ComponentType<{ size: number; color: string; strokeWidth?: number }>;
  onPress?: () => void;
}

const typeColors: Record<string, string> = {
  warning: colors.accent,
  info: colors.accent,
  action: colors.success,
  success: colors.success,
  error: colors.error,
  urgent: colors.error,
};

export function ActionCard({ title, description, type, icon: Icon, onPress }: ActionCardProps) {
  const color = typeColors[type] ?? colors.accent;

  return (
    <Pressable
      onPress={onPress}
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel={`${title}. ${description}`}
      accessibilityHint={onPress ? 'Tap to take action' : undefined}
      style={({ pressed }) => [
        styles.card,
        pressed && PressedState,
      ]}
    >
      <View style={[styles.border, { backgroundColor: color }]} />
      {Icon && (
        <View style={[styles.iconContainer, { backgroundColor: color + '15' }]}>
          <Icon size={12} color={color} strokeWidth={1.5} />
        </View>
      )}
      <View style={styles.content}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.description}>{description}</Text>
      </View>
      <ChevronRight size={12} color={colors.textSecondary} strokeWidth={1.5} style={styles.chevron} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: BorderRadius.card,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
  },
  border: {
    width: 3,
    alignSelf: 'stretch',
  },
  iconContainer: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  content: {
    flex: 1,
    padding: 12,
    paddingLeft: 11,
  },
  title: {
    fontFamily: Fonts.lexend.semiBold,
    fontSize: 14,
    color: colors.text,
  },
  description: {
    fontFamily: Fonts.sourceSans.regular,
    fontSize: 12,
    marginTop: 2,
    color: colors.textSecondary,
  },
  chevron: {
    marginRight: 14,
  },
});
