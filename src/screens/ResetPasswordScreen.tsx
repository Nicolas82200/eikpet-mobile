import React, { useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '../navigation/types';
import * as api from '../api/endpoints';
import KeyboardAvoidingScreen from '../components/KeyboardAvoidingScreen';
import { showError } from '../utils/errorHandling';

type Props = NativeStackScreenProps<AuthStackParamList, 'ResetPassword'>;

export default function ResetPasswordScreen({ route, navigation }: Props) {
  const { email } = route.params;
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async () => {
    if (code.trim().length !== 6 || newPassword.length < 8) return;
    setSubmitting(true);
    try {
      await api.resetPassword(email, code.trim(), newPassword);
      Alert.alert('Mot de passe mis a jour', 'Tu peux maintenant te connecter avec ton nouveau mot de passe.', [
        { text: 'OK', onPress: () => navigation.navigate('Login') },
      ]);
    } catch (error) {
      showError(error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingScreen>
      <View style={styles.container}>
        <Text style={styles.title}>Nouveau mot de passe</Text>
        <Text style={styles.hint}>Code envoye a {email}</Text>
        <TextInput
          style={styles.input}
          placeholder="Code a 6 chiffres"
          keyboardType="number-pad"
          maxLength={6}
          value={code}
          onChangeText={setCode}
          autoFocus
        />
        <TextInput
          style={styles.input}
          placeholder="Nouveau mot de passe (8 caracteres min)"
          secureTextEntry
          value={newPassword}
          onChangeText={setNewPassword}
        />
        <TouchableOpacity style={styles.button} onPress={onSubmit} disabled={submitting}>
          <Text style={styles.buttonText}>{submitting ? 'Validation...' : 'Valider'}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')}>
          <Text style={styles.link}>Renvoyer un code</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingScreen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 24 },
  title: { fontSize: 28, fontWeight: 'bold', textAlign: 'center', marginBottom: 8 },
  hint: { color: '#8A7B68', textAlign: 'center', marginBottom: 24 },
  input: { borderWidth: 1, borderColor: '#E3D8C4', borderRadius: 8, padding: 12, marginBottom: 12, backgroundColor: '#EFE2C4', color: '#B8863B' },
  button: { backgroundColor: '#B8863B', borderRadius: 8, padding: 14, marginTop: 8 },
  buttonText: { color: 'white', textAlign: 'center', fontWeight: '600' },
  link: { textAlign: 'center', marginTop: 16, color: '#B8863B' },
});
