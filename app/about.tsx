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

export default function AboutScreen() {
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

        <Text style={[styles.title, { color: colors.text }]}>About QuidSafe</Text>

        <Section title="What We Do">
          <Paragraph>
            QuidSafe is a tax tracking application built specifically for UK sole traders. It connects to your bank account via Open Banking, automatically categorises your transactions using AI, and calculates exactly how much you need to set aside for Income Tax and National Insurance in real time.
          </Paragraph>
          <Paragraph>
            No spreadsheets, no guesswork, no nasty surprises when January rolls around.
          </Paragraph>
        </Section>

        <Section title="Our Mission">
          <Paragraph>
            There are 5.4 million sole traders in the UK. Most are skilled at what they do, whether that is plumbing, photography, consulting, or freelance design, but few enjoy the tax side of running a business. HMRC&apos;s Making Tax Digital programme is making quarterly reporting mandatory, and many sole traders are not prepared.
          </Paragraph>
          <Paragraph>
            QuidSafe exists to make tax simple. We believe every sole trader should be able to understand their tax position at a glance, without needing an accounting degree or an expensive bookkeeper.
          </Paragraph>
        </Section>

        <Section title="How It Works">
          <Paragraph>QuidSafe brings together three things to keep your tax sorted:</Paragraph>
          <BulletList
            items={[
              'Open Banking via TrueLayer: securely connects to your bank with read-only access, pulling in transactions automatically so you never have to enter them manually',
              'AI categorisation via Claude: analyses your transactions and assigns them to the correct HMRC expense categories, with all personal data stripped before processing',
              'Real-time tax calculation: applies current HMRC rates and thresholds to your income and allowable expenses, showing exactly what you owe and what to set aside',
            ]}
          />
          <Paragraph>
            You can also track invoices, submit Making Tax Digital quarterly updates directly to HMRC, and export your records at any time.
          </Paragraph>
        </Section>

        <Section title="Built in the UK">
          <Paragraph>
            QuidSafe is designed, built, and operated in the United Kingdom. We understand UK tax rules because we built this for UK sole traders from day one. Our calculations follow HMRC guidance for Income Tax, Class 2 and Class 4 National Insurance, and the Personal Allowance.
          </Paragraph>
        </Section>

        <Section title="Our Technology">
          <Paragraph>
            QuidSafe is built on modern, reliable infrastructure:
          </Paragraph>
          <BulletList
            items={[
              'Expo and React Native: a single codebase that runs on iOS, Android, and the web',
              'Cloudflare Workers and D1: our API and database run on Cloudflare\'s global edge network for fast, reliable performance',
              'TrueLayer: FCA-authorised Open Banking provider for secure bank connectivity',
              'Claude AI by Anthropic: powers our transaction categorisation with state-of-the-art language understanding',
              'Clerk: handles authentication and session management securely',
              'Stripe: processes subscription payments (we never see or store your card details)',
            ]}
          />
        </Section>

        <Section title="Privacy and Security">
          <Paragraph>
            This is a financial application and we treat security accordingly. Bank tokens are encrypted with AES-256-GCM at rest. All personal information is stripped from data before it reaches any AI service. We never sell your data. You can read the full details in our Privacy Policy.
          </Paragraph>
        </Section>

        <Section title="Contact Us">
          <Paragraph>
            We would love to hear from you, whether you have a question, feedback, or just want to say hello.
          </Paragraph>
          <Paragraph>
            General enquiries: hello@quidsafe.uk
          </Paragraph>
          <Paragraph>
            Privacy and data protection: privacy@quidsafe.uk
          </Paragraph>
          <Paragraph>
            Legal: legal@quidsafe.uk
          </Paragraph>
        </Section>

        <Section title="Company Information">
          <Paragraph>
            QuidSafe Ltd{'\n'}Registered in England and Wales{'\n'}United Kingdom
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
