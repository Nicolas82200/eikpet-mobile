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
import { useRefreshable } from '../hooks/useRefreshable';
import { isPlanLimitError, showError, showLoadError } from '../utils/errorHandling';

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
            <View style={styles.titleRow}>
              <Text style={styles.title}>{householdName}</Text>
              <AddIconButton onPress={() => setModalVisible(true)} />
            </View>
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
        ListEmptyComponent={<Text style={styles.empty}>Aucun animal pour l'instant</Text>}
      />

      <AddModal visible={modalVisible} title="Ajouter un animal" onClose={() => setModalVisible(false)}>
        <TextInput style={styles.input} placeholder="Nom" value={name} onChangeText={setName} autoFocus />
        <View style={styles.speciesField}>
          <SpeciesPicker value={species} onChange={setSpecies} />
        </View>
        <TouchableOpacity style={styles.addButton} onPress={onCreate}>
          <Text style={styles.addButtonText}>Ajouter</Text>
        </TouchableOpacity>
      </AddModal>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16 },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  title: { fontSize: 24, fontWeight: 'bold' },
  calendarLink: { marginBottom: 16 },
  calendarLinkText: { color: '#B8863B', fontWeight: '600' },
  row: { gap: 12 },
  tile: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E3D8C4',
  },
  tileImage: { width: '100%', aspectRatio: 1, borderRadius: 12, backgroundColor: '#EDE3D0', marginBottom: 10 },
  tileImagePlaceholder: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 12,
    backgroundColor: '#FAF6EF',
    borderWidth: 1,
    borderColor: '#E3D8C4',
    borderStyle: 'dashed',
    marginBottom: 10,
  },
  tileTitle: { fontSize: 16, fontWeight: '700', color: '#3A3226' },
  tileSubtitle: { color: '#8A7B68', marginTop: 2, fontSize: 12 },
  empty: { color: '#8A7B68', textAlign: 'center', marginTop: 24 },
  input: { borderWidth: 1, borderColor: '#E3D8C4', borderRadius: 8, padding: 12, marginBottom: 12 },
  speciesField: { marginBottom: 16 },
  addButton: { backgroundColor: '#B8863B', borderRadius: 8, padding: 14 },
  addButtonText: { color: 'white', textAlign: 'center', fontWeight: '600' },
});
