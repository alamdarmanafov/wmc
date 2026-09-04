import { Ionicons } from '@expo/vector-icons';
import { LIMITS } from '@wmc/shared';
import { useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FlatList, KeyboardAvoidingView, Platform, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { DetailHeader } from '@/components/DetailHeader';
import { Avatar, Loading, Screen, Text, useToast } from '@/components/ui';
import { useUserId } from '@/lib/auth';
import type { MessageRow } from '@/lib/database.types';
import { formatTime } from '@/lib/format';
import { showMenu } from '@/lib/menu';
import { keys, markConversationRead, useConversationParticipants, useMessages, useSendMessage } from '@/lib/queries';
import { errorMessage, supabase } from '@/lib/supabase';
import { theme } from '@/theme';

export default function ChatScreen() {
  const { id, title } = useLocalSearchParams<{ id: string; title?: string }>();
  const router = useRouter();
  const toast = useToast();
  const me = useUserId();
  const qc = useQueryClient();
  const messages = useMessages(id);
  const participants = useConversationParticipants(id);
  const send = useSendMessage(id);
  const [draft, setDraft] = useState('');
  const listRef = useRef<FlatList<MessageRow>>(null);

  const people = useMemo(() => new Map((participants.data ?? []).map((p) => [p.id, p])), [participants.data]);
  const other = (participants.data ?? []).find((p) => p.id !== me);
  const headerTitle = title || other?.first_name || 'Chat';
  const isGroup = (participants.data?.length ?? 0) > 2;

  const markRead = useCallback(() => {
    void markConversationRead(id).then(() => qc.invalidateQueries({ queryKey: keys.conversations }));
  }, [id, qc]);

  useEffect(() => {
    markRead();
    const channel = supabase
      .channel(`messages:${id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${id}` }, (payload) => {
        const message = payload.new as MessageRow;
        qc.setQueryData<MessageRow[]>(keys.messages(id), (prev) => {
          if (!prev) return [message];
          return prev.some((m) => m.id === message.id) ? prev : [...prev, message];
        });
        if (message.sender_id !== me) markRead();
      })
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [id, me, qc, markRead]);

  const submit = () => {
    const content = draft.trim();
    if (!content) return;
    setDraft('');
    send.mutate(content, {
      onError: (e) => {
        setDraft(content);
        toast.error(errorMessage(e));
      },
    });
  };

  const onLongPress = (message: MessageRow) => {
    if (message.sender_id === me) return;
    showMenu('Message', [
      { label: 'Report message', destructive: true, onPress: () => router.push({ pathname: '/report', params: { targetType: 'message', targetId: message.id } }) },
      ...(other && !isGroup ? [{ label: `View ${other.first_name}'s profile`, onPress: () => router.push({ pathname: '/user/[id]', params: { id: other.id } }) }] : []),
    ]);
  };

  return (
    <Screen scroll={false} padded={false} edges={['top', 'left', 'right', 'bottom']}>
      <DetailHeader
        title={headerTitle}
        right={
          !isGroup && other ? (
            <Pressable onPress={() => router.push({ pathname: '/user/[id]', params: { id: other.id } })} hitSlop={8} style={styles.headerAvatar}>
              <Avatar uri={other.photo_url} name={other.first_name} size={34} />
            </Pressable>
          ) : undefined
        }
      />
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={0}>
        <FlatList
          ref={listRef}
          data={messages.data ?? []}
          keyExtractor={(m) => m.id}
          contentContainerStyle={styles.list}
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
          ListEmptyComponent={
            messages.isLoading ? (
              <Loading />
            ) : (
              <Text tone="muted" style={styles.empty}>
                Say salam 👋
              </Text>
            )
          }
          renderItem={({ item, index }) => {
            const mine = item.sender_id === me;
            const prev = messages.data?.[index - 1];
            const showName = isGroup && !mine && prev?.sender_id !== item.sender_id;
            const sender = people.get(item.sender_id);
            return (
              <Pressable onLongPress={() => onLongPress(item)} delayLongPress={300} style={[styles.bubbleRow, mine && styles.bubbleRowMine]}>
                {!mine && isGroup ? <Avatar uri={sender?.photo_url} name={sender?.first_name} size={28} /> : null}
                <View style={[styles.bubble, mine ? styles.bubbleMine : styles.bubbleTheirs]}>
                  {showName ? (
                    <Text variant="caption" tone="primary" style={styles.senderName}>
                      {sender?.first_name ?? 'Someone'}
                    </Text>
                  ) : null}
                  <Text style={mine ? styles.textMine : undefined}>{item.content}</Text>
                  <Text variant="caption" style={[styles.time, mine ? styles.timeMine : undefined]}>
                    {formatTime(item.created_at)}
                  </Text>
                </View>
              </Pressable>
            );
          }}
        />
        <View style={styles.composer}>
          <TextInput
            value={draft}
            onChangeText={(t) => setDraft(t.slice(0, LIMITS.messageMax))}
            placeholder="Message"
            placeholderTextColor={theme.colors.textMuted}
            multiline
            style={styles.input}
          />
          <Pressable onPress={submit} disabled={!draft.trim() || send.isPending} style={[styles.sendButton, (!draft.trim() || send.isPending) && styles.sendDisabled]}>
            <Ionicons name="arrow-up" size={22} color={theme.colors.white} />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  headerAvatar: { width: 40, alignItems: 'center' },
  list: { paddingHorizontal: theme.spacing.lg, paddingVertical: 12, gap: 6, flexGrow: 1 },
  empty: { textAlign: 'center', marginTop: 40 },
  bubbleRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, maxWidth: '82%', alignSelf: 'flex-start' },
  bubbleRowMine: { alignSelf: 'flex-end' },
  bubble: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 18, gap: 2 },
  bubbleMine: { backgroundColor: theme.colors.primary, borderBottomRightRadius: 6 },
  bubbleTheirs: { backgroundColor: theme.colors.surface, borderBottomLeftRadius: 6, borderWidth: StyleSheet.hairlineWidth, borderColor: theme.colors.border },
  senderName: { fontWeight: '600' },
  textMine: { color: theme.colors.white },
  time: { alignSelf: 'flex-end', color: theme.colors.textMuted },
  timeMine: { color: 'rgba(255,255,255,0.7)' },
  composer: { flexDirection: 'row', alignItems: 'flex-end', gap: 10, paddingHorizontal: theme.spacing.lg, paddingVertical: 10, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: theme.colors.border, backgroundColor: theme.colors.background },
  input: { flex: 1, maxHeight: 120, backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 22, paddingHorizontal: 16, paddingVertical: 11, fontSize: theme.font.body, color: theme.colors.text },
  sendButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: theme.colors.primary, alignItems: 'center', justifyContent: 'center' },
  sendDisabled: { opacity: 0.4 },
});
