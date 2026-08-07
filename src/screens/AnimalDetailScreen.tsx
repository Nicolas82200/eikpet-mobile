import React, { useCallback, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AppStackParamList } from '../navigation/types';
import * as api from '../api/endpoints';
import type { Animal, AnimalSex, HealthEntry, MedicalProfile, Provider } from '../types/api';
import KeyboardAvoidingScreen from '../components/KeyboardAvoidingScreen';
import Accordion from '../components/Accordion';
import AutocompleteInput from '../components/AutocompleteInput';
import Card from '../components/Card';
import DatePickerInput from '../components/DatePickerInput';
import AuthenticatedImage from '../components/AuthenticatedImage';
import LoadingScreen from '../components/LoadingScreen';
import PrimaryButton from '../components/PrimaryButton';
import WarningBanner from '../components/WarningBanner';
import AddIconButton from '../components/AddIconButton';
import AddModal from '../components/AddModal';
import { getBreedsForSpecies } from '../data/breeds';
import { getColorsForSpecies } from '../data/colors';
import { getProviderTypeLabel } from '../data/providerTypes';
import { getAnimalWarnings } from '../utils/animalWarnings';
import { showError, showLoadError } from '../utils/errorHandling';
import { isEquine } from '../utils/species';
import { cardShadow, colors, radius, spacing, typography } from '../theme/colors';

type Props = NativeStackScreenProps<AppStackParamList, 'AnimalDetail'>;

/** Desactive temporairement (demande produit) : reactiver en repassant a true. */
const SEANCES_ENABLED = false;

const SEX_OPTIONS: { value: AnimalSex; label: string }[] = [
  { value: 'male', label: 'Male' },
  { value: 'femelle', label: 'Femelle' },
  { value: 'inconnu', label: 'Inconnu' },
];

