import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BrandLockup } from '@/components/brand-lockup';
import { Button } from '@/components/ui/button';
import { TextField } from '@/components/ui/text-field';
import { Toast } from '@/components/ui/toast';
import { colors, fontSize, spacing } from '@/constants/theme';
import { describeError } from '@/lib/errors';
import { supabase } from '@/lib/supabase';
import { signInWithGoogle } from '@/lib/social-auth';

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const validate = () => {
    let ok = true;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailError('Enter a valid email address.');
      ok = false;
    } else {
      setEmailError('');
    }
    if (!password) {
      setPasswordError('Enter your password.');
      ok = false;
    } else {
      setPasswordError('');
    }
    return ok;
  };

  const handleLogin = async () => {
    if (!validate() || submitting) return;
    setSubmitting(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setSubmitting(false);

    if (error) {
      setToast({ type: 'error', message: describeError(error) });
      return;
    }
    // Root layout redirects based on profile status (pending → pending screen).
  };

  const handleGoogle = async () => {
    if (googleLoading) return;
    setGoogleLoading(true);
    const result = await signInWithGoogle();
    setGoogleLoading(false);
    if (!result.ok) {
      setToast({ type: 'error', message: describeError(result.error) });
    }
    // success: root layout redirects by status.
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {toast && <Toast message={toast.message} type={toast.type} onDismiss={() => setToast(null)} />}
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <BrandLockup />

          <View style={styles.form}>
            <TextField
              label="Email"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
              textContentType="emailAddress"
              error={emailError}
              required
            />
            <TextField
              label="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              textContentType="password"
              error={passwordError}
              required
            />

            <Pressable
              onPress={() => router.push('/(auth)/reset-password')}
              accessibilityRole="button"
              hitSlop={8}>
              <Text style={styles.linkText}>Forgot password?</Text>
            </Pressable>

            <Button
              title="Sign In"
              onPress={handleLogin}
              loading={submitting}
              disabled={submitting || googleLoading}
              fullWidth
            />

            <View style={styles.dividerRow}>
              <View style={styles.divider} />
              <Text style={styles.dividerText}>OR</Text>
              <View style={styles.divider} />
            </View>

            <Button
              title="Continue with Google"
              variant="ghost"
              onPress={handleGoogle}
              loading={googleLoading}
              disabled={submitting || googleLoading}
              fullWidth
            />
          </View>

          <View style={styles.footerRow}>
            <Text style={styles.footerText}>New member?</Text>
            <Pressable
              onPress={() => router.push('/(auth)/register')}
              accessibilityRole="button"
              hitSlop={8}>
              <Text style={styles.linkText}>Join the club</Text>
            </Pressable>
          </View>

          <Pressable
            onPress={() => Linking.openURL('https://aliboxing.vercel.app')}
            accessibilityRole="link"
            hitSlop={8}
            style={styles.webLink}>
            <Text style={styles.webLinkText}>aliboxing.vercel.app</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  flex: { flex: 1 },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xxl,
    gap: spacing.xl,
  },
  form: {
    gap: spacing.md,
  },
  linkText: {
    color: colors.secondary,
    fontSize: fontSize.body,
    fontWeight: '700',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginVertical: spacing.sm,
  },
  divider: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
  },
  dividerText: {
    color: colors.muted,
    fontSize: fontSize.small,
    letterSpacing: 2,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  footerText: {
    color: colors.muted,
    fontSize: fontSize.body,
  },
  webLink: {
    alignItems: 'center',
  },
  webLinkText: {
    color: colors.subtle,
    fontSize: fontSize.caption,
  },
});