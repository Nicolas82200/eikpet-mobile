import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '../navigation/types';
import { useAuth } from '../auth/AuthContext';
import { ApiError } from '../api/client';
import KeyboardAvoidingScreen from '../components/KeyboardAvoidingScreen';
import PrimaryButton from '../components/PrimaryButton';
import { colors, radius, spacing, typography } from '../theme/colors';

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
      <PrimaryButton
        title={submitting ? 'Creation...' : 'Creer mon compte'}
        onPress={onSubmit}
        disabled={submitting}
        loading={submitting}
        style={styles.button}
      />
      <TouchableOpacity onPress={() => navigation.navigate('Login')}>
        <Text style={styles.link}>Deja un compte ? Se connecter</Text>
      </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingScreen>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, justifyContent: 'center', padding: spacing.xl },
  title: { ...typography.screenTitle, fontSize: 28, textAlign: 'center', marginBottom: spacing.xl },
  hint: { marginTop: spacing.sm, marginBottom: spacing.xs, color: colors.textSecondary },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    padding: spacing.md,
    marginBottom: spacing.md,
    backgroundColor: colors.fieldBackground,
    color: '#000000',
  },
  button: { marginTop: spacing.xs },
  link: { textAlign: 'center', marginTop: spacing.lg, color: colors.accent },
  error: { color: colors.danger, marginBottom: spacing.sm, textAlign: 'center' },
});
