import { LOOKING_FOR } from '@wmc/shared';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { OnboardingStep } from '@/components/OnboardingStep';
import { Text, useToast } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { useUpdateProfile } from '@/lib/queries';
import { errorMessage } from '@/lib/supabase';
import { theme } from '@/theme';

export default function LookingForStep() {
  const router = useRouter();
  const toast = useToast();
  const { profile } = useAuth();
  const updateProfile = useUpdateProfile();
  const [selected, setSelected] = useState<string[]>(profile?.looking_for ?? []);

  const toggle = (slug: string) =>
    setSelected(selected.includes(slug) ? selected.filter((s) => s !== slug) : [...selected, slug]);

  const next = async () => {
    try {
      await updateProfile.mutateAsync({ looking_for: selected });
      router.push('/(onboarding)/results');
    } catch (e) {
      toast.error(errorMessage(e));
    }
  };

  return (
    <OnboardingStep
      step={4}
      title="What are you looking for?"
      subtitle="Choose as many as you like."
      onNext={next}
      nextDisabled={selected.length === 0}
      loading={updateProfile.isPending}>
      <View style={styles.list}>
        {LOOKING_FOR.map((item) => {
          const active = selected.includes(item.slug);
          return (
            <Pressable key={item.slug} onPress={() => toggle(item.slug)} style={[styles.option, active && styles.optionActive]}>
              <Text style={styles.emoji}>{item.emoji}</Text>
              <Text variant="bodyStrong" style={active ? styles.textActive : undefined}>
                {item.name}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </OnboardingStep>
  );
}

const styles = StyleSheet.create({
  list: { gap: 10 },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 18,
    borderRadius: theme.radius.card,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  optionActive: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
  emoji: { fontSize: 24 },
  textActive: { color: theme.colors.white },
});
