import React, { useCallback, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AppStackParamList } from '../navigation/types';
import * as api from '../api/endpoints';
import type { HouseholdBudget } from '../types/api';
import { useRefreshable } from '../hooks/useRefreshable';
import { isPlanLimitError, showLoadError } from '../utils/errorHandling';

type Props = NativeStackScreenProps<AppStackParamList, 'Budget'>;

function formatEuros(amount: number): string {
  return `${amount.toFixed(2)} €`;
}

export default function BudgetScreen({ route, navigation }: Props) {
  const { householdId } = route.params;
  const [budget, setBudget] = useState<HouseholdBudget | null>(null);

  const load = useCallback(() => {
    return api
      .getHouseholdBudget(householdId)
      .then(setBudget)
      .catch((error) => {
        if (isPlanLimitError(error)) {
          navigation.replace('Paywall');
        } else {
          showLoadError(error);
        }
      });
  }, [householdId, navigation]);
  const { refreshing, trigger, onRefresh } = useRefreshable(load);

  useFocusEffect(trigger);

  return (
    <FlatList
      style={styles.container}
      contentContainerStyle={styles.content}
      data={budget?.byAnimal ?? []}
      keyExtractor={(item) => String(item.animalId)}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      ListHeaderComponent={
        <View style={styles.header}>
          <Text style={styles.title}>Budget</Text>
          <Text style={styles.totalLabel}>Total du foyer</Text>
          <Text style={styles.totalAmount}>{formatEuros(budget?.total ?? 0)}</Text>
          <Text style={styles.subtitle}>Par animal</Text>
        </View>
      }
      renderItem={({ item }) => (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{item.animalName}</Text>
          <Text style={styles.cardAmount}>{formatEuros(item.total)}</Text>
        </View>
      )}
      ListEmptyComponent={<Text style={styles.empty}>Aucune depense enregistree pour l'instant</Text>}
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16 },
  header: { marginBottom: 8 },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 16 },
  totalLabel: { color: '#8A7B68' },
  totalAmount: { fontSize: 32, fontWeight: 'bold', color: '#B8863B', marginBottom: 16 },
  subtitle: { fontSize: 16, fontWeight: '600', marginBottom: 8 },
  card: {
    backgroundColor: '#FAF6EF',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTitle: { fontSize: 16, fontWeight: '600' },
  cardAmount: { fontSize: 16, fontWeight: '700', color: '#B8863B' },
  empty: { color: '#8A7B68', textAlign: 'center', marginTop: 24 },
});