export default function AnimalDetailScreen({ route, navigation }: Props) {
  const { animalId, householdId } = route.params;
  const [animal, setAnimal] = useState<Animal | null>(null);
  const [form, setForm] = useState<Partial<Animal>>({});
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [medicalProfile, setMedicalProfile] = useState<Partial<MedicalProfile> | null>(null);
  const [healthEntries, setHealthEntries] = useState<HealthEntry[]>([]);
  const [linkedProviders, setLinkedProviders] = useState<Provider[]>([]);
  const [householdProviders, setHouseholdProviders] = useState<Provider[]>([]);
  const [providerPickerVisible, setProviderPickerVisible] = useState(false);

  const load = useCallback(() => {
    api
      .getAnimal(animalId)
      .then((a) => {
        setAnimal(a);
        setForm(a);
      })
      .catch(showLoadError);
    api.getMedicalProfile(animalId).then(setMedicalProfile).catch(() => setMedicalProfile(null));
    api.listHealthEntries(animalId).then(setHealthEntries).catch(() => setHealthEntries([]));
    api.listAnimalProviders(animalId).then(setLinkedProviders).catch(() => setLinkedProviders([]));
    api.listProviders(householdId).then(setHouseholdProviders).catch(() => setHouseholdProviders([]));
  }, [animalId, householdId]);

  useFocusEffect(load);

  const onSave = async () => {
    setSaving(true);
    try {
      const updated = await api.updateAnimal(animalId, {
        name: form.name,
        breed: form.breed,
        color: form.color,
        sex: form.sex,
        birthDate: form.birthDate,
        sterilized: form.sterilized,
        microchipNumber: form.microchipNumber,
        currentWeightKg: form.currentWeightKg,
      });
      setAnimal(updated);
      navigation.setOptions({ title: updated.name });
    } catch (error) {
      showError(error);
    } finally {
      setSaving(false);
    }
  };

  const onPickPhoto = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission refusee', "Autorise l'acces aux photos pour changer l'image de profil.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.7,
      allowsEditing: true,
      aspect: [1, 1],
    });
    if (result.canceled || !result.assets?.[0]) {
      return;
    }
    const asset = result.assets[0];
    setUploadingPhoto(true);
    try {
      const updated = await api.uploadAnimalPhoto(animalId, {
        uri: asset.uri,
        name: asset.fileName ?? 'photo.jpg',
        type: asset.mimeType ?? 'image/jpeg',
      });
      setAnimal(updated);
    } catch (error) {
      showError(error, 'Envoi de la photo impossible');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const onLinkProvider = async (provider: Provider) => {
    try {
      const updated = await api.linkAnimalProvider(animalId, provider.id);
      setLinkedProviders(updated);
      setProviderPickerVisible(false);
    } catch (error) {
      showError(error);
    }
  };

  const onUnlinkProvider = (provider: Provider) => {
    Alert.alert('Retirer cet intervenant ?', provider.name, [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Retirer',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.unlinkAnimalProvider(animalId, provider.id);
            setLinkedProviders((prev) => prev.filter((p) => p.id !== provider.id));
          } catch (error) {
            showError(error);
          }
        },
      },
    ]);
  };

  const onDelete = () => {
    Alert.alert('Supprimer cet animal ?', 'Cette action est irreversible.', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.deleteAnimal(animalId);
            navigation.goBack();
          } catch (error) {
            showError(error);
          }
        },
      },
    ]);
  };

  if (!animal) {
    return <LoadingScreen />;
  }

  const warnings = getAnimalWarnings(medicalProfile, healthEntries);

  const unlinkedProviders = householdProviders.filter(
    (p) => !linkedProviders.some((linked) => linked.id === p.id),
  );

  return (
    <>
      <KeyboardAvoidingScreen>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <TouchableOpacity style={styles.photoContainer} onPress={onPickPhoto} disabled={uploadingPhoto}>
          {animal.photoUrl ? (
            <AuthenticatedImage
              uri={`${api.getAnimalPhotoUrl(animal.id)}?v=${encodeURIComponent(animal.photoUrl)}`}
              style={styles.photo}
            />
          ) : (
            <View style={styles.photoPlaceholder}>
              <Text style={styles.photoPlaceholderText}>Ajouter une photo</Text>
            </View>
          )}
          {uploadingPhoto && <Text style={styles.photoUploading}>Envoi en cours...</Text>}
        </TouchableOpacity>

        <Text style={styles.title}>{animal.name}</Text>
        <Text style={styles.subtitle}>
          {animal.species}
          {animal.age ? ` — ${animal.age.years} an(s) ${animal.age.months} mois` : ''}
        </Text>

        <WarningBanner
          warnings={warnings}
          onPress={() =>
            navigation.navigate('MedicalProfile', { animalId, animalName: animal.name, species: animal.species })
          }
        />

        <Accordion title="Profil" subtitle="Race, robe, sexe, naissance, puce, poids...">
          <Text style={styles.label}>Nom</Text>
          <TextInput style={styles.input} value={form.name ?? ''} onChangeText={(v) => setForm((f) => ({ ...f, name: v }))} />

          <Text style={styles.label}>Race</Text>
          <AutocompleteInput
            value={form.breed ?? ''}
            onChange={(v) => setForm((f) => ({ ...f, breed: v }))}
            options={getBreedsForSpecies(animal.species)}
            placeholder="Taper pour rechercher une race"
          />

          <Text style={styles.label}>Robe / couleur</Text>
          <AutocompleteInput
            value={form.color ?? ''}
            onChange={(v) => setForm((f) => ({ ...f, color: v }))}
            options={getColorsForSpecies(animal.species)}
            placeholder="Taper pour rechercher une robe / couleur"
          />

          <Text style={styles.label}>Sexe</Text>
          <View style={styles.chipRow}>
            {SEX_OPTIONS.map((opt) => (
              <TouchableOpacity
                key={opt.value}
                style={[styles.chip, form.sex === opt.value && styles.chipActive]}
                onPress={() => setForm((f) => ({ ...f, sex: opt.value }))}
              >
                <Text style={form.sex === opt.value ? styles.chipTextActive : styles.chipText}>{opt.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Date de naissance</Text>
          <DatePickerInput
            value={form.birthDate?.slice(0, 10) ?? ''}
            onChange={(v) => setForm((f) => ({ ...f, birthDate: v }))}
          />

          <View style={styles.switchRow}>
            <Text style={styles.label}>Sterilise(e)</Text>
            <Switch
              value={!!form.sterilized}
              onValueChange={(v) => setForm((f) => ({ ...f, sterilized: v }))}
            />
          </View>

          <Text style={styles.label}>Numero de puce / tatouage</Text>
          <TextInput
            style={styles.input}
            value={form.microchipNumber ?? ''}
            onChangeText={(v) => setForm((f) => ({ ...f, microchipNumber: v }))}
          />

          <Text style={styles.label}>Poids actuel (kg)</Text>
          <TextInput
            style={styles.input}
            keyboardType="decimal-pad"
            value={form.currentWeightKg != null ? String(form.currentWeightKg) : ''}
            onChangeText={(v) => setForm((f) => ({ ...f, currentWeightKg: v ? parseFloat(v) : undefined }))}
          />

          <PrimaryButton
            title={saving ? 'Enregistrement...' : 'Enregistrer le profil'}
            onPress={onSave}
            disabled={saving}
            loading={saving}
            style={styles.saveButton}
          />
        </Accordion>

        <Accordion title="Intervenants" subtitle={linkedProviders.length > 0 ? `${linkedProviders.length} associe(s)` : 'Aucun'}>
          <View style={styles.accordionAddRow}>
            <AddIconButton onPress={() => setProviderPickerVisible(true)} />
          </View>
          {linkedProviders.map((provider) => (
            <Card key={provider.id} style={styles.listCard}>
              <Text style={styles.listCardTitle}>{provider.name}</Text>
              <Text style={styles.listCardSubtitle}>{getProviderTypeLabel(provider.type)}</Text>
              <TouchableOpacity onPress={() => onUnlinkProvider(provider)}>
                <Text style={styles.deleteLink}>Retirer</Text>
              </TouchableOpacity>
            </Card>
          ))}
          {linkedProviders.length === 0 && (
            <Text style={styles.emptyHint}>Aucun intervenant associe a cet animal pour l&apos;instant.</Text>
          )}
        </Accordion>

        <View style={styles.dashboardGrid}>
          <TouchableOpacity
            style={styles.dashboardTile}
            activeOpacity={0.85}
            onPress={() =>
              navigation.navigate('MedicalProfile', { animalId, animalName: animal.name, species: animal.species })
            }
          >
            <Text style={styles.dashboardTileIcon}>🩺</Text>
            <Text style={styles.dashboardTileTitle}>Fiche medicale</Text>
            <Text style={styles.dashboardTileSubtitle}>Antecedents, allergies, traitements, assurance...</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.dashboardTile}
            activeOpacity={0.85}
            onPress={() =>
              navigation.navigate('HealthEntries', { animalId, animalName: animal.name, species: animal.species })
            }
          >
            <Text style={styles.dashboardTileIcon}>📅</Text>
            <Text style={styles.dashboardTileTitle}>Carnet de sante</Text>
            <Text style={styles.dashboardTileSubtitle}>Vaccins, vermifuges, rdv veto...</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.dashboardTile}
            activeOpacity={0.85}
            onPress={() => navigation.navigate('Documents', { householdId, animalId })}
          >
            <Text style={styles.dashboardTileIcon}>📄</Text>
            <Text style={styles.dashboardTileTitle}>Documents</Text>
            <Text style={styles.dashboardTileSubtitle}>Ordonnances, analyses, certificats...</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.dashboardTile}
            activeOpacity={0.85}
            onPress={() => navigation.navigate('Boardings', { animalId, animalName: animal.name })}
          >
            <Text style={styles.dashboardTileIcon}>🏠</Text>
            <Text style={styles.dashboardTileTitle}>Pension</Text>
            <Text style={styles.dashboardTileSubtitle}>Echeances, statut regle/non regle...</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.dashboardTile}
            activeOpacity={0.85}
            onPress={() => navigation.navigate('Reports', { animalId, animalName: animal.name })}
          >
            <Text style={styles.dashboardTileIcon}>📝</Text>
            <Text style={styles.dashboardTileTitle}>Comptes-rendus</Text>
            <Text style={styles.dashboardTileSubtitle}>Historique consolide des rdv...</Text>
          </TouchableOpacity>
          {SEANCES_ENABLED && isEquine(animal.species) && (
            <TouchableOpacity
              style={styles.dashboardTile}
              activeOpacity={0.85}
              onPress={() => navigation.navigate('RidingSessions', { animalId, animalName: animal.name })}
            >
              <Text style={styles.dashboardTileIcon}>🐎</Text>
              <Text style={styles.dashboardTileTitle}>Seances</Text>
              <Text style={styles.dashboardTileSubtitle}>Dressage, osteo, entrainement...</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={styles.dashboardTileWide}
            activeOpacity={0.85}
            onPress={() => navigation.navigate('EmergencySheet', { animalId, animalName: animal.name })}
          >
            <Text style={styles.dashboardTileIcon}>🚨</Text>
            <Text style={styles.dashboardTileTitle}>Fiche d&apos;urgence</Text>
            <Text style={styles.dashboardTileSubtitle}>Resume a partager en urgence, toujours gratuit</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.deleteButton} onPress={onDelete}>
          <Text style={styles.deleteButtonText}>Supprimer cet animal</Text>
        </TouchableOpacity>
      </ScrollView>
      </KeyboardAvoidingScreen>

      <AddModal
        visible={providerPickerVisible}
        title="Associer un intervenant"
        onClose={() => setProviderPickerVisible(false)}
      >
        {unlinkedProviders.length === 0 ? (
          <Text style={styles.emptyHint}>
            {householdProviders.length === 0
              ? "Aucun intervenant dans le repertoire du foyer. Ajoutes-en un depuis l'ecran Intervenants."
              : 'Tous les intervenants du foyer sont deja associes a cet animal.'}
          </Text>
        ) : (
          unlinkedProviders.map((provider) => (
            <TouchableOpacity key={provider.id} onPress={() => onLinkProvider(provider)}>
              <Card style={styles.listCard}>
                <Text style={styles.listCardTitle}>{provider.name}</Text>
                <Text style={styles.listCardSubtitle}>{getProviderTypeLabel(provider.type)}</Text>
              </Card>
            </TouchableOpacity>
          ))
        )}
      </AddModal>
    </>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.lg },
  title: { ...typography.screenTitle, textAlign: 'center' },
  subtitle: { color: colors.textSecondary, textAlign: 'center', marginBottom: spacing.lg },
  photoContainer: { alignSelf: 'center', marginBottom: spacing.md },
  photo: { width: 140, height: 140, borderRadius: 70, backgroundColor: colors.divider },
  photoPlaceholder: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoPlaceholderText: { color: colors.textSecondary, textAlign: 'center', paddingHorizontal: spacing.sm },
  photoUploading: { textAlign: 'center', color: colors.textSecondary, marginTop: spacing.xs },
  label: { color: colors.textSecondary, marginBottom: spacing.xs, marginTop: spacing.md },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    padding: spacing.md,
    backgroundColor: colors.fieldBackground,
    color: '#000000',
  },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.pill, paddingVertical: 6, paddingHorizontal: spacing.md },
  chipActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  chipText: { color: colors.textPrimary },
  chipTextActive: { color: 'white', fontWeight: '600' },
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: spacing.xs },
  saveButton: { marginTop: spacing.lg },
  dashboardGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, marginTop: spacing.lg },
  dashboardTile: {
    flexBasis: '47%',
    flexGrow: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    ...cardShadow,
  },
  dashboardTileWide: {
    flexBasis: '100%',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    ...cardShadow,
  },
  dashboardTileIcon: { fontSize: 22, marginBottom: spacing.xs },
  dashboardTileTitle: { fontSize: 16, fontWeight: '700', color: colors.textPrimary },
  dashboardTileSubtitle: { color: colors.textSecondary, marginTop: spacing.xs, fontSize: 12 },
  deleteButton: { padding: spacing.md, marginTop: spacing.sm, marginBottom: spacing.xxl },
  deleteButtonText: { color: colors.danger, textAlign: 'center', fontWeight: '600' },
  accordionAddRow: { alignItems: 'flex-end', marginBottom: spacing.sm },
  listCard: { backgroundColor: colors.surface, marginBottom: spacing.sm, padding: spacing.md },
  listCardTitle: { fontWeight: '600' },
  listCardSubtitle: { color: colors.textSecondary, marginTop: 2 },
  deleteLink: { color: colors.danger, fontWeight: '600', marginTop: spacing.xs },
  emptyHint: { color: colors.textSecondary },
});
