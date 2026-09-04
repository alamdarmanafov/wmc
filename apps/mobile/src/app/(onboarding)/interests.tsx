import { INTERESTS, LIMITS } from '@wmc/shared';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { OnboardingStep } from '@/components/OnboardingStep';
import { Chip, Text, useToast } from '@/components/ui';
import { useInterests, useMyInterests, useSaveInterests } from '@/lib/queries';
import { errorMessage } from '@/lib/supabase';

export default function InterestsStep() {
  const router = useRouter();
  const toast = useToast();
  const interests = useInterests();
  const mine = useMyInterests();
  const save = useSaveInterests();
  const [selected, setSelected] = useState<string[]>([]);

  useEffect(() => {
    if (mine.data && selected.length === 0) setSelected(mine.data.map((i) => i.slug));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mine.data]);

  const toggle = (slug: string) => {
    if (selected.includes(slug)) {
      setSelected(selected.filter((s) => s !== slug));
    } else if (selected.length >= LIMITS.maxInterests) {
      toast.show(`Pick up to ${LIMITS.maxInterests} interests`);
    } else {
      setSelected([...selected, slug]);
    }
  };

  const next = async () => {
    // Map slugs → DB ids (falls back to the shared constants order if the table isn't seeded yet).
    const rows = interests.data ?? [];
    const ids = selected.map((slug) => rows.find((r) => r.slug === slug)?.id).filter((id): id is number => id != null);
    if (ids.length < LIMITS.minInterests) {
      toast.error('Interests are not available yet. Please try again later.');
      return;
    }
    try {
      await save.mutateAsync(ids);
      router.push('/(onboarding)/looking-for');
    } catch (e) {
      toast.error(errorMessage(e));
    }
  };

  return (
    <OnboardingStep
      step={3}
      title="What are you into?"
      subtitle={`Pick ${LIMITS.minInterests} to ${LIMITS.maxInterests}. We use these to find people like you.`}
      onNext={next}
      nextDisabled={selected.length < LIMITS.minInterests}
      loading={save.isPending}>
      <View style={styles.chips}>
        {INTERESTS.map((i) => (
          <Chip key={i.slug} label={i.name} emoji={i.emoji} selected={selected.includes(i.slug)} onPress={() => toggle(i.slug)} />
        ))}
      </View>
      <Text variant="small" tone="muted" style={styles.count}>
        {selected.length} selected
      </Text>
    </OnboardingStep>
  );
}

const styles = StyleSheet.create({
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  count: { marginTop: 16 },
});
