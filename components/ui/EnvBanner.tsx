import { useState } from 'react';
import { StyleSheet, View, Text, Pressable, Platform } from 'react-native';
import { X, AlertTriangle } from 'lucide-react-native';
import { Colors, Spacing } from '@/constants/Colors';
import { Fonts } from '@/constants/Typography';

// Non-production environment banner. Renders at the top of the web app
// whenever EXPO_PUBLIC_ENVIRONMENT is set and not "production" - visual
// reassurance that you're not looking at real customer data.
//
// Only shown on web (Platform.OS === 'web') because native builds point
// at a single API in practice, while web is where you might flip tabs
// between staging and prod and need to know which you're on.
export function EnvBanner() {
  const env = process.env.EXPO_PUBLIC_ENVIRONMENT;
  const [dismissed, setDismissed] = useState(false);

  if (Platform.OS !== 'web') return null;
  if (!env || env === 'production') return null;
  if (dismissed) return null;

  const label = env.toUpperCase();

  return (
    <View style={styles.bar} accessibilityLiveRegion="polite">
      <AlertTriangle size={14} color={Colors.warning} strokeWidth={2} />
      <Text style={styles.text}>
        <Text style={styles.label}>{label}</Text>
        {'  ·  '}
        <Text>Non-production environment. Data may be synthetic or reset at any time.</Text>
      </Text>
      <Pressable
        onPress={() => setDismissed(true)}
        style={styles.dismiss}
        accessibilityRole="button"
        accessibilityLabel="Dismiss staging banner"
        hitSlop={8}
      >
        <X size={12} color={Colors.warning} strokeWidth={2} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
    backgroundColor: 'rgba(255, 149, 0, 0.12)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 149, 0, 0.35)',
    zIndex: 100,
  },
  text: {
    flex: 1,
    fontFamily: Fonts.sourceSans.regular,
    fontSize: 12,
    color: Colors.warning,
  },
  label: {
    fontFamily: Fonts.sourceSans.semiBold,
    letterSpacing: 0.6,
  },
  dismiss: {
    padding: 4,
  },
});
