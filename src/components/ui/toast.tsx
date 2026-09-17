import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors, fontSize, radius, spacing } from '@/constants/theme';

type ToastType = 'success' | 'error' | 'info';

type Props = {
  message: string;
  type?: ToastType;
  duration?: number;
  onDismiss?: () => void;
};

const bg: Record<ToastType, string> = {
  success: colors.success,
  error: colors.error,
  info: colors.muted,
};

export function Toast({ message, type = 'info', duration = 3000, onDismiss }: Props) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      onDismiss?.();
    }, duration);
    return () => clearTimeout(timer);
  }, [duration, onDismiss]);

  if (!visible) return null;

  return (
    <View style={styles.container}>
      <View style={[styles.badge, { backgroundColor: bg[type] }]}>
        <Text style={styles.text} numberOfLines={2}>
          {message}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: spacing.xl,
    left: spacing.md,
    right: spacing.md,
    zIndex: 1000,
    alignItems: 'center',
  },
  badge: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radius.pill,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 5,
    maxWidth: 360,
  },
  text: {
    color: colors.background,
    fontSize: fontSize.body,
    fontWeight: '600',
    textAlign: 'center',
  },
});