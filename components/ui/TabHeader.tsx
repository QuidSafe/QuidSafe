import { StyleSheet, View, Text } from 'react-native';
import { colors, Spacing } from '@/constants/Colors';
import { Fonts } from '@/constants/Typography';

interface TabHeaderProps {
  title: string;
  subtitle?: string;
  rightAction?: React.ReactNode;
}

export function TabHeader({ title, subtitle, rightAction }: TabHeaderProps) {
  return (
    <View style={styles.row}>
      <View style={styles.textBlock}>
        <Text style={styles.title} accessibilityRole="header">
          {title}
        </Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      {rightAction ? <View style={styles.actionSlot}>{rightAction}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.md,
  },
  textBlock: {
    flex: 1,
    gap: 4,
  },
  title: {
    fontFamily: Fonts.lexend.semiBold,
    fontSize: 24,
    color: colors.text,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontFamily: Fonts.sourceSans.regular,
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  actionSlot: {
    flexShrink: 0,
  },
});
