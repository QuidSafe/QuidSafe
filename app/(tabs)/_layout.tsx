import { View, Platform } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Tabs } from 'expo-router';
import { useTheme } from '@/lib/ThemeContext';
import { useResponsiveLayout } from '@/lib/useResponsiveLayout';
import { SidebarNav } from '@/components/ui/SidebarNav';
import { Fonts } from '@/constants/Typography';

function TabBarIcon(props: { name: React.ComponentProps<typeof FontAwesome>['name']; color: string }) {
  return <FontAwesome size={22} style={{ marginBottom: -2 }} {...props} />;
}

export default function TabLayout() {
  const { colors, isDark } = useTheme();
  const { isDesktop, isWeb } = useResponsiveLayout();

  // On web desktop: sidebar navigation replaces the bottom tab bar
  const showSidebar = isWeb && isDesktop;
  const hideTabBar = showSidebar;

  return (
    <View style={{ flex: 1, flexDirection: 'row' }}>
      {showSidebar && <SidebarNav />}

      <View style={{ flex: 1, marginLeft: showSidebar ? 240 : 0 }}>
        <Tabs
          screenOptions={{
            lazy: true,
            tabBarActiveTintColor: colors.tabIconSelected,
            tabBarInactiveTintColor: colors.tabIconDefault,
            tabBarStyle: hideTabBar
              ? { display: 'none' }
              : {
                  position: 'absolute' as const,
                  backgroundColor: isDark ? 'rgba(10,10,15,0.95)' : 'rgba(255,255,255,0.95)',
                  borderTopColor: isDark ? 'rgba(30,41,59,0.5)' : 'rgba(226,232,240,0.8)',
                  paddingBottom: Platform.OS === 'web' ? 6 : 4,
                  height: 60,
                  elevation: 0,
                  ...(Platform.OS === 'web' ? {
                    backdropFilter: 'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)',
                  } : {}),
                },
            tabBarLabelStyle: {
              fontFamily: Fonts.manrope.medium,
              fontSize: 10,
            },
            headerStyle: {
              backgroundColor: colors.surface,
            },
            headerTitleStyle: {
              fontFamily: Fonts.manrope.bold,
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
              tabBarIcon: ({ color }) => <TabBarIcon name="home" color={color} />,
            }}
          />
          <Tabs.Screen
            name="income"
            options={{
              title: 'Income',
              tabBarAccessibilityLabel: 'Income tab - Track your earnings',
              tabBarIcon: ({ color }) => <TabBarIcon name="gbp" color={color} />,
            }}
          />
          <Tabs.Screen
            name="expenses"
            options={{
              title: 'Expenses',
              tabBarAccessibilityLabel: 'Expenses tab - Track your business expenses',
              tabBarIcon: ({ color }) => <TabBarIcon name="credit-card" color={color} />,
            }}
          />
          <Tabs.Screen
            name="learn"
            options={{
              title: 'Learn',
              tabBarAccessibilityLabel: 'Learn tab - Tax guides and tips',
              tabBarIcon: ({ color }) => <TabBarIcon name="book" color={color} />,
            }}
          />
          <Tabs.Screen
            name="settings"
            options={{
              title: 'Settings',
              tabBarAccessibilityLabel: 'Settings tab - App preferences and account',
              tabBarIcon: ({ color }) => <TabBarIcon name="cog" color={color} />,
            }}
          />
        </Tabs>
      </View>
    </View>
  );
}
