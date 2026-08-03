import React, { useCallback, useState } from 'react';
import { Alert, FlatList, RefreshControl, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AppStackParamList } from '../navigation/types';
import * as api from '../api/endpoints';
import type { HealthEntry, HealthEntryType } from '../types/api';
import AddIconButton from '../components/AddIconButton';
import AddModal from '../components/AddModal';
import AutocompleteInput from '../components/AutocompleteInput';
import DatePickerInput from '../components/DatePickerInput';
import TimePickerInput from '../components/TimePickerInput';
import RecurrencePicker from '../components/RecurrencePicker';
import { getVaccinesForSpecies } from '../data/vaccines';
import { getDewormersForSpecies } from '../data/dewormers';
import { scheduleAppointmentFollowUp, cancelAppointmentFollowUp } from '../notifications/localReminders';
import { useRefreshable } from '../hooks/useRefreshable';
import { showError, showLoadError } from '../utils/errorHandling';
import { formatTime } from '../utils/formatting';

type Props = NativeStackScreenProps<AppStackParamList, 'HealthEntries'>;

const TYPES: HealthEntryType[] = ['vaccin', 'vermifuge', 'rdv_veto', 'osteo', 'dentiste_equin', 'marechal', 'autre'];

function getPrecisionOptions(type: HealthEntryType, species: string): readonly string[] {
  if (type === 'vaccin') return getVaccinesForSpecies(species);
  if (type === 'vermifuge') return getDewormersForSpecies(species);
  return [];
}

export default function HealthEntriesScreen({ route }: Props) {
  const { animalId, animalName, species } = route.params;
  const [entries, setEntries] = useState<HealthEntry[]>([]);
  const [type, setType] = useState<HealthEntryType>('vaccin');
  const [customTypeLabel, setCustomTypeLabel] = useState('');
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [recurrenceMonths, setRecurrenceMonths] = useState<number | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const [reportEntry, setReportEntry] = useState<HealthEntry | null>(null);
  const [report, setReport] = useState('');
  const [price, setPrice] = useState('');
  const [savingReport, setSavingReport] = useState(false);

  const load = useCallback(() => {
    return api.listHealthEntries(animalId).then(setEntries).catch(showLoadError);
  }, [animalId]);
  const { refreshing, trigger, onRefresh } = useRefreshable(load);

  useFocusEffect(trigger);

  const onCreate = async () => {
    if (!scheduledDate) return;
    try {
      const entry = await api.createHealthEntry(animalId, {
        type,
        scheduledDate,
        scheduledTime: scheduledTime || undefined,
        customTypeLabel: customTypeLabel.trim() || undefined,
        recurrenceMonths: recurrenceMonths ?? undefined,
      });
      if (scheduledTime) {
        await scheduleAppointmentFollowUp({
          animalId,
          animalName,
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

  const onMarkDone = async (entry: HealthEntry) => {
    try {
      await api.updateHealthEntry(animalId, entry.id, { status: 'fait' });
      load();
    } catch (error) {
      showError(error);
    }
  };

  const openReportModal = (entry: HealthEntry) => {
    setReportEntry(entry);
    setReport(entry.report ?? '');
    setPrice(entry.price != null ? String(entry.price) : '');
  };

  const onSaveReport = async () => {
    if (!reportEntry) return;
    setSavingReport(true);
    try {
      await api.updateHealthEntry(animalId, reportEntry.id, {
        report: report.trim() || undefined,
        price: price ? parseFloat(price) : undefined,
      });
      setReportEntry(null);
      load();
    } catch (error) {
      showError(error);
    } finally {
      setSavingReport(false);
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
            await cancelAppointmentFollowUp(entry.id);
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
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
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
              {item.scheduledDate}
              {item.scheduledTime ? ` a ${formatTime(item.scheduledTime)}` : ''} —{' '}
              {item.status === 'fait' ? 'Fait' : 'Prevu'}
            </Text>
            {item.nextReminderDate && <Text style={styles.cardSubtitle}>Prochain rappel : {item.nextReminderDate}</Text>}
            {item.report && <Text style={styles.cardReport}>{item.report}</Text>}
            <View style={styles.cardActions}>
              {item.status !== 'fait' && (
                <TouchableOpacity onPress={() => onMarkDone(item)}>
                  <Text style={styles.cardActionText}>Marquer fait</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity onPress={() => openReportModal(item)}>
                <Text style={styles.cardActionText}>{item.report ? 'Modifier le compte-rendu' : 'Compte-rendu'}</Text>
              </TouchableOpacity>
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
          options={getPrecisionOptions(type, species)}
          placeholder={type === 'vaccin' ? 'Nom du vaccin (optionnel)' : 'Precision (optionnel)'}
          autoFocus
        />
        <DatePickerInput value={scheduledDate} onChange={setScheduledDate} placeholder="Date de l'echeance" />
        <TimePickerInput value={scheduledTime} onChange={setScheduledTime} placeholder="Heure (optionnel)" />
        <RecurrencePicker value={recurrenceMonths} onChange={setRecurrenceMonths} />
        <TouchableOpacity style={styles.addButton} onPress={onCreate}>
          <Text style={styles.addButtonText}>Ajouter</Text>
        </TouchableOpacity>
      </AddModal>

      <AddModal visible={!!reportEntry} title="Compte-rendu" onClose={() => setReportEntry(null)}>
        <TextInput
          style={[styles.input, styles.multiline]}
          placeholder="Notes sur le rendez-vous..."
          value={report}
          onChangeText={setReport}
          multiline
          autoFocus
        />
        <TextInput
          style={styles.input}
          placeholder="Prix (optionnel)"
          keyboardType="decimal-pad"
          value={price}
          onChangeText={setPrice}
        />
        <TouchableOpacity style={styles.addButton} onPress={onSaveReport} disabled={savingReport}>
          <Text style={styles.addButtonText}>{savingReport ? 'Enregistrement...' : 'Enregistrer'}</Text>
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
  card: { backgroundColor: '#FAF6EF', borderRadius: 8, padding: 16, marginBottom: 12 },
  cardTitle: { fontSize: 16, fontWeight: '600', textTransform: 'capitalize' },
  cardSubtitle: { color: '#8A7B68', marginTop: 4 },
  cardReport: { color: '#3A3226', marginTop: 6, fontStyle: 'italic' },
  cardActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 16, marginTop: 10 },
  cardActionText: { color: '#B8863B', fontWeight: '600' },
  cardActionTextDanger: { color: '#B3452C', fontWeight: '600' },
  empty: { color: '#8A7B68', textAlign: 'center', marginTop: 24 },
  typeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 },
  typeChip: { borderWidth: 1, borderColor: '#E3D8C4', borderRadius: 16, paddingVertical: 6, paddingHorizontal: 12 },
  typeChipActive: { backgroundColor: '#B8863B', borderColor: '#B8863B' },
  typeChipText: { color: '#3A3226' },
  typeChipTextActive: { color: 'white' },
  input: { borderWidth: 1, borderColor: '#E3D8C4', borderRadius: 8, padding: 12, marginBottom: 12, color: '#3A3226' },
  multiline: { minHeight: 80, textAlignVertical: 'top' },
  addButton: { backgroundColor: '#B8863B', borderRadius: 8, padding: 14 },
  addButtonText: { color: 'white', textAlign: 'center', fontWeight: '600' },
});
