import { useState, useRef } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, Dimensions } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { Colors, BorderRadius, Spacing } from '@/constants/Colors';
import { useTheme } from '@/lib/ThemeContext';

const PHONE_WIDTH = 375;
const PHONE_HEIGHT = 812;
const SCALE = 0.45;
const NOTCH_WIDTH = 160;
const NOTCH_HEIGHT = 30;

// ─── Screenshot Data ────────────────────────────────────────

const MOCK_TRANSACTIONS = [
  { name: 'Adobe Creative Cloud', amount: '-£49.99', category: 'Software', confidence: 98, icon: 'laptop' as const },
  { name: 'Screwfix Direct', amount: '-£34.50', category: 'Materials', confidence: 95, icon: 'wrench' as const },
  { name: 'Shell Petrol', amount: '-£62.30', category: 'Travel', confidence: 91, icon: 'car' as const },
  { name: 'Costa Coffee', amount: '-£4.85', category: 'Subsistence', confidence: 87, icon: 'coffee' as const },
  { name: 'Amazon Web Services', amount: '-£12.00', category: 'Software', confidence: 99, icon: 'cloud' as const },
];

const TAX_BANDS = [
  { label: 'Personal Allowance', range: '£0 – £12,570', rate: '0%', amount: '£0.00' },
  { label: 'Basic Rate', range: '£12,571 – £50,270', rate: '20%', amount: '£4,140.00' },
  { label: 'Class 2 NI', range: 'Flat rate', rate: '£3.45/wk', amount: '£179.40' },
  { label: 'Class 4 NI', range: '£12,570 – £50,270', rate: '6%', amount: '£1,242.00' },
];

const BANK_NAMES = [
  { name: 'Barclays', color: '#00AEEF' },
  { name: 'HSBC', color: '#DB0011' },
  { name: 'Lloyds', color: '#006A4D' },
  { name: 'Monzo', color: '#FF5C6C' },
  { name: 'Starling', color: '#7433FF' },
  { name: 'Revolut', color: '#0075EB' },
];

// ─── Phone Frame Component ──────────────────────────────────

function PhoneFrame({ children }: { children: React.ReactNode }) {
  return (
    <View style={frameStyles.outer}>
      <View style={frameStyles.phone}>
        {/* Notch */}
        <View style={frameStyles.notchContainer}>
          <View style={frameStyles.notch} />
        </View>
        {/* Screen content */}
        <View style={frameStyles.screen}>{children}</View>
        {/* Home indicator */}
        <View style={frameStyles.homeIndicatorContainer}>
          <View style={frameStyles.homeIndicator} />
        </View>
      </View>
    </View>
  );
}

