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

export const Fonts = {
  lexend: {
    semiBold: webFont('Lexend_600SemiBold', 'Lexend'),
    // Legacy aliases — screens still reference these; remove when migrated
    regular: webFont('Lexend_600SemiBold', 'Lexend'),
    medium: webFont('Lexend_600SemiBold', 'Lexend'),
    bold: webFont('Lexend_600SemiBold', 'Lexend'),
  },
  sourceSans: {
    regular: webFont('SourceSans3_400Regular', "'Source Sans 3'"),
    semiBold: webFont('SourceSans3_600SemiBold', "'Source Sans 3'"),
  },
  mono: {
    regular: monoFamily,
    semiBold: monoFamily,
  },
};

export default Fonts;
