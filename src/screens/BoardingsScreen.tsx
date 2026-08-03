import React, { useCallback, useState } from 'react';
import { Alert, FlatList, RefreshControl, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AppStackParamList } from '../navigation/types';
import * as api from '../api/endpoints';
import type { BoardingEntry, BoardingPeriodicity } from '../types/api';
import { BOARDING_PERIODICITIES, getPeriodicityLabel } from '../data/boardingPeriodicity';
import DatePickerInput from '../components/DatePickerInput';
import AddIconButton from '../components/AddIconButton';
import AddModal from '../components/AddModal';
import { useRefreshable } from '../hooks/useRefreshable';
import { isPlanLimitError, showError, showLoadError } from '../utils/errorHandling';

type Props = NativeStackScreenProps<AppStackParamList, 'Boardings'>;

export default function BoardingsScreen({ route, navigation }: Props) {
  const { animalId } = route.params;
  const [entries, setEntries] = useState<BoardingEntry[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [periodicity, setPeriodicity] = useState<BoardingPeriodicity>('mensuel');
  const [dueDate, setDueDate] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(() => {
    return api.listBoardings(animalId).then(setEntries).catch(showLoadError);
  }, [animalId]);
  const { refreshing, trigger, onRefresh } = useRefreshable(load);

  useFocusEffect(trigger);

  const resetForm = () => {
    setName('');
    setPrice('');
    setPeriodicity('mensuel');
    setDueDate('');
  };

  const onCreate = async () => {
    if (!name.trim() || !dueDate) return;
    setSubmitting(true);
    try {
      await api.createBoarding(animalId, {
        name: name.trim(),
        price: price ? parseFloat(price) : undefined,
        periodicity,
        dueDate,
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

  const onTogglePaid = async (entry: BoardingEntry) => {
    try {
      await api.updateBoarding(animalId, entry.id, {
        status: entry.status === 'regle' ? 'non_regle' : 'regle',
      });
      load();
    } catch (error) {
      showError(error);
    }
  };

  const onDelete = (entry: BoardingEntry) => {
    Alert.alert('Supprimer cette echeance ?', entry.name, [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.deleteBoarding(animalId, entry.id);
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
            <Text style={styles.title}>Pension</Text>
            <AddIconButton onPress={() => setModalVisible(true)} />
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{item.name}</Text>
            <Text style={styles.cardSubtitle}>
              {new Date(item.dueDate).toLocaleDateString('fr-FR')} — {getPeriodicityLabel(item.periodicity)}
              {item.price != null ? ` — ${item.price} €` : ''}
            </Text>
            <View style={styles.cardActions}>
              <TouchableOpacity onPress={() => onTogglePaid(item)}>
                <Text style={item.status === 'regle' ? styles.statusPaid : styles.statusUnpaid}>
                  {item.status === 'regle' ? 'Regle' : 'Non regle'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => onDelete(item)}>
                <Text style={styles.deleteLink}>Supprimer</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.empty}>Aucune echeance de pension pour l'instant</Text>}
      />

      <AddModal
        visible={modalVisible}
        title="Ajouter une echeance de pension"
        onClose={() => {
          setModalVisible(false);
          resetForm();
        }}
      >
        <TextInput style={styles.input} placeholder="Nom de la pension" value={name} onChangeText={setName} />
        <TextInput
          style={styles.input}
          placeholder="Prix (€)"
          keyboardType="decimal-pad"
          value={price}
          onChangeText={setPrice}
        />

        <Text style={styles.label}>Periodicite</Text>
        <View style={styles.chipRow}>
          {BOARDING_PERIODICITIES.map((p) => (
            <TouchableOpacity
              key={p.value}
              style={[styles.chip, periodicity === p.value && styles.chipActive]}
              onPress={() => setPeriodicity(p.value)}
            >
              <Text style={periodicity === p.value ? styles.chipTextActive : styles.chipText}>{p.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Echeance</Text>
        <DatePickerInput value={dueDate} onChange={setDueDate} />

        <TouchableOpacity
          style={styles.submitButton}
          onPress={onCreate}
          disabled={submitting || !name.trim() || !dueDate}
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
  card: { backgroundColor: '#FAF6EF', borderRadius: 8, padding: 16, marginBottom: 12 },
  cardTitle: { fontSize: 16, fontWeight: '600' },
  cardSubtitle: { color: '#8A7B68', marginTop: 4 },
  cardActions: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  statusPaid: { color: '#2E7D32', fontWeight: '600' },
  statusUnpaid: { color: '#B3452C', fontWeight: '600' },
  deleteLink: { color: '#B3452C', fontWeight: '600' },
  empty: { color: '#8A7B68', textAlign: 'center', marginTop: 24 },
  label: { color: '#8A7B68', marginBottom: 8, marginTop: 4 },
  input: { borderWidth: 1, borderColor: '#E3D8C4', borderRadius: 8, padding: 12, marginBottom: 12, backgroundColor: '#EFE2C4', color: '#B8863B' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 },
  chip: { borderWidth: 1, borderColor: '#E3D8C4', borderRadius: 16, paddingVertical: 6, paddingHorizontal: 12 },
  chipActive: { backgroundColor: '#B8863B', borderColor: '#B8863B' },
  chipText: { color: '#3A3226' },
  chipTextActive: { color: 'white', fontWeight: '600' },
  submitButton: { backgroundColor: '#B8863B', borderRadius: 8, padding: 14, marginTop: 8 },
  submitButtonText: { color: 'white', textAlign: 'center', fontWeight: '600' },
});
