import { useRouter } from 'expo-router';
import React, { useState } from 'react';
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
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, ImagePlus, X } from 'lucide-react-native';
import { Image as ExpoImage } from 'expo-image';

import { Button } from '@/components/ui/button';
import { Toast } from '@/components/ui/toast';
import { colors, fontSize, letterSpacing, radius, spacing } from '@/constants/theme';
import { feed } from '@/lib/data';
import { describeError } from '@/lib/errors';
import { pickAndCompressImage, type PickedImage } from '@/lib/media';
import { useAuthStore } from '@/stores/auth-store';

const MAX_IMAGES = 4;

export default function CreatePostScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const [caption, setCaption] = useState('');
  const [images, setImages] = useState<PickedImage[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const handlePick = async () => {
    try {
      const picked = await pickAndCompressImage({ allowsEditing: true, aspect: [4, 3], maxDimension: 1024 });
      if (picked) setImages((prev) => (prev.length < MAX_IMAGES ? [...prev, picked] : prev));
    } catch (err) {
      setToast({ type: 'error', message: describeError(err) });
    }
  };

  const removeImage = (index: number) => setImages((prev) => prev.filter((_, i) => i !== index));

  const handlePost = async () => {
    if (!user || (!caption.trim() && images.length === 0)) return;
    setSubmitting(true);
    try {
      await feed.create({
        authorId: user.id,
        caption: caption.trim(),
        images: images.map((img) => img.uri),
      });
      router.back();
    } catch (err) {
      setToast({ type: 'error', message: describeError(err) });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {toast && <Toast message={toast.message} type={toast.type} onDismiss={() => setToast(null)} />}

      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} accessibilityLabel="Back" hitSlop={8}>
          <ArrowLeft size={22} color={colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>New post</Text>
        <View style={styles.headerSpacer} />
      </View>

      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <TextInput
            style={styles.captionInput}
            value={caption}
            onChangeText={setCaption}
            multiline
            placeholder="Write something..."
            placeholderTextColor={colors.subtle}
            textAlignVertical="top"
          />

          <View style={styles.imageRow}>
            {images.map((img, i) => (
              <View key={i} style={styles.imageThumbWrap}>
                <ExpoImage source={{ uri: img.uri }} style={styles.imageThumb} contentFit="cover" />
                <Pressable onPress={() => removeImage(i)} style={styles.removeBtn} hitSlop={4} accessibilityLabel={`Remove image ${i + 1}`}>
                  <X size={12} color={colors.text} strokeWidth={3} />
                </Pressable>
              </View>
            ))}
            {images.length < MAX_IMAGES && (
              <Pressable onPress={handlePick} style={styles.addImageBtn} accessibilityRole="button" accessibilityLabel="Add image" hitSlop={8}>
                <ImagePlus size={20} color={colors.muted} />
                <Text style={styles.addImageText}>Add</Text>
              </Pressable>
            )}
          </View>
          <Text style={styles.hint}>{images.length}/{MAX_IMAGES} images</Text>

          {!caption.trim() && images.length === 0 ? (
            <Text style={styles.hint}>Type a caption or add a photo to enable posting.</Text>
          ) : null}

          <Button title="Post to feed" onPress={handlePost} loading={submitting} disabled={submitting || (!caption.trim() && images.length === 0)} fullWidth />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
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
    flexGrow: 1,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
    gap: spacing.lg,
  },
  captionInput: {
    backgroundColor: colors.panel,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.input,
    padding: spacing.md,
    color: colors.text,
    fontSize: fontSize.body,
    minHeight: 140,
    textAlignVertical: 'top',
  },
  imageRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  imageThumbWrap: {
    width: 80,
    height: 80,
    borderRadius: radius.card,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  imageThumb: { width: '100%', height: '100%' },
  removeBtn: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.error,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addImageBtn: {
    width: 80,
    height: 80,
    borderRadius: radius.card,
    backgroundColor: colors.panel,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  addImageText: { color: colors.muted, fontSize: fontSize.small },
  hint: { color: colors.muted, fontSize: fontSize.small },
});