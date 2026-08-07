import React, { useCallback, useState } from 'react';
import { Alert, Linking, ScrollView, Share, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AppStackParamList } from '../navigation/types';
import * as api from '../api/endpoints';
import type { EmergencySheet, EmergencyShareLink } from '../types/api';
import LoadingScreen from '../components/LoadingScreen';
import { getProviderTypeLabel } from '../data/providerTypes';
import { showError, showLoadError } from '../utils/errorHandling';

type Props = NativeStackScreenProps<AppStackParamList, 'EmergencySheet'>;

function buildShareText(sheet: EmergencySheet): string {
  const { animal, medicalProfile, treatments, providers } = sheet;
  const lines: string[] = [];
  lines.push(`FICHE D'URGENCE — ${animal.name}`);
  lines.push(`${animal.species}${animal.breed ? ` — ${animal.breed}` : ''}`);
  if (animal.age) lines.push(`Age : ${animal.age.years} an(s) ${animal.age.months} mois`);
  if (animal.currentWeightKg != null) lines.push(`Poids : ${animal.currentWeightKg} kg`);
  if (animal.microchipNumber) lines.push(`Puce/tatouage : ${animal.microchipNumber}`);

  if (medicalProfile) {
    lines.push('');
    lines.push('--- Fiche medicale ---');
    if (medicalProfile.chronicConditions) lines.push(`Maladies chroniques : ${medicalProfile.chronicConditions}`);
    if (medicalProfile.allergies) lines.push(`Allergies : ${medicalProfile.allergies}`);
    if (medicalProfile.dietaryNeeds) lines.push(`Regime particulier : ${medicalProfile.dietaryNeeds}`);
    if (medicalProfile.behavioralNotes) lines.push(`Notes comportementales : ${medicalProfile.behavioralNotes}`);
    if (medicalProfile.bloodType) lines.push(`Groupe sanguin : ${medicalProfile.bloodType}`);
    if (medicalProfile.referringVetName) {
      lines.push(
        `Veto referent : ${medicalProfile.referringVetName}${medicalProfile.referringVetPhone ? ` — ${medicalProfile.referringVetPhone}` : ''}`,
      );
    }
    if (medicalProfile.insuranceProvider) lines.push(`Assurance : ${medicalProfile.insuranceProvider}`);
  }

  if (treatments.length > 0) {
    lines.push('');
    lines.push('--- Traitements en cours ---');
    treatments.forEach((t) => {
      lines.push(`${t.name}${t.dosage ? ` — ${t.dosage}` : ''}${t.frequency ? ` (${t.frequency})` : ''}`);
    });
  }

  if (providers.length > 0) {
    lines.push('');
    lines.push('--- Intervenants ---');
    providers.forEach((p) => {
      lines.push(`${getProviderTypeLabel(p.type)} : ${p.name}${p.phone ? ` — ${p.phone}` : ''}`);
    });
  }

  return lines.join('\n');
}

function formatDateTime(value: string): string {
  return new Date(value).toLocaleString('fr-FR');
}

