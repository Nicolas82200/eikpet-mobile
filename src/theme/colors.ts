/** Palette beige/dore, epuree, partagee par tout l'app. */
export const colors = {
  background: '#FAF6EF',
  surface: '#FFFFFF',
  border: '#E3D8C4',
  divider: '#EDE3D0',
  /** Fond des champs de saisie : plus fonce que le fond de page pour bien les distinguer. */
  fieldBackground: '#EFE2C4',
  textPrimary: '#3A3226',
  textSecondary: '#8A7B68',
  textMuted: '#A79A85',
  accent: '#B8863B',
  accentLight: '#E3C68A',
  accentDark: '#8C6529',
  danger: '#B3452C',
  success: '#2E7D32',
} as const;

/** Echelle d'espacement commune (padding/margin/gap) : evite les valeurs magiques eparpillees. */
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  pill: 999,
} as const;

/** Echelle typographique commune (titres d'ecran, titres de section, corps, texte secondaire). */
export const typography = {
  screenTitle: { fontSize: 24, fontWeight: '700' as const, color: colors.textPrimary },
  sectionTitle: { fontSize: 16, fontWeight: '700' as const, color: colors.textPrimary },
  body: { fontSize: 15, color: colors.textPrimary },
  caption: { fontSize: 13, color: colors.textSecondary },
} as const;

/** Ombre douce commune aux cartes, pour une legere profondeur plutot qu'un aplat sans relief. */
export const cardShadow = {
  shadowColor: '#3A3226',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.06,
  shadowRadius: 6,
  elevation: 2,
} as const;