const frameStyles = StyleSheet.create({
  outer: {
    width: PHONE_WIDTH * SCALE + 20,
    height: PHONE_HEIGHT * SCALE + 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  phone: {
    width: PHONE_WIDTH * SCALE,
    height: PHONE_HEIGHT * SCALE,
    borderRadius: 28,
    borderWidth: 3,
    borderColor: Colors.grey[700],
    backgroundColor: Colors.primary,
    overflow: 'hidden',
    position: 'relative',
  },
  notchContainer: {
    width: '100%',
    alignItems: 'center',
    position: 'absolute',
    top: 0,
    zIndex: 10,
  },
  notch: {
    width: NOTCH_WIDTH * SCALE,
    height: NOTCH_HEIGHT * SCALE,
    backgroundColor: Colors.grey[700],
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
  },
  screen: {
    flex: 1,
    overflow: 'hidden',
  },
  homeIndicatorContainer: {
    position: 'absolute',
    bottom: 4,
    width: '100%',
    alignItems: 'center',
    zIndex: 10,
  },
  homeIndicator: {
    width: 50 * SCALE,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.grey[500],
  },
});

// ─── Screenshot 1: Hero ─────────────────────────────────────

function HeroScreenshot() {
  return (
    <View style={[screenshotStyles.container, { backgroundColor: Colors.primary }]}>
      {/* Gold accent bar */}
      <View style={screenshotStyles.goldBar} />

      <View style={screenshotStyles.heroContent}>
        <Text style={screenshotStyles.heroEyebrow}>QUIDSAFE</Text>
        <Text style={screenshotStyles.heroTitle}>Track Your{'\n'}Tax,{'\n'}Effortlessly</Text>
        <Text style={screenshotStyles.heroSubtitle}>
          Smart tax tracking for UK sole traders
        </Text>
      </View>

      {/* Mini dashboard mockup */}
      <View style={screenshotStyles.dashboardMock}>
        <View style={screenshotStyles.dashCard}>
          <Text style={screenshotStyles.dashLabel}>Set Aside</Text>
          <Text style={screenshotStyles.dashAmount}>£2,847.40</Text>
          <View style={screenshotStyles.dashProgress}>
            <View style={[screenshotStyles.dashProgressFill, { width: '65%' }]} />
          </View>
        </View>
        <View style={screenshotStyles.dashRow}>
          <View style={[screenshotStyles.dashMini, { flex: 1, marginRight: 3 }]}>
            <Text style={screenshotStyles.dashMiniLabel}>Income</Text>
            <Text style={[screenshotStyles.dashMiniVal, { color: Colors.success }]}>£33,270</Text>
          </View>
          <View style={[screenshotStyles.dashMini, { flex: 1, marginLeft: 3 }]}>
            <Text style={screenshotStyles.dashMiniLabel}>Expenses</Text>
            <Text style={[screenshotStyles.dashMiniVal, { color: Colors.error }]}>£8,540</Text>
          </View>
        </View>
      </View>

      {/* Gold accent dots */}
      <View style={screenshotStyles.dotsRow}>
        {[0, 1, 2].map((i) => (
          <View key={i} style={screenshotStyles.goldDot} />
        ))}
      </View>
    </View>
  );
}

// ─── Screenshot 2: Auto-Categorise ──────────────────────────

function CategoriseScreenshot() {
  return (
    <View style={[screenshotStyles.container, { backgroundColor: Colors.primary }]}>
      <View style={screenshotStyles.headerSection}>
        <View style={screenshotStyles.iconCircle}>
          <FontAwesome name="magic" size={10 * SCALE + 6} color={Colors.accent} />
        </View>
        <Text style={screenshotStyles.screenTitle}>AI-Powered{'\n'}Categorisation</Text>
        <Text style={screenshotStyles.screenSubtitle}>
          Every transaction sorted automatically
        </Text>
      </View>

      <View style={screenshotStyles.txList}>
        {MOCK_TRANSACTIONS.map((tx, i) => (
          <View key={i} style={screenshotStyles.txRow}>
            <View style={screenshotStyles.txIcon}>
              <FontAwesome name={tx.icon} size={7 * SCALE + 4} color={Colors.white} />
            </View>
            <View style={screenshotStyles.txInfo}>
              <Text style={screenshotStyles.txName} numberOfLines={1}>{tx.name}</Text>
              <View style={screenshotStyles.txCatRow}>
                <Text style={screenshotStyles.txCategory}>{tx.category}</Text>
                <View style={screenshotStyles.confidenceBadge}>
                  <FontAwesome name="check" size={4 * SCALE + 2} color={Colors.accent} />
                  <Text style={screenshotStyles.confidenceText}>{tx.confidence}%</Text>
                </View>
              </View>
            </View>
            <Text style={screenshotStyles.txAmount}>{tx.amount}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

// ─── Screenshot 3: Tax Calculator ───────────────────────────

function TaxScreenshot() {
  return (
    <View style={[screenshotStyles.container, { backgroundColor: Colors.primary }]}>
      <View style={screenshotStyles.headerSection}>
        <View style={screenshotStyles.iconCircle}>
          <FontAwesome name="calculator" size={10 * SCALE + 6} color={Colors.accent} />
        </View>
        <Text style={screenshotStyles.screenTitle}>Know What{'\n'}You Owe</Text>
        <Text style={screenshotStyles.screenSubtitle}>
          Real-time tax breakdown
        </Text>
      </View>

      {/* Pie chart visual */}
      <View style={screenshotStyles.pieContainer}>
        <View style={screenshotStyles.pieOuter}>
          <View style={[screenshotStyles.pieSegment, { backgroundColor: Colors.accent, transform: [{ rotate: '0deg' }] }]} />
          <View style={[screenshotStyles.pieSegment, { backgroundColor: Colors.secondary, transform: [{ rotate: '120deg' }] }]} />
          <View style={[screenshotStyles.pieSegment, { backgroundColor: Colors.success, transform: [{ rotate: '240deg' }] }]} />
          <View style={screenshotStyles.pieCenter}>
            <Text style={screenshotStyles.pieCenterAmount}>£5,561</Text>
            <Text style={screenshotStyles.pieCenterLabel}>Total Tax</Text>
          </View>
        </View>
        <View style={screenshotStyles.pieLegend}>
          <View style={screenshotStyles.legendItem}>
            <View style={[screenshotStyles.legendDot, { backgroundColor: Colors.accent }]} />
            <Text style={screenshotStyles.legendText}>Income Tax</Text>
          </View>
          <View style={screenshotStyles.legendItem}>
            <View style={[screenshotStyles.legendDot, { backgroundColor: Colors.secondary }]} />
            <Text style={screenshotStyles.legendText}>Class 4 NI</Text>
          </View>
          <View style={screenshotStyles.legendItem}>
            <View style={[screenshotStyles.legendDot, { backgroundColor: Colors.success }]} />
            <Text style={screenshotStyles.legendText}>Class 2 NI</Text>
          </View>
        </View>
      </View>

      {/* Tax bands */}
      <View style={screenshotStyles.taxBands}>
        {TAX_BANDS.map((band, i) => (
          <View key={i} style={screenshotStyles.taxBandRow}>
            <View style={{ flex: 1 }}>
              <Text style={screenshotStyles.taxBandLabel}>{band.label}</Text>
              <Text style={screenshotStyles.taxBandRange}>{band.range}</Text>
            </View>
            <Text style={screenshotStyles.taxBandRate}>{band.rate}</Text>
            <Text style={screenshotStyles.taxBandAmount}>{band.amount}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

// ─── Screenshot 4: Invoicing ────────────────────────────────

function InvoiceScreenshot() {
  return (
    <View style={[screenshotStyles.container, { backgroundColor: Colors.primary }]}>
      <View style={screenshotStyles.headerSection}>
        <View style={screenshotStyles.iconCircle}>
          <FontAwesome name="file-text-o" size={10 * SCALE + 6} color={Colors.accent} />
        </View>
        <Text style={screenshotStyles.screenTitle}>Professional{'\n'}Invoices</Text>
        <Text style={screenshotStyles.screenSubtitle}>
          Create, send, and track payments
        </Text>
      </View>

      {/* Invoice card */}
      <View style={screenshotStyles.invoiceCard}>
        <View style={screenshotStyles.invoiceHeader}>
          <Text style={screenshotStyles.invoiceNumber}>INV-2026-042</Text>
          <View style={screenshotStyles.statusBadgePaid}>
            <Text style={screenshotStyles.statusBadgeText}>PAID</Text>
          </View>
        </View>
        <Text style={screenshotStyles.invoiceClient}>Acme Digital Ltd</Text>
        <Text style={screenshotStyles.invoiceDesc}>Website redesign - Phase 2</Text>
        <View style={screenshotStyles.invoiceDivider} />
        <View style={screenshotStyles.invoiceAmountRow}>
          <Text style={screenshotStyles.invoiceAmountLabel}>Total</Text>
          <Text style={screenshotStyles.invoiceAmountValue}>£3,200.00</Text>
        </View>
        <View style={screenshotStyles.invoiceFooter}>
          <View style={screenshotStyles.invoiceDateRow}>
            <FontAwesome name="calendar" size={5 * SCALE + 3} color={Colors.grey[400]} />
            <Text style={screenshotStyles.invoiceDateText}>Due: 15 Apr 2026</Text>
          </View>
          <View style={screenshotStyles.pdfButton}>
            <FontAwesome name="file-pdf-o" size={5 * SCALE + 3} color={Colors.accent} />
            <Text style={screenshotStyles.pdfText}>PDF</Text>
          </View>
        </View>
      </View>

      {/* Second invoice */}
      <View style={[screenshotStyles.invoiceCard, { marginTop: 5 * SCALE }]}>
        <View style={screenshotStyles.invoiceHeader}>
          <Text style={screenshotStyles.invoiceNumber}>INV-2026-041</Text>
          <View style={screenshotStyles.statusBadgePending}>
            <Text style={screenshotStyles.statusBadgeTextPending}>PENDING</Text>
          </View>
        </View>
        <Text style={screenshotStyles.invoiceClient}>Borough Council</Text>
        <Text style={screenshotStyles.invoiceDesc}>Consulting - March</Text>
        <View style={screenshotStyles.invoiceDivider} />
        <View style={screenshotStyles.invoiceAmountRow}>
          <Text style={screenshotStyles.invoiceAmountLabel}>Total</Text>
          <Text style={screenshotStyles.invoiceAmountValue}>£1,850.00</Text>
        </View>
        <View style={screenshotStyles.invoiceFooter}>
          <View style={screenshotStyles.invoiceDateRow}>
            <FontAwesome name="calendar" size={5 * SCALE + 3} color={Colors.grey[400]} />
            <Text style={screenshotStyles.invoiceDateText}>Due: 30 Apr 2026</Text>
          </View>
          <View style={screenshotStyles.pdfButton}>
            <FontAwesome name="file-pdf-o" size={5 * SCALE + 3} color={Colors.accent} />
            <Text style={screenshotStyles.pdfText}>PDF</Text>
          </View>
        </View>
      </View>

      {/* Third invoice (overdue) */}
      <View style={[screenshotStyles.invoiceCard, { marginTop: 5 * SCALE }]}>
        <View style={screenshotStyles.invoiceHeader}>
          <Text style={screenshotStyles.invoiceNumber}>INV-2026-038</Text>
          <View style={screenshotStyles.statusBadgeOverdue}>
            <Text style={screenshotStyles.statusBadgeTextOverdue}>OVERDUE</Text>
          </View>
        </View>
        <Text style={screenshotStyles.invoiceClient}>Freelance Co-op</Text>
        <Text style={screenshotStyles.invoiceDesc}>Brand identity package</Text>
        <View style={screenshotStyles.invoiceDivider} />
        <View style={screenshotStyles.invoiceAmountRow}>
          <Text style={screenshotStyles.invoiceAmountLabel}>Total</Text>
          <Text style={screenshotStyles.invoiceAmountValue}>£750.00</Text>
        </View>
      </View>
    </View>
  );
}

// ─── Screenshot 5: Bank Connection ──────────────────────────

function BankScreenshot() {
  return (
    <View style={[screenshotStyles.container, { backgroundColor: Colors.primary }]}>
      <View style={screenshotStyles.headerSection}>
        <View style={screenshotStyles.iconCircle}>
          <FontAwesome name="lock" size={10 * SCALE + 6} color={Colors.accent} />
        </View>
        <Text style={screenshotStyles.screenTitle}>Open Banking{'\n'}Connected</Text>
        <Text style={screenshotStyles.screenSubtitle}>
          Secure read-only access to your accounts
        </Text>
      </View>

      {/* Bank logos grid */}
      <View style={screenshotStyles.bankGrid}>
        {BANK_NAMES.map((bank, i) => (
          <View key={i} style={screenshotStyles.bankTile}>
            <View style={[screenshotStyles.bankLogo, { borderColor: bank.color }]}>
              <Text style={[screenshotStyles.bankInitial, { color: bank.color }]}>
                {bank.name.charAt(0)}
              </Text>
            </View>
            <Text style={screenshotStyles.bankName}>{bank.name}</Text>
          </View>
        ))}
      </View>

      {/* Security badges */}
      <View style={screenshotStyles.securitySection}>
        <View style={screenshotStyles.securityBadge}>
          <FontAwesome name="shield" size={7 * SCALE + 4} color={Colors.accent} />
          <Text style={screenshotStyles.securityText}>256-bit Encryption</Text>
        </View>
        <View style={screenshotStyles.securityBadge}>
          <FontAwesome name="eye" size={7 * SCALE + 4} color={Colors.accent} />
          <Text style={screenshotStyles.securityText}>Read-Only Access</Text>
        </View>
        <View style={screenshotStyles.securityBadge}>
          <FontAwesome name="check-circle" size={7 * SCALE + 4} color={Colors.accent} />
          <Text style={screenshotStyles.securityText}>FCA Regulated</Text>
        </View>
      </View>

      {/* Connected status */}
      <View style={screenshotStyles.connectedCard}>
        <View style={screenshotStyles.connectedDot} />
        <Text style={screenshotStyles.connectedText}>Barclays Business</Text>
        <Text style={screenshotStyles.connectedStatus}>Connected</Text>
      </View>
    </View>
  );
}

// ─── Main Screenshots Page ──────────────────────────────────

const SCREENSHOTS = [
  { label: 'Hero', component: HeroScreenshot },
  { label: 'Categorise', component: CategoriseScreenshot },
  { label: 'Tax', component: TaxScreenshot },
  { label: 'Invoices', component: InvoiceScreenshot },
  { label: 'Banking', component: BankScreenshot },
];

export default function ScreenshotsPage() {
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollRef = useRef<ScrollView>(null);
  const { colors } = useTheme();
  const itemWidth = PHONE_WIDTH * SCALE + 20 + Spacing.lg;

  const scrollToIndex = (index: number) => {
    setActiveIndex(index);
    scrollRef.current?.scrollTo({ x: index * itemWidth, animated: true });
  };

  return (
    <View style={[styles.page, { backgroundColor: Colors.grey[900] }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.pageTitle}>App Store Screenshots</Text>
        <Text style={styles.pageNote}>
          Use browser screenshot tool to capture each frame
        </Text>
      </View>

      {/* Selector row */}
      <View style={styles.selectorRow}>
        {SCREENSHOTS.map((s, i) => (
          <Pressable
            key={i}
            onPress={() => scrollToIndex(i)}
            style={[
              styles.selectorItem,
              activeIndex === i && styles.selectorItemActive,
            ]}
          >
            <View
              style={[
                styles.selectorCircle,
                activeIndex === i && styles.selectorCircleActive,
              ]}
            >
              <Text
                style={[
                  styles.selectorNumber,
                  activeIndex === i && styles.selectorNumberActive,
                ]}
              >
                {i + 1}
              </Text>
            </View>
            <Text
              style={[
                styles.selectorLabel,
                activeIndex === i && styles.selectorLabelActive,
              ]}
            >
              {s.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Screenshots ScrollView */}
      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={itemWidth}
        decelerationRate="fast"
        contentContainerStyle={styles.scrollContent}
        onMomentumScrollEnd={(e) => {
          const newIndex = Math.round(e.nativeEvent.contentOffset.x / itemWidth);
          setActiveIndex(Math.max(0, Math.min(newIndex, SCREENSHOTS.length - 1)));
        }}
      >
        {SCREENSHOTS.map((s, i) => {
          const ScreenComponent = s.component;
          return (
            <View key={i} style={styles.screenshotWrapper}>
              <PhoneFrame>
                <ScreenComponent />
              </PhoneFrame>
              <Text style={styles.screenshotLabel}>{s.label}</Text>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

// ─── Page Styles ────────────────────────────────────────────

const styles = StyleSheet.create({
  page: {
    flex: 1,
    paddingTop: 60,
  },
  header: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
  },
  pageTitle: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 22,
    color: Colors.white,
    marginBottom: 4,
  },
  pageNote: {
    fontFamily: 'Manrope_400Regular',
    fontSize: 13,
    color: Colors.grey[400],
  },
  selectorRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.lg,
    gap: Spacing.sm,
  },
  selectorItem: {
    alignItems: 'center',
    gap: 4,
  },
  selectorItemActive: {},
  selectorCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.grey[800],
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectorCircleActive: {
    backgroundColor: Colors.accent,
    borderColor: Colors.gold[100],
  },
  selectorNumber: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 14,
    color: Colors.grey[400],
  },
  selectorNumberActive: {
    color: Colors.white,
  },
  selectorLabel: {
    fontFamily: 'Manrope_500Medium',
    fontSize: 10,
    color: Colors.grey[500],
  },
  selectorLabelActive: {
    color: Colors.accent,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  screenshotWrapper: {
    marginRight: Spacing.lg,
    alignItems: 'center',
  },
  screenshotLabel: {
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 12,
    color: Colors.grey[400],
    marginTop: Spacing.sm,
  },
});

// ─── Screenshot Styles ──────────────────────────────────────

const s = SCALE;

const screenshotStyles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 12 * s,
    paddingTop: 22 * s,
  },

  // Hero
  goldBar: {
    width: 30 * s,
    height: 3 * s,
    backgroundColor: Colors.accent,
    borderRadius: 2,
    marginBottom: 10 * s,
    marginTop: 12 * s,
  },
  heroContent: {
    marginBottom: 14 * s,
  },
  heroEyebrow: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 8 * s + 2,
    color: Colors.accent,
    letterSpacing: 3,
    marginBottom: 6 * s,
  },
  heroTitle: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 18 * s + 4,
    color: Colors.white,
    lineHeight: 22 * s + 5,
    marginBottom: 6 * s,
  },
  heroSubtitle: {
    fontFamily: 'Manrope_400Regular',
    fontSize: 8 * s + 2,
    color: Colors.grey[400],
  },
  dashboardMock: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 10 * s,
    padding: 8 * s,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  dashCard: {
    marginBottom: 6 * s,
  },
  dashLabel: {
    fontFamily: 'Manrope_500Medium',
    fontSize: 7 * s + 2,
    color: Colors.grey[400],
    marginBottom: 2 * s,
  },
  dashAmount: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 16 * s + 3,
    color: Colors.accent,
    marginBottom: 4 * s,
  },
  dashProgress: {
    height: 4 * s,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 2 * s,
    overflow: 'hidden',
  },
  dashProgressFill: {
    height: '100%',
    backgroundColor: Colors.accent,
    borderRadius: 2 * s,
  },
  dashRow: {
    flexDirection: 'row',
  },
  dashMini: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 6 * s,
    padding: 6 * s,
  },
  dashMiniLabel: {
    fontFamily: 'Manrope_500Medium',
    fontSize: 6 * s + 1,
    color: Colors.grey[400],
    marginBottom: 2 * s,
  },
  dashMiniVal: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 10 * s + 2,
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 10 * s,
    gap: 4 * s,
  },
  goldDot: {
    width: 5 * s,
    height: 5 * s,
    borderRadius: 3 * s,
    backgroundColor: Colors.accent,
  },

  // Shared header
  headerSection: {
    alignItems: 'center',
    marginBottom: 10 * s,
  },
  iconCircle: {
    width: 28 * s,
    height: 28 * s,
    borderRadius: 14 * s,
    backgroundColor: 'rgba(202,138,4,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6 * s,
  },
  screenTitle: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 14 * s + 4,
    color: Colors.white,
    textAlign: 'center',
    lineHeight: 18 * s + 4,
    marginBottom: 4 * s,
  },
  screenSubtitle: {
    fontFamily: 'Manrope_400Regular',
    fontSize: 7 * s + 2,
    color: Colors.grey[400],
    textAlign: 'center',
  },

  // Transaction list
  txList: {
    gap: 4 * s,
  },
  txRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 6 * s,
    padding: 6 * s,
  },
  txIcon: {
    width: 18 * s,
    height: 18 * s,
    borderRadius: 9 * s,
    backgroundColor: Colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 5 * s,
  },
  txInfo: {
    flex: 1,
  },
  txName: {
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 7 * s + 1,
    color: Colors.white,
    marginBottom: 1 * s,
  },
  txCatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3 * s,
  },
  txCategory: {
    fontFamily: 'Manrope_500Medium',
    fontSize: 6 * s,
    color: Colors.grey[400],
  },
  confidenceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(202,138,4,0.15)',
    borderRadius: 4 * s,
    paddingHorizontal: 3 * s,
    paddingVertical: 1 * s,
    gap: 2 * s,
  },
  confidenceText: {
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 5 * s,
    color: Colors.accent,
  },
  txAmount: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 7 * s + 1,
    color: Colors.white,
    marginLeft: 4 * s,
  },

  // Tax
  pieContainer: {
    alignItems: 'center',
    marginBottom: 8 * s,
  },
  pieOuter: {
    width: 60 * s,
    height: 60 * s,
    borderRadius: 30 * s,
    backgroundColor: Colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6 * s,
    overflow: 'hidden',
  },
  pieSegment: {
    position: 'absolute',
    width: '50%',
    height: '50%',
    top: 0,
    left: 0,
    transformOrigin: 'bottom right',
  },
  pieCenter: {
    width: 36 * s,
    height: 36 * s,
    borderRadius: 18 * s,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  pieCenterAmount: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 9 * s + 2,
    color: Colors.accent,
  },
  pieCenterLabel: {
    fontFamily: 'Manrope_500Medium',
    fontSize: 5 * s,
    color: Colors.grey[400],
  },
  pieLegend: {
    flexDirection: 'row',
    gap: 8 * s,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3 * s,
  },
  legendDot: {
    width: 5 * s,
    height: 5 * s,
    borderRadius: 3 * s,
  },
  legendText: {
    fontFamily: 'Manrope_500Medium',
    fontSize: 6 * s,
    color: Colors.grey[300],
  },
  taxBands: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 6 * s,
    padding: 6 * s,
    gap: 4 * s,
  },
  taxBandRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  taxBandLabel: {
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 6 * s + 1,
    color: Colors.white,
  },
  taxBandRange: {
    fontFamily: 'Manrope_400Regular',
    fontSize: 5 * s,
    color: Colors.grey[500],
  },
  taxBandRate: {
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 6 * s,
    color: Colors.grey[300],
    width: 30 * s,
    textAlign: 'right',
    marginRight: 4 * s,
  },
  taxBandAmount: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 6 * s + 1,
    color: Colors.accent,
    width: 35 * s,
    textAlign: 'right',
  },

  // Invoice
  invoiceCard: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 8 * s,
    padding: 8 * s,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  invoiceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4 * s,
  },
  invoiceNumber: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 7 * s + 1,
    color: Colors.white,
  },
  statusBadgePaid: {
    backgroundColor: 'rgba(22,163,74,0.2)',
    paddingHorizontal: 5 * s,
    paddingVertical: 2 * s,
    borderRadius: 4 * s,
  },
  statusBadgeText: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 5 * s,
    color: Colors.success,
  },
  statusBadgePending: {
    backgroundColor: 'rgba(202,138,4,0.2)',
    paddingHorizontal: 5 * s,
    paddingVertical: 2 * s,
    borderRadius: 4 * s,
  },
  statusBadgeTextPending: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 5 * s,
    color: Colors.accent,
  },
  statusBadgeOverdue: {
    backgroundColor: 'rgba(220,38,38,0.2)',
    paddingHorizontal: 5 * s,
    paddingVertical: 2 * s,
    borderRadius: 4 * s,
  },
  statusBadgeTextOverdue: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 5 * s,
    color: Colors.error,
  },
  invoiceClient: {
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 7 * s + 1,
    color: Colors.grey[200],
    marginBottom: 2 * s,
  },
  invoiceDesc: {
    fontFamily: 'Manrope_400Regular',
    fontSize: 6 * s,
    color: Colors.grey[400],
    marginBottom: 4 * s,
  },
  invoiceDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
    marginBottom: 4 * s,
  },
  invoiceAmountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4 * s,
  },
  invoiceAmountLabel: {
    fontFamily: 'Manrope_500Medium',
    fontSize: 6 * s + 1,
    color: Colors.grey[400],
  },
  invoiceAmountValue: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 10 * s + 2,
    color: Colors.accent,
  },
  invoiceFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  invoiceDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3 * s,
  },
  invoiceDateText: {
    fontFamily: 'Manrope_400Regular',
    fontSize: 6 * s,
    color: Colors.grey[400],
  },
  pdfButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2 * s,
    backgroundColor: 'rgba(202,138,4,0.15)',
    paddingHorizontal: 5 * s,
    paddingVertical: 2 * s,
    borderRadius: 4 * s,
  },
  pdfText: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 5 * s + 1,
    color: Colors.accent,
  },

  // Bank
  bankGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 6 * s,
    marginBottom: 10 * s,
  },
  bankTile: {
    alignItems: 'center',
    width: 42 * s,
  },
  bankLogo: {
    width: 26 * s,
    height: 26 * s,
    borderRadius: 13 * s,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 3 * s,
  },
  bankInitial: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 10 * s + 2,
  },
  bankName: {
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 5 * s + 1,
    color: Colors.grey[300],
    textAlign: 'center',
  },
  securitySection: {
    gap: 4 * s,
    marginBottom: 8 * s,
  },
  securityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5 * s,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 6 * s,
    paddingVertical: 5 * s,
    paddingHorizontal: 8 * s,
  },
  securityText: {
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 7 * s + 1,
    color: Colors.white,
  },
  connectedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(22,163,74,0.1)',
    borderRadius: 6 * s,
    padding: 6 * s,
    borderWidth: 1,
    borderColor: 'rgba(22,163,74,0.2)',
  },
  connectedDot: {
    width: 5 * s,
    height: 5 * s,
    borderRadius: 3 * s,
    backgroundColor: Colors.success,
    marginRight: 5 * s,
  },
  connectedText: {
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 7 * s + 1,
    color: Colors.white,
    flex: 1,
  },
  connectedStatus: {
    fontFamily: 'Manrope_500Medium',
    fontSize: 6 * s,
    color: Colors.success,
  },
});
