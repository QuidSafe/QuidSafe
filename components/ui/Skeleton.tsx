// Skeleton loading component - Animated opacity pulse pattern

import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View, ViewStyle } from 'react-native';
import { colors, Spacing, BorderRadius } from '@/constants/Colors';

interface SkeletonProps {
  width?: number | `${number}%`;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

const SHIMMER_DURATION = 1500;

export function Skeleton({ width = '100%', height = 20, borderRadius = 6, style }: SkeletonProps) {
  const opacityAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacityAnim, {
          toValue: 0.5,
          duration: SHIMMER_DURATION / 2,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: SHIMMER_DURATION / 2,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [opacityAnim]);

  return (
    <Animated.View
      style={[
        { width, height, borderRadius, backgroundColor: colors.surface, overflow: 'hidden', opacity: opacityAnim },
        style,
      ]}
    />
  );
}

/** Generic card skeleton with internal lines */
export function CardSkeleton({ style }: { style?: ViewStyle }) {
  return (
    <View style={[skeletonStyles.card, { backgroundColor: colors.surface }, style]}>
      <Skeleton width="40%" height={12} />
      <Skeleton width="65%" height={28} style={{ marginTop: 10 }} />
      <Skeleton width="80%" height={12} style={{ marginTop: 10 }} />
    </View>
  );
}

/** Legacy alias */
export function SkeletonCard() {
  return <CardSkeleton />;
}

/** Dashboard skeleton - mimics hero card, metric boxes, and action cards */
export function DashboardSkeleton() {
  return (
    <View style={skeletonStyles.dashboardContainer}>
      {/* Hero card shape */}
      <View style={[skeletonStyles.heroCard, { backgroundColor: colors.surface }]}>
        <Skeleton width={120} height={10} borderRadius={4} style={{ opacity: 0.4 }} />
        <Skeleton width="55%" height={36} borderRadius={6} style={{ marginTop: 10, opacity: 0.3 }} />
        <Skeleton width="70%" height={12} borderRadius={4} style={{ marginTop: 10, opacity: 0.25 }} />

        <View style={skeletonStyles.heroMetricRow}>
          {[1, 2, 3].map((i) => (
            <View key={i} style={skeletonStyles.heroMetricBox}>
              <Skeleton width="70%" height={9} borderRadius={3} style={{ opacity: 0.3 }} />
              <Skeleton width="50%" height={18} borderRadius={4} style={{ marginTop: 6, opacity: 0.3 }} />
            </View>
          ))}
        </View>

        <View style={skeletonStyles.heroSetAsideBar}>
          <Skeleton width={100} height={10} borderRadius={4} style={{ opacity: 0.3 }} />
          <Skeleton width={80} height={22} borderRadius={4} style={{ opacity: 0.3 }} />
        </View>
      </View>

      {/* Set aside card */}
      <View style={[skeletonStyles.setAsideCard, { backgroundColor: colors.surface }]}>
        <View>
          <Skeleton width={120} height={10} />
          <Skeleton width={100} height={26} style={{ marginTop: 6 }} />
        </View>
        <Skeleton width={70} height={28} borderRadius={14} />
      </View>

      <Skeleton width={140} height={16} style={{ marginTop: Spacing.md }} />

      {[1, 2, 3].map((i) => (
        <View key={i} style={[skeletonStyles.actionCard, { backgroundColor: colors.surface }]}>
          <Skeleton width={36} height={36} borderRadius={10} />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Skeleton width="60%" height={14} />
            <Skeleton width="85%" height={12} style={{ marginTop: 6 }} />
          </View>
        </View>
      ))}
    </View>
  );
}

/** Transaction list skeleton - 5 rows mimicking transaction items */
export function TransactionListSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <View style={[skeletonStyles.transactionList, { backgroundColor: colors.surface }]}>
      {Array.from({ length: rows }).map((_, i) => (
        <View
          key={i}
          style={[
            skeletonStyles.transactionRow,
            i < rows - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border },
          ]}
        >
          <Skeleton width={38} height={38} borderRadius={19} />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Skeleton width="55%" height={14} />
            <Skeleton width="35%" height={11} style={{ marginTop: 6 }} />
          </View>
          <Skeleton width={60} height={14} />
        </View>
      ))}
    </View>
  );
}

