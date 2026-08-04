import React, { useCallback, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AppStackParamList } from '../navigation/types';
import * as api from '../api/endpoints';
import type { HealthEntry } from '../types/api';
import { useRefreshable } from '../hooks/useRefreshable';
import { isPlanLimitError, showLoadError } from '../utils/errorHandling';

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
      ListHeaderComponent={<Text style={styles.title}>Comptes-rendus</Text>}
      renderItem={({ item }) => (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{item.customTypeLabel ?? item.type}</Text>
          <Text style={styles.cardDate}>{new Date(item.scheduledDate).toLocaleDateString('fr-FR')}</Text>
          <Text style={styles.cardReport}>{item.report}</Text>
        </View>
      )}
      ListEmptyComponent={<Text style={styles.empty}>Aucun compte-rendu pour l'instant</Text>}
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16 },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 16 },
  card: { backgroundColor: '#FAF6EF', borderRadius: 8, padding: 16, marginBottom: 12 },
  cardTitle: { fontSize: 16, fontWeight: '600', textTransform: 'capitalize' },
  cardDate: { color: '#8A7B68', marginTop: 2, marginBottom: 8 },
  cardReport: { color: '#3A3226' },
  empty: { color: '#8A7B68', textAlign: 'center', marginTop: 24 },
});
