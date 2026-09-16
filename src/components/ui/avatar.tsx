import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';

import { colors } from '@/constants/theme';
import { supabase } from '@/lib/supabase';

type Props = {
  url?: string | null;
  name?: string | null;
  size?: number;
};

function initials(name: string | null | undefined): string {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

export function Avatar({ url, name, size = 48 }: Props) {
  const uri = url
    ? supabase.storage.from('club-media').getPublicUrl(url).data?.publicUrl ?? undefined
    : undefined;

  if (uri) {
    return (
      <Image
        source={{ uri }}
        style={{ width: size, height: size, borderRadius: size / 2 }}
        accessibilityLabel={`${name ?? 'User'} avatar`}
      />
    );
  }

  return (
    <View style={[styles.fallback, { width: size, height: size, borderRadius: size / 2 }]}>
      <Text style={[styles.initials, { fontSize: size * 0.38 }]}>{initials(name)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  fallback: {
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    color: colors.text,
    fontWeight: '800',
  },
});