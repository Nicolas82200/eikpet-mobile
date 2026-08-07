import React, { useCallback, useState } from 'react';
import { Alert, FlatList, Linking, RefreshControl, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AppStackParamList } from '../navigation/types';
import * as api from '../api/endpoints';
import type { Provider, ProviderType } from '../types/api';
import { PROVIDER_TYPES, getProviderTypeLabel } from '../data/providerTypes';
import AddIconButton from '../components/AddIconButton';
import AddModal from '../components/AddModal';
import { useRefreshable } from '../hooks/useRefreshable';
import { showError, showLoadError } from '../utils/errorHandling';

type Props = NativeStackScreenProps<AppStackParamList, 'Providers'>;

export default function ProvidersScreen({ route, navigation }: Props) {
  const { householdId, householdName } = route.params;
  const [providers, setProviders] = useState<Provider[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [type, setType] = useState<ProviderType>('veto');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [editingProvider, setEditingProvider] = useState<Provider | null>(null);

  const load = useCallback(() => {
    return api.listProviders(householdId).then(setProviders).catch(showLoadError);
  }, [householdId]);
  const { refreshing, trigger, onRefresh } = useRefreshable(load);

  useFocusEffect(trigger);

  const resetForm = () => {
    setType('veto');
    setName('');
    setPhone('');
    setAddress('');
  };

  const onCreate = async () => {
    if (!name.trim()) return;
    setSubmitting(true);
    try {
      await api.createProvider(householdId, {
        type,
        name: name.trim(),
        phone: phone.trim() || undefined,
        address: address.trim() || undefined,
      });
      resetForm();
      setModalVisible(false);
      load();
    } catch (error) {
      showError(error);
    } finally {
      setSubmitting(false);
    }
  };

  const openEditModal = (provider: Provider) => {
    setEditingProvider(provider);
    setType(provider.type);
    setName(provider.name);
    setPhone(provider.phone ?? '');
    setAddress(provider.address ?? '');
  };

  const onSaveEdit = async () => {
    if (!editingProvider || !name.trim()) return;
    setSubmitting(true);
    try {
      await api.updateProvider(editingProvider.id, {
        type,
        name: name.trim(),
        phone: phone.trim() || undefined,
        address: address.trim() || undefined,
      });
      resetForm();
      setEditingProvider(null);
      load();
    } catch (error) {
      showError(error);
    } finally {
      setSubmitting(false);
    }
  };

  const onDelete = (provider: Provider) => {
    Alert.alert('Supprimer cet intervenant ?', provider.name, [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.deleteProvider(provider.id);
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
        data={providers}
        keyExtractor={(item) => String(item.id)}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListHeaderComponent={
          <>
            <View style={styles.titleRow}>
              <Text style={styles.title}>Intervenants</Text>
              <AddIconButton onPress={() => setModalVisible(true)} />
            </View>
            <TouchableOpacity
              style={styles.mapLink}
              onPress={() => navigation.navigate('ProvidersMap', { householdId, householdName })}
            >
              <Text style={styles.mapLinkText}>Voir la carte</Text>
            </TouchableOpacity>
          </>
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.cardType}>{getProviderTypeLabel(item.type)}</Text>
            <Text style={styles.cardTitle}>{item.name}</Text>
            {item.phone && (
              <TouchableOpacity onPress={() => Linking.openURL(`tel:${item.phone}`)}>
                <Text style={styles.cardLink}>{item.phone}</Text>
              </TouchableOpacity>
            )}
            {item.address && <Text style={styles.cardSubtitle}>{item.address}</Text>}
            <View style={styles.cardActions}>
              <TouchableOpacity onPress={() => openEditModal(item)}>
                <Text style={styles.editLink}>Modifier</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => onDelete(item)}>
                <Text style={styles.deleteLink}>Supprimer</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.empty}>Aucun intervenant pour l&apos;instant</Text>}
      />

      <AddModal
        visible={modalVisible}
        title="Ajouter un intervenant"
        onClose={() => {
          setModalVisible(false);
          resetForm();
        }}
      >
        <Text style={styles.label}>Type</Text>
        <View style={styles.typeRow}>
          {PROVIDER_TYPES.map((t) => (
            <TouchableOpacity
              key={t.value}
              style={[styles.chip, type === t.value && styles.chipActive]}
              onPress={() => setType(t.value)}
            >
              <Text style={type === t.value ? styles.chipTextActive : styles.chipText}>{t.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TextInput style={styles.input} placeholder="Nom" value={name} onChangeText={setName} />
        <TextInput
          style={styles.input}
          placeholder="Telephone"
          keyboardType="phone-pad"
          value={phone}
          onChangeText={setPhone}
        />
        <TextInput style={styles.input} placeholder="Adresse" value={address} onChangeText={setAddress} />

        <TouchableOpacity style={styles.submitButton} onPress={onCreate} disabled={submitting || !name.trim()}>
          <Text style={styles.submitButtonText}>{submitting ? 'Enregistrement...' : 'Ajouter'}</Text>
        </TouchableOpacity>
      </AddModal>

      <AddModal
        visible={!!editingProvider}
        title="Modifier l'intervenant"
        onClose={() => {
          setEditingProvider(null);
          resetForm();
        }}
      >
        <Text style={styles.label}>Type</Text>
        <View style={styles.typeRow}>
          {PROVIDER_TYPES.map((t) => (
            <TouchableOpacity
              key={t.value}
              style={[styles.chip, type === t.value && styles.chipActive]}
              onPress={() => setType(t.value)}
            >
              <Text style={type === t.value ? styles.chipTextActive : styles.chipText}>{t.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TextInput style={styles.input} placeholder="Nom" value={name} onChangeText={setName} />
        <TextInput
          style={styles.input}
          placeholder="Telephone"
          keyboardType="phone-pad"
          value={phone}
          onChangeText={setPhone}
        />
        <TextInput style={styles.input} placeholder="Adresse" value={address} onChangeText={setAddress} />

        <TouchableOpacity style={styles.submitButton} onPress={onSaveEdit} disabled={submitting || !name.trim()}>
          <Text style={styles.submitButtonText}>{submitting ? 'Enregistrement...' : 'Enregistrer'}</Text>
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
  mapLink: { marginBottom: 16 },
  mapLinkText: { color: '#B8863B', fontWeight: '600' },
  card: { backgroundColor: '#EDE3D0', borderRadius: 8, padding: 16, marginBottom: 12 },
  cardType: { color: '#B8863B', fontWeight: '700', fontSize: 12, textTransform: 'uppercase' },
  cardTitle: { fontSize: 16, fontWeight: '600', marginTop: 4 },
  cardSubtitle: { color: '#8A7B68', marginTop: 4 },
  cardLink: { color: '#B8863B', marginTop: 4 },
  cardActions: { flexDirection: 'row', gap: 16, marginTop: 8 },
  editLink: { color: '#B8863B', fontWeight: '600' },
  deleteLink: { color: '#B3452C', fontWeight: '600' },
  empty: { color: '#8A7B68', textAlign: 'center', marginTop: 24 },
  label: { color: '#8A7B68', marginBottom: 8 },
  typeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 16 },
  chip: { borderWidth: 1, borderColor: '#E3D8C4', borderRadius: 16, paddingVertical: 6, paddingHorizontal: 12 },
  chipActive: { backgroundColor: '#B8863B', borderColor: '#B8863B' },
  chipText: { color: '#3A3226' },
  chipTextActive: { color: 'white', fontWeight: '600' },
  input: { borderWidth: 1, borderColor: '#E3D8C4', borderRadius: 8, padding: 12, marginBottom: 12, backgroundColor: '#EFE2C4', color: '#000000' },
  submitButton: { backgroundColor: '#B8863B', borderRadius: 8, padding: 14 },
  submitButtonText: { color: 'white', textAlign: 'center', fontWeight: '600' },
});
