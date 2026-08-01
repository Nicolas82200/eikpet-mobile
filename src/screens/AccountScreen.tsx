import React, { useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import KeyboardAvoidingScreen from '../components/KeyboardAvoidingScreen';
import AddModal from '../components/AddModal';
import * as api from '../api/endpoints';
import { useAuth } from '../auth/AuthContext';
import { showError } from '../utils/errorHandling';

export default function AccountScreen() {
  const { logout } = useAuth();
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
          <TouchableOpacity style={styles.button} onPress={onSubmit} disabled={submitting}>
            <Text style={styles.buttonText}>{submitting ? 'Enregistrement...' : 'Changer le mot de passe'}</Text>
          </TouchableOpacity>

          <View style={styles.dangerZone}>
            <Text style={styles.dangerTitle}>Zone dangereuse</Text>
            <Text style={styles.dangerHint}>
              Supprime definitivement ton compte et tous les foyers dont tu es proprietaire.
            </Text>
            <TouchableOpacity
              style={styles.dangerButton}
              onPress={() => setDeleteModalVisible(true)}
            >
              <Text style={styles.dangerButtonText}>Supprimer mon compte</Text>
            </TouchableOpacity>
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
        <TouchableOpacity style={styles.dangerButton} onPress={onConfirmDelete} disabled={deleting}>
          <Text style={styles.dangerButtonText}>{deleting ? 'Suppression...' : 'Continuer'}</Text>
        </TouchableOpacity>
      </AddModal>
    </>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16 },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 16 },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 12, marginBottom: 12 },
  button: { backgroundColor: '#2f6f4f', borderRadius: 8, padding: 14 },
  buttonText: { color: 'white', textAlign: 'center', fontWeight: '600' },
  dangerZone: { marginTop: 32, borderTopWidth: 1, borderTopColor: '#eee', paddingTop: 20 },
  dangerTitle: { fontSize: 16, fontWeight: '700', color: '#a33', marginBottom: 6 },
  dangerHint: { color: '#666', marginBottom: 12 },
  dangerButton: { borderWidth: 1, borderColor: '#a33', borderRadius: 8, padding: 14 },
  dangerButtonText: { color: '#a33', textAlign: 'center', fontWeight: '600' },
});
