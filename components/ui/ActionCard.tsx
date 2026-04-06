// Action item card — tappable with left colour border + icon

import { StyleSheet, View, Text, Pressable } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Colors, BorderRadius, Shadows } from '@/constants/Colors';
import { useTheme } from '@/lib/ThemeContext';

interface ActionCardProps {
  title: string;
  description: string;
  type: 'warning' | 'info' | 'action' | 'success' | 'error' | 'urgent';
  icon?: React.ComponentProps<typeof FontAwesome>['name'];
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

export function ActionCard({ title, description, type, icon, onPress }: ActionCardProps) {
  const { colors, isDark } = useTheme();
  const color = typeColors[type] ?? Colors.secondary;

  const cardShadow = isDark
    ? {
        shadowColor: 'rgba(0,0,0,0.3)',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 1,
        shadowRadius: 3,
        elevation: 2,
      }
    : Shadows.soft;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: colors.surface, borderColor: colors.cardBorder },
        cardShadow,
        pressed && styles.pressed,
      ]}
    >
      <View style={[styles.border, { backgroundColor: color }]} />
      {icon && (
        <View style={[styles.iconContainer, { backgroundColor: color + '15' }]}>
          <FontAwesome name={icon} size={12} color={color} />
        </View>
      )}
      <View style={styles.content}>
        <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
        <Text style={[styles.description, { color: colors.textSecondary }]}>{description}</Text>
      </View>
      <FontAwesome name="chevron-right" size={12} color={colors.textSecondary} style={styles.chevron} />
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
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
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
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 14,
  },
  description: {
    fontFamily: 'Manrope_400Regular',
    fontSize: 12,
    marginTop: 2,
  },
  chevron: {
    marginRight: 14,
  },
});
