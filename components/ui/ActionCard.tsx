// Action item card — tappable with left colour border + icon

import { StyleSheet, View, Text, Pressable } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Colors, BorderRadius, Shadows } from '@/constants/Colors';

interface ActionCardProps {
  title: string;
  description: string;
  type: 'warning' | 'info' | 'action' | 'success' | 'error';
  icon?: React.ComponentProps<typeof FontAwesome>['name'];
  onPress?: () => void;
}

const typeColors: Record<string, string> = {
  warning: Colors.accent,
  info: Colors.secondary,
  action: Colors.success,
  success: Colors.success,
  error: Colors.error,
};

export function ActionCard({ title, description, type, icon, onPress }: ActionCardProps) {
  const color = typeColors[type];
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <View style={[styles.border, { backgroundColor: color }]} />
      {icon && (
        <View style={[styles.iconContainer, { backgroundColor: color + '15' }]}>
          <FontAwesome name={icon} size={12} color={color} />
        </View>
      )}
      <View style={styles.content}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.description}>{description}</Text>
      </View>
      <FontAwesome name="chevron-right" size={12} color={Colors.grey[400]} style={styles.chevron} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.card,
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
    ...Shadows.soft,
  },
  pressed: {
    opacity: 0.9,
    transform: [{ translateY: -1 }],
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
    color: Colors.light.text,
  },
  description: {
    fontFamily: 'Manrope_400Regular',
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
  chevron: {
    marginRight: 14,
  },
});
