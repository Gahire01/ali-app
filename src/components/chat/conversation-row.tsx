import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Avatar } from '@/components/ui/avatar';
import { colors, fontSize, lineHeight, spacing } from '@/constants/theme';
import { formatRelativeTime } from '@/lib/format';
import type { ConversationSummary } from '@/lib/data';

type Props = {
  item: ConversationSummary;
};

export function ConversationRow({ item }: Props) {
  return (
    <View style={styles.row}>
      <Avatar
        name={item.title}
        size={48}
      />
      <View style={styles.textBlock}>
        <View style={styles.nameRow}>
          <Text style={styles.name} numberOfLines={1}>
            {item.title}
          </Text>
          <Text style={styles.time} numberOfLines={1}>
            {formatRelativeTime(item.lastMessage?.created_at ?? item.conversation.created_at)}
          </Text>
        </View>
        <View style={styles.bottomRow}>
          <Text style={styles.preview} numberOfLines={1}>
            {item.lastMessage?.body ?? 'No messages yet'}
          </Text>
          {item.unreadCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{item.unreadCount}</Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.background,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  textBlock: {
    flex: 1,
    gap: 4,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  name: {
    flex: 1,
    color: colors.text,
    fontSize: fontSize.body,
    fontWeight: '700',
  },
  time: {
    color: colors.muted,
    fontSize: fontSize.small,
    flexShrink: 0,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  preview: {
    flex: 1,
    color: colors.muted,
    fontSize: fontSize.caption,
    lineHeight: lineHeight.caption,
  },
  badge: {
    backgroundColor: colors.secondary,
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  badgeText: {
    color: colors.background,
    fontSize: fontSize.small,
    fontWeight: '800',
  },
});