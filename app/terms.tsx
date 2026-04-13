import { StyleSheet, View, Text, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { colors, Colors, Spacing, BorderRadius } from '@/constants/Colors';
import { Fonts } from '@/constants/Typography';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>{title}</Text>
      {children}
    </View>
  );
}

function Paragraph({ children }: { children: React.ReactNode }) {
  return <Text style={[styles.body, { color: colors.textSecondary }]}>{children}</Text>;
}

function BulletList({ items }: { items: string[] }) {
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

export default function TermsOfServiceScreen() {
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
          <ChevronLeft size={14} color={colors.text} strokeWidth={1.5} />
          <Text style={[styles.backText, { color: colors.text }]}>Back</Text>
        </Pressable>

        <Text style={[styles.title, { color: colors.text }]}>Terms of Service</Text>
        <Text style={[styles.updated, { color: colors.textSecondary }]}>Last updated: April 2026</Text>

        <Paragraph>
          These Terms of Service (&quot;Terms&quot;) govern your use of the QuidSafe application and services provided by QuidSafe Ltd (&quot;we&quot;, &quot;us&quot;, &quot;our&quot;), a company registered in England and Wales. By creating an account or using QuidSafe, you agree to be bound by these Terms.
        </Paragraph>

        <Section title="1. Service Description">
          <Paragraph>
            QuidSafe is a tax tracking and estimation tool designed specifically for UK sole traders. The service allows you to connect your bank account via Open Banking, automatically categorise transactions, calculate estimated tax liabilities, track expenses and income, create invoices, and submit Making Tax Digital (MTD) quarterly updates to HMRC.
          </Paragraph>
        </Section>

        <Section title="2. Not Tax Advice">
          <Paragraph>
            QuidSafe provides tax estimates and calculations for informational purposes only. QuidSafe is not a tax adviser, accountant, or financial adviser. The information provided through our service does not constitute professional tax, financial, or legal advice.
          </Paragraph>
          <Paragraph>
            You should always consult a qualified accountant or tax professional for advice specific to your circumstances. Tax rules and HMRC guidance change frequently, and QuidSafe cannot guarantee that all changes are reflected immediately in our calculations.
          </Paragraph>
        </Section>

        <Section title="3. Accuracy Disclaimer">
          <Paragraph>
            Tax calculations provided by QuidSafe are estimates based on current HMRC tax rates, thresholds, and allowances for the relevant tax year. While we make every effort to ensure accuracy, we cannot guarantee that calculations will be error-free or perfectly match your final HMRC liability.
          </Paragraph>
          <Paragraph>
            Factors that may affect accuracy include but are not limited to: mid-year rate changes by HMRC, complex income scenarios, multiple sources of employment income, and transactions that have been incorrectly categorised.
          </Paragraph>
        </Section>

        <Section title="4. Account Responsibilities">
          <Paragraph>By using QuidSafe, you agree to:</Paragraph>
          <BulletList
            items={[
              'Provide accurate and truthful information when creating your account and entering financial data',
              'Keep your login credentials secure and not share them with any third party',
              'Notify us immediately if you suspect unauthorised access to your account',
              'Review and verify the accuracy of auto-categorised transactions before submitting any data to HMRC',
              'Maintain your own records as required by HMRC, and not rely solely on QuidSafe as your record-keeping system',
            ]}
          />
        </Section>

        <Section title="5. Subscription Terms">
          <Paragraph>
            QuidSafe offers a 14-day free trial followed by a Pro subscription plan with full access to all features.
          </Paragraph>
          <BulletList
            items={[
              'Pro plan: priced at £7.99 per month or £79.99 per year (all prices include VAT), includes unlimited bank accounts, AI auto-categorisation, MTD submissions, invoice tracking, data export, and priority support. VAT-registered sole traders may reclaim VAT on the subscription as a business expense.',
              'Free trial: all new users receive a 14-day free trial with full access to all Pro features. No credit card is required to start the trial.',
              'Billing: subscriptions are billed in advance on a recurring monthly or annual basis via Stripe',
              'Cancellation: you may cancel your subscription at any time via Settings. Your Pro features will remain active until the end of the current billing period. No refunds are given for partial periods.',
              'Price changes: we reserve the right to change pricing with 30 days advance notice. Existing subscribers will be notified before any price change takes effect.',
            ]}
          />
        </Section>

        <Section title="6. Acceptable Use">
          <Paragraph>You agree not to:</Paragraph>
          <BulletList
            items={[
              'Enter fraudulent, misleading, or intentionally inaccurate financial data',
              'Use QuidSafe to facilitate tax evasion or any other illegal activity',
              'Attempt to reverse engineer, decompile, or disassemble any part of the QuidSafe application',
              'Access or attempt to access other users\' accounts or data',
              'Use automated tools, bots, or scripts to interact with the service without our prior written consent',
              'Interfere with or disrupt the integrity or performance of the service',
              'Resell, sublicence, or redistribute access to QuidSafe',
            ]}
          />
        </Section>

        <Section title="7. Intellectual Property">
          <Paragraph>
            All content, features, and functionality of QuidSafe (including but not limited to software, text, graphics, logos, and design) are owned by QuidSafe Ltd and are protected by United Kingdom and international copyright, trademark, and other intellectual property laws.
          </Paragraph>
          <Paragraph>
            Your data remains your own. We do not claim ownership of any financial data, transactions, or documents you upload or generate through the service.
          </Paragraph>
        </Section>

        <Section title="8. Limitation of Liability">
          <Paragraph>
            To the maximum extent permitted by applicable law:
          </Paragraph>
          <BulletList
            items={[
              'QuidSafe Ltd shall not be liable for any incorrect tax estimates, calculations, or categorisations',
              'We are not liable for any penalties, interest, or fines imposed by HMRC as a result of using our service',
              'We are not liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of the service',
              'Our total aggregate liability for any claims arising from or related to these Terms shall not exceed the amount you have paid us in the twelve months preceding the claim',
              'We are not liable for any loss of data resulting from circumstances beyond our reasonable control',
            ]}
          />
          <Paragraph>
            Nothing in these Terms excludes or limits our liability for death or personal injury caused by our negligence, fraud or fraudulent misrepresentation, or any other liability that cannot be excluded by law.
          </Paragraph>
        </Section>

        <Section title="9. Service Availability">
          <Paragraph>
            We aim to provide a reliable service but do not guarantee uninterrupted availability. The service may be temporarily unavailable due to maintenance, updates, or circumstances beyond our control. We will endeavour to provide advance notice of planned downtime where possible.
          </Paragraph>
        </Section>

        <Section title="10. Termination">
          <Paragraph>
            We reserve the right to suspend or terminate your account if you violate these Terms or engage in any activity that is harmful to the service or other users. You may delete your account at any time via Settings. Upon termination, your data will be handled in accordance with our Privacy Policy.
          </Paragraph>
        </Section>

        <Section title="11. Governing Law">
          <Paragraph>
            These Terms are governed by and construed in accordance with the laws of England and Wales. Any disputes arising from or in connection with these Terms shall be subject to the exclusive jurisdiction of the courts of England and Wales.
          </Paragraph>
        </Section>

        <Section title="12. Changes to These Terms">
          <Paragraph>
            We reserve the right to modify these Terms at any time. When we make material changes, we will notify you via email or an in-app notification at least 30 days before the changes take effect. Your continued use of QuidSafe after the effective date constitutes acceptance of the revised Terms.
          </Paragraph>
        </Section>

        <Section title="13. Contact Information">
          <Paragraph>
            If you have any questions about these Terms, please contact us:
          </Paragraph>
          <Paragraph>
            Email: legal@quidsafe.uk
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
    fontFamily: Fonts.sourceSans.semiBold,
    fontSize: 14,
  },
  pressed: {
    opacity: 0.7,
  },
  title: {
    fontFamily: Fonts.lexend.semiBold,
    fontSize: 24,
    lineHeight: 32,
    marginBottom: Spacing.xs,
  },
  updated: {
    fontFamily: Fonts.sourceSans.regular,
    fontSize: 13,
    marginBottom: Spacing.lg,
  },
  section: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontFamily: Fonts.lexend.semiBold,
    fontSize: 16,
    lineHeight: 24,
    marginBottom: Spacing.sm,
  },
  body: {
    fontFamily: Fonts.sourceSans.regular,
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
    fontFamily: Fonts.sourceSans.regular,
    fontSize: 14,
    lineHeight: 22,
    marginRight: Spacing.sm,
  },
  bulletText: {
    flex: 1,
    marginBottom: 0,
  },
});
