import React, { useCallback, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Clock, MapPin } from 'lucide-react-native';

import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ErrorState } from '@/components/ui/error-state';
import { Spinner } from '@/components/ui/spinner';
import { Toast } from '@/components/ui/toast';
import { colors, fontSize, letterSpacing, radius, spacing } from '@/constants/theme';
import { admin, isStaff, training } from '@/lib/data';
import { describeError } from '@/lib/errors';
import { formatDateTime } from '@/lib/format';
import { useAuthStore } from '@/stores/auth-store';
import type { Attendance } from '@/types/supabase';

type PlayerInfo = {
  id: string;
  full_name: string | null;
  photo_url: string | null;
};

export default function SessionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const profile = useAuthStore((s) => s.profile);
  const staff = Boolean(profile && isStaff(profile.role));
  const userId = user?.id ?? '';

  const [session, setSession] = useState<{ id: string; title: string; location: string | null; notes: string | null; starts_at: string; status: string } | null>(null);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [players, setPlayers] = useState<PlayerInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const sessions = await training.list();
      const found = sessions.find((s) => s.id === id);
      if (!found) { setError('Session not found.'); return; }
      setSession(found);

      const att = await training.sessionAttendance(id);
      setAttendance(att);

      if (staff) {
        const allPlayers = await admin.players();
        setPlayers(allPlayers.map((p) => ({ id: p.id, full_name: p.full_name, photo_url: p.photo_url })));
      }
      setError(null);
    } catch (err) {
      setError(describeError(err));
    } finally {
      setLoading(false);
    }
  }, [id, staff]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load])
  );

  const getAtt = (playerId: string) => attendance.find((a) => a.player_id === playerId);

  const mark = async (playerId: string, status: Attendance['status']) => {
    if (!id) return;
    setBusy(true);
    try {
      await training.markAttendance(id, playerId, status);
      setAttendance((prev) => {
        const existing = prev.find((a) => a.player_id === playerId);
        if (existing) return prev.map((a) => (a.player_id === playerId ? { ...a, status, marked_at: new Date().toISOString() } : a));
        return [...prev, { id: `${id}-${playerId}`, session_id: id, player_id: playerId, status, marked_at: new Date().toISOString() }];
      });
    } catch (err) {
      setToast({ type: 'error', message: describeError(err) });
    } finally {
      setBusy(false);
    }
  };

  const startSession = async () => {
    if (!id) return;
    setBusy(true);
    try {
      await training.startSession(id);
      setSession((s) => (s ? { ...s, status: 'started' } : s));
    } catch (err) {
      setToast({ type: 'error', message: describeError(err) });
    } finally {
      setBusy(false);
    }
  };

  const closeSession = async () => {
    if (!id) return;
    Alert.alert('Close session?', 'Unmarked players will be marked absent.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Close',
        style: 'destructive',
        onPress: async () => {
          setBusy(true);
          try {
            await training.closeSession(id);
            setSession((s) => (s ? { ...s, status: 'completed' } : s));
            setAttendance((prev) => prev.map((a) => (a.status === 'pending' ? { ...a, status: 'absent', marked_at: new Date().toISOString() } : a)));
          } catch (err) {
            setToast({ type: 'error', message: describeError(err) });
          } finally {
            setBusy(false);
          }
        },
      },
    ]);
  };

  const myAtt = getAtt(userId);
  const isStarted = session?.status === 'started';
  const isCompleted = session?.status === 'completed';

  if (loading) return <View style={styles.center}><Spinner fullscreen /></View>;
  if (error || !session) return <ErrorState message={error ?? 'Session not found.'} onRetry={() => void load()} retryLoading={loading} />;

  return (
    <View style={styles.container}>
      {toast && <Toast message={toast.message} type={toast.type} onDismiss={() => setToast(null)} />}

      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={8} accessibilityLabel="Back">
          <ArrowLeft size={22} color={colors.text} />
        </Pressable>
        <Text style={styles.headerTitle} numberOfLines={1}>{session.title}</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} contentInsetAdjustmentBehavior="automatic">
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Clock size={16} color={colors.muted} />
            <Text style={styles.infoText}>{formatDateTime(session.starts_at)}</Text>
          </View>
          <View style={styles.infoRow}>
            <MapPin size={16} color={colors.muted} />
            <Text style={styles.infoText}>{session.location ?? 'No location set'}</Text>
          </View>
          {session.notes ? <Text style={styles.notes}>{session.notes}</Text> : null}
        </View>

        {/* Player view */}
        {!staff && myAtt && (
          <View style={styles.myStatusCard}>
            <Text style={styles.myStatusLabel}>Your status</Text>
            <Text style={[styles.myStatusValue, { color: myAtt.status === 'present' ? colors.success : myAtt.status === 'absent' ? colors.error : myAtt.status === 'late' ? colors.secondary : colors.muted }]}>
              {myAtt.status.toUpperCase()}
            </Text>
          </View>
        )}

        {/* Staff controls */}
        {staff && (
          <View style={styles.actions}>
            {!isStarted && !isCompleted && (
              <Button title="Start session" onPress={startSession} loading={busy} disabled={busy} fullWidth />
            )}
            {isStarted && (
              <Button title="Close session" variant="danger" onPress={closeSession} loading={busy} disabled={busy} fullWidth />
            )}
          </View>
        )}

        {/* Attendance list */}
        {staff && players.length > 0 && (
          <View style={styles.attCard}>
            <Text style={styles.attTitle}>Attendance</Text>
            <View style={styles.attHeaderRow}>
              <Text style={styles.attColName}>Player</Text>
              <Text style={styles.attColAction}>P</Text>
              <Text style={styles.attColAction}>A</Text>
              <Text style={styles.attColAction}>L</Text>
            </View>
            {players.map((p) => {
              const att = getAtt(p.id);
              const status = att?.status ?? 'pending';
              return (
                <View key={p.id} style={styles.attRow}>
                  <View style={styles.attName}>
                    <Avatar url={p.photo_url} name={p.full_name} size={28} />
                    <Text style={styles.attPlayerName} numberOfLines={1}>{p.full_name}</Text>
                  </View>
                  {(['present', 'absent', 'late'] as const).map((s) => (
                    <Pressable
                      key={s}
                      onPress={() => mark(p.id, s)}
                      style={[styles.attBtn, status === s && (s === 'present' ? styles.attBtnPresent : s === 'absent' ? styles.attBtnAbsent : styles.attBtnLate)]}
                      disabled={busy || isCompleted}
                      accessibilityLabel={`Mark ${p.full_name} as ${s}`}
                      hitSlop={4}
                    >
                      {status === s && <Text style={styles.attBtnIcon}>✓</Text>}
                    </Pressable>
                  ))}
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' },
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
  scroll: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xl,
    gap: spacing.md,
  },
  infoCard: {
    backgroundColor: colors.panel,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.card,
    padding: spacing.md,
    gap: spacing.sm,
  },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  infoText: { color: colors.text, fontSize: fontSize.body },
  notes: { color: colors.muted, fontSize: fontSize.caption, marginTop: spacing.xs },
  actions: { gap: spacing.sm },
  myStatusCard: {
    backgroundColor: colors.panel,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.card,
    padding: spacing.md,
    alignItems: 'center',
    gap: spacing.xs,
  },
  myStatusLabel: { color: colors.muted, fontSize: fontSize.caption, textTransform: 'uppercase', letterSpacing: 1 },
  myStatusValue: { fontSize: fontSize.h2, fontWeight: '800', letterSpacing: letterSpacing.heading },
  attCard: {
    backgroundColor: colors.panel,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.card,
    padding: spacing.md,
    gap: spacing.sm,
  },
  attTitle: { color: colors.text, fontSize: fontSize.body, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1, marginBottom: spacing.xs },
  attHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    paddingBottom: spacing.xs,
  },
  attColName: { flex: 1, color: colors.muted, fontSize: fontSize.small, textTransform: 'uppercase', letterSpacing: 1 },
  attColAction: { width: 40, textAlign: 'center', color: colors.muted, fontSize: fontSize.small, textTransform: 'uppercase', letterSpacing: 1 },
  attRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  attName: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
  attPlayerName: { color: colors.text, fontSize: fontSize.caption, flex: 1 },
  attBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 2,
  },
  attBtnPresent: { backgroundColor: colors.success, borderColor: colors.success },
  attBtnAbsent: { backgroundColor: colors.error, borderColor: colors.error },
  attBtnLate: { backgroundColor: colors.secondary, borderColor: colors.secondary },
  attBtnIcon: { color: colors.text, fontSize: fontSize.small, fontWeight: '800' },
});