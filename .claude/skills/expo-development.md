---
name: expo-development
description: Expo SDK 54 + React Native Web development patterns for QuidSafe. Use when building screens, components, or navigation.
---

# Expo Development Skill

## When to Use
- Building new screens or components
- Working with Expo Router navigation
- Handling platform-specific code
- Loading fonts or assets

## Expo Router Patterns

### File-based routing
```
app/(auth)/login.tsx    → /login
app/(tabs)/index.tsx    → / (dashboard)
app/(tabs)/income.tsx   → /income
app/onboarding/index.tsx → /onboarding
```

### Navigation
```typescript
import { useRouter } from 'expo-router';
const router = useRouter();
router.push('/(tabs)/income');
router.replace('/(tabs)');  // No back button
```

### Auth redirect (app/_layout.tsx)
```typescript
const { isSignedIn, isLoaded } = useAuth();
const segments = useSegments();
if (isSignedIn && inAuthGroup) router.replace('/(tabs)');
if (!isSignedIn && !inAuthGroup) router.replace('/(auth)/login');
```

## Component Patterns

### Always use StyleSheet.create
```typescript
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.light.background },
});
```

### Font usage
```typescript
// Body text
fontFamily: 'Manrope_400Regular'  // 400, 500, 600, 700, 800

// Headings
fontFamily: 'PlayfairDisplay_700Bold'  // 400, 700
```

### Platform-specific code
```typescript
import { Platform } from 'react-native';

const tokenCache = Platform.OS !== 'web' ? {
  getToken: (key) => SecureStore.getItemAsync(key),
  saveToken: (key, value) => SecureStore.setItemAsync(key, value),
} : undefined;
```

### Icons
```typescript
import FontAwesome from '@expo/vector-icons/FontAwesome';
<FontAwesome name="shield" size={20} color={Colors.primary} />
```

## Design System (from mockup.html)
- Hero card: LinearGradient `#0F172A → #1E3A8A`
- Glass effect: `rgba(255,255,255,0.07)` bg + 1px border
- Cards: 16px radius, white bg, subtle shadow
- Inputs: 12px radius
- Pills/badges: 9999px radius
- Gold accent: `#CA8A04` for CTAs and set-aside
- Success values: `#16A34A` green text

## Data Fetching
```typescript
import { useDashboard, useApiToken } from '@/lib/hooks/useApi';

export default function Screen() {
  useApiToken();  // Sync Clerk token to API client
  const { data, isLoading, refetch } = useDashboard();
  // ...
}
```
