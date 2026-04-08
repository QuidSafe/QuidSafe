// Quarter timeline component — Visual Q1–Q4 progress tracker

import { StyleSheet, View, Text } from 'react-native';
import { colors, Spacing } from '@/constants/Colors';
import { Fonts } from '@/constants/Typography';

interface QuarterTimelineProps {
  currentQuarter: number;
  taxYear: string;
}

const QUARTERS = [
  { q: 1, label: 'Q1', months: 'Apr – Jun' },
  { q: 2, label: 'Q2', months: 'Jul – Sep' },
  { q: 3, label: 'Q3', months: 'Oct – Dec' },
  { q: 4, label: 'Q4', months: 'Jan – Mar' },
];

export function QuarterTimeline({ currentQuarter, taxYear }: QuarterTimelineProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Tax Year {taxYear}</Text>
      <View style={styles.timeline}>
        {QUARTERS.map(({ q, label, months }) => {
          const isDone = q < currentQuarter;
          const isCurrent = q === currentQuarter;

          return (
            <View key={q} style={styles.quarterBox}>
              <View
                style={[
                  styles.dot,
                  isDone && styles.dotDone,
                  isCurrent && styles.dotCurrent,
                  !isDone && !isCurrent && { backgroundColor: colors.border },
                ]}
              >
                {isDone && <Text style={styles.check}>✓</Text>}
                {isCurrent && <View style={styles.pulse} />}
              </View>
              <Text style={[styles.label, isCurrent && styles.labelActive]}>{label}</Text>
              <Text style={styles.months}>{months}</Text>
            </View>
          );
        })}
      </View>
      <View style={styles.line} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: Spacing.sm,
  },
  title: {
    fontFamily: Fonts.lexend.semiBold,
    fontSize: 14,
    marginBottom: Spacing.md,
    color: colors.textSecondary,
  },
  timeline: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    position: 'relative',
    zIndex: 1,
  },
  quarterBox: {
    alignItems: 'center',
    flex: 1,
  },
  dot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  dotDone: {
    backgroundColor: colors.success,
  },
  dotCurrent: {
    backgroundColor: colors.accent,
  },
  pulse: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.text,
  },
  check: {
    color: colors.text,
    fontSize: 14,
    fontFamily: Fonts.lexend.semiBold,
  },
  label: {
    fontFamily: Fonts.lexend.semiBold,
    fontSize: 13,
    color: colors.textSecondary,
  },
  labelActive: {
    color: colors.accent,
  },
  months: {
    fontFamily: Fonts.sourceSans.regular,
    fontSize: 10,
    marginTop: 2,
    color: colors.textSecondary,
  },
  line: {
    position: 'absolute',
    top: 14,
    left: '12%',
    right: '12%',
    height: 2,
    zIndex: 0,
    backgroundColor: colors.border,
  },
});
