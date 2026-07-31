import React, { useCallback, useState } from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import * as DocumentPicker from 'expo-document-picker';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AppStackParamList } from '../navigation/types';
import * as api from '../api/endpoints';
import type { DocumentRecord } from '../types/api';

type Props = NativeStackScreenProps<AppStackParamList, 'Documents'>;

export default function DocumentsScreen({ route }: Props) {
  const { householdId, animalId } = route.params;
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);

  const load = useCallback(() => {
    const request = animalId ? api.listDocumentsForAnimal(animalId) : api.listDocumentsForHousehold(householdId);
    request.then(setDocuments).catch(() => undefined);
  }, [householdId, animalId]);

  useFocusEffect(load);

  const onPickAndUpload = async () => {
    const result = await DocumentPicker.getDocumentAsync({ type: '*/*', copyToCacheDirectory: true });
    if (result.canceled || !result.assets?.[0]) {
      return;
    }
    const asset = result.assets[0];
    await api.uploadDocument(
      householdId,
      { uri: asset.uri, name: asset.name, type: asset.mimeType ?? 'application/octet-stream' },
      'autre',
      animalId,
    );
    load();
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={documents}
        keyExtractor={(item) => String(item.id)}
        ListHeaderComponent={<Text style={styles.title}>Documents</Text>}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{item.fileName}</Text>
            <Text style={styles.cardSubtitle}>
              {item.category} — {(item.sizeBytes / 1024).toFixed(0)} Ko
            </Text>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.empty}>Aucun document pour l'instant</Text>}
      />
      <TouchableOpacity style={styles.button} onPress={onPickAndUpload}>
        <Text style={styles.buttonText}>Ajouter un document</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 16 },
  card: { backgroundColor: '#f2f2f2', borderRadius: 8, padding: 16, marginBottom: 12 },
  cardTitle: { fontSize: 16, fontWeight: '600' },
  cardSubtitle: { color: '#666', marginTop: 4 },
  empty: { color: '#666', textAlign: 'center', marginTop: 24 },
  button: { backgroundColor: '#2f6f4f', borderRadius: 8, padding: 14, marginTop: 8 },
  buttonText: { color: 'white', textAlign: 'center', fontWeight: '600' },
});
