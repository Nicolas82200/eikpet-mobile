import React from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

const OTHER = 'Autre';

interface Props {
  value: string;
  onChange: (value: string) => void;
  options: readonly string[];
  customPlaceholder?: string;
}

/** Selecteur a puces avec repli en saisie libre si l'option souhaitee n'est pas dans la liste. */
export default function ChipPicker({ value, onChange, options, customPlaceholder }: Props) {
  const isCustom = value !== '' && !options.includes(value);

  return (
    <View>
      <View style={styles.row}>
        {options.map((option) => (
          <TouchableOpacity
            key={option}
            style={[styles.chip, value === option && styles.chipActive]}
            onPress={() => onChange(option)}
          >
            <Text style={value === option ? styles.chipTextActive : styles.chipText}>{option}</Text>
          </TouchableOpacity>
        ))}
        <TouchableOpacity
          style={[styles.chip, isCustom && styles.chipActive]}
          onPress={() => onChange(isCustom ? value : '')}
        >
          <Text style={isCustom ? styles.chipTextActive : styles.chipText}>{OTHER}</Text>
        </TouchableOpacity>
      </View>
      {(isCustom || value === '') && (
        <TextInput
          style={styles.customInput}
          placeholder={customPlaceholder ?? 'Preciser'}
          value={isCustom ? value : ''}
          onChangeText={onChange}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: { borderWidth: 1, borderColor: '#E3D8C4', borderRadius: 16, paddingVertical: 6, paddingHorizontal: 14 },
  chipActive: { backgroundColor: '#B8863B', borderColor: '#B8863B' },
  chipText: { color: '#3A3226' },
  chipTextActive: { color: 'white', fontWeight: '600' },
  customInput: { borderWidth: 1, borderColor: '#E3D8C4', borderRadius: 8, padding: 12, marginTop: 8, backgroundColor: '#EFE2C4', color: '#000000' },
});
