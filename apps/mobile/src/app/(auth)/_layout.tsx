import { Stack } from 'expo-router';

import { theme } from '@/theme';

export default function AuthLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: theme.colors.background } }}>
      <Stack.Screen name="welcome" />
      <Stack.Screen name="email" options={{ presentation: 'card' }} />
    </Stack>
  );
}
