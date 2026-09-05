import { useRouter } from 'expo-router';
import { useState } from 'react';

import { OnboardingStep } from '@/components/OnboardingStep';
import { ProfileForm, validateProfile, type ProfileFormValues } from '@/components/ProfileForm';
import { useToast } from '@/components/ui';
import { useAuth, useUserId } from '@/lib/auth';
import { useUpdateProfile } from '@/lib/queries';
import { uploadImage } from '@/lib/storage';
import { errorMessage } from '@/lib/supabase';

export default function ProfileStep() {
  const router = useRouter();
  const toast = useToast();
  const userId = useUserId();
  const { profile } = useAuth();
  const updateProfile = useUpdateProfile();
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

  const next = async () => {
    const problem = validateProfile(values);
    if (problem) {
      toast.error(problem);
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
      });
      router.push('/(onboarding)/interests');
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <OnboardingStep step={2} title="About you" subtitle="This is what others will see on your profile." onNext={next} loading={saving}>
      <ProfileForm values={values} onChange={setValues} />
    </OnboardingStep>
  );
}
