import { COMMUNITY_CATEGORIES, LIMITS } from '@wmc/shared';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { DetailHeader } from '@/components/DetailHeader';
import { ImagePickerField } from '@/components/ImagePickerField';
import { Button, Chip, Input, Screen, Text, useToast } from '@/components/ui';
import { useAuth, useUserId } from '@/lib/auth';
import { parseDateTime } from '@/lib/format';
import { useCreateEvent, useMyMemberships } from '@/lib/queries';
import { uploadImage } from '@/lib/storage';
import { errorMessage } from '@/lib/supabase';
import { theme } from '@/theme';

export default function CreateEventScreen() {
  const router = useRouter();
  const toast = useToast();
  const userId = useUserId();
  const { profile } = useAuth();
  const params = useLocalSearchParams<{ communityId?: string }>();
  const memberships = useMyMemberships();
  const create = useCreateEvent();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('social');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [locationName, setLocationName] = useState('');
  const [address, setAddress] = useState('');
  const [maxParticipants, setMaxParticipants] = useState('');
  const [communityId, setCommunityId] = useState<string | null>(params.communityId ?? null);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const startsAt = parseDateTime(date, time);
  const dateError = date.length === 10 && time.length === 5 && !startsAt ? 'Use YYYY-MM-DD and HH:mm' : startsAt && startsAt.getTime() < Date.now() ? 'Pick a time in the future' : null;
  const max = maxParticipants.trim() ? Number(maxParticipants) : null;
  const maxError = max != null && (!Number.isInteger(max) || max < 2 || max > 5000) ? 'Between 2 and 5000' : null;
  const valid = title.trim().length >= 3 && !!startsAt && !dateError && !maxError;

  const approvedCommunities = (memberships.data ?? []).filter((c) => c.status === 'approved');

  const submit = async () => {
    if (!startsAt) return;
    setSaving(true);
    try {
      const image_url = imageUri ? await uploadImage('events', `${userId}/${Date.now()}.jpg`, imageUri) : null;
      const id = await create.mutateAsync({
        title: title.trim(),
        description: description.trim() || null,
        category,
        starts_at: startsAt.toISOString(),
        location_name: locationName.trim() || null,
        location_address: address.trim() || null,
        max_participants: max,
        community_id: communityId,
        image_url,
        city_id: profile?.city_id ?? null,
      });
      toast.success('Event created');
      router.replace({ pathname: '/event/[id]', params: { id } });
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen keyboard padded={false}>
      <DetailHeader title="Create event" />
      <View style={styles.body}>
        <ImagePickerField uri={imageUri} onChange={setImageUri} label="Add a cover image (optional)" />
        <Input label="Title" placeholder="Friday football at the park" value={title} onChangeText={(t) => setTitle(t.slice(0, LIMITS.eventTitleMax))} />
        <Input label="Description" placeholder="What should people know?" value={description} onChangeText={(t) => setDescription(t.slice(0, 2000))} multiline />
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
            <Input label="Date" placeholder="YYYY-MM-DD" value={date} onChangeText={(t) => setDate(t.replace(/[^0-9-]/g, '').slice(0, 10))} keyboardType="numbers-and-punctuation" />
          </View>
          <View style={styles.flex}>
            <Input label="Time" placeholder="HH:mm" value={time} onChangeText={(t) => setTime(t.replace(/[^0-9:]/g, '').slice(0, 5))} keyboardType="numbers-and-punctuation" error={dateError} />
          </View>
        </View>
        <Input label="Location name" placeholder="Tempelhofer Feld" value={locationName} onChangeText={setLocationName} />
        <Input label="Address (optional)" placeholder="Street, city" value={address} onChangeText={setAddress} />
        <Input label="Max participants (optional)" placeholder="24" value={maxParticipants} onChangeText={(t) => setMaxParticipants(t.replace(/[^0-9]/g, ''))} keyboardType="number-pad" error={maxError} />
        {approvedCommunities.length > 0 ? (
          <View>
            <Text variant="label" tone="secondary" style={styles.label}>Host as community (optional)</Text>
            <View style={styles.chips}>
              <Chip label="Just me" size="sm" selected={communityId === null} onPress={() => setCommunityId(null)} />
              {approvedCommunities.map((c) => (
                <Chip key={c.id} label={c.name} size="sm" selected={communityId === c.id} onPress={() => setCommunityId(c.id)} />
              ))}
            </View>
          </View>
        ) : null}
        <Button title="Publish event" fullWidth disabled={!valid} loading={saving} onPress={submit} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: theme.spacing.lg, paddingTop: 8, gap: 18 },
  label: { marginLeft: 4, marginBottom: 8 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  row: { flexDirection: 'row', gap: 12 },
  flex: { flex: 1 },
});
