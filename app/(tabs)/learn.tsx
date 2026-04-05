import { StyleSheet, View, Text, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card } from '@/components/ui/Card';
import { Colors, Spacing, BorderRadius } from '@/constants/Colors';

const articles = [
  {
    id: '1',
    title: 'Self Assessment: The Basics',
    summary: 'Everything you need to know about filing your first tax return as a sole trader.',
    tag: 'Getting Started',
  },
  {
    id: '2',
    title: 'What Expenses Can I Claim?',
    summary: 'A plain-English guide to HMRC-allowable business expenses for sole traders.',
    tag: 'Expenses',
  },
  {
    id: '3',
    title: 'Understanding National Insurance',
    summary: 'Class 2 vs Class 4 NI — what you pay and when.',
    tag: 'Tax',
  },
  {
    id: '4',
    title: 'Making Tax Digital (MTD)',
    summary: 'What MTD means for sole traders and how QuidSafe helps you comply.',
    tag: 'MTD',
  },
  {
    id: '5',
    title: 'Quarterly Updates Explained',
    summary: 'When to submit, what to include, and how to avoid penalties.',
    tag: 'Deadlines',
  },
];

export default function LearnScreen() {
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Learn</Text>
        <Text style={styles.subtitle}>Tax education in plain English</Text>

        {articles.map((article) => (
          <Pressable key={article.id}>
            <Card>
              <View style={styles.tagContainer}>
                <Text style={styles.tag}>{article.tag}</Text>
              </View>
              <Text style={styles.articleTitle}>{article.title}</Text>
              <Text style={styles.articleSummary}>{article.summary}</Text>
            </Card>
          </Pressable>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  scroll: {
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  title: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 28,
    color: Colors.light.text,
  },
  subtitle: {
    fontFamily: 'Manrope_400Regular',
    fontSize: 14,
    color: Colors.light.textSecondary,
    marginBottom: Spacing.sm,
  },
  tagContainer: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.light.background,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.pill,
    marginBottom: Spacing.sm,
  },
  tag: {
    fontFamily: 'Manrope_500Medium',
    fontSize: 11,
    color: Colors.primary,
  },
  articleTitle: {
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 16,
    color: Colors.light.text,
  },
  articleSummary: {
    fontFamily: 'Manrope_400Regular',
    fontSize: 14,
    color: Colors.light.textSecondary,
    marginTop: 4,
  },
});
