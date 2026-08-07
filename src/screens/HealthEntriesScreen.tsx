import React, { useCallback, useState } from 'react';
import { Alert, FlatList, RefreshControl, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AppStackParamList } from '../navigation/types';
import * as api from '../api/endpoints';
import type { HealthEntry, HealthEntryType, VaccinationScheduleStep } from '../types/api';
import AddIconButton from '../components/AddIconButton';
import AddModal from '../components/AddModal';
import AutocompleteInput from '../components/AutocompleteInput';
import Card from '../components/Card';
import DatePickerInput from '../components/DatePickerInput';
import Dropdown from '../components/Dropdown';
import PrimaryButton from '../components/PrimaryButton';
import ReminderPicker from '../components/ReminderPicker';
import ScreenHeader from '../components/ScreenHeader';
import TimePickerInput from '../components/TimePickerInput';
import { HEALTH_ENTRY_TYPES, getHealthEntryTypeLabel } from '../data/healthEntryTypes';
import { getVaccinesForSpecies } from '../data/vaccines';
import { getDewormersForSpecies } from '../data/dewormers';
import { scheduleAppointmentFollowUp, cancelAppointmentFollowUp } from '../notifications/localReminders';
import { useRefreshable } from '../hooks/useRefreshable';
import { showError, showLoadError } from '../utils/errorHandling';
import { formatTime } from '../utils/formatting';
import { colors, radius, spacing, typography } from '../theme/colors';

type Props = NativeStackScreenProps<AppStackParamList, 'HealthEntries'>;

function getPrecisionOptions(type: HealthEntryType | null, species: string): readonly string[] {
  if (type === 'vaccin') return getVaccinesForSpecies(species);
  if (type === 'vermifuge') return getDewormersForSpecies(species);
  return [];
}

