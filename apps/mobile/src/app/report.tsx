import { Ionicons } from '@expo/vector-icons';
import { REPORT_REASONS, type ReportTargetType } from '@wmc/shared';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Button, Input, Screen, Text, useToast } from '@/components/ui';
import { useReport } from '@/lib/queries';
import { errorMessage } from '@/lib/supabase';
import { theme } from '@/theme';

const TARGET_LABEL: Record<ReportTargetType, string> = {
  user: 'this user',
  event: 'this event',
  message: 'this message',
  community: 'this community',
  activity: 'this activity',
};

export default function ReportScreen() {
  const router = useRouter();
  const toast = useToast();
  const { targetType, targetId } = useLocalSearchParams<{ targetType: ReportTargetType; targetId: string }>();
  const report = useReport();
  const [reason, setReason] = useState<string | null>(null);
  const [details, setDetails] = useState('');
  const [blockUser, setBlockUser] = useState(false);
  const [done, setDone] = useState(false);

  const submit = () => {
    if (!reason || !targetType || !targetId) return;
    report.mutate(
      { targetType, targetId, reason, details: details.trim() || null, blockUser: targetType === 'user' && blockUser },
      {
        onError: (e) => toast.error(errorMessage(e)),
        onSuccess: () => {
          setDone(true);
          setTimeout(() => router.back(), 1400);
        },
      },
    );
  };

  if (done) {
    return (
      <Screen scroll={false} edges={['top', 'bottom', 'left', 'right']}>
        <View style={styles.doneWrap}>
          <Ionicons name="checkmark-circle" size={56} color={theme.colors.success} />
          <Text variant="h2" style={styles.center}>
            Thanks. Our team will review this.
          </Text>
        </View>
      </Screen>
    );
  }

  return (
    <Screen keyboard edges={['top', 'bottom', 'left', 'right']}>
      <View style={styles.header}>
        <Text variant="h2">Report {TARGET_LABEL[targetType ?? 'user']}</Text>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Ionicons name="close" size={26} color={theme.colors.text} />
        </Pressable>
      </View>
      <Text tone="secondary">Tell us what&apos;s wrong. Reports are confidential.</Text>

      <View style={styles.reasons}>
        {REPORT_REASONS.map((r) => {
          const active = reason === r.slug;
          return (
            <Pressable key={r.slug} onPress={() => setReason(r.slug)} style={[styles.reason, active && styles.reasonActive]}>
              <Ionicons name={active ? 'radio-button-on' : 'radio-button-off'} size={22} color={active ? theme.colors.primary : theme.colors.textMuted} />
              <Text variant={active ? 'bodyStrong' : 'body'}>{r.name}</Text>
            </Pressable>
          );
        })}
      </View>

      <Input label="Details (optional)" placeholder="Anything else we should know?" value={details} onChangeText={(t) => setDetails(t.slice(0, 1000))} multiline />

      {targetType === 'user' ? (
        <Pressable onPress={() => setBlockUser(!blockUser)} style={styles.checkbox}>
          <Ionicons name={blockUser ? 'checkbox' : 'square-outline'} size={24} color={blockUser ? theme.colors.primary : theme.colors.textMuted} />
          <Text>Also block this user</Text>
        </Pressable>
      ) : null}

      <Button title="Submit report" fullWidth disabled={!reason} loading={report.isPending} onPress={submit} style={styles.submit} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 12, marginBottom: 6 },
  reasons: { gap: 6, marginVertical: 20 },
  reason: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, paddingHorizontal: 14, borderRadius: theme.radius.md, backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border },
  reasonActive: { borderColor: theme.colors.primary, backgroundColor: theme.colors.accentSoft },
  checkbox: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 18 },
  submit: { marginTop: 24 },
  doneWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16, padding: 24 },
  center: { textAlign: 'center' },
});
