import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface Props {
  title: string;
  subtitle?: string;
  defaultOpen?: boolean;
  warning?: boolean;
  children: React.ReactNode;
}

/** Section repliable : le contenu n'est monte que quand elle est ouverte, pour ne pas surcharger l'ecran par defaut. */
export default function Accordion({ title, subtitle, defaultOpen = false, warning = false, children }: Props) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.header} onPress={() => setOpen((o) => !o)} activeOpacity={0.7}>
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
  container: { backgroundColor: '#EDE3D0', borderRadius: 8, marginBottom: 12, overflow: 'hidden' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  headerText: { flex: 1 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  title: { fontSize: 16, fontWeight: '600' },
  subtitle: { color: '#8A7B68', marginTop: 2, fontSize: 13 },
  chevron: { fontSize: 16, color: '#8A7B68', marginLeft: 12 },
  warningDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#d97706' },
  content: { paddingHorizontal: 16, paddingBottom: 16 },
});
