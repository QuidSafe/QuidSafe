import { useState, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  Linking,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome } from '@expo/vector-icons';
import { Colors, Shadows, BorderRadius } from '@/constants/Colors';
import { useTheme } from '@/lib/ThemeContext';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

type TagVariant = 'tag-n' | 'tag-ok' | 'tag-g';

interface Article {
  id: string;
  tag: string;
  tagVariant: TagVariant;
  title: string;
  description: string;
  content: string;
  readMin: number;
  url?: string;
}

const articles: Article[] = [
  {
    id: '1',
    tag: 'MTD',
    tagVariant: 'tag-n',
    title: 'What is Making Tax Digital?',
    description: 'Quarterly updates instead of one January panic...',
    content:
      'Making Tax Digital (MTD) for Income Tax requires sole traders earning over £50,000 to keep digital records and submit quarterly updates to HMRC using compatible software. From April 2026, this threshold drops to £30,000. QuidSafe automatically tracks your income and expenses so you are MTD-ready from day one.',
    readMin: 3,
    url: 'https://www.gov.uk/guidance/find-software-thats-compatible-with-making-tax-digital-for-income-tax',
  },
  {
    id: '2',
    tag: 'TAX BASICS',
    tagVariant: 'tag-ok',
    title: 'How much tax do I actually owe?',
    description: 'Personal allowance, basic rate, NI...',
    content:
      'As a sole trader you pay Income Tax on profits above the £12,570 Personal Allowance. The basic rate is 20% on earnings from £12,571 to £50,270, then 40% up to £125,140. You also pay Class 2 and Class 4 National Insurance. QuidSafe calculates your estimated liability in real time so there are no surprises.',
    readMin: 4,
    url: 'https://www.gov.uk/income-tax-rates',
  },
  {
    id: '3',
    tag: 'EXPENSES',
    tagVariant: 'tag-ok',
    title: 'What expenses can I claim?',
    description: 'Fuel, phone, home office...',
    content:
      'You can claim allowable expenses that are wholly and exclusively for your business. Common claims include office supplies, travel costs, phone bills (business portion), professional subscriptions, and use-of-home. Keep receipts and records for at least five years in case HMRC enquires.',
    readMin: 5,
    url: 'https://www.gov.uk/expenses-if-youre-self-employed',
  },
  {
    id: '4',
    tag: 'SECURITY',
    tagVariant: 'tag-g',
    title: 'Is connecting my bank safe?',
    description: 'FCA regulated, read-only, UK servers...',
    content:
      'QuidSafe uses TrueLayer, an FCA-authorised Open Banking provider. The connection is read-only, meaning no one can move money from your account. Your credentials are never shared with us, and all data is encrypted at rest using AES-256-GCM on UK-based servers.',
    readMin: 2,
    url: 'https://www.fca.org.uk/consumers/open-banking',
  },
  {
    id: '5',
    tag: 'DEADLINES',
    tagVariant: 'tag-n',
    title: 'Key dates you can\'t miss',
    description: 'Quarterly submissions, payment deadlines...',
    content:
      'The Self Assessment tax return deadline is 31 January for online filing. Payments on account are due 31 January and 31 July. Under MTD, quarterly updates are due on the 5th of August, November, February, and May. Missing deadlines triggers automatic penalties starting at £100.',
    readMin: 2,
    url: 'https://www.gov.uk/self-assessment-tax-returns/deadlines',
  },
  {
    id: '6',
    tag: 'VAT',
    tagVariant: 'tag-g',
    title: 'When do I need to register for VAT?',
    description: 'The £90k threshold, voluntary registration...',
    content:
      'You must register for VAT if your taxable turnover exceeds £90,000 in a rolling 12-month period, or you expect to exceed it in the next 30 days alone. Voluntary registration below the threshold can be worthwhile if most of your customers are VAT-registered businesses, as you can reclaim VAT on purchases.',
    readMin: 3,
    url: 'https://www.gov.uk/vat-registration/when-to-register',
  },
];

