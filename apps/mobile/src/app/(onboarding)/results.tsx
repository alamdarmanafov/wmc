import { brand } from '@wmc/shared';
import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { OnboardingStep } from '@/components/OnboardingStep';
import { Card, Loading, Text, useToast } from '@/components/ui';
import { registerPushToken } from '@/lib/notifications';
import { useOnboardingSummary, useUpdateProfile } from '@/lib/queries';
import { errorMessage } from '@/lib/supabase';

export default function ResultsStep() {
  const router = useRouter();
  const toast = useToast();
  const summary = useOnboardingSummary();
  const updateProfile = useUpdateProfile();

  const finish = async () => {
    try {
      await updateProfile.mutateAsync({ onboarding_completed: true });
      void registerPushToken();
      router.replace('/(tabs)');
    } catch (e) {
      toast.error(errorMessage(e));
    }
  };

  const people = summary.data?.people_count ?? 0;
  const communities = summary.data?.community_count ?? 0;
  const events = summary.data?.event_count ?? 0;

  return (
    <OnboardingStep step={5} title="You're all set 🎉" cta="Let's go" onNext={finish} loading={updateProfile.isPending}>
      <Card tone="primary">
        {summary.isLoading ? (
          <Loading />
        ) : (
          <>
            <Text variant="h2" tone="inverse">
              We found {people} {people === 1 ? 'person' : 'people'} & {communities} {communities === 1 ? 'community' : 'communities'} for you.
            </Text>
            {events > 0 ? (
              <Text tone="inverse" style={styles.sub}>
                Plus {events} upcoming {events === 1 ? 'event' : 'events'} in your city.
              </Text>
            ) : null}
          </>
        )}
      </Card>
      <View style={styles.footer}>
        <Text tone="secondary" style={styles.center}>
          {brand.taglineEmotional} {brand.tagline}
        </Text>
      </View>
    </OnboardingStep>
  );
}

const styles = StyleSheet.create({
  sub: { marginTop: 10, opacity: 0.9 },
  footer: { marginTop: 24 },
  center: { textAlign: 'center' },
});
