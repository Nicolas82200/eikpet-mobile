import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface Props {
  warnings: string[];
  onPress?: () => void;
}

export default function WarningBanner({ warnings, onPress }: Props) {
  if (warnings.length === 0) {
    return null;
  }

  return (
    <TouchableOpacity style={styles.container} onPress={onPress} disabled={!onPress} activeOpacity={0.7}>
      <Text style={styles.title}>⚠ Informations manquantes</Text>
      {warnings.map((warning) => (
        <Text key={warning} style={styles.item}>
          • {warning}
        </Text>
      ))}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fef3c7',
    borderRadius: 8,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#fcd34d',
  },
  title: { color: '#92400e', fontWeight: '700', marginBottom: 4 },
  item: { color: '#92400e' },
});
