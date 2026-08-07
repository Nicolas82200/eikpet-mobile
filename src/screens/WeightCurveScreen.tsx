import React, { useCallback, useState } from 'react';
import { Alert, FlatList, RefreshControl, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AppStackParamList } from '../navigation/types';
import * as api from '../api/endpoints';
import type { WeightEntry } from '../types/api';
import DatePickerInput from '../components/DatePickerInput';
import AddIconButton from '../components/AddIconButton';
import AddModal from '../components/AddModal';
import { useRefreshable } from '../hooks/useRefreshable';
import { isPlanLimitError, showError, showLoadError } from '../utils/errorHandling';

type Props = NativeStackScreenProps<AppStackParamList, 'WeightCurve'>;

const CHART_HEIGHT = 140;
const BAR_WIDTH = 36;

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('fr-FR');
}

export default function WeightCurveScreen({ route, navigation }: Props) {
  const { animalId } = route.params;
  const [entries, setEntries] = useState<WeightEntry[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [weightKg, setWeightKg] = useState('');
  const [recordedDate, setRecordedDate] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(() => {
    return api.listWeightEntries(animalId).then(setEntries).catch(showLoadError);
  }, [animalId]);
  const { refreshing, trigger, onRefresh } = useRefreshable(load);

  useFocusEffect(trigger);

  const resetForm = () => {
    setWeightKg('');
    setRecordedDate('');
    setNotes('');
  };

  const onCreate = async () => {
    const parsedWeight = parseFloat(weightKg.replace(',', '.'));
    if (!recordedDate || Number.isNaN(parsedWeight)) return;
    setSubmitting(true);
    try {
      await api.createWeightEntry(animalId, {
        weightKg: parsedWeight,
        recordedDate,
        notes: notes.trim() || undefined,
      });
      resetForm();
      setModalVisible(false);
      load();
    } catch (error) {
      if (isPlanLimitError(error)) {
        setModalVisible(false);
        navigation.navigate('Paywall');
      } else {
        showError(error);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const onDelete = (entry: WeightEntry) => {
    Alert.alert('Supprimer cette pesee ?', `${entry.weightKg} kg — ${formatDate(entry.recordedDate)}`, [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.deleteWeightEntry(animalId, entry.id);
            load();
          } catch (error) {
            showError(error);
          }
        },
      },
    ]);
  };

  const weights = entries.map((e) => e.weightKg);
  const minWeight = weights.length ? Math.min(...weights) : 0;
  const maxWeight = weights.length ? Math.max(...weights) : 0;
  const range = maxWeight - minWeight || 1;

  const descEntries = [...entries].reverse();

  return (
    <>
      <FlatList
        style={styles.container}
        contentContainerStyle={styles.content}
        data={descEntries}
        keyExtractor={(item) => String(item.id)}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListHeaderComponent={
          <>
            <View style={styles.titleRow}>
              <Text style={styles.title}>Courbe de poids</Text>
              <AddIconButton onPress={() => setModalVisible(true)} />
            </View>

            {entries.length > 1 && (
              <View style={styles.chartCard}>
                <ScrollView horizontal contentContainerStyle={styles.chartRow}>
                  {entries.map((entry) => {
                    const ratio = (entry.weightKg - minWeight) / range;
                    const barHeight = 20 + ratio * (CHART_HEIGHT - 20);
                    return (
                      <View key={entry.id} style={styles.barColumn}>
                        <Text style={styles.barValue}>{entry.weightKg}</Text>
                        <View style={styles.barTrack}>
                          <View style={[styles.bar, { height: barHeight }]} />
                        </View>
                        <Text style={styles.barLabel}>{formatDate(entry.recordedDate)}</Text>
                      </View>
                    );
                  })}
                </ScrollView>
              </View>
            )}
          </>
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{item.weightKg} kg</Text>
            <Text style={styles.cardSubtitle}>{formatDate(item.recordedDate)}</Text>
            {item.notes ? <Text style={styles.cardNotes}>{item.notes}</Text> : null}
            <TouchableOpacity onPress={() => onDelete(item)}>
              <Text style={styles.deleteLink}>Supprimer</Text>
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.empty}>Aucune pesee enregistree pour l'instant</Text>}
      />

      <AddModal
        visible={modalVisible}
        title="Ajouter une pesee"
        onClose={() => {
          setModalVisible(false);
          resetForm();
        }}
      >
        <Text style={styles.label}>Poids (kg)</Text>
        <TextInput
          style={styles.input}
          placeholder="Ex : 12.5"
          keyboardType="decimal-pad"
          value={weightKg}
          onChangeText={setWeightKg}
        />

        <Text style={styles.label}>Date</Text>
        <DatePickerInput value={recordedDate} onChange={setRecordedDate} />

        <Text style={styles.label}>Notes (optionnel)</Text>
        <TextInput style={styles.input} placeholder="Notes" value={notes} onChangeText={setNotes} />

        <TouchableOpacity
          style={styles.submitButton}
          onPress={onCreate}
          disabled={submitting || !recordedDate || !weightKg.trim()}
        >
          <Text style={styles.submitButtonText}>{submitting ? 'Enregistrement...' : 'Ajouter'}</Text>
        </TouchableOpacity>
      </AddModal>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16 },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  title: { fontSize: 22, fontWeight: 'bold' },
  chartCard: {
    backgroundColor: '#EDE3D0',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 8,
    marginBottom: 16,
  },
  chartRow: { alignItems: 'flex-end', paddingHorizontal: 8 },
  barColumn: { width: BAR_WIDTH, alignItems: 'center', marginHorizontal: 6 },
  barValue: { fontSize: 11, color: '#3A3226', marginBottom: 4, fontWeight: '600' },
  barTrack: { height: CHART_HEIGHT, justifyContent: 'flex-end' },
  bar: { width: 14, backgroundColor: '#B8863B', borderRadius: 7 },
  barLabel: { fontSize: 10, color: '#8A7B68', marginTop: 6, textAlign: 'center' },
  card: { backgroundColor: '#EDE3D0', borderRadius: 8, padding: 16, marginBottom: 12 },
  cardTitle: { fontSize: 16, fontWeight: '600' },
  cardSubtitle: { color: '#8A7B68', marginTop: 4 },
  cardNotes: { color: '#3A3226', marginTop: 6 },
  deleteLink: { color: '#B3452C', fontWeight: '600', marginTop: 8 },
  empty: { color: '#8A7B68', textAlign: 'center', marginTop: 24 },
  label: { color: '#8A7B68', marginBottom: 8, marginTop: 4 },
  input: {
    borderWidth: 1,
    borderColor: '#E3D8C4',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    backgroundColor: '#EFE2C4',
    color: '#000000',
  },
  submitButton: { backgroundColor: '#B8863B', borderRadius: 8, padding: 14, marginTop: 8 },
  submitButtonText: { color: 'white', textAlign: 'center', fontWeight: '600' },
});
