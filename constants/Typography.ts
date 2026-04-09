import { Platform } from 'react-native';

// On web, expo-font names (e.g. 'Lexend_600SemiBold') may not resolve before
// the Google Fonts CSS link loads the same font under its canonical CSS name
// ('Lexend'). A comma-separated stack lets the browser try both.
const webFont = (expoName: string, cssName: string) =>
  Platform.OS === 'web' ? `${expoName}, ${cssName}` : expoName;

const monoFamily = Platform.select({
  ios: 'JetBrainsMono_400Regular',
  android: 'JetBrainsMono_400Regular',
  default: "'JetBrains Mono', JetBrainsMono_400Regular, Menlo, monospace",
});

const monoFamilySemiBold = Platform.select({
  ios: 'JetBrainsMono_600SemiBold',
  android: 'JetBrainsMono_600SemiBold',
  default: "'JetBrains Mono', JetBrainsMono_600SemiBold, Menlo, monospace",
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
    semiBold: monoFamilySemiBold,
  },
};

export default Fonts;
