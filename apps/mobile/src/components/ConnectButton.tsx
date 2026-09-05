import type { ConnectionStatus } from '@wmc/shared';
import { useRouter } from 'expo-router';

import { useAcceptFrom, useConnect, useDirectConversation } from '@/lib/queries';
import { errorMessage } from '@/lib/supabase';

import { Button, useToast } from './ui';

interface Props {
  userId: string;
  status: ConnectionStatus | null;
  direction: 'sent' | 'received' | null;
  size?: 'md' | 'sm';
  fullWidth?: boolean;
}

/** Connect / Requested / Accept / Message — shared by Discover cards and the public profile. */
export function ConnectButton({ userId, status, direction, size = 'sm', fullWidth = false }: Props) {
  const router = useRouter();
  const toast = useToast();
  const connect = useConnect();
  const accept = useAcceptFrom();
  const openChat = useDirectConversation();

  const fail = (e: unknown) => toast.error(errorMessage(e));

  if (status === 'accepted') {
    return (
      <Button
        title="Message"
        size={size}
        fullWidth={fullWidth}
        loading={openChat.isPending}
        onPress={() =>
          openChat.mutate(userId, {
            onSuccess: (conversationId) => router.push({ pathname: '/chat/[id]', params: { id: conversationId } }),
            onError: fail,
          })
        }
      />
    );
  }
  if (status === 'pending' && direction === 'received') {
    return (
      <Button
        title="Accept"
        size={size}
        fullWidth={fullWidth}
        loading={accept.isPending}
        onPress={() => accept.mutate(userId, { onError: fail, onSuccess: () => toast.success('You are now connected') })}
      />
    );
  }
  if (status === 'pending') {
    return <Button title="Requested" size={size} fullWidth={fullWidth} variant="secondary" disabled />;
  }
  return (
    <Button
      title="Connect"
      size={size}
      fullWidth={fullWidth}
      variant="secondary"
      loading={connect.isPending}
      onPress={() => connect.mutate(userId, { onError: fail, onSuccess: () => toast.success('Request sent') })}
    />
  );
}
