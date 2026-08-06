import React, { useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '../navigation/types';
import * as api from '../api/endpoints';
import KeyboardAvoidingScreen from '../components/KeyboardAvoidingScreen';
import PrimaryButton from '../components/PrimaryButton';
import { showError } from '../utils/errorHandling';
import { colors, radius, spacing, typography } from '../theme/colors';

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
        <PrimaryButton
          title={submitting ? 'Validation...' : 'Valider'}
          onPress={onSubmit}
          disabled={submitting}
          loading={submitting}
          style={styles.button}
        />
        <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')}>
          <Text style={styles.link}>Renvoyer un code</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingScreen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: spacing.xl },
  title: { ...typography.screenTitle, fontSize: 28, textAlign: 'center', marginBottom: spacing.sm },
  hint: { color: colors.textSecondary, textAlign: 'center', marginBottom: spacing.xl },
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
});
