import { Platform } from 'react-native';

// On web, expo-font names (e.g. 'Lexend_600SemiBold') may not resolve before
// the Google Fonts CSS link loads the same font under its canonical CSS name
// ('Lexend'). A comma-separated stack lets the browser try both.
const webFont = (expoName: string, cssName: string) =>
  Platform.OS === 'web' ? `${expoName}, ${cssName}` : expoName;

const monoFamily = Platform.select({
  ios: 'SF Mono',
  android: 'JetBrains Mono',
  default: "'JetBrains Mono', Menlo, monospace",
});

const lexendSemiBold = webFont('Lexend_600SemiBold', 'Lexend');
const sourceSansCss = "'Source Sans 3'";

export const Fonts = {
  lexend: {
    semiBold: lexendSemiBold,
    // Legacy aliases — screens still reference these; remove when migrated
    regular: lexendSemiBold,
    medium: lexendSemiBold,
    bold: lexendSemiBold,
  },
  sourceSans: {
    regular: webFont('SourceSans3_400Regular', sourceSansCss),
    semiBold: webFont('SourceSans3_600SemiBold', sourceSansCss),
  },
  mono: {
    regular: monoFamily,
    semiBold: monoFamily,
  },
};

export default Fonts;
