import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { DetailHeader } from '@/components/DetailHeader';
import { Avatar, Button, Card, CardSkeleton, EmptyState, Screen, SectionHeader, Text, useToast } from '@/components/ui';
import { confirm } from '@/lib/menu';
import { useConnections, useDirectConversation, useRemoveConnection, useRespondConnection, type PersonPreview } from '@/lib/queries';
import { errorMessage } from '@/lib/supabase';
import { theme } from '@/theme';

export default function ConnectionsScreen() {
  const router = useRouter();
  const toast = useToast();
  const connections = useConnections();
  const respond = useRespondConnection();
  const remove = useRemoveConnection();
  const openChat = useDirectConversation();
  const fail = (e: unknown) => toast.error(errorMessage(e));

  const openProfile = (p: PersonPreview) => router.push({ pathname: '/user/[id]', params: { id: p.id } });

  return (
    <Screen padded={false} refreshing={connections.isRefetching} onRefresh={() => void connections.refetch()}>
      <DetailHeader title="Connections" />
      <View style={styles.body}>
        {connections.isLoading ? <CardSkeleton count={3} /> : null}

        {connections.data && connections.data.received.length > 0 ? (
          <>
            <SectionHeader title={`Requests (${connections.data.received.length})`} />
            <View style={styles.list}>
              {connections.data.received.map((c) => (
                <Card key={c.id}>
                  <View style={styles.row}>
                    <Pressable onPress={() => openProfile(c.requester)}>
                      <Avatar uri={c.requester.photo_url} name={c.requester.first_name} size={48} />
                    </Pressable>
                    <View style={styles.flex}>
                      <Text variant="bodyStrong">{c.requester.first_name}</Text>
                      <Text variant="small" tone="secondary">
                        wants to connect
                      </Text>
                    </View>
                  </View>
                  <View style={styles.actions}>
                    <Button title="Decline" variant="ghost" size="sm" style={styles.flex} loading={respond.isPending && respond.variables?.connectionId === c.id && !respond.variables.accept} onPress={() => respond.mutate({ connectionId: c.id, accept: false }, { onError: fail })} />
                    <Button title="Accept" size="sm" style={styles.flex} loading={respond.isPending && respond.variables?.connectionId === c.id && respond.variables.accept} onPress={() => respond.mutate({ connectionId: c.id, accept: true }, { onError: fail, onSuccess: () => toast.success(`You and ${c.requester.first_name} are connected`) })} />
                  </View>
                </Card>
              ))}
            </View>
          </>
        ) : null}

        {connections.data && connections.data.sent.length > 0 ? (
          <>
            <SectionHeader title="Sent" />
            <View style={styles.list}>
              {connections.data.sent.map((c) => (
                <Card key={c.id}>
                  <View style={styles.row}>
                    <Pressable onPress={() => openProfile(c.addressee)}>
                      <Avatar uri={c.addressee.photo_url} name={c.addressee.first_name} size={48} />
                    </Pressable>
                    <View style={styles.flex}>
                      <Text variant="bodyStrong">{c.addressee.first_name}</Text>
                      <Text variant="small" tone="muted">
                        Pending
                      </Text>
                    </View>
                    <Button title="Withdraw" variant="ghost" size="sm" onPress={() => remove.mutate(c.id, { onError: fail })} />
                  </View>
                </Card>
              ))}
            </View>
          </>
        ) : null}

        <SectionHeader title={`Connected${connections.data ? ` (${connections.data.accepted.length})` : ''}`} />
        <View style={styles.list}>
          {connections.data?.accepted.map((c) => (
            <Card key={c.id}>
              <View style={styles.row}>
                <Pressable onPress={() => openProfile(c.other)}>
                  <Avatar uri={c.other.photo_url} name={c.other.first_name} size={48} />
                </Pressable>
                <Pressable style={styles.flex} onPress={() => openProfile(c.other)}>
                  <Text variant="bodyStrong">{c.other.first_name}</Text>
                </Pressable>
                <Button title="Message" size="sm" onPress={() => openChat.mutate(c.other.id, { onError: fail, onSuccess: (id) => router.push({ pathname: '/chat/[id]', params: { id, title: c.other.first_name } }) })} />
                <Pressable hitSlop={8} onPress={() => confirm('Remove connection', `Remove ${c.other.first_name} from your connections?`, 'Remove', () => remove.mutate(c.id, { onError: fail }))}>
                  <Text variant="caption" tone="muted">
                    Remove
                  </Text>
                </Pressable>
              </View>
            </Card>
          ))}
          {connections.data?.accepted.length === 0 ? (
            <EmptyState emoji="🤝" title="No connections yet" message="Find people who share your interests." actionLabel="Meet people" onAction={() => router.push('/(tabs)/discover')} />
          ) : null}
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: theme.spacing.lg },
  list: { gap: 10 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  flex: { flex: 1 },
  actions: { flexDirection: 'row', gap: 10, marginTop: 14 },
});
