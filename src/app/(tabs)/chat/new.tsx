import React, { useCallback, useState } from 'react';
import {
  FlatList,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';

import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ErrorState } from '@/components/ui/error-state';
import { Spinner } from '@/components/ui/spinner';
import { Toast } from '@/components/ui/toast';
import { colors, fontSize, letterSpacing, radius, spacing } from '@/constants/theme';
import { admin, chat } from '@/lib/data';
import { describeError } from '@/lib/errors';
import { useAuthStore } from '@/stores/auth-store';
import type { Profile } from '@/types/supabase';

export default function NewConversationScreen() {
  const user = useAuthStore((s) => s.user);
  const router = useRouter();
  const userId = user?.id ?? '';

  const [players, setPlayers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isGroup, setIsGroup] = useState(false);
  const [title, setTitle] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await admin.players();
      setPlayers(data.filter((p) => p.id !== userId));
      setError(null);
    } catch (err) {
      setError(describeError(err));
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load])
  );

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const create = async () => {
    if (!userId || selected.size === 0 || submitting) return;
    if (isGroup && !title.trim()) return;
    setSubmitting(true);
    try {
      const conv = await chat.create({
        createdBy: userId,
        isGroup,
        title: isGroup ? title.trim() : undefined,
        memberIds: [...selected],
      });
      router.replace(`/(tabs)/chat/${conv.id}`);
    } catch (err) {
      setToast({ type: 'error', message: describeError(err) });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <Spinner fullscreen />;
  if (error) return <ErrorState message={error} onRetry={() => void load()} retryLoading={loading} />;

  return (
    <View style={styles.container}>
      {toast && <Toast message={toast.message} type={toast.type} onDismiss={() => setToast(null)} />}

      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={8} accessibilityLabel="Back">
          <ArrowLeft size={22} color={colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>New chat</Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.toggleRow}>
        <Text style={styles.toggleLabel}>Group chat</Text>
        <Switch value={isGroup} onValueChange={setIsGroup} trackColor={{ false: colors.panel, true: colors.primary }} thumbColor={colors.text} />
      </View>

      {isGroup && (
        <View style={styles.titleRow}>
          <TextInput
            style={styles.titleInput}
            value={title}
            onChangeText={setTitle}
            placeholder="Group name"
            placeholderTextColor={colors.subtle}
            maxLength={60}
          />
        </View>
      )}

      <Text style={styles.sectionLabel}>Select members ({selected.size} selected)</Text>

      <FlatList
        data={players}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => toggle(item.id)}
            style={({ pressed }) => [styles.playerRow, selected.has(item.id) && styles.playerRowSelected, pressed && styles.playerRowPressed]}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: selected.has(item.id) }}
            accessibilityLabel={item.full_name ?? 'Player'}
          >
            <Avatar url={item.photo_url} name={item.full_name} size={36} />
            <Text style={styles.playerName} numberOfLines={1}>{item.full_name}</Text>
            {selected.has(item.id) && <Text style={styles.checkmark}>✓</Text>}
          </Pressable>
        )}
        contentContainerStyle={styles.playerList}
      />

      <View style={styles.footer}>
        <Button
          title={isGroup ? 'Create group' : 'Start chat'}
          onPress={create}
          loading={submitting}
          disabled={submitting || selected.size === 0 || (isGroup && !title.trim())}
          fullWidth
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.panel,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    color: colors.text,
    fontSize: fontSize.h3,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: letterSpacing.heading,
    textAlign: 'center',
  },
  headerSpacer: { width: 44 },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  toggleLabel: { color: colors.text, fontSize: fontSize.body, fontWeight: '700' },
  titleRow: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  titleInput: {
    backgroundColor: colors.panel,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.input,
    padding: spacing.md,
    color: colors.text,
    fontSize: fontSize.body,
  },
  sectionLabel: {
    color: colors.muted,
    fontSize: fontSize.small,
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontWeight: '700',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xs,
  },
  playerList: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  playerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  playerRowSelected: {},
  playerRowPressed: { opacity: 0.7 },
  playerName: { flex: 1, color: colors.text, fontSize: fontSize.body },
  checkmark: { color: colors.secondary, fontSize: fontSize.body, fontWeight: '800' },
  footer: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xl },
});