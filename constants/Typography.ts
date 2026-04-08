// QuidSafe Typography — Manrope (body) + Playfair Display (display)
export const Fonts = {
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
  // Display headings (PlayfairDisplay)
  h1Large: {
    fontFamily: Fonts.playfair.bold,
    fontSize: 48,
    lineHeight: 56,
  },
  h1: {
    fontFamily: Fonts.playfair.bold,
    fontSize: 32,
    lineHeight: 40,
  },
  h2: {
    fontFamily: Fonts.playfair.bold,
    fontSize: 24,
    lineHeight: 32,
  },
  // Stat / big number display
  stat: {
    fontFamily: Fonts.playfair.bold,
    fontSize: 40,
    lineHeight: 44,
  },

  // UI headings and body (Manrope)
  h3: {
    fontFamily: Fonts.manrope.bold,
    fontSize: 20,
    lineHeight: 28,
  },
  subtitle: {
    fontFamily: Fonts.manrope.semiBold,
    fontSize: 16,
    lineHeight: 24,
  },
  body: {
    fontFamily: Fonts.manrope.regular,
    fontSize: 16,
    lineHeight: 24,
  },
  bodyLarge: {
    fontFamily: Fonts.manrope.regular,
    fontSize: 18,
    lineHeight: 28,
  },
  bodySmall: {
    fontFamily: Fonts.manrope.regular,
    fontSize: 14,
    lineHeight: 20,
  },
  caption: {
    fontFamily: Fonts.manrope.medium,
    fontSize: 12,
    lineHeight: 16,
  },
  // Uppercase labels (SET ASIDE FOR TAX, etc.)
  label: {
    fontFamily: Fonts.manrope.bold,
    fontSize: 10,
    lineHeight: 14,
    letterSpacing: 1.5,
  },
  button: {
    fontFamily: Fonts.manrope.semiBold,
    fontSize: 16,
    lineHeight: 24,
  },
  tabLabel: {
    fontFamily: Fonts.manrope.medium,
    fontSize: 10,
    lineHeight: 14,
  },
};

export default Typography;
