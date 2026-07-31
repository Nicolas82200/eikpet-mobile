import React, { useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import KeyboardAvoidingScreen from '../components/KeyboardAvoidingScreen';
import * as api from '../api/endpoints';
import { useAuth } from '../auth/AuthContext';
import { showError } from '../utils/errorHandling';

export default function AccountScreen() {
  const { logout } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

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

  return (
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
      </View>
    </KeyboardAvoidingScreen>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16 },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 16 },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 12, marginBottom: 12 },
  button: { backgroundColor: '#2f6f4f', borderRadius: 8, padding: 14 },
  buttonText: { color: 'white', textAlign: 'center', fontWeight: '600' },
});
