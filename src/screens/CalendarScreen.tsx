import React, { useCallback, useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AppStackParamList } from '../navigation/types';
import * as api from '../api/endpoints';
import type { CalendarEntry } from '../types/api';
import { showLoadError } from '../utils/errorHandling';

type Props = NativeStackScreenProps<AppStackParamList, 'Calendar'>;

export default function CalendarScreen({ route }: Props) {
  const { householdId, householdName } = route.params;
  const [entries, setEntries] = useState<CalendarEntry[]>([]);

  useFocusEffect(
    useCallback(() => {
      api.listUpcomingReminders(householdId).then(setEntries).catch(showLoadError);
    }, [householdId]),
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={entries}
        keyExtractor={(item) => String(item.id)}
        ListHeaderComponent={<Text style={styles.title}>Calendrier — {householdName}</Text>}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>
              {item.animalName} — {item.customTypeLabel ?? item.type}
            </Text>
            <Text style={styles.cardSubtitle}>
              {item.nextReminderDate ? `Rappel le ${item.nextReminderDate}` : `Prevu le ${item.scheduledDate}`}
            </Text>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.empty}>Aucune echeance a venir</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 16 },
  card: { backgroundColor: '#f2f2f2', borderRadius: 8, padding: 16, marginBottom: 12 },
  cardTitle: { fontSize: 16, fontWeight: '600' },
  cardSubtitle: { color: '#666', marginTop: 4 },
  empty: { color: '#666', textAlign: 'center', marginTop: 24 },
});
