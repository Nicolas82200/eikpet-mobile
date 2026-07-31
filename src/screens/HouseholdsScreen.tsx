import React, { useCallback, useLayoutEffect, useState } from 'react';
import { FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AppStackParamList } from '../navigation/types';
import * as api from '../api/endpoints';
import type { Household } from '../types/api';
import KeyboardAvoidingScreen from '../components/KeyboardAvoidingScreen';
import LogoutButton from '../components/LogoutButton';

type Props = NativeStackScreenProps<AppStackParamList, 'Households'>;

export default function HouseholdsScreen({ navigation }: Props) {
  const [households, setHouseholds] = useState<(Household & { role: string })[]>([]);
  const [newHouseholdName, setNewHouseholdName] = useState('');

  useLayoutEffect(() => {
    navigation.setOptions({ headerRight: () => <LogoutButton /> });
  }, [navigation]);

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
    <KeyboardAvoidingScreen>
      <FlatList
        style={styles.container}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        data={households}
        keyExtractor={(item) => String(item.id)}
        ListHeaderComponent={
          <>
            <Text style={styles.title}>Mes foyers</Text>
            <View style={styles.form}>
              <Text style={styles.formTitle}>Creer un foyer</Text>
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
            </View>
          </>
        }
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
    </KeyboardAvoidingScreen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 16 },
  form: { backgroundColor: '#f2f2f2', borderRadius: 8, padding: 16, marginBottom: 20 },
  formTitle: { fontSize: 16, fontWeight: '600', marginBottom: 10 },
  card: { backgroundColor: '#f2f2f2', borderRadius: 8, padding: 16, marginBottom: 12 },
  cardTitle: { fontSize: 18, fontWeight: '600' },
  cardSubtitle: { color: '#666', marginTop: 4 },
  empty: { color: '#666', textAlign: 'center', marginTop: 24 },
  newHouseholdRow: { flexDirection: 'row', gap: 8 },
  input: { flex: 1, borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 12 },
  addButton: { backgroundColor: '#2f6f4f', borderRadius: 8, paddingHorizontal: 20, justifyContent: 'center' },
  addButtonText: { color: 'white', fontSize: 20, fontWeight: 'bold' },
});
