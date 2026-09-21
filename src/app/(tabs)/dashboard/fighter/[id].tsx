import React, { useCallback, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, ChevronDown } from 'lucide-react-native';

import { Button } from '@/components/ui/button';
import { ChoiceSheet } from '@/components/ui/choice-sheet';
import { ErrorState } from '@/components/ui/error-state';
import { Spinner } from '@/components/ui/spinner';
import { Toast } from '@/components/ui/toast';
import { colors, fontSize, letterSpacing, radius, spacing } from '@/constants/theme';
import { admin, getProfile } from '@/lib/data';
import { describeError } from '@/lib/errors';
import type { Profile } from '@/types/supabase';

const CATEGORIES = ['KIDS 6-12', 'YOUTH 13-17', 'AMATEUR', 'PRO'];
const WEIGHT_CLASSES = ['Flyweight', 'Bantamweight', 'Featherweight', 'Lightweight', 'Welterweight', 'Middleweight', 'Light Heavyweight', 'Heavyweight', '—'];
const LEVELS = ['Beginner', 'Intermediate', 'Advanced', 'Competitive'];

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

export default function FighterCardScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [player, setPlayer] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const [displayName, setDisplayName] = useState('');
  const [category, setCategory] = useState('');
  const [weightClass, setWeightClass] = useState('');
  const [level, setLevel] = useState('');
  const [wins, setWins] = useState('0');
  const [losses, setLosses] = useState('0');
  const [sheet, setSheet] = useState<null | 'category' | 'weight' | 'level'>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const [p, existing] = await Promise.all([getProfile(id), admin.fighterCard(id)]);
      if (!p) { setError('Member not found.'); return; }
      setPlayer(p);
      setDisplayName(existing?.display_name ?? p.full_name ?? '');
      setCategory(existing?.category ?? p.category ?? '');
      setWeightClass(existing?.weight_class ?? p.weight_class ?? '');
      setLevel(existing?.level ?? p.level ?? '');
      setWins(String(existing?.wins ?? 0));
      setLosses(String(existing?.losses ?? 0));
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
    const w = Math.max(0, Number(wins) || 0);
    const l = Math.max(0, Number(losses) || 0);
    setSaving(true);
    try {
      await admin.saveFighterCard({
        player_id: id,
        display_name: displayName.trim(),
        photo_url: player?.photo_url ?? null,
        category: category || player?.category || null,
        weight_class: weightClass === '—' || !weightClass ? (player?.weight_class ?? null) : weightClass,
        level: level || player?.level || null,
        wins: w,
        losses: l,
        membership_status: player?.membership_status ?? null,
      });
      setToast({ type: 'success', message: 'Fighter card saved.' });
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
        <Text style={styles.headerTitle} numberOfLines={1}>Fighter card</Text>
        <View style={styles.headerSpacer} />
      </View>

      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <Text style={styles.label}>Ring name</Text>
          <TextInput
            style={styles.input}
            value={displayName}
            onChangeText={setDisplayName}
            placeholder={player.full_name ?? 'Ring name'}
            placeholderTextColor={colors.subtle}
            maxLength={60}
          />

          <FieldPicker label="Category" value={category} placeholder="Select category" onPress={() => setSheet('category')} />
          <FieldPicker label="Weight class" value={weightClass} placeholder="Select weight class" onPress={() => setSheet('weight')} />
          <FieldPicker label="Level" value={level} placeholder="Select level" onPress={() => setSheet('level')} />

          <View style={styles.recordRow}>
            <View style={styles.recordField}>
              <Text style={styles.label}>Wins</Text>
              <TextInput style={styles.input} value={wins} onChangeText={setWins} keyboardType="number-pad" />
            </View>
            <View style={styles.recordField}>
              <Text style={styles.label}>Losses</Text>
              <TextInput style={styles.input} value={losses} onChangeText={setLosses} keyboardType="number-pad" />
            </View>
          </View>

          <Button title="Save fighter card" onPress={save} loading={saving} disabled={saving} fullWidth />
        </ScrollView>
      </KeyboardAvoidingView>

      <ChoiceSheet visible={sheet === 'category'} title="Category" options={CATEGORIES} selected={category} onSelect={setCategory} onClose={() => setSheet(null)} />
      <ChoiceSheet visible={sheet === 'weight'} title="Weight class" options={WEIGHT_CLASSES} selected={weightClass} onSelect={setWeightClass} onClose={() => setSheet(null)} />
      <ChoiceSheet visible={sheet === 'level'} title="Level" options={LEVELS} selected={level} onSelect={setLevel} onClose={() => setSheet(null)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
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
    gap: spacing.xs,
  },
  label: {
    color: colors.muted,
    fontSize: fontSize.small,
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontWeight: '700',
    marginTop: spacing.sm,
  },
  input: {
    backgroundColor: colors.panel,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.input,
    padding: spacing.md,
    color: colors.text,
    fontSize: fontSize.body,
  },
  field: {
    backgroundColor: colors.panel,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.input,
    padding: spacing.md,
    gap: spacing.xs,
    marginTop: spacing.sm,
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
  recordRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.xs,
  },
  recordField: { flex: 1 },
});