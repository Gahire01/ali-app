import React, { useCallback, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Minus, Plus } from 'lucide-react-native';

import { Avatar } from '@/components/ui/avatar';
import { ChoiceSheet } from '@/components/ui/choice-sheet';
import { Spinner } from '@/components/ui/spinner';
import { Toast } from '@/components/ui/toast';
import { colors, fontSize, letterSpacing, radius, spacing } from '@/constants/theme';
import { admin, chat } from '@/lib/data';
import { describeError } from '@/lib/errors';
import { useAuthStore } from '@/stores/auth-store';
import type { Profile } from '@/types/supabase';

export default function ConversationMembersScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const user = useAuthStore((s) => s.user);
  const router = useRouter();
  const userId = user?.id ?? '';

  const [members, setMembers] = useState<Profile[]>([]);
  const [candidates, setCandidates] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const list = await chat.members(id);
      setMembers(list);
      const memberIds = list.map((m) => m.id);
      const all = await admin.allMembers();
      const candidates = all.filter((p) => ![userId, ...memberIds].includes(p.id)).map((p) => p.full_name ?? p.id);
      setCandidates(candidates);
      setToast(null);
    } catch (err) {
      setToast({ type: 'error', message: describeError(err) });
    } finally {
      setLoading(false);
    }
  }, [id, userId]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load])
  );

  const remove = async (memberId: string) => {
    if (!id || busy || memberId === userId) return;
    setBusy(true);
    try {
      await chat.removeMember(id, memberId);
      await load();
      setToast({ type: 'success', message: 'Member removed.' });
    } catch (err) {
      setToast({ type: 'error', message: describeError(err) });
    } finally {
      setBusy(false);
    }
  };

  const add = async (name: string) => {
    if (!id || !name || busy) return;
    const all = await admin.allMembers();
    const target = all.find((p) => (p.full_name ?? p.id) === name);
    if (!target) return;
    setSheetOpen(false);
    setBusy(true);
    try {
      await chat.addMember(id, target.id);
      await load();
      setToast({ type: 'success', message: 'Member added.' });
    } catch (err) {
      setToast({ type: 'error', message: describeError(err) });
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={styles.container}>
      {toast && <Toast message={toast.message} type={toast.type} onDismiss={() => setToast(null)} />}

      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={8} accessibilityLabel="Back">
          <ArrowLeft size={22} color={colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Members</Text>
        <View style={styles.headerSpacer} />
      </View>

      {loading ? (
        <Spinner fullscreen />
      ) : (
        <FlatList
          data={members}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ListHeaderComponent={
            <Pressable
              onPress={() => setSheetOpen(true)}
              style={({ pressed }) => [styles.addRow, pressed && styles.pressed]}
              accessibilityRole="button"
              accessibilityLabel="Add member"
            >
              <Plus size={18} color={colors.text} />
              <Text style={styles.addRowText}>Add member</Text>
            </Pressable>
          }
          renderItem={({ item }) => (
            <View style={styles.row}>
              <Avatar url={item.photo_url} name={item.full_name} size={40} />
              <View style={styles.rowText}>
                <Text style={styles.rowName} numberOfLines={1}>{item.full_name}</Text>
                <Text style={styles.rowHint}>{item.role === 'player' ? 'Member' : item.role}</Text>
              </View>
              {item.id !== userId && (
                <Pressable
                  onPress={() => remove(item.id)}
                  style={({ pressed }) => [styles.removeBtn, pressed && styles.pressed]}
                  hitSlop={8}
                  accessibilityLabel={`Remove ${item.full_name}`}
                >
                  <Minus size={16} color={colors.text} />
                </Pressable>
              )}
            </View>
          )}
        />
      )}

      <ChoiceSheet
        visible={sheetOpen}
        title="Add member"
        options={candidates}
        onSelect={(v) => { void add(v); }}
        onClose={() => setSheetOpen(false)}
      />
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
  list: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  addRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderRadius: radius.input,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.border,
    backgroundColor: colors.panel,
  },
  addRowText: { color: colors.text, fontSize: fontSize.body, fontWeight: '700' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.panel,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.card,
    padding: spacing.sm,
  },
  rowText: { flex: 1, gap: 2 },
  rowName: { color: colors.text, fontSize: fontSize.body, fontWeight: '700' },
  rowHint: { color: colors.muted, fontSize: fontSize.small, textTransform: 'capitalize' },
  removeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.panel,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pressed: { opacity: 0.7 },
});