import { StyleSheet, View, Text, Pressable, Platform } from 'react-native';
import { useRouter, useSegments } from 'expo-router';
import {
  Home, PoundSterling, CreditCard, BookOpen, Settings,
  FileText, Car, Users, TrendingUp, Receipt,
} from 'lucide-react-native';
import { colors, Colors, Spacing, PressedState } from '@/constants/Colors';
import { Fonts } from '@/constants/Typography';
import { BrandLogo } from '@/components/ui/BrandLogo';

interface NavItem {
  name: string;
  route: string;
  icon: React.FC<{ size?: number; color?: string; strokeWidth?: number }>;
  segment: string;
}

const MAIN_NAV: NavItem[] = [
  { name: 'Home', route: '/(tabs)', icon: Home, segment: 'index' },
  { name: 'Income', route: '/(tabs)/income', icon: PoundSterling, segment: 'income' },
  { name: 'Expenses', route: '/(tabs)/expenses', icon: CreditCard, segment: 'expenses' },
  { name: 'Learn', route: '/(tabs)/learn', icon: BookOpen, segment: 'learn' },
];

const TOOLS_NAV: NavItem[] = [
  { name: 'Invoices', route: '/invoices', icon: Receipt, segment: 'invoices' },
  { name: 'Clients', route: '/clients', icon: Users, segment: 'clients' },
  { name: 'Mileage', route: '/mileage', icon: Car, segment: 'mileage' },
  { name: 'P&L Report', route: '/pnl-report', icon: TrendingUp, segment: 'pnl-report' },
  { name: 'Tax History', route: '/tax-history', icon: FileText, segment: 'tax-history' },
];

function NavSection({ items, activeSegment, router, label }: {
  items: NavItem[];
  activeSegment: string;
  router: ReturnType<typeof useRouter>;
  label?: string;
}) {
  return (
    <>
      {label && <Text style={s.sectionLabel}>{label}</Text>}
      {items.map((item) => {
        const isActive = activeSegment === item.segment;
        const IconComponent = item.icon;
        return (
          <Pressable
            key={item.name}
            onPress={() => router.push(item.route as any)}
            style={({ pressed }) => [
              s.navItem,
              isActive && s.navItemActive,
              pressed && PressedState,
            ]}
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}
            accessibilityLabel={item.name}
          >
            {isActive && <View style={s.activeBar} />}
            <IconComponent
              size={17}
              color={isActive ? Colors.electricBlue : colors.textMuted}
              strokeWidth={1.5}
            />
            <Text style={[s.navLabel, { color: isActive ? colors.text : colors.textSecondary }, isActive && s.navLabelActive]}>
              {item.name}
            </Text>
          </Pressable>
        );
      })}
    </>
  );
}

export function SidebarNav() {
  const router = useRouter();
  const segments = useSegments();
  const allSegments = segments as string[];
  const activeSegment = allSegments[1] || allSegments[0] || 'index';

  return (
    <View style={s.sidebar}>
      <Pressable
        onPress={() => router.push('/(tabs)')}
        style={s.logoWrap}
        accessibilityRole="button"
        accessibilityLabel="Go to dashboard"
      >
        <BrandLogo size={28} textSize={18} />
      </Pressable>

      <View style={s.navItems}>
        <NavSection items={MAIN_NAV} activeSegment={activeSegment} router={router} />
        <View style={s.divider} />
        <NavSection items={TOOLS_NAV} activeSegment={activeSegment} router={router} label="TOOLS" />
      </View>

      <View style={s.sidebarFooter}>
        <Pressable
          onPress={() => router.push('/(tabs)/settings')}
          style={({ pressed }) => [s.settingsBtn, pressed && PressedState]}
          accessibilityRole="tab"
          accessibilityLabel="Settings"
        >
          <Settings size={16} color={colors.textSecondary} strokeWidth={1.5} />
          <Text style={s.settingsLabel}>Settings</Text>
        </Pressable>
        <Text style={s.footerText}>QuidSafe v1.0</Text>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
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
  sectionLabel: {
    fontFamily: Fonts.sourceSans.semiBold,
    fontSize: 10,
    color: colors.textMuted,
    letterSpacing: 1.2,
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 6,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 10,
    marginHorizontal: 12,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    position: 'relative',
  },
  navItemActive: {
    backgroundColor: colors.accentGlow,
  },
  activeBar: {
    position: 'absolute',
    left: 0,
    top: 8,
    bottom: 8,
    width: 3,
    borderRadius: 2,
    backgroundColor: Colors.electricBlue,
  },
  navLabel: {
    fontFamily: Fonts.sourceSans.regular,
    fontSize: 13,
  },
  navLabelActive: {
    fontFamily: Fonts.sourceSans.semiBold,
  },
  sidebarFooter: {
    paddingHorizontal: Spacing.sm,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: 8,
  },
  settingsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
  },
  settingsLabel: {
    fontFamily: Fonts.sourceSans.regular,
    fontSize: 13,
    color: colors.textSecondary,
  },
  footerText: {
    fontFamily: Fonts.sourceSans.regular,
    fontSize: 11,
    color: colors.textMuted,
    paddingHorizontal: 16,
  },
});
