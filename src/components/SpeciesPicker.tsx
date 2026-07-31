import React from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

const SPECIES_OPTIONS = ['Chien', 'Chat', 'Cheval'] as const;
const OTHER = 'Autre';

interface Props {
  value: string;
  onChange: (species: string) => void;
}

export default function SpeciesPicker({ value, onChange }: Props) {
  const isCustom = value !== '' && !(SPECIES_OPTIONS as readonly string[]).includes(value);

  return (
    <View>
      <View style={styles.row}>
        {SPECIES_OPTIONS.map((species) => (
          <TouchableOpacity
            key={species}
            style={[styles.chip, value === species && styles.chipActive]}
            onPress={() => onChange(species)}
          >
            <Text style={value === species ? styles.chipTextActive : styles.chipText}>{species}</Text>
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
          placeholder="Preciser l'espece (NAC, etc.)"
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
