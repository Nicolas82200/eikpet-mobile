import React, { useCallback, useState } from 'react';
import { Alert, FlatList, RefreshControl, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AppStackParamList } from '../navigation/types';
import * as api from '../api/endpoints';
import type { RidingSession, RidingSessionType } from '../types/api';
import { RIDING_SESSION_TYPES, getRidingSessionTypeLabel } from '../data/ridingSessionTypes';
import DatePickerInput from '../components/DatePickerInput';
import AddIconButton from '../components/AddIconButton';
import AddModal from '../components/AddModal';
import { useRefreshable } from '../hooks/useRefreshable';
import { isPlanLimitError, showError, showLoadError } from '../utils/errorHandling';

type Props = NativeStackScreenProps<AppStackParamList, 'RidingSessions'>;

export default function RidingSessionsScreen({ route, navigation }: Props) {
  const { animalId } = route.params;
  const [sessions, setSessions] = useState<RidingSession[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [type, setType] = useState<RidingSessionType>('dressage');
  const [scheduledDate, setScheduledDate] = useState('');
  const [price, setPrice] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(() => {
    return api.listRidingSessions(animalId).then(setSessions).catch(showLoadError);
  }, [animalId]);
  const { refreshing, trigger, onRefresh } = useRefreshable(load);

  useFocusEffect(trigger);

  const resetForm = () => {
    setType('dressage');
    setScheduledDate('');
    setPrice('');
  };

  const onCreate = async () => {
    if (!scheduledDate) return;
    setSubmitting(true);
    try {
      await api.createRidingSession(animalId, {
        type,
        scheduledDate,
        price: price ? parseFloat(price) : undefined,
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

  const onToggleDone = async (session: RidingSession) => {
    try {
      await api.updateRidingSession(animalId, session.id, {
        status: session.status === 'fait' ? 'prevu' : 'fait',
      });
      load();
    } catch (error) {
      showError(error);
    }
  };

  const onDelete = (session: RidingSession) => {
    Alert.alert('Supprimer cette seance ?', undefined, [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.deleteRidingSession(animalId, session.id);
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
        data={sessions}
        keyExtractor={(item) => String(item.id)}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListHeaderComponent={
          <View style={styles.titleRow}>
            <Text style={styles.title}>Seances</Text>
            <AddIconButton onPress={() => setModalVisible(true)} />
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{getRidingSessionTypeLabel(item.type)}</Text>
            <Text style={styles.cardSubtitle}>
              {new Date(item.scheduledDate).toLocaleDateString('fr-FR')}
              {item.price != null ? ` — ${item.price} €` : ''}
            </Text>
            {item.report && <Text style={styles.cardReport}>{item.report}</Text>}
            <View style={styles.cardActions}>
              <TouchableOpacity onPress={() => onToggleDone(item)}>
                <Text style={item.status === 'fait' ? styles.statusDone : styles.statusPlanned}>
                  {item.status === 'fait' ? 'Faite' : 'Prevue'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => onDelete(item)}>
                <Text style={styles.deleteLink}>Supprimer</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.empty}>Aucune seance pour l'instant</Text>}
      />

      <AddModal
        visible={modalVisible}
        title="Ajouter une seance"
        onClose={() => {
          setModalVisible(false);
          resetForm();
        }}
      >
        <Text style={styles.label}>Type</Text>
        <View style={styles.chipRow}>
          {RIDING_SESSION_TYPES.map((t) => (
            <TouchableOpacity
              key={t.value}
              style={[styles.chip, type === t.value && styles.chipActive]}
              onPress={() => setType(t.value)}
            >
              <Text style={type === t.value ? styles.chipTextActive : styles.chipText}>{t.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Date</Text>
        <DatePickerInput value={scheduledDate} onChange={setScheduledDate} />

        <TextInput
          style={styles.input}
          placeholder="Prix (€)"
          keyboardType="decimal-pad"
          value={price}
          onChangeText={setPrice}
        />

        <TouchableOpacity style={styles.submitButton} onPress={onCreate} disabled={submitting || !scheduledDate}>
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
  card: { backgroundColor: '#EDE3D0', borderRadius: 8, padding: 16, marginBottom: 12 },
  cardTitle: { fontSize: 16, fontWeight: '600' },
  cardSubtitle: { color: '#8A7B68', marginTop: 4 },
  cardReport: { color: '#3A3226', marginTop: 8 },
  cardActions: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  statusDone: { color: '#2E7D32', fontWeight: '600' },
  statusPlanned: { color: '#B8863B', fontWeight: '600' },
  deleteLink: { color: '#B3452C', fontWeight: '600' },
  empty: { color: '#8A7B68', textAlign: 'center', marginTop: 24 },
  label: { color: '#8A7B68', marginBottom: 8, marginTop: 4 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 },
  chip: { borderWidth: 1, borderColor: '#E3D8C4', borderRadius: 16, paddingVertical: 6, paddingHorizontal: 12 },
  chipActive: { backgroundColor: '#B8863B', borderColor: '#B8863B' },
  chipText: { color: '#3A3226' },
  chipTextActive: { color: 'white', fontWeight: '600' },
  input: { borderWidth: 1, borderColor: '#E3D8C4', borderRadius: 8, padding: 12, marginBottom: 12, marginTop: 12, backgroundColor: '#EFE2C4', color: '#000000' },
  submitButton: { backgroundColor: '#B8863B', borderRadius: 8, padding: 14, marginTop: 8 },
  submitButtonText: { color: 'white', textAlign: 'center', fontWeight: '600' },
});
