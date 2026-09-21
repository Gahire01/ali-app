import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Send, Users } from 'lucide-react-native';

import { ChatBubble } from '@/components/chat/chat-bubble';
import { ErrorState } from '@/components/ui/error-state';
import { Spinner } from '@/components/ui/spinner';
import { Toast } from '@/components/ui/toast';
import { colors, fontSize, letterSpacing, radius, spacing } from '@/constants/theme';
import { chat, isStaff } from '@/lib/data';
import { describeError } from '@/lib/errors';
import { useAuthStore } from '@/stores/auth-store';
import type { Message } from '@/types/supabase';

export default function ConversationScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const user = useAuthStore((s) => s.user);
  const profile = useAuthStore((s) => s.profile);
  const router = useRouter();
  const userId = user?.id ?? '';
  const staff = Boolean(profile && isStaff(profile.role));

  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const flatListRef = useRef<FlatList>(null);
  const limitRef = useRef(50);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const data = await chat.messages(id, limitRef.current);
      setMessages(data);
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

  useEffect(() => {
    if (!id) return;
    const unsub = chat.subscribe(id, (msg) => {
      setMessages((prev) => [...prev, msg]);
      if (userId) void chat.markRead(id, userId);
    });
    return unsub;
  }, [id, userId]);

  useEffect(() => {
    if (userId && id) void chat.markRead(id, userId);
  }, [id, userId, messages.length]);

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages.length]);

  const send = async () => {
    const body = text.trim();
    if (!body || !id || !userId || sending) return;
    setSending(true);
    setText('');
    try {
      await chat.send(id, userId, body);
    } catch (err) {
      setText(body);
      setToast({ type: 'error', message: describeError(err) });
    } finally {
      setSending(false);
    }
  };

  if (loading) return <Spinner fullscreen />;

  if (error) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={8} accessibilityLabel="Back">
            <ArrowLeft size={22} color={colors.text} />
          </Pressable>
          <View style={styles.headerSpacer} />
        </View>
        <ErrorState message={error} onRetry={() => void load()} retryLoading={loading} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {toast && <Toast message={toast.message} type={toast.type} onDismiss={() => setToast(null)} />}

      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={8} accessibilityLabel="Back">
          <ArrowLeft size={22} color={colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Chat</Text>
        <View style={styles.headerAction}>
          {staff ? (
            <Pressable
              onPress={() => router.push(`/(tabs)/chat/members/${id}`)}
              style={styles.backBtn}
              hitSlop={8}
              accessibilityLabel="Manage conversation members"
            >
              <Users size={18} color={colors.text} />
            </Pressable>
          ) : (
            <View style={styles.headerSpacer} />
          )}
        </View>
      </View>

      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={0}>
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <ChatBubble message={item} />}
          contentContainerStyle={styles.list}
          contentInsetAdjustmentBehavior="automatic"
        />

        <View style={styles.inputBar}>
          <TextInput
            style={styles.input}
            value={text}
            onChangeText={setText}
            placeholder="Type a message..."
            placeholderTextColor={colors.subtle}
            multiline
            maxLength={2000}
          />
          <Pressable
            onPress={send}
            disabled={!text.trim() || sending}
            style={({ pressed }) => [styles.sendBtn, (!text.trim() || sending) && styles.sendBtnDisabled, pressed && styles.sendBtnPressed]}
            accessibilityLabel="Send message"
            hitSlop={8}
          >
            <Send size={18} color={colors.text} />
          </Pressable>
        </View>
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
  headerAction: { width: 44, alignItems: 'flex-end' },
  list: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.md,
    paddingBottom: spacing.md,
    gap: 4,
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    backgroundColor: colors.panel,
  },
  input: {
    flex: 1,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    color: colors.text,
    fontSize: fontSize.body,
    maxHeight: 100,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: { opacity: 0.4 },
  sendBtnPressed: { opacity: 0.8 },
});