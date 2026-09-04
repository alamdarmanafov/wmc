import { StyleSheet, View } from 'react-native';

import { DetailHeader } from '@/components/DetailHeader';
import { Avatar, Button, Card, CardSkeleton, EmptyState, Screen, Text, useToast } from '@/components/ui';
import { timeAgo } from '@/lib/format';
import { useBlockedUsers, useUnblockUser } from '@/lib/queries';
import { errorMessage } from '@/lib/supabase';
import { theme } from '@/theme';

export default function BlockedUsersScreen() {
  const toast = useToast();
  const blocked = useBlockedUsers();
  const unblock = useUnblockUser();

  return (
    <Screen padded={false} refreshing={blocked.isRefetching} onRefresh={() => void blocked.refetch()}>
      <DetailHeader title="Blocked users" />
      <View style={styles.body}>
        {blocked.isLoading ? <CardSkeleton count={2} /> : null}
        {blocked.data?.map((u) => (
          <Card key={u.id}>
            <View style={styles.row}>
              <Avatar uri={u.photo_url} name={u.first_name} size={44} />
              <View style={styles.flex}>
                <Text variant="bodyStrong">{u.first_name}</Text>
                <Text variant="caption" tone="muted">
                  Blocked {timeAgo(u.blocked_at)}
                </Text>
              </View>
              <Button title="Unblock" variant="ghost" size="sm" loading={unblock.isPending && unblock.variables === u.id} onPress={() => unblock.mutate(u.id, { onError: (e) => toast.error(errorMessage(e)) })} />
            </View>
          </Card>
        ))}
        {blocked.data?.length === 0 ? <EmptyState emoji="🕊️" title="No blocked users" message="People you block will appear here." /> : null}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: theme.spacing.lg, gap: 10 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  flex: { flex: 1 },
});
