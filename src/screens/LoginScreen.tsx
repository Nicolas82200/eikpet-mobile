import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '../navigation/types';
import { useAuth } from '../auth/AuthContext';
import { ApiError } from '../api/client';
import KeyboardAvoidingScreen from '../components/KeyboardAvoidingScreen';

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

export default function LoginScreen({ navigation }: Props) {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async () => {
    setError(null);
    setSubmitting(true);
    try {
      await login(email, password);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Erreur de connexion');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingScreen>
      <View style={styles.container}>
      <Text style={styles.title}>EikPet</Text>
      <TextInput
        style={styles.input}
        placeholder="Email"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        style={styles.input}
        placeholder="Mot de passe"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />
      {error && <Text style={styles.error}>{error}</Text>}
      <TouchableOpacity style={styles.button} onPress={onSubmit} disabled={submitting}>
        <Text style={styles.buttonText}>{submitting ? 'Connexion...' : 'Se connecter'}</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')}>
        <Text style={styles.link}>Mot de passe oublie ?</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => navigation.navigate('Register')}>
        <Text style={styles.link}>Pas encore de compte ? Creer un compte</Text>
      </TouchableOpacity>
      </View>
    </KeyboardAvoidingScreen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 24 },
  title: { fontSize: 32, fontWeight: 'bold', textAlign: 'center', marginBottom: 32 },
  input: { borderWidth: 1, borderColor: '#E3D8C4', borderRadius: 8, padding: 12, marginBottom: 12, backgroundColor: '#EFE2C4', color: '#B8863B' },
  button: { backgroundColor: '#B8863B', borderRadius: 8, padding: 14, marginTop: 8 },
  buttonText: { color: 'white', textAlign: 'center', fontWeight: '600' },
  link: { textAlign: 'center', marginTop: 16, color: '#B8863B' },
  error: { color: 'red', marginBottom: 8, textAlign: 'center' },
});
