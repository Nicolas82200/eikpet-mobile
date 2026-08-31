import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '../navigation/types';
import { useAuth } from '../auth/AuthContext';
import { ApiError } from '../api/client';
import KeyboardAvoidingScreen from '../components/KeyboardAvoidingScreen';
import PrimaryButton from '../components/PrimaryButton';
import { colors, radius, spacing } from '../theme/colors';

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
      <Text style={styles.subtitle}>La santé de tes animaux, centralisée</Text>
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
      <PrimaryButton
        title={submitting ? 'Connexion...' : 'Se connecter'}
        onPress={onSubmit}
        disabled={submitting}
        loading={submitting}
        style={styles.button}
      />
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
  container: { flex: 1, justifyContent: 'center', padding: spacing.xl },
  title: { fontSize: 34, fontWeight: 'bold', textAlign: 'center', color: colors.accent },
  subtitle: { textAlign: 'center', color: colors.textSecondary, marginTop: spacing.xs, marginBottom: spacing.xxl },
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
