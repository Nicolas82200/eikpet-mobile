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
import AutocompleteInput from '../components/AutocompleteInput';
import { getProceduresForSpecies } from '../data/procedures';
import { TREATMENT_TYPES } from '../data/treatmentTypes';
import { getChronicConditionsForSpecies } from '../data/medicalConditions';
import { ALLERGY_SUGGESTIONS } from '../data/allergies';
import { DIETARY_NEEDS_SUGGESTIONS } from '../data/diets';
import { getBloodTypesForSpecies } from '../data/bloodTypes';
import { INSURANCE_PROVIDERS } from '../data/insuranceProviders';
import { showError, showLoadError } from '../utils/errorHandling';

type Props = NativeStackScreenProps<AppStackParamList, 'MedicalProfile'>;

const FIELDS: { key: keyof MedicalProfile; label: string; options?: (species: string) => readonly string[] }[] = [
  { key: 'chronicConditions', label: 'Maladies chroniques', options: getChronicConditionsForSpecies },
  { key: 'allergies', label: 'Allergies', options: () => ALLERGY_SUGGESTIONS },
  { key: 'dietaryNeeds', label: 'Regime alimentaire particulier', options: () => DIETARY_NEEDS_SUGGESTIONS },
  { key: 'behavioralNotes', label: 'Notes comportementales' },
  { key: 'bloodType', label: 'Groupe sanguin', options: getBloodTypesForSpecies },
  { key: 'insuranceProvider', label: 'Assureur', options: () => INSURANCE_PROVIDERS },
  { key: 'insurancePolicyNumber', label: "N° de contrat d'assurance" },
  { key: 'referringVetName', label: 'Veto referent' },
  { key: 'referringVetPhone', label: 'Telephone du veto referent' },
];

export default function MedicalProfileScreen({ route }: Props) {
  const { animalId, animalName, species } = route.params;
  const [profile, setProfile] = useState<Partial<MedicalProfile>>({});
  const [saving, setSaving] = useState(false);

  const [treatments, setTreatments] = useState<Treatment[]>([]);
  const [treatmentName, setTreatmentName] = useState('');
  const [treatmentDosage, setTreatmentDosage] = useState('');
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
    try {
      await api.createTreatment(animalId, { name: treatmentName.trim(), dosage: treatmentDosage || null });
      setTreatmentName('');
      setTreatmentDosage('');
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
            api.listTreatments(animalId).then(setTreatments).catch(showLoadError);
          } catch (error) {
            showError(error);
          }
        },
      },
    ]);
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

  return (
    <>
      <KeyboardAvoidingScreen>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <Text style={styles.title}>Fiche medicale — {animalName}</Text>

          {FIELDS.map((field) => (
            <View key={field.key} style={styles.fieldGroup}>
              <Text style={styles.label}>{field.label}</Text>
              {field.options ? (
                <AutocompleteInput
                  value={(profile[field.key] as string) ?? ''}
                  onChange={(text) => setProfile((prev) => ({ ...prev, [field.key]: text }))}
                  options={field.options(species)}
                />
              ) : (
                <TextInput
                  style={styles.input}
                  value={(profile[field.key] as string) ?? ''}
                  onChangeText={(text) => setProfile((prev) => ({ ...prev, [field.key]: text }))}
                />
              )}
            </View>
          ))}
          <TouchableOpacity style={styles.button} onPress={onSave} disabled={saving}>
            <Text style={styles.buttonText}>{saving ? 'Enregistrement...' : 'Enregistrer'}</Text>
          </TouchableOpacity>

          <View style={styles.sectionTitleRow}>
            <Text style={styles.sectionTitle}>Traitements en cours</Text>
            <AddIconButton onPress={() => setTreatmentModalVisible(true)} />
          </View>
          {treatments.map((t) => (
            <View key={t.id} style={styles.listCard}>
              <Text style={styles.listCardTitle}>{t.name}</Text>
              {t.dosage && <Text style={styles.listCardSubtitle}>{t.dosage}</Text>}
              <TouchableOpacity onPress={() => onDeleteTreatment(t)}>
                <Text style={styles.deleteLink}>Supprimer</Text>
              </TouchableOpacity>
            </View>
          ))}
          {treatments.length === 0 && <Text style={styles.empty}>Aucun traitement en cours</Text>}

          <View style={styles.sectionTitleRow}>
            <Text style={styles.sectionTitle}>Antecedents chirurgicaux</Text>
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
        <TextInput
          style={styles.input}
          placeholder="Date (AAAA-MM-JJ)"
          value={performedOn}
          onChangeText={setPerformedOn}
        />
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
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 24,
    marginBottom: 8,
  },
  sectionTitle: { fontSize: 18, fontWeight: 'bold' },
  fieldGroup: { marginBottom: 12 },
  label: { color: '#666', marginBottom: 4 },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 12, marginBottom: 8 },
  button: { backgroundColor: '#2f6f4f', borderRadius: 8, padding: 14, marginTop: 4 },
  buttonText: { color: 'white', textAlign: 'center', fontWeight: '600' },
  listCard: { backgroundColor: '#f2f2f2', borderRadius: 8, padding: 12, marginBottom: 8 },
  listCardTitle: { fontWeight: '600' },
  listCardSubtitle: { color: '#666', marginTop: 2 },
  deleteLink: { color: '#a33', fontWeight: '600', marginTop: 6 },
  empty: { color: '#666' },
  addButton: { backgroundColor: '#2f6f4f', borderRadius: 8, padding: 14 },
  addButtonText: { color: 'white', textAlign: 'center', fontWeight: '600' },
});
