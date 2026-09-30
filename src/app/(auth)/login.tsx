import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { TextField } from '@/components/ui/text-field';
import { Toast } from '@/components/ui/toast';
import { colors, fontSize, radius, spacing } from '@/constants/theme';
import { describeError } from '@/lib/errors';
import { supabase } from '@/lib/supabase';

function ConcentricHero() {
  const layers = [1, 2, 3, 4, 5, 6];
  return (
    <View style={styles.hero}>
      {layers.map((i) => {
        const size = 320 - i * 42;
        return (
          <View
            key={i}
            style={[
              styles.circle,
              {
                width: size,
                height: size,
                borderRadius: size / 2,
                opacity: 0.9 - i * 0.1,
                borderColor: `rgba(255,255,255,${0.035 + i * 0.012})`,
              },
            ]}
          />
        );
      })}
    </View>
  );
}

export default function LoginScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const wide = width >= 640;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const fade = useRef(new Animated.Value(0)).current;
  const slide = useRef(new Animated.Value(24)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, {
        toValue: 1,
        duration: 480,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(slide, {
        toValue: 0,
        duration: 520,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [fade, slide]);

  const validate = () => {
    let ok = true;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailError('Enter a valid email address.');
      ok = false;
    } else setEmailError('');
    if (!password) {
      setPasswordError('Enter your password.');
      ok = false;
    } else setPasswordError('');
    return ok;
  };

  const handleLogin = async () => {
    if (!validate() || submitting) return;
    setSubmitting(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });
    setSubmitting(false);
    if (error) {
      setToast({ type: 'error', message: describeError(error) });
    }
    // Root layout redirects on success.
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {toast && <Toast message={toast.message} type={toast.type} onDismiss={() => setToast(null)} />}

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Animated.View
            style={[
              styles.card,
              wide && styles.cardWide,
              { opacity: fade, transform: [{ translateY: slide }] },
            ]}
          >
            {wide && (
              <View style={styles.heroPaneWide}>
                <ConcentricHero />
              </View>
            )}

            <View style={styles.formPane}>
              <View style={styles.brandRow}>
                <View style={styles.brandMark}>
                  <Text style={styles.brandMarkText}>ALI</Text>
                </View>
                <View>
                  <Text style={styles.brandTitle}>ALI Boxing Club</Text>
                  <Text style={styles.brandSub}>MEMBER ACCESS</Text>
                </View>
              </View>

              <Text style={styles.title}>Welcome back</Text>
              <Text style={styles.subtitle}>Sign in to your training space.</Text>

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
                  hitSlop={8}
                  style={styles.forgotWrap}
                >
                  <Text style={styles.forgotText}>Forgot password?</Text>
                </Pressable>

                <Button
                  title="Sign in"
                  onPress={handleLogin}
                  loading={submitting}
                  disabled={submitting}
                  fullWidth
                />
              </View>

              <View style={styles.footerRow}>
                <Text style={styles.footerText}>New here?</Text>
                <Pressable
                  onPress={() => router.push('/(auth)/register')}
                  accessibilityRole="button"
                  hitSlop={8}
                >
                  <Text style={styles.footerLink}>Create an account</Text>
                </Pressable>
              </View>

              <Pressable
                onPress={() => Linking.openURL('https://aliboxing.vercel.app')}
                style={styles.webLink}
                accessibilityRole="link"
                hitSlop={8}
              >
                <Text style={styles.webLinkText}>aliboxing.vercel.app</Text>
              </Pressable>
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#1a1a1a' },
  flex: { flex: 1 },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
  },
  card: {
    width: '100%',
    maxWidth: 440,
    backgroundColor: colors.card,
    borderRadius: radius.cardLg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  cardWide: { maxWidth: 740, flexDirection: 'row' },
  heroPaneWide: {
    flex: 1,
    minHeight: 400,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0a0a0a',
  },
  hero: { alignItems: 'center', justifyContent: 'center' },
  circle: { position: 'absolute', borderWidth: 1 },
  formPane: { flex: 1, padding: spacing.xl, gap: spacing.md },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  brandMark: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandMarkText: {
    color: colors.text,
    fontWeight: '900',
    letterSpacing: 1,
    fontSize: 14,
  },
  brandTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  brandSub: {
    color: colors.secondary,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 2,
    marginTop: 2,
  },
  title: {
    color: colors.text,
    fontSize: fontSize.h2,
    fontWeight: '800',
    marginTop: spacing.lg,
    letterSpacing: 0.3,
  },
  subtitle: { color: colors.muted, fontSize: fontSize.body, marginTop: 2 },
  form: { gap: spacing.md, marginTop: spacing.md },
  forgotWrap: { alignSelf: 'flex-end', marginTop: -spacing.xs },
  forgotText: {
    color: colors.secondary,
    fontSize: fontSize.small,
    fontWeight: '700',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.lg,
  },
  footerText: { color: colors.muted, fontSize: fontSize.body },
  footerLink: {
    color: colors.secondary,
    fontSize: fontSize.body,
    fontWeight: '800',
  },
  webLink: { alignItems: 'center', marginTop: spacing.lg },
  webLinkText: { color: colors.subtle, fontSize: fontSize.small },
});
