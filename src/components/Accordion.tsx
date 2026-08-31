import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors, radius, spacing } from '../theme/colors';

interface Props {
  title: string;
  subtitle?: string;
  defaultOpen?: boolean;
  warning?: boolean;
  children: React.ReactNode;
  /** Mode controle (optionnel) : quand fourni avec onToggle, remplace l'etat interne. Permet a un
   * parent de forcer un seul accordion ouvert a la fois parmi plusieurs instances. */
  open?: boolean;
  onToggle?: () => void;
}

/** Section repliable : le contenu n'est monte que quand elle est ouverte, pour ne pas surcharger l'ecran par defaut. */
export default function Accordion({ title, subtitle, defaultOpen = false, warning = false, children, open: controlledOpen, onToggle }: Props) {
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const isControlled = controlledOpen !== undefined && onToggle !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const handlePress = isControlled ? onToggle : () => setInternalOpen((o) => !o);

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.header} onPress={handlePress} activeOpacity={0.7}>
        <View style={styles.headerText}>
          <View style={styles.titleRow}>
            {warning && <View style={styles.warningDot} />}
            <Text style={styles.title}>{title}</Text>
          </View>
          {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
        </View>
        <Text style={styles.chevron}>{open ? '▾' : '▸'}</Text>
      </TouchableOpacity>
      {open && <View style={styles.content}>{children}</View>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: colors.divider, borderRadius: radius.sm, marginBottom: spacing.md, overflow: 'hidden' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.lg,
  },
  headerText: { flex: 1 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  title: { fontSize: 16, fontWeight: '600' },
  subtitle: { color: colors.textSecondary, marginTop: 2, fontSize: 13 },
  chevron: { fontSize: 16, color: colors.textSecondary, marginLeft: spacing.md },
  warningDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#d97706' },
  content: { paddingHorizontal: spacing.lg, paddingBottom: spacing.lg },
});
