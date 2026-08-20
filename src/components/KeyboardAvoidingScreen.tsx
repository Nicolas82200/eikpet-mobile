import React from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';

/**
 * Evite que le clavier ne recouvre les champs de saisie places en bas de l'ecran
 * (formulaires sous une liste : foyers, animaux, carnet de sante...).
 *
 * Sur Android, la fenetre est deja redimensionnee automatiquement par l'OS quand le
 * clavier s'ouvre (windowSoftInputMode "resize", cf. app.json > android). Appliquer en
 * plus un `behavior` ici double la compensation et fait remonter le contenu hors ecran.
 */
export default function KeyboardAvoidingScreen({ children }: { children: React.ReactNode }) {
  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      {children}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
});
