import React, { useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { usePremium } from '../subscriptions/PurchasesContext';
import { showError } from '../utils/errorHandling';
import type { AppStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<AppStackParamList, 'Paywall'>;

const BENEFITS = [
  'Foyers et animaux illimites',
  'Historique complet du carnet de sante',
  'Rappels J-7 / J-1 / jour J',
  'Gestion des documents (ordonnances, analyses...)',
];

export default function PaywallScreen({ navigation }: Props) {
  const { offering, isLoading, isAvailable, purchasePackage, restorePurchases } = usePremium();
  const [purchasing, setPurchasing] = useState<string | null>(null);

  const onPurchase = async (packageId: string) => {
    setPurchasing(packageId);
    try {
      await purchasePackage(packageId);
      navigation.goBack();
    } catch (error) {
      showError(error, 'Achat impossible');
    } finally {
      setPurchasing(null);
    }
  };

  const onRestore = async () => {
    try {
      await restorePurchases();
      navigation.goBack();
    } catch (error) {
      showError(error, 'Restauration impossible');
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Passe a l&apos;abonnement EikPet</Text>
      {BENEFITS.map((benefit) => (
        <Text key={benefit} style={styles.benefit}>
          - {benefit}
        </Text>
      ))}

      {!isAvailable ? (
        <Text style={styles.hint}>
          Les achats ne sont pas disponibles dans Expo Go. Installe un build EAS (development, preview ou production)
          pour tester l&apos;abonnement.
        </Text>
      ) : isLoading ? (
        <ActivityIndicator style={styles.loader} />
      ) : offering ? (
        offering.availablePackages.map((pkg) => (
          <TouchableOpacity
            key={pkg.identifier}
            style={styles.button}
            disabled={purchasing !== null}
            onPress={() => onPurchase(pkg.identifier)}
          >
            <Text style={styles.buttonText}>
              {purchasing === pkg.identifier ? 'Achat en cours...' : `${pkg.product.title} — ${pkg.product.priceString}`}
            </Text>
          </TouchableOpacity>
        ))
      ) : (
        <Text style={styles.hint}>Les offres ne sont pas disponibles pour le moment.</Text>
      )}

      {isAvailable && (
        <TouchableOpacity style={styles.restoreButton} onPress={onRestore}>
          <Text style={styles.restoreButtonText}>Restaurer mes achats</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20 },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 16 },
  benefit: { fontSize: 15, marginBottom: 8, color: '#4A4136' },
  loader: { marginTop: 24 },
  hint: { color: '#8A7B68', marginTop: 16 },
  button: { backgroundColor: '#B8863B', borderRadius: 8, padding: 14, marginTop: 16 },
  buttonText: { color: 'white', textAlign: 'center', fontWeight: '600' },
  restoreButton: { marginTop: 24, padding: 12 },
  restoreButtonText: { color: '#B8863B', textAlign: 'center', fontWeight: '600' },
});
