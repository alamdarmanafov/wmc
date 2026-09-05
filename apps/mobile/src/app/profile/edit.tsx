import { INTERESTS, LIMITS, LOOKING_FOR } from '@wmc/shared';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { DetailHeader } from '@/components/DetailHeader';
import { ProfileForm, validateProfile, type ProfileFormValues } from '@/components/ProfileForm';
import { Button, Chip, Screen, Text, useToast } from '@/components/ui';
import { useAuth, useUserId } from '@/lib/auth';
import { useInterests, useMyInterests, useSaveInterests, useUpdateProfile } from '@/lib/queries';
import { uploadImage } from '@/lib/storage';
import { errorMessage } from '@/lib/supabase';
import { theme } from '@/theme';

export default function EditProfileScreen() {
  const router = useRouter();
  const toast = useToast();
  const userId = useUserId();
  const { profile } = useAuth();
  const interests = useInterests();
  const myInterests = useMyInterests();
  const updateProfile = useUpdateProfile();
  const saveInterests = useSaveInterests();
  const [saving, setSaving] = useState(false);
  const [values, setValues] = useState<ProfileFormValues>({
    photoUri: profile?.photo_url ?? null,
    firstName: profile?.first_name ?? '',
    age: profile?.age ? String(profile.age) : '',
    bio: profile?.bio ?? '',
    languages: profile?.languages ?? [],
    profession: profile?.profession ?? '',
    gender: profile?.gender ?? null,
  });
  const [lookingFor, setLookingFor] = useState<string[]>(profile?.looking_for ?? []);
  const [selectedInterests, setSelectedInterests] = useState<string[] | null>(null);

  useEffect(() => {
    if (myInterests.data && selectedInterests === null) setSelectedInterests(myInterests.data.map((i) => i.slug));
  }, [myInterests.data, selectedInterests]);

  const interestSlugs = selectedInterests ?? [];
  const toggleInterest = (slug: string) => {
    if (interestSlugs.includes(slug)) setSelectedInterests(interestSlugs.filter((s) => s !== slug));
    else if (interestSlugs.length >= LIMITS.maxInterests) toast.show(`Pick up to ${LIMITS.maxInterests} interests`);
    else setSelectedInterests([...interestSlugs, slug]);
  };
  const toggleLookingFor = (slug: string) => setLookingFor(lookingFor.includes(slug) ? lookingFor.filter((s) => s !== slug) : [...lookingFor, slug]);

  const save = async () => {
    const problem = validateProfile(values);
    if (problem) {
      toast.error(problem);
      return;
    }
    if (interestSlugs.length < LIMITS.minInterests) {
      toast.error(`Pick at least ${LIMITS.minInterests} interests`);
      return;
    }
    setSaving(true);
    try {
      let photo_url = profile?.photo_url ?? null;
      if (values.photoUri && values.photoUri !== profile?.photo_url) {
        photo_url = await uploadImage('avatars', `${userId}/avatar.jpg`, values.photoUri);
      }
      await updateProfile.mutateAsync({
        first_name: values.firstName.trim(),
        age: Number(values.age),
        bio: values.bio.trim() || null,
        languages: values.languages,
        profession: values.profession.trim() || null,
        gender: values.gender,
        photo_url,
        looking_for: lookingFor,
      });
      const ids = interestSlugs.map((slug) => interests.data?.find((r) => r.slug === slug)?.id).filter((id): id is number => id != null);
      await saveInterests.mutateAsync(ids);
      toast.success('Profile updated');
      router.back();
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen keyboard padded={false}>
      <DetailHeader title="Edit profile" />
      <View style={styles.body}>
        <ProfileForm values={values} onChange={setValues} />
        <View>
          <Text variant="label" tone="secondary" style={styles.label}>
            Interests ({interestSlugs.length} / {LIMITS.maxInterests})
          </Text>
          <View style={styles.chips}>
            {INTERESTS.map((i) => (
              <Chip key={i.slug} label={i.name} emoji={i.emoji} size="sm" selected={interestSlugs.includes(i.slug)} onPress={() => toggleInterest(i.slug)} />
            ))}
          </View>
        </View>
        <View>
          <Text variant="label" tone="secondary" style={styles.label}>
            Looking for
          </Text>
          <View style={styles.chips}>
            {LOOKING_FOR.map((l) => (
              <Chip key={l.slug} label={l.name} emoji={l.emoji} size="sm" selected={lookingFor.includes(l.slug)} onPress={() => toggleLookingFor(l.slug)} />
            ))}
          </View>
        </View>
        <Button title="Save changes" fullWidth loading={saving} onPress={save} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: theme.spacing.lg, paddingTop: 8, gap: 18 },
  label: { marginLeft: 4, marginBottom: 8 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
});
