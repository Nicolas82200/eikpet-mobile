import React, { useCallback, useState } from 'react';
import { Alert, FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import * as DocumentPicker from 'expo-document-picker';
import * as Sharing from 'expo-sharing';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AppStackParamList } from '../navigation/types';
import * as api from '../api/endpoints';
import type { DocumentCategory, DocumentRecord } from '../types/api';
import { DOCUMENT_CATEGORIES, getCategoryLabel } from '../data/documentCategories';
import AddIconButton from '../components/AddIconButton';
import AddModal from '../components/AddModal';
import { useRefreshable } from '../hooks/useRefreshable';
import { isPlanLimitError, showError, showLoadError } from '../utils/errorHandling';

type Props = NativeStackScreenProps<AppStackParamList, 'Documents'>;

type PickedFile = { uri: string; name: string; mimeType: string };

export default function DocumentsScreen({ route, navigation }: Props) {
  const { householdId, animalId } = route.params;
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [pickedFile, setPickedFile] = useState<PickedFile | null>(null);
  const [category, setCategory] = useState<DocumentCategory>('autre');
  const [uploading, setUploading] = useState(false);
  const [openingId, setOpeningId] = useState<number | null>(null);

  const load = useCallback(() => {
    const request = animalId ? api.listDocumentsForAnimal(animalId) : api.listDocumentsForHousehold(householdId);
    return request.then(setDocuments).catch(showLoadError);
  }, [householdId, animalId]);
  const { refreshing, trigger, onRefresh } = useRefreshable(load);

  useFocusEffect(trigger);

  const onPickFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: '*/*', copyToCacheDirectory: true });
      if (result.canceled || !result.assets?.[0]) {
        return;
      }
      const asset = result.assets[0];
      setPickedFile({ uri: asset.uri, name: asset.name, mimeType: asset.mimeType ?? 'application/octet-stream' });
    } catch (error) {
      showError(error, 'Selection du fichier impossible');
    }
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
    } catch (error) {
      if (isPlanLimitError(error)) {
        setModalVisible(false);
        navigation.navigate('Paywall');
      } else {
        showError(error, 'Envoi impossible');
      }
    } finally {
      setUploading(false);
    }
  };

  const onOpen = async (doc: DocumentRecord) => {
    setOpeningId(doc.id);
    try {
      const localUri = await api.downloadDocumentToCache(doc);
      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(localUri, { mimeType: doc.mimeType });
      } else {
        Alert.alert('Impossible d\'ouvrir le document', 'Le partage de fichiers n\'est pas disponible sur cet appareil.');
      }
    } catch (error) {
      showError(error, 'Ouverture impossible');
    } finally {
      setOpeningId(null);
    }
  };

  const onDelete = (doc: DocumentRecord) => {
    Alert.alert('Supprimer ce document ?', doc.fileName, [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.deleteDocument(doc.id);
            load();
          } catch (error) {
            showError(error);
          }
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
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListHeaderComponent={
          <View style={styles.titleRow}>
            <Text style={styles.title}>Documents</Text>
            <AddIconButton onPress={() => setModalVisible(true)} />
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card} onPress={() => onOpen(item)} disabled={openingId === item.id}>
            <Text style={styles.cardTitle}>{item.fileName}</Text>
            <Text style={styles.cardSubtitle}>
              {getCategoryLabel(item.category)} — {(item.sizeBytes / 1024).toFixed(0)} Ko
            </Text>
            <Text style={styles.cardSubtitle}>{new Date(item.createdAt).toLocaleDateString('fr-FR')}</Text>
            <Text style={styles.openLink}>{openingId === item.id ? 'Ouverture...' : 'Ouvrir'}</Text>
            <TouchableOpacity onPress={() => onDelete(item)}>
              <Text style={styles.deleteLink}>Supprimer</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        )}
        ListEmptyComponent={<Text style={styles.empty}>Aucun document pour l&apos;instant</Text>}
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
  card: { backgroundColor: '#EDE3D0', borderRadius: 8, padding: 16, marginBottom: 12 },
  cardTitle: { fontSize: 16, fontWeight: '600' },
  cardSubtitle: { color: '#8A7B68', marginTop: 4 },
  openLink: { color: '#B8863B', fontWeight: '600', marginTop: 8 },
  deleteLink: { color: '#B3452C', fontWeight: '600', marginTop: 8 },
  empty: { color: '#8A7B68', textAlign: 'center', marginTop: 24 },
  pickButton: { borderWidth: 1, borderColor: '#E3D8C4', borderStyle: 'dashed', borderRadius: 8, padding: 16, marginBottom: 16 },
  pickButtonText: { textAlign: 'center', color: '#3A3226' },
  label: { color: '#8A7B68', marginBottom: 8 },
  categoryRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 16 },
  chip: { borderWidth: 1, borderColor: '#E3D8C4', borderRadius: 16, paddingVertical: 6, paddingHorizontal: 12 },
  chipActive: { backgroundColor: '#B8863B', borderColor: '#B8863B' },
  chipText: { color: '#3A3226' },
  chipTextActive: { color: 'white', fontWeight: '600' },
  uploadButton: { backgroundColor: '#B8863B', borderRadius: 8, padding: 14 },
  uploadButtonDisabled: { backgroundColor: '#E3C68A' },
  uploadButtonText: { color: 'white', textAlign: 'center', fontWeight: '600' },
});
