import { Platform } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Tabs } from 'expo-router';
import { useTheme } from '@/lib/ThemeContext';

function TabBarIcon(props: { name: React.ComponentProps<typeof FontAwesome>['name']; color: string }) {
  return <FontAwesome size={22} style={{ marginBottom: -2 }} {...props} />;
}

export default function TabLayout() {
  const { colors, isDark } = useTheme();

  const isWeb = Platform.OS === 'web';

  return (
    <Tabs
      screenOptions={{
        lazy: true,
        tabBarActiveTintColor: colors.tabIconSelected,
        tabBarInactiveTintColor: colors.tabIconDefault,
        tabBarStyle: {
          position: 'absolute' as const,
          backgroundColor: isDark ? 'rgba(10,10,15,0.92)' : 'rgba(255,255,255,0.92)',
          borderTopColor: isDark ? 'rgba(30,41,59,0.5)' : 'rgba(226,232,240,0.8)',
          paddingBottom: isWeb ? 8 : 4,
          height: isWeb ? 64 : 56,
          elevation: 0,
          ...(isWeb ? {
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            maxWidth: 540,
            marginHorizontal: 'auto' as unknown as number,
            left: 0,
            right: 0,
            borderRadius: 16,
            bottom: 12,
            borderWidth: 1,
            borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
          } : {}),
        },
        tabBarLabelStyle: {
          fontFamily: 'Manrope_500Medium',
          fontSize: isWeb ? 11 : 10,
          ...(isWeb ? { marginTop: 2 } : {}),
        },
        headerStyle: {
          backgroundColor: colors.surface,
        },
        headerTitleStyle: {
          fontFamily: 'Manrope_700Bold',
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
  );
}
