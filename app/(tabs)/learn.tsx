import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  LayoutAnimation,
  Platform,
  UIManager,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, XCircle, AlertTriangle, ChevronUp, ChevronDown, Clock } from 'lucide-react-native';
import { colors, Colors, Shadows, Spacing, BorderRadius } from '@/constants/Colors';
import { Fonts } from '@/constants/Typography';
import { useArticles } from '@/lib/hooks/useApi';
import type { Article, ArticleCategory } from '@/lib/types';
import { TabHeader } from '@/components/ui/TabHeader';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

type TagVariant = 'tag-n' | 'tag-ok' | 'tag-g';

const CATEGORY_TAG_MAP: Record<ArticleCategory, { tag: string; tagVariant: TagVariant }> = {
  'mtd':             { tag: 'MTD',        tagVariant: 'tag-n' },
  'getting-started': { tag: 'TAX BASICS', tagVariant: 'tag-ok' },
  'expenses':        { tag: 'EXPENSES',   tagVariant: 'tag-ok' },
  'bank-safety':     { tag: 'SECURITY',   tagVariant: 'tag-g' },
  'deadlines':       { tag: 'DEADLINES',  tagVariant: 'tag-n' },
  'vat':             { tag: 'VAT',        tagVariant: 'tag-g' },
};

const ALL_TAGS = ['All', 'MTD', 'Tax Basics', 'Expenses', 'Security', 'Deadlines', 'VAT'] as const;

function getTagColors(variant: TagVariant): { bg: string; color: string } {
  switch (variant) {
    case 'tag-n': return { bg: 'rgba(0,102,255,0.12)', color: Colors.electricBlue };
    case 'tag-ok': return { bg: 'rgba(0,200,83,0.12)', color: Colors.success };
    case 'tag-g': return { bg: 'rgba(0,102,255,0.12)', color: Colors.electricBlue };
  }
}

