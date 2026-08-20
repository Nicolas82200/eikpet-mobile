import React, { useCallback, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AppStackParamList } from '../navigation/types';
import * as api from '../api/endpoints';
import type { Animal, AnimalSex } from '../types/api';
import SpeciesPicker from '../components/SpeciesPicker';
import AddIconButton from '../components/AddIconButton';
import AddModal from '../components/AddModal';
import AuthenticatedImage from '../components/AuthenticatedImage';
import AutocompleteInput from '../components/AutocompleteInput';
import DatePickerInput from '../components/DatePickerInput';
import PrimaryButton from '../components/PrimaryButton';
import ScreenHeader from '../components/ScreenHeader';
import { getBreedsForSpecies } from '../data/breeds';
import { getColorsForSpecies } from '../data/colors';
import { useRefreshable } from '../hooks/useRefreshable';
import { isPlanLimitError, showError, showLoadError } from '../utils/errorHandling';
import { cardShadow, colors, radius, spacing } from '../theme/colors';

type Props = NativeStackScreenProps<AppStackParamList, 'Animals'>;

const SEX_OPTIONS: { value: AnimalSex; label: string }[] = [
  { value: 'male', label: 'Male' },
  { value: 'femelle', label: 'Femelle' },
  { value: 'inconnu', label: 'Inconnu' },
];

