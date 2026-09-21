import React, { useCallback, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';

import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { Toast } from '@/components/ui/toast';
import { colors, fontSize, letterSpacing, radius, spacing } from '@/constants/theme';
import { getFighterCard } from '@/lib/data';
import { useAuthStore } from '@/stores/auth-store';
import type { FighterCard } from '@/types/supabase';

function InfoRow({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null;
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

function FighterCardView({ card }: { card: FighterCard }) {
  return (
    <View style={styles.fighterCard}>
      <View style={styles.fighterHeader}>
        <View style={styles.fighterNameRow}>
          <Text style={styles.fighterName}>{card.display_name ?? 'Fighter'}</Text>
          <View style={styles.record}>
            <Text style={styles.recordWin}>{card.wins}W</Text>
            <Text style={styles.recordSep}>/</Text>
            <Text style={styles.recordLoss}>{card.losses}L</Text>
          </View>
        </View>
      </View>
      <View style={styles.fighterBody}>
        <View style={styles.fighterDetail}>
          <Text style={styles.fighterDetailLabel}>Category</Text>
          <Text style={styles.fighterDetailValue}>{card.category ?? '—'}</Text>
        </View>
        <View style={styles.fighterDetail}>
          <Text style={styles.fighterDetailLabel}>Weight</Text>
          <Text style={styles.fighterDetailValue}>{card.weight_class ?? '—'}</Text>
        </View>
        <View style={styles.fighterDetail}>
          <Text style={styles.fighterDetailLabel}>Level</Text>
          <Text style={styles.fighterDetailValue}>{card.level ?? '—'}</Text>
        </View>
      </View>
    </View>
  );
}

export default function ProfileScreen() {
  const user = useAuthStore((s) => s.user);
  const profile = useAuthStore((s) => s.profile);
  const signOut = useAuthStore((s) => s.signOut);
  const [fighterCard, setFighterCard] = useState<FighterCard | null>(null);
  const [loadingCard, setLoadingCard] = useState(true);
  const [signingOut, setSigningOut] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useFocusEffect(
    useCallback(() => {
      let mounted = true;
      (async () => {
        try {
          const card = user ? await getFighterCard(user.id) : null;
          if (mounted) setFighterCard(card);
        } catch {
          // fighter card is optional
        } finally {
          if (mounted) setLoadingCard(false);
        }
      })();
      return () => { mounted = false; };
    }, [user])
  );

  const handleSignOut = () => {
    Alert.alert('Sign out?', 'You will need to sign in again to access your account.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign out',
        style: 'destructive',
        onPress: async () => {
          setSigningOut(true);
          await signOut();
        },
      },
    ]);
  };

  if (!profile) return <Spinner fullscreen />;

  return (
    <View style={styles.container}>
      {toast && <Toast message={toast.message} type={toast.type} onDismiss={() => setToast(null)} />}

      <ScrollView contentContainerStyle={styles.scroll} contentInsetAdjustmentBehavior="automatic">
        <View style={styles.profileHeader}>
          <Avatar url={profile.photo_url} name={profile.full_name} size={88} />
          <Text style={styles.name}>{profile.full_name}</Text>
          <Text style={styles.email}>{profile.email}</Text>
          <View style={[styles.roleBadge, profile.role === 'admin' && styles.roleBadgeAdmin, profile.role === 'coach' && styles.roleBadgeCoach]}>
            <Text style={styles.roleText}>{profile.role.toUpperCase()}</Text>
          </View>
        </View>

        <View style={styles.infoCard}>
          <InfoRow label="Phone" value={profile.phone} />
          <InfoRow label="Category" value={profile.category} />
          <InfoRow label="Weight class" value={profile.weight_class} />
          {profile.weight_kg ? <InfoRow label="Weight (kg)" value={String(profile.weight_kg)} /> : null}
          <InfoRow label="Level" value={profile.level} />
          <InfoRow label="Membership" value={profile.membership_status} />
        </View>

        {loadingCard ? null : fighterCard && <FighterCardView card={fighterCard} />}

        <Button
          title="Sign out"
          variant="ghost"
          onPress={handleSignOut}
          loading={signingOut}
          disabled={signingOut}
          fullWidth
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
    gap: spacing.lg,
  },
  profileHeader: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  name: {
    color: colors.text,
    fontSize: fontSize.h1,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: letterSpacing.heading,
    textAlign: 'center',
  },
  email: { color: colors.muted, fontSize: fontSize.body },
  roleBadge: {
    backgroundColor: colors.subtle,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
    marginTop: spacing.xs,
  },
  roleBadgeAdmin: { backgroundColor: colors.primary },
  roleBadgeCoach: { backgroundColor: colors.secondary },
  roleText: { color: colors.text, fontSize: fontSize.small, fontWeight: '800', letterSpacing: 1 },
  infoCard: {
    backgroundColor: colors.panel,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.card,
    padding: spacing.md,
    gap: spacing.sm,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  infoLabel: { color: colors.muted, fontSize: fontSize.caption, textTransform: 'uppercase', letterSpacing: 1 },
  infoValue: { color: colors.text, fontSize: fontSize.body, fontWeight: '700' },
  fighterCard: {
    backgroundColor: colors.panel,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.card,
    overflow: 'hidden',
  },
  fighterHeader: {
    backgroundColor: colors.primary,
    padding: spacing.md,
  },
  fighterNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  fighterName: {
    color: colors.text,
    fontSize: fontSize.h2,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: letterSpacing.heading,
  },
  record: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  recordWin: { color: colors.secondary, fontSize: fontSize.body, fontWeight: '800' },
  recordSep: { color: 'rgba(255,255,255,0.4)', fontSize: fontSize.body },
  recordLoss: { color: colors.text, fontSize: fontSize.body, fontWeight: '800' },
  fighterBody: {
    flexDirection: 'row',
    padding: spacing.md,
    gap: spacing.md,
  },
  fighterDetail: { flex: 1, gap: 2 },
  fighterDetailLabel: { color: colors.muted, fontSize: fontSize.small, textTransform: 'uppercase', letterSpacing: 1 },
  fighterDetailValue: { color: colors.text, fontSize: fontSize.body, fontWeight: '700' },
});