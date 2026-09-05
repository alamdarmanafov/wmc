import { Ionicons } from '@expo/vector-icons';
import { brand } from '@wmc/shared';
import * as AppleAuthentication from 'expo-apple-authentication';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Button, Screen, Text, useToast } from '@/components/ui';
import { appleSignInAvailable, signInWithApple, signInWithGoogle } from '@/lib/oauth';
import { errorMessage } from '@/lib/supabase';
import { theme } from '@/theme';

type Provider = 'apple' | 'google' | null;

export default function WelcomeScreen() {
  const router = useRouter();
  const toast = useToast();
  const [busy, setBusy] = useState<Provider>(null);

  const run = async (provider: Exclude<Provider, null>, fn: () => Promise<unknown>) => {
    setBusy(provider);
    try {
      await fn();
    } catch (e) {
      // User dismissed the native sheet — not an error worth showing.
      if (e && typeof e === 'object' && 'code' in e && (e as { code?: string }).code === 'ERR_REQUEST_CANCELED') return;
      toast.error(errorMessage(e, 'Sign-in failed'));
    } finally {
      setBusy(null);
    }
  };

  return (
    <Screen scroll={false} edges={['top', 'bottom', 'left', 'right']}>
      <View style={styles.hero}>
        <Image source={require('@/assets/images/logo.png')} style={styles.logo} contentFit="contain" />
        <Text variant="display" style={styles.title}>
          Welcome 👋
        </Text>
        <Text tone="secondary" style={styles.subtitle}>
          Find your Muslim community wherever you are.
        </Text>
      </View>

      <View style={styles.actions}>
        {appleSignInAvailable ? (
          <AppleAuthentication.AppleAuthenticationButton
            buttonType={AppleAuthentication.AppleAuthenticationButtonType.CONTINUE}
            buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
            cornerRadius={theme.radius.pill}
            style={styles.appleButton}
            onPress={() => run('apple', signInWithApple)}
          />
        ) : null}
        <Button
          title="Continue with Google"
          variant="ghost"
          fullWidth
          loading={busy === 'google'}
          icon={<Ionicons name="logo-google" size={18} color={theme.colors.primary} />}
          onPress={() => run('google', signInWithGoogle)}
        />
        <Button
          title="Continue with Email"
          fullWidth
          icon={<Ionicons name="mail-outline" size={18} color={theme.colors.white} />}
          onPress={() => router.push('/(auth)/email')}
        />
        <Text variant="caption" tone="muted" style={styles.legal}>
          {brand.fullName} · By continuing you agree to be kind and respectful to others.
        </Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  logo: { width: 120, height: 120, borderRadius: 30, marginBottom: 12 },
  title: { textAlign: 'center' },
  subtitle: { textAlign: 'center', maxWidth: 280, fontSize: 17 },
  actions: { gap: 12, paddingBottom: 12 },
  appleButton: { width: '100%', height: 50 },
  legal: { textAlign: 'center', marginTop: 8 },
});
