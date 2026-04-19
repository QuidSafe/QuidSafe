import { useEffect, useRef, useState } from 'react';
import { StyleSheet, View, Text, Pressable, useWindowDimensions } from 'react-native';
import { Colors, Spacing } from '@/constants/Colors';
import { Fonts } from '@/constants/Typography';
import { formatCurrency } from '@/lib/tax-engine';
import { formatRelativeTime } from '@/lib/formatRelativeTime';
import { ProgressRing } from '@/components/ui/ProgressRing';
import type { TaxCalculation } from '@/lib/types';

export interface TaxHeroCardProps {
  tax: TaxCalculation | undefined;
  /** ISO 8601 timestamp of the most recent bank sync, or null when no bank is connected. Shown as a trust signal below the hero amount. */
  lastSyncedAt?: string | null;
}

/**
 * requestAnimationFrame-based count-up. Animates `displayed` from its current
 * value to `target` using ease-out-cubic. Ref-based start avoids re-entry when
 * parent re-renders mid-tween. Caller controls duration; 0ms renders instantly.
 */
function useCountUp(target: number, durationMs: number): number {
  const [displayed, setDisplayed] = useState(target);
  const fromRef = useRef(target);
  const startedAtRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (durationMs <= 0 || !Number.isFinite(target)) {
      setDisplayed(target);
      return;
    }
    fromRef.current = displayed;
    startedAtRef.current = null;

    const tick = (now: number) => {
      if (startedAtRef.current === null) startedAtRef.current = now;
      const elapsed = now - startedAtRef.current;
      const t = Math.min(1, elapsed / durationMs);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplayed(fromRef.current + (target - fromRef.current) * eased);
      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick);
      }
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, durationMs]);

  return displayed;
}

/**
 * UK tax year runs 6 Apr to 5 Apr. Returns 0..1 fraction of the year elapsed.
 */
function taxYearProgress(now: Date = new Date()): number {
  const y = now.getUTCFullYear();
  // If we're past April 5 this year, current tax year started this April 6.
  const pastApril = now.getUTCMonth() > 3 || (now.getUTCMonth() === 3 && now.getUTCDate() >= 6);
  const startYear = pastApril ? y : y - 1;
  const start = Date.UTC(startYear, 3, 6);
  const end = Date.UTC(startYear + 1, 3, 6);
  const t = (now.getTime() - start) / (end - start);
  return Math.max(0, Math.min(1, t));
}

/**
 * Apple-style hero tax summary: dramatic typography, subtle glow, minimal chrome.
 * The primary number dominates. Secondary stats are quiet and tabular.
 */
