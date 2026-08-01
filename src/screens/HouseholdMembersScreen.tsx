import React, { useCallback, useState } from 'react';
import { Alert, FlatList, RefreshControl, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import * as Clipboard from 'expo-clipboard';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AppStackParamList } from '../navigation/types';
import * as api from '../api/endpoints';
import type { HouseholdMember } from '../types/api';
import { useRefreshable } from '../hooks/useRefreshable';
import { showError, showLoadError } from '../utils/errorHandling';

type Props = NativeStackScreenProps<AppStackParamList, 'HouseholdMembers'>;

export default function HouseholdMembersScreen({ route, navigation }: Props) {
  const { householdId, isOwner } = route.params;
  const [householdName, setHouseholdName] = useState(route.params.householdName);
  const [nameDraft, setNameDraft] = useState(route.params.householdName);
  const [inviteCode, setInviteCode] = useState(route.params.inviteCode);
  const [members, setMembers] = useState<HouseholdMember[]>([]);
  const [regenerating, setRegenerating] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(() => {
    return api.listHouseholdMembers(householdId).then(setMembers).catch(showLoadError);
  }, [householdId]);
  const { refreshing, trigger, onRefresh } = useRefreshable(load);

  useFocusEffect(trigger);

  const onCopyCode = async () => {
    await Clipboard.setStringAsync(inviteCode);
    Alert.alert('Copie !', "Le code d'invitation a ete copie.");
  };

  const onRegenerate = () => {
    Alert.alert(
      "Regenerer le code d'invitation ?",
      "L'ancien code ne fonctionnera plus.",
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Regenerer',
          style: 'destructive',
          onPress: async () => {
            setRegenerating(true);
            try {
              const result = await api.regenerateInviteCode(householdId);
              setInviteCode(result.inviteCode);
              navigation.setParams({ inviteCode: result.inviteCode });
            } catch (error) {
              showError(error);
            } finally {
              setRegenerating(false);
            }
          },
        },
      ],
    );
  };

  const onRename = async () => {
    if (!nameDraft.trim() || nameDraft.trim() === householdName) return;
    setRenaming(true);
    try {
      const updated = await api.renameHousehold(householdId, nameDraft.trim());
      setHouseholdName(updated.name);
      navigation.setParams({ householdName: updated.name });
      navigation.setOptions({ title: updated.name });
    } catch (error) {
      showError(error);
    } finally {
      setRenaming(false);
    }
  };

  const onRemoveMember = (member: HouseholdMember) => {
    Alert.alert('Retirer ce membre ?', `${member.firstName} ${member.lastName} n'aura plus acces a ce foyer.`, [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Retirer',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.removeMember(householdId, member.id);
            load();
          } catch (error) {
            showError(error);
          }
        },
      },
    ]);
  };

  const onDeleteHousehold = () => {
    Alert.alert(
      'Supprimer definitivement ce foyer ?',
      `Tous les animaux, fiches de sante et documents de "${householdName}" seront perdus. Cette action est irreversible.`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Continuer',
          style: 'destructive',
          onPress: () => {
            Alert.alert('Confirmer la suppression ?', 'Derniere confirmation avant suppression definitive.', [
              { text: 'Annuler', style: 'cancel' },
              {
                text: 'Supprimer le foyer',
                style: 'destructive',
                onPress: async () => {
                  setDeleting(true);
                  try {
                    await api.deleteHousehold(householdId);
                    navigation.goBack();
                  } catch (error) {
                    showError(error);
                  } finally {
                    setDeleting(false);
                  }
                },
              },
            ]);
          },
        },
      ],
    );
  };

  const onLeave = () => {
    Alert.alert('Quitter ce foyer ?', 'Tu perdras l\'acces aux animaux de ce foyer.', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Quitter',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.leaveHousehold(householdId);
            navigation.goBack();
          } catch (error) {
            showError(error);
          }
        },
      },
    ]);
  };

  return (
    <FlatList
      style={styles.container}
      contentContainerStyle={styles.content}
      data={members}
      keyExtractor={(item) => String(item.id)}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      ListHeaderComponent={
        <>
          {isOwner ? (
            <View style={styles.renameRow}>
              <TextInput style={styles.nameInput} value={nameDraft} onChangeText={setNameDraft} />
              <TouchableOpacity
                style={styles.renameButton}
                onPress={onRename}
                disabled={renaming || !nameDraft.trim() || nameDraft.trim() === householdName}
              >
                <Text style={styles.renameButtonText}>{renaming ? '...' : 'Renommer'}</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <Text style={styles.title}>{householdName}</Text>
          )}

          <View style={styles.codeCard}>
            <Text style={styles.codeLabel}>Code d'invitation</Text>
            <Text style={styles.code}>{inviteCode}</Text>
            <Text style={styles.codeHint}>
              Partage ce code aux autres membres du foyer : ils pourront le saisir lors de leur inscription.
            </Text>
            <View style={styles.codeActions}>
              <TouchableOpacity style={styles.codeButton} onPress={onCopyCode}>
                <Text style={styles.codeButtonText}>Copier</Text>
              </TouchableOpacity>
              {isOwner && (
                <TouchableOpacity style={styles.codeButtonSecondary} onPress={onRegenerate} disabled={regenerating}>
                  <Text style={styles.codeButtonSecondaryText}>
                    {regenerating ? 'Regeneration...' : 'Regenerer'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          <Text style={styles.sectionTitle}>Membres</Text>
        </>
      }
      renderItem={({ item }) => (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>
            {item.firstName} {item.lastName}
          </Text>
          <Text style={styles.cardSubtitle}>
            {item.email} — {item.role === 'owner' ? 'Proprietaire' : 'Membre'}
          </Text>
          {isOwner && item.role !== 'owner' && (
            <TouchableOpacity onPress={() => onRemoveMember(item)}>
              <Text style={styles.removeLink}>Retirer du foyer</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
      ListFooterComponent={
        isOwner ? (
          <TouchableOpacity style={styles.leaveButton} onPress={onDeleteHousehold} disabled={deleting}>
            <Text style={styles.leaveButtonText}>
              {deleting ? 'Suppression...' : 'Supprimer ce foyer'}
            </Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.leaveButton} onPress={onLeave}>
            <Text style={styles.leaveButtonText}>Quitter ce foyer</Text>
          </TouchableOpacity>
        )
      }
      ListEmptyComponent={<Text style={styles.empty}>Aucun membre</Text>}
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16 },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 16 },
  renameRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  nameInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E3D8C4',
    borderRadius: 8,
    padding: 12,
    fontSize: 18,
    fontWeight: 'bold',
  },
  renameButton: { backgroundColor: '#B8863B', borderRadius: 8, paddingHorizontal: 16, justifyContent: 'center' },
  renameButtonText: { color: 'white', fontWeight: '600' },
  codeCard: { backgroundColor: '#FAF6EF', borderRadius: 8, padding: 16, marginBottom: 20 },
  codeLabel: { color: '#8A7B68', marginBottom: 4 },
  code: { fontSize: 28, fontWeight: 'bold', letterSpacing: 2, marginBottom: 8 },
  codeHint: { color: '#8A7B68', marginBottom: 12 },
  codeActions: { flexDirection: 'row', gap: 8 },
  codeButton: { backgroundColor: '#B8863B', borderRadius: 8, paddingVertical: 10, paddingHorizontal: 16, flex: 1 },
  codeButtonText: { color: 'white', textAlign: 'center', fontWeight: '600' },
  codeButtonSecondary: {
    borderWidth: 1,
    borderColor: '#B3452C',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    flex: 1,
  },
  codeButtonSecondaryText: { color: '#B3452C', textAlign: 'center', fontWeight: '600' },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 8 },
  card: { backgroundColor: '#FAF6EF', borderRadius: 8, padding: 16, marginBottom: 12 },
  cardTitle: { fontSize: 16, fontWeight: '600' },
  cardSubtitle: { color: '#8A7B68', marginTop: 4 },
  removeLink: { color: '#B3452C', fontWeight: '600', marginTop: 8 },
  leaveButton: { padding: 12, marginTop: 8, marginBottom: 24 },
  leaveButtonText: { color: '#B3452C', textAlign: 'center', fontWeight: '600' },
  empty: { color: '#8A7B68', textAlign: 'center', marginTop: 24 },
});
