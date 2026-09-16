import React, { useCallback, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, ChevronDown, Swords } from 'lucide-react-native';

import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ChoiceSheet } from '@/components/ui/choice-sheet';
import { ErrorState } from '@/components/ui/error-state';
import { Spinner } from '@/components/ui/spinner';
import { Toast } from '@/components/ui/toast';
import { colors, fontSize, letterSpacing, radius, spacing } from '@/constants/theme';
import { getProfile, admin } from '@/lib/data';
import { describeError } from '@/lib/errors';
import type { Profile } from '@/types/supabase';

const CATEGORIES = ['KIDS 6-12', 'YOUTH 13-17', 'AMATEUR', 'PRO'];
const WEIGHT_CLASSES = ['Flyweight', 'Bantamweight', 'Featherweight', 'Lightweight', 'Welterweight', 'Middleweight', 'Light Heavyweight', 'Heavyweight', '—'];
const LEVELS = ['Beginner', 'Intermediate', 'Advanced', 'Competitive'];
const MEMBERSHIPS = ['Active', 'On hold', 'Inactive'];

function FieldPicker({ label, value, placeholder, onPress }: { label: string; value: string; placeholder: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={styles.fieldRow}>
        <Text style={[styles.fieldValue, !value && styles.fieldPlaceholder]}>{value || placeholder}</Text>
        <ChevronDown size={16} color={colors.muted} />
      </View>
    </Pressable>
  );
}

export default function EditPlayerScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [player, setPlayer] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const [category, setCategory] = useState<string>('');
  const [weightClass, setWeightClass] = useState<string>('');
  const [weightKg, setWeightKg] = useState('');
  const [level, setLevel] = useState<string>('');
  const [membership, setMembership] = useState<string>('');
  const [sheet, setSheet] = useState<null | 'category' | 'weight' | 'level' | 'membership'>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const p = await getProfile(id);
      if (!p) { setError('Member not found.'); return; }
      setPlayer(p);
      setCategory(p.category ?? '');
      setWeightClass(p.weight_class ?? '');
      setWeightKg(p.weight_kg ? String(p.weight_kg) : '');
      setLevel(p.level ?? '');
      setMembership(p.membership_status ?? '');
      setError(null);
    } catch (err) {
      setError(describeError(err));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load])
  );

  const save = async () => {
    if (!id) return;
    setSaving(true);
    try {
      await admin.updateProfile(id, {
        category: category || null,
        weight_class: weightClass === '—' || !weightClass ? null : weightClass,
        weight_kg: weightKg ? Number(weightKg) : null,
        level: level || null,
        membership_status: membership || null,
      });
      setToast({ type: 'success', message: 'Member updated.' });
    } catch (err) {
      setToast({ type: 'error', message: describeError(err) });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Spinner fullscreen />;
  if (error || !player) return <ErrorState message={error ?? 'Member not found.'} onRetry={() => void load()} retryLoading={loading} />;

  return (
    <View style={styles.container}>
      {toast && <Toast message={toast.message} type={toast.type} onDismiss={() => setToast(null)} />}

      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={8} accessibilityLabel="Back">
          <ArrowLeft size={22} color={colors.text} />
        </Pressable>
        <Text style={styles.headerTitle} numberOfLines={1}>{player.full_name}</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.identityCard}>
          <Avatar url={player.photo_url} name={player.full_name} size={64} />
          <View style={styles.identityText}>
            <Text style={styles.identityName}>{player.full_name}</Text>
            <Text style={styles.identityMeta}>{player.email} · {player.phone ?? 'No phone'}</Text>
          </View>
        </View>

        <FieldPicker label="Category" value={category} placeholder="Select category" onPress={() => setSheet('category')} />
        <FieldPicker label="Weight class" value={weightClass} placeholder="Select weight class" onPress={() => setSheet('weight')} />
        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Weight (kg)</Text>
          <TextInput
            style={styles.weightInput}
            value={weightKg}
            onChangeText={setWeightKg}
            keyboardType="numeric"
            placeholder="e.g. 61"
            placeholderTextColor={colors.subtle}
          />
        </View>
        <FieldPicker label="Level" value={level} placeholder="Select level" onPress={() => setSheet('level')} />
        <FieldPicker label="Membership status" value={membership} placeholder="Select status" onPress={() => setSheet('membership')} />

        <Button title="Save changes" onPress={save} loading={saving} disabled={saving} fullWidth />

        <Pressable onPress={() => router.push(`/(tabs)/dashboard/fighter/${player.id}`)} style={styles.fighterLink}>
          <Swords size={18} color={colors.secondary} />
          <Text style={styles.fighterLinkText}>Build fighter card</Text>
        </Pressable>
      </ScrollView>

      <ChoiceSheet visible={sheet === 'category'} title="Category" options={CATEGORIES} selected={category} onSelect={setCategory} onClose={() => setSheet(null)} />
      <ChoiceSheet visible={sheet === 'weight'} title="Weight class" options={WEIGHT_CLASSES} selected={weightClass} onSelect={setWeightClass} onClose={() => setSheet(null)} />
      <ChoiceSheet visible={sheet === 'level'} title="Level" options={LEVELS} selected={level} onSelect={setLevel} onClose={() => setSheet(null)} />
      <ChoiceSheet visible={sheet === 'membership'} title="Membership status" options={MEMBERSHIPS} selected={membership} onSelect={setMembership} onClose={() => setSheet(null)} />
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
  scroll: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
    gap: spacing.md,
  },
  identityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: spacing.xs,
  },
  identityText: { flex: 1, gap: 2 },
  identityName: { color: colors.text, fontSize: fontSize.h3, fontWeight: '800' },
  identityMeta: { color: colors.muted, fontSize: fontSize.caption },
  field: {
    backgroundColor: colors.panel,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.input,
    padding: spacing.md,
    gap: spacing.xs,
  },
  fieldLabel: {
    color: colors.muted,
    fontSize: fontSize.small,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  fieldValue: { color: colors.text, fontSize: fontSize.body, fontWeight: '700' },
  fieldPlaceholder: { color: colors.subtle, fontWeight: '400' },
  weightInput: {
    color: colors.text,
    fontSize: fontSize.body,
    paddingVertical: 0,
  },
  fighterLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
  },
  fighterLinkText: {
    color: colors.secondary,
    fontSize: fontSize.body,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
});