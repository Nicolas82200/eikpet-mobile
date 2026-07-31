import React, { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AppStackParamList } from '../navigation/types';
import * as api from '../api/endpoints';
import type { Animal, HealthEntry } from '../types/api';
import KeyboardAvoidingScreen from '../components/KeyboardAvoidingScreen';
import LoadingScreen from '../components/LoadingScreen';
import { cancelAppointmentFollowUp } from '../notifications/localReminders';
import { showError, showLoadError } from '../utils/errorHandling';
import { formatTime } from '../utils/formatting';

type Props = NativeStackScreenProps<AppStackParamList, 'AppointmentFollowUp'>;

export default function AppointmentFollowUpScreen({ route, navigation }: Props) {
  const { animalId, entryId } = route.params;
  const [animal, setAnimal] = useState<Animal | null>(null);
  const [entry, setEntry] = useState<HealthEntry | null>(null);
  const [report, setReport] = useState('');
  const [price, setPrice] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    api.getAnimal(animalId).then(setAnimal).catch(showLoadError);
    api
      .listHealthEntries(animalId)
      .then((entries) => {
        const found = entries.find((e) => e.id === entryId) ?? null;
        setEntry(found);
        setReport(found?.report ?? '');
        setPrice(found?.price != null ? String(found.price) : '');
      })
      .catch(showLoadError);
  }, [animalId, entryId]);

  useFocusEffect(load);

  const onSaveReport = async () => {
    setSaving(true);
    try {
      await api.updateHealthEntry(animalId, entryId, {
        report: report.trim() || undefined,
        price: price ? parseFloat(price) : undefined,
        status: 'fait',
      });
      await cancelAppointmentFollowUp(entryId);
      load();
    } catch (error) {
      showError(error);
    } finally {
      setSaving(false);
    }
  };

  if (!animal) {
    return <LoadingScreen />;
  }

  return (
    <KeyboardAvoidingScreen>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Suivi du rendez-vous — {animal.name}</Text>
        {entry && (
          <Text style={styles.subtitle}>
            {entry.customTypeLabel ?? entry.type} — {entry.scheduledDate}
            {entry.scheduledTime ? ` a ${formatTime(entry.scheduledTime)}` : ''}
          </Text>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Compte-rendu</Text>
          <TextInput
            style={[styles.input, styles.multiline]}
            placeholder="Notes sur le rendez-vous..."
            value={report}
            onChangeText={setReport}
            multiline
          />
          <TextInput
            style={styles.input}
            placeholder="Prix (optionnel)"
            keyboardType="decimal-pad"
            value={price}
            onChangeText={setPrice}
          />
          <TouchableOpacity style={styles.button} onPress={onSaveReport} disabled={saving}>
            <Text style={styles.buttonText}>{saving ? 'Enregistrement...' : 'Enregistrer le compte-rendu'}</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.card}
          onPress={() => navigation.navigate('HealthEntries', { animalId, animalName: animal.name, species: animal.species })}
        >
          <Text style={styles.cardTitle}>Prendre un nouveau rendez-vous</Text>
          <Text style={styles.cardSubtitle}>Ouvre le carnet de sante pour ajouter une nouvelle echeance</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.card}
          onPress={() =>
            navigation.navigate('MedicalProfile', { animalId, animalName: animal.name, species: animal.species })
          }
        >
          <Text style={styles.cardTitle}>Ajouter un traitement</Text>
          <Text style={styles.cardSubtitle}>Medicaments donnes par le veto, avec rappels de prise</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingScreen>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16 },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 4 },
  subtitle: { color: '#666', marginBottom: 20 },
  section: { backgroundColor: '#f2f2f2', borderRadius: 8, padding: 16, marginBottom: 20 },
  sectionTitle: { fontSize: 16, fontWeight: '600', marginBottom: 10 },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 12, marginBottom: 10, backgroundColor: 'white' },
  multiline: { minHeight: 80, textAlignVertical: 'top' },
  button: { backgroundColor: '#2f6f4f', borderRadius: 8, padding: 14 },
  buttonText: { color: 'white', textAlign: 'center', fontWeight: '600' },
  card: { backgroundColor: '#f2f2f2', borderRadius: 8, padding: 16, marginBottom: 12 },
  cardTitle: { fontSize: 16, fontWeight: '600' },
  cardSubtitle: { color: '#666', marginTop: 4 },
});
