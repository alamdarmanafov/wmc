import { Ionicons } from '@expo/vector-icons';
import { COMMUNITY_CATEGORIES } from '@wmc/shared';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { FlatList, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { CommunityCard } from '@/components/cards/CommunityCard';
import { CardSkeleton, Chip, EmptyState, Input, Screen, Text, useToast } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { useCommunities, useJoinCommunity, useMyMemberships } from '@/lib/queries';
import { errorMessage } from '@/lib/supabase';
import { theme } from '@/theme';

export default function CommunitiesScreen() {
  const router = useRouter();
  const toast = useToast();
  const { profile } = useAuth();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<string | null>(null);
  const communities = useCommunities(profile?.city_id ?? null, search, category);
  const memberships = useMyMemberships();
  const join = useJoinCommunity();
  const joinedIds = new Set((memberships.data ?? []).map((m) => m.id));

  return (
    <Screen scroll={false} padded={false}>
      <View style={styles.header}>
        <View style={styles.flex}>
          <Text variant="h1">Communities</Text>
          <Text variant="small" tone="secondary">
            Groups in your city, run by people like you.
          </Text>
        </View>
        <Pressable onPress={() => router.push('/community/create')} style={styles.add} hitSlop={6}>
          <Ionicons name="add" size={26} color={theme.colors.white} />
        </Pressable>
      </View>
      <View style={styles.search}>
        <Input placeholder="Search communities" value={search} onChangeText={setSearch} autoCorrect={false} />
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips} style={styles.chipsWrap}>
        <Chip label="All" size="sm" selected={category === null} onPress={() => setCategory(null)} />
        {COMMUNITY_CATEGORIES.map((c) => (
          <Chip key={c.slug} label={c.name} emoji={c.emoji} size="sm" selected={category === c.slug} onPress={() => setCategory(category === c.slug ? null : c.slug)} />
        ))}
      </ScrollView>

      <FlatList
        data={communities.data ?? []}
        keyExtractor={(c) => c.id}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={styles.gap} />}
        refreshing={communities.isRefetching}
        onRefresh={() => communities.refetch()}
        renderItem={({ item }) => (
          <CommunityCard
            community={item}
            joined={joinedIds.has(item.id)}
            joining={join.isPending && join.variables === item.id}
            onJoin={() => join.mutate(item.id, { onError: (e) => toast.error(errorMessage(e)), onSuccess: () => toast.success(`Welcome to ${item.name}`) })}
          />
        )}
        ListEmptyComponent={
          communities.isLoading ? (
            <CardSkeleton count={4} />
          ) : (
            <EmptyState emoji="🌍" title="No communities found" message="Start the first one in your city." actionLabel="Create community" onAction={() => router.push('/community/create')} />
          )
        }
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: theme.spacing.lg, paddingTop: 8 },
  flex: { flex: 1 },
  add: { width: 44, height: 44, borderRadius: 22, backgroundColor: theme.colors.primary, alignItems: 'center', justifyContent: 'center' },
  search: { paddingHorizontal: theme.spacing.lg, marginTop: 14 },
  chipsWrap: { flexGrow: 0, marginTop: 12, marginBottom: 12 },
  chips: { paddingHorizontal: theme.spacing.lg, gap: 8 },
  list: { paddingHorizontal: theme.spacing.lg, paddingBottom: 32, flexGrow: 1 },
  gap: { height: 12 },
});
