import React, { useCallback, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AppStackParamList } from '../navigation/types';
import * as api from '../api/endpoints';
import type { HealthEntry } from '../types/api';
import Card from '../components/Card';
import ScreenHeader from '../components/ScreenHeader';
import { useRefreshable } from '../hooks/useRefreshable';
import { isPlanLimitError, showLoadError } from '../utils/errorHandling';
import { colors, spacing, typography } from '../theme/colors';

type Props = NativeStackScreenProps<AppStackParamList, 'Reports'>;

export default function ReportsScreen({ route, navigation }: Props) {
  const { animalId } = route.params;
  const [reports, setReports] = useState<HealthEntry[]>([]);

  const load = useCallback(() => {
    return api
      .listReports(animalId)
      .then(setReports)
      .catch((error) => {
        if (isPlanLimitError(error)) {
          navigation.replace('Paywall');
        } else {
          showLoadError(error);
        }
      });
  }, [animalId, navigation]);
  const { refreshing, trigger, onRefresh } = useRefreshable(load);

  useFocusEffect(trigger);

  return (
    <FlatList
      style={styles.container}
      contentContainerStyle={styles.content}
      data={reports}
      keyExtractor={(item) => String(item.id)}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      ListHeaderComponent={<ScreenHeader title="Comptes-rendus" />}
      renderItem={({ item }) => (
        <Card>
          <Text style={styles.cardTitle}>{item.customTypeLabel ?? item.type}</Text>
          <Text style={styles.cardDate}>{new Date(item.scheduledDate).toLocaleDateString('fr-FR')}</Text>
          <Text style={styles.cardReport}>{item.report}</Text>
        </Card>
      )}
      ListEmptyComponent={<Text style={styles.empty}>Aucun compte-rendu pour l&apos;instant</Text>}
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: spacing.lg },
  cardTitle: { ...typography.sectionTitle, fontSize: 16, textTransform: 'capitalize' },
  cardDate: { color: colors.textSecondary, marginTop: 2, marginBottom: spacing.sm },
  cardReport: { color: colors.textPrimary },
  empty: { color: colors.textSecondary, textAlign: 'center', marginTop: spacing.xl },
});
