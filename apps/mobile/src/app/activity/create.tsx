import { COMMUNITY_CATEGORIES, LIMITS } from '@wmc/shared';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

import { DetailHeader } from '@/components/DetailHeader';
import { Button, Chip, Input, Screen, Text, useToast } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { parseTimeToday } from '@/lib/format';
import { useCreateActivity } from '@/lib/queries';
import { errorMessage } from '@/lib/supabase';
import { theme } from '@/theme';

export default function CreateActivityScreen() {
  const router = useRouter();
  const toast = useToast();
  const { profile } = useAuth();
  const params = useLocalSearchParams<{ category?: string; label?: string }>();
  const create = useCreateActivity();

  const [text, setText] = useState(params.label ? `Anyone wants to ${params.label.toLowerCase()} today?` : '');
  const [category, setCategory] = useState(params.category ?? 'social');
  const [time, setTime] = useState('');
  const [place, setPlace] = useState('');
  const [maxPeople, setMaxPeople] = useState('');

  const happensAt = time.trim() ? parseTimeToday(time) : null;
  const timeError = time.length === 5 && !happensAt ? 'Use HH:mm' : null;
  const max = maxPeople.trim() ? Number(maxPeople) : null;
  const maxError = max != null && (!Number.isInteger(max) || max < 2 || max > 200) ? 'Between 2 and 200' : null;
  const valid = text.trim().length >= 3 && !timeError && !maxError;

  const submit = () =>
    create.mutate(
      {
        text: text.trim(),
        category,
        happens_at: happensAt ? happensAt.toISOString() : null,
        location_name: place.trim() || null,
        max_participants: max,
        city_id: profile?.city_id ?? null,
      },
      {
        onError: (e) => toast.error(errorMessage(e)),
        onSuccess: (id) => {
          toast.success('Posted! Valid for 24 hours.');
          router.replace({ pathname: '/activity/[id]', params: { id } });
        },
      },
    );

  return (
    <Screen keyboard padded={false}>
      <DetailHeader title="Join me" />
      <View style={styles.body}>
        <Text tone="secondary">Post something spontaneous. People nearby can join for the next 24 hours.</Text>
        <View style={styles.bigInputWrap}>
          <TextInput
            value={text}
            onChangeText={(t) => setText(t.slice(0, LIMITS.activityTextMax))}
            placeholder="Anyone wants to play football tonight?"
            placeholderTextColor={theme.colors.textMuted}
            multiline
            autoFocus
            style={styles.bigInput}
          />
          <Text variant="caption" tone="muted" style={styles.counter}>
            {text.length} / {LIMITS.activityTextMax}
          </Text>
        </View>
        <View>
          <Text variant="label" tone="secondary" style={styles.label}>Category</Text>
          <View style={styles.chips}>
            {COMMUNITY_CATEGORIES.map((c) => (
              <Chip key={c.slug} label={c.name} emoji={c.emoji} size="sm" selected={category === c.slug} onPress={() => setCategory(c.slug)} />
            ))}
          </View>
        </View>
        <View style={styles.row}>
          <View style={styles.flex}>
            <Input label="Time today (optional)" placeholder="19:30" value={time} onChangeText={(t) => setTime(t.replace(/[^0-9:]/g, '').slice(0, 5))} keyboardType="numbers-and-punctuation" error={timeError} />
          </View>
          <View style={styles.flex}>
            <Input label="Max people (optional)" placeholder="6" value={maxPeople} onChangeText={(t) => setMaxPeople(t.replace(/[^0-9]/g, ''))} keyboardType="number-pad" error={maxError} />
          </View>
        </View>
        <Input label="Place (optional)" placeholder="Görlitzer Park" value={place} onChangeText={setPlace} />
        <Button title="Post" fullWidth disabled={!valid} loading={create.isPending} onPress={submit} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: theme.spacing.lg, paddingTop: 8, gap: 18 },
  bigInputWrap: { backgroundColor: theme.colors.surface, borderRadius: theme.radius.card, borderWidth: 1, borderColor: theme.colors.border, padding: 16 },
  bigInput: { fontSize: 22, fontWeight: '600', lineHeight: 30, minHeight: 100, textAlignVertical: 'top', color: theme.colors.text },
  counter: { textAlign: 'right', marginTop: 8 },
  label: { marginLeft: 4, marginBottom: 8 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  row: { flexDirection: 'row', gap: 12 },
  flex: { flex: 1 },
});
