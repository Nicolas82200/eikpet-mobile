import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '../navigation/types';
import { useAuth } from '../auth/AuthContext';
import { ApiError } from '../api/client';
import KeyboardAvoidingScreen from '../components/KeyboardAvoidingScreen';

type Props = NativeStackScreenProps<AuthStackParamList, 'Register'>;

export default function RegisterScreen({ navigation }: Props) {
  const { register } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [householdName, setHouseholdName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async () => {
    setError(null);
    setSubmitting(true);
    try {
      await register({
        email,
        password,
        firstName,
        lastName,
        householdName: householdName || undefined,
        inviteCode: inviteCode || undefined,
      });
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Erreur lors de la creation du compte');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingScreen>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <Text style={styles.title}>Creer un compte</Text>
      <TextInput style={styles.input} placeholder="Prenom" value={firstName} onChangeText={setFirstName} />
      <TextInput style={styles.input} placeholder="Nom" value={lastName} onChangeText={setLastName} />
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
        placeholder="Mot de passe (8 caracteres min)"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />
      <Text style={styles.hint}>Creer un nouveau foyer OU rejoindre un foyer existant :</Text>
      <TextInput
        style={styles.input}
        placeholder="Nom du foyer a creer"
        value={householdName}
        onChangeText={setHouseholdName}
      />
      <TextInput
        style={styles.input}
        placeholder="OU code d'invitation d'un foyer existant"
        autoCapitalize="characters"
        value={inviteCode}
        onChangeText={setInviteCode}
      />
      {error && <Text style={styles.error}>{error}</Text>}
      <TouchableOpacity style={styles.button} onPress={onSubmit} disabled={submitting}>
        <Text style={styles.buttonText}>{submitting ? 'Creation...' : 'Creer mon compte'}</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => navigation.navigate('Login')}>
        <Text style={styles.link}>Deja un compte ? Se connecter</Text>
      </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingScreen>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  title: { fontSize: 28, fontWeight: 'bold', textAlign: 'center', marginBottom: 24 },
  hint: { marginTop: 8, marginBottom: 4, color: '#666' },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 12, marginBottom: 12 },
  button: { backgroundColor: '#2f6f4f', borderRadius: 8, padding: 14, marginTop: 8 },
  buttonText: { color: 'white', textAlign: 'center', fontWeight: '600' },
  link: { textAlign: 'center', marginTop: 16, color: '#2f6f4f' },
  error: { color: 'red', marginBottom: 8, textAlign: 'center' },
});
