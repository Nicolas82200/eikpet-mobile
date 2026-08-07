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
import { useRefreshable } from '../hooks/useRefreshable';
import { isPlanLimitError, showError, showLoadError } from '../utils/errorHandling';

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
        ListHeaderComponent={
          <View style={styles.titleRow}>
            <Text style={styles.title}>Mes foyers</Text>
            <AddIconButton onPress={() => setModalVisible(true)} />
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.tile}
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
            <TouchableOpacity style={styles.addButton} onPress={onCreate} disabled={submitting}>
              <Text style={styles.addButtonText}>{submitting ? 'Creation...' : 'Creer'}</Text>
            </TouchableOpacity>
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
            <TouchableOpacity style={styles.addButton} onPress={onJoin} disabled={submitting}>
              <Text style={styles.addButtonText}>{submitting ? 'Connexion...' : 'Rejoindre'}</Text>
            </TouchableOpacity>
          </>
        )}
      </AddModal>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16 },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  accountLink: { color: '#B8863B', fontWeight: '600' },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  title: { fontSize: 24, fontWeight: 'bold' },
  row: { gap: 12 },
  tile: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E3D8C4',
  },
  tileIcon: { fontSize: 22, marginBottom: 6 },
  tileTitle: { fontSize: 16, fontWeight: '700', color: '#3A3226' },
  tileSubtitle: { color: '#8A7B68', marginTop: 2, fontSize: 12 },
  membersLink: { color: '#B8863B', fontWeight: '600', marginTop: 10, fontSize: 12 },
  empty: { color: '#8A7B68', textAlign: 'center', marginTop: 24 },
  modeRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  modeChip: { flex: 1, borderWidth: 1, borderColor: '#E3D8C4', borderRadius: 8, paddingVertical: 10 },
  modeChipActive: { backgroundColor: '#B8863B', borderColor: '#B8863B' },
  modeChipText: { color: '#3A3226', textAlign: 'center', fontWeight: '600' },
  modeChipTextActive: { color: 'white', textAlign: 'center', fontWeight: '600' },
  input: { borderWidth: 1, borderColor: '#E3D8C4', borderRadius: 8, padding: 12, marginBottom: 12, backgroundColor: '#EFE2C4', color: '#000000' },
  addButton: { backgroundColor: '#B8863B', borderRadius: 8, padding: 14 },
  addButtonText: { color: 'white', textAlign: 'center', fontWeight: '600' },
});
