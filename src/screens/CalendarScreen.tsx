import React, { useCallback, useMemo, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AppStackParamList } from '../navigation/types';
import * as api from '../api/endpoints';
import type { Animal, CalendarEntry, HealthEntryType } from '../types/api';
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
import { HEALTH_ENTRY_TYPES, getHealthEntryTypeColor, getHealthEntryTypeLabel } from '../data/healthEntryTypes';
import { getVaccinesForSpecies } from '../data/vaccines';
import { getDewormersForSpecies } from '../data/dewormers';
import { scheduleAppointmentFollowUp } from '../notifications/localReminders';
import { useRefreshable } from '../hooks/useRefreshable';
import { showError, showLoadError } from '../utils/errorHandling';
import { formatTime } from '../utils/formatting';
import { colors, radius, spacing, typography } from '../theme/colors';

type Props = NativeStackScreenProps<AppStackParamList, 'Calendar'>;

const WEEKDAY_LABELS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
const MONTH_LABELS = [
  'Janvier', 'Fevrier', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Aout', 'Septembre', 'Octobre', 'Novembre', 'Decembre',
];

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

function toIso(year: number, month: number, day: number): string {
  return `${year}-${pad(month + 1)}-${pad(day)}`;
}

function todayIso(): string {
  const now = new Date();
  return toIso(now.getFullYear(), now.getMonth(), now.getDate());
}

interface MonthCell {
  iso: string;
  day: number;
  inMonth: boolean;
}

