import React, { useCallback, useState } from 'react';
import { FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AppStackParamList } from '../navigation/types';
import * as api from '../api/endpoints';
import type { Animal } from '../types/api';

type Props = NativeStackScreenProps<AppStackParamList, 'Animals'>;

export default function AnimalsScreen({ route, navigation }: Props) {
  const { householdId, householdName } = route.params;
  const [animals, setAnimals] = useState<Animal[]>([]);
  const [name, setName] = useState('');
  const [species, setSpecies] = useState('');

  const load = useCallback(() => {
    api.listAnimals(householdId).then(setAnimals).catch(() => undefined);
  }, [householdId]);

  useFocusEffect(load);

  const onCreate = async () => {
    if (!name.trim() || !species.trim()) return;
    await api.createAnimal(householdId, { name: name.trim(), species: species.trim() });
    setName('');
    setSpecies('');
    load();
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={animals}
        keyExtractor={(item) => String(item.id)}
        ListHeaderComponent={
          <>
            <Text style={styles.title}>{householdName}</Text>
            <TouchableOpacity
              style={styles.calendarLink}
              onPress={() => navigation.navigate('Calendar', { householdId, householdName })}
            >
              <Text style={styles.calendarLinkText}>Voir le calendrier des rappels</Text>
            </TouchableOpacity>
          </>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() =>
              navigation.navigate('AnimalDetail', { animalId: item.id, animalName: item.name, householdId })
            }
          >
            <Text style={styles.cardTitle}>{item.name}</Text>
            <Text style={styles.cardSubtitle}>
              {item.species}
              {item.age ? ` — ${item.age.years} an(s) ${item.age.months} mois` : ''}
            </Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={<Text style={styles.empty}>Aucun animal pour l'instant</Text>}
      />
      <View style={styles.newAnimalRow}>
        <TextInput style={styles.input} placeholder="Nom" value={name} onChangeText={setName} />
        <TextInput style={styles.input} placeholder="Espece" value={species} onChangeText={setSpecies} />
        <TouchableOpacity style={styles.addButton} onPress={onCreate}>
          <Text style={styles.addButtonText}>+</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 8 },
  calendarLink: { marginBottom: 16 },
  calendarLinkText: { color: '#2f6f4f', fontWeight: '600' },
  card: { backgroundColor: '#f2f2f2', borderRadius: 8, padding: 16, marginBottom: 12 },
  cardTitle: { fontSize: 18, fontWeight: '600' },
  cardSubtitle: { color: '#666', marginTop: 4 },
  empty: { color: '#666', textAlign: 'center', marginTop: 24 },
  newAnimalRow: { flexDirection: 'row', gap: 8, marginTop: 8 },
  input: { flex: 1, borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 12 },
  addButton: { backgroundColor: '#2f6f4f', borderRadius: 8, paddingHorizontal: 20, justifyContent: 'center' },
  addButtonText: { color: 'white', fontSize: 20, fontWeight: 'bold' },
});
