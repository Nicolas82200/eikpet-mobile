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
import Card from '../components/Card';
import PrimaryButton from '../components/PrimaryButton';
import ScreenHeader from '../components/ScreenHeader';
import { useRefreshable } from '../hooks/useRefreshable';
import { isPlanLimitError, showError, showLoadError } from '../utils/errorHandling';
import { colors, radius, spacing, typography } from '../theme/colors';

type Props = NativeStackScreenProps<AppStackParamList, 'RidingSessions'>;

export default function RidingSessionsScreen({ route, navigation }: Props) {
  const { animalId } = route.params;
  const [sessions, setSessions] = useState<RidingSession[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [type, setType] = useState<RidingSessionType>('dressage');
  const [scheduledDate, setScheduledDate] = useState('');
  const [price, setPrice] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [editingSession, setEditingSession] = useState<RidingSession | null>(null);
  const [report, setReport] = useState('');

  const load = useCallback(() => {
    return api.listRidingSessions(animalId).then(setSessions).catch(showLoadError);
  }, [animalId]);
  const { refreshing, trigger, onRefresh } = useRefreshable(load);

  useFocusEffect(trigger);

  const resetForm = () => {
    setType('dressage');
    setScheduledDate('');
    setPrice('');
    setReport('');
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

  const openEditModal = (session: RidingSession) => {
    setEditingSession(session);
    setType(session.type);
    setScheduledDate(session.scheduledDate.slice(0, 10));
    setPrice(session.price != null ? String(session.price) : '');
    setReport(session.report ?? '');
  };

  const onSaveEdit = async () => {
    if (!editingSession || !scheduledDate) return;
    setSubmitting(true);
    try {
      await api.updateRidingSession(animalId, editingSession.id, {
        type,
        scheduledDate,
        price: price ? parseFloat(price) : undefined,
        report: report.trim() || undefined,
      });
      resetForm();
      setEditingSession(null);
      load();
    } catch (error) {
      showError(error);
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

  const renderForm = (onSubmit: () => void, submitLabel: string, withReport: boolean) => (
    <>
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

      {withReport && (
        <TextInput
          style={[styles.input, styles.multiline]}
          placeholder="Compte-rendu (optionnel)"
          value={report}
          onChangeText={setReport}
          multiline
        />
      )}

      <PrimaryButton
        title={submitting ? 'Enregistrement...' : submitLabel}
        onPress={onSubmit}
        disabled={submitting || !scheduledDate}
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
        data={sessions}
        keyExtractor={(item) => String(item.id)}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListHeaderComponent={<ScreenHeader title="Seances" action={<AddIconButton onPress={() => setModalVisible(true)} />} />}
        renderItem={({ item }) => (
          <Card>
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
              <TouchableOpacity onPress={() => openEditModal(item)}>
                <Text style={styles.editLink}>{item.report ? 'Modifier' : 'Compte-rendu'}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => onDelete(item)}>
                <Text style={styles.deleteLink}>Supprimer</Text>
              </TouchableOpacity>
            </View>
          </Card>
        )}
        ListEmptyComponent={<Text style={styles.empty}>Aucune seance pour l&apos;instant</Text>}
      />

      <AddModal
        visible={modalVisible}
        title="Ajouter une seance"
        onClose={() => {
          setModalVisible(false);
          resetForm();
        }}
      >
        {renderForm(onCreate, 'Ajouter', false)}
      </AddModal>

      <AddModal
        visible={!!editingSession}
        title="Modifier la seance"
        onClose={() => {
          setEditingSession(null);
          resetForm();
        }}
      >
        {renderForm(onSaveEdit, 'Enregistrer', true)}
      </AddModal>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: spacing.lg },
  cardTitle: { ...typography.sectionTitle, fontSize: 16 },
  cardSubtitle: { ...typography.caption, marginTop: spacing.xs },
  cardReport: { color: colors.textPrimary, marginTop: spacing.sm },
  cardActions: { flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.sm },
  statusDone: { color: colors.success, fontWeight: '600' },
  statusPlanned: { color: colors.accent, fontWeight: '600' },
  editLink: { color: colors.accent, fontWeight: '600' },
  deleteLink: { color: colors.danger, fontWeight: '600' },
  empty: { color: colors.textSecondary, textAlign: 'center', marginTop: spacing.xl },
  label: { color: colors.textSecondary, marginBottom: spacing.sm, marginTop: spacing.xs },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.md },
  chip: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.pill, paddingVertical: 6, paddingHorizontal: spacing.md },
  chipActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  chipText: { color: colors.textPrimary },
  chipTextActive: { color: 'white', fontWeight: '600' },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    padding: spacing.md,
    marginBottom: spacing.md,
    marginTop: spacing.md,
    backgroundColor: colors.fieldBackground,
    color: '#000000',
  },
  multiline: { minHeight: 80, textAlignVertical: 'top' },
  submitButton: { marginTop: spacing.sm },
});
