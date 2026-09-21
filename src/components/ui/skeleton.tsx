import React, { useEffect, useState } from 'react';
import { Animated, StyleSheet, View, type ViewStyle } from 'react-native';

import { colors, radius } from '@/constants/theme';

const spacingSm = 8;
const spacingMd = 16;

type SkeletonProps = {
  width?: number | `${number}%`;
  height?: number;
  style?: ViewStyle;
};

/**
 * A soft pulsing placeholder block used while real content loads.
 */
export function Skeleton({ width = '100%', height = 14, style }: SkeletonProps) {
  const [opacity] = useState(() => new Animated.Value(0.35));

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.9, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.35, duration: 700, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[styles.block, { width, height, opacity }, style]}
      accessibilityLabel="Loading"
    />
  );
}

export function SkeletonCard({ lines = 4, children }: { lines?: number; children?: React.ReactNode }) {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Skeleton width={44} height={44} style={styles.avatar} />
        <View style={styles.headerText}>
          <Skeleton width={140} height={14} />
          <Skeleton width={80} height={10} style={styles.rowGap} />
        </View>
      </View>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} height={10} width={`${92 - i * 7}%`} style={styles.line} />
      ))}
      <Skeleton width="100%" height={180} style={styles.media} />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  block: {
    backgroundColor: colors.subtle,
    borderRadius: radius.input,
  },
  card: {
    backgroundColor: colors.panel,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.card,
    padding: spacingMd,
    gap: spacingSm,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    borderRadius: 22,
  },
  headerText: {
    flex: 1,
    gap: 6,
  },
  rowGap: {
    marginTop: 2,
  },
  line: {
    marginTop: 6,
  },
  media: {
    marginTop: 10,
    borderRadius: radius.card,
  },
});