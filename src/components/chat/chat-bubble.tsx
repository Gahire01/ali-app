import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';

import { colors, fontSize, lineHeight, radius, spacing } from '@/constants/theme';
import { useAuthStore } from '@/stores/auth-store';
import { formatTime } from '@/lib/format';
import type { Message } from '@/types/supabase';

type Props = {
  message: Message;
  /** Marks the most recent outgoing message so we can fade its tick in */
  isLatestOwn?: boolean;
};

export function ChatBubble({ message, isLatestOwn = false }: Props) {
  const user = useAuthStore((state) => state.user);
  const mine = message.sender_id === user?.id;

  // Entrance animation
  const fade = useRef(new Animated.Value(0)).current;
  const slide = useRef(new Animated.Value(mine ? 16 : -16)).current;
  const scale = useRef(new Animated.Value(0.95)).current;

  // Tick fade
  const tickFade = useRef(new Animated.Value(message.read_at ? 1 : 0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, {
        toValue: 1,
        duration: 260,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(slide, {
        toValue: 0,
        duration: 300,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue: 1,
        damping: 12,
        stiffness: 200,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fade, slide, scale]);

  // Fade the tick when read_at appears
  useEffect(() => {
    if (message.read_at) {
      Animated.timing(tickFade, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [message.read_at, tickFade]);

  return (
    <Animated.View
      style={[
        styles.row,
        mine && styles.rowMine,
        {
          opacity: fade,
          transform: [{ translateX: slide }, { scale }],
        },
      ]}
    >
      <View style={[styles.bubble, mine && styles.bubbleMine]}>
        <Text style={[styles.text, mine && styles.textMine]}>{message.body}</Text>
        <View style={[styles.meta, mine && styles.metaMine]}>
          <Text style={[styles.time, mine && styles.timeMine]}>
            {formatTime(message.created_at)}
          </Text>
          {mine && (
            <Animated.Text
              style={[
                styles.tick,
                message.read_at ? styles.tickSeen : styles.tickSent,
                { opacity: tickFade },
              ]}
            >
              {message.read_at ? '✓✓' : '✓'}
            </Animated.Text>
          )}
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  row: {
    paddingHorizontal: spacing.md,
    marginVertical: 3,
    alignItems: 'flex-start',
  },
  rowMine: { alignItems: 'flex-end' },
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
  text: { color: colors.text, fontSize: fontSize.body, lineHeight: lineHeight.body },
  textMine: { color: colors.text },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  metaMine: {},
  time: { fontSize: fontSize.small, color: colors.muted },
  timeMine: { color: 'rgba(255,255,255,0.6)' },
  tick: { fontSize: fontSize.small, color: colors.muted },
  tickSent: { color: 'rgba(255,255,255,0.5)' },
  tickSeen: { color: colors.secondary },
});
