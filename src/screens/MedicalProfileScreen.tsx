import React, { useCallback, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AppStackParamList } from '../navigation/types';
import * as api from '../api/endpoints';
import type { MedicalProfile, SurgicalHistoryEntry, Treatment } from '../types/api';
import KeyboardAvoidingScreen from '../components/KeyboardAvoidingScreen';
import AddIconButton from '../components/AddIconButton';
import AddModal from '../components/AddModal';
import Accordion from '../components/Accordion';
import AutocompleteInput from '../components/AutocompleteInput';
import NullableField from '../components/NullableField';
import DatePickerInput from '../components/DatePickerInput';
import { scheduleTreatmentReminders, cancelTreatmentReminders } from '../notifications/localReminders';
import { getProceduresForSpecies } from '../data/procedures';
import { TREATMENT_TYPES } from '../data/treatmentTypes';
import { getChronicConditionsForSpecies } from '../data/medicalConditions';
import { ALLERGY_SUGGESTIONS } from '../data/allergies';
import { DIETARY_NEEDS_SUGGESTIONS } from '../data/diets';
import { getBloodTypesForSpecies } from '../data/bloodTypes';
import { INSURANCE_PROVIDERS } from '../data/insuranceProviders';
import { NONE_LABELS } from '../data/medicalFieldDefaults';
import { getFieldState } from '../utils/fieldState';
import { showError, showLoadError } from '../utils/errorHandling';

type Props = NativeStackScreenProps<AppStackParamList, 'MedicalProfile'>;

const REMINDER_PRESETS = [
  { key: 'matin', label: 'Matin', time: '08:00' },
  { key: 'midi', label: 'Midi', time: '12:00' },
  { key: 'soir', label: 'Soir', time: '20:00' },
] as const;

