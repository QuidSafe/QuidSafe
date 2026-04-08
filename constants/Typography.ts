// QuidSafe Typography — Lexend (headings) + Source Sans 3 (body)
// Legacy Manrope + Playfair Display still available for gradual migration
export const Fonts = {
  // New design system fonts
  lexend: {
    regular: 'Lexend_400Regular',
    medium: 'Lexend_500Medium',
    semiBold: 'Lexend_600SemiBold',
    bold: 'Lexend_700Bold',
  },
  sourceSans: {
    regular: 'SourceSans3_400Regular',
    semiBold: 'SourceSans3_600SemiBold',
  },
  // Legacy fonts (still loaded, used across existing screens)
  manrope: {
    regular: 'Manrope_400Regular',
    medium: 'Manrope_500Medium',
    semiBold: 'Manrope_600SemiBold',
    bold: 'Manrope_700Bold',
    extraBold: 'Manrope_800ExtraBold',
  },
  playfair: {
    regular: 'PlayfairDisplay_400Regular',
    bold: 'PlayfairDisplay_700Bold',
  },
};

export const Typography = {
  // Display headings (Lexend 600)
  h1Large: {
    fontFamily: Fonts.lexend.semiBold,
    fontSize: 48,
    lineHeight: 56,
  },
  h1: {
    fontFamily: Fonts.lexend.semiBold,
    fontSize: 32,
    lineHeight: 40,
  },
  h2: {
    fontFamily: Fonts.lexend.semiBold,
    fontSize: 24,
    lineHeight: 32,
  },
  stat: {
    fontFamily: Fonts.lexend.bold,
    fontSize: 40,
    lineHeight: 44,
  },

  // UI headings and body (Source Sans 3)
  h3: {
    fontFamily: Fonts.lexend.semiBold,
    fontSize: 20,
    lineHeight: 28,
  },
  subtitle: {
    fontFamily: Fonts.sourceSans.semiBold,
    fontSize: 16,
    lineHeight: 24,
  },
  body: {
    fontFamily: Fonts.sourceSans.regular,
    fontSize: 16,
    lineHeight: 24,
  },
  bodyLarge: {
    fontFamily: Fonts.sourceSans.regular,
    fontSize: 18,
    lineHeight: 28,
  },
  bodySmall: {
    fontFamily: Fonts.sourceSans.regular,
    fontSize: 14,
    lineHeight: 20,
  },
  caption: {
    fontFamily: Fonts.sourceSans.regular,
    fontSize: 12,
    lineHeight: 16,
  },
  label: {
    fontFamily: Fonts.lexend.semiBold,
    fontSize: 10,
    lineHeight: 14,
    letterSpacing: 1.5,
  },
  button: {
    fontFamily: Fonts.sourceSans.semiBold,
    fontSize: 16,
    lineHeight: 24,
  },
  tabLabel: {
    fontFamily: Fonts.sourceSans.regular,
    fontSize: 10,
    lineHeight: 14,
  },
};

export default Typography;
