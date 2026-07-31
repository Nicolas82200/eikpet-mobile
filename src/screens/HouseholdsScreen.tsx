import React, { useCallback, useState } from 'react';
import { FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AppStackParamList } from '../navigation/types';
import * as api from '../api/endpoints';
import type { Household } from '../types/api';
import { useAuth } from '../auth/AuthContext';

type Props = NativeStackScreenProps<AppStackParamList, 'Households'>;

export default function HouseholdsScreen({ navigation }: Props) {
  const { logout } = useAuth();
  const [households, setHouseholds] = useState<(Household & { role: string })[]>([]);
  const [newHouseholdName, setNewHouseholdName] = useState('');

  const load = useCallback(() => {
    api.listHouseholds().then(setHouseholds).catch(() => undefined);
  }, []);

  useFocusEffect(load);

  const onCreate = async () => {
    if (!newHouseholdName.trim()) return;
    await api.createHousehold(newHouseholdName.trim());
    setNewHouseholdName('');
    load();
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={households}
        keyExtractor={(item) => String(item.id)}
        ListHeaderComponent={<Text style={styles.title}>Mes foyers</Text>}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => navigation.navigate('Animals', { householdId: item.id, householdName: item.name })}
          >
            <Text style={styles.cardTitle}>{item.name}</Text>
            <Text style={styles.cardSubtitle}>Code d'invitation : {item.inviteCode}</Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={<Text style={styles.empty}>Aucun foyer pour l'instant</Text>}
      />
      <View style={styles.newHouseholdRow}>
        <TextInput
          style={styles.input}
          placeholder="Nom du nouveau foyer"
          value={newHouseholdName}
          onChangeText={setNewHouseholdName}
        />
        <TouchableOpacity style={styles.addButton} onPress={onCreate}>
          <Text style={styles.addButtonText}>+</Text>
        </TouchableOpacity>
      </View>
      <TouchableOpacity onPress={() => logout()}>
        <Text style={styles.logout}>Se deconnecter</Text>
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
  empty: { color: '#666', textAlign: 'center', marginTop: 24 },
  newHouseholdRow: { flexDirection: 'row', gap: 8, marginTop: 8 },
  input: { flex: 1, borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 12 },
  addButton: { backgroundColor: '#2f6f4f', borderRadius: 8, paddingHorizontal: 20, justifyContent: 'center' },
  addButtonText: { color: 'white', fontSize: 20, fontWeight: 'bold' },
  logout: { textAlign: 'center', marginTop: 16, color: '#a33' },
});