export default function LearnScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTag, setActiveTag] = useState<string>('All');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const { data, isLoading, isError } = useArticles();

  const articles = useMemo(() => {
    if (!data?.articles) return [];
    return data.articles.map((a) => {
      const mapping = CATEGORY_TAG_MAP[a.category] ?? { tag: a.category.toUpperCase(), tagVariant: 'tag-ok' as TagVariant };
      return { ...a, ...mapping };
    });
  }, [data]);

  // ── Staggered entrance animations ──
  const headerFade = useRef(new Animated.Value(0)).current;
  const headerSlide = useRef(new Animated.Value(16)).current;
  const searchFade = useRef(new Animated.Value(0)).current;
  const searchSlide = useRef(new Animated.Value(14)).current;
  const pillsFade = useRef(new Animated.Value(0)).current;
  const pillsSlide = useRef(new Animated.Value(12)).current;
  // Article cards - dynamically sized
  const MAX_CARD_ANIMS = 20;
  const cardAnims = useRef(
    Array.from({ length: MAX_CARD_ANIMS }, () => ({
      fade: new Animated.Value(0),
      slide: new Animated.Value(24),
    })),
  ).current;

  useEffect(() => {
    if (isLoading || articles.length === 0) return;

    const fadeSlide = (fade: Animated.Value, slide: Animated.Value, duration: number) =>
      Animated.parallel([
        Animated.timing(fade, { toValue: 1, duration, useNativeDriver: true }),
        Animated.timing(slide, { toValue: 0, duration, useNativeDriver: true }),
      ]);

    // 1. Header - immediate
    fadeSlide(headerFade, headerSlide, 300).start();

    // 2. Search bar - 120ms delay
    Animated.sequence([
      Animated.delay(120),
      fadeSlide(searchFade, searchSlide, 320),
    ]).start();

    // 3. Filter pills - 220ms delay
    Animated.sequence([
      Animated.delay(220),
      fadeSlide(pillsFade, pillsSlide, 300),
    ]).start();

    // 4. Article cards - cascading stagger starting at 350ms, 100ms apart
    cardAnims.slice(0, articles.length).forEach((anim: { fade: Animated.Value; slide: Animated.Value }, i: number) => {
      Animated.sequence([
        Animated.delay(350 + i * 100),
        fadeSlide(anim.fade, anim.slide, 380),
      ]).start();
    });
  }, [isLoading, articles.length]); // eslint-disable-line react-hooks/exhaustive-deps

  const filteredArticles = articles.filter((article) => {
    const matchesTag =
      activeTag === 'All' || article.tag.toLowerCase() === activeTag.toLowerCase();
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      article.title.toLowerCase().includes(q) ||
      article.tag.toLowerCase().includes(q) ||
      article.summary.toLowerCase().includes(q);
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

  const expandedContentBg = 'rgba(255,255,255,0.03)';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <Animated.View style={{ opacity: headerFade, transform: [{ translateY: headerSlide }] }}>
          <View style={styles.headingRow}>
            <View style={styles.goldAccentBar} />
            <View style={styles.headingText}>
              <TabHeader
                title="Learn"
                subtitle="Tax doesn't have to be scary. Quick reads to keep you confident."
              />
            </View>
          </View>
        </Animated.View>

        {/* Search bar */}
        <Animated.View style={{ opacity: searchFade, transform: [{ translateY: searchSlide }] }}>
        <View style={[styles.searchContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Search size={14} color={colors.textSecondary} strokeWidth={1.5} style={styles.searchIcon} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Search articles..."
            placeholderTextColor={colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCorrect={false}
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => setSearchQuery('')} hitSlop={8} accessibilityRole="button" accessibilityLabel="Clear search">
              <XCircle size={14} color={colors.textSecondary} strokeWidth={1.5} />
            </Pressable>
          )}
        </View>
        </Animated.View>

        {/* Filter pills */}
        <Animated.View style={{ opacity: pillsFade, transform: [{ translateY: pillsSlide }] }}>
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
                accessibilityRole="button"
                accessibilityLabel={`Filter: ${tag}`}
                accessibilityState={{ selected: isActive }}
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
        </Animated.View>

        {/* Loading state */}
        {isLoading && (
          <View style={styles.loadingState}>
            {Array.from({ length: 3 }).map((_, i) => (
              <View
                key={i}
                style={[
                  styles.skeletonCard,
                  { backgroundColor: colors.surface, borderColor: colors.cardBorder },
                ]}
              >
                <View style={[styles.skeletonTag, { backgroundColor: 'rgba(255,255,255,0.08)' }]} />
                <View style={[styles.skeletonTitle, { backgroundColor: 'rgba(255,255,255,0.08)' }]} />
                <View style={[styles.skeletonDesc, { backgroundColor: 'rgba(255,255,255,0.06)' }]} />
              </View>
            ))}
            <ActivityIndicator size="small" color="#0066FF" style={{ marginTop: 8 }} />
          </View>
        )}

        {/* Error state */}
        {isError && !isLoading && (
          <View style={styles.emptyState}>
            <AlertTriangle size={24} color="#FF3B30" strokeWidth={1.5} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              Couldn&apos;t load articles. Pull down to retry.
            </Text>
          </View>
        )}

        {/* Articles */}
        {!isLoading && !isError && filteredArticles.length === 0 && (
          <View style={styles.emptyState}>
            <Search size={24} color={colors.textSecondary} strokeWidth={1.5} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              No articles match your search.
            </Text>
          </View>
        )}

        {!isLoading && filteredArticles.map((article) => {
          const variant = getTagColors(article.tagVariant);
          const isExpanded = expandedId === article.id;
          const articleIndex = articles.findIndex((a) => a.id === article.id);
          const anim = articleIndex < MAX_CARD_ANIMS ? cardAnims[articleIndex] : undefined;
          return (
            <Animated.View
              key={article.id}
              style={anim ? { opacity: anim.fade, transform: [{ translateY: anim.slide }] } : undefined}
            >
            <Pressable
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
              accessibilityRole="button"
              accessibilityLabel={`${article.tag}: ${article.title}. ${article.summary} ${article.read_time_min} minute read`}
              accessibilityHint={isExpanded ? 'Tap to collapse' : 'Tap to expand and read more'}
              accessibilityState={{ expanded: isExpanded }}
            >
              <View style={styles.cardHeader}>
                <View style={[styles.tagPill, { backgroundColor: variant.bg }]}>
                  <Text style={[styles.tagText, { color: variant.color }]}>{article.tag}</Text>
                </View>
                {isExpanded ? (
                  <ChevronUp size={10} color={colors.textSecondary} strokeWidth={1.5} />
                ) : (
                  <ChevronDown size={10} color={colors.textSecondary} strokeWidth={1.5} />
                )}
              </View>
              <Text style={[styles.cardTitle, { color: colors.text }]}>{article.title}</Text>
              <Text style={[styles.cardDescription, { color: colors.textSecondary }]}>
                {article.summary}
              </Text>

              {isExpanded && (
                <View style={[styles.expandedContent, { borderTopColor: colors.border, backgroundColor: expandedContentBg }]}>
                  <Text style={[styles.contentText, { color: colors.text }]}>
                    {article.body}
                  </Text>
                </View>
              )}

              <View style={styles.meta}>
                <Clock size={10.5} color={colors.textSecondary} strokeWidth={1.5} />
                <Text style={[styles.metaText, { color: colors.textSecondary }]}>
                  {article.read_time_min} min read
                </Text>
              </View>
            </Pressable>
            </Animated.View>
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
    padding: Spacing.lg,
    gap: 14,
    paddingBottom: Spacing.xxl + Spacing.lg,
  },
  headingRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm + 4,
  },
  goldAccentBar: {
    width: 3,
    height: 36,
    borderRadius: 2,
    backgroundColor: Colors.electricBlue,
    marginTop: 2,
  },
  headingText: {
    flex: 1,
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
    fontFamily: Fonts.sourceSans.regular,
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
    fontFamily: Fonts.sourceSans.semiBold,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 10,
  },
  emptyText: {
    fontSize: 13,
    fontFamily: Fonts.sourceSans.regular,
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
    fontFamily: Fonts.lexend.semiBold,
    letterSpacing: 0.05 * 9.5,
    textTransform: 'uppercase',
  },
  cardTitle: {
    fontSize: 13.5,
    fontFamily: Fonts.lexend.semiBold,
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: 12,
    fontFamily: Fonts.sourceSans.regular,
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
    fontFamily: Fonts.sourceSans.regular,
    lineHeight: 12.5 * 1.6,
  },
  loadingState: {
    gap: 14,
  },
  skeletonCard: {
    borderRadius: BorderRadius.card,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
    gap: 10,
  },
  skeletonTag: {
    width: 60,
    height: 18,
    borderRadius: 9999,
  },
  skeletonTitle: {
    width: '70%',
    height: 16,
    borderRadius: 4,
  },
  skeletonDesc: {
    width: '90%',
    height: 12,
    borderRadius: 4,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 10.5,
    fontFamily: Fonts.sourceSans.semiBold,
  },
});
