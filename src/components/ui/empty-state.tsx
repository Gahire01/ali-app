import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { LucideIcon } from 'lucide-react-native';

import { Button } from '@/components/ui/button';
import { colors, fontSize, lineHeight, spacing } from '@/constants/theme';

type Props = {
  icon: LucideIcon;
  title: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
  actionLoading?: boolean;
};

export function EmptyState({ icon: Icon, title, message, actionLabel, onAction, actionLoading }: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.iconWrap}>
        <Icon size={30} color={colors.background} strokeWidth={2.2} />
      </View>
      <Text style={styles.title}>{title}</Text>
      {!!message && <Text style={styles.message}>{message}</Text>}
      {!!actionLabel && onAction && (
        <Button title={actionLabel} onPress={onAction} loading={actionLoading} disabled={actionLoading} small />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xxl,
  },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    color: colors.text,
    fontSize: fontSize.h3,
    fontWeight: '800',
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  message: {
    color: colors.muted,
    fontSize: fontSize.body,
    lineHeight: lineHeight.body,
    textAlign: 'center',
  },
});