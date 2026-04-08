// Action item card — tappable with left colour border + icon

import { StyleSheet, View, Text, Pressable } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { Colors, BorderRadius, Shadows, PressedState } from '@/constants/Colors';
import { Fonts } from '@/constants/Typography';
import { useTheme } from '@/lib/ThemeContext';

interface ActionCardProps {
  title: string;
  description: string;
  type: 'warning' | 'info' | 'action' | 'success' | 'error' | 'urgent';
  icon?: React.ComponentType<{ size: number; color: string; strokeWidth?: number }>;
  onPress?: () => void;
}

const typeColors: Record<string, string> = {
  warning: Colors.accent,
  info: Colors.secondary,
  action: Colors.success,
  success: Colors.success,
  error: Colors.error,
  urgent: Colors.error,
};

export function ActionCard({ title, description, type, icon: Icon, onPress }: ActionCardProps) {
  const { colors } = useTheme();
  const color = typeColors[type] ?? Colors.secondary;

  return (
    <Pressable
      onPress={onPress}
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel={`${title}. ${description}`}
      accessibilityHint={onPress ? 'Tap to take action' : undefined}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: colors.surface, borderColor: colors.cardBorder },
        Shadows.darkSoft,
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
        <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
        <Text style={[styles.description, { color: colors.textSecondary }]}>{description}</Text>
      </View>
      <ChevronRight size={12} color={colors.textSecondary} strokeWidth={1.5} style={styles.chevron} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: BorderRadius.card,
    borderWidth: 1,
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
  },
  description: {
    fontFamily: Fonts.sourceSans.regular,
    fontSize: 12,
    marginTop: 2,
  },
  chevron: {
    marginRight: 14,
  },
});
