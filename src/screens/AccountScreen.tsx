import React, { useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import Card from '../components/Card';
import KeyboardAvoidingScreen from '../components/KeyboardAvoidingScreen';
import AddModal from '../components/AddModal';
import PrimaryButton from '../components/PrimaryButton';
import * as api from '../api/endpoints';
import { useAuth } from '../auth/AuthContext';
import { usePremium } from '../subscriptions/PurchasesContext';
import { showError } from '../utils/errorHandling';
import type { AppStackParamList } from '../navigation/types';
import { colors, radius, spacing, typography } from '../theme/colors';

type Props = NativeStackScreenProps<AppStackParamList, 'Account'>;

export default function AccountScreen({ navigation }: Props) {
  const { logout } = useAuth();
  const { isPremium } = usePremium();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleting, setDeleting] = useState(false);

  const onSubmit = async () => {
    if (!currentPassword || newPassword.length < 8) return;
    setSubmitting(true);
    try {
      await api.changePassword(currentPassword, newPassword);
      Alert.alert(
        'Mot de passe modifie',
        'Pour ta securite, tu dois te reconnecter avec ton nouveau mot de passe.',
        [{ text: 'OK', onPress: () => logout() }],
      );
    } catch (error) {
      showError(error);
    } finally {
      setSubmitting(false);
    }
  };

  const onConfirmDelete = () => {
    if (!deletePassword) return;
    Alert.alert(
      'Supprimer definitivement ton compte ?',
      'Tes foyers dont tu es proprietaire seront supprimes avec tous leurs animaux, fiches de sante et documents. Cette action est irreversible.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer mon compte',
          style: 'destructive',
          onPress: async () => {
            setDeleting(true);
            try {
              await api.deleteAccount(deletePassword);
              await logout();
            } catch (error) {
              showError(error);
            } finally {
              setDeleting(false);
            }
          },
        },
      ],
    );
  };

  return (
    <>
      <KeyboardAvoidingScreen>
        <View style={styles.container}>
          <Card style={styles.planCard}>
            <Text style={styles.planLabel}>{isPremium ? 'Abonnement premium actif' : 'Plan gratuit'}</Text>
            {!isPremium && <PrimaryButton title="Passer premium" onPress={() => navigation.navigate('Paywall')} />}
          </Card>

          <Text style={styles.title}>Changer le mot de passe</Text>
          <TextInput
            style={styles.input}
            placeholder="Mot de passe actuel"
            secureTextEntry
            value={currentPassword}
            onChangeText={setCurrentPassword}
          />
          <TextInput
            style={styles.input}
            placeholder="Nouveau mot de passe (8 caracteres min)"
            secureTextEntry
            value={newPassword}
            onChangeText={setNewPassword}
          />
          <PrimaryButton
            title={submitting ? 'Enregistrement...' : 'Changer le mot de passe'}
            onPress={onSubmit}
            disabled={submitting}
            loading={submitting}
          />

          <View style={styles.dangerZone}>
            <Text style={styles.dangerTitle}>Zone dangereuse</Text>
            <Text style={styles.dangerHint}>
              Supprime definitivement ton compte et tous les foyers dont tu es proprietaire.
            </Text>
            <PrimaryButton
              title="Supprimer mon compte"
              onPress={() => setDeleteModalVisible(true)}
              variant="dangerOutline"
            />
          </View>
        </View>
      </KeyboardAvoidingScreen>

      <AddModal
        visible={deleteModalVisible}
        title="Supprimer mon compte"
        onClose={() => {
          setDeleteModalVisible(false);
          setDeletePassword('');
        }}
      >
        <Text style={styles.dangerHint}>
          Confirme ton mot de passe pour supprimer definitivement ton compte.
        </Text>
        <TextInput
          style={styles.input}
          placeholder="Mot de passe"
          secureTextEntry
          value={deletePassword}
          onChangeText={setDeletePassword}
          autoFocus
        />
        <PrimaryButton
          title={deleting ? 'Suppression...' : 'Continuer'}
          onPress={onConfirmDelete}
          disabled={deleting}
          loading={deleting}
          variant="danger"
        />
      </AddModal>
    </>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.lg },
  planCard: { marginBottom: spacing.xl, gap: spacing.md },
  planLabel: { fontSize: 16, fontWeight: '700', marginBottom: spacing.xs },
  title: { ...typography.screenTitle, fontSize: 22, marginBottom: spacing.lg },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    padding: spacing.md,
    marginBottom: spacing.md,
    backgroundColor: colors.fieldBackground,
    color: '#000000',
  },
  dangerZone: { marginTop: spacing.xxl, borderTopWidth: 1, borderTopColor: colors.divider, paddingTop: spacing.xl },
  dangerTitle: { fontSize: 16, fontWeight: '700', color: colors.danger, marginBottom: spacing.xs },
  dangerHint: { color: colors.textSecondary, marginBottom: spacing.md },
});
