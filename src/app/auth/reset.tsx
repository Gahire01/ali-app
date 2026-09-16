import { useRouter } from 'expo-router';
import * as Linking from 'expo-linking';
import React, { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { TextField } from '@/components/ui/text-field';
import { Toast } from '@/components/ui/toast';
import { colors, fontSize, spacing } from '@/constants/theme';
import { describeError } from '@/lib/errors';
import { supabase } from '@/lib/supabase';

export default function ResetPasswordHandlerScreen() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'error' } | null>(null);

  useEffect(() => {
    let active = true;
    const handleUrl = async (rawUrl: string) => {
      const url = Linking.parse(rawUrl);
      const code = url.queryParams?.code;
      if (typeof code === 'string') {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) {
          if (active) router.replace('/(auth)/reset-password');
          return;
        }
      }
      if (active) setReady(true);
    };

    Linking.getInitialURL().then((url) => {
      if (url) void handleUrl(url);
      else setReady(true);
    });
    const sub = Linking.addEventListener('url', ({ url }) => void handleUrl(url));
    return () => {
      active = false;
      sub.remove();
    };
  }, [router]);

  const handleSave = async () => {
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    setError('');
    setSubmitting(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setSubmitting(false);
    if (updateError) {
      setToast({ type: 'error', message: describeError(updateError) });
      return;
    }
    router.replace('/');
  };

  if (!ready) return <Spinner fullscreen />;

  return (
    <SafeAreaView style={styles.safeArea}>
      {toast && <Toast message={toast.message} type={toast.type} onDismiss={() => setToast(null)} />}
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.container}>
          <Text style={styles.title}>Set a new password</Text>
          <Text style={styles.subtitle}>Choose a strong password to get back in.</Text>
          <TextField
            label="New password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete="new-password"
            textContentType="newPassword"
            error={error}
            required
          />
          <TextField
            label="Confirm password"
            value={confirm}
            onChangeText={setConfirm}
            secureTextEntry
            autoComplete="new-password"
            textContentType="newPassword"
            required
          />
          <Button title="Update password" onPress={handleSave} loading={submitting} fullWidth />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  title: {
    color: colors.text,
    fontSize: fontSize.h1,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1,
    textAlign: 'center',
  },
  subtitle: {
    color: colors.muted,
    fontSize: fontSize.body,
    lineHeight: 22,
    textAlign: 'center',
  },
});