import { COMMUNITY_CATEGORIES, slugify } from '@wmc/shared';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { DetailHeader } from '@/components/DetailHeader';
import { ImagePickerField } from '@/components/ImagePickerField';
import { Button, Card, Chip, Input, Screen, Text, useToast } from '@/components/ui';
import { useAuth, useUserId } from '@/lib/auth';
import { useCreateCommunity } from '@/lib/queries';
import { uploadImage } from '@/lib/storage';
import { errorMessage } from '@/lib/supabase';
import { theme } from '@/theme';

export default function CreateCommunityScreen() {
  const router = useRouter();
  const toast = useToast();
  const userId = useUserId();
  const { profile } = useAuth();
  const create = useCreateCommunity();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<string>('general');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const valid = name.trim().length >= 2 && name.trim().length <= 80;

  const submit = async () => {
    setSaving(true);
    try {
      const slug = `${slugify(name)}-${Math.random().toString(36).slice(2, 7)}`;
      const image_url = imageUri ? await uploadImage('community', `${userId}/${slug}.jpg`, imageUri) : null;
      const id = await create.mutateAsync({
        name: name.trim(),
        slug,
        description: description.trim() || null,
        category,
        image_url,
        city_id: profile?.city_id ?? null,
      });
      toast.success('Submitted for approval');
      router.replace({ pathname: '/community/[id]', params: { id } });
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen keyboard padded={false}>
      <DetailHeader title="Create community" />
      <View style={styles.body}>
        <ImagePickerField uri={imageUri} onChange={setImageUri} label="Add a cover image" />
        <Input label="Name" placeholder="Berlin Muslim Runners" value={name} onChangeText={(t) => setName(t.slice(0, 80))} />
        <Input label="Description" placeholder="What is this community about? Who is it for?" value={description} onChangeText={(t) => setDescription(t.slice(0, 1000))} multiline />
        <View>
          <Text variant="label" tone="secondary" style={styles.label}>
            Category
          </Text>
          <View style={styles.chips}>
            {COMMUNITY_CATEGORIES.map((c) => (
              <Chip key={c.slug} label={c.name} emoji={c.emoji} size="sm" selected={category === c.slug} onPress={() => setCategory(c.slug)} />
            ))}
          </View>
        </View>
        <Card tone="accent">
          <Text variant="small" tone="secondary">
            ⏳ New communities are reviewed by our team before they appear publicly. You&apos;ll see it as &quot;Pending approval&quot; until then.
          </Text>
        </Card>
        <Button title="Submit for approval" fullWidth disabled={!valid} loading={saving} onPress={submit} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: theme.spacing.lg, paddingTop: 8, gap: 18 },
  label: { marginLeft: 4, marginBottom: 8 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
});
