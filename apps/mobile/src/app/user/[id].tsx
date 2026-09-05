import { LANGUAGES, LOOKING_FOR, sharedInterestsLabel } from '@wmc/shared';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';

import { ConnectButton } from '@/components/ConnectButton';
import { DetailHeader } from '@/components/DetailHeader';
import { Avatar, Badge, Card, Chip, EmptyState, Loading, Screen, SectionHeader, Text, useToast } from '@/components/ui';
import { useAuth, useUserId } from '@/lib/auth';
import { confirm, showMenu } from '@/lib/menu';
import { useBlockUser, useConnectionWith, useMyInterests, useUserInterests, useUserProfile } from '@/lib/queries';
import { errorMessage } from '@/lib/supabase';
import { theme } from '@/theme';

export default function UserProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const toast = useToast();
  const me = useUserId();
  const { profile: myProfile } = useAuth();
  const user = useUserProfile(id);
  const interests = useUserInterests(id);
  const myInterests = useMyInterests();
  const connection = useConnectionWith(id);
  const block = useBlockUser();

  const isSelf = id === me;
  useEffect(() => {
    if (isSelf) router.replace('/(tabs)/profile');
  }, [isSelf, router]);
  if (isSelf) return null;

  const openMenu = () =>
    showMenu(user.data?.first_name ?? 'User', [
      { label: 'Report', destructive: true, onPress: () => router.push({ pathname: '/report', params: { targetType: 'user', targetId: id } }) },
      {
        label: 'Block',
        destructive: true,
        onPress: () =>
          confirm('Block user', "They won't be able to see your profile or message you.", 'Block', () =>
            block.mutate(id, {
              onError: (e) => toast.error(errorMessage(e)),
              onSuccess: () => {
                toast.show('User blocked');
                router.back();
              },
            }),
          ),
      },
    ]);

  if (user.isLoading) {
    return (
      <Screen scroll={false}>
        <DetailHeader />
        <Loading />
      </Screen>
    );
  }
  if (!user.data) {
    return (
      <Screen scroll={false}>
        <DetailHeader />
        <EmptyState emoji="🫥" title="Profile unavailable" message="This person may have left or blocked you." />
      </Screen>
    );
  }

  const u = user.data;
  const mySlugs = new Set((myInterests.data ?? []).map((i) => i.slug));
  const shared = (interests.data ?? []).filter((i) => mySlugs.has(i.slug)).map((i) => i.name);
  const sharedLanguages = u.languages.filter((l) => myProfile?.languages.includes(l));
  const status = connection.data?.status ?? null;
  const direction = connection.data ? (connection.data.requester_id === me ? 'sent' : 'received') : null;

  return (
    <Screen padded={false}>
      <DetailHeader onMenu={openMenu} />
      <View style={styles.body}>
        <View style={styles.identity}>
          <Avatar uri={u.photo_url} name={u.first_name} size={104} />
          <Text variant="h1" style={styles.name}>
            {u.first_name}
            {u.age ? `, ${u.age}` : ''}
          </Text>
          <View style={styles.metaRow}>
            {u.city_name ? <Text tone="secondary">📍 {u.city_name}</Text> : null}
            {u.profession ? <Text tone="secondary">💼 {u.profession}</Text> : null}
          </View>
          {shared.length > 0 ? <Badge label={`${shared.length} shared`} style={styles.badge} /> : null}
        </View>

        <View style={styles.action}>
          <ConnectButton userId={id} status={status} direction={direction} size="md" fullWidth />
        </View>

        {u.bio ? (
          <Card style={styles.bio}>
            <Text>{u.bio}</Text>
          </Card>
        ) : null}

        <SectionHeader title="Interests" />
        <Text variant="small" tone="primary" style={styles.sharedLabel}>
          {sharedInterestsLabel(shared)}
        </Text>
        <View style={styles.chips}>
          {(interests.data ?? []).map((i) => (
            <Chip key={i.id} label={i.name} emoji={i.emoji ?? undefined} size="sm" selected={mySlugs.has(i.slug)} />
          ))}
          {interests.data?.length === 0 ? <Text tone="muted">No interests yet.</Text> : null}
        </View>

        {u.languages.length > 0 ? (
          <>
            <SectionHeader title="Languages" />
            <View style={styles.chips}>
              {u.languages.map((code) => (
                <Chip key={code} label={LANGUAGES.find((l) => l.code === code)?.name ?? code} size="sm" selected={sharedLanguages.includes(code)} />
              ))}
            </View>
          </>
        ) : null}

        {u.looking_for.length > 0 ? (
          <>
            <SectionHeader title="Looking for" />
            <View style={styles.chips}>
              {u.looking_for.map((slug) => {
                const item = LOOKING_FOR.find((l) => l.slug === slug);
                return <Chip key={slug} label={item?.name ?? slug} emoji={item?.emoji} size="sm" selected={myProfile?.looking_for.includes(slug)} />;
              })}
            </View>
          </>
        ) : null}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: theme.spacing.lg },
  identity: { alignItems: 'center', gap: 6, marginTop: 8 },
  name: { marginTop: 8 },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'center' },
  badge: { marginTop: 4 },
  action: { marginTop: 20 },
  bio: { marginTop: 20 },
  sharedLabel: { fontWeight: '600', marginBottom: 10 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
});
