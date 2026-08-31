import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { spacing, typography } from '../theme/colors';

interface Props {
  title: string;
  action?: React.ReactNode;
}

/** En-tete standard des ecrans de liste : titre + action optionnelle (bouton d'ajout) alignes. */
export default function ScreenHeader({ title, action }: Props) {
  return (
    <View style={styles.row}>
      <Text style={styles.title} numberOfLines={1}>
        {title}
      </Text>
      {action}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
    gap: spacing.md,
  },
  title: { ...typography.screenTitle, flexShrink: 1 },
});
