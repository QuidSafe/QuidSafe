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

export default function PrivacyPolicyScreen() {
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

        <Text style={[styles.title, { color: colors.text }]}>Privacy Policy</Text>
        <Text style={[styles.updated, { color: colors.textSecondary }]}>Last updated: April 2026</Text>

        <Section title="1. Introduction">
          <Paragraph>
            QuidSafe Ltd (registered in England and Wales) is the data controller responsible for your personal data. This privacy policy explains how we collect, use, store, and protect your information when you use the QuidSafe application and services.
          </Paragraph>
          <Paragraph>
            We are committed to protecting the privacy of our users and handling personal data in accordance with the UK General Data Protection Regulation (UK GDPR) and the Data Protection Act 2018.
          </Paragraph>
        </Section>

        <Section title="2. Data We Collect">
          <Paragraph>We collect the following categories of data:</Paragraph>
          <BulletList
            items={[
              'Personal information: your name and email address, provided during account registration',
              'Financial data: bank transactions, income records, and expense records obtained via Open Banking or entered manually',
              'Usage data: how you interact with the app, including pages visited, features used, and device information',
              'Tax data: calculated tax estimates, HMRC submission records, and tax year configurations',
              'Payment data: subscription status and billing history (payment details are handled by Stripe and never stored by us)',
            ]}
          />
        </Section>

        <Section title="3. How We Use Your Data">
          <Paragraph>Your data is used for the following purposes:</Paragraph>
          <BulletList
            items={[
              'Tax calculation: computing your estimated Income Tax and National Insurance contributions based on your income and expenses',
              'AI categorisation: automatically categorising your bank transactions into HMRC-recognised expense categories (all data is anonymised before processing)',
              'HMRC submission: preparing and submitting Making Tax Digital quarterly updates when you choose to do so',
              'Service improvement: understanding how users interact with QuidSafe to improve functionality and user experience',
              'Notifications: sending tax deadline reminders, weekly summaries, and other alerts you have opted into',
            ]}
          />
        </Section>

        <Section title="4. Legal Basis for Processing">
          <Paragraph>We process your personal data on the following legal grounds:</Paragraph>
          <BulletList
            items={[
              'Contractual necessity (GDPR Article 6(1)(b)): processing is necessary to provide the QuidSafe service you have signed up for',
              'Legitimate interest (GDPR Article 6(1)(f)): we have a legitimate interest in improving our services, preventing fraud, and ensuring security',
              'Consent (GDPR Article 6(1)(a)): where you have given explicit consent, such as opting in to marketing communications or connecting your bank account',
            ]}
          />
        </Section>

        <Section title="5. Open Banking Data">
          <Paragraph>
            QuidSafe connects to your bank account through TrueLayer, which is authorised and regulated by the Financial Conduct Authority (FCA) under the Payment Services Regulations 2017.
          </Paragraph>
          <BulletList
            items={[
              'We only request read-only access to your transaction data. We cannot move money, make payments, or modify your bank account in any way.',
              'We never store your bank login credentials. Authentication is handled entirely by your bank through the secure Open Banking protocol.',
              'Bank access tokens are encrypted using AES-256-GCM before storage and can only be decrypted by our server.',
              'You can disconnect your bank at any time via Settings, which immediately revokes our access.',
            ]}
          />
        </Section>

        <Section title="6. AI Processing">
          <Paragraph>
            QuidSafe uses AI (Anthropic Claude) to automatically categorise your transactions into HMRC expense categories. To protect your privacy:
          </Paragraph>
          <BulletList
            items={[
              'All personally identifiable information (PII) is stripped from transaction data before it is sent to the AI service',
              'Names, account numbers, sort codes, and other identifying details are removed by our anonymisation layer',
              'The AI only receives generic transaction descriptions and amounts',
              'No PII is ever sent to the Claude API',
              'AI processing results are stored only within your QuidSafe account',
            ]}
          />
        </Section>

        <Section title="7. Data Sharing">
          <Paragraph>
            We do not sell, rent, or trade your personal data to third parties. We only share data with the following service providers, strictly as necessary to operate QuidSafe:
          </Paragraph>
          <BulletList
            items={[
              'HMRC: only when you explicitly choose to submit a Making Tax Digital return',
              'Stripe: for processing subscription payments (Stripe handles payment card details; we never see or store your card number)',
              'TrueLayer: for Open Banking connectivity to retrieve your bank transactions',
              'Clerk: for secure authentication and account management',
              'Cloudflare: for hosting, content delivery, and infrastructure security',
            ]}
          />
          <Paragraph>
            We will never sell your data to advertisers, data brokers, or any other third party.
          </Paragraph>
        </Section>

        <Section title="8. Data Retention">
          <BulletList
            items={[
              'Active accounts: your data is retained for as long as your account is active and you maintain an active subscription',
              'Account deletion: when you delete your account, all personal data is permanently erased within 30 days',
              'Transaction data: retained for the duration of your account to support multi-year tax calculations',
              'HMRC submissions: retained for 7 years as required by HMRC record-keeping obligations',
              'Server logs: automatically deleted after 30 days',
            ]}
          />
        </Section>

        <Section title="9. Your Rights">
          <Paragraph>
            Under the UK GDPR, you have the following rights regarding your personal data:
          </Paragraph>
          <BulletList
            items={[
              'Right of access: request a copy of all personal data we hold about you',
              'Right to rectification: request correction of inaccurate or incomplete data',
              'Right to erasure: request deletion of your personal data ("right to be forgotten")',
              'Right to data portability: receive your data in a structured, machine-readable format',
              'Right to object: object to processing based on legitimate interest',
              'Right to restrict processing: request that we limit how we use your data',
              'Right to withdraw consent: withdraw consent at any time where processing is based on consent',
            ]}
          />
          <Paragraph>
            To exercise any of these rights, please contact us at the email address below. We will respond within one month as required by law.
          </Paragraph>
        </Section>

        <Section title="10. Data Export">
          <Paragraph>
            You can export your data at any time via Settings then Export Data. Exports are available in CSV format and include your transactions, expenses, invoices, and tax summaries. This supports your right to data portability.
          </Paragraph>
        </Section>

        <Section title="11. Account Deletion">
          <Paragraph>
            You can delete your account at any time via Settings then Delete Account. This will permanently remove all your personal data, transactions, expenses, invoices, and tax records within 30 days. This action cannot be undone.
          </Paragraph>
        </Section>

        <Section title="12. Security">
          <Paragraph>
            We take the security of your data seriously and implement the following measures:
          </Paragraph>
          <BulletList
            items={[
              'AES-256-GCM encryption for bank access tokens at rest',
              'TLS encryption for all data in transit',
              'Cloudflare infrastructure providing DDoS protection and edge security',
              'Clerk authentication with secure session management',
              'Parameterised database queries to prevent SQL injection',
              'No logging of personally identifiable information',
              'Regular security reviews of our codebase',
            ]}
          />
        </Section>

        <Section title="13. Contact Us">
          <Paragraph>
            For any data protection queries, to exercise your rights, or to make a complaint about how we handle your data, please contact us:
          </Paragraph>
          <Paragraph>
            Email: privacy@quidsafe.co.uk
          </Paragraph>
          <Paragraph>
            QuidSafe Ltd{'\n'}Data Protection Officer{'\n'}United Kingdom
          </Paragraph>
          <Paragraph>
            You also have the right to lodge a complaint with the Information Commissioner&apos;s Office (ICO) at ico.org.uk if you are not satisfied with how we handle your data.
          </Paragraph>
        </Section>

        <Section title="14. Changes to This Policy">
          <Paragraph>
            We may update this privacy policy from time to time to reflect changes in our practices or applicable law. When we make material changes, we will notify you via email or an in-app notification. We encourage you to review this policy periodically.
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