const ALL_TAGS = ['All', 'MTD', 'Tax Basics', 'Expenses', 'Security', 'Deadlines', 'VAT'] as const;

function getTagColors(variant: TagVariant, isDark: boolean): { bg: string; color: string } {
  if (isDark) {
    switch (variant) {
      case 'tag-n': return { bg: Colors.secondary + '30', color: '#93B5FF' };
      case 'tag-ok': return { bg: Colors.success + '20', color: '#4ADE80' };
      case 'tag-g': return { bg: Colors.accent + '25', color: Colors.gold[50] };
    }
  }
  switch (variant) {
    case 'tag-n': return { bg: Colors.secondary + '15', color: Colors.secondary };
    case 'tag-ok': return { bg: Colors.success + '15', color: Colors.success };
    case 'tag-g': return { bg: Colors.gold[50], color: Colors.gold[700] };
  }
}

export default function LearnScreen() {
  const { colors, isDark } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTag, setActiveTag] = useState<string>('All');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filteredArticles = articles.filter((article) => {
    const matchesTag =
      activeTag === 'All' || article.tag.toLowerCase() === activeTag.toLowerCase();
    const query = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !query ||
      article.title.toLowerCase().includes(query) ||
      article.tag.toLowerCase().includes(query) ||
      article.description.toLowerCase().includes(query);
    return matchesTag && matchesSearch;
  });

  const handleToggleExpand = useCallback(
    (id: string) => {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setExpandedId((prev) => (prev === id ? null : id));
    },
    [],
  );

  const handleTagPress = useCallback((tag: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setActiveTag(tag);
  }, []);

  const handleOpenUrl = useCallback((url: string) => {
    Linking.openURL(url);
  }, []);

  const expandedContentBg = isDark ? 'rgba(255,255,255,0.03)' : Colors.grey[50];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={[styles.heading, { color: colors.text }]}>Learn</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Tax doesn&apos;t have to be scary. Quick reads to keep you confident.
        </Text>

        {/* Search bar */}
        <View style={[styles.searchContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <FontAwesome name="search" size={14} color={colors.textSecondary} style={styles.searchIcon} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Search articles..."
            placeholderTextColor={colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCorrect={false}
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => setSearchQuery('')} hitSlop={8}>
              <FontAwesome name="times-circle" size={14} color={colors.textSecondary} />
            </Pressable>
          )}
        </View>

        {/* Filter pills */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.pillRow}
        >
          {ALL_TAGS.map((tag) => {
            const isActive = activeTag === tag;
            return (
              <Pressable
                key={tag}
                onPress={() => handleTagPress(tag)}
                style={({ pressed }) => [
                  styles.filterPill,
                  {
                    backgroundColor: isActive ? Colors.primary : 'transparent',
                    borderColor: isActive ? Colors.primary : colors.border,
                  },
                  pressed && { opacity: 0.8 },
                ]}
              >
                <Text
                  style={[
                    styles.filterPillText,
                    { color: isActive ? Colors.white : colors.textSecondary },
                  ]}
                >
                  {tag}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Articles */}
        {filteredArticles.length === 0 && (
          <View style={styles.emptyState}>
            <FontAwesome name="search" size={24} color={colors.textSecondary} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              No articles match your search.
            </Text>
          </View>
        )}

        {filteredArticles.map((article) => {
          const variant = getTagColors(article.tagVariant, isDark);
          const isExpanded = expandedId === article.id;
          return (
            <Pressable
              key={article.id}
              onPress={() => handleToggleExpand(article.id)}
              style={({ pressed }) => [
                styles.card,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.cardBorder,
                  shadowColor: colors.shadowColor,
                },
                isExpanded && styles.cardExpanded,
                pressed && { opacity: 0.92, transform: [{ scale: 0.99 }] },
              ]}
            >
              <View style={styles.cardHeader}>
                <View style={[styles.tagPill, { backgroundColor: variant.bg }]}>
                  <Text style={[styles.tagText, { color: variant.color }]}>{article.tag}</Text>
                </View>
                <FontAwesome
                  name={isExpanded ? 'chevron-up' : 'chevron-down'}
                  size={10}
                  color={colors.textSecondary}
                />
              </View>
              <Text style={[styles.cardTitle, { color: colors.text }]}>{article.title}</Text>
              <Text style={[styles.cardDescription, { color: colors.textSecondary }]}>
                {article.description}
              </Text>

              {isExpanded && (
                <View style={[styles.expandedContent, { borderTopColor: colors.border, backgroundColor: expandedContentBg }]}>
                  <Text style={[styles.contentText, { color: colors.text }]}>
                    {article.content}
                  </Text>
                  {article.url && (
                    <Pressable
                      onPress={() => handleOpenUrl(article.url!)}
                      style={[styles.readMoreButton, { borderColor: Colors.secondary }]}
                    >
                      <Text style={[styles.readMoreText, { color: Colors.secondary }]}>
                        Read more on HMRC
                      </Text>
                      <FontAwesome name="external-link" size={11} color={Colors.secondary} />
                    </Pressable>
                  )}
                </View>
              )}

              <View style={styles.meta}>
                <FontAwesome name="clock-o" size={10.5} color={colors.textSecondary} />
                <Text style={[styles.metaText, { color: colors.textSecondary }]}>
                  {article.readMin} min read
                </Text>
              </View>
            </Pressable>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    padding: 24,
    gap: 14,
  },
  heading: {
    fontSize: 24,
    fontFamily: 'PlayfairDisplay_700Bold',
    lineHeight: 32,
  },
  subtitle: {
    fontSize: 12,
    fontFamily: 'Manrope_400Regular',
    marginBottom: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: BorderRadius.input,
    paddingHorizontal: 14,
    paddingVertical: 11,
    gap: 8,
  },
  searchIcon: {
    width: 18,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    fontFamily: 'Manrope_400Regular',
    padding: 0,
  },
  pillRow: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 2,
  },
  filterPill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 9999,
    borderWidth: 1,
  },
  filterPillText: {
    fontSize: 11.5,
    fontFamily: 'Manrope_600SemiBold',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 10,
  },
  emptyText: {
    fontSize: 13,
    fontFamily: 'Manrope_400Regular',
  },
  card: {
    borderRadius: BorderRadius.card,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
    ...Shadows.large,
  },
  cardExpanded: {
    ...Shadows.large,
    shadowOpacity: 0.1,
    elevation: 8,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  tagPill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 9999,
  },
  tagText: {
    fontSize: 9.5,
    fontFamily: 'Manrope_700Bold',
    letterSpacing: 0.05 * 9.5,
    textTransform: 'uppercase',
  },
  cardTitle: {
    fontSize: 13.5,
    fontFamily: 'Manrope_700Bold',
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: 12,
    fontFamily: 'Manrope_400Regular',
    lineHeight: 12 * 1.45,
    marginBottom: 8,
  },
  expandedContent: {
    borderTopWidth: 1,
    paddingTop: 14,
    paddingBottom: 8,
    paddingHorizontal: 12,
    marginHorizontal: -10,
    marginBottom: 8,
    borderRadius: 10,
    marginTop: 4,
  },
  contentText: {
    fontSize: 12.5,
    fontFamily: 'Manrope_400Regular',
    lineHeight: 12.5 * 1.6,
  },
  readMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    marginTop: 12,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderRadius: BorderRadius.pill,
  },
  readMoreText: {
    fontSize: 12,
    fontFamily: 'Manrope_600SemiBold',
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 10.5,
    fontFamily: 'Manrope_600SemiBold',
  },
});
