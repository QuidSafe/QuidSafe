// Quarter timeline component — Visual Q1–Q4 progress tracker

import { StyleSheet, View, Text } from 'react-native';
import { Colors, Spacing } from '@/constants/Colors';
import { useTheme } from '@/lib/ThemeContext';

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
  const { colors, isDark } = useTheme();

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: colors.textSecondary }]}>Tax Year {taxYear}</Text>
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
                  isCurrent && [styles.dotCurrent, { backgroundColor: colors.tint }],
                  !isDone && !isCurrent && { backgroundColor: isDark ? Colors.grey[700] : Colors.grey[200] },
                ]}
              >
                {isDone && <Text style={styles.check}>✓</Text>}
                {isCurrent && <View style={styles.pulse} />}
              </View>
              <Text style={[styles.label, { color: colors.textSecondary }, isCurrent && { color: colors.tint }]}>{label}</Text>
              <Text style={[styles.months, { color: colors.textSecondary }]}>{months}</Text>
            </View>
          );
        })}
      </View>
      <View style={[styles.line, { backgroundColor: isDark ? Colors.grey[700] : Colors.grey[200] }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: Spacing.sm,
  },
  title: {
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 14,
    marginBottom: Spacing.md,
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
    backgroundColor: Colors.success,
  },
  dotCurrent: {
    backgroundColor: Colors.primary,
  },
  pulse: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.white,
  },
  check: {
    color: Colors.white,
    fontSize: 14,
    fontFamily: 'Manrope_700Bold',
  },
  label: {
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 13,
  },
  months: {
    fontFamily: 'Manrope_400Regular',
    fontSize: 10,
    marginTop: 2,
  },
  line: {
    position: 'absolute',
    top: 14,
    left: '12%',
    right: '12%',
    height: 2,
    zIndex: 0,
  },
});
