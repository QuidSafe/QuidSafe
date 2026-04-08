import { Platform } from 'react-native';

const monoFamily = Platform.select({
  ios: 'SF Mono',
  android: 'JetBrains Mono',
  default: 'Menlo',
});

export const Fonts = {
  lexend: {
    semiBold: 'Lexend_600SemiBold',
    // Legacy aliases — screens still reference these; remove when migrated
    regular: 'Lexend_600SemiBold',
    medium: 'Lexend_600SemiBold',
    bold: 'Lexend_600SemiBold',
  },
  sourceSans: {
    regular: 'SourceSans3_400Regular',
    semiBold: 'SourceSans3_600SemiBold',
  },
  mono: {
    regular: monoFamily,
    semiBold: monoFamily,
  },
};

export default Fonts;