export function TaxHeroCard({ tax, lastSyncedAt }: TaxHeroCardProps) {
  const { width } = useWindowDimensions();
  const isNarrow = width < 400;

  const totalOwed = tax?.totalTaxOwed ?? 0;
  const totalIncome = tax?.totalIncome ?? 0;
  const setAsideMonthly = tax?.setAsideMonthly ?? 0;
  const incomeTax = tax?.incomeTax?.total ?? 0;
  const nationalInsurance = tax?.nationalInsurance?.total ?? 0;
  const totalExpenses = tax?.totalExpenses ?? 0;

  const animatedOwed = useCountUp(totalOwed, 600);
  const animatedMonthly = useCountUp(setAsideMonthly, 600);

  // Responsive hero type - 56-72px
  const heroFontSize = isNarrow ? 52 : 68;

  return (
    <Pressable
      accessible={true}
      accessibilityRole="summary"
      accessibilityLabel={`Set aside ${formatCurrency(totalOwed)} for tax based on ${formatCurrency(totalIncome)} income this tax year. Monthly set aside: ${formatCurrency(setAsideMonthly)}.`}
      style={({ pressed }) => [styles.root, pressed && styles.pressed]}
    >
      {/* Subtle radial glow */}
      <View style={styles.glow} pointerEvents="none" />

      {/* Tiny uppercase label */}
      <Text style={styles.eyebrow}>TOTAL TAX DUE THIS YEAR</Text>

      {/* The hero number - everything else is secondary to this */}
      <Text
        style={[
          styles.heroAmount,
          { fontSize: heroFontSize, lineHeight: heroFontSize * 1.02 },
        ]}
        numberOfLines={1}
        adjustsFontSizeToFit
      >
        {formatCurrency(Math.round(animatedOwed))}
      </Text>

      <View style={styles.subRow}>
        <Text style={styles.sub}>On {formatCurrency(totalIncome)} of income</Text>
        {lastSyncedAt !== undefined && (
          <View style={styles.syncPill}>
            <View style={styles.syncDot} />
            <Text style={styles.syncText}>Synced {formatRelativeTime(lastSyncedAt)}</Text>
          </View>
        )}
      </View>

      {/* Monthly set-aside prominent CTA-style band */}
      <View style={styles.monthlyBand}>
        <View style={styles.monthlyLeft}>
          <Text style={styles.monthlyLabel}>Set aside each month</Text>
          <Text style={styles.monthlyAmount}>{formatCurrency(Math.round(animatedMonthly))}</Text>
        </View>
        <View style={styles.yearRing} accessibilityLabel={`Tax year ${Math.round(taxYearProgress() * 100)} percent elapsed`}>
          <ProgressRing progress={taxYearProgress()} size={56} strokeWidth={4} durationMs={900}>
            <Text style={styles.yearRingText}>{Math.round(taxYearProgress() * 100)}%</Text>
          </ProgressRing>
        </View>
      </View>

      {/* Quiet breakdown - tabular, no boxes */}
      <View style={styles.breakdown}>
        <View style={styles.breakdownRow}>
          <Text style={styles.breakdownLabel}>Income Tax</Text>
          <Text style={styles.breakdownValue}>{formatCurrency(incomeTax)}</Text>
        </View>
        <View style={styles.breakdownRow}>
          <Text style={styles.breakdownLabel}>National Insurance</Text>
          <Text style={styles.breakdownValue}>{formatCurrency(nationalInsurance)}</Text>
        </View>
        <View style={styles.breakdownRow}>
          <Text style={styles.breakdownLabel}>Expenses</Text>
          <Text style={[styles.breakdownValue, styles.expensesValue]}>
            -{formatCurrency(totalExpenses)}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: {
    position: 'relative',
    backgroundColor: Colors.charcoal,
    borderRadius: 20,
    padding: Spacing.lg + 4,
    borderWidth: 1,
    borderColor: Colors.midGrey,
    overflow: 'hidden',
  },
  pressed: {
    opacity: 0.92,
  },
  glow: {
    position: 'absolute',
    top: -120,
    right: -120,
    width: 400,
    height: 400,
    borderRadius: 200,
    backgroundColor: Colors.electricBlue,
    opacity: 0.08,
  },

  eyebrow: {
    fontFamily: Fonts.sourceSans.semiBold,
    fontSize: 11,
    letterSpacing: 1.4,
    color: Colors.electricBlue,
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  heroAmount: {
    fontFamily: Fonts.lexend.semiBold,
    color: Colors.white,
    letterSpacing: -2,
  },
  subRow: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    flexWrap: 'wrap',
  },
  sub: {
    fontFamily: Fonts.sourceSans.regular,
    fontSize: 14,
    color: Colors.lightGrey,
    flexShrink: 1,
  },
  syncPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: Colors.midGrey,
  },
  syncDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.success,
  },
  syncText: {
    fontFamily: Fonts.sourceSans.regular,
    fontSize: 11,
    color: Colors.lightGrey,
    letterSpacing: 0.2,
  },

  // Monthly band
  monthlyBand: {
    marginTop: 24,
    backgroundColor: Colors.blueGlow,
    borderWidth: 1,
    borderColor: 'rgba(0, 102, 255, 0.25)',
    borderRadius: 14,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  monthlyLeft: {
    flex: 1,
  },
  monthlyLabel: {
    fontFamily: Fonts.sourceSans.regular,
    fontSize: 13,
    lineHeight: 18,
    color: Colors.lightGrey,
    marginBottom: 4,
  },
  monthlyAmount: {
    fontFamily: Fonts.mono.semiBold,
    fontSize: 28,
    color: Colors.electricBlue,
    letterSpacing: -0.5,
  },
  yearRing: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  yearRingText: {
    fontFamily: Fonts.mono.semiBold,
    fontSize: 11,
    lineHeight: 14,
    color: Colors.electricBlue,
    letterSpacing: -0.2,
  },

  // Breakdown
  breakdown: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: Colors.midGrey,
    gap: 12,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  breakdownLabel: {
    fontFamily: Fonts.sourceSans.regular,
    fontSize: 14,
    color: Colors.lightGrey,
  },
  breakdownValue: {
    fontFamily: Fonts.mono.regular,
    fontSize: 15,
    color: Colors.white,
  },
  expensesValue: {
    color: Colors.success,
  },
});
