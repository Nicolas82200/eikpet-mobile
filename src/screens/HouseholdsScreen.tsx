import React, { useCallback, useLayoutEffect, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AppStackParamList } from '../navigation/types';
import * as api from '../api/endpoints';
import type { Household } from '../types/api';
import LogoutButton from '../components/LogoutButton';
import AddIconButton from '../components/AddIconButton';
import AddModal from '../components/AddModal';
import PrimaryButton from '../components/PrimaryButton';
import ScreenHeader from '../components/ScreenHeader';
import { useRefreshable } from '../hooks/useRefreshable';
import { isPlanLimitError, showError, showLoadError } from '../utils/errorHandling';
import { cardShadow, colors, radius, spacing } from '../theme/colors';

type Props = NativeStackScreenProps<AppStackParamList, 'Households'>;

type Mode = 'create' | 'join';

export default function HouseholdsScreen({ navigation }: Props) {
  const [households, setHouseholds] = useState<(Household & { role: string })[]>([]);
  const [mode, setMode] = useState<Mode>('create');
  const [newHouseholdName, setNewHouseholdName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={() => navigation.navigate('PracticalInfo')}>
            <Text style={styles.accountLink}>Infos pratiques</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('Account')}>
            <Text style={styles.accountLink}>Mon compte</Text>
          </TouchableOpacity>
          <LogoutButton />
        </View>
      ),
    });
  }, [navigation]);

  const load = useCallback(() => {
    return api.listHouseholds().then(setHouseholds).catch(showLoadError);
  }, []);
  const { refreshing, trigger, onRefresh } = useRefreshable(load);

  useFocusEffect(trigger);

  const onCreate = async () => {
    if (!newHouseholdName.trim()) return;
    setSubmitting(true);
    try {
      await api.createHousehold(newHouseholdName.trim());
      setNewHouseholdName('');
      setModalVisible(false);
      load();
    } catch (error) {
      if (isPlanLimitError(error)) {
        setModalVisible(false);
        navigation.navigate('Paywall');
      } else {
        showError(error);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const onJoin = async () => {
    if (!inviteCode.trim()) return;
    setSubmitting(true);
    try {
      await api.joinHousehold(inviteCode.trim().toUpperCase());
      setInviteCode('');
      setModalVisible(false);
      load();
    } catch (error) {
      if (isPlanLimitError(error)) {
        setModalVisible(false);
        navigation.navigate('Paywall');
      } else {
        showError(error);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <FlatList
        style={styles.container}
        contentContainerStyle={styles.content}
        data={households}
        numColumns={2}
        columnWrapperStyle={styles.row}
        keyExtractor={(item) => String(item.id)}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListHeaderComponent={<ScreenHeader title="Mes foyers" action={<AddIconButton onPress={() => setModalVisible(true)} />} />}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.tile}
            activeOpacity={0.85}
            onPress={() => navigation.navigate('Animals', { householdId: item.id, householdName: item.name })}
          >
            <Text style={styles.tileIcon}>🏠</Text>
            <Text style={styles.tileTitle} numberOfLines={1}>
              {item.name}
            </Text>
            <Text style={styles.tileSubtitle} numberOfLines={1}>
              Code : {item.inviteCode}
            </Text>
            <TouchableOpacity
              onPress={() =>
                navigation.navigate('HouseholdMembers', {
                  householdId: item.id,
                  householdName: item.name,
                  inviteCode: item.inviteCode,
                  isOwner: item.role === 'owner',
                })
              }
            >
              <Text style={styles.membersLink}>Membres</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        )}
        ListEmptyComponent={<Text style={styles.empty}>Aucun foyer pour l&apos;instant</Text>}
      />

      <AddModal
        visible={modalVisible}
        title={mode === 'create' ? 'Creer un foyer' : 'Rejoindre un foyer'}
        onClose={() => setModalVisible(false)}
      >
        <View style={styles.modeRow}>
          <TouchableOpacity
            style={[styles.modeChip, mode === 'create' && styles.modeChipActive]}
            onPress={() => setMode('create')}
          >
            <Text style={mode === 'create' ? styles.modeChipTextActive : styles.modeChipText}>Creer</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.modeChip, mode === 'join' && styles.modeChipActive]}
            onPress={() => setMode('join')}
          >
            <Text style={mode === 'join' ? styles.modeChipTextActive : styles.modeChipText}>Rejoindre</Text>
          </TouchableOpacity>
        </View>

        {mode === 'create' ? (
          <>
            <TextInput
              style={styles.input}
              placeholder="Nom du nouveau foyer"
              value={newHouseholdName}
              onChangeText={setNewHouseholdName}
              autoFocus
            />
            <PrimaryButton
              title={submitting ? 'Creation...' : 'Creer'}
              onPress={onCreate}
              disabled={submitting}
              loading={submitting}
            />
          </>
        ) : (
          <>
            <TextInput
              style={styles.input}
              placeholder="Code d'invitation"
              autoCapitalize="characters"
              value={inviteCode}
              onChangeText={setInviteCode}
              autoFocus
            />
            <PrimaryButton
              title={submitting ? 'Connexion...' : 'Rejoindre'}
              onPress={onJoin}
              disabled={submitting}
              loading={submitting}
            />
          </>
        )}
      </AddModal>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: spacing.lg },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
  accountLink: { color: colors.accent, fontWeight: '600' },
  row: { gap: spacing.md },
  tile: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...cardShadow,
  },
  tileIcon: { fontSize: 22, marginBottom: spacing.xs },
  tileTitle: { fontSize: 16, fontWeight: '700', color: colors.textPrimary },
  tileSubtitle: { color: colors.textSecondary, marginTop: 2, fontSize: 12 },
  membersLink: { color: colors.accent, fontWeight: '600', marginTop: spacing.sm, fontSize: 12 },
  empty: { color: colors.textSecondary, textAlign: 'center', marginTop: spacing.xl },
  modeRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg },
  modeChip: { flex: 1, borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm, paddingVertical: 10 },
  modeChipActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  modeChipText: { color: colors.textPrimary, textAlign: 'center', fontWeight: '600' },
  modeChipTextActive: { color: 'white', textAlign: 'center', fontWeight: '600' },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    padding: spacing.md,
    marginBottom: spacing.md,
    backgroundColor: colors.fieldBackground,
    color: '#000000',
  },
});
