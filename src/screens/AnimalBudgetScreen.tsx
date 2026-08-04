import React, { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AppStackParamList } from '../navigation/types';
import * as api from '../api/endpoints';
import type { AnimalBudget } from '../types/api';
import LoadingScreen from '../components/LoadingScreen';
import { isPlanLimitError, showLoadError } from '../utils/errorHandling';

type Props = NativeStackScreenProps<AppStackParamList, 'AnimalBudget'>;

function formatEuros(amount: number): string {
  return `${amount.toFixed(2)} €`;
}

function formatCategoryLabel(type: string): string {
  return type.replace(/_/g, ' ');
}

export default function AnimalBudgetScreen({ route, navigation }: Props) {
  const { animalId, animalName } = route.params;
  const [budget, setBudget] = useState<AnimalBudget | null>(null);

  const load = useCallback(() => {
    api
      .getAnimalBudget(animalId)
      .then(setBudget)
      .catch((error) => {
        if (isPlanLimitError(error)) {
          navigation.replace('Paywall');
        } else {
          showLoadError(error);
        }
      });
  }, [animalId, navigation]);

  useFocusEffect(load);

  if (!budget) {
    return <LoadingScreen />;
  }

  const maxCategoryTotal = Math.max(1, ...budget.byCategory.map((c) => c.total));
  const summary = [
    { label: 'Sante', total: budget.healthTotal },
    { label: 'Pension', total: budget.boardingTotal },
    { label: 'Seances', total: budget.ridingSessionsTotal },
  ].filter((s) => s.total > 0);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>{animalName}</Text>
      <Text style={styles.totalLabel}>Total</Text>
      <Text style={styles.totalAmount}>{formatEuros(budget.total)}</Text>

      {summary.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Repartition</Text>
          {summary.map((s) => (
            <View key={s.label} style={styles.summaryRow}>
              <Text style={styles.line}>{s.label}</Text>
              <Text style={styles.lineAmount}>{formatEuros(s.total)}</Text>
            </View>
          ))}
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Depenses de sante par categorie</Text>
        {budget.byCategory.length === 0 && <Text style={styles.emptyHint}>Aucune depense de sante enregistree.</Text>}
        {budget.byCategory.map((c) => (
          <View key={c.type} style={styles.categoryRow}>
            <View style={styles.categoryLabelRow}>
              <Text style={styles.line}>{formatCategoryLabel(c.type)}</Text>
              <Text style={styles.lineAmount}>{formatEuros(c.total)}</Text>
            </View>
            <View style={styles.barTrack}>
              <View style={[styles.bar, { width: `${(c.total / maxCategoryTotal) * 100}%` }]} />
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, paddingBottom: 32 },
  title: { fontSize: 24, fontWeight: 'bold', textAlign: 'center' },
  totalLabel: { color: '#8A7B68', textAlign: 'center', marginTop: 8 },
  totalAmount: { fontSize: 32, fontWeight: 'bold', color: '#B8863B', textAlign: 'center', marginBottom: 16 },
  section: { backgroundColor: '#FAF6EF', borderRadius: 12, padding: 16, marginBottom: 12 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#3A3226', marginBottom: 8 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  line: { color: '#3A3226', textTransform: 'capitalize' },
  lineAmount: { color: '#3A3226', fontWeight: '600' },
  emptyHint: { color: '#8A7B68' },
  categoryRow: { marginBottom: 10 },
  categoryLabelRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  barTrack: { height: 8, borderRadius: 4, backgroundColor: '#EFE2C4', overflow: 'hidden' },
  bar: { height: 8, borderRadius: 4, backgroundColor: '#B8863B' },
});
