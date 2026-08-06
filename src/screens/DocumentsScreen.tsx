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
import Card from '../components/Card';
import PrimaryButton from '../components/PrimaryButton';
import ScreenHeader from '../components/ScreenHeader';
import { useRefreshable } from '../hooks/useRefreshable';
import { isPlanLimitError, showError, showLoadError } from '../utils/errorHandling';
import { colors, radius, spacing, typography } from '../theme/colors';

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
        ListHeaderComponent={<ScreenHeader title="Documents" action={<AddIconButton onPress={() => setModalVisible(true)} />} />}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => onOpen(item)} disabled={openingId === item.id} activeOpacity={0.8}>
            <Card>
              <Text style={styles.cardTitle}>{item.fileName}</Text>
              <Text style={styles.cardSubtitle}>
                {getCategoryLabel(item.category)} — {(item.sizeBytes / 1024).toFixed(0)} Ko
              </Text>
              <Text style={styles.cardSubtitle}>{new Date(item.createdAt).toLocaleDateString('fr-FR')}</Text>
              <View style={styles.cardActions}>
                <Text style={styles.openLink}>{openingId === item.id ? 'Ouverture...' : 'Ouvrir'}</Text>
                <TouchableOpacity onPress={() => onDelete(item)}>
                  <Text style={styles.deleteLink}>Supprimer</Text>
                </TouchableOpacity>
              </View>
            </Card>
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

        <PrimaryButton
          title={uploading ? 'Envoi...' : 'Uploader'}
          onPress={onUpload}
          disabled={!pickedFile || uploading}
          loading={uploading}
        />
      </AddModal>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: spacing.lg },
  cardTitle: { ...typography.sectionTitle, fontSize: 16 },
  cardSubtitle: { ...typography.caption, marginTop: spacing.xs },
  cardActions: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: spacing.sm },
  openLink: { color: colors.accent, fontWeight: '600' },
  deleteLink: { color: colors.danger, fontWeight: '600' },
  empty: { color: colors.textSecondary, textAlign: 'center', marginTop: spacing.xl },
  pickButton: {
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
    borderRadius: radius.sm,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  pickButtonText: { textAlign: 'center', color: colors.textPrimary },
  label: { color: colors.textSecondary, marginBottom: spacing.sm },
  categoryRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.lg },
  chip: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.pill, paddingVertical: 6, paddingHorizontal: spacing.md },
  chipActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  chipText: { color: colors.textPrimary },
  chipTextActive: { color: 'white', fontWeight: '600' },
});
