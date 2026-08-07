import React, { useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import Card from '../components/Card';
import PrimaryButton from '../components/PrimaryButton';
import { usePremium } from '../subscriptions/PurchasesContext';
import { showError } from '../utils/errorHandling';
import type { AppStackParamList } from '../navigation/types';
import { colors, spacing, typography } from '../theme/colors';

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

      <Card>
        {BENEFITS.map((benefit) => (
          <Text key={benefit} style={styles.benefit}>
            ✓ {benefit}
          </Text>
        ))}
      </Card>

      {!isAvailable ? (
        <Text style={styles.hint}>
          Les achats ne sont pas disponibles dans Expo Go. Installe un build EAS (development, preview ou production)
          pour tester l&apos;abonnement.
        </Text>
      ) : isLoading ? (
        <ActivityIndicator style={styles.loader} color={colors.accent} />
      ) : offering ? (
        offering.availablePackages.map((pkg) => (
          <PrimaryButton
            key={pkg.identifier}
            title={
              purchasing === pkg.identifier ? 'Achat en cours...' : `${pkg.product.title} — ${pkg.product.priceString}`
            }
            onPress={() => onPurchase(pkg.identifier)}
            disabled={purchasing !== null}
            loading={purchasing === pkg.identifier}
            style={styles.packageButton}
          />
        ))
      ) : (
        <Text style={styles.hint}>Les offres ne sont pas disponibles pour le moment.</Text>
      )}

      {isAvailable && (
        <PrimaryButton title="Restaurer mes achats" onPress={onRestore} variant="outline" style={styles.restoreButton} />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.xl },
  title: { ...typography.screenTitle, marginBottom: spacing.lg },
  benefit: { fontSize: 15, marginBottom: spacing.sm, color: colors.textPrimary },
  loader: { marginTop: spacing.xl },
  hint: { color: colors.textSecondary, marginTop: spacing.lg },
  packageButton: { marginTop: spacing.lg },
  restoreButton: { marginTop: spacing.xl },
});
