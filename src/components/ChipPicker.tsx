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
  chip: { borderWidth: 1, borderColor: '#ccc', borderRadius: 16, paddingVertical: 6, paddingHorizontal: 14 },
  chipActive: { backgroundColor: '#2f6f4f', borderColor: '#2f6f4f' },
  chipText: { color: '#333' },
  chipTextActive: { color: 'white', fontWeight: '600' },
  customInput: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 12, marginTop: 8 },
});