function buildMonthCells(year: number, month: number): MonthCell[] {
  const firstWeekday = (new Date(year, month, 1).getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const prevMonthDays = new Date(year, month, 0).getDate();
  const cells: MonthCell[] = [];

  for (let i = firstWeekday - 1; i >= 0; i--) {
    const day = prevMonthDays - i;
    const m = month === 0 ? 11 : month - 1;
    const y = month === 0 ? year - 1 : year;
    cells.push({ iso: toIso(y, m, day), day, inMonth: false });
  }
  for (let day = 1; day <= daysInMonth; day++) {
    cells.push({ iso: toIso(year, month, day), day, inMonth: true });
  }
  let nextDay = 1;
  while (cells.length % 7 !== 0) {
    const m = month === 11 ? 0 : month + 1;
    const y = month === 11 ? year + 1 : year;
    cells.push({ iso: toIso(y, m, nextDay), day: nextDay, inMonth: false });
    nextDay += 1;
  }
  return cells;
}

function getPrecisionOptions(type: HealthEntryType | null, species: string | undefined): readonly string[] {
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

  const today = useMemo(() => new Date(), []);
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const [selectedAnimalId, setSelectedAnimalId] = useState<number | null>(null);
  const [type, setType] = useState<HealthEntryType | null>(null);
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

  const entriesByDate = useMemo(() => {
    const map = new Map<string, CalendarEntry[]>();
    for (const entry of entries) {
      const iso = entry.scheduledDate.slice(0, 10);
      const list = map.get(iso) ?? [];
      list.push(entry);
      map.set(iso, list);
    }
    return map;
  }, [entries]);

  const monthCells = useMemo(() => buildMonthCells(viewYear, viewMonth), [viewYear, viewMonth]);

  const goToPreviousMonth = () => {
    setSelectedDate(null);
    if (viewMonth === 0) {
      setViewYear((y) => y - 1);
      setViewMonth(11);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const goToNextMonth = () => {
    setSelectedDate(null);
    if (viewMonth === 11) {
      setViewYear((y) => y + 1);
      setViewMonth(0);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const visibleEntries = selectedDate
    ? (entriesByDate.get(selectedDate) ?? [])
    : [...entries].sort((a, b) => a.scheduledDate.localeCompare(b.scheduledDate));

  const openModal = () => {
    setSelectedAnimalId(animals[0]?.id ?? null);
    setModalVisible(true);
  };

  const onCreate = async () => {
    if (!selectedAnimalId || !type || !scheduledDate || !selectedAnimal) return;
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
          entryLabel: customTypeLabel.trim() || getHealthEntryTypeLabel(type),
          scheduledDate,
          scheduledTime,
        });
      }
      setType(null);
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
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <ScreenHeader title={`Calendrier — ${householdName}`} action={<AddIconButton onPress={openModal} />} />

        <View style={styles.monthNav}>
          <TouchableOpacity onPress={goToPreviousMonth} style={styles.monthNavButton}>
            <Text style={styles.monthNavText}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.monthLabel}>{MONTH_LABELS[viewMonth]} {viewYear}</Text>
          <TouchableOpacity onPress={goToNextMonth} style={styles.monthNavButton}>
            <Text style={styles.monthNavText}>›</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.weekdayRow}>
          {WEEKDAY_LABELS.map((label, i) => (
            <Text key={i} style={styles.weekdayLabel}>{label}</Text>
          ))}
        </View>

        <View style={styles.grid}>
          {monthCells.map((cell) => {
            const dayEntries = entriesByDate.get(cell.iso) ?? [];
            const isToday = cell.iso === todayIso();
            const isSelected = cell.iso === selectedDate;
            return (
              <TouchableOpacity
                key={cell.iso}
                style={[styles.cell, isSelected && styles.cellSelected]}
                onPress={() => setSelectedDate((current) => (current === cell.iso ? null : cell.iso))}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.cellText,
                    !cell.inMonth && styles.cellTextOutOfMonth,
                    isToday && styles.cellTextToday,
                    isSelected && styles.cellTextSelected,
                  ]}
                >
                  {cell.day}
                </Text>
                <View style={styles.dotRow}>
                  {dayEntries.slice(0, 3).map((entry, idx) => (
                    <View key={idx} style={[styles.dot, { backgroundColor: getHealthEntryTypeColor(entry.type) }]} />
                  ))}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.legend}>
          {HEALTH_ENTRY_TYPES.map((t) => (
            <View key={t.value} style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: t.color }]} />
              <Text style={styles.legendText}>{t.label}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.listTitle}>
          {selectedDate ? `Echeances du ${selectedDate.split('-').reverse().join('/')}` : 'Toutes les echeances a venir'}
        </Text>

        {visibleEntries.map((item) => (
          <Card key={item.id} style={styles.entryCard}>
            <View style={styles.entryRow}>
              <View style={[styles.entryColorBar, { backgroundColor: getHealthEntryTypeColor(item.type) }]} />
              <View style={styles.entryContent}>
                <Text style={styles.cardTitle}>
                  {item.animalName} — {item.customTypeLabel ?? getHealthEntryTypeLabel(item.type)}
                </Text>
                <Text style={styles.cardSubtitle}>
                  {item.nextReminderDate
                    ? `Rappel le ${item.nextReminderDate}`
                    : `Prevu le ${item.scheduledDate}${item.scheduledTime ? ` a ${formatTime(item.scheduledTime)}` : ''}`}
                </Text>
              </View>
            </View>
          </Card>
        ))}
        {visibleEntries.length === 0 && <Text style={styles.empty}>Aucune echeance</Text>}
      </ScrollView>

      <AddModal visible={modalVisible} title="Ajouter une echeance" onClose={() => setModalVisible(false)}>
        {animals.length === 0 ? (
          <Text style={styles.empty}>Ajoute d&apos;abord un animal pour lui creer une echeance.</Text>
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
            <Dropdown value={type} onChange={setType} options={HEALTH_ENTRY_TYPES} placeholder="Type d'entree" />
            <View style={styles.spacer} />

            <AutocompleteInput
              value={customTypeLabel}
              onChange={setCustomTypeLabel}
              options={getPrecisionOptions(type, selectedAnimal?.species)}
              placeholder={type === 'vaccin' ? 'Nom du vaccin (optionnel)' : 'Precision (optionnel)'}
            />
            <DatePickerInput value={scheduledDate} onChange={setScheduledDate} placeholder="Date de l'echeance" />
            <TimePickerInput value={scheduledTime} onChange={setScheduledTime} placeholder="Heure (optionnel)" />
            <ReminderPicker value={recurrenceMonths} onChange={setRecurrenceMonths} />
            <PrimaryButton title="Ajouter" onPress={onCreate} disabled={!selectedAnimalId || !type || !scheduledDate} />
          </>
        )}
      </AddModal>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: spacing.lg },
  monthNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: spacing.sm, marginBottom: spacing.sm },
  monthNavButton: { paddingHorizontal: spacing.lg, paddingVertical: spacing.xs },
  monthNavText: { fontSize: 22, color: colors.accent, fontWeight: '600' },
  monthLabel: { ...typography.sectionTitle, fontSize: 16, minWidth: 160, textAlign: 'center' },
  weekdayRow: { flexDirection: 'row', marginBottom: spacing.xs },
  weekdayLabel: { flexBasis: `${100 / 7}%`, textAlign: 'center', color: colors.textSecondary, fontSize: 12, fontWeight: '600' },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: {
    flexBasis: `${100 / 7}%`,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xs,
  },
  cellSelected: { backgroundColor: colors.surface, borderRadius: radius.sm },
  cellText: { color: colors.textPrimary, fontSize: 14 },
  cellTextOutOfMonth: { color: colors.textMuted },
  cellTextToday: { fontWeight: '700', color: colors.accent },
  cellTextSelected: { fontWeight: '700' },
  dotRow: { flexDirection: 'row', gap: 3, marginTop: 3, height: 6 },
  dot: { width: 5, height: 5, borderRadius: 3 },
  legend: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, marginTop: spacing.md, marginBottom: spacing.lg },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { color: colors.textSecondary, fontSize: 12 },
  listTitle: { ...typography.sectionTitle, fontSize: 15, marginBottom: spacing.sm },
  entryCard: { marginBottom: spacing.sm, padding: 0, overflow: 'hidden' },
  entryRow: { flexDirection: 'row' },
  entryColorBar: { width: 5 },
  entryContent: { flex: 1, padding: spacing.md },
  cardTitle: { ...typography.sectionTitle, fontSize: 16 },
  cardSubtitle: { ...typography.caption, marginTop: spacing.xs },
  empty: { color: colors.textSecondary, textAlign: 'center', marginTop: spacing.xl },
  label: { color: colors.textSecondary, marginBottom: spacing.sm, marginTop: spacing.xs },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.md },
  chip: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.pill, paddingVertical: 6, paddingHorizontal: spacing.md },
  chipActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  chipText: { color: colors.textPrimary },
  chipTextActive: { color: 'white', fontWeight: '600' },
  spacer: { height: spacing.md },
});
