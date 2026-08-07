import React, { useState } from 'react';
import { StyleSheet, Switch, Text, View } from 'react-native';
import Dropdown from './Dropdown';
import { colors, spacing } from '../theme/colors';

const FREQUENCY_OPTIONS = [
  { value: '1', label: 'Tous les mois' },
  { value: '3', label: 'Tous les 3 mois' },
  { value: '6', label: 'Tous les 6 mois' },
  { value: '12', label: 'Tous les ans' },
];

interface Props {
  value: number | null;
  onChange: (months: number | null) => void;
}

/** Rappel automatique configurable : d'abord un choix oui/non, puis une frequence si oui. */
export default function ReminderPicker({ value, onChange }: Props) {
  const [enabled, setEnabled] = useState(value !== null);

  const onToggle = (next: boolean) => {
    setEnabled(next);
    if (!next) onChange(null);
  };

  return (
    <View>
      <View style={styles.switchRow}>
        <Text style={styles.label}>Souhaites-tu un rappel ?</Text>
        <Switch value={enabled} onValueChange={onToggle} />
      </View>
      {enabled && (
        <Dropdown
          value={value != null ? String(value) : null}
          onChange={(v) => onChange(Number(v))}
          options={FREQUENCY_OPTIONS}
          placeholder="Choisir la frequence"
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.md },
  label: { color: colors.textSecondary },
});
