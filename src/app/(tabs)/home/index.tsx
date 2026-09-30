import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Newspaper, Plus } from 'lucide-react-native';

import { ErrorState } from '@/components/ui/error-state';
import { EmptyState } from '@/components/ui/empty-state';
import { ScreenHeader } from '@/components/ui/screen-header';
import { SkeletonCard } from '@/components/ui/skeleton';
import { Toast } from '@/components/ui/toast';
import { PostCard } from '@/components/feed/post-card';
import { colors, fontSize, spacing } from '@/constants/theme';
import { feed, isStaff, type FeedPost } from '@/lib/data';
import { useAuthStore } from '@/stores/auth-store';
import { subscribeToBus } from '@/lib/mock';
import { isPreviewMock } from '@/lib/env';
import { describeError } from '@/lib/errors';
import { supabase } from '@/lib/supabase';
import { withTimeout } from '@/lib/with-timeout';

const PAGE_SIZE = 12;
const LOAD_TIMEOUT = 8000;

export default function HomeFeedScreen() {
  const user = useAuthStore((s) => s.user);
  const profile = useAuthStore((s) => s.profile);
  const initialized = useAuthStore(
    (s) => (s as unknown as { initialized?: boolean }).initialized ?? true,
  );
  const router = useRouter();
  const userId = user?.id ?? '';
  const staff = Boolean(profile && isStaff(profile.role));

  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const offsetRef = useRef(0);
  const hasMoreRef = useRef(true);
  const mountedRef = useRef(true);

  const loadPage = useCallback(
    async (mode: 'initial' | 'refresh' | 'more' = 'initial') => {
      if (!userId) {
        setLoading(false);
        setRefreshing(false);
        setLoadingMore(false);
        return;
      }
      if (mode === 'more' && !hasMoreRef.current) return;

      if (mode === 'initial') {
        offsetRef.current = 0;
        hasMoreRef.current = true;
        setLoading(true);
      } else if (mode === 'refresh') {
        offsetRef.current = 0;
        hasMoreRef.current = true;
        setRefreshing(true);
      } else {
        setLoadingMore(true);
      }

      try {
        const page = await withTimeout(
          feed.list(userId, offsetRef.current, PAGE_SIZE),
          LOAD_TIMEOUT,
          'Loading feed',
        );
        if (!mountedRef.current) return;
        setPosts((prev) => (mode === 'more' ? [...prev, ...page] : page));
        hasMoreRef.current = page.length === PAGE_SIZE;
        offsetRef.current += PAGE_SIZE;
        setError(null);
      } catch (err) {
        if (!mountedRef.current) return;
        setError(describeError(err));
      } finally {
        if (mountedRef.current) {
          setLoading(false);
          setRefreshing(false);
          setLoadingMore(false);
        }
      }
    },
    [userId],
  );

  useEffect(() => {
    if (!initialized) return;
    if (!userId) {
      setLoading(false);
      return;
    }
    void loadPage('initial');
  }, [initialized, userId, loadPage]);

  useFocusEffect(
    useCallback(() => {
      mountedRef.current = true;
      if (userId) void loadPage('initial');
      return () => {
        mountedRef.current = false;
      };
    }, [loadPage, userId]),
  );

  useEffect(() => {
    if (!isPreviewMock && userId) {
      const channel = supabase
        .channel('feed-list')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'posts' }, () => {
          void loadPage('refresh');
        })
        .subscribe();
      return () => {
        void channel.unsubscribe();
      };
    }
    const unsub = subscribeToBus('feed', 'reload', (() => {
      if (userId) void loadPage('refresh');
    }) as never);
    return unsub;
  }, [loadPage, userId]);

  const toggleLike = useCallback(
    async (postId: string, _currentlyLiked: boolean) => {
      if (!userId) return;
      try {
        await feed.toggleLike(postId, userId);
      } catch (err) {
        setToast({ type: 'error', message: describeError(err) });
      }
    },
    [userId],
  );

  const retry = () => {
    setError(null);
    void loadPage('initial');
  };

  return (
    <View style={styles.container}>
      {toast && (
        <Toast message={toast.message} type={toast.type} onDismiss={() => setToast(null)} />
      )}

      <ScreenHeader
        title="Feed"
        subtitle="News from your club"
        action={
          staff ? (
            <Pressable
              onPress={() => router.push('/(tabs)/home/create')}
              style={({ pressed }) => [styles.composeBtn, pressed && styles.composeBtnPressed]}
              accessibilityRole="button"
              accessibilityLabel="Create new post"
              hitSlop={8}
            >
              <Plus size={22} color={colors.text} strokeWidth={3} />
            </Pressable>
          ) : undefined
        }
      />

      {loading && posts.length === 0 ? (
        <View style={styles.list}>
          <SkeletonCard />
          <SkeletonCard />
        </View>
      ) : error ? (
        <ErrorState message={error} onRetry={retry} retryLoading={loading} />
      ) : posts.length === 0 ? (
        // Staff see a "create" prompt with the + icon.
        // Everyone else sees a neutral newspaper icon — they can't post.
        staff ? (
          <EmptyState
            icon={Plus}
            title="No posts yet"
            message="Tap the + button above to share the first update."
            actionLabel="Create post"
            onAction={() => router.push('/(tabs)/home/create')}
          />
        ) : (
          <EmptyState
            icon={Newspaper}
            title="No posts yet"
            message="When coaches share updates, they'll appear here."
          />
        )
      ) : (
        <FlatList
          data={posts}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <PostCard post={item} onToggleLike={toggleLike} />}
          contentContainerStyle={styles.list}
          contentInsetAdjustmentBehavior="automatic"
          refreshControl={
            <RefreshControl
              tintColor={colors.muted}
              refreshing={refreshing}
              onRefresh={() => void loadPage('refresh')}
            />
          }
          onEndReached={() => void loadPage('more')}
          onEndReachedThreshold={0.4}
          ListFooterComponent={
            loadingMore ? (
              <View style={styles.footer}>
                <Text style={styles.footerText}>Loading more...</Text>
              </View>
            ) : null
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  list: {
    paddingHorizontal: spacing.md,
    paddingBottom: 140,
    gap: spacing.md,
  },
  composeBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  composeBtnPressed: { opacity: 0.8, transform: [{ scale: 0.97 }] },
  footer: { paddingVertical: spacing.lg, alignItems: 'center' },
  footerText: { color: colors.muted, fontSize: fontSize.caption },
});
