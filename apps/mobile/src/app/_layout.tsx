import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef } from 'react';
import { AppState, Image, StyleSheet, Text, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ToastProvider } from '@/components/ui';
import { AuthProvider, useAuth } from '@/lib/auth';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import { theme } from '@/theme';

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 30_000, retry: 1 } },
});

export default function RootLayout() {
  if (!isSupabaseConfigured) {
    return <SetupScreen />;
  }
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <ToastProvider>
              <StatusBar style="dark" />
              <RootNavigator />
            </ToastProvider>
          </AuthProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

/** Shown when EXPO_PUBLIC_SUPABASE_* are missing, so the app opens without a backend. */
function SetupScreen() {
  useEffect(() => {
    void SplashScreen.hideAsync();
  }, []);
  return (
    <View style={setupStyles.root}>
      <StatusBar style="dark" />
      <Image source={require('@/assets/images/logo.png')} style={setupStyles.logo} />
      <Text style={setupStyles.title}>WMC is not connected yet</Text>
      <Text style={setupStyles.body}>
        Copy <Text style={setupStyles.code}>apps/mobile/.env.example</Text> to{' '}
        <Text style={setupStyles.code}>.env</Text>, set{' '}
        <Text style={setupStyles.code}>EXPO_PUBLIC_SUPABASE_URL</Text> and{' '}
        <Text style={setupStyles.code}>EXPO_PUBLIC_SUPABASE_ANON_KEY</Text>, then restart Expo.
      </Text>
      <Text style={setupStyles.hint}>See supabase/README.md for creating the project.</Text>
    </View>
  );
}

const setupStyles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    backgroundColor: theme.colors.background,
  },
  logo: { width: 88, height: 88, marginBottom: 24 },
  title: { fontSize: 22, fontWeight: '700', color: theme.colors.text, marginBottom: 12, textAlign: 'center' },
  body: { fontSize: 15, lineHeight: 22, color: theme.colors.textSecondary, textAlign: 'center' },
  code: { fontFamily: 'monospace', color: theme.colors.text },
  hint: { marginTop: 16, fontSize: 13, color: theme.colors.textSecondary },
});

const TOUCH_INTERVAL_MS = 30 * 60 * 1000;

/** Heartbeat for retention analytics: once per session and again after 30 min in background. */
function useActivityHeartbeat(enabled: boolean) {
  const lastTouch = useRef(0);
  useEffect(() => {
    if (!enabled) return;
    const touch = () => {
      if (Date.now() - lastTouch.current < TOUCH_INTERVAL_MS) return;
      lastTouch.current = Date.now();
      // PostgrestBuilder is lazy — it only sends when awaited / then'd.
      void supabase.rpc('touch_activity').then(({ error }) => {
        if (error) console.warn('touch_activity failed', error.message);
      });
    };
    touch();
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') touch();
    });
    return () => sub.remove();
  }, [enabled]);
}

function RootNavigator() {
  const { session, profile, loading, profileReady } = useAuth();
  const signedIn = !!session;
  const onboarded = signedIn && !!profile?.onboarding_completed;
  const ready = !loading && (!signedIn || profileReady);

  useEffect(() => {
    if (ready) void SplashScreen.hideAsync();
  }, [ready]);

  useActivityHeartbeat(onboarded);

  if (!ready) return null;

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: theme.colors.background } }}>
      <Stack.Screen name="index" />
      <Stack.Protected guard={!signedIn}>
        <Stack.Screen name="(auth)" />
      </Stack.Protected>
      <Stack.Protected guard={signedIn && !onboarded}>
        <Stack.Screen name="(onboarding)" />
      </Stack.Protected>
      <Stack.Protected guard={onboarded}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="community/[id]" />
        <Stack.Screen name="community/create" />
        <Stack.Screen name="event/[id]" />
        <Stack.Screen name="event/create" />
        <Stack.Screen name="activity/[id]" />
        <Stack.Screen name="activity/create" />
        <Stack.Screen name="user/[id]" />
        <Stack.Screen name="chat/index" />
        <Stack.Screen name="chat/[id]" />
        <Stack.Screen name="notifications" />
        <Stack.Screen name="connections" />
        <Stack.Screen name="profile/edit" />
        <Stack.Screen name="settings/index" />
        <Stack.Screen name="settings/blocked" />
        <Stack.Screen name="report" options={{ presentation: 'modal' }} />
      </Stack.Protected>
    </Stack>
  );
}