/** Income screen skeleton - summary card, chart area, source list */
export function IncomeSkeleton() {
  return (
    <View style={skeletonStyles.dashboardContainer}>
      <View style={[skeletonStyles.card, { backgroundColor: colors.surface }]}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <View style={{ flex: 1 }}>
            <Skeleton width={80} height={10} />
            <Skeleton width={120} height={30} style={{ marginTop: 6 }} />
          </View>
          <View style={{ flex: 1, alignItems: 'flex-end' }}>
            <Skeleton width={70} height={10} />
            <Skeleton width={100} height={24} style={{ marginTop: 6 }} />
          </View>
        </View>
        <View style={skeletonStyles.chartBarsRow}>
          {[40, 65, 30, 80, 55, 45].map((h, i) => (
            <View key={i} style={skeletonStyles.chartBarCol}>
              <Skeleton width={16} height={h} borderRadius={4} />
              <Skeleton width={20} height={9} borderRadius={3} style={{ marginTop: 4 }} />
            </View>
          ))}
        </View>
      </View>

      <Skeleton width={80} height={16} style={{ marginTop: Spacing.sm }} />
      <Skeleton width="100%" height={44} borderRadius={BorderRadius.input} style={{ marginTop: Spacing.sm }} />

      <TransactionListSkeleton rows={3} />
    </View>
  );
}

/** Section skeleton - a small stack of placeholder rows, sized for inline card use */
export function SectionSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <View style={{ gap: 10 }}>
      {Array.from({ length: rows }).map((_, i) => (
        <View
          key={i}
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Skeleton width="45%" height={12} />
          <Skeleton width={70} height={14} />
        </View>
      ))}
    </View>
  );
}

/** Full-screen skeleton - summary card + chart shape + list, for tax/MTD/self-assessment */
export function FullScreenSkeleton() {
  return (
    <View style={{ gap: Spacing.md, paddingVertical: Spacing.md }}>
      <View style={[skeletonStyles.card, { backgroundColor: colors.surface }]}>
        <Skeleton width="35%" height={12} />
        <Skeleton width="60%" height={34} style={{ marginTop: 10 }} />
        <View style={{ flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.md }}>
          <View style={{ flex: 1, gap: 6 }}>
            <Skeleton width="70%" height={10} />
            <Skeleton width="90%" height={18} />
          </View>
          <View style={{ flex: 1, gap: 6 }}>
            <Skeleton width="70%" height={10} />
            <Skeleton width="90%" height={18} />
          </View>
        </View>
      </View>

      <View style={[skeletonStyles.card, { backgroundColor: colors.surface }]}>
        <Skeleton width="40%" height={12} />
        <View style={skeletonStyles.chartBarsRow}>
          {[50, 75, 40, 85, 60, 70].map((h, i) => (
            <View key={i} style={skeletonStyles.chartBarCol}>
              <Skeleton width={16} height={h} borderRadius={4} />
              <Skeleton width={22} height={9} borderRadius={3} style={{ marginTop: 4 }} />
            </View>
          ))}
        </View>
      </View>

      <TransactionListSkeleton rows={4} />
    </View>
  );
}

/** Expenses screen skeleton - metric cards, buttons, expense list */
export function ExpensesSkeleton() {
  return (
    <View style={skeletonStyles.dashboardContainer}>
      <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
        <View style={[skeletonStyles.card, { backgroundColor: colors.surface, flex: 1 }]}>
          <Skeleton width={80} height={10} />
          <Skeleton width={90} height={22} style={{ marginTop: 8 }} />
        </View>
        <View style={[skeletonStyles.card, { backgroundColor: colors.surface, flex: 1 }]}>
          <Skeleton width={70} height={10} />
          <Skeleton width={80} height={22} style={{ marginTop: 8 }} />
        </View>
      </View>

      <View style={[skeletonStyles.card, { backgroundColor: colors.surface }]}>
        <Skeleton width={80} height={10} />
        <Skeleton width={100} height={22} style={{ marginTop: 8 }} />
      </View>

      <Skeleton width="100%" height={48} borderRadius={BorderRadius.button} />
      <Skeleton width="100%" height={48} borderRadius={BorderRadius.button} />

      <Skeleton width={130} height={16} style={{ marginTop: Spacing.sm }} />
      <TransactionListSkeleton rows={4} />
    </View>
  );
}

const skeletonStyles = StyleSheet.create({
  dashboardContainer: {
    gap: Spacing.md,
  },
  card: {
    borderRadius: BorderRadius.card,
    padding: Spacing.lg,
  },
  heroCard: {
    borderRadius: BorderRadius.card,
    padding: Spacing.lg,
    paddingBottom: 20,
  },
  heroMetricRow: {
    flexDirection: 'row',
    gap: 7,
    marginTop: 16,
  },
  heroMetricBox: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 9,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  heroSetAsideBar: {
    marginTop: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.accentGlow,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  setAsideCard: {
    borderRadius: BorderRadius.card,
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  actionCard: {
    borderRadius: BorderRadius.card,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
  },
  transactionList: {
    borderRadius: BorderRadius.card,
    overflow: 'hidden',
  },
  transactionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: Spacing.md,
  },
  chartBarsRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 100,
    marginTop: Spacing.lg,
  },
  chartBarCol: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
});
