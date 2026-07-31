import React, { useCallback, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AppStackParamList } from '../navigation/types';
import * as api from '../api/endpoints';
import type { Animal, AnimalSex } from '../types/api';
import KeyboardAvoidingScreen from '../components/KeyboardAvoidingScreen';
import AutocompleteInput from '../components/AutocompleteInput';
import DatePickerInput from '../components/DatePickerInput';
import AuthenticatedImage from '../components/AuthenticatedImage';
import { getBreedsForSpecies } from '../data/breeds';
import { getColorsForSpecies } from '../data/colors';
import { showError, showLoadError } from '../utils/errorHandling';

type Props = NativeStackScreenProps<AppStackParamList, 'AnimalDetail'>;

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

  const load = useCallback(() => {
    api
      .getAnimal(animalId)
      .then((a) => {
        setAnimal(a);
        setForm(a);
      })
      .catch(showLoadError);
  }, [animalId]);

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
    return null;
  }

  return (
    <KeyboardAvoidingScreen>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>{animal.name}</Text>

        <TouchableOpacity style={styles.photoContainer} onPress={onPickPhoto} disabled={uploadingPhoto}>
          {animal.photoUrl ? (
            <AuthenticatedImage uri={api.getAnimalPhotoUrl(animal.id)} style={styles.photo} />
          ) : (
            <View style={styles.photoPlaceholder}>
              <Text style={styles.photoPlaceholderText}>Ajouter une photo</Text>
            </View>
          )}
          {uploadingPhoto && <Text style={styles.photoUploading}>Envoi en cours...</Text>}
        </TouchableOpacity>

        <View style={styles.form}>
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

          <TouchableOpacity style={styles.saveButton} onPress={onSave} disabled={saving}>
            <Text style={styles.saveButtonText}>{saving ? 'Enregistrement...' : 'Enregistrer le profil'}</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.card}
          onPress={() =>
            navigation.navigate('MedicalProfile', { animalId, animalName: animal.name, species: animal.species })
          }
        >
          <Text style={styles.cardTitle}>Fiche medicale</Text>
          <Text style={styles.cardSubtitle}>Antecedents, allergies, traitements, assurance...</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.card}
          onPress={() =>
            navigation.navigate('HealthEntries', { animalId, animalName: animal.name, species: animal.species })
          }
        >
          <Text style={styles.cardTitle}>Carnet de sante</Text>
          <Text style={styles.cardSubtitle}>Vaccins, vermifuges, rdv veto...</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.card}
          onPress={() => navigation.navigate('Documents', { householdId, animalId })}
        >
          <Text style={styles.cardTitle}>Documents</Text>
          <Text style={styles.cardSubtitle}>Ordonnances, analyses, certificats...</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.deleteButton} onPress={onDelete}>
          <Text style={styles.deleteButtonText}>Supprimer cet animal</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingScreen>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 16 },
  photoContainer: { alignSelf: 'center', marginBottom: 20 },
  photo: { width: 140, height: 140, borderRadius: 70, backgroundColor: '#eee' },
  photoPlaceholder: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#f2f2f2',
    borderWidth: 1,
    borderColor: '#ccc',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoPlaceholderText: { color: '#666', textAlign: 'center', paddingHorizontal: 8 },
  photoUploading: { textAlign: 'center', color: '#666', marginTop: 6 },
  form: { backgroundColor: '#f2f2f2', borderRadius: 8, padding: 16, marginBottom: 20 },
  label: { color: '#666', marginBottom: 4, marginTop: 10 },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 12, backgroundColor: 'white' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: { borderWidth: 1, borderColor: '#ccc', borderRadius: 16, paddingVertical: 6, paddingHorizontal: 14 },
  chipActive: { backgroundColor: '#2f6f4f', borderColor: '#2f6f4f' },
  chipText: { color: '#333' },
  chipTextActive: { color: 'white', fontWeight: '600' },
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 },
  saveButton: { backgroundColor: '#2f6f4f', borderRadius: 8, padding: 12, marginTop: 16 },
  saveButtonText: { color: 'white', textAlign: 'center', fontWeight: '600' },
  card: { backgroundColor: '#f2f2f2', borderRadius: 8, padding: 16, marginBottom: 12 },
  cardTitle: { fontSize: 18, fontWeight: '600' },
  cardSubtitle: { color: '#666', marginTop: 4 },
  deleteButton: { padding: 12, marginTop: 8, marginBottom: 32 },
  deleteButtonText: { color: '#a33', textAlign: 'center', fontWeight: '600' },
});
