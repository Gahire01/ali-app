import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BrandLockup } from '@/components/brand-lockup';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { colors, fontSize, spacing } from '@/constants/theme';
import { useAuthStore } from '@/stores/auth-store';

export default function HomePlaceholderScreen() {
  const { profile, loading, initialized, signOut } = useAuthStore();

  if (!initialized || loading || (profile && profile.status !== 'approved')) {
    return <Spinner fullscreen />;
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <BrandLockup compact />
      <View style={styles.center}>
        <Text style={styles.welcome}>Welcome, {profile?.full_name ?? 'Champion'}.</Text>
        <Text style={styles.muted}>
          Your membership is approved. Training, chat, and the home feed are being set up.
        </Text>
      </View>
      <Button
        title="Sign out"
        variant="ghost"
        onPress={async () => {
          await signOut();
        }}
        fullWidth
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.lg,
    justifyContent: 'space-between',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
  welcome: {
    color: colors.text,
    fontSize: fontSize.h1,
    fontWeight: '800',
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  muted: {
    color: colors.muted,
    fontSize: fontSize.body,
    lineHeight: 22,
    textAlign: 'center',
  },
});