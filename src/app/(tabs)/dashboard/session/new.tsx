import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';

import { Button } from '@/components/ui/button';
import { Toast } from '@/components/ui/toast';
import { colors, fontSize, letterSpacing, radius, spacing } from '@/constants/theme';
import { training } from '@/lib/data';
import { describeError } from '@/lib/errors';
import { useAuthStore } from '@/stores/auth-store';

export default function NewSessionScreen() {
  const router = useRouter();
  const userId = useAuthStore((s) => s.user?.id ?? '');
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const create = async () => {
    if (saving) return;
    if (!title.trim() || !date.trim() || !time.trim()) {
      setToast({ type: 'error', message: 'Fill in name, date and start time.' });
      return;
    }
    setSaving(true);
    try {
      await training.create({
        title: title.trim(),
        location: location.trim(),
        notes: notes.trim(),
        startsAt: `${date.trim()}T${time.trim()}:00`,
        createdBy: userId,
      });
      router.back();
    } catch (err) {
      setToast({ type: 'error', message: describeError(err) });
    } finally {
      setSaving(false);
    }
  };

  const inputLabel = (text: string) => <Text style={styles.label}>{text}</Text>;

  return (
    <View style={styles.container}>
      {toast && <Toast message={toast.message} type={toast.type} onDismiss={() => setToast(null)} />}

      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={8} accessibilityLabel="Back">
          <ArrowLeft size={22} color={colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>New session</Text>
        <View style={styles.headerSpacer} />
      </View>

      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          {inputLabel('Name')}
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder="Morning pad work"
            placeholderTextColor={colors.subtle}
            maxLength={80}
          />

          {inputLabel('Date (YYYY-MM-DD)')}
          <TextInput
            style={styles.input}
            value={date}
            onChangeText={setDate}
            placeholder="2026-09-20"
            placeholderTextColor={colors.subtle}
            keyboardType="numbers-and-punctuation"
            autoCapitalize="none"
          />

          {inputLabel('Start time (HH:MM)')}
          <TextInput
            style={styles.input}
            value={time}
            onChangeText={setTime}
            placeholder="18:00"
            placeholderTextColor={colors.subtle}
            keyboardType="numbers-and-punctuation"
            autoCapitalize="none"
          />

          {inputLabel('Location (optional)')}
          <TextInput
            style={styles.input}
            value={location}
            onChangeText={setLocation}
            placeholder="Main gym, ring 1"
            placeholderTextColor={colors.subtle}
            maxLength={120}
          />

          {inputLabel('Notes (optional)')}
          <TextInput
            style={[styles.input, styles.notesInput]}
            value={notes}
            onChangeText={setNotes}
            placeholder="Focus, gear, etc."
            placeholderTextColor={colors.subtle}
            multiline
            maxLength={300}
          />

          <Button title="Create session" onPress={create} loading={saving} disabled={saving} fullWidth />
        </ScrollView>
      </KeyboardAvoidingView>
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
  notesInput: { minHeight: 80, textAlignVertical: 'top' },
});