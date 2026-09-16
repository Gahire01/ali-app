import { StyleSheet, Text, View } from 'react-native';

import { brand, colors, fontSize, letterSpacing, radius, spacing } from '@/constants/theme';

export function BrandLockup({ compact = false }: { compact?: boolean }) {
  return (
    <View style={styles.container}>
      <View style={[styles.mark, compact && styles.markCompact]}>
        <Text style={[styles.markText, compact && styles.markTextCompact]}>ALI</Text>
      </View>
      {!compact && (
        <>
          <Text style={styles.brand}>{brand.name}</Text>
          <Text style={styles.tagline}>{brand.tagline}</Text>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: spacing.md,
  },
  mark: {
    width: 88,
    height: 88,
    borderRadius: radius.input,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOpacity: 0.4,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 5 },
    elevation: 8,
  },
  markCompact: {
    width: 44,
    height: 44,
    borderRadius: radius.input,
  },
  markText: {
    color: colors.text,
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: letterSpacing.heading,
  },
  markTextCompact: {
    fontSize: 16,
  },
  brand: {
    color: colors.text,
    fontSize: fontSize.h1,
    fontWeight: '800',
    letterSpacing: letterSpacing.heading,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  tagline: {
    color: colors.muted,
    fontSize: fontSize.caption,
    letterSpacing: 2,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
});