function todayIsoDate(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export default function MedicalProfileScreen({ route }: Props) {
  const { animalId, animalName, species } = route.params;
  const [profile, setProfile] = useState<Partial<MedicalProfile>>({});
  const [saving, setSaving] = useState(false);

  const [treatments, setTreatments] = useState<Treatment[]>([]);
  const [treatmentName, setTreatmentName] = useState('');
  const [treatmentDosage, setTreatmentDosage] = useState('');
  const [reminderPresets, setReminderPresets] = useState<Set<string>>(new Set());
  const [reminderStartDate, setReminderStartDate] = useState(todayIsoDate());
  const [reminderDurationDays, setReminderDurationDays] = useState('');
  const [treatmentModalVisible, setTreatmentModalVisible] = useState(false);

  const [surgicalHistory, setSurgicalHistory] = useState<SurgicalHistoryEntry[]>([]);
  const [procedureName, setProcedureName] = useState('');
  const [performedOn, setPerformedOn] = useState('');
  const [surgicalModalVisible, setSurgicalModalVisible] = useState(false);

  const load = useCallback(() => {
    api
      .getMedicalProfile(animalId)
      .then((p) => setProfile(p ?? {}))
      .catch(showLoadError);
    api.listTreatments(animalId).then(setTreatments).catch(showLoadError);
    api.listSurgicalHistory(animalId).then(setSurgicalHistory).catch(showLoadError);
  }, [animalId]);

  useFocusEffect(load);

  const setField = (key: keyof MedicalProfile, value: string) => {
    setProfile((prev) => ({ ...prev, [key]: value }));
  };

  const onSave = async () => {
    setSaving(true);
    try {
      await api.upsertMedicalProfile(animalId, profile);
    } catch (error) {
      showError(error);
    } finally {
      setSaving(false);
    }
  };

  const onAddTreatment = async () => {
    if (!treatmentName.trim()) return;
    const times = REMINDER_PRESETS.filter((p) => reminderPresets.has(p.key)).map((p) => p.time);
    const durationDays = parseInt(reminderDurationDays, 10) || 0;
    try {
      const treatment = await api.createTreatment(animalId, {
        name: treatmentName.trim(),
        dosage: treatmentDosage || null,
        startDate: times.length > 0 ? reminderStartDate : undefined,
        reminderTimes: times.length > 0 ? times.join(',') : null,
      });
      if (times.length > 0 && durationDays > 0) {
        await scheduleTreatmentReminders({
          animalId,
          animalName,
          treatmentId: treatment.id,
          treatmentName: treatment.name,
          dosage: treatment.dosage,
          startDate: reminderStartDate,
          durationDays,
          times,
        });
      }
      setTreatmentName('');
      setTreatmentDosage('');
      setReminderPresets(new Set());
      setReminderStartDate(todayIsoDate());
      setReminderDurationDays('');
      setTreatmentModalVisible(false);
      api.listTreatments(animalId).then(setTreatments).catch(showLoadError);
    } catch (error) {
      showError(error);
    }
  };

  const onDeleteTreatment = (treatment: Treatment) => {
    Alert.alert('Supprimer ce traitement ?', undefined, [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.deleteTreatment(animalId, treatment.id);
            await cancelTreatmentReminders(treatment.id);
            api.listTreatments(animalId).then(setTreatments).catch(showLoadError);
          } catch (error) {
            showError(error);
          }
        },
      },
    ]);
  };

  const toggleReminderPreset = (key: string) => {
    setReminderPresets((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const onAddSurgicalHistory = async () => {
    if (!procedureName.trim()) return;
    try {
      await api.createSurgicalHistory(animalId, { procedureName: procedureName.trim(), performedOn: performedOn || null });
      setProcedureName('');
      setPerformedOn('');
      setSurgicalModalVisible(false);
      api.listSurgicalHistory(animalId).then(setSurgicalHistory).catch(showLoadError);
    } catch (error) {
      showError(error);
    }
  };

  const onDeleteSurgicalHistory = (entry: SurgicalHistoryEntry) => {
    Alert.alert('Supprimer cet antecedent ?', undefined, [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.deleteSurgicalHistory(animalId, entry.id);
            api.listSurgicalHistory(animalId).then(setSurgicalHistory).catch(showLoadError);
          } catch (error) {
            showError(error);
          }
        },
      },
    ]);
  };

  const antecedentsIncomplete =
    getFieldState(profile.chronicConditions, NONE_LABELS.chronicConditions) === 'empty' ||
    getFieldState(profile.allergies, NONE_LABELS.allergies) === 'empty' ||
    getFieldState(profile.bloodType, NONE_LABELS.bloodType) === 'empty';

  const insured = profile.insuranceProvider && profile.insuranceProvider !== NONE_LABELS.insuranceProvider;
  const hasVet = profile.referringVetName && profile.referringVetName !== NONE_LABELS.referringVetName;

  return (
    <>
      <KeyboardAvoidingScreen>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <Text style={styles.title}>Fiche medicale — {animalName}</Text>

          <Accordion title="Antecedents medicaux" subtitle="Maladies, allergies, regime, groupe sanguin" warning={antecedentsIncomplete}>
            <Text style={styles.label}>Maladies chroniques</Text>
            <NullableField
              value={profile.chronicConditions ?? ''}
              onChange={(v) => setField('chronicConditions', v)}
              options={getChronicConditionsForSpecies(species)}
              noneLabel={NONE_LABELS.chronicConditions}
            />

            <Text style={styles.label}>Allergies</Text>
            <NullableField
              value={profile.allergies ?? ''}
              onChange={(v) => setField('allergies', v)}
              options={ALLERGY_SUGGESTIONS}
              noneLabel={NONE_LABELS.allergies}
            />

            <Text style={styles.label}>Regime alimentaire particulier</Text>
            <NullableField
              value={profile.dietaryNeeds ?? ''}
              onChange={(v) => setField('dietaryNeeds', v)}
              options={DIETARY_NEEDS_SUGGESTIONS}
              noneLabel={NONE_LABELS.dietaryNeeds}
            />

            <Text style={styles.label}>Notes comportementales</Text>
            <NullableField
              value={profile.behavioralNotes ?? ''}
              onChange={(v) => setField('behavioralNotes', v)}
              options={[]}
              noneLabel={NONE_LABELS.behavioralNotes}
            />

            <Text style={styles.label}>Groupe sanguin</Text>
            <NullableField
              value={profile.bloodType ?? ''}
              onChange={(v) => setField('bloodType', v)}
              options={getBloodTypesForSpecies(species)}
              noneLabel={NONE_LABELS.bloodType}
            />
          </Accordion>

          <Accordion title="Assurance" subtitle={insured ? String(profile.insuranceProvider) : 'Non renseigne'}>
            <Text style={styles.label}>Assureur</Text>
            <NullableField
              value={profile.insuranceProvider ?? ''}
              onChange={(v) => setField('insuranceProvider', v)}
              options={INSURANCE_PROVIDERS}
              noneLabel={NONE_LABELS.insuranceProvider}
            />
            {insured && (
              <>
                <Text style={styles.label}>N° de contrat</Text>
                <TextInput
                  style={styles.input}
                  value={profile.insurancePolicyNumber ?? ''}
                  onChangeText={(v) => setField('insurancePolicyNumber', v)}
                />
                <Text style={styles.label}>Plafond de remboursement (€)</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="decimal-pad"
                  value={profile.insuranceCoverageLimit != null ? String(profile.insuranceCoverageLimit) : ''}
                  onChangeText={(v) =>
                    setProfile((prev) => ({ ...prev, insuranceCoverageLimit: v ? parseFloat(v) : undefined }))
                  }
                />
                <Text style={styles.label}>Franchise (€)</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="decimal-pad"
                  value={profile.insuranceDeductible != null ? String(profile.insuranceDeductible) : ''}
                  onChangeText={(v) =>
                    setProfile((prev) => ({ ...prev, insuranceDeductible: v ? parseFloat(v) : undefined }))
                  }
                />
              </>
            )}
          </Accordion>

          <Accordion title="Veterinaire referent" subtitle={hasVet ? String(profile.referringVetName) : 'Non renseigne'}>
            <Text style={styles.label}>Nom</Text>
            <NullableField
              value={profile.referringVetName ?? ''}
              onChange={(v) => setField('referringVetName', v)}
              options={[]}
              noneLabel={NONE_LABELS.referringVetName}
            />
            {hasVet && (
              <>
                <Text style={styles.label}>Telephone</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="phone-pad"
                  value={profile.referringVetPhone ?? ''}
                  onChangeText={(v) => setField('referringVetPhone', v)}
                />
              </>
            )}
          </Accordion>

          <TouchableOpacity style={styles.button} onPress={onSave} disabled={saving}>
            <Text style={styles.buttonText}>{saving ? 'Enregistrement...' : 'Enregistrer la fiche medicale'}</Text>
          </TouchableOpacity>

          <Accordion
            title="Traitements en cours"
            subtitle={treatments.length > 0 ? `${treatments.length} en cours` : 'Aucun'}
          >
            <View style={styles.accordionAddRow}>
              <AddIconButton onPress={() => setTreatmentModalVisible(true)} />
            </View>
            {treatments.map((t) => (
              <View key={t.id} style={styles.listCard}>
                <Text style={styles.listCardTitle}>{t.name}</Text>
                {t.dosage && <Text style={styles.listCardSubtitle}>{t.dosage}</Text>}
                {t.reminderTimes && <Text style={styles.listCardSubtitle}>Rappels : {t.reminderTimes}</Text>}
                <TouchableOpacity onPress={() => onDeleteTreatment(t)}>
                  <Text style={styles.deleteLink}>Supprimer</Text>
                </TouchableOpacity>
              </View>
            ))}
            {treatments.length === 0 && <Text style={styles.empty}>Aucun traitement en cours</Text>}
          </Accordion>

          <Accordion
            title="Antecedents chirurgicaux"
            subtitle={surgicalHistory.length > 0 ? `${surgicalHistory.length} enregistre(s)` : 'Aucun'}
          >
            <View style={styles.accordionAddRow}>
              <AddIconButton onPress={() => setSurgicalModalVisible(true)} />
            </View>
            {surgicalHistory.map((s) => (
              <View key={s.id} style={styles.listCard}>
                <Text style={styles.listCardTitle}>{s.procedureName}</Text>
                {s.performedOn && <Text style={styles.listCardSubtitle}>{s.performedOn}</Text>}
                <TouchableOpacity onPress={() => onDeleteSurgicalHistory(s)}>
                  <Text style={styles.deleteLink}>Supprimer</Text>
                </TouchableOpacity>
              </View>
            ))}
            {surgicalHistory.length === 0 && <Text style={styles.empty}>Aucun antecedent chirurgical</Text>}
          </Accordion>
        </ScrollView>
      </KeyboardAvoidingScreen>

      <AddModal
        visible={treatmentModalVisible}
        title="Ajouter un traitement"
        onClose={() => setTreatmentModalVisible(false)}
      >
        <AutocompleteInput
          value={treatmentName}
          onChange={setTreatmentName}
          options={TREATMENT_TYPES}
          placeholder="Nom du traitement"
          autoFocus
        />
        <TextInput
          style={styles.input}
          placeholder="Dosage / frequence"
          value={treatmentDosage}
          onChangeText={setTreatmentDosage}
        />

        <Text style={styles.label}>Rappels de prise (optionnel)</Text>
        <View style={styles.chipRow}>
          {REMINDER_PRESETS.map((preset) => (
            <TouchableOpacity
              key={preset.key}
              style={[styles.chip, reminderPresets.has(preset.key) && styles.chipActive]}
              onPress={() => toggleReminderPreset(preset.key)}
            >
              <Text style={reminderPresets.has(preset.key) ? styles.chipTextActive : styles.chipText}>
                {preset.label} ({preset.time})
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        {reminderPresets.size > 0 && (
          <>
            <Text style={styles.label}>Debut des rappels</Text>
            <DatePickerInput value={reminderStartDate} onChange={setReminderStartDate} />
            <Text style={styles.label}>Pendant combien de jours</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: 7"
              keyboardType="number-pad"
              value={reminderDurationDays}
              onChangeText={setReminderDurationDays}
            />
          </>
        )}

        <TouchableOpacity style={styles.addButton} onPress={onAddTreatment}>
          <Text style={styles.addButtonText}>Ajouter</Text>
        </TouchableOpacity>
      </AddModal>

      <AddModal
        visible={surgicalModalVisible}
        title="Ajouter un antecedent chirurgical"
        onClose={() => setSurgicalModalVisible(false)}
      >
        <AutocompleteInput
          value={procedureName}
          onChange={setProcedureName}
          options={getProceduresForSpecies(species)}
          placeholder="Operation"
          autoFocus
        />
        <DatePickerInput value={performedOn} onChange={setPerformedOn} placeholder="Date de l'operation" />
        <TouchableOpacity style={styles.addButton} onPress={onAddSurgicalHistory}>
          <Text style={styles.addButtonText}>Ajouter</Text>
        </TouchableOpacity>
      </AddModal>
    </>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16 },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 16 },
  label: { color: '#666', marginBottom: 4, marginTop: 8 },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 12, marginBottom: 8, backgroundColor: 'white' },
  button: { backgroundColor: '#2f6f4f', borderRadius: 8, padding: 14, marginVertical: 8 },
  buttonText: { color: 'white', textAlign: 'center', fontWeight: '600' },
  accordionAddRow: { alignItems: 'flex-end', marginBottom: 8 },
  listCard: { backgroundColor: 'white', borderRadius: 8, padding: 12, marginBottom: 8 },
  listCardTitle: { fontWeight: '600' },
  listCardSubtitle: { color: '#666', marginTop: 2 },
  deleteLink: { color: '#a33', fontWeight: '600', marginTop: 6 },
  empty: { color: '#666' },
  addButton: { backgroundColor: '#2f6f4f', borderRadius: 8, padding: 14 },
  addButtonText: { color: 'white', textAlign: 'center', fontWeight: '600' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 },
  chip: { borderWidth: 1, borderColor: '#ccc', borderRadius: 16, paddingVertical: 6, paddingHorizontal: 12 },
  chipActive: { backgroundColor: '#2f6f4f', borderColor: '#2f6f4f' },
  chipText: { color: '#333' },
  chipTextActive: { color: 'white', fontWeight: '600' },
});
