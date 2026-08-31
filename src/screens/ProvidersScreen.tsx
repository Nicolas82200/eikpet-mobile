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
import Card from '../components/Card';
import Dropdown from '../components/Dropdown';
import PrimaryButton from '../components/PrimaryButton';
import ScreenHeader from '../components/ScreenHeader';
import { useRefreshable } from '../hooks/useRefreshable';
import { showError, showLoadError } from '../utils/errorHandling';
import { colors, radius, spacing } from '../theme/colors';

type Props = NativeStackScreenProps<AppStackParamList, 'Providers'>;

export default function ProvidersScreen({ route, navigation }: Props) {
  const { householdId, householdName } = route.params;
  const [providers, setProviders] = useState<Provider[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [type, setType] = useState<ProviderType | null>(null);
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
    setType(null);
    setName('');
    setPhone('');
    setAddress('');
  };

  const onCreate = async () => {
    if (!name.trim() || !type) return;
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
    if (!editingProvider || !name.trim() || !type) return;
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

  const renderForm = (onSubmit: () => void, submitLabel: string) => (
    <>
      <Text style={styles.label}>Type</Text>
      <Dropdown value={type} onChange={setType} options={PROVIDER_TYPES} placeholder="Type d'intervenant" />
      <View style={styles.spacer} />

      <TextInput style={styles.input} placeholder="Nom" value={name} onChangeText={setName} />
      <TextInput
        style={styles.input}
        placeholder="Telephone"
        keyboardType="phone-pad"
        value={phone}
        onChangeText={setPhone}
      />
      <TextInput style={styles.input} placeholder="Adresse" value={address} onChangeText={setAddress} />

      <PrimaryButton
        title={submitting ? 'Enregistrement...' : submitLabel}
        onPress={onSubmit}
        disabled={submitting || !name.trim() || !type}
        loading={submitting}
      />
    </>
  );

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
            <ScreenHeader title="Intervenants" action={<AddIconButton onPress={() => setModalVisible(true)} />} />
            <TouchableOpacity
              style={styles.mapLink}
              onPress={() => navigation.navigate('ProvidersMap', { householdId, householdName })}
            >
              <Text style={styles.mapLinkText}>Voir la carte</Text>
            </TouchableOpacity>
          </>
        }
        renderItem={({ item }) => (
          <Card>
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
          </Card>
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
        {renderForm(onCreate, 'Ajouter')}
      </AddModal>

      <AddModal
        visible={!!editingProvider}
        title="Modifier l'intervenant"
        onClose={() => {
          setEditingProvider(null);
          resetForm();
        }}
      >
        {renderForm(onSaveEdit, 'Enregistrer')}
      </AddModal>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: spacing.lg },
  mapLink: { marginBottom: spacing.lg },
  mapLinkText: { color: colors.accent, fontWeight: '600' },
  cardType: { color: colors.accent, fontWeight: '700', fontSize: 12, textTransform: 'uppercase' },
  cardTitle: { fontSize: 16, fontWeight: '600', marginTop: spacing.xs },
  cardSubtitle: { color: colors.textSecondary, marginTop: spacing.xs },
  cardLink: { color: colors.accent, marginTop: spacing.xs },
  cardActions: { flexDirection: 'row', gap: spacing.lg, marginTop: spacing.sm },
  editLink: { color: colors.accent, fontWeight: '600' },
  deleteLink: { color: colors.danger, fontWeight: '600' },
  empty: { color: colors.textSecondary, textAlign: 'center', marginTop: spacing.xl },
  label: { color: colors.textSecondary, marginBottom: spacing.sm },
  spacer: { height: spacing.md },
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
