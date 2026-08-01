import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const OPTIONS: { value: number | null; label: string }[] = [
  { value: null, label: 'Aucun rappel' },
  { value: 1, label: 'Tous les mois' },
  { value: 3, label: 'Tous les 3 mois' },
  { value: 6, label: 'Tous les 6 mois' },
  { value: 12, label: 'Tous les ans' },
];

interface Props {
  value: number | null;
  onChange: (months: number | null) => void;
}

/** Rappel automatique configurable (ex: vermifuge tous les 3 mois, vaccin annuel). */
export default function RecurrencePicker({ value, onChange }: Props) {
  return (
    <View style={styles.row}>
      {OPTIONS.map((option) => (
        <TouchableOpacity
          key={option.label}
          style={[styles.chip, value === option.value && styles.chipActive]}
          onPress={() => onChange(option.value)}
        >
          <Text style={value === option.value ? styles.chipTextActive : styles.chipText}>{option.label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 },
  chip: { borderWidth: 1, borderColor: '#E3D8C4', borderRadius: 16, paddingVertical: 6, paddingHorizontal: 12 },
  chipActive: { backgroundColor: '#B8863B', borderColor: '#B8863B' },
  chipText: { color: '#3A3226' },
  chipTextActive: { color: 'white', fontWeight: '600' },
});
