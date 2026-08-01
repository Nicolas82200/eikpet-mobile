import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import AutocompleteInput from './AutocompleteInput';

interface Props {
  value: string;
  onChange: (value: string) => void;
  options: readonly string[];
  placeholder?: string;
  /** Libelle du bouton "rien a signaler", ex: "Aucune allergie connue", "Non assure". */
  noneLabel: string;
}

/**
 * Champ avec un etat "Aucun(e) connu(e)" explicite, distinct de "non renseigne" (vide).
 * Utile pour la fiche medicale : un champ vide veut dire "pas encore verifie", alors que
 * "Aucun(e) connu(e)" veut dire "verifie, rien a signaler" — deux informations differentes.
 */
export default function NullableField({ value, onChange, options, placeholder, noneLabel }: Props) {
  const isNone = value === noneLabel;

  return (
    <View>
      <TouchableOpacity
        style={[styles.noneChip, isNone && styles.noneChipActive]}
        onPress={() => onChange(isNone ? '' : noneLabel)}
      >
        <Text style={isNone ? styles.noneChipTextActive : styles.noneChipText}>{noneLabel}</Text>
      </TouchableOpacity>
      {!isNone && (
        <AutocompleteInput value={value} onChange={onChange} options={options} placeholder={placeholder} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  noneChip: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginBottom: 8,
  },
  noneChipActive: { backgroundColor: '#2f6f4f', borderColor: '#2f6f4f' },
  noneChipText: { color: '#333' },
  noneChipTextActive: { color: 'white', fontWeight: '600' },
});
