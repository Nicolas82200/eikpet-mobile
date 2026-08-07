import React from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, type StyleProp, type ViewStyle } from 'react-native';
import { colors, radius, spacing } from '../theme/colors';

interface Props {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: 'primary' | 'danger' | 'outline' | 'dangerOutline';
  style?: StyleProp<ViewStyle>;
}

const OUTLINE_TEXT_COLOR: Partial<Record<NonNullable<Props['variant']>, string>> = {
  outline: colors.accent,
  dangerOutline: colors.danger,
};

/** Bouton d'action principal standard (ajouter/enregistrer/valider), pour eviter de redefinir le meme style dans chaque ecran. */
export default function PrimaryButton({ title, onPress, disabled, loading, variant = 'primary', style }: Props) {
  const isDisabled = disabled || loading;
  const outlineTextColor = OUTLINE_TEXT_COLOR[variant];
  return (
    <TouchableOpacity
      style={[styles.button, styles[variant], isDisabled && styles.disabled, style]}
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator color={outlineTextColor ?? 'white'} />
      ) : (
        <Text style={[styles.text, outlineTextColor && { color: outlineTextColor }]}>{title}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: radius.sm,
    paddingVertical: 14,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primary: { backgroundColor: colors.accent },
  danger: { backgroundColor: colors.danger },
  outline: { backgroundColor: 'transparent', borderWidth: 1, borderColor: colors.accent },
  dangerOutline: { backgroundColor: 'transparent', borderWidth: 1, borderColor: colors.danger },
  disabled: { opacity: 0.5 },
  text: { color: 'white', fontWeight: '600', fontSize: 15 },
});
