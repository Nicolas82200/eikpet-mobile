import React, { useCallback, useState } from 'react';
import { Alert, FlatList, RefreshControl, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AppStackParamList } from '../navigation/types';
import * as api from '../api/endpoints';
import type { BoardingEntry, BoardingPeriodicity } from '../types/api';
import { BOARDING_PERIODICITIES, WEEKDAYS, getPeriodicityLabel, getWeekdayLabel } from '../data/boardingPeriodicity';
import DatePickerInput from '../components/DatePickerInput';
import Dropdown from '../components/Dropdown';
import AddIconButton from '../components/AddIconButton';
import AddModal from '../components/AddModal';
import Card from '../components/Card';
import PrimaryButton from '../components/PrimaryButton';
import ScreenHeader from '../components/ScreenHeader';
import { useRefreshable } from '../hooks/useRefreshable';
import { isPlanLimitError, showError, showLoadError } from '../utils/errorHandling';
import { cancelBoardingReminders, scheduleBoardingReminders } from '../notifications/localReminders';
import { usePremium } from '../subscriptions/PurchasesContext';
import { colors, radius, spacing, typography } from '../theme/colors';

type Props = NativeStackScreenProps<AppStackParamList, 'Boardings'>;

type StartMode = 'now' | 'custom';

function todayIsoDate(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatDueDate(entry: BoardingEntry): string {
  const date = new Date(entry.dueDate).toLocaleDateString('fr-FR');
  switch (entry.periodicity) {
    case 'mensuel':
      return `Le ${entry.dayOfMonth} de chaque mois — prochaine echeance le ${date}`;
    case 'annuel':
      return `Chaque annee le ${String(entry.recurrenceDay).padStart(2, '0')}/${String(entry.recurrenceMonth).padStart(2, '0')} — prochaine echeance le ${date}`;
    case 'hebdomadaire':
      return `Chaque ${entry.dayOfWeek != null ? getWeekdayLabel(entry.dayOfWeek).toLowerCase() : ''} — prochaine echeance le ${date}`;
    default:
      return `Le ${date}`;
  }
}

export default function BoardingsScreen({ route, navigation }: Props) {
  const { animalId, animalName } = route.params;
  const { isPremium } = usePremium();
  const [entries, setEntries] = useState<BoardingEntry[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [periodicity, setPeriodicity] = useState<BoardingPeriodicity>('mensuel');
  const [dueDate, setDueDate] = useState('');
  const [startMode, setStartMode] = useState<StartMode>('now');
  const [startDate, setStartDate] = useState(todayIsoDate());
  const [dayOfMonth, setDayOfMonth] = useState('');
  const [annualDate, setAnnualDate] = useState('');
  const [dayOfWeek, setDayOfWeek] = useState<string | null>(null);
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
    setStartMode('now');
    setStartDate(todayIsoDate());
    setDayOfMonth('');
    setAnnualDate('');
    setDayOfWeek(null);
  };

  const buildPayload = () => {
    const base = {
      name: name.trim(),
      price: price ? parseFloat(price) : undefined,
      periodicity,
    };
    if (periodicity === 'unique') {
      return { ...base, dueDate };
    }
    const resolvedStartDate = startMode === 'now' ? todayIsoDate() : startDate;
    if (periodicity === 'mensuel') {
      return { ...base, startDate: resolvedStartDate, dayOfMonth: parseInt(dayOfMonth, 10) };
    }
    if (periodicity === 'annuel') {
      const [, month, day] = annualDate.split('-');
      return { ...base, startDate: resolvedStartDate, recurrenceMonth: parseInt(month, 10), recurrenceDay: parseInt(day, 10) };
    }
    return { ...base, startDate: resolvedStartDate, dayOfWeek: dayOfWeek != null ? parseInt(dayOfWeek, 10) : undefined };
  };

  const isFormValid = () => {
    if (!name.trim()) return false;
    if (periodicity === 'unique') return !!dueDate;
    if (startMode === 'custom' && !startDate) return false;
    if (periodicity === 'mensuel') return !!dayOfMonth;
    if (periodicity === 'annuel') return !!annualDate;
    if (periodicity === 'hebdomadaire') return dayOfWeek != null;
    return true;
  };

  const syncReminders = (entry: BoardingEntry) => {
    if (entry.status === 'regle') {
      cancelBoardingReminders(entry.id).catch(() => undefined);
      return;
    }
    scheduleBoardingReminders({
      animalId,
      animalName,
      boardingId: entry.id,
      boardingName: entry.name,
      dueDate: entry.dueDate.slice(0, 10),
      isPremium,
    }).catch(() => undefined);
  };

  const onCreate = async () => {
    if (!isFormValid()) return;
    setSubmitting(true);
    try {
      const entry = await api.createBoarding(animalId, buildPayload());
      syncReminders(entry);
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
    setStartMode('custom');
    setStartDate(entry.startDate ?? todayIsoDate());
    setDayOfMonth(entry.dayOfMonth != null ? String(entry.dayOfMonth) : '');
    setAnnualDate(
      entry.recurrenceMonth && entry.recurrenceDay
        ? `2000-${String(entry.recurrenceMonth).padStart(2, '0')}-${String(entry.recurrenceDay).padStart(2, '0')}`
        : '',
    );
    setDayOfWeek(entry.dayOfWeek != null ? String(entry.dayOfWeek) : null);
  };

  const onSaveEdit = async () => {
    if (!editingEntry || !isFormValid()) return;
    setSubmitting(true);
    try {
      const entry = await api.updateBoarding(animalId, editingEntry.id, buildPayload());
      syncReminders(entry);
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
      const updated = await api.updateBoarding(animalId, entry.id, {
        status: entry.status === 'regle' ? 'non_regle' : 'regle',
      });
      syncReminders(updated);
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
            await cancelBoardingReminders(entry.id);
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

      {periodicity === 'unique' && (
        <>
          <Text style={styles.label}>Echeance</Text>
          <DatePickerInput value={dueDate} onChange={setDueDate} />
        </>
      )}

      {periodicity === 'mensuel' && (
        <>
          <Text style={styles.label}>Jour de paiement (1-31)</Text>
          <TextInput
            style={styles.input}
            placeholder="Ex : 10"
            keyboardType="number-pad"
            maxLength={2}
            value={dayOfMonth}
            onChangeText={setDayOfMonth}
          />
        </>
      )}

      {periodicity === 'annuel' && (
        <>
          <Text style={styles.label}>Date de paiement chaque annee (ex : 10/02)</Text>
          <DatePickerInput value={annualDate} onChange={setAnnualDate} />
        </>
      )}

      {periodicity === 'hebdomadaire' && (
        <>
          <Text style={styles.label}>Jour de la semaine</Text>
          <Dropdown
            value={dayOfWeek}
            onChange={setDayOfWeek}
            options={WEEKDAYS.map((d) => ({ value: String(d.value), label: d.label }))}
            placeholder="Choisir un jour"
          />
          <View style={styles.spacer} />
        </>
      )}

      {periodicity !== 'unique' && (
        <>
          <Text style={styles.label}>Depuis quand</Text>
          <View style={styles.chipRow}>
            <TouchableOpacity
              style={[styles.chip, startMode === 'now' && styles.chipActive]}
              onPress={() => setStartMode('now')}
            >
              <Text style={startMode === 'now' ? styles.chipTextActive : styles.chipText}>A partir de maintenant</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.chip, startMode === 'custom' && styles.chipActive]}
              onPress={() => setStartMode('custom')}
            >
              <Text style={startMode === 'custom' ? styles.chipTextActive : styles.chipText}>Date precise</Text>
            </TouchableOpacity>
          </View>
          {startMode === 'custom' && <DatePickerInput value={startDate} onChange={setStartDate} />}
        </>
      )}

      <PrimaryButton
        title={submitting ? 'Enregistrement...' : submitLabel}
        onPress={onSubmit}
        disabled={submitting || !isFormValid()}
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
              {formatDueDate(item)} — {getPeriodicityLabel(item.periodicity)}
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
  spacer: { height: spacing.md },
  submitButton: { marginTop: spacing.sm },
});
