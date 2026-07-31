import React, { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AppStackParamList } from '../navigation/types';
import * as api from '../api/endpoints';
import type { MedicalProfile } from '../types/api';
import KeyboardAvoidingScreen from '../components/KeyboardAvoidingScreen';

type Props = NativeStackScreenProps<AppStackParamList, 'MedicalProfile'>;

const FIELDS: { key: keyof MedicalProfile; label: string }[] = [
  { key: 'chronicConditions', label: 'Maladies chroniques' },
  { key: 'allergies', label: 'Allergies' },
  { key: 'dietaryNeeds', label: 'Regime alimentaire particulier' },
  { key: 'behavioralNotes', label: 'Notes comportementales' },
  { key: 'bloodType', label: 'Groupe sanguin' },
  { key: 'insuranceProvider', label: 'Assureur' },
  { key: 'insurancePolicyNumber', label: "N° de contrat d'assurance" },
  { key: 'referringVetName', label: 'Veto referent' },
  { key: 'referringVetPhone', label: 'Telephone du veto referent' },
];

export default function MedicalProfileScreen({ route }: Props) {
  const { animalId, animalName } = route.params;
  const [profile, setProfile] = useState<Partial<MedicalProfile>>({});
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    api
      .getMedicalProfile(animalId)
      .then((p) => setProfile(p ?? {}))
      .catch(() => undefined);
  }, [animalId]);

  useFocusEffect(load);

  const onSave = async () => {
    setSaving(true);
    try {
      await api.upsertMedicalProfile(animalId, profile);
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingScreen>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <Text style={styles.title}>Fiche medicale — {animalName}</Text>
      {FIELDS.map((field) => (
        <View key={field.key} style={styles.fieldGroup}>
          <Text style={styles.label}>{field.label}</Text>
          <TextInput
            style={styles.input}
            value={(profile[field.key] as string) ?? ''}
            onChangeText={(text) => setProfile((prev) => ({ ...prev, [field.key]: text }))}
          />
        </View>
      ))}
      <TouchableOpacity style={styles.button} onPress={onSave} disabled={saving}>
        <Text style={styles.buttonText}>{saving ? 'Enregistrement...' : 'Enregistrer'}</Text>
      </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingScreen>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16 },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 16 },
  fieldGroup: { marginBottom: 12 },
  label: { color: '#666', marginBottom: 4 },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 12 },
  button: { backgroundColor: '#2f6f4f', borderRadius: 8, padding: 14, marginTop: 16, marginBottom: 32 },
  buttonText: { color: 'white', textAlign: 'center', fontWeight: '600' },
});
