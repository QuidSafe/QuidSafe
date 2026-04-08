import { StyleSheet, View, Text, Pressable, Platform } from 'react-native';
import { useRouter, useSegments } from 'expo-router';
import { Home, PoundSterling, CreditCard, BookOpen, Settings } from 'lucide-react-native';
import { colors, Spacing, PressedState } from '@/constants/Colors';
import { Fonts } from '@/constants/Typography';
import { BrandLogo } from '@/components/ui/BrandLogo';

interface NavItem {
  name: string;
  route: string;
  icon: React.FC<{ size?: number; color?: string; strokeWidth?: number }>;
  segment: string;
}

const NAV_ITEMS: NavItem[] = [
  { name: 'Home', route: '/(tabs)', icon: Home, segment: 'index' },
  { name: 'Income', route: '/(tabs)/income', icon: PoundSterling, segment: 'income' },
  { name: 'Expenses', route: '/(tabs)/expenses', icon: CreditCard, segment: 'expenses' },
  { name: 'Learn', route: '/(tabs)/learn', icon: BookOpen, segment: 'learn' },
  { name: 'Settings', route: '/(tabs)/settings', icon: Settings, segment: 'settings' },
];

export function SidebarNav() {
  const router = useRouter();
  const segments = useSegments();

  const allSegments = segments as string[];
  const activeSegment = allSegments[1] || 'index';

  return (
    <View style={styles.sidebar}>
      <Pressable
        onPress={() => router.push('/(tabs)')}
        style={styles.logoWrap}
        accessibilityRole="button"
        accessibilityLabel="Go to dashboard"
      >
        <BrandLogo size={28} textSize={18} />
      </Pressable>

      <View style={styles.navItems}>
        {NAV_ITEMS.map((item) => {
          const isActive = activeSegment === item.segment;
          const IconComponent = item.icon;
          return (
            <Pressable
              key={item.name}
              onPress={() => router.push(item.route as any)}
              style={({ pressed }) => [
                styles.navItem,
                isActive && styles.navItemActive,
                pressed && PressedState,
              ]}
              accessibilityRole="tab"
              accessibilityState={{ selected: isActive }}
              accessibilityLabel={item.name}
            >
              {isActive && <View style={styles.activeBar} />}
              <IconComponent
                size={18}
                color={isActive ? colors.accent : colors.textMuted}
                strokeWidth={1.5}
              />
              <Text
                style={[
                  styles.navLabel,
                  { color: isActive ? colors.text : colors.textSecondary },
                  isActive && styles.navLabelActive,
                ]}
              >
                {item.name}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.sidebarFooter}>
        <Text style={styles.footerText}>QuidSafe v1.0</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sidebar: {
    width: 240,
    borderRightWidth: 1,
    borderRightColor: colors.border,
    backgroundColor: colors.surface,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.lg,
    justifyContent: 'flex-start',
    ...(Platform.OS === 'web' ? { height: '100vh' as any, position: 'fixed' as any, left: 0, top: 0, zIndex: 50 } : {}),
  },
  logoWrap: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    marginBottom: Spacing.md,
  },
  navItems: {
    flex: 1,
    paddingHorizontal: Spacing.sm,
    gap: 2,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    position: 'relative',
  },
  navItemActive: {
    backgroundColor: colors.accentGlow,
    borderRadius: 10,
  },
  activeBar: {
    position: 'absolute',
    left: 0,
    top: 8,
    bottom: 8,
    width: 3,
    borderRadius: 2,
    backgroundColor: colors.accent,
  },
  navLabel: {
    fontFamily: Fonts.sourceSans.regular,
    fontSize: 14,
  },
  navLabelActive: {
    fontFamily: Fonts.sourceSans.semiBold,
  },
  sidebarFooter: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  footerText: {
    fontFamily: Fonts.sourceSans.regular,
    fontSize: 11,
    color: colors.textMuted,
  },
});
