import React, { useCallback, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { MessagesSquare, Plus } from 'lucide-react-native';

import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { ScreenHeader } from '@/components/ui/screen-header';
import { SkeletonCard } from '@/components/ui/skeleton';
import { Toast } from '@/components/ui/toast';
import { ConversationRow } from '@/components/chat/conversation-row';
import { colors, spacing } from '@/constants/theme';
import { chat, isStaff, type ConversationSummary } from '@/lib/data';
import { describeError } from '@/lib/errors';
import { useAuthStore } from '@/stores/auth-store';

export default function ChatListScreen() {
  const user = useAuthStore((s) => s.user);
  const profile = useAuthStore((s) => s.profile);
  const router = useRouter();
  const userId = user?.id ?? '';
  const staff = Boolean(profile && isStaff(profile.role));

  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const load = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const list = await chat.list(userId);
      setConversations(list);
      setError(null);
    } catch (err) {
      setError(describeError(err));
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load])
  );

  const openConversation = (conversationId: string) => {
    router.push(`/(tabs)/chat/${conversationId}`);
  };

  return (
    <View style={styles.container}>
      {toast && <Toast message={toast.message} type={toast.type} onDismiss={() => setToast(null)} />}
      <ScreenHeader
        title="Chat"
        action={
          staff ? (
            <Pressable
              onPress={() => router.push('/(tabs)/chat/new')}
              style={({ pressed }) => [styles.addBtn, pressed && styles.addBtnPressed]}
              accessibilityLabel="New conversation"
              hitSlop={8}
            >
              <Plus size={18} color={colors.text} />
            </Pressable>
          ) : undefined
        }
      />

      {loading ? (
        <View style={styles.list}><SkeletonCard /><SkeletonCard /><SkeletonCard /></View>
      ) : error ? (
        <ErrorState message={error} onRetry={() => void load()} retryLoading={loading} />
      ) : conversations.length === 0 ? (
        <EmptyState
          icon={MessagesSquare}
          title="No conversations yet"
          message="Messages from coaches and teammates will appear here."
        />
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={(item) => item.conversation.id}
          renderItem={({ item }) => (
            <Pressable onPress={() => openConversation(item.conversation.id)}>
              <ConversationRow item={item} />
            </Pressable>
          )}
          contentContainerStyle={styles.list}
          contentInsetAdjustmentBehavior="automatic"
          refreshControl={
            <RefreshControl tintColor={colors.muted} refreshing={false} onRefresh={() => void load()} />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  list: { paddingBottom: spacing.xxl },
  addBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.panel,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtnPressed: { opacity: 0.7 },
});