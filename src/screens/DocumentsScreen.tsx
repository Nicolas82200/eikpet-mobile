import React, { useCallback, useState } from 'react';
import { Alert, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import * as DocumentPicker from 'expo-document-picker';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AppStackParamList } from '../navigation/types';
import * as api from '../api/endpoints';
import type { DocumentCategory, DocumentRecord } from '../types/api';
import { DOCUMENT_CATEGORIES, getCategoryLabel } from '../data/documentCategories';
import AddIconButton from '../components/AddIconButton';
import AddModal from '../components/AddModal';

type Props = NativeStackScreenProps<AppStackParamList, 'Documents'>;

type PickedFile = { uri: string; name: string; mimeType: string };

export default function DocumentsScreen({ route }: Props) {
  const { householdId, animalId } = route.params;
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [pickedFile, setPickedFile] = useState<PickedFile | null>(null);
  const [category, setCategory] = useState<DocumentCategory>('autre');
  const [uploading, setUploading] = useState(false);

  const load = useCallback(() => {
    const request = animalId ? api.listDocumentsForAnimal(animalId) : api.listDocumentsForHousehold(householdId);
    request.then(setDocuments).catch(() => undefined);
  }, [householdId, animalId]);

  useFocusEffect(load);

  const onPickFile = async () => {
    const result = await DocumentPicker.getDocumentAsync({ type: '*/*', copyToCacheDirectory: true });
    if (result.canceled || !result.assets?.[0]) {
      return;
    }
    const asset = result.assets[0];
    setPickedFile({ uri: asset.uri, name: asset.name, mimeType: asset.mimeType ?? 'application/octet-stream' });
  };

  const onUpload = async () => {
    if (!pickedFile) return;
    setUploading(true);
    try {
      await api.uploadDocument(
        householdId,
        { uri: pickedFile.uri, name: pickedFile.name, type: pickedFile.mimeType },
        category,
        animalId,
      );
      setPickedFile(null);
      setCategory('autre');
      setModalVisible(false);
      load();
    } finally {
      setUploading(false);
    }
  };

  const onDelete = (doc: DocumentRecord) => {
    Alert.alert('Supprimer ce document ?', doc.fileName, [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer',
        style: 'destructive',
        onPress: async () => {
          await api.deleteDocument(doc.id);
          load();
        },
      },
    ]);
  };

  return (
    <>
      <FlatList
        style={styles.container}
        contentContainerStyle={styles.content}
        data={documents}
        keyExtractor={(item) => String(item.id)}
        ListHeaderComponent={
          <View style={styles.titleRow}>
            <Text style={styles.title}>Documents</Text>
            <AddIconButton onPress={() => setModalVisible(true)} />
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{item.fileName}</Text>
            <Text style={styles.cardSubtitle}>
              {getCategoryLabel(item.category)} — {(item.sizeBytes / 1024).toFixed(0)} Ko
            </Text>
            <Text style={styles.cardSubtitle}>{new Date(item.createdAt).toLocaleDateString('fr-FR')}</Text>
            <TouchableOpacity onPress={() => onDelete(item)}>
              <Text style={styles.deleteLink}>Supprimer</Text>
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.empty}>Aucun document pour l'instant</Text>}
      />

      <AddModal
        visible={modalVisible}
        title="Ajouter un document"
        onClose={() => {
          setModalVisible(false);
          setPickedFile(null);
        }}
      >
        <TouchableOpacity style={styles.pickButton} onPress={onPickFile}>
          <Text style={styles.pickButtonText}>{pickedFile ? pickedFile.name : 'Choisir un fichier'}</Text>
        </TouchableOpacity>

        <Text style={styles.label}>Categorie</Text>
        <View style={styles.categoryRow}>
          {DOCUMENT_CATEGORIES.map((c) => (
            <TouchableOpacity
              key={c.value}
              style={[styles.chip, category === c.value && styles.chipActive]}
              onPress={() => setCategory(c.value)}
            >
              <Text style={category === c.value ? styles.chipTextActive : styles.chipText}>{c.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={[styles.uploadButton, !pickedFile && styles.uploadButtonDisabled]}
          onPress={onUpload}
          disabled={!pickedFile || uploading}
        >
          <Text style={styles.uploadButtonText}>{uploading ? 'Envoi...' : 'Uploader'}</Text>
        </TouchableOpacity>
      </AddModal>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16 },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  title: { fontSize: 22, fontWeight: 'bold' },
  card: { backgroundColor: '#f2f2f2', borderRadius: 8, padding: 16, marginBottom: 12 },
  cardTitle: { fontSize: 16, fontWeight: '600' },
  cardSubtitle: { color: '#666', marginTop: 4 },
  deleteLink: { color: '#a33', fontWeight: '600', marginTop: 8 },
  empty: { color: '#666', textAlign: 'center', marginTop: 24 },
  pickButton: { borderWidth: 1, borderColor: '#ccc', borderStyle: 'dashed', borderRadius: 8, padding: 16, marginBottom: 16 },
  pickButtonText: { textAlign: 'center', color: '#333' },
  label: { color: '#666', marginBottom: 8 },
  categoryRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 16 },
  chip: { borderWidth: 1, borderColor: '#ccc', borderRadius: 16, paddingVertical: 6, paddingHorizontal: 12 },
  chipActive: { backgroundColor: '#2f6f4f', borderColor: '#2f6f4f' },
  chipText: { color: '#333' },
  chipTextActive: { color: 'white', fontWeight: '600' },
  uploadButton: { backgroundColor: '#2f6f4f', borderRadius: 8, padding: 14 },
  uploadButtonDisabled: { backgroundColor: '#a9c9b8' },
  uploadButtonText: { color: 'white', textAlign: 'center', fontWeight: '600' },
});
