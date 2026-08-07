import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AppStackParamList } from '../navigation/types';
import * as api from '../api/endpoints';
import type { BehavioralNote, MedicalProfile, SurgicalHistoryEntry, Treatment } from '../types/api';
import KeyboardAvoidingScreen from '../components/KeyboardAvoidingScreen';
import AddIconButton from '../components/AddIconButton';
import AddModal from '../components/AddModal';
import Accordion from '../components/Accordion';
import AutocompleteInput from '../components/AutocompleteInput';
import Card from '../components/Card';
import Dropdown from '../components/Dropdown';
import NullableField from '../components/NullableField';
import DatePickerInput from '../components/DatePickerInput';
import PrimaryButton from '../components/PrimaryButton';
import WeightCurveSection from '../components/WeightCurveSection';
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
import { colors, radius, spacing, typography } from '../theme/colors';

type Props = NativeStackScreenProps<AppStackParamList, 'MedicalProfile'>;

const FREQUENCY_PRESETS = [
  { key: 'matin', label: 'Matin', time: '08:00' },
  { key: 'midi', label: 'Midi', time: '12:00' },
  { key: 'soir', label: 'Soir', time: '20:00' },
] as const;

type DurationUnit = 'jours' | 'mois' | 'vie';

const DURATION_UNIT_OPTIONS: { value: DurationUnit; label: string }[] = [
  { value: 'jours', label: 'Jours' },
  { value: 'mois', label: 'Mois' },
  { value: 'vie', label: 'A vie' },
];

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
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const loadedRef = useRef(false);
  const skipNextAutoSaveRef = useRef(false);
  const profileRef = useRef(profile);
  const pendingSaveRef = useRef(false);

  const [treatments, setTreatments] = useState<Treatment[]>([]);
  const [treatmentName, setTreatmentName] = useState('');
  const [treatmentDosage, setTreatmentDosage] = useState('');
  const [frequencyPresets, setFrequencyPresets] = useState<Set<string>>(new Set());
  const [treatmentStartDate, setTreatmentStartDate] = useState(todayIsoDate());
  const [durationValue, setDurationValue] = useState('');
  const [durationUnit, setDurationUnit] = useState<DurationUnit | null>(null);
  const [remindersEnabled, setRemindersEnabled] = useState(false);
  const [treatmentModalVisible, setTreatmentModalVisible] = useState(false);

  const [surgicalHistory, setSurgicalHistory] = useState<SurgicalHistoryEntry[]>([]);
  const [procedureName, setProcedureName] = useState('');
  const [performedOn, setPerformedOn] = useState('');
  const [surgicalModalVisible, setSurgicalModalVisible] = useState(false);

  const [behavioralNotes, setBehavioralNotes] = useState<BehavioralNote[]>([]);
  const [noteDraft, setNoteDraft] = useState('');
  const [savingNote, setSavingNote] = useState(false);

  const [openSection, setOpenSection] = useState<string | null>(null);
  const toggleSection = (key: string) => setOpenSection((current) => (current === key ? null : key));

  const load = useCallback(() => {
    api
      .getMedicalProfile(animalId)
      .then((p) => {
        skipNextAutoSaveRef.current = true;
        setProfile(p ?? {});
        loadedRef.current = true;
      })
      .catch(showLoadError);
    api.listTreatments(animalId).then(setTreatments).catch(showLoadError);
    api.listSurgicalHistory(animalId).then(setSurgicalHistory).catch(showLoadError);
    api.listBehavioralNotes(animalId).then(setBehavioralNotes).catch(showLoadError);
  }, [animalId]);

  useFocusEffect(load);

  useEffect(() => {
    profileRef.current = profile;
  }, [profile]);

  // Enregistrement automatique : chaque changement (y compris le choix "Aucun(e)")
  // est persiste sans attendre un clic sur un bouton "Enregistrer" distant.
  useEffect(() => {
    if (!loadedRef.current) return;
    if (skipNextAutoSaveRef.current) {
      skipNextAutoSaveRef.current = false;
      return;
    }
    pendingSaveRef.current = true;
    setSaveStatus('saving');
    const timeout = setTimeout(async () => {
      try {
        await api.upsertMedicalProfile(animalId, profileRef.current);
        pendingSaveRef.current = false;
        setSaveStatus('saved');
      } catch (error) {
        setSaveStatus('error');
        showError(error);
      }
    }, 500);
    return () => clearTimeout(timeout);
  }, [profile, animalId]);

  // Si l'utilisateur quitte l'ecran avant la fin du debounce ci-dessus (ex: retour rapide
  // apres avoir tape le veto referent), le clearTimeout annulerait silencieusement la
  // derniere modification. On la sauvegarde immediatement au demontage dans ce cas.
  useEffect(() => {
    return () => {
      if (pendingSaveRef.current) {
        api.upsertMedicalProfile(animalId, profileRef.current).catch(() => undefined);
      }
    };
  }, [animalId]);

  const setField = (key: keyof MedicalProfile, value: string) => {
    setProfile((prev) => ({ ...prev, [key]: value }));
  };

  const resetTreatmentForm = () => {
    setTreatmentName('');
    setTreatmentDosage('');
    setFrequencyPresets(new Set());
    setTreatmentStartDate(todayIsoDate());
    setDurationValue('');
    setDurationUnit(null);
    setRemindersEnabled(false);
  };

  const onAddTreatment = async () => {
    if (!treatmentName.trim()) return;
    const selectedPresets = FREQUENCY_PRESETS.filter((p) => frequencyPresets.has(p.key));
    const times = selectedPresets.map((p) => p.time);
    const frequencyLabel = selectedPresets.map((p) => p.label).join(', ') || undefined;

    let durationDays: number | null = null;
    if (durationUnit === 'jours') durationDays = parseInt(durationValue, 10) || null;
    if (durationUnit === 'mois') durationDays = (parseInt(durationValue, 10) || 0) * 30 || null;

    const endDate =
      durationUnit && durationUnit !== 'vie' && durationDays
        ? (() => {
            const d = new Date(`${treatmentStartDate}T00:00:00Z`);
            d.setUTCDate(d.getUTCDate() + durationDays!);
            return d.toISOString().slice(0, 10);
          })()
        : undefined;

    try {
      const treatment = await api.createTreatment(animalId, {
        name: treatmentName.trim(),
        dosage: treatmentDosage || null,
        frequency: frequencyLabel,
        startDate: treatmentStartDate,
        endDate,
        reminderTimes: remindersEnabled && times.length > 0 ? times.join(',') : null,
      });
      if (remindersEnabled && times.length > 0 && durationDays) {
        await scheduleTreatmentReminders({
          animalId,
          animalName,
          treatmentId: treatment.id,
          treatmentName: treatment.name,
          dosage: treatment.dosage,
          startDate: treatmentStartDate,
          durationDays,
          times,
        });
      }
      resetTreatmentForm();
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

  const toggleFrequencyPreset = (key: string) => {
    setFrequencyPresets((prev) => {
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

  const onAddNote = async () => {
    if (!noteDraft.trim()) return;
    setSavingNote(true);
    try {
      await api.createBehavioralNote(animalId, noteDraft.trim());
      setNoteDraft('');
      api.listBehavioralNotes(animalId).then(setBehavioralNotes).catch(showLoadError);
    } catch (error) {
      showError(error);
    } finally {
      setSavingNote(false);
    }
  };

  const onDeleteNote = (note: BehavioralNote) => {
    Alert.alert('Supprimer cette note ?', note.note, [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.deleteBehavioralNote(animalId, note.id);
            setBehavioralNotes((prev) => prev.filter((n) => n.id !== note.id));
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
          <View style={styles.titleRow}>
            <Text style={styles.title}>Fiche medicale — {animalName}</Text>
            {saveStatus === 'saving' && <Text style={styles.saveStatusText}>Enregistrement...</Text>}
            {saveStatus === 'saved' && <Text style={styles.saveStatusTextOk}>Enregistre</Text>}
            {saveStatus === 'error' && <Text style={styles.saveStatusTextError}>Erreur</Text>}
          </View>

          <Accordion
            title="Antecedents medicaux"
            subtitle="Maladies, allergies, regime, groupe sanguin"
            warning={antecedentsIncomplete}
            open={openSection === 'antecedents'}
            onToggle={() => toggleSection('antecedents')}
          >
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
            {behavioralNotes.map((n) => (
              <View key={n.id} style={styles.noteRow}>
                <Text style={styles.noteText}>{n.note}</Text>
                <TouchableOpacity onPress={() => onDeleteNote(n)}>
                  <Text style={styles.deleteLink}>Supprimer</Text>
                </TouchableOpacity>
              </View>
            ))}
            {behavioralNotes.length === 0 && <Text style={styles.empty}>Aucune note pour l&apos;instant</Text>}
            <View style={styles.noteAddRow}>
              <TextInput
                style={styles.noteInput}
                placeholder="Ex : aime les gratouilles"
                value={noteDraft}
                onChangeText={setNoteDraft}
              />
              <PrimaryButton
                title={savingNote ? '...' : 'Ajouter'}
                onPress={onAddNote}
                disabled={savingNote || !noteDraft.trim()}
                style={styles.noteAddButton}
              />
            </View>

            <Text style={styles.label}>Groupe sanguin</Text>
            <NullableField
              value={profile.bloodType ?? ''}
              onChange={(v) => setField('bloodType', v)}
              options={getBloodTypesForSpecies(species)}
              noneLabel={NONE_LABELS.bloodType}
            />
          </Accordion>

          <Accordion
            title="Assurance"
            subtitle={insured ? String(profile.insuranceProvider) : 'Non renseigne'}
            open={openSection === 'assurance'}
            onToggle={() => toggleSection('assurance')}
          >
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

          <Accordion
            title="Veterinaire referent"
            subtitle={hasVet ? String(profile.referringVetName) : 'Non renseigne'}
            open={openSection === 'veterinaire'}
            onToggle={() => toggleSection('veterinaire')}
          >
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

          <Accordion
            title="Traitements en cours"
            subtitle={treatments.length > 0 ? `${treatments.length} en cours` : 'Aucun'}
            open={openSection === 'traitements'}
            onToggle={() => toggleSection('traitements')}
          >
            <View style={styles.accordionAddRow}>
              <AddIconButton onPress={() => setTreatmentModalVisible(true)} />
            </View>
            {treatments.map((t) => (
              <Card key={t.id} style={styles.listCard}>
                <Text style={styles.listCardTitle}>{t.name}</Text>
                {t.dosage && <Text style={styles.listCardSubtitle}>{t.dosage}</Text>}
                {t.frequency && <Text style={styles.listCardSubtitle}>{t.frequency}</Text>}
                {t.endDate ? (
                  <Text style={styles.listCardSubtitle}>Jusqu&apos;au {t.endDate}</Text>
                ) : (
                  <Text style={styles.listCardSubtitle}>Traitement a vie</Text>
                )}
                {t.reminderTimes && <Text style={styles.listCardSubtitle}>Rappels : {t.reminderTimes}</Text>}
                <TouchableOpacity onPress={() => onDeleteTreatment(t)}>
                  <Text style={styles.deleteLink}>Supprimer</Text>
                </TouchableOpacity>
              </Card>
            ))}
            {treatments.length === 0 && <Text style={styles.empty}>Aucun traitement en cours</Text>}
          </Accordion>

          <Accordion
            title="Antecedents chirurgicaux"
            subtitle={surgicalHistory.length > 0 ? `${surgicalHistory.length} enregistre(s)` : 'Aucun'}
            open={openSection === 'chirurgie'}
            onToggle={() => toggleSection('chirurgie')}
          >
            <View style={styles.accordionAddRow}>
              <AddIconButton onPress={() => setSurgicalModalVisible(true)} />
            </View>
            {surgicalHistory.map((s) => (
              <Card key={s.id} style={styles.listCard}>
                <Text style={styles.listCardTitle}>{s.procedureName}</Text>
                {s.performedOn && <Text style={styles.listCardSubtitle}>{s.performedOn}</Text>}
                <TouchableOpacity onPress={() => onDeleteSurgicalHistory(s)}>
                  <Text style={styles.deleteLink}>Supprimer</Text>
                </TouchableOpacity>
              </Card>
            ))}
            {surgicalHistory.length === 0 && <Text style={styles.empty}>Aucun antecedent chirurgical</Text>}
          </Accordion>

          <View style={styles.weightSection}>
            <WeightCurveSection animalId={animalId} />
          </View>
        </ScrollView>
      </KeyboardAvoidingScreen>

      <AddModal
        visible={treatmentModalVisible}
        title="Ajouter un traitement"
        onClose={() => {
          setTreatmentModalVisible(false);
          resetTreatmentForm();
        }}
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
          placeholder="Dosage (ex : 1 comprime)"
          value={treatmentDosage}
          onChangeText={setTreatmentDosage}
        />

        <Text style={styles.label}>Frequence de prise</Text>
        <View style={styles.chipRow}>
          {FREQUENCY_PRESETS.map((preset) => (
            <TouchableOpacity
              key={preset.key}
              style={[styles.chip, frequencyPresets.has(preset.key) && styles.chipActive]}
              onPress={() => toggleFrequencyPreset(preset.key)}
            >
              <Text style={frequencyPresets.has(preset.key) ? styles.chipTextActive : styles.chipText}>
                {preset.label} ({preset.time})
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Depuis quand</Text>
        <DatePickerInput value={treatmentStartDate} onChange={setTreatmentStartDate} />

        <Text style={styles.label}>Duree du traitement</Text>
        <View style={styles.durationRow}>
          {durationUnit !== 'vie' && (
            <TextInput
              style={[styles.input, styles.durationValueInput]}
              placeholder="Ex : 7"
              keyboardType="number-pad"
              value={durationValue}
              onChangeText={setDurationValue}
            />
          )}
          <View style={styles.durationUnitField}>
            <Dropdown value={durationUnit} onChange={setDurationUnit} options={DURATION_UNIT_OPTIONS} placeholder="Unite" />
          </View>
        </View>

        {durationUnit && durationUnit !== 'vie' && (
          <View style={styles.switchRow}>
            <Text style={styles.label}>Souhaites-tu des rappels de prise ?</Text>
            <Switch value={remindersEnabled} onValueChange={setRemindersEnabled} disabled={frequencyPresets.size === 0} />
          </View>
        )}

        <PrimaryButton title="Ajouter" onPress={onAddTreatment} disabled={!treatmentName.trim()} />
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
        <PrimaryButton title="Ajouter" onPress={onAddSurgicalHistory} />
      </AddModal>
    </>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.lg },
  weightSection: { marginTop: spacing.lg },
  title: { ...typography.screenTitle, fontSize: 22 },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.lg },
  saveStatusText: { color: colors.textMuted, fontSize: 13 },
  saveStatusTextOk: { color: colors.accent, fontSize: 13, fontWeight: '600' },
  saveStatusTextError: { color: colors.danger, fontSize: 13, fontWeight: '600' },
  label: { color: colors.textSecondary, marginBottom: spacing.xs, marginTop: spacing.sm },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    padding: spacing.md,
    marginBottom: spacing.sm,
    backgroundColor: colors.fieldBackground,
    color: '#000000',
  },
  accordionAddRow: { alignItems: 'flex-end', marginBottom: spacing.sm },
  noteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  noteText: { color: colors.textPrimary, flexShrink: 1, marginRight: spacing.md },
  noteAddRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm, alignItems: 'center' },
  noteInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    padding: spacing.md,
    backgroundColor: colors.fieldBackground,
    color: '#000000',
  },
  noteAddButton: { paddingHorizontal: spacing.lg },
  durationRow: { flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start' },
  durationValueInput: { flex: 1 },
  durationUnitField: { flex: 2 },
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: spacing.sm, marginBottom: spacing.md },
  listCard: { backgroundColor: colors.surface, marginBottom: spacing.sm, padding: spacing.md },
  listCardTitle: { fontWeight: '600' },
  listCardSubtitle: { color: colors.textSecondary, marginTop: 2 },
  deleteLink: { color: colors.danger, fontWeight: '600', marginTop: spacing.xs },
  empty: { color: colors.textSecondary },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.md },
  chip: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.pill, paddingVertical: 6, paddingHorizontal: spacing.md },
  chipActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  chipText: { color: colors.textPrimary },
  chipTextActive: { color: 'white', fontWeight: '600' },
});
