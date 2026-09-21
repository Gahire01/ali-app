import React, { useCallback, useState } from 'react';
import {
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Dumbbell, MapPin } from 'lucide-react-native';

import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { ScreenHeader } from '@/components/ui/screen-header';
import { SkeletonCard } from '@/components/ui/skeleton';
import { Toast } from '@/components/ui/toast';
import { colors, fontSize, radius, spacing } from '@/constants/theme';
import { isStaff, training } from '@/lib/data';
import { describeError } from '@/lib/errors';
import { formatDayTime, formatTime } from '@/lib/format';
import { useAuthStore } from '@/stores/auth-store';
import type { Attendance, TrainingSession } from '@/types/supabase';

type AttendanceSummary = {
  present: number;
  late: number;
  absent: number;
  pct: number;
};

function summarizeAttendance(all: Attendance[]): AttendanceSummary {
  if (all.length === 0) return { present: 0, late: 0, absent: 0, pct: 0 };
  const present = all.filter((a) => a.status === 'present').length;
  const late = all.filter((a) => a.status === 'late').length;
  const absent = all.filter((a) => a.status === 'absent').length;
  const marked = present + late + absent;
  return { present, late, absent, pct: marked > 0 ? Math.round(((present + late) / marked) * 100) : 0 };
}

export default function TrainingScreen() {
  const router = useRouter();
  const profile = useAuthStore((s) => s.profile);
  const user = useAuthStore((s) => s.user);
  const staff = Boolean(profile && isStaff(profile.role));

  const [sessions, setSessions] = useState<TrainingSession[]>([]);
  const [summary, setSummary] = useState<AttendanceSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const userId = user?.id ?? '';

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await training.list();
      setSessions(data);
      if (!staff && userId) {
        const attendance = await training.myAttendance(userId);
        setSummary(summarizeAttendance(attendance));
      } else {
        setSummary(null);
      }
      setError(null);
    } catch (err) {
      setError(describeError(err));
    } finally {
      setLoading(false);
    }
  }, [staff, userId]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load])
  );

  const statusColor = (s: string) => {
    switch (s) {
      case 'scheduled': return colors.muted;
      case 'started': return colors.secondary;
      case 'completed': return colors.success;
      default: return colors.muted;
    }
  };

  const renderSession = ({ item }: { item: TrainingSession }) => (
    <Pressable
      onPress={() => router.push(`/(tabs)/training/${item.id}`)}
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      accessibilityRole="button"
      accessibilityLabel={`${item.title}, ${item.status}`}
    >
      <View style={styles.cardHeader}>
        <View style={styles.iconWrap}>
          <Dumbbell size={20} color={colors.text} />
        </View>
        <View style={styles.cardTextBlock}>
          <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
          <Text style={styles.cardDate}>{formatDayTime(item.starts_at)} · {formatTime(item.starts_at)}</Text>
        </View>
        <View style={[styles.statusDot, { backgroundColor: statusColor(item.status) }]} />
      </View>
      <View style={styles.cardBody}>
        <View style={styles.detail}>
          <MapPin size={14} color={colors.muted} />
          <Text style={styles.detailText} numberOfLines={1}>{item.location ?? 'No location'}</Text>
        </View>
        {item.notes ? (
          <Text style={styles.notes} numberOfLines={2}>{item.notes}</Text>
        ) : null}
      </View>
      <View style={styles.cardFooter}>
        <Text style={[styles.statusText, { color: statusColor(item.status) }]}>{item.status.toUpperCase()}</Text>
        <Text style={styles.tapHint}>Tap to view details</Text>
      </View>
    </Pressable>
  );

  return (
    <View style={styles.container}>
      {toast && <Toast message={toast.message} type={toast.type} onDismiss={() => setToast(null)} />}
      <ScreenHeader title="Training" subtitle="Sessions and attendance" />

      {loading ? (
        <View style={styles.list}><SkeletonCard /><SkeletonCard /></View>
      ) : error ? (
        <ErrorState message={error} onRetry={() => void load()} retryLoading={loading} />
      ) : sessions.length === 0 ? (
        <EmptyState icon={Dumbbell} title="No sessions yet" message="Training sessions created by coaches will appear here." />
      ) : (
        <FlatList
          data={sessions}
          keyExtractor={(item) => item.id}
          renderItem={renderSession}
          contentContainerStyle={styles.list}
          contentInsetAdjustmentBehavior="automatic"
          ListHeaderComponent={
            summary ? (
              <View style={styles.summaryCard}>
                <View style={styles.summaryHeader}>
                  <Text style={styles.summaryTitle}>My attendance</Text>
                  <Text style={styles.summaryPct}>{summary.pct}%</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Attended</Text>
                  <Text style={styles.summaryValue}>{summary.present + summary.late} sessions</Text>
                </View>
                <Text style={styles.summaryDetail}>
                  {summary.present} present, {summary.late} late, {summary.absent} absent
                </Text>
              </View>
            ) : null
          }
          refreshControl={
            <RefreshControl tintColor={colors.muted} refreshing={false} onRefresh={() => void load()} />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  list: { paddingHorizontal: spacing.md, paddingBottom: spacing.xxl, gap: spacing.md },
  card: {
    backgroundColor: colors.panel,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.card,
    padding: spacing.md,
    gap: spacing.sm,
  },
  cardPressed: { opacity: 0.85 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTextBlock: { flex: 1, gap: 2 },
  cardTitle: { color: colors.text, fontSize: fontSize.body, fontWeight: '700' },
  cardDate: { color: colors.muted, fontSize: fontSize.small },
  statusDot: { width: 10, height: 10, borderRadius: 5 },
  cardBody: { gap: spacing.xs },
  detail: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  detailText: { color: colors.muted, fontSize: fontSize.caption },
  notes: { color: colors.subtle, fontSize: fontSize.caption, lineHeight: 18, marginTop: 2 },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    paddingTop: spacing.sm,
  },
  statusText: { fontSize: fontSize.small, fontWeight: '800', letterSpacing: 1 },
  tapHint: { color: colors.subtle, fontSize: fontSize.small },
  summaryCard: {
    backgroundColor: colors.panel,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.card,
    padding: spacing.md,
    gap: spacing.xs,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  summaryTitle: {
    color: colors.text,
    fontSize: fontSize.body,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  summaryPct: {
    color: colors.secondary,
    fontSize: fontSize.h2,
    fontWeight: '800',
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  summaryLabel: { color: colors.muted, fontSize: fontSize.caption },
  summaryValue: { color: colors.text, fontSize: fontSize.caption, fontWeight: '700' },
  summaryDetail: { color: colors.subtle, fontSize: fontSize.small },
});