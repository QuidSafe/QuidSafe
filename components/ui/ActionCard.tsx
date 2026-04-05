// Action item card — tappable with left colour border

import { StyleSheet, View, Text, Pressable } from 'react-native';
import { Colors, Spacing, BorderRadius, Shadows } from '@/constants/Colors';

interface ActionCardProps {
  title: string;
  description: string;
  type: 'warning' | 'info' | 'action';
  onPress?: () => void;
}

const typeColors = {
  warning: Colors.accent,
  info: Colors.primary,
  action: Colors.secondary,
};

export function ActionCard({ title, description, type, onPress }: ActionCardProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <View style={[styles.border, { backgroundColor: typeColors[type] }]} />
      <View style={styles.content}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.description}>{description}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.card,
    flexDirection: 'row',
    overflow: 'hidden',
    ...Shadows.soft,
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  border: {
    width: 4,
  },
  content: {
    flex: 1,
    padding: Spacing.md,
  },
  title: {
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 15,
    color: Colors.light.text,
  },
  description: {
    fontFamily: 'Manrope_400Regular',
    fontSize: 13,
    color: Colors.light.textSecondary,
    marginTop: 4,
  },
});
