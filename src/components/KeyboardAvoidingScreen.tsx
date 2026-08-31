import React from 'react';
import { StyleProp, StyleSheet, ViewStyle } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';

/**
 * Evite que le clavier ne recouvre les champs de saisie places en bas de l'ecran
 * (formulaires sous une liste : foyers, animaux, carnet de sante...).
 *
 * Sur Android, la fenetre est deja redimensionnee automatiquement par l'OS quand le
 * clavier s'ouvre (windowSoftInputMode "resize", cf. app.json > android) : ce
 * redimensionnement seul ne scrolle pas jusqu'au champ actif, donc un champ bas d'ecran
 * reste caché sans moyen de scroller pour le voir. KeyboardAwareScrollView ecoute le
 * focus des champs et scrolle la vue jusqu'à eux, en plus de gerer le "padding" iOS.
 */
export default function KeyboardAvoidingScreen({
  children,
  contentContainerStyle,
}: {
  children: React.ReactNode;
  contentContainerStyle?: StyleProp<ViewStyle>;
}) {
  return (
    <KeyboardAwareScrollView
      style={styles.flex}
      contentContainerStyle={contentContainerStyle}
      keyboardShouldPersistTaps="handled"
      enableOnAndroid
      enableAutomaticScroll
      extraScrollHeight={20}
    >
      {children}
    </KeyboardAwareScrollView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
});
