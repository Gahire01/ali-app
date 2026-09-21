import React from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Check } from 'lucide-react-native';

import { colors, fontSize, letterSpacing, radius, spacing } from '@/constants/theme';

type Props = {
  visible: boolean;
  title: string;
  options: string[];
  selected?: string | null;
  onSelect: (value: string) => void;
  onClose: () => void;
};

/**
 * Bottom-sheet single-choice selector. Used by coach flows (category,
 * weight class, level, membership status) and broadcast presets.
 * Tapping an option immediately commits the selection and closes.
 */
export function ChoiceSheet({ visible, title, options, selected, onSelect, onClose }: Props) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <View style={styles.handle} />
          <Text style={styles.title}>{title}</Text>
          <ScrollView style={styles.list} nestedScrollEnabled>
            {options.map((option) => {
              const active = option === selected;
              return (
                <Pressable
                  key={option}
                  onPress={() => { onSelect(option); onClose(); }}
                  style={[styles.option, active && styles.optionActive]}
                  accessibilityLabel={option}
                >
                  <Text style={[styles.optionText, active && styles.optionTextActive]}>{option}</Text>
                  {active && <Check size={18} color={colors.background} strokeWidth={3} />}
                </Pressable>
              );
            })}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.panel,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
    maxHeight: '70%',
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.subtle,
    marginVertical: spacing.sm,
  },
  title: {
    color: colors.text,
    fontSize: fontSize.h3,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: letterSpacing.heading,
    marginVertical: spacing.sm,
  },
  list: {
    marginTop: spacing.xs,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  optionActive: {
    backgroundColor: colors.secondary,
    borderRadius: radius.input,
  },
  optionText: {
    color: colors.text,
    fontSize: fontSize.body,
    fontWeight: '600',
  },
  optionTextActive: {
    color: colors.background,
    fontWeight: '800',
  },
});