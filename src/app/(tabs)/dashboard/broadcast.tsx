import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, ChevronDown } from 'lucide-react-native';

import { Button } from '@/components/ui/button';
import { ChoiceSheet } from '@/components/ui/choice-sheet';
import { Toast } from '@/components/ui/toast';
import { colors, fontSize, letterSpacing, radius, spacing } from '@/constants/theme';
import { admin } from '@/lib/data';
import { describeError } from '@/lib/errors';
import { useAuthStore } from '@/stores/auth-store';

const PRESETS = ['Training Now', 'Reminder', 'Urgent', 'Announcement'];

export default function BroadastScreen() {
  const router = useRouter();
  const sentBy = useAuthStore((s) => s.user?.id ?? '');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [target, setTarget] = useState(PRESETS[0]);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const send = async () => {
    if (sending) return;
    if (!title.trim() || !body.trim()) {
      setToast({ type: 'error', message: 'Add a title and message.' });
      return;
    }
    setSending(true);
    try {
      await admin.announce({ sentBy, title: title.trim(), body: body.trim(), target });
      router.back();
    } catch (err) {
      setToast({ type: 'error', message: describeError(err) });
      setSending(false);
    }
  };

  return (
    <View style={styles.container}>
      {toast && <Toast message={toast.message} type={toast.type} onDismiss={() => setToast(null)} />}

      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={8} accessibilityLabel="Back">
          <ArrowLeft size={22} color={colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Broadcast</Text>
        <View style={styles.headerSpacer} />
      </View>

      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <Text style={styles.label}>Type</Text>
          <Pressable onPress={() => setSheetOpen(true)} style={styles.field}>
            <Text style={styles.fieldValue}>{target}</Text>
            <ChevronDown size={16} color={colors.muted} />
          </Pressable>

          <Text style={styles.label}>Title</Text>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder="Tomorrow's sparring round is CANCELLED"
            placeholderTextColor={colors.subtle}
            maxLength={80}
          />

          <Text style={styles.label}>Message</Text>
          <TextInput
            style={[styles.input, styles.bodyInput]}
            value={body}
            onChangeText={setBody}
            placeholder="Bring your own wraps and arrive 15 minutes early. Stay sharp."
            placeholderTextColor={colors.subtle}
            multiline
            maxLength={500}
          />

          <Text style={styles.hint}>Sent as a push notification to every member in the club app.</Text>

          <Button title="Send broadcast" onPress={send} loading={sending} disabled={sending} fullWidth />
        </ScrollView>
      </KeyboardAvoidingView>

      <ChoiceSheet
        visible={sheetOpen}
        title="Type"
        options={PRESETS}
        selected={target}
        onSelect={(v) => { setTarget(v); setSheetOpen(false); }}
        onClose={() => setSheetOpen(false)}
      />
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
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.panel,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.input,
    padding: spacing.md,
  },
  fieldValue: { color: colors.text, fontSize: fontSize.body, fontWeight: '700' },
  input: {
    backgroundColor: colors.panel,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.input,
    padding: spacing.md,
    color: colors.text,
    fontSize: fontSize.body,
  },
  bodyInput: { minHeight: 110, textAlignVertical: 'top' },
  hint: { color: colors.muted, fontSize: fontSize.small, paddingVertical: spacing.xs },
});