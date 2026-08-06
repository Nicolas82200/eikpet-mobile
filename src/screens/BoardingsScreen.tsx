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
import Card from '../components/Card';
import PrimaryButton from '../components/PrimaryButton';
import ScreenHeader from '../components/ScreenHeader';
import { useRefreshable } from '../hooks/useRefreshable';
import { isPlanLimitError, showError, showLoadError } from '../utils/errorHandling';
import { colors, radius, spacing, typography } from '../theme/colors';

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
  const [editingEntry, setEditingEntry] = useState<BoardingEntry | null>(null);

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

  const openEditModal = (entry: BoardingEntry) => {
    setEditingEntry(entry);
    setName(entry.name);
    setPrice(entry.price != null ? String(entry.price) : '');
    setPeriodicity(entry.periodicity);
    setDueDate(entry.dueDate.slice(0, 10));
  };

  const onSaveEdit = async () => {
    if (!editingEntry || !name.trim() || !dueDate) return;
    setSubmitting(true);
    try {
      await api.updateBoarding(animalId, editingEntry.id, {
        name: name.trim(),
        price: price ? parseFloat(price) : undefined,
        periodicity,
        dueDate,
      });
      resetForm();
      setEditingEntry(null);
      load();
    } catch (error) {
      showError(error);
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

  const renderForm = (onSubmit: () => void, submitLabel: string) => (
    <>
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

      <PrimaryButton
        title={submitting ? 'Enregistrement...' : submitLabel}
        onPress={onSubmit}
        disabled={submitting || !name.trim() || !dueDate}
        loading={submitting}
        style={styles.submitButton}
      />
    </>
  );

  return (
    <>
      <FlatList
        style={styles.container}
        contentContainerStyle={styles.content}
        data={entries}
        keyExtractor={(item) => String(item.id)}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListHeaderComponent={<ScreenHeader title="Pension" action={<AddIconButton onPress={() => setModalVisible(true)} />} />}
        renderItem={({ item }) => (
          <Card>
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
              <TouchableOpacity onPress={() => openEditModal(item)}>
                <Text style={styles.editLink}>Modifier</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => onDelete(item)}>
                <Text style={styles.deleteLink}>Supprimer</Text>
              </TouchableOpacity>
            </View>
          </Card>
        )}
        ListEmptyComponent={<Text style={styles.empty}>Aucune echeance de pension pour l&apos;instant</Text>}
      />

      <AddModal
        visible={modalVisible}
        title="Ajouter une echeance de pension"
        onClose={() => {
          setModalVisible(false);
          resetForm();
        }}
      >
        {renderForm(onCreate, 'Ajouter')}
      </AddModal>

      <AddModal
        visible={!!editingEntry}
        title="Modifier l'echeance"
        onClose={() => {
          setEditingEntry(null);
          resetForm();
        }}
      >
        {renderForm(onSaveEdit, 'Enregistrer')}
      </AddModal>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: spacing.lg },
  cardTitle: { ...typography.sectionTitle, fontSize: 16 },
  cardSubtitle: { ...typography.caption, marginTop: spacing.xs },
  cardActions: { flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.sm },
  statusPaid: { color: colors.success, fontWeight: '600' },
  statusUnpaid: { color: colors.danger, fontWeight: '600' },
  editLink: { color: colors.accent, fontWeight: '600' },
  deleteLink: { color: colors.danger, fontWeight: '600' },
  empty: { color: colors.textSecondary, textAlign: 'center', marginTop: spacing.xl },
  label: { color: colors.textSecondary, marginBottom: spacing.sm, marginTop: spacing.xs },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    padding: spacing.md,
    marginBottom: spacing.md,
    backgroundColor: colors.fieldBackground,
    color: '#000000',
  },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.md },
  chip: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.pill, paddingVertical: 6, paddingHorizontal: spacing.md },
  chipActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  chipText: { color: colors.textPrimary },
  chipTextActive: { color: 'white', fontWeight: '600' },
  submitButton: { marginTop: spacing.sm },
});
