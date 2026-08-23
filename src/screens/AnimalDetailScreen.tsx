import React, { useCallback, useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AppStackParamList } from '../navigation/types';
import * as api from '../api/endpoints';
import type { Animal, HealthEntry, MedicalProfile, Provider } from '../types/api';
import KeyboardAvoidingScreen from '../components/KeyboardAvoidingScreen';
import Accordion from '../components/Accordion';
import Card from '../components/Card';
import AuthenticatedImage from '../components/AuthenticatedImage';
import LoadingScreen from '../components/LoadingScreen';
import WarningBanner from '../components/WarningBanner';
import AddIconButton from '../components/AddIconButton';
import AddModal from '../components/AddModal';
import { getProviderTypeLabel } from '../data/providerTypes';
import { getAnimalWarnings } from '../utils/animalWarnings';
import { showError, showLoadError } from '../utils/errorHandling';
import { isEquine } from '../utils/species';
import { cardShadow, colors, radius, spacing, typography } from '../theme/colors';

type Props = NativeStackScreenProps<AppStackParamList, 'AnimalDetail'>;

/** Desactive temporairement (demande produit) : reactiver en repassant a true. */
const SEANCES_ENABLED = false;

export default function AnimalDetailScreen({ route, navigation }: Props) {
  const { animalId, householdId } = route.params;
  const [animal, setAnimal] = useState<Animal | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [medicalProfile, setMedicalProfile] = useState<Partial<MedicalProfile> | null>(null);
  const [healthEntries, setHealthEntries] = useState<HealthEntry[]>([]);
  const [linkedProviders, setLinkedProviders] = useState<Provider[]>([]);
  const [householdProviders, setHouseholdProviders] = useState<Provider[]>([]);
  const [providerPickerVisible, setProviderPickerVisible] = useState(false);

  const load = useCallback(() => {
    api.getAnimal(animalId).then(setAnimal).catch(showLoadError);
    api.getMedicalProfile(animalId).then(setMedicalProfile).catch(() => setMedicalProfile(null));
    api.listHealthEntries(animalId).then(setHealthEntries).catch(() => setHealthEntries([]));
    api.listAnimalProviders(animalId).then(setLinkedProviders).catch(() => setLinkedProviders([]));
    api.listProviders(householdId).then(setHouseholdProviders).catch(() => setHouseholdProviders([]));
  }, [animalId, householdId]);

  useFocusEffect(load);

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
      <KeyboardAvoidingScreen contentContainerStyle={styles.container}>
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
            navigation.navigate('MedicalProfile', { animalId, animalName: animal.name, species: animal.species, householdId })
          }
        />

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
              navigation.navigate('MedicalProfile', { animalId, animalName: animal.name, species: animal.species, householdId })
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
