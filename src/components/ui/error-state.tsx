import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { AlertTriangle, LucideIcon } from 'lucide-react-native';

import { Button } from '@/components/ui/button';
import { colors, fontSize, lineHeight, radius, spacing } from '@/constants/theme';

type Props = {
  icon?: LucideIcon;
  message: string;
  onRetry?: () => void;
  retryLoading?: boolean;
};

export function ErrorState({ icon: Icon = AlertTriangle, message, onRetry, retryLoading }: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.iconWrap}>
        <Icon size={26} color={colors.text} strokeWidth={2.2} />
      </View>
      <Text style={styles.message}>{message}</Text>
      {onRetry && (
        <Button
          title="Try again"
          variant="ghost"
          onPress={onRetry}
          loading={retryLoading}
          disabled={retryLoading}
          small
        />
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
    width: 56,
    height: 56,
    borderRadius: radius.card,
    backgroundColor: colors.panel,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  message: {
    color: colors.error,
    fontSize: fontSize.body,
    lineHeight: lineHeight.body,
    textAlign: 'center',
  },
});