export default function AnimalsScreen({ route, navigation }: Props) {
  const { householdId, householdName } = route.params;
  const [animals, setAnimals] = useState<Animal[]>([]);
  const [name, setName] = useState('');
  const [species, setSpecies] = useState('');
  const [modalVisible, setModalVisible] = useState(false);

  const [editingAnimal, setEditingAnimal] = useState<Animal | null>(null);
  const [editForm, setEditForm] = useState<Partial<Animal>>({});
  const [savingEdit, setSavingEdit] = useState(false);

  const load = useCallback(() => {
    return api.listAnimals(householdId).then(setAnimals).catch(showLoadError);
  }, [householdId]);
  const { refreshing, trigger, onRefresh } = useRefreshable(load);

  useFocusEffect(trigger);

  const onCreate = async () => {
    if (!name.trim() || !species.trim()) return;
    try {
      await api.createAnimal(householdId, { name: name.trim(), species: species.trim() });
      setName('');
      setSpecies('');
      setModalVisible(false);
      load();
    } catch (error) {
      if (isPlanLimitError(error)) {
        setModalVisible(false);
        navigation.navigate('Paywall');
      } else {
        showError(error);
      }
    }
  };

  const openEditModal = (animal: Animal) => {
    setEditingAnimal(animal);
    setEditForm(animal);
  };

  const onSaveEdit = async () => {
    if (!editingAnimal) return;
    setSavingEdit(true);
    try {
      await api.updateAnimal(editingAnimal.id, {
        name: editForm.name,
        breed: editForm.breed,
        color: editForm.color,
        sex: editForm.sex,
        birthDate: editForm.birthDate,
        sterilized: editForm.sterilized,
        microchipNumber: editForm.microchipNumber,
        currentWeightKg: editForm.currentWeightKg,
      });
      setEditingAnimal(null);
      load();
    } catch (error) {
      showError(error);
    } finally {
      setSavingEdit(false);
    }
  };

  return (
    <>
      <FlatList
        style={styles.container}
        contentContainerStyle={styles.content}
        data={animals}
        numColumns={2}
        columnWrapperStyle={styles.row}
        keyExtractor={(item) => String(item.id)}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListHeaderComponent={
          <>
            <ScreenHeader title={householdName} action={<AddIconButton onPress={() => setModalVisible(true)} />} />
            <TouchableOpacity
              style={styles.calendarLink}
              onPress={() => navigation.navigate('Calendar', { householdId, householdName })}
            >
              <Text style={styles.calendarLinkText}>Voir le calendrier des rappels</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.calendarLink}
              onPress={() => navigation.navigate('Providers', { householdId, householdName })}
            >
              <Text style={styles.calendarLinkText}>Repertoire des intervenants</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.calendarLink}
              onPress={() => navigation.navigate('Budget', { householdId, householdName })}
            >
              <Text style={styles.calendarLinkText}>Voir le budget</Text>
            </TouchableOpacity>
          </>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.tile}
            activeOpacity={0.85}
            onPress={() =>
              navigation.navigate('AnimalDetail', { animalId: item.id, animalName: item.name, householdId })
            }
          >
            <TouchableOpacity style={styles.editButton} onPress={() => openEditModal(item)} hitSlop={8}>
              <Text style={styles.editButtonIcon}>✏️</Text>
            </TouchableOpacity>
            {item.photoUrl ? (
              <AuthenticatedImage
                uri={`${api.getAnimalPhotoUrl(item.id)}?v=${encodeURIComponent(item.photoUrl)}`}
                style={styles.tileImage}
              />
            ) : (
              <View style={styles.tileImagePlaceholder} />
            )}
            <Text style={styles.tileTitle} numberOfLines={1}>
              {item.name}
            </Text>
            <Text style={styles.tileSubtitle} numberOfLines={1}>
              {item.species}
              {item.age ? ` — ${item.age.years} an(s) ${item.age.months} mois` : ''}
            </Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={<Text style={styles.empty}>Aucun animal pour l&apos;instant</Text>}
      />

      <AddModal visible={modalVisible} title="Ajouter un animal" onClose={() => setModalVisible(false)}>
        <TextInput style={styles.input} placeholder="Nom" value={name} onChangeText={setName} autoFocus />
        <View style={styles.speciesField}>
          <SpeciesPicker value={species} onChange={setSpecies} />
        </View>
        <PrimaryButton title="Ajouter" onPress={onCreate} />
      </AddModal>

      <AddModal
        visible={!!editingAnimal}
        title={`Modifier ${editingAnimal?.name ?? ''}`}
        onClose={() => setEditingAnimal(null)}
      >
        {editingAnimal && (
          <>
            <Text style={styles.label}>Nom</Text>
            <TextInput
              style={styles.input}
              value={editForm.name ?? ''}
              onChangeText={(v) => setEditForm((f) => ({ ...f, name: v }))}
            />

            <Text style={styles.label}>Race</Text>
            <AutocompleteInput
              value={editForm.breed ?? ''}
              onChange={(v) => setEditForm((f) => ({ ...f, breed: v }))}
              options={getBreedsForSpecies(editingAnimal.species)}
              placeholder="Taper pour rechercher une race"
            />

            <Text style={styles.label}>Robe / couleur</Text>
            <AutocompleteInput
              value={editForm.color ?? ''}
              onChange={(v) => setEditForm((f) => ({ ...f, color: v }))}
              options={getColorsForSpecies(editingAnimal.species)}
              placeholder="Taper pour rechercher une robe / couleur"
            />

            <Text style={styles.label}>Sexe</Text>
            <View style={styles.chipRow}>
              {SEX_OPTIONS.map((opt) => (
                <TouchableOpacity
                  key={opt.value}
                  style={[styles.chip, editForm.sex === opt.value && styles.chipActive]}
                  onPress={() => setEditForm((f) => ({ ...f, sex: opt.value }))}
                >
                  <Text style={editForm.sex === opt.value ? styles.chipTextActive : styles.chipText}>{opt.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Date de naissance</Text>
            <DatePickerInput
              value={editForm.birthDate?.slice(0, 10) ?? ''}
              onChange={(v) => setEditForm((f) => ({ ...f, birthDate: v }))}
            />

            <View style={styles.switchRow}>
              <Text style={styles.label}>Sterilise(e)</Text>
              <Switch
                value={!!editForm.sterilized}
                onValueChange={(v) => setEditForm((f) => ({ ...f, sterilized: v }))}
              />
            </View>

            <Text style={styles.label}>Numero de puce / tatouage</Text>
            <TextInput
              style={styles.input}
              value={editForm.microchipNumber ?? ''}
              onChangeText={(v) => setEditForm((f) => ({ ...f, microchipNumber: v }))}
            />

            <Text style={styles.label}>Poids actuel (kg)</Text>
            <TextInput
              style={styles.input}
              keyboardType="decimal-pad"
              value={editForm.currentWeightKg != null ? String(editForm.currentWeightKg) : ''}
              onChangeText={(v) => setEditForm((f) => ({ ...f, currentWeightKg: v ? parseFloat(v) : undefined }))}
            />

            <PrimaryButton
              title={savingEdit ? 'Enregistrement...' : 'Enregistrer'}
              onPress={onSaveEdit}
              disabled={savingEdit}
              loading={savingEdit}
              style={styles.saveButton}
            />
          </>
        )}
      </AddModal>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: spacing.lg },
  calendarLink: { marginBottom: spacing.lg },
  calendarLinkText: { color: colors.accent, fontWeight: '600' },
  row: { gap: spacing.md },
  tile: {
    flex: 1,
    position: 'relative',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...cardShadow,
  },
  editButton: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    zIndex: 1,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    ...cardShadow,
  },
  editButtonIcon: { fontSize: 14 },
  tileImage: { width: '100%', aspectRatio: 1, borderRadius: radius.md, backgroundColor: colors.divider, marginBottom: spacing.sm },
  tileImagePlaceholder: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: radius.md,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
    marginBottom: spacing.sm,
  },
  tileTitle: { fontSize: 16, fontWeight: '700', color: colors.textPrimary },
  tileSubtitle: { color: colors.textSecondary, marginTop: 2, fontSize: 12 },
  empty: { color: colors.textSecondary, textAlign: 'center', marginTop: spacing.xl },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    padding: spacing.md,
    marginBottom: spacing.md,
    backgroundColor: colors.fieldBackground,
    color: '#000000',
  },
  speciesField: { marginBottom: spacing.lg },
  label: { color: colors.textSecondary, marginBottom: spacing.xs, marginTop: spacing.md },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.pill, paddingVertical: 6, paddingHorizontal: spacing.md },
  chipActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  chipText: { color: colors.textPrimary },
  chipTextActive: { color: 'white', fontWeight: '600' },
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: spacing.xs },
  saveButton: { marginTop: spacing.lg },
});
