import React, { useState } from 'react';
import { FlatList, Modal, Pressable, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { colors, radius, spacing } from '../theme/colors';

export interface DropdownOption<T extends string> {
  value: T;
  label: string;
}

interface Props<T extends string> {
  value: T | null;
  onChange: (value: T) => void;
  options: readonly DropdownOption<T>[];
  placeholder: string;
}

/**
 * Selecteur en menu deroulant (remplace les puces de choix) : n'affiche aucune valeur par
 * defaut, l'utilisateur doit ouvrir le menu et choisir explicitement.
 */
export default function Dropdown<T extends string>({ value, onChange, options, placeholder }: Props<T>) {
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.value === value);

  return (
    <>
      <TouchableOpacity style={styles.field} onPress={() => setOpen(true)}>
        <Text style={selected ? styles.valueText : styles.placeholderText}>
          {selected ? selected.label : placeholder}
        </Text>
        <Text style={styles.chevron}>▾</Text>
      </TouchableOpacity>

      <Modal visible={open} animationType="fade" transparent onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <Pressable style={styles.menu} onPress={(e) => e.stopPropagation()}>
            <FlatList
              data={options}
              keyExtractor={(item) => item.value}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.option}
                  onPress={() => {
                    onChange(item.value);
                    setOpen(false);
                  }}
                >
                  <Text style={item.value === value ? styles.optionTextActive : styles.optionText}>{item.label}</Text>
                </TouchableOpacity>
              )}
            />
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    padding: spacing.md,
    backgroundColor: colors.fieldBackground,
  },
  valueText: { color: '#000000' },
  placeholderText: { color: colors.textSecondary },
  chevron: { color: colors.textSecondary, marginLeft: spacing.sm },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', padding: spacing.xl },
  menu: { backgroundColor: colors.surface, borderRadius: radius.md, maxHeight: '70%', overflow: 'hidden' },
  option: { padding: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.divider },
  optionText: { color: colors.textPrimary },
  optionTextActive: { color: colors.accent, fontWeight: '700' },
});
