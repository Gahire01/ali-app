import React, { useEffect, useState } from 'react';
import { Linking, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Clock } from 'lucide-react-native';

import { useAuthStore } from '@/stores/auth-store';
import { Button } from '@/components/ui/button';
import { colors, fontSize, letterSpacing, radius, spacing } from '@/constants/theme';

const STATUS_POLL_MS = 10000;

export default function PendingScreen() {
  const { user, profile, refreshProfile, signOut } = useAuthStore();
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      refreshProfile();
    }, STATUS_POLL_MS);
    return () => clearInterval(interval);
  }, [refreshProfile]);

  const handleSignOut = async () => {
    setSigningOut(true);
    await signOut();
  };

  const contactCoach = () => {
    const subject = `Application status check — ${profile?.full_name ?? ''}`;
    const body = `Hi ALI Boxing Club,\n\nMy name is ${
      profile?.full_name ?? ''
    }. I registered but my account is still waiting for review.\n\nThanks.`;
    Linking.openURL(`mailto:gahiredev01@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.card}>
          <View style={styles.iconWrap}>
            <Clock size={40} color={colors.background} strokeWidth={2.5} />
          </View>
          <Text style={styles.title}>Waiting for coach approval</Text>
          <Text style={styles.body}>
            Your registration has been received. A coach is reviewing it and will approve your
            membership shortly.
          </Text>
          <View style={styles.detailBox}>
            <Text style={styles.detailLabel}>Email on file</Text>
            <Text style={styles.detailValue}>{user?.email ?? profile?.email ?? '—'}</Text>
          </View>
          <Text style={styles.body}>
            You&apos;ll get an email and a push notification the moment you&apos;re approved. No member
            content shows until then.
          </Text>
          <Button title="Contact coach" variant="secondary" onPress={contactCoach} fullWidth />
          <Text style={styles.hint}>
            Still waiting? Reach out to gahiredev01@gmail.com.
          </Text>
        </View>

        <Button
          title="Sign out"
          variant="ghost"
          onPress={handleSignOut}
          loading={signingOut}
          disabled={signingOut}
          fullWidth
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    gap: spacing.lg,
  },
  card: {
    backgroundColor: colors.panel,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.card,
    padding: spacing.lg,
    gap: spacing.md,
    alignItems: 'center',
  },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  title: {
    color: colors.text,
    fontSize: fontSize.h1,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: letterSpacing.heading,
    textAlign: 'center',
  },
  body: {
    color: colors.muted,
    fontSize: fontSize.body,
    lineHeight: 22,
    textAlign: 'center',
  },
  detailBox: {
    alignSelf: 'stretch',
    backgroundColor: colors.background,
    borderRadius: radius.input,
    padding: spacing.md,
    gap: 2,
  },
  detailLabel: {
    color: colors.muted,
    fontSize: fontSize.small,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  detailValue: { color: colors.text, fontSize: fontSize.body, fontWeight: '700' },
  hint: {
    color: colors.subtle,
    fontSize: fontSize.caption,
    textAlign: 'center',
  },
});