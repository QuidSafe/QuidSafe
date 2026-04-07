import { StyleSheet, View, Text, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Colors, Spacing, BorderRadius } from '@/constants/Colors';
import { useTheme } from '@/lib/ThemeContext';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const { colors } = useTheme();
  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>{title}</Text>
      {children}
    </View>
  );
}

function Paragraph({ children }: { children: React.ReactNode }) {
  const { colors } = useTheme();
  return <Text style={[styles.body, { color: colors.textSecondary }]}>{children}</Text>;
}

function BulletList({ items }: { items: string[] }) {
  const { colors } = useTheme();
  return (
    <View style={styles.bulletList}>
      {items.map((item, i) => (
        <View key={i} style={styles.bulletRow}>
          <Text style={[styles.bullet, { color: colors.textSecondary }]}>{'\u2022'}</Text>
          <Text style={[styles.body, styles.bulletText, { color: colors.textSecondary }]}>{item}</Text>
        </View>
      ))}
    </View>
  );
}

export default function CookiePolicyScreen() {
  const { colors } = useTheme();
  const router = useRouter();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <FontAwesome name="chevron-left" size={14} color={colors.text} />
          <Text style={[styles.backText, { color: colors.text }]}>Back</Text>
        </Pressable>

        <Text style={[styles.title, { color: colors.text }]}>Cookie Policy</Text>
        <Text style={[styles.updated, { color: colors.textSecondary }]}>Last updated: April 2026</Text>

        <Section title="1. Overview">
          <Paragraph>
            QuidSafe uses essential cookies only. We do not use tracking cookies, advertising cookies, or third-party analytics cookies. This policy explains what cookies and local storage we use and why.
          </Paragraph>
        </Section>

        <Section title="2. What Are Cookies">
          <Paragraph>
            Cookies are small text files placed on your device when you visit a website. They help the site function correctly by remembering your session, preferences, and authentication state. Local storage is a similar browser technology that stores data locally on your device.
          </Paragraph>
        </Section>

        <Section title="3. Essential Cookies We Use">
          <Paragraph>
            QuidSafe uses a small number of strictly necessary cookies to keep the application working. These cannot be disabled without breaking core functionality.
          </Paragraph>
          <BulletList
            items={[
              'Clerk session token: authenticates your login session so you can access your account securely. This cookie is set by our authentication provider, Clerk, and expires when your session ends or after a set period of inactivity.',
              'CSRF protection token: prevents cross-site request forgery attacks by verifying that requests originate from the QuidSafe application. This is a security measure required for safe operation.',
              'Clerk device identifier: allows Clerk to recognise your device for multi-factor authentication and session management purposes.',
            ]}
          />
        </Section>

        <Section title="4. Local Storage">
          <Paragraph>
            In addition to cookies, QuidSafe uses your browser&apos;s local storage for the following purposes:
          </Paragraph>
          <BulletList
            items={[
              'Theme preference: stores whether you have selected light mode, dark mode, or system default, so your preference persists between visits',
              'Offline cache: temporarily stores data so parts of the app remain usable if your internet connection drops briefly',
            ]}
          />
        </Section>

        <Section title="5. Cookies We Do Not Use">
          <Paragraph>
            QuidSafe does not use any of the following:
          </Paragraph>
          <BulletList
            items={[
              'Tracking cookies: we do not track your browsing activity across other websites',
              'Advertising cookies: we do not serve adverts or share data with advertising networks',
              'Third-party analytics cookies: we do not use Google Analytics, Facebook Pixel, or any similar third-party analytics service',
              'Social media cookies: we do not embed social media trackers or share buttons that set cookies',
            ]}
          />
        </Section>

        <Section title="6. Managing Cookies">
          <Paragraph>
            You can clear cookies at any time through your browser settings. Most browsers allow you to block or delete cookies under their privacy or security settings. Please note that clearing essential cookies will sign you out of QuidSafe and you will need to log in again.
          </Paragraph>
          <Paragraph>
            To clear local storage, you can use your browser&apos;s developer tools or clear all site data through your browser&apos;s settings for quidsafe.pages.dev.
          </Paragraph>
        </Section>

        <Section title="7. Changes to This Policy">
          <Paragraph>
            If we ever change our approach to cookies, for example if we introduce optional analytics, we will update this policy and notify you in advance. Any non-essential cookies would require your explicit consent before being set.
          </Paragraph>
        </Section>

        <Section title="8. Contact Us">
          <Paragraph>
            If you have any questions about our use of cookies, please contact us:
          </Paragraph>
          <Paragraph>
            Email: privacy@quidsafe.co.uk
          </Paragraph>
          <Paragraph>
            QuidSafe Ltd{'\n'}United Kingdom
          </Paragraph>
        </Section>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxl,
    maxWidth: 680,
    width: '100%' as unknown as number,
    alignSelf: 'center' as const,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
    alignSelf: 'flex-start',
  },
  backText: {
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 14,
  },
  pressed: {
    opacity: 0.7,
  },
  title: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 24,
    lineHeight: 32,
    marginBottom: Spacing.xs,
  },
  updated: {
    fontFamily: 'Manrope_400Regular',
    fontSize: 13,
    marginBottom: Spacing.lg,
  },
  section: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 16,
    lineHeight: 24,
    marginBottom: Spacing.sm,
  },
  body: {
    fontFamily: 'Manrope_400Regular',
    fontSize: 14,
    lineHeight: 22,
    marginBottom: Spacing.sm,
  },
  bulletList: {
    marginBottom: Spacing.xs,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.xs,
    paddingLeft: Spacing.sm,
  },
  bullet: {
    fontFamily: 'Manrope_400Regular',
    fontSize: 14,
    lineHeight: 22,
    marginRight: Spacing.sm,
  },
  bulletText: {
    flex: 1,
    marginBottom: 0,
  },
});
