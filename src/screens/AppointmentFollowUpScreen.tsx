import React, { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AppStackParamList } from '../navigation/types';
import * as api from '../api/endpoints';
import type { Animal, HealthEntry } from '../types/api';
import Card from '../components/Card';
import KeyboardAvoidingScreen from '../components/KeyboardAvoidingScreen';
import LoadingScreen from '../components/LoadingScreen';
import PrimaryButton from '../components/PrimaryButton';
import { getHealthEntryTypeLabel } from '../data/healthEntryTypes';
import { cancelAppointmentFollowUp } from '../notifications/localReminders';
import { showError, showLoadError } from '../utils/errorHandling';
import { formatTime } from '../utils/formatting';
import { colors, radius, spacing, typography } from '../theme/colors';

type Props = NativeStackScreenProps<AppStackParamList, 'AppointmentFollowUp'>;

export default function AppointmentFollowUpScreen({ route, navigation }: Props) {
  const { animalId, entryId } = route.params;
  const [animal, setAnimal] = useState<Animal | null>(null);
  const [entry, setEntry] = useState<HealthEntry | null>(null);
  const [report, setReport] = useState('');
  const [price, setPrice] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    api.getAnimal(animalId).then(setAnimal).catch(showLoadError);
    api
      .listHealthEntries(animalId)
      .then((entries) => {
        const found = entries.find((e) => e.id === entryId) ?? null;
        setEntry(found);
        setReport(found?.report ?? '');
        setPrice(found?.price != null ? String(found.price) : '');
      })
      .catch(showLoadError);
  }, [animalId, entryId]);

  useFocusEffect(load);

  const onSaveReport = async () => {
    setSaving(true);
    try {
      await api.updateHealthEntry(animalId, entryId, {
        report: report.trim() || undefined,
        price: price ? parseFloat(price) : undefined,
        status: 'fait',
      });
      await cancelAppointmentFollowUp(entryId);
      load();
    } catch (error) {
      showError(error);
    } finally {
      setSaving(false);
    }
  };

  if (!animal) {
    return <LoadingScreen />;
  }

  return (
    <KeyboardAvoidingScreen>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Suivi du rendez-vous — {animal.name}</Text>
        {entry && (
          <Text style={styles.subtitle}>
            {entry.customTypeLabel ?? getHealthEntryTypeLabel(entry.type)} — {entry.scheduledDate}
            {entry.scheduledTime ? ` a ${formatTime(entry.scheduledTime)}` : ''}
          </Text>
        )}

        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Compte-rendu</Text>
          <TextInput
            style={[styles.input, styles.multiline]}
            placeholder="Notes sur le rendez-vous..."
            value={report}
            onChangeText={setReport}
            multiline
          />
          <TextInput
            style={styles.input}
            placeholder="Prix (optionnel)"
            keyboardType="decimal-pad"
            value={price}
            onChangeText={setPrice}
          />
          <PrimaryButton
            title={saving ? 'Enregistrement...' : 'Enregistrer le compte-rendu'}
            onPress={onSaveReport}
            disabled={saving}
            loading={saving}
          />
        </Card>

        <TouchableOpacity
          onPress={() => navigation.navigate('HealthEntries', { animalId, animalName: animal.name, species: animal.species })}
        >
          <Card>
            <Text style={styles.cardTitle}>Prendre un nouveau rendez-vous</Text>
            <Text style={styles.cardSubtitle}>Ouvre le carnet de sante pour ajouter une nouvelle echeance</Text>
          </Card>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() =>
            navigation.navigate('MedicalProfile', {
              animalId,
              animalName: animal.name,
              species: animal.species,
              householdId: animal.householdId,
            })
          }
        >
          <Card>
            <Text style={styles.cardTitle}>Ajouter un traitement</Text>
            <Text style={styles.cardSubtitle}>Medicaments donnes par le veto, avec rappels de prise</Text>
          </Card>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingScreen>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.lg },
  title: { ...typography.screenTitle, fontSize: 22, marginBottom: spacing.xs },
  subtitle: { color: colors.textSecondary, marginBottom: spacing.xl },
  section: { marginBottom: spacing.xl },
  sectionTitle: { fontSize: 16, fontWeight: '600', marginBottom: spacing.md },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    padding: spacing.md,
    marginBottom: spacing.sm,
    backgroundColor: colors.fieldBackground,
    color: '#000000',
  },
  multiline: { minHeight: 80, textAlignVertical: 'top' },
  cardTitle: { fontSize: 16, fontWeight: '600' },
  cardSubtitle: { color: colors.textSecondary, marginTop: spacing.xs },
});
