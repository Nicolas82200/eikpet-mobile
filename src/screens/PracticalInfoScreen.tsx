import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import Card from '../components/Card';
import { colors, spacing, typography } from '../theme/colors';

interface Section {
  title: string;
  items: string[];
}

const SECTIONS: Section[] = [
  {
    title: '✈️ Voyager a l’etranger avec son animal',
    items: [
      'Identification par puce electronique obligatoire (le tatouage seul ne suffit plus depuis 2011).',
      'Vaccin antirabique (rage) obligatoire, valable a partir de 21 jours pleins apres l’injection si l’animal n’etait pas deja a jour — prevois large avant le depart.',
      'Le vaccin contre la rage est valable de 1 a 3 ans selon le vaccin utilise : verifie la date de rappel avant de reserver un voyage.',
      'Passeport europeen pour animal de compagnie obligatoire (delivre par un veterinaire), a jour et rempli.',
      'Age minimum de vaccination antirabique : 12 semaines.',
    ],
  },
  {
    title: '🐶🐱 Vaccins essentiels chien et chat',
    items: [
      'Aucun vaccin n’est legalement obligatoire en France pour chien/chat, hors cas particuliers (voyage, certaines pensions/expositions qui l’exigent).',
      'Chien : le vaccin "pentavalent" CHPPi+L (maladie de Carre, hepatite, parvovirose, parainfluenza, leptospirose) constitue le socle recommande.',
      'Chat : vaccin TCL (typhus, coryza, leucose feline).',
      'Primo-vaccination des le sevrage (8 semaines environ), en plusieurs injections espacees, puis rappel a 1 an et rappel annuel ensuite.',
    ],
  },
  {
    title: '🐎 Vaccination cheval',
    items: [
      'Grippe equine et tetanos : vaccins exiges pour participer aux competitions FFE (amateur et pro).',
      'Primo-vaccination grippe : 2 injections espacees de 21 a 92 jours, puis une 3e injection 5 a 6 mois apres la 2e.',
      'Rappel annuel obligatoire pour rester a jour en competition (dans les 365 jours precedant l’epreuve).',
      'Aucune injection ne doit etre faite dans les 7 jours precedant une competition.',
      'Depuis 2026, la vaccination contre la rhinopneumonie est egalement exigee en competition amateur FFE (deja en vigueur pour les pros depuis 2024).',
    ],
  },
  {
    title: '💡 Bon a savoir',
    items: [
      'Garde une copie (photo ou scan) du carnet de vaccination et du passeport dans l’app, utile en cas de perte de l’original.',
      'Vermifugation : generalement tous les 3 mois pour un adulte, plus frequente pour un jeune animal — demande le protocole exact a ton veterinaire selon le mode de vie de l’animal.',
      'En cas de doute, ces informations sont generales : verifie toujours les regles a jour aupres de ton veterinaire ou de la federation concernee avant un voyage ou une competition.',
    ],
  },
];

export default function PracticalInfoScreen() {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Informations pratiques</Text>
      <Text style={styles.intro}>
        Quelques reperes utiles sur la vaccination et les voyages avec ton animal. Ces informations sont generales
        et evoluent : confirme toujours avec ton veterinaire avant une decision importante.
      </Text>
      {SECTIONS.map((section) => (
        <Card key={section.title}>
          <Text style={styles.sectionTitle}>{section.title}</Text>
          {section.items.map((item) => (
            <View key={item} style={styles.itemRow}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.itemText}>{item}</Text>
            </View>
          ))}
        </Card>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.lg, paddingBottom: spacing.xxl },
  title: { ...typography.screenTitle, fontSize: 22, marginBottom: spacing.sm },
  intro: { color: colors.textSecondary, marginBottom: spacing.xl },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: spacing.md, color: colors.textPrimary },
  itemRow: { flexDirection: 'row', marginBottom: spacing.sm },
  bullet: { color: colors.accent, marginRight: spacing.sm, fontWeight: '700' },
  itemText: { flex: 1, color: colors.textPrimary },
});
