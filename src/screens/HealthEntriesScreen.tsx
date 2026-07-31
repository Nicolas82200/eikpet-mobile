import React, { useCallback, useState } from 'react';
import { Alert, FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AppStackParamList } from '../navigation/types';
import * as api from '../api/endpoints';
import type { HealthEntry, HealthEntryType } from '../types/api';
import KeyboardAvoidingScreen from '../components/KeyboardAvoidingScreen';

type Props = NativeStackScreenProps<AppStackParamList, 'HealthEntries'>;

const TYPES: HealthEntryType[] = ['vaccin', 'vermifuge', 'rdv_veto', 'osteo', 'dentiste_equin', 'marechal', 'autre'];

export default function HealthEntriesScreen({ route }: Props) {
  const { animalId, animalName } = route.params;
  const [entries, setEntries] = useState<HealthEntry[]>([]);
  const [type, setType] = useState<HealthEntryType>('vaccin');
  const [scheduledDate, setScheduledDate] = useState('');

  const load = useCallback(() => {
    api.listHealthEntries(animalId).then(setEntries).catch(() => undefined);
  }, [animalId]);

  useFocusEffect(load);

  const onCreate = async () => {
    if (!scheduledDate) return;
    await api.createHealthEntry(animalId, { type, scheduledDate });
    setScheduledDate('');
    load();
  };

  const onMarkDone = async (entry: HealthEntry) => {
    await api.updateHealthEntry(animalId, entry.id, { status: 'fait' });
    load();
  };

  const onDelete = (entry: HealthEntry) => {
    Alert.alert('Supprimer cette entree ?', undefined, [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer',
        style: 'destructive',
        onPress: async () => {
          await api.deleteHealthEntry(animalId, entry.id);
          load();
        },
      },
    ]);
  };

  return (
    <KeyboardAvoidingScreen>
      <FlatList
        style={styles.container}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        data={entries}
        keyExtractor={(item) => String(item.id)}
        ListHeaderComponent={
          <>
            <Text style={styles.title}>Carnet de sante — {animalName}</Text>
            <View style={styles.form}>
              <Text style={styles.formTitle}>Ajouter une entree</Text>
              <View style={styles.typeRow}>
                {TYPES.map((t) => (
                  <TouchableOpacity
                    key={t}
                    style={[styles.typeChip, t === type && styles.typeChipActive]}
                    onPress={() => setType(t)}
                  >
                    <Text style={t === type ? styles.typeChipTextActive : styles.typeChipText}>{t}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <View style={styles.newEntryRow}>
                <TextInput
                  style={styles.input}
                  placeholder="Date (AAAA-MM-JJ)"
                  value={scheduledDate}
                  onChangeText={setScheduledDate}
                />
                <TouchableOpacity style={styles.addButton} onPress={onCreate}>
                  <Text style={styles.addButtonText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>
          </>
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{item.customTypeLabel ?? item.type}</Text>
            <Text style={styles.cardSubtitle}>
              {item.scheduledDate} — {item.status === 'fait' ? 'Fait' : 'Prevu'}
            </Text>
            {item.nextReminderDate && <Text style={styles.cardSubtitle}>Prochain rappel : {item.nextReminderDate}</Text>}
            <View style={styles.cardActions}>
              {item.status !== 'fait' && (
                <TouchableOpacity onPress={() => onMarkDone(item)}>
                  <Text style={styles.cardActionText}>Marquer fait</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity onPress={() => onDelete(item)}>
                <Text style={styles.cardActionTextDanger}>Supprimer</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.empty}>Aucune entree pour l'instant</Text>}
      />
    </KeyboardAvoidingScreen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16 },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 16 },
  form: { backgroundColor: '#f2f2f2', borderRadius: 8, padding: 16, marginBottom: 20, gap: 10 },
  formTitle: { fontSize: 16, fontWeight: '600' },
  card: { backgroundColor: '#f2f2f2', borderRadius: 8, padding: 16, marginBottom: 12 },
  cardTitle: { fontSize: 16, fontWeight: '600', textTransform: 'capitalize' },
  cardSubtitle: { color: '#666', marginTop: 4 },
  cardActions: { flexDirection: 'row', gap: 16, marginTop: 10 },
  cardActionText: { color: '#2f6f4f', fontWeight: '600' },
  cardActionTextDanger: { color: '#a33', fontWeight: '600' },
  empty: { color: '#666', textAlign: 'center', marginTop: 24 },
  typeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  typeChip: { borderWidth: 1, borderColor: '#ccc', borderRadius: 16, paddingVertical: 6, paddingHorizontal: 12 },
  typeChipActive: { backgroundColor: '#2f6f4f', borderColor: '#2f6f4f' },
  typeChipText: { color: '#333' },
  typeChipTextActive: { color: 'white' },
  newEntryRow: { flexDirection: 'row', gap: 8 },
  input: { flex: 1, borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 12 },
  addButton: { backgroundColor: '#2f6f4f', borderRadius: 8, paddingHorizontal: 20, justifyContent: 'center' },
  addButtonText: { color: 'white', fontSize: 20, fontWeight: 'bold' },
});
