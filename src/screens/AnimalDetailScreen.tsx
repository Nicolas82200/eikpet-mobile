import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AppStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<AppStackParamList, 'AnimalDetail'>;

export default function AnimalDetailScreen({ route, navigation }: Props) {
  const { animalId, animalName, householdId } = route.params;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{animalName}</Text>
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate('MedicalProfile', { animalId, animalName })}
      >
        <Text style={styles.cardTitle}>Fiche medicale</Text>
        <Text style={styles.cardSubtitle}>Antecedents, allergies, traitements, assurance...</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate('HealthEntries', { animalId, animalName })}
      >
        <Text style={styles.cardTitle}>Carnet de sante</Text>
        <Text style={styles.cardSubtitle}>Vaccins, vermifuges, rdv veto...</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('Documents', { householdId, animalId })}>
        <Text style={styles.cardTitle}>Documents</Text>
        <Text style={styles.cardSubtitle}>Ordonnances, analyses, certificats...</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 16 },
  card: { backgroundColor: '#f2f2f2', borderRadius: 8, padding: 16, marginBottom: 12 },
  cardTitle: { fontSize: 18, fontWeight: '600' },
  cardSubtitle: { color: '#666', marginTop: 4 },
});