export default function HealthEntriesScreen({ route }: Props) {
  const { animalId, animalName, species } = route.params;
  const [entries, setEntries] = useState<HealthEntry[]>([]);
  const [vaccinationSchedule, setVaccinationSchedule] = useState<VaccinationScheduleStep[]>([]);
  const [type, setType] = useState<HealthEntryType | null>(null);
  const [customTypeLabel, setCustomTypeLabel] = useState('');
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [recurrenceMonths, setRecurrenceMonths] = useState<number | null>(null);
  const [isPastAppointment, setIsPastAppointment] = useState(false);
  const [createPrice, setCreatePrice] = useState('');
  const [modalVisible, setModalVisible] = useState(false);

  const [reportEntry, setReportEntry] = useState<HealthEntry | null>(null);
  const [report, setReport] = useState('');
  const [price, setPrice] = useState('');
  const [savingReport, setSavingReport] = useState(false);

  const load = useCallback(() => {
    api.getVaccinationSchedule(animalId).then((s) => setVaccinationSchedule(s ?? [])).catch(() => setVaccinationSchedule([]));
    return api.listHealthEntries(animalId).then(setEntries).catch(showLoadError);
  }, [animalId]);
  const { refreshing, trigger, onRefresh } = useRefreshable(load);

  useFocusEffect(trigger);

  const onQuickAddFromSchedule = (step: VaccinationScheduleStep) => {
    setType('vaccin');
    setCustomTypeLabel(step.label);
    setScheduledDate(step.targetDate);
    setScheduledTime('');
    setRecurrenceMonths(null);
    setIsPastAppointment(false);
    setCreatePrice('');
    setModalVisible(true);
  };

  const resetCreateForm = () => {
    setType(null);
    setCustomTypeLabel('');
    setScheduledDate('');
    setScheduledTime('');
    setRecurrenceMonths(null);
    setIsPastAppointment(false);
    setCreatePrice('');
  };

  const onCreate = async () => {
    if (!type || !scheduledDate) return;
    try {
      const entry = await api.createHealthEntry(animalId, {
        type,
        scheduledDate,
        scheduledTime: scheduledTime || undefined,
        customTypeLabel: customTypeLabel.trim() || undefined,
        recurrenceMonths: recurrenceMonths ?? undefined,
        status: isPastAppointment ? 'fait' : 'prevu',
        price: isPastAppointment && createPrice ? parseFloat(createPrice) : undefined,
      });
      if (scheduledTime) {
        await scheduleAppointmentFollowUp({
          animalId,
          animalName,
          entryId: entry.id,
          entryLabel: customTypeLabel.trim() || getHealthEntryTypeLabel(type),
          scheduledDate,
          scheduledTime,
        });
      }
      resetCreateForm();
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
          <>
            <ScreenHeader
              title={`Carnet de sante — ${animalName}`}
              action={<AddIconButton onPress={() => setModalVisible(true)} />}
            />
            {vaccinationSchedule.length > 0 && (
              <Card style={styles.scheduleCard}>
                <Text style={styles.scheduleTitle}>Protocole de primo-vaccination suggere</Text>
                <Text style={styles.scheduleSubtitle}>
                  A adapter avec ton veterinaire selon l&apos;etat des anticorps maternels.
                </Text>
                {vaccinationSchedule.map((step) => (
                  <View key={step.label} style={styles.scheduleStep}>
                    <View style={styles.scheduleStepText}>
                      <Text style={styles.scheduleStepLabel}>{step.label}</Text>
                      <Text style={styles.scheduleStepDate}>{step.targetDate}</Text>
                    </View>
                    <TouchableOpacity onPress={() => onQuickAddFromSchedule(step)}>
                      <Text style={styles.scheduleStepAdd}>Ajouter</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </Card>
            )}
          </>
        }
        renderItem={({ item }) => (
          <Card>
            <Text style={styles.cardTitle}>{item.customTypeLabel ?? getHealthEntryTypeLabel(item.type)}</Text>
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
          </Card>
        )}
        ListEmptyComponent={<Text style={styles.empty}>Aucune entree pour l&apos;instant</Text>}
      />

      <AddModal
        visible={modalVisible}
        title="Ajouter une entree"
        onClose={() => {
          setModalVisible(false);
          resetCreateForm();
        }}
      >
        <View style={styles.switchRow}>
          <Text style={styles.label}>Rendez-vous deja passe</Text>
          <Switch value={isPastAppointment} onValueChange={setIsPastAppointment} />
        </View>

        <Dropdown
          value={type}
          onChange={setType}
          options={HEALTH_ENTRY_TYPES}
          placeholder="Type d'entree"
        />
        <View style={styles.spacer} />
        <AutocompleteInput
          value={customTypeLabel}
          onChange={setCustomTypeLabel}
          options={getPrecisionOptions(type, species)}
          placeholder={type === 'vaccin' ? 'Nom du vaccin (optionnel)' : 'Precision (optionnel)'}
        />
        <DatePickerInput value={scheduledDate} onChange={setScheduledDate} placeholder="Date de l'echeance" />
        <TimePickerInput value={scheduledTime} onChange={setScheduledTime} placeholder="Heure (optionnel)" />
        <ReminderPicker value={recurrenceMonths} onChange={setRecurrenceMonths} />

        {isPastAppointment && (
          <TextInput
            style={styles.input}
            placeholder="Prix paye (optionnel)"
            keyboardType="decimal-pad"
            value={createPrice}
            onChangeText={setCreatePrice}
          />
        )}

        <PrimaryButton title="Ajouter" onPress={onCreate} disabled={!type || !scheduledDate} />
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
        <PrimaryButton
          title={savingReport ? 'Enregistrement...' : 'Enregistrer'}
          onPress={onSaveReport}
          disabled={savingReport}
          loading={savingReport}
        />
      </AddModal>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: spacing.lg },
  scheduleCard: {},
  scheduleTitle: { ...typography.sectionTitle, fontSize: 15 },
  scheduleSubtitle: { color: colors.textSecondary, marginTop: spacing.xs, marginBottom: 10, fontSize: 12 },
  scheduleStep: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  scheduleStepText: { flexShrink: 1, marginRight: spacing.md },
  scheduleStepLabel: { color: colors.textPrimary, fontWeight: '600' },
  scheduleStepDate: { color: colors.textSecondary, marginTop: 2, fontSize: 12 },
  scheduleStepAdd: { color: colors.accent, fontWeight: '600' },
  cardTitle: { ...typography.sectionTitle, fontSize: 16, textTransform: 'capitalize' },
  cardSubtitle: { ...typography.caption, marginTop: spacing.xs },
  cardReport: { color: colors.textPrimary, marginTop: spacing.sm, fontStyle: 'italic' },
  cardActions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.lg, marginTop: spacing.md },
  cardActionText: { color: colors.accent, fontWeight: '600' },
  cardActionTextDanger: { color: colors.danger, fontWeight: '600' },
  empty: { color: colors.textSecondary, textAlign: 'center', marginTop: spacing.xl },
  spacer: { height: spacing.md },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    padding: spacing.md,
    marginBottom: spacing.md,
    backgroundColor: colors.fieldBackground,
    color: '#000000',
  },
  label: { color: colors.textSecondary },
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.md },
  multiline: { minHeight: 80, textAlignVertical: 'top' },
});
