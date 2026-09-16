import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { brand, colors, fontSize, letterSpacing, radius, spacing } from '@/constants/theme';

export default function SplashScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.center}>
        <View style={styles.mark}>
          <Text style={styles.markText}>ALI</Text>
        </View>
        <Text style={styles.brand}>{brand.name}</Text>
        <Text style={styles.tagline}>{brand.tagline}</Text>
      </View>
      <Text style={styles.footer}>Member application</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  center: {
    alignItems: 'center',
    gap: spacing.md,
  },
  mark: {
    width: 96,
    height: 96,
    borderRadius: radius.input,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOpacity: 0.4,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  markText: {
    color: colors.text,
    fontSize: 30,
    fontWeight: '800',
    letterSpacing: letterSpacing.heading,
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
    fontSize: fontSize.body,
    textAlign: 'center',
  },
  footer: {
    position: 'absolute',
    bottom: spacing.xl,
    color: colors.subtle,
    fontSize: fontSize.caption,
    letterSpacing: letterSpacing.button,
    textTransform: 'uppercase',
  },
});