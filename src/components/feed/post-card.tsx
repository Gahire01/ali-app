import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Heart } from 'lucide-react-native';
import { Image as ExpoImage } from 'expo-image';

import { Avatar } from '@/components/ui/avatar';
import { colors, fontSize, lineHeight, radius, spacing } from '@/constants/theme';
import { isStaff } from '@/lib/data';
import { mediaUrl, type FeedPost } from '@/lib/data';
import { formatRelativeTime } from '@/lib/format';

type Props = {
  post: FeedPost;
  onToggleLike: (postId: string, currentlyLiked: boolean) => Promise<void>;
};

export function PostCard({ post, onToggleLike }: Props) {
  const [optimisticLiked, setOptimisticLiked] = useState(post.likedByMe);
  const [optimisticCount, setOptimisticCount] = useState(post.likeCount);
  const [busy, setBusy] = useState(false);

  const toggle = async () => {
    if (busy) return;
    setBusy(true);
    const next = !optimisticLiked;
    setOptimisticLiked(next);
    setOptimisticCount((c) => (next ? c + 1 : Math.max(0, c - 1)));
    try {
      await onToggleLike(post.id, !next);
    } catch {
      setOptimisticLiked(!next);
      setOptimisticCount(post.likeCount);
    } finally {
      setBusy(false);
    }
  };

  const author = post.author;
  const staff = Boolean(author && isStaff(author.role));

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Avatar url={author?.photo_url} name={author?.full_name} size={40} />
        <View style={styles.headerText}>
          <View style={styles.nameRow}>
            <Text style={styles.name} numberOfLines={1}>
              {author?.full_name ?? 'Staff'}
            </Text>
            {staff && (
              <View style={styles.staffBadge}>
                <Text style={styles.staffText}>STAFF</Text>
              </View>
            )}
          </View>
          <Text style={styles.time}>{formatRelativeTime(post.created_at)}</Text>
        </View>
      </View>

      {!!post.caption && (
        <Text style={styles.caption} numberOfLines={6}>
          {post.caption}
        </Text>
      )}

      {post.media.length > 0 && (
        <View style={[styles.mediaGrid, post.media.length === 1 && styles.mediaSingle]}>
          {post.media.slice(0, 4).map((m) => (
            <View key={m.id} style={[styles.mediaItem, post.media.length === 1 && styles.mediaItemSingle]}>
              <ExpoImage
                source={{ uri: mediaUrl(m.thumbnail_url ?? m.file_url) }}
                style={styles.mediaImage}
                contentFit="cover"
                transition={220}
              />
            </View>
          ))}
        </View>
      )}

      <View style={styles.footer}>
        <Pressable
          onPress={toggle}
          style={({ pressed }) => [styles.likeBtn, pressed && styles.likeBtnPressed]}
          accessibilityRole="button"
          accessibilityLabel={optimisticLiked ? 'Unlike post' : 'Like post'}
          hitSlop={8}
        >
          <Heart
            size={18}
            color={optimisticLiked ? colors.primary : colors.muted}
            fill={optimisticLiked ? colors.primary : 'transparent'}
          />
          <Text style={[styles.likeCount, optimisticLiked && styles.likeCountActive]}>
            {optimisticCount}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.panel,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.card,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    gap: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerText: {
    flex: 1,
    gap: 2,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  name: {
    color: colors.text,
    fontSize: fontSize.body,
    fontWeight: '700',
    flexShrink: 1,
  },
  staffBadge: {
    backgroundColor: colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  staffText: {
    color: colors.text,
    fontSize: fontSize.small,
    fontWeight: '800',
    letterSpacing: 1,
  },
  time: {
    color: colors.muted,
    fontSize: fontSize.small,
  },
  caption: {
    color: colors.text,
    fontSize: fontSize.body,
    lineHeight: lineHeight.body,
  },
  mediaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginHorizontal: -4,
  },
  mediaSingle: {
    marginHorizontal: 0,
  },
  mediaItem: {
    flex: 1,
    minWidth: '48%',
    height: 160,
    borderRadius: radius.input,
    overflow: 'hidden',
  },
  mediaItemSingle: {
    height: 240,
  },
  mediaImage: {
    width: '100%',
    height: '100%',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xs,
  },
  likeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    marginLeft: -spacing.sm,
  },
  likeBtnPressed: {
    opacity: 0.7,
  },
  likeCount: {
    color: colors.muted,
    fontSize: fontSize.caption,
    fontWeight: '700',
  },
  likeCountActive: {
    color: colors.primary,
  },
});