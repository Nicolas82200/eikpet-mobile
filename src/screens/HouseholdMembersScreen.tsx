import React, { useCallback, useState } from 'react';
import { Alert, FlatList, RefreshControl, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import * as Clipboard from 'expo-clipboard';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AppStackParamList } from '../navigation/types';
import * as api from '../api/endpoints';
import type { HouseholdMember } from '../types/api';
import Card from '../components/Card';
import PrimaryButton from '../components/PrimaryButton';
import { useRefreshable } from '../hooks/useRefreshable';
import { showError, showLoadError } from '../utils/errorHandling';
import { colors, radius, spacing, typography } from '../theme/colors';

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

          <Card style={styles.codeCard}>
            <Text style={styles.codeLabel}>Code d&apos;invitation</Text>
            <Text style={styles.code}>{inviteCode}</Text>
            <Text style={styles.codeHint}>
              Partage ce code aux autres membres du foyer : ils pourront le saisir lors de leur inscription.
            </Text>
            <View style={styles.codeActions}>
              <PrimaryButton title="Copier" onPress={onCopyCode} style={styles.codeButton} />
              {isOwner && (
                <PrimaryButton
                  title={regenerating ? 'Regeneration...' : 'Regenerer'}
                  onPress={onRegenerate}
                  disabled={regenerating}
                  loading={regenerating}
                  variant="dangerOutline"
                  style={styles.codeButton}
                />
              )}
            </View>
          </Card>

          <Text style={styles.sectionTitle}>Membres</Text>
        </>
      }
      renderItem={({ item }) => (
        <Card>
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
        </Card>
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
  content: { padding: spacing.lg },
  title: { ...typography.sectionTitle, fontSize: 22, marginBottom: spacing.lg },
  renameRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg },
  nameInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    padding: spacing.md,
    fontSize: 18,
    fontWeight: 'bold',
  },
  renameButton: { backgroundColor: colors.accent, borderRadius: radius.sm, paddingHorizontal: spacing.lg, justifyContent: 'center' },
  renameButtonText: { color: 'white', fontWeight: '600' },
  codeCard: { marginBottom: spacing.xl },
  codeLabel: { color: colors.textSecondary, marginBottom: spacing.xs },
  code: { fontSize: 28, fontWeight: 'bold', letterSpacing: 2, marginBottom: spacing.sm },
  codeHint: { color: colors.textSecondary, marginBottom: spacing.md },
  codeActions: { flexDirection: 'row', gap: spacing.sm },
  codeButton: { flex: 1 },
  sectionTitle: { ...typography.sectionTitle, fontSize: 18, marginBottom: spacing.sm },
  cardTitle: { fontSize: 16, fontWeight: '600' },
  cardSubtitle: { color: colors.textSecondary, marginTop: spacing.xs },
  removeLink: { color: colors.danger, fontWeight: '600', marginTop: spacing.sm },
  leaveButton: { padding: spacing.md, marginTop: spacing.sm, marginBottom: spacing.lg },
  leaveButtonText: { color: colors.danger, textAlign: 'center', fontWeight: '600' },
  empty: { color: colors.textSecondary, textAlign: 'center', marginTop: spacing.xl },
});
