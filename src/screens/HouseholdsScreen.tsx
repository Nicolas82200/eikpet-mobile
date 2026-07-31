import React, { useCallback, useLayoutEffect, useState } from 'react';
import { FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AppStackParamList } from '../navigation/types';
import * as api from '../api/endpoints';
import type { Household } from '../types/api';
import LogoutButton from '../components/LogoutButton';
import AddIconButton from '../components/AddIconButton';
import AddModal from '../components/AddModal';

type Props = NativeStackScreenProps<AppStackParamList, 'Households'>;

export default function HouseholdsScreen({ navigation }: Props) {
  const [households, setHouseholds] = useState<(Household & { role: string })[]>([]);
  const [newHouseholdName, setNewHouseholdName] = useState('');
  const [modalVisible, setModalVisible] = useState(false);

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
    setModalVisible(false);
    load();
  };

  return (
    <>
      <FlatList
        style={styles.container}
        contentContainerStyle={styles.content}
        data={households}
        keyExtractor={(item) => String(item.id)}
        ListHeaderComponent={
          <View style={styles.titleRow}>
            <Text style={styles.title}>Mes foyers</Text>
            <AddIconButton onPress={() => setModalVisible(true)} />
          </View>
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

      <AddModal visible={modalVisible} title="Creer un foyer" onClose={() => setModalVisible(false)}>
        <TextInput
          style={styles.input}
          placeholder="Nom du nouveau foyer"
          value={newHouseholdName}
          onChangeText={setNewHouseholdName}
          autoFocus
        />
        <TouchableOpacity style={styles.addButton} onPress={onCreate}>
          <Text style={styles.addButtonText}>Creer</Text>
        </TouchableOpacity>
      </AddModal>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16 },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  title: { fontSize: 24, fontWeight: 'bold' },
  card: { backgroundColor: '#f2f2f2', borderRadius: 8, padding: 16, marginBottom: 12 },
  cardTitle: { fontSize: 18, fontWeight: '600' },
  cardSubtitle: { color: '#666', marginTop: 4 },
  empty: { color: '#666', textAlign: 'center', marginTop: 24 },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 12, marginBottom: 12 },
  addButton: { backgroundColor: '#2f6f4f', borderRadius: 8, padding: 14 },
  addButtonText: { color: 'white', textAlign: 'center', fontWeight: '600' },
});
