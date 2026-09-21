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
import { Feather } from 'lucide-react-native';

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

const PAGE_SIZE = 12;

export default function HomeFeedScreen() {
  const user = useAuthStore((s) => s.user);
  const profile = useAuthStore((s) => s.profile);
  const router = useRouter();
  const userId = user?.id ?? '';
  const staff = Boolean(profile && isStaff(profile.role));

  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const offsetRef = useRef(0);
  const hasMoreRef = useRef(true);
  const mountedRef = useRef(true);

  const loadPage = useCallback(
    async (reset = false) => {
      if (!userId) return;
      if (!reset && !hasMoreRef.current) return;
      if (reset) {
        offsetRef.current = 0;
        hasMoreRef.current = true;
      } else {
        setLoadingMore(true);
      }
      try {
        const page = await feed.list(userId, offsetRef.current, PAGE_SIZE);
        if (!mountedRef.current) return;
        if (reset) {
          setPosts(page);
        } else {
          setPosts((prev) => [...prev, ...page]);
        }
        hasMoreRef.current = page.length === PAGE_SIZE;
        offsetRef.current += PAGE_SIZE;
        setError(null);
      } catch (err) {
        if (!mountedRef.current) return;
        setError(describeError(err));
      } finally {
        if (mountedRef.current) {
          setLoading(false);
          setLoadingMore(false);
        }
      }
    },
    [userId]
  );

  useFocusEffect(
    useCallback(() => {
      mountedRef.current = true;
      void loadPage(true);
      return () => {
        mountedRef.current = false;
      };
    }, [loadPage])
  );

  useEffect(() => {
    if (!isPreviewMock) {
      const channel = supabase
        .channel('feed-list')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'posts' }, () => {
          void loadPage(true);
        })
        .subscribe();
      return () => {
        void channel.unsubscribe();
      };
    }
    const unsub = subscribeToBus('feed', 'reload', (() => {
      void loadPage(true);
    }) as never);
    return unsub;
  }, [loadPage]);

  const toggleLike = useCallback(
    async (postId: string, currentlyLiked: boolean) => {
      if (!userId) return;
      try {
        await feed.toggleLike(postId, userId);
      } catch (err) {
        setToast({ type: 'error', message: describeError(err) });
      }
    },
    [userId]
  );

  const renderSkeleton = () => (
    <View style={styles.list}>
      <SkeletonCard />
      <SkeletonCard />
    </View>
  );

  return (
    <View style={styles.container}>
      {toast && <Toast message={toast.message} type={toast.type} onDismiss={() => setToast(null)} />}

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
              <Feather size={18} color={colors.text} />
            </Pressable>
          ) : undefined
        }
      />

      {loading ? (
        renderSkeleton()
      ) : error ? (
        <ErrorState message={error} onRetry={() => { setLoading(true); void loadPage(true); }} retryLoading={loading} />
      ) : posts.length === 0 ? (
        <EmptyState
          icon={Feather}
          title="No posts yet"
          message="When coaches or admins share updates, they'll appear here."
        />
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
              refreshing={false}
              onRefresh={() => void loadPage(true)}
            />
          }
          onEndReached={() => void loadPage(false)}
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
    paddingBottom: spacing.xxl,
    gap: spacing.md,
  },
  composeBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.panel,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  composeBtnPressed: {
    opacity: 0.7,
  },
  footer: {
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },
  footerText: {
    color: colors.muted,
    fontSize: fontSize.caption,
  },
});