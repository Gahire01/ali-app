import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors, fontSize, lineHeight, radius, spacing } from '@/constants/theme';
import { useAuthStore } from '@/stores/auth-store';
import type { Message } from '@/types/supabase';
import { formatTime } from '@/lib/format';

type Props = {
  message: Message;
};

export function ChatBubble({ message }: Props) {
  const user = useAuthStore((state) => state.user);
  const mine = message.sender_id === user?.id;

  return (
    <View style={[styles.row, mine && styles.rowMine]}>
      <View style={[styles.bubble, mine && styles.bubbleMine]}>
        <Text style={[styles.text, mine && styles.textMine]}>{message.body}</Text>
        <View style={[styles.meta, mine && styles.metaMine]}>
          <Text style={[styles.time, mine && styles.timeMine]}>{formatTime(message.created_at)}</Text>
          {mine && (
            <Text style={[styles.tick, message.read_at ? styles.tickSeen : styles.tickSent]}>
              {message.read_at ? '✓✓' : '✓'}
            </Text>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    paddingHorizontal: spacing.md,
    marginVertical: 3,
    alignItems: 'flex-start',
  },
  rowMine: {
    alignItems: 'flex-end',
  },
  bubble: {
    backgroundColor: colors.panel,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.card,
    borderBottomLeftRadius: 4,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    maxWidth: '80%',
  },
  bubbleMine: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
    borderBottomRightRadius: 4,
    borderBottomLeftRadius: radius.card,
  },
  text: {
    color: colors.text,
    fontSize: fontSize.body,
    lineHeight: lineHeight.body,
  },
  textMine: {
    color: colors.text,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  metaMine: {},
  time: {
    fontSize: fontSize.small,
    color: colors.muted,
  },
  timeMine: {
    color: 'rgba(255,255,255,0.6)',
  },
  tick: {
    fontSize: fontSize.small,
    color: colors.muted,
  },
  tickSent: {
    color: 'rgba(255,255,255,0.5)',
  },
  tickSeen: {
    color: colors.secondary,
  },
});