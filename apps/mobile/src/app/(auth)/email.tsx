import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Button, Input, Screen, Text, useToast } from '@/components/ui';
import { errorMessage, supabase } from '@/lib/supabase';
import { theme } from '@/theme';

type Mode = 'signin' | 'signup';

export default function EmailAuthScreen() {
  const router = useRouter();
  const toast = useToast();
  const [mode, setMode] = useState<Mode>('signin');
  const [firstName, setFirstName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  const valid = email.includes('@') && password.length >= 6 && (mode === 'signin' || firstName.trim().length > 0);

  const submit = async () => {
    setBusy(true);
    try {
      if (mode === 'signup') {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: { data: { first_name: firstName.trim() } },
        });
        if (error) throw error;
        if (!data.session) toast.show('Check your inbox to confirm your email, then sign in.');
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (error) throw error;
      }
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen keyboard edges={['top', 'bottom', 'left', 'right']}>
      <Pressable onPress={() => router.back()} hitSlop={12} style={styles.back}>
        <Ionicons name="chevron-back" size={26} color={theme.colors.text} />
      </Pressable>

      <Text variant="h1" style={styles.title}>
        {mode === 'signin' ? 'Welcome back' : 'Create your account'}
      </Text>
      <Text tone="secondary" style={styles.subtitle}>
        {mode === 'signin' ? 'Sign in with your email and password.' : 'Just a few details to get started.'}
      </Text>

      <View style={styles.form}>
        {mode === 'signup' ? (
          <Input label="First name" placeholder="Ahmed" value={firstName} onChangeText={setFirstName} autoCapitalize="words" />
        ) : null}
        <Input
          label="Email"
          placeholder="you@example.com"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          autoComplete="email"
        />
        <Input
          label="Password"
          placeholder="At least 6 characters"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoComplete={mode === 'signup' ? 'new-password' : 'password'}
        />
        <Button
          title={mode === 'signin' ? 'Sign in' : 'Create account'}
          fullWidth
          loading={busy}
          disabled={!valid}
          onPress={submit}
          style={styles.submit}
        />
      </View>

      <Pressable onPress={() => setMode(mode === 'signin' ? 'signup' : 'signin')} style={styles.toggle}>
        <Text tone="secondary">
          {mode === 'signin' ? "Don't have an account? " : 'Already have an account? '}
          <Text tone="primary" variant="bodyStrong">
            {mode === 'signin' ? 'Sign up' : 'Sign in'}
          </Text>
        </Text>
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  back: { width: 40, height: 40, justifyContent: 'center', marginLeft: -8, marginTop: 8 },
  title: { marginTop: 16 },
  subtitle: { marginTop: 6 },
  form: { gap: 16, marginTop: 28 },
  submit: { marginTop: 8 },
  toggle: { alignItems: 'center', marginTop: 24 },
});
