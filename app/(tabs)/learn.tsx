import { StyleSheet, View, Text, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';

type TagVariant = 'tag-n' | 'tag-ok' | 'tag-g';

interface Article {
  id: string;
  tag: string;
  tagVariant: TagVariant;
  title: string;
  description: string;
  readMin: number;
}

const articles: Article[] = [
  {
    id: '1',
    tag: 'MTD',
    tagVariant: 'tag-n',
    title: 'What is Making Tax Digital?',
    description: 'Quarterly updates instead of one January panic...',
    readMin: 3,
  },
  {
    id: '2',
    tag: 'TAX BASICS',
    tagVariant: 'tag-ok',
    title: 'How much tax do I actually owe?',
    description: 'Personal allowance, basic rate, NI...',
    readMin: 4,
  },
  {
    id: '3',
    tag: 'EXPENSES',
    tagVariant: 'tag-ok',
    title: 'What expenses can I claim?',
    description: 'Fuel, phone, home office...',
    readMin: 5,
  },
  {
    id: '4',
    tag: 'SECURITY',
    tagVariant: 'tag-g',
    title: 'Is connecting my bank safe?',
    description: 'FCA regulated, read-only, UK servers...',
    readMin: 2,
  },
  {
    id: '5',
    tag: 'DEADLINES',
    tagVariant: 'tag-n',
    title: 'Key dates you can\'t miss',
    description: 'Quarterly submissions, payment deadlines...',
    readMin: 2,
  },
  {
    id: '6',
    tag: 'VAT',
    tagVariant: 'tag-g',
    title: 'When do I need to register for VAT?',
    description: 'The £90k threshold, voluntary registration...',
    readMin: 3,
  },
];

const tagStyles: Record<TagVariant, { bg: string; color: string }> = {
  'tag-n': { bg: '#DBEAFE', color: '#1E3A8A' },
  'tag-ok': { bg: '#DCFCE7', color: '#16A34A' },
  'tag-g': { bg: '#FEF9C3', color: '#A16207' },
};

export default function LearnScreen() {
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.heading}>Learn</Text>
        <Text style={styles.subtitle}>
          Tax doesn&apos;t have to be scary. Quick reads to keep you confident.
        </Text>

        {articles.map((article) => {
          const variant = tagStyles[article.tagVariant];
          return (
            <View key={article.id} style={styles.card}>
              <View style={[styles.tagPill, { backgroundColor: variant.bg }]}>
                <Text style={[styles.tagText, { color: variant.color }]}>{article.tag}</Text>
              </View>
              <Text style={styles.cardTitle}>{article.title}</Text>
              <Text style={styles.cardDescription}>{article.description}</Text>
              <View style={styles.meta}>
                <FontAwesome name="clock-o" size={10.5} color={Colors.grey[400]} />
                <Text style={styles.metaText}>{article.readMin} min read</Text>
              </View>
            </View>
          );
        })}
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
    padding: 24,
    gap: 14,
  },
  heading: {
    fontSize: 19,
    fontWeight: '800',
    color: Colors.primary,
  },
  subtitle: {
    fontSize: 12,
    color: Colors.grey[500],
    marginBottom: 4,
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: Colors.light.border,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 2,
  },
  tagPill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 9999,
    marginBottom: 8,
  },
  tagText: {
    fontSize: 9.5,
    fontWeight: '700',
    letterSpacing: 0.05 * 9.5,
    textTransform: 'uppercase',
  },
  cardTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    color: Colors.primary,
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: 12,
    color: Colors.grey[500],
    lineHeight: 12 * 1.45,
    marginBottom: 8,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 10.5,
    fontWeight: '600',
    color: Colors.grey[400],
  },
});
