import React, { useCallback, useState } from 'react';
import { Alert, FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AppStackParamList } from '../navigation/types';
import * as api from '../api/endpoints';
import type { HealthEntry, HealthEntryType } from '../types/api';
import AddIconButton from '../components/AddIconButton';
import AddModal from '../components/AddModal';
import AutocompleteInput from '../components/AutocompleteInput';
import { getVaccinesForSpecies } from '../data/vaccines';
import { showError, showLoadError } from '../utils/errorHandling';

type Props = NativeStackScreenProps<AppStackParamList, 'HealthEntries'>;

const TYPES: HealthEntryType[] = ['vaccin', 'vermifuge', 'rdv_veto', 'osteo', 'dentiste_equin', 'marechal', 'autre'];

export default function HealthEntriesScreen({ route }: Props) {
  const { animalId, animalName, species } = route.params;
  const [entries, setEntries] = useState<HealthEntry[]>([]);
  const [type, setType] = useState<HealthEntryType>('vaccin');
  const [customTypeLabel, setCustomTypeLabel] = useState('');
  const [scheduledDate, setScheduledDate] = useState('');
  const [modalVisible, setModalVisible] = useState(false);

  const load = useCallback(() => {
    api.listHealthEntries(animalId).then(setEntries).catch(showLoadError);
  }, [animalId]);

  useFocusEffect(load);

  const onCreate = async () => {
    if (!scheduledDate) return;
    try {
      await api.createHealthEntry(animalId, {
        type,
        scheduledDate,
        customTypeLabel: customTypeLabel.trim() || undefined,
      });
      setCustomTypeLabel('');
      setScheduledDate('');
      setModalVisible(false);
      load();
    } catch (error) {
      showError(error);
    }
  };

  const onMarkDone = async (entry: HealthEntry) => {
    try {
      await api.updateHealthEntry(animalId, entry.id, { status: 'fait' });
      load();
    } catch (error) {
      showError(error);
    }
  };

  const onDelete = (entry: HealthEntry) => {
    Alert.alert('Supprimer cette entree ?', undefined, [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.deleteHealthEntry(animalId, entry.id);
            load();
          } catch (error) {
            showError(error);
          }
        },
      },
    ]);
  };

  return (
    <>
      <FlatList
        style={styles.container}
        contentContainerStyle={styles.content}
        data={entries}
        keyExtractor={(item) => String(item.id)}
        ListHeaderComponent={
          <View style={styles.titleRow}>
            <Text style={styles.title}>Carnet de sante — {animalName}</Text>
            <AddIconButton onPress={() => setModalVisible(true)} />
          </View>
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

      <AddModal visible={modalVisible} title="Ajouter une entree" onClose={() => setModalVisible(false)}>
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
        <AutocompleteInput
          value={customTypeLabel}
          onChange={setCustomTypeLabel}
          options={type === 'vaccin' ? getVaccinesForSpecies(species) : []}
          placeholder={type === 'vaccin' ? 'Nom du vaccin (optionnel)' : 'Precision (optionnel)'}
          autoFocus
        />
        <TextInput
          style={styles.input}
          placeholder="Date (AAAA-MM-JJ)"
          value={scheduledDate}
          onChangeText={setScheduledDate}
        />
        <TouchableOpacity style={styles.addButton} onPress={onCreate}>
          <Text style={styles.addButtonText}>Ajouter</Text>
        </TouchableOpacity>
      </AddModal>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16 },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  title: { fontSize: 22, fontWeight: 'bold', flexShrink: 1, marginRight: 12 },
  card: { backgroundColor: '#f2f2f2', borderRadius: 8, padding: 16, marginBottom: 12 },
  cardTitle: { fontSize: 16, fontWeight: '600', textTransform: 'capitalize' },
  cardSubtitle: { color: '#666', marginTop: 4 },
  cardActions: { flexDirection: 'row', gap: 16, marginTop: 10 },
  cardActionText: { color: '#2f6f4f', fontWeight: '600' },
  cardActionTextDanger: { color: '#a33', fontWeight: '600' },
  empty: { color: '#666', textAlign: 'center', marginTop: 24 },
  typeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 },
  typeChip: { borderWidth: 1, borderColor: '#ccc', borderRadius: 16, paddingVertical: 6, paddingHorizontal: 12 },
  typeChipActive: { backgroundColor: '#2f6f4f', borderColor: '#2f6f4f' },
  typeChipText: { color: '#333' },
  typeChipTextActive: { color: 'white' },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 12, marginBottom: 12 },
  addButton: { backgroundColor: '#2f6f4f', borderRadius: 8, padding: 14 },
  addButtonText: { color: 'white', textAlign: 'center', fontWeight: '600' },
});
