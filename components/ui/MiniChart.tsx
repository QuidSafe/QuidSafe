import { StyleSheet, View, Text } from 'react-native';
import { useTheme } from '@/lib/ThemeContext';
import { Colors } from '@/constants/Colors';
import { Fonts } from '@/constants/Typography';

interface MiniChartDataPoint {
  label: string;
  value: number;
}

interface MiniChartProps {
  data: MiniChartDataPoint[];
  color?: string;
  height?: number;
}

export function MiniChart({ data, color = Colors.success, height = 80 }: MiniChartProps) {
  const { colors } = useTheme();

  if (!data || data.length === 0) return null;

  const maxValue = Math.max(...data.map((d) => d.value), 1);
  const avgValue = data.reduce((sum, d) => sum + d.value, 0) / data.length;
  const avgHeight = (avgValue / maxValue) * height;
  const lastPoint = data[data.length - 1];

  return (
    <View style={styles.container}>
      {/* Tooltip label above last bar */}
      <View style={styles.tooltipRow}>
        <View style={{ flex: 1 }} />
        <View style={[styles.tooltip, { backgroundColor: color }]}>
          <Text style={styles.tooltipText}>
            {formatCompact(lastPoint.value)}
          </Text>
        </View>
      </View>

      {/* Chart area */}
      <View style={[styles.chartArea, { height }]}>
        {/* Average dashed line */}
        <View
          style={[
            styles.avgLine,
            {
              bottom: avgHeight,
              borderColor: colors.textSecondary,
            },
          ]}
        >
          <Text style={[styles.avgLabel, { color: colors.textSecondary }]}>avg</Text>
        </View>

        {/* Bars */}
        <View style={styles.barsContainer}>
          {data.map((point, index) => {
            const barHeight = (point.value / maxValue) * height;
            const isLast = index === data.length - 1;

            return (
              <View key={`${point.label}-${index}`} style={styles.barColumn}>
                <View style={[styles.barWrapper, { height }]}>
                  {/* Opacity gradient layers for the bar */}
                  <View
                    style={[
                      styles.barBase,
                      {
                        height: barHeight,
                        backgroundColor: color,
                        opacity: isLast ? 1 : 0.65,
                      },
                    ]}
                  />
                  {/* Lighter bottom portion for gradient effect */}
                  <View
                    style={[
                      styles.barGradientOverlay,
                      {
                        height: barHeight * 0.5,
                        backgroundColor: color,
                        opacity: 0.15,
                      },
                    ]}
                  />
                </View>
              </View>
            );
          })}
        </View>
      </View>

      {/* Month labels */}
      <View style={styles.labelsRow}>
        {data.map((point, index) => (
          <View key={`label-${point.label}-${index}`} style={styles.labelColumn}>
            <Text
              style={[
                styles.label,
                {
                  color: index === data.length - 1 ? colors.text : colors.textSecondary,
                  fontFamily:
                    index === data.length - 1
                      ? Fonts.sourceSans.semiBold
                      : Fonts.sourceSans.regular,
                },
              ]}
            >
              {point.label}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

/** Format a number into compact form, e.g. 1200 -> "1.2k", 450 -> "450" */
function formatCompact(value: number): string {
  if (value >= 1000) {
    const k = value / 1000;
    return k % 1 === 0 ? `£${k}k` : `£${k.toFixed(1)}k`;
  }
  return `£${Math.round(value)}`;
}

const BAR_WIDTH = 4;
const BAR_GAP = 2;

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  tooltipRow: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  tooltip: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: 'flex-end',
    marginRight: BAR_WIDTH / 2,
  },
  tooltipText: {
    fontFamily: Fonts.mono.semiBold,
    fontSize: 10,
    color: Colors.white,
  },
  chartArea: {
    position: 'relative',
    overflow: 'hidden',
  },
  avgLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 0,
    borderTopWidth: 1,
    borderStyle: 'dashed',
    zIndex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  avgLabel: {
    fontFamily: Fonts.sourceSans.regular,
    fontSize: 8,
    position: 'absolute',
    right: 0,
    top: -10,
  },
  barsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    flex: 1,
    gap: BAR_GAP,
    paddingHorizontal: 2,
  },
  barColumn: {
    flex: 1,
    alignItems: 'center',
  },
  barWrapper: {
    justifyContent: 'flex-end',
    alignItems: 'center',
    width: BAR_WIDTH + 4,
  },
  barBase: {
    width: BAR_WIDTH,
    borderRadius: BAR_WIDTH / 2,
    position: 'absolute',
    bottom: 0,
  },
  barGradientOverlay: {
    width: BAR_WIDTH,
    borderRadius: BAR_WIDTH / 2,
    position: 'absolute',
    bottom: 0,
  },
  labelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
    paddingHorizontal: 2,
  },
  labelColumn: {
    flex: 1,
    alignItems: 'center',
  },
  label: {
    fontSize: 9,
  },
});