export default function EmergencySheetScreen({ route }: Props) {
  const { animalId } = route.params;
  const [sheet, setSheet] = useState<EmergencySheet | null>(null);
  const [shareLinks, setShareLinks] = useState<EmergencyShareLink[]>([]);
  const [creatingLink, setCreatingLink] = useState(false);

  const load = useCallback(() => {
    api.getEmergencySheet(animalId).then(setSheet).catch(showLoadError);
    api.listEmergencyShareLinks(animalId).then(setShareLinks).catch(() => setShareLinks([]));
  }, [animalId]);

  useFocusEffect(load);

  const onShare = () => {
    if (!sheet) return;
    Share.share({ message: buildShareText(sheet) }).catch(() => undefined);
  };

  const onCreateShareLink = async () => {
    setCreatingLink(true);
    try {
      const link = await api.createEmergencyShareLink(animalId);
      const url = api.buildEmergencySharedUrl(link.token);
      setShareLinks((prev) => [link, ...prev]);
      await Share.share({
        message: `Fiche d'urgence de ${sheet?.animal.name ?? "l'animal"} (lien valable 72h) : ${url}`,
      });
    } catch (error) {
      showError(error);
    } finally {
      setCreatingLink(false);
    }
  };

  const onRevokeShareLink = (link: EmergencyShareLink) => {
    Alert.alert('Revoquer ce lien ?', 'La personne qui le detient ne pourra plus consulter la fiche.', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Revoquer',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.revokeEmergencyShareLink(animalId, link.id);
            setShareLinks((prev) => prev.filter((l) => l.id !== link.id));
          } catch (error) {
            showError(error);
          }
        },
      },
    ]);
  };

  if (!sheet) {
    return <LoadingScreen />;
  }

  const { animal, medicalProfile, treatments, providers } = sheet;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>{animal.name}</Text>
      <Text style={styles.subtitle}>
        {animal.species}
        {animal.breed ? ` — ${animal.breed}` : ''}
        {animal.age ? ` — ${animal.age.years} an(s) ${animal.age.months} mois` : ''}
      </Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Identite</Text>
        {animal.currentWeightKg != null && <Text style={styles.line}>Poids : {animal.currentWeightKg} kg</Text>}
        {animal.microchipNumber && <Text style={styles.line}>Puce / tatouage : {animal.microchipNumber}</Text>}
        {animal.color && <Text style={styles.line}>Robe / couleur : {animal.color}</Text>}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Fiche medicale</Text>
        {!medicalProfile && <Text style={styles.emptyHint}>Aucune information renseignee.</Text>}
        {medicalProfile?.chronicConditions && (
          <Text style={styles.line}>Maladies chroniques : {medicalProfile.chronicConditions}</Text>
        )}
        {medicalProfile?.allergies && <Text style={styles.line}>Allergies : {medicalProfile.allergies}</Text>}
        {medicalProfile?.dietaryNeeds && <Text style={styles.line}>Regime particulier : {medicalProfile.dietaryNeeds}</Text>}
        {medicalProfile?.behavioralNotes && (
          <Text style={styles.line}>Notes comportementales : {medicalProfile.behavioralNotes}</Text>
        )}
        {medicalProfile?.bloodType && <Text style={styles.line}>Groupe sanguin : {medicalProfile.bloodType}</Text>}
        {medicalProfile?.insuranceProvider && (
          <Text style={styles.line}>Assurance : {medicalProfile.insuranceProvider}</Text>
        )}
        {medicalProfile?.referringVetName && (
          <TouchableOpacity
            disabled={!medicalProfile.referringVetPhone}
            onPress={() => medicalProfile.referringVetPhone && Linking.openURL(`tel:${medicalProfile.referringVetPhone}`)}
          >
            <Text style={styles.line}>
              Veto referent : {medicalProfile.referringVetName}
              {medicalProfile.referringVetPhone ? ` — ${medicalProfile.referringVetPhone}` : ''}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Traitements en cours</Text>
        {treatments.length === 0 && <Text style={styles.emptyHint}>Aucun traitement en cours.</Text>}
        {treatments.map((t) => (
          <Text key={t.id} style={styles.line}>
            {t.name}
            {t.dosage ? ` — ${t.dosage}` : ''}
            {t.frequency ? ` (${t.frequency})` : ''}
          </Text>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Intervenants</Text>
        {providers.length === 0 && <Text style={styles.emptyHint}>Aucun intervenant associe.</Text>}
        {providers.map((p) => (
          <TouchableOpacity key={p.id} disabled={!p.phone} onPress={() => p.phone && Linking.openURL(`tel:${p.phone}`)}>
            <Text style={styles.line}>
              {getProviderTypeLabel(p.type)} : {p.name}
              {p.phone ? ` — ${p.phone}` : ''}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Partage temporaire (pet-sitter)</Text>
        <Text style={styles.emptyHint}>
          Genere un lien consultable sans compte, valable 72h, ouvrable dans n&apos;importe quel navigateur.
        </Text>
        {shareLinks.map((link) => (
          <View key={link.id} style={styles.shareLinkRow}>
            <Text style={styles.line}>Expire le {formatDateTime(link.expiresAt)}</Text>
            <TouchableOpacity onPress={() => onRevokeShareLink(link)}>
              <Text style={styles.revokeLink}>Revoquer</Text>
            </TouchableOpacity>
          </View>
        ))}
        <TouchableOpacity style={styles.shareButton} onPress={onCreateShareLink} disabled={creatingLink}>
          <Text style={styles.shareButtonText}>
            {creatingLink ? 'Generation...' : 'Generer un lien temporaire'}
          </Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.shareButton} onPress={onShare}>
        <Text style={styles.shareButtonText}>Partager la fiche d&apos;urgence</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, paddingBottom: 32 },
  title: { fontSize: 24, fontWeight: 'bold', textAlign: 'center' },
  subtitle: { color: '#8A7B68', textAlign: 'center', marginBottom: 16 },
  section: { backgroundColor: '#FAF6EF', borderRadius: 12, padding: 16, marginBottom: 12 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#3A3226', marginBottom: 8 },
  line: { color: '#3A3226', marginBottom: 4 },
  emptyHint: { color: '#8A7B68', marginBottom: 10 },
  shareLinkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderTopWidth: 1,
    borderTopColor: '#E3D8C4',
  },
  revokeLink: { color: '#B3452C', fontWeight: '600' },
  shareButton: { backgroundColor: '#B8863B', borderRadius: 8, padding: 14, marginTop: 8 },
  shareButtonText: { color: 'white', textAlign: 'center', fontWeight: '600' },
});
