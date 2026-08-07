import React, { useCallback, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AppStackParamList } from '../navigation/types';
import * as api from '../api/endpoints';
import type { HouseholdBudget } from '../types/api';
import Card from '../components/Card';
import ScreenHeader from '../components/ScreenHeader';
import { useRefreshable } from '../hooks/useRefreshable';
import { isPlanLimitError, showLoadError } from '../utils/errorHandling';
import { colors, spacing, typography } from '../theme/colors';

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
        <>
          <ScreenHeader title="Budget" />
          <Card style={styles.totalCard}>
            <Text style={styles.totalLabel}>Total du foyer</Text>
            <Text style={styles.totalAmount}>{formatEuros(budget?.total ?? 0)}</Text>
          </Card>
          <Text style={styles.subtitle}>Par animal</Text>
        </>
      }
      renderItem={({ item }) => (
        <TouchableOpacity
          onPress={() => navigation.navigate('AnimalBudget', { animalId: item.animalId, animalName: item.animalName })}
          activeOpacity={0.8}
        >
          <Card style={styles.card}>
            <Text style={styles.cardTitle}>{item.animalName}</Text>
            <Text style={styles.cardAmount}>{formatEuros(item.total)}</Text>
          </Card>
        </TouchableOpacity>
      )}
      ListEmptyComponent={<Text style={styles.empty}>Aucune depense enregistree pour l&apos;instant</Text>}
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: spacing.lg },
  totalCard: { alignItems: 'center', marginBottom: spacing.lg },
  totalLabel: { color: colors.textSecondary },
  totalAmount: { fontSize: 32, fontWeight: 'bold', color: colors.accent, marginTop: spacing.xs },
  subtitle: { ...typography.sectionTitle, fontSize: 16, marginBottom: spacing.sm },
  card: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardTitle: { fontSize: 16, fontWeight: '600' },
  cardAmount: { fontSize: 16, fontWeight: '700', color: colors.accent },
  empty: { color: colors.textSecondary, textAlign: 'center', marginTop: spacing.xl },
});
