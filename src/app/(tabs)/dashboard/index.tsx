import React, { useCallback, useState } from 'react';
import {
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import {
  CalendarPlus,
  Check,
  ChevronRight,
  Megaphone,
  MessageSquarePlus,
  ShieldCheck,
  Users,
  X,
} from 'lucide-react-native';

import { Avatar } from '@/components/ui/avatar';
import { ChoiceSheet } from '@/components/ui/choice-sheet';
import { ErrorState } from '@/components/ui/error-state';
import { ScreenHeader } from '@/components/ui/screen-header';
import { SkeletonCard } from '@/components/ui/skeleton';
import { Toast } from '@/components/ui/toast';
import { colors, fontSize, letterSpacing, radius, spacing } from '@/constants/theme';
import { admin, type AdminStats } from '@/lib/data';
import { describeError } from '@/lib/errors';
import type { Profile } from '@/types/supabase';

const CATEGORIES = ['KIDS 6-12', 'YOUTH 13-17', 'AMATEUR', 'PRO'];

function StatTile({ label, value, icon: Icon }: { label: string; value: string | number; icon: React.ComponentType<{ size: number; color: string }> }) {
  return (
    <View style={styles.statTile}>
      <Icon size={18} color={colors.secondary} />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

export default function DashboardScreen() {
  const router = useRouter();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [pending, setPending] = useState<Profile[]>([]);
  const [players, setPlayers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // approval category picker
  const [approveTarget, setApproveTarget] = useState<Profile | null>(null);
  const [category, setCategory] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [s, p, pl] = await Promise.all([admin.stats(), admin.pending(), admin.players()]);
      setStats(s);
      setPending(p);
      setPlayers(pl);
      setError(null);
    } catch (err) {
      setError(describeError(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load])
  );

  const approve = async (player: Profile, chosenCategory: string) => {
    if (!chosenCategory) return;
    try {
      await admin.setApproval(player.id, true, chosenCategory);
      setPending((prev) => prev.filter((p) => p.id !== player.id));
      setPlayers((prev) => [...prev, { ...player, status: 'approved', category: chosenCategory }]);
      setToast({ type: 'success', message: `${player.full_name} approved.` });
    } catch (err) {
      setToast({ type: 'error', message: describeError(err) });
    } finally {
      setApproveTarget(null);
      setCategory(null);
    }
  };

  const reject = async (player: Profile) => {
    Alert.alert('Reject application?', `${player.full_name} will be notified by email.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reject',
        style: 'destructive',
        onPress: async () => {
          try {
            await admin.setApproval(player.id, false);
            setPending((prev) => prev.filter((p) => p.id !== player.id));
            setToast({ type: 'success', message: `${player.full_name} rejected.` });
          } catch (err) {
            setToast({ type: 'error', message: describeError(err) });
          }
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      {toast && <Toast message={toast.message} type={toast.type} onDismiss={() => setToast(null)} />}
      <ScreenHeader title="Dashboard" subtitle="Coaching controls" />

      {loading ? (
        <View style={styles.scroll}><SkeletonCard /><SkeletonCard /></View>
      ) : error ? (
        <ErrorState message={error} onRetry={() => void load()} retryLoading={loading} />
      ) : (
        <ScrollView contentContainerStyle={styles.scroll} contentInsetAdjustmentBehavior="automatic" refreshControl={<RefreshControl tintColor={colors.muted} refreshing={false} onRefresh={() => void load()} />}>
          {/* Stats */}
          <View style={styles.statsGrid}>
            <StatTile icon={Users} label="Members" value={stats?.totalMembers ?? 0} />
            <StatTile icon={ShieldCheck} label="Pending" value={stats?.pending ?? 0} />
            <StatTile icon={CalendarPlus} label="Today" value={stats?.todaySessions ?? 0} />
            <StatTile icon={Check} label="Att." value={stats?.attendancePct != null ? `${stats.attendancePct}%` : '—'} />
          </View>

          {/* Quick actions */}
          <View style={styles.actionsGrid}>
            <Pressable onPress={() => router.push('/(tabs)/dashboard/session/new')} style={styles.actionBtn}>
              <CalendarPlus size={20} color={colors.text} />
              <Text style={styles.actionLabel}>New session</Text>
            </Pressable>
            <Pressable onPress={() => router.push('/(tabs)/dashboard/broadcast')} style={styles.actionBtn}>
              <Megaphone size={20} color={colors.text} />
              <Text style={styles.actionLabel}>Broadcast</Text>
            </Pressable>
            <Pressable onPress={() => router.push('/(tabs)/chat/new')} style={styles.actionBtn}>
              <MessageSquarePlus size={20} color={colors.text} />
              <Text style={styles.actionLabel}>New chat</Text>
            </Pressable>
          </View>

          {/* Pending approvals */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Pending approvals</Text>
            {pending.length === 0 ? (
              <Text style={styles.sectionEmpty}>No applications waiting.</Text>
            ) : (
              pending.map((p) => (
                <View key={p.id} style={styles.pendingCard}>
                  <Avatar url={p.photo_url} name={p.full_name} size={36} />
                  <View style={styles.pendingText}>
                    <Text style={styles.pendingName} numberOfLines={1}>{p.full_name}</Text>
                    <Text style={styles.pendingMeta} numberOfLines={1}>{p.email} · {p.is_minor ? 'Minor' : 'Adult'}</Text>
                  </View>
                  <View style={styles.pendingActions}>
                    <Pressable
                      onPress={() => { setApproveTarget(p); setCategory(CATEGORIES[0]); }}
                      style={styles.approveBtn}
                      accessibilityLabel={`Approve ${p.full_name}`}
                      hitSlop={4}
                    >
                      <Check size={16} color={colors.background} strokeWidth={3} />
                    </Pressable>
                    <Pressable
                      onPress={() => reject(p)}
                      style={styles.rejectBtn}
                      accessibilityLabel={`Reject ${p.full_name}`}
                      hitSlop={4}
                    >
                      <X size={16} color={colors.text} strokeWidth={2.5} />
                    </Pressable>
                  </View>
                </View>
              ))
            )}
          </View>

          {/* Players */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Members</Text>
              <Text style={styles.sectionCount}>{players.length}</Text>
            </View>
            {players.length === 0 ? (
              <Text style={styles.sectionEmpty}>No approved members yet.</Text>
            ) : (
              players.map((p) => (
                <Pressable
                  key={p.id}
                  onPress={() => router.push(`/(tabs)/dashboard/player/${p.id}`)}
                  style={({ pressed }) => [styles.playerCard, pressed && styles.playerCardPressed]}
                  accessibilityLabel={`Edit ${p.full_name}`}
                >
                  <Avatar url={p.photo_url} name={p.full_name} size={36} />
                  <View style={styles.playerText}>
                    <Text style={styles.playerName} numberOfLines={1}>{p.full_name}</Text>
                    <Text style={styles.playerMeta} numberOfLines={1}>
                      {p.category ?? 'No category'} · {p.level ?? 'No level'}
                    </Text>
                  </View>
                  <ChevronRight size={18} color={colors.muted} />
                </Pressable>
              ))
            )}
          </View>
        </ScrollView>
      )}

      <ChoiceSheet
        visible={Boolean(approveTarget)}
        title={`Approve ${approveTarget?.full_name ?? ''}`}
        options={CATEGORIES}
        selected={category}
        onSelect={(value) => {
          setCategory(value);
          if (approveTarget) void approve(approveTarget, value);
        }}
        onClose={() => {
          setApproveTarget(null);
          setCategory(null);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xxl,
    gap: spacing.lg,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  statTile: {
    flexGrow: 1,
    flexBasis: '45%',
    backgroundColor: colors.panel,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.card,
    padding: spacing.md,
    gap: 2,
  },
  statValue: { color: colors.text, fontSize: fontSize.h2, fontWeight: '800', marginTop: spacing.xs },
  statLabel: { color: colors.muted, fontSize: fontSize.caption, textTransform: 'uppercase', letterSpacing: 1 },
  actionsGrid: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actionBtn: {
    flex: 1,
    backgroundColor: colors.panel,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.card,
    padding: spacing.md,
    alignItems: 'center',
    gap: spacing.xs,
  },
  actionLabel: { color: colors.text, fontSize: fontSize.small, fontWeight: '700', textAlign: 'center' },
  section: {
    gap: spacing.sm,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    color: colors.text,
    fontSize: fontSize.h3,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: letterSpacing.heading,
  },
  sectionCount: { color: colors.muted, fontSize: fontSize.caption },
  sectionEmpty: { color: colors.muted, fontSize: fontSize.body },
  pendingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.panel,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.card,
    padding: spacing.md,
  },
  pendingText: { flex: 1, gap: 2 },
  pendingName: { color: colors.text, fontSize: fontSize.body, fontWeight: '700' },
  pendingMeta: { color: colors.muted, fontSize: fontSize.small },
  pendingActions: { flexDirection: 'row', gap: spacing.sm },
  approveBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.success,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rejectBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.error,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.panel,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.card,
    padding: spacing.md,
  },
  playerCardPressed: { opacity: 0.8 },
  playerText: { flex: 1, gap: 2 },
  playerName: { color: colors.text, fontSize: fontSize.body, fontWeight: '700' },
  playerMeta: { color: colors.muted, fontSize: fontSize.small },
});