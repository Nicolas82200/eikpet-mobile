import React from 'react';
import { StyleProp, StyleSheet, ViewStyle } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';

/**
 * Evite que le clavier ne recouvre le champ en cours de saisie. Composant natif (pas de
 * bricolage JS/mesures manuelles) : comportement identique aux autres apps sur iOS et Android.
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
      bottomOffset={20}
    >
      {children}
    </KeyboardAwareScrollView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
});
