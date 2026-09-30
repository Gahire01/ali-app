import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Check, ImagePlus } from 'lucide-react-native';

import { Button } from '@/components/ui/button';
import { TextField } from '@/components/ui/text-field';
import { Toast } from '@/components/ui/toast';
import { colors, fontSize, radius, spacing } from '@/constants/theme';
import { describeError } from '@/lib/errors';
import { pickAndCompressImage, type PickedImage } from '@/lib/media';
import { supabase } from '@/lib/supabase';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^[+0-9][0-9 ()-]{6,}$/;

export default function RegisterScreen() {
  const router = useRouter();

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isMinor, setIsMinor] = useState(false);
  const [guardianName, setGuardianName] = useState('');
  const [guardianPhone, setGuardianPhone] = useState('');
  const [photo, setPhoto] = useState<PickedImage | null>(null);
  const [termsAccepted, setTermsAccepted] = useState(false);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'error' | 'success' } | null>(null);

  const validate = () => {
    const next: Record<string, string> = {};
    if (!photo) next.photo = 'A profile photo is required.';
    if (fullName.trim().length < 2) next.fullName = 'Enter your full name.';
    if (!PHONE_RE.test(phone)) next.phone = 'Enter a valid phone number.';
    if (!EMAIL_RE.test(email)) next.email = 'Enter a valid email address.';
    if (password.length < 8) next.password = 'Password must be at least 8 characters.';
    if (isMinor) {
      if (guardianName.trim().length < 2) next.guardianName = 'Enter the parent or guardian name.';
      if (!PHONE_RE.test(guardianPhone)) next.guardianPhone = 'Enter a valid guardian phone.';
    }
    if (!termsAccepted) next.terms = 'Please accept the terms to continue.';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const pickPhoto = async () => {
    try {
      const picked = await pickAndCompressImage({ allowsEditing: true, aspect: [1, 1] });
      if (picked) {
        setPhoto(picked);
        setErrors((prev) => ({ ...prev, photo: '' }));
      }
    } catch (err) {
      setToast({ type: 'error', message: describeError(err) });
    }
  };

  const uploadAvatar = async (userId: string, image: PickedImage) => {
    const path = `avatars/${userId}.jpg`;
    const response = await fetch(image.uri);
    const arrayBuffer = await response.arrayBuffer();
    const { error } = await supabase.storage
      .from('club-media')
      .upload(path, arrayBuffer, { contentType: 'image/jpeg', upsert: true });
    if (error) throw error;
    return path;
  };

  const handleSubmit = async () => {
    if (!validate() || submitting) return;
    setSubmitting(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: {
          data: {
            full_name: fullName.trim(),
            phone: phone.trim(),
            is_minor: isMinor,
            guardian_name: isMinor ? guardianName.trim() : null,
            guardian_phone: isMinor ? guardianPhone.trim() : null,
          },
        },
      });

      if (error) throw error;
      if (!data.user) throw new Error('Account was not created. Please try again.');

      // Upload the (required) profile photo
      const photoPath = await uploadAvatar(data.user.id, photo!);
      await supabase
        .from('profiles')
        .update({ photo_url: photoPath, status: 'approved' })
        .eq('id', data.user.id);

      // With email confirmation OFF, Supabase returns a live session.
      // We're already signed in — drop the user straight into the app.
      if (data.session) {
        router.replace('/(tabs)/home');
        return;
      }

      // Fallback (shouldn't happen now): ask them to sign in manually.
      setToast({ type: 'success', message: 'Account created. Signing you in…' });
      setTimeout(() => router.replace('/(auth)/login'), 800);
    } catch (err) {
      setToast({ type: 'error', message: describeError(err) });
    } finally {
      setSubmitting(false);
    }
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
          <View style={styles.header}>
            <Text style={styles.title}>Join the club</Text>
            <Text style={styles.subtitle}>Create your account to start training.</Text>
          </View>

          <Pressable
            style={styles.photoPicker}
            onPress={pickPhoto}
            accessibilityRole="button"
            accessibilityLabel="Add profile photo"
          >
            {photo ? (
              <>
                <View style={styles.photoPreview}>
                  <Image source={{ uri: photo.uri }} style={styles.photoImage} />
                </View>
                <Text style={styles.photoHint}>Tap to change photo</Text>
              </>
            ) : (
              <>
                <View style={styles.photoPlaceholder}>
                  <ImagePlus size={28} color={colors.muted} />
                </View>
                <Text style={styles.photoHint}>Add a profile photo</Text>
              </>
            )}
          </Pressable>
          {!!errors.photo && <Text style={styles.errorText}>{errors.photo}</Text>}

          <View style={styles.form}>
            <TextField
              label="Full name"
              value={fullName}
              onChangeText={setFullName}
              autoComplete="name"
              textContentType="name"
              error={errors.fullName}
              required
            />
            <TextField
              label="Phone"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              autoComplete="tel"
              textContentType="telephoneNumber"
              error={errors.phone}
              required
            />
            <TextField
              label="Email"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
              textContentType="emailAddress"
              error={errors.email}
              required
            />
            <TextField
              label="Password (8+ characters)"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoComplete="new-password"
              textContentType="newPassword"
              error={errors.password}
              required
            />

            <View style={styles.minorRow}>
              <View style={styles.minorTextBlock}>
                <Text style={styles.minorTitle}>This is a minor account</Text>
                <Text style={styles.minorSubtitle}>For members under 18</Text>
              </View>
              <Switch
                value={isMinor}
                onValueChange={setIsMinor}
                trackColor={{ false: colors.panel, true: colors.primary }}
                thumbColor={colors.text}
              />
            </View>

            {isMinor && (
              <View style={styles.guardianBox}>
                <TextField
                  label="Parent / guardian name"
                  value={guardianName}
                  onChangeText={setGuardianName}
                  error={errors.guardianName}
                  required
                />
                <TextField
                  label="Parent / guardian phone"
                  value={guardianPhone}
                  onChangeText={setGuardianPhone}
                  keyboardType="phone-pad"
                  error={errors.guardianPhone}
                  required
                />
              </View>
            )}

            <Pressable
              style={styles.termsRow}
              onPress={() => {
                setTermsAccepted((v) => !v);
                setErrors((prev) => ({ ...prev, terms: '' }));
              }}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: termsAccepted }}
            >
              <View style={[styles.termsBox, termsAccepted && styles.termsBoxChecked]}>
                {termsAccepted && <Check size={16} color={colors.background} strokeWidth={3} />}
              </View>
              <Text style={styles.termsText}>
                I accept the club rules and understand membership is coach-managed.
              </Text>
            </Pressable>
            {!!errors.terms && <Text style={styles.errorText}>{errors.terms}</Text>}

            <Button
              title="Create account"
              onPress={handleSubmit}
              loading={submitting}
              disabled={submitting}
              fullWidth
            />
          </View>

          <View style={styles.footerRow}>
            <Text style={styles.footerText}>Already a member?</Text>
            <Pressable onPress={() => router.back()} accessibilityRole="button" hitSlop={8}>
              <Text style={styles.footerLink}>Sign in</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  scroll: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
    gap: spacing.lg,
  },
  header: { gap: spacing.xs },
  title: {
    color: colors.text,
    fontSize: fontSize.headline,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  subtitle: { color: colors.muted, fontSize: fontSize.body },
  photoPicker: { alignItems: 'center', gap: spacing.sm },
  photoPlaceholder: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.panel,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoPreview: { width: 96, height: 96, borderRadius: 48, overflow: 'hidden' },
  photoImage: { width: 96, height: 96 },
  photoHint: { color: colors.muted, fontSize: fontSize.caption },
  form: { gap: spacing.md },
  minorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.panel,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  minorTextBlock: { flex: 1, gap: 2 },
  minorTitle: { color: colors.text, fontSize: fontSize.body, fontWeight: '700' },
  minorSubtitle: { color: colors.muted, fontSize: fontSize.caption },
  guardianBox: { gap: spacing.md },
  termsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },
  termsBox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.panel,
    alignItems: 'center',
    justifyContent: 'center',
  },
  termsBoxChecked: {
    backgroundColor: colors.secondary,
    borderColor: colors.secondary,
  },
  termsText: {
    flex: 1,
    color: colors.muted,
    fontSize: fontSize.caption,
    lineHeight: 18,
  },
  errorText: { color: colors.error, fontSize: fontSize.small, textAlign: 'center' },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.xs,
  },
  footerText: { color: colors.muted, fontSize: fontSize.body },
  footerLink: {
    color: colors.secondary,
    fontSize: fontSize.body,
    fontWeight: '700',
  },
});
