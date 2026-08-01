import React, { useCallback, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AppStackParamList } from '../navigation/types';
import * as api from '../api/endpoints';
import type { Animal, CalendarEntry, HealthEntryType } from '../types/api';
import AddIconButton from '../components/AddIconButton';
import AddModal from '../components/AddModal';
import AutocompleteInput from '../components/AutocompleteInput';
import DatePickerInput from '../components/DatePickerInput';
import TimePickerInput from '../components/TimePickerInput';
import RecurrencePicker from '../components/RecurrencePicker';
import { getVaccinesForSpecies } from '../data/vaccines';
import { getDewormersForSpecies } from '../data/dewormers';
import { scheduleAppointmentFollowUp } from '../notifications/localReminders';
import { useRefreshable } from '../hooks/useRefreshable';
import { showError, showLoadError } from '../utils/errorHandling';
import { formatTime } from '../utils/formatting';

type Props = NativeStackScreenProps<AppStackParamList, 'Calendar'>;

const TYPES: HealthEntryType[] = ['vaccin', 'vermifuge', 'rdv_veto', 'osteo', 'dentiste_equin', 'marechal', 'autre'];

function getPrecisionOptions(type: HealthEntryType, species: string | undefined): readonly string[] {
  if (!species) return [];
  if (type === 'vaccin') return getVaccinesForSpecies(species);
  if (type === 'vermifuge') return getDewormersForSpecies(species);
  return [];
}

export default function CalendarScreen({ route }: Props) {
  const { householdId, householdName } = route.params;
  const [entries, setEntries] = useState<CalendarEntry[]>([]);
  const [animals, setAnimals] = useState<Animal[]>([]);
  const [modalVisible, setModalVisible] = useState(false);

  const [selectedAnimalId, setSelectedAnimalId] = useState<number | null>(null);
  const [type, setType] = useState<HealthEntryType>('vaccin');
  const [customTypeLabel, setCustomTypeLabel] = useState('');
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [recurrenceMonths, setRecurrenceMonths] = useState<number | null>(null);

  const load = useCallback(() => {
    return Promise.all([
      api.listUpcomingReminders(householdId).then(setEntries).catch(showLoadError),
      api.listAnimals(householdId).then(setAnimals).catch(showLoadError),
    ]);
  }, [householdId]);
  const { refreshing, trigger, onRefresh } = useRefreshable(load);

  useFocusEffect(trigger);

  const selectedAnimal = animals.find((a) => a.id === selectedAnimalId);

  const openModal = () => {
    setSelectedAnimalId(animals[0]?.id ?? null);
    setModalVisible(true);
  };

  const onCreate = async () => {
    if (!selectedAnimalId || !scheduledDate || !selectedAnimal) return;
    try {
      const entry = await api.createHealthEntry(selectedAnimalId, {
        type,
        scheduledDate,
        scheduledTime: scheduledTime || undefined,
        customTypeLabel: customTypeLabel.trim() || undefined,
        recurrenceMonths: recurrenceMonths ?? undefined,
      });
      if (scheduledTime) {
        await scheduleAppointmentFollowUp({
          animalId: selectedAnimalId,
          animalName: selectedAnimal.name,
          entryId: entry.id,
          entryLabel: customTypeLabel.trim() || type,
          scheduledDate,
          scheduledTime,
        });
      }
      setCustomTypeLabel('');
      setScheduledDate('');
      setScheduledTime('');
      setRecurrenceMonths(null);
      setModalVisible(false);
      load();
    } catch (error) {
      showError(error);
    }
  };

  return (
    <>
      <FlatList
        style={styles.container}
        contentContainerStyle={styles.content}
        data={entries}
        keyExtractor={(item) => String(item.id)}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListHeaderComponent={
          <View style={styles.titleRow}>
            <Text style={styles.title}>Calendrier — {householdName}</Text>
            <AddIconButton onPress={openModal} />
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>
              {item.animalName} — {item.customTypeLabel ?? item.type}
            </Text>
            <Text style={styles.cardSubtitle}>
              {item.nextReminderDate
                ? `Rappel le ${item.nextReminderDate}`
                : `Prevu le ${item.scheduledDate}${item.scheduledTime ? ` a ${formatTime(item.scheduledTime)}` : ''}`}
            </Text>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.empty}>Aucune echeance a venir</Text>}
      />

      <AddModal visible={modalVisible} title="Ajouter une echeance" onClose={() => setModalVisible(false)}>
        {animals.length === 0 ? (
          <Text style={styles.empty}>Ajoute d'abord un animal pour lui creer une echeance.</Text>
        ) : (
          <>
            <Text style={styles.label}>Animal</Text>
            <View style={styles.chipRow}>
              {animals.map((a) => (
                <TouchableOpacity
                  key={a.id}
                  style={[styles.chip, selectedAnimalId === a.id && styles.chipActive]}
                  onPress={() => setSelectedAnimalId(a.id)}
                >
                  <Text style={selectedAnimalId === a.id ? styles.chipTextActive : styles.chipText}>{a.name}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Type</Text>
            <View style={styles.chipRow}>
              {TYPES.map((t) => (
                <TouchableOpacity
                  key={t}
                  style={[styles.chip, t === type && styles.chipActive]}
                  onPress={() => setType(t)}
                >
                  <Text style={t === type ? styles.chipTextActive : styles.chipText}>{t}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <AutocompleteInput
              value={customTypeLabel}
              onChange={setCustomTypeLabel}
              options={getPrecisionOptions(type, selectedAnimal?.species)}
              placeholder={type === 'vaccin' ? 'Nom du vaccin (optionnel)' : 'Precision (optionnel)'}
            />
            <DatePickerInput value={scheduledDate} onChange={setScheduledDate} placeholder="Date de l'echeance" />
            <TimePickerInput value={scheduledTime} onChange={setScheduledTime} placeholder="Heure (optionnel)" />
            <RecurrencePicker value={recurrenceMonths} onChange={setRecurrenceMonths} />
            <TouchableOpacity style={styles.addButton} onPress={onCreate}>
              <Text style={styles.addButtonText}>Ajouter</Text>
            </TouchableOpacity>
          </>
        )}
      </AddModal>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16 },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  title: { fontSize: 22, fontWeight: 'bold', flexShrink: 1, marginRight: 12 },
  card: { backgroundColor: '#FAF6EF', borderRadius: 8, padding: 16, marginBottom: 12 },
  cardTitle: { fontSize: 16, fontWeight: '600' },
  cardSubtitle: { color: '#8A7B68', marginTop: 4 },
  empty: { color: '#8A7B68', textAlign: 'center', marginTop: 24 },
  label: { color: '#8A7B68', marginBottom: 8, marginTop: 4 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 },
  chip: { borderWidth: 1, borderColor: '#E3D8C4', borderRadius: 16, paddingVertical: 6, paddingHorizontal: 12 },
  chipActive: { backgroundColor: '#B8863B', borderColor: '#B8863B' },
  chipText: { color: '#3A3226' },
  chipTextActive: { color: 'white', fontWeight: '600' },
  input: { borderWidth: 1, borderColor: '#E3D8C4', borderRadius: 8, padding: 12, marginBottom: 12 },
  addButton: { backgroundColor: '#B8863B', borderRadius: 8, padding: 14 },
  addButtonText: { color: 'white', textAlign: 'center', fontWeight: '600' },
});
