import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  FlatList,
  Keyboard,
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

  // Send button animation
  const sendScale = useRef(new Animated.Value(1)).current;
  const sendRotate = useRef(new Animated.Value(0)).current;

  // Shake animation for input on send error
  const inputShake = useRef(new Animated.Value(0)).current;

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
    }, [load]),
  );

  useEffect(() => {
    if (!id) return;
    const unsub = chat.subscribe(id, (msg) => {
      setMessages((prev) => {
        // Avoid duplicates (optimistic insert may already have this id)
        if (prev.some((m) => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
      if (userId) void chat.markRead(id, userId);
    });
    return unsub;
  }, [id, userId]);

  useEffect(() => {
    if (userId && id) void chat.markRead(id, userId);
  }, [id, userId, messages.length]);

  // Auto-scroll to bottom when a new message arrives
  useEffect(() => {
    if (messages.length > 0) {
      const t = setTimeout(
        () => flatListRef.current?.scrollToEnd({ animated: true }),
        80,
      );
      return () => clearTimeout(t);
    }
  }, [messages.length]);

  // Animate the send button when text goes from empty to non-empty
  useEffect(() => {
    Animated.timing(sendRotate, {
      toValue: text.trim() ? 1 : 0,
      duration: 250,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [text, sendRotate]);

  const shakeInput = () => {
    Animated.sequence([
      Animated.timing(inputShake, { toValue: 1, duration: 60, useNativeDriver: true }),
      Animated.timing(inputShake, { toValue: -1, duration: 60, useNativeDriver: true }),
      Animated.timing(inputShake, { toValue: 0.6, duration: 60, useNativeDriver: true }),
      Animated.timing(inputShake, { toValue: -0.6, duration: 60, useNativeDriver: true }),
      Animated.timing(inputShake, { toValue: 0, duration: 60, useNativeDriver: true }),
    ]).start();
  };

  const pressSend = () => {
    Animated.sequence([
      Animated.timing(sendScale, { toValue: 0.85, duration: 80, useNativeDriver: true }),
      Animated.spring(sendScale, { toValue: 1, damping: 8, stiffness: 260, useNativeDriver: true }),
    ]).start();
  };

  const send = async () => {
    const body = text.trim();
    if (!body || !id || !userId || sending) return;

    pressSend();

    // Optimistic insert
    const tempId = `temp-${Date.now()}`;
    const optimistic: Message = {
      id: tempId,
      conversation_id: id,
      sender_id: userId,
      body,
      read_at: null,
      created_at: new Date().toISOString(),
    } as Message;

    setMessages((prev) => [...prev, optimistic]);
    setText('');
    Keyboard.dismiss();

    setSending(true);
    try {
      const real = await chat.send(id, userId, body);
      // Replace the temp with the real row if the API returned it
      if (real && typeof real === 'object' && 'id' in real) {
        setMessages((prev) =>
          prev.map((m) => (m.id === tempId ? ({ ...m, ...real } as Message) : m)),
        );
      }
    } catch (err) {
      // Roll back
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      setText(body);
      shakeInput();
      setToast({ type: 'error', message: describeError(err) });
    } finally {
      setSending(false);
    }
  };

  // Web: send on Enter, new line on Shift+Enter
  const onKeyPress = (e: { nativeEvent: { key: string; shiftKey?: boolean } }) => {
    if (Platform.OS !== 'web') return;
    if (e.nativeEvent.key === 'Enter' && !e.nativeEvent.shiftKey) {
      e.preventDefault?.();
      void send();
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

  const canSend = text.trim().length > 0 && !sending;

  const sendButtonRotate = sendRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const sendButtonBg = sendRotate.interpolate({
    inputRange: [0, 1],
    outputRange: [colors.panel, colors.primary],
  });

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

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={({ item, index }) => (
            <ChatBubble
              message={item}
              isLatestOwn={index === messages.length - 1 && item.sender_id === userId}
            />
          )}
          contentContainerStyle={styles.list}
          contentInsetAdjustmentBehavior="automatic"
          keyboardShouldPersistTaps="handled"
          onContentSizeChange={() => {
            // Keep pinned to the bottom as content grows
            flatListRef.current?.scrollToEnd({ animated: false });
          }}
        />

        <Animated.View
          style={[
            styles.inputBar,
            {
              transform: [
                {
                  translateX: inputShake.interpolate({
                    inputRange: [-1, 0, 1],
                    outputRange: [-8, 0, 8],
                  }),
                },
              ],
            },
          ]}
        >
          <TextInput
            style={styles.input}
            value={text}
            onChangeText={setText}
            placeholder="Type a message..."
            placeholderTextColor={colors.subtle}
            multiline
            maxLength={2000}
            onKeyPress={onKeyPress}
            blurOnSubmit={false}
            returnKeyType="send"
            onSubmitEditing={() => void send()}
          />

          <Animated.View style={{ transform: [{ scale: sendScale }] }}>
            <Pressable
              onPress={send}
              disabled={!canSend}
              style={styles.sendBtnWrap}
              accessibilityLabel="Send message"
              hitSlop={8}
            >
              <Animated.View
                style={[
                  styles.sendBtn,
                  { backgroundColor: sendButtonBg },
                  !canSend && styles.sendBtnDisabled,
                ]}
              >
                <Animated.View style={{ transform: [{ rotate: sendButtonRotate }] }}>
                  <Send size={18} color={colors.text} />
                </Animated.View>
              </Animated.View>
            </Pressable>
          </Animated.View>
        </Animated.View>
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
    minHeight: 44,
  },
  sendBtnWrap: { alignItems: 'center', justifyContent: 'center' },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: { opacity: 0.4 },
});
