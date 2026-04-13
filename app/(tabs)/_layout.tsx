import { View, Platform } from 'react-native';
import { Home, PoundSterling, CreditCard, BookOpen, Settings } from 'lucide-react-native';
import { Tabs } from 'expo-router';
import { colors } from '@/constants/Colors';
import { useResponsiveLayout } from '@/lib/useResponsiveLayout';
import { SidebarNav } from '@/components/ui/SidebarNav';
import { Fonts } from '@/constants/Typography';

export default function TabLayout() {
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
                  backgroundColor: 'rgba(10,10,15,0.95)',
                  borderTopColor: 'rgba(30,41,59,0.5)',
                  paddingBottom: Platform.OS === 'web' ? 6 : 4,
                  height: 60,
                  elevation: 0,
                  ...(Platform.OS === 'web' ? {
                    backdropFilter: 'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)',
                  } : {}),
                },
            tabBarLabelStyle: {
              fontFamily: Fonts.sourceSans.regular,
              fontSize: 10,
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
              tabBarIcon: ({ color }) => <Home size={22} color={color} strokeWidth={1.5} />,
            }}
          />
          <Tabs.Screen
            name="income"
            options={{
              title: 'Income',
              tabBarAccessibilityLabel: 'Income tab - Track your earnings',
              tabBarIcon: ({ color }) => <PoundSterling size={22} color={color} strokeWidth={1.5} />,
            }}
          />
          <Tabs.Screen
            name="expenses"
            options={{
              title: 'Expenses',
              tabBarAccessibilityLabel: 'Expenses tab - Track your business expenses',
              tabBarIcon: ({ color }) => <CreditCard size={22} color={color} strokeWidth={1.5} />,
            }}
          />
          <Tabs.Screen
            name="learn"
            options={{
              title: 'Learn',
              tabBarAccessibilityLabel: 'Learn tab - Tax guides and tips',
              tabBarIcon: ({ color }) => <BookOpen size={22} color={color} strokeWidth={1.5} />,
            }}
          />
          <Tabs.Screen
            name="settings"
            options={{
              title: 'Settings',
              tabBarAccessibilityLabel: 'Settings tab - App preferences and account',
              tabBarIcon: ({ color }) => <Settings size={22} color={color} strokeWidth={1.5} />,
            }}
          />
        </Tabs>
      </View>
    </View>
  );
}
