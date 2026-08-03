import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '../navigation/types';
import * as api from '../api/endpoints';
import KeyboardAvoidingScreen from '../components/KeyboardAvoidingScreen';
import { showError } from '../utils/errorHandling';

type Props = NativeStackScreenProps<AuthStackParamList, 'ForgotPassword'>;

export default function ForgotPasswordScreen({ navigation }: Props) {
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async () => {
    if (!email.trim()) return;
    setSubmitting(true);
    try {
      await api.forgotPassword(email.trim());
      navigation.navigate('ResetPassword', { email: email.trim() });
    } catch (error) {
      showError(error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingScreen>
      <View style={styles.container}>
        <Text style={styles.title}>Mot de passe oublie</Text>
        <Text style={styles.hint}>
          Indique ton email, tu recevras un code a 6 chiffres valable 15 minutes pour choisir un nouveau mot de
          passe.
        </Text>
        <TextInput
          style={styles.input}
          placeholder="Email"
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
          autoFocus
        />
        <TouchableOpacity style={styles.button} onPress={onSubmit} disabled={submitting}>
          <Text style={styles.buttonText}>{submitting ? 'Envoi...' : 'Recevoir le code'}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate('Login')}>
          <Text style={styles.link}>Retour a la connexion</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingScreen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 24 },
  title: { fontSize: 28, fontWeight: 'bold', textAlign: 'center', marginBottom: 12 },
  hint: { color: '#8A7B68', textAlign: 'center', marginBottom: 24 },
  input: { borderWidth: 1, borderColor: '#E3D8C4', borderRadius: 8, padding: 12, marginBottom: 12, color: '#3A3226' },
  button: { backgroundColor: '#B8863B', borderRadius: 8, padding: 14, marginTop: 8 },
  buttonText: { color: 'white', textAlign: 'center', fontWeight: '600' },
  link: { textAlign: 'center', marginTop: 16, color: '#B8863B' },
});
