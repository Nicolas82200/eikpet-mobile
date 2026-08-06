import React, { useCallback, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AppStackParamList } from '../navigation/types';
import * as api from '../api/endpoints';
import type { Animal } from '../types/api';
import SpeciesPicker from '../components/SpeciesPicker';
import AddIconButton from '../components/AddIconButton';
import AddModal from '../components/AddModal';
import AuthenticatedImage from '../components/AuthenticatedImage';
import PrimaryButton from '../components/PrimaryButton';
import ScreenHeader from '../components/ScreenHeader';
import { useRefreshable } from '../hooks/useRefreshable';
import { isPlanLimitError, showError, showLoadError } from '../utils/errorHandling';
import { cardShadow, colors, radius, spacing } from '../theme/colors';

type Props = NativeStackScreenProps<AppStackParamList, 'Animals'>;

export default function AnimalsScreen({ route, navigation }: Props) {
  const { householdId, householdName } = route.params;
  const [animals, setAnimals] = useState<Animal[]>([]);
  const [name, setName] = useState('');
  const [species, setSpecies] = useState('');
  const [modalVisible, setModalVisible] = useState(false);

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
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...cardShadow,
  },
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
});
