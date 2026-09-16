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
  const [submitted, setSubmitted] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'error' } | null>(null);

  const validate = () => {
    const next: Record<string, string> = {};
    if (fullName.trim().length < 2) next.fullName = 'Enter your full name.';
    if (!PHONE_RE.test(phone)) next.phone = 'Enter a valid phone number.';
    if (!EMAIL_RE.test(email)) next.email = 'Enter a valid email address.';
    if (password.length < 8) next.password = 'Password must be at least 8 characters.';
    if (isMinor) {
      if (guardianName.trim().length < 2) next.guardianName = 'Enter the parent or guardian name.';
      if (!PHONE_RE.test(guardianPhone)) next.guardianPhone = 'Enter a valid guardian phone number.';
    }
    if (!termsAccepted) next.terms = 'You must accept the terms to join.';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handlePickPhoto = async () => {
    try {
      const picked = await pickAndCompressImage({ allowsEditing: true, aspect: [1, 1] });
      if (picked) setPhoto(picked);
    } catch (err) {
      setToast({ type: 'error', message: describeError(err) });
    }
  };

  const uploadAvatar = async (userId: string, image: PickedImage) => {
    const path = `avatars/${userId}.jpg`;
    const response = await fetch(image.uri);
    const arrayBuffer = await response.arrayBuffer();
    const { error: uploadError } = await supabase.storage
      .from('club-media')
      .upload(path, arrayBuffer, {
        contentType: 'image/jpeg',
        upsert: true,
      });
    if (uploadError) throw uploadError;
    return `avatars/${userId}.jpg`;
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
      if (!data.user) throw new Error('No account was created. Please try again.');

      if (photo) {
        try {
          const photoUrl = await uploadAvatar(data.user.id, photo);
          await supabase.from('profiles').update({ photo_url: photoUrl }).eq('id', data.user.id);
        } catch {
          // Avatar is optional; registration still succeeded.
        }
      }

      setSubmitted(true);
    } catch (err) {
      setToast({ type: 'error', message: describeError(err) });
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.successCard}>
          <View style={styles.successCheck}>
            <Check size={40} color={colors.background} strokeWidth={3} />
          </View>
          <Text style={styles.successTitle}>Registration received</Text>
          <Text style={styles.successBody}>
            Two quick steps before you&apos;re in:
          </Text>
          <View style={styles.steps}>
            <Text style={styles.step}>1. Confirm your email address using the link we just sent to {email}.</Text>
            <Text style={styles.step}>2. A coach will review your application and approve your membership.</Text>
          </View>
          <Text style={styles.successBody}>
            You&apos;ll receive an email and a push notification when you&apos;re approved.
          </Text>
          <Button
            title="Back to sign in"
            onPress={() => router.replace('/(auth)/login')}
            fullWidth
          />
        </View>
      </SafeAreaView>
    );
  }

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
          <View style={styles.header}>
            <Text style={styles.title}>Join the club</Text>
            <Text style={styles.subtitle}>Register for coach-reviewed membership.</Text>
          </View>

          <Pressable
            style={styles.photoPicker}
            onPress={handlePickPhoto}
            accessibilityRole="button"
            accessibilityLabel="Add profile photo">
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
                <Text style={styles.photoHint}>Add a profile photo (optional)</Text>
              </>
            )}
          </Pressable>

          <View style={styles.form}>
            <TextField label="Full name" value={fullName} onChangeText={setFullName} autoComplete="name" textContentType="name" error={errors.fullName} required />
            <TextField label="Phone" value={phone} onChangeText={setPhone} keyboardType="phone-pad" autoComplete="tel" textContentType="telephoneNumber" error={errors.phone} required />
            <TextField label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" autoComplete="email" keyboardType="email-address" textContentType="emailAddress" error={errors.email} required />
            <TextField label="Password" value={password} onChangeText={setPassword} secureTextEntry autoComplete="new-password" textContentType="newPassword" error={errors.password} required />

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
                accessibilityLabel="Minor account toggle"
              />
            </View>

            {isMinor && (
              <View style={styles.guardianBox}>
                <TextField label="Parent / guardian name" value={guardianName} onChangeText={setGuardianName} autoComplete="name" error={errors.guardianName} required />
                <TextField label="Parent / guardian phone" value={guardianPhone} onChangeText={setGuardianPhone} keyboardType="phone-pad" autoComplete="tel" error={errors.guardianPhone} required />
              </View>
            )}

            <Pressable
              style={styles.termsRow}
              onPress={() => {
                setTermsAccepted((value) => !value);
                setErrors((prev) => ({ ...prev, terms: '' }));
              }}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: termsAccepted }}
              accessibilityLabel="Accept the club terms">
              <View style={[styles.termsBox, termsAccepted && styles.termsBoxChecked]}>
                {termsAccepted && <Check size={16} color={colors.background} strokeWidth={3} />}
              </View>
              <Text style={styles.termsText}>
                I understand this is a coach-controlled club community and my membership depends on
                coach approval.
              </Text>
            </Pressable>
            {!!errors.terms && <Text style={styles.termsError}>{errors.terms}</Text>}

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
  photoPreview: {
    width: 96,
    height: 96,
    borderRadius: 48,
    overflow: 'hidden',
  },
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
  termsRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.sm },
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
  termsText: { flex: 1, color: colors.muted, fontSize: fontSize.caption, lineHeight: 18 },
  termsError: { color: colors.error, fontSize: fontSize.small },
  footerRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: spacing.xs },
  footerText: { color: colors.muted, fontSize: fontSize.body },
  footerLink: { color: colors.secondary, fontSize: fontSize.body, fontWeight: '700' },
  successCard: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  successCheck: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.success,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  successTitle: {
    color: colors.text,
    fontSize: fontSize.h1,
    fontWeight: '800',
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: spacing.md,
  },
  successBody: {
    color: colors.muted,
    fontSize: fontSize.body,
    lineHeight: 22,
    textAlign: 'center',
  },
  steps: { gap: spacing.sm, marginVertical: spacing.sm },
  step: {
    color: colors.text,
    fontSize: fontSize.body,
    lineHeight: 22,
  },
});