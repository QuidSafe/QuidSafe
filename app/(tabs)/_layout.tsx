import { View, Platform, StyleSheet } from 'react-native';
import { Home, PoundSterling, CreditCard, BookOpen, Settings } from 'lucide-react-native';
import { Tabs } from 'expo-router';
import { colors, Colors } from '@/constants/Colors';
import { useResponsiveLayout } from '@/lib/useResponsiveLayout';
import { SidebarNav } from '@/components/ui/SidebarNav';
import { Fonts } from '@/constants/Typography';

type LucideIcon = React.FC<{ size?: number; color?: string; strokeWidth?: number }>;

function TabIcon({ Icon, color, focused }: { Icon: LucideIcon; color: string; focused: boolean }) {
  return (
    <View style={iconStyles.wrap}>
      <View style={[iconStyles.indicator, focused && iconStyles.indicatorActive]} />
      <Icon size={22} color={color} strokeWidth={focused ? 2 : 1.5} />
    </View>
  );
}

export default function TabLayout() {
  const { isDesktop, isWeb, contentMaxWidth } = useResponsiveLayout();

  // On web desktop: sidebar navigation replaces the bottom tab bar
  const showSidebar = isWeb && isDesktop;
  const hideTabBar = showSidebar;

  // On web desktop, cap content column width so wide monitors don't stretch
  // screens edge-to-edge next to the 240px sidebar.
  const columnStyle = showSidebar
    ? { flex: 1, marginLeft: 240, maxWidth: contentMaxWidth, width: '100%' as const }
    : { flex: 1 };

  return (
    <View style={{ flex: 1, flexDirection: 'row', backgroundColor: colors.background }}>
      {showSidebar && <SidebarNav />}

      <View style={columnStyle}>
        <Tabs
          screenOptions={{
            lazy: true,
            tabBarActiveTintColor: colors.tabIconSelected,
            tabBarInactiveTintColor: colors.tabIconDefault,
            tabBarStyle: hideTabBar
              ? { display: 'none' }
              : {
                  position: 'absolute' as const,
                  backgroundColor: colors.surface,
                  borderTopColor: colors.border,
                  borderTopWidth: StyleSheet.hairlineWidth,
                  paddingTop: 6,
                  paddingBottom: Platform.OS === 'web' ? 8 : 6,
                  height: 64,
                  elevation: 0,
                  ...(Platform.OS === 'web' ? {
                    backgroundColor: 'rgba(10,10,10,0.85)',
                    backdropFilter: 'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)',
                  } : {}),
                },
            tabBarLabelStyle: {
              fontFamily: Fonts.sourceSans.semiBold,
              fontSize: 11,
              letterSpacing: 0.2,
              marginTop: 2,
            },
            tabBarItemStyle: {
              paddingTop: 2,
            },
            headerStyle: {
              backgroundColor: colors.surface,
            },
            headerTitleStyle: {
              fontFamily: Fonts.lexend.semiBold,
              color: colors.text,
            },
            headerShown: false,
          }}
        >
          <Tabs.Screen
            name="index"
            options={{
              title: 'Home',
              tabBarAccessibilityLabel: 'Home tab - Dashboard overview',
              tabBarIcon: ({ color, focused }) => <TabIcon Icon={Home} color={color} focused={focused} />,
            }}
          />
          <Tabs.Screen
            name="income"
            options={{
              title: 'Income',
              tabBarAccessibilityLabel: 'Income tab - Track your earnings',
              tabBarIcon: ({ color, focused }) => <TabIcon Icon={PoundSterling} color={color} focused={focused} />,
            }}
          />
          <Tabs.Screen
            name="expenses"
            options={{
              title: 'Expenses',
              tabBarAccessibilityLabel: 'Expenses tab - Track your business expenses',
              tabBarIcon: ({ color, focused }) => <TabIcon Icon={CreditCard} color={color} focused={focused} />,
            }}
          />
          <Tabs.Screen
            name="learn"
            options={{
              title: 'Learn',
              tabBarAccessibilityLabel: 'Learn tab - Tax guides and tips',
              tabBarIcon: ({ color, focused }) => <TabIcon Icon={BookOpen} color={color} focused={focused} />,
            }}
          />
          <Tabs.Screen
            name="settings"
            options={{
              title: 'Settings',
              tabBarAccessibilityLabel: 'Settings tab - App preferences and account',
              tabBarIcon: ({ color, focused }) => <TabIcon Icon={Settings} color={color} focused={focused} />,
            }}
          />
        </Tabs>
      </View>
    </View>
  );
}

const iconStyles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  indicator: {
    height: 3,
    width: 18,
    borderRadius: 2,
    backgroundColor: 'transparent',
    marginBottom: 4,
  },
  indicatorActive: {
    backgroundColor: Colors.electricBlue,
  },
});
