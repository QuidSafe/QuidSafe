import { useState, useMemo, useRef, useCallback } from 'react';
import {
  StyleSheet, View, Text, Pressable, Animated, Platform, useWindowDimensions, TextInput, ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  Shield, Lock, Zap, TrendingUp, FileText, Receipt, Download, Check, X, ArrowRight,
  AlertTriangle, PoundSterling, FileQuestion, Users, Smartphone, Car, ShoppingBag, GraduationCap,
  Scissors, Dumbbell, Sparkles, Dog, Wrench, Clock,
} from 'lucide-react-native';
import { Colors, colors, Spacing } from '@/constants/Colors';
import { Fonts } from '@/constants/Typography';
import { calculateTax, formatCurrency } from '@/lib/tax-engine';
import { BrandLogo } from '@/components/ui/BrandLogo';

// ─── Data ─────────────────────────────────────────────────

const PERSONAS = [
  { Icon: Car, label: 'Delivery drivers', hint: 'Uber, Deliveroo, Just Eat' },
  { Icon: ShoppingBag, label: 'Online sellers', hint: 'Etsy, eBay, Vinted' },
  { Icon: GraduationCap, label: 'Tutors', hint: 'Maths, music, languages' },
  { Icon: Scissors, label: 'Hairdressers', hint: 'Mobile or chair' },
  { Icon: Dumbbell, label: 'Personal trainers', hint: 'Gym or online' },
  { Icon: Sparkles, label: 'Cleaners', hint: 'Domestic or office' },
  { Icon: Dog, label: 'Dog walkers', hint: 'Pet care, boarding' },
  { Icon: Wrench, label: 'Tradespeople', hint: 'Sparks, plumbers, builders' },
] as const;

const PROBLEMS = [
  {
    Icon: AlertTriangle,
    problem: 'January panic',
    problemBody: "You realise in January that you owe thousands. Cash you don't have. Penalties if you're late.",
    solution: 'Live tax number',
    solutionBody: 'Your tax bill updates every time money lands. You always know what to set aside.',
  },
  {
    Icon: PoundSterling,
    problem: 'Paying too much',
    problemBody: 'You forget half your expenses. Fuel, phone, a new drill. HMRC keeps the difference.',
    solution: 'Every expense caught',
    solutionBody: 'Open Banking pulls every transaction. AI tags the allowable ones using HMRC categories.',
  },
  {
    Icon: FileQuestion,
    problem: 'MTD is confusing',
    problemBody: 'Quarterly submissions, digital records, penalty points. Most accountants charge extra for it.',
    solution: 'Submissions on autopilot',
    solutionBody: 'Quarterly updates to HMRC generated and filed for you. One button.',
  },
] as const;

const FEATURES = [
  { Icon: Zap, title: 'AI categorisation', body: 'Every transaction tagged automatically with HMRC expense categories.' },
  { Icon: TrendingUp, title: 'Live tax counter', body: 'Your tax bill and set-aside amount update in real time as income lands.' },
  { Icon: Lock, title: 'Bank-grade security', body: 'Read-only Open Banking via TrueLayer. AES-256 encryption end to end.' },
  { Icon: FileText, title: 'MTD submissions', body: 'Quarterly updates filed directly to HMRC. No spreadsheets. No stress.' },
  { Icon: Receipt, title: 'Invoicing', body: 'Professional PDF invoices. Send to clients in two taps.' },
  { Icon: Download, title: 'CSV export', body: 'Export everything for your accountant or your records any time.' },
] as const;

const COMPETITORS = [
  { feature: 'Price per month', qs: '£7.99', qb: '£10-36', fa: '£19+' },
  { feature: 'MTD quarterly filing', qs: true, qb: true, fa: true },
  { feature: 'AI auto-categorisation', qs: true, qb: false, fa: false },
  { feature: 'Plain-English tax', qs: true, qb: false, fa: false },
  { feature: 'Setup time', qs: '5 min', qb: '30-60 min', fa: '30 min' },
] as const;

const OBJECTIONS = [
  {
    Icon: Shield,
    q: 'Is my data safe?',
    a: 'Read-only Open Banking via TrueLayer (FCA authorised). We see transactions, we can never move money. AES-256 encryption, UK-hosted on Cloudflare.',
  },
  {
    Icon: Users,
    q: 'I already have an accountant',
    a: 'Perfect. QuidSafe keeps records in the shape they need. Export CSVs any time. Many users pay their accountant less because the books arrive tidy.',
  },
  {
    Icon: Smartphone,
    q: "I'm not tech-savvy",
    a: 'If you can open your banking app, you can use QuidSafe. Plain English everywhere. No jargon. No spreadsheets. 5 minutes to set up.',
  },
] as const;

const HOW_IT_WORKS = [
  { step: '01', title: 'Sign up', body: 'Create an account, answer three questions about your trade.' },
  { step: '02', title: 'Connect', body: 'Link your bank with one tap via Open Banking. Sync starts.' },
  { step: '03', title: 'Relax', body: 'Watch your live tax number. Submit quarterly with one button.' },
] as const;

// ─── Helpers ──────────────────────────────────────────────

const clampIncome = (n: number) => Math.max(0, Math.min(500_000, n));
const numericOnly = (v: string) => v.replace(/[^\d.]/g, '');

// ─── Sub-components ───────────────────────────────────────

function StickyNav({ onCta, onSignIn, scrollY, isDesktop }: {
  onCta: () => void;
  onSignIn: () => void;
  scrollY: Animated.Value;
  isDesktop: boolean;
}) {
  const bg = scrollY.interpolate({
    inputRange: [0, 80],
    outputRange: ['rgba(0,0,0,0)', 'rgba(0,0,0,0.92)'],
    extrapolate: 'clamp',
  });
  const border = scrollY.interpolate({
    inputRange: [0, 80],
    outputRange: ['rgba(42,42,42,0)', 'rgba(42,42,42,1)'],
    extrapolate: 'clamp',
  });
  return (
    <Animated.View style={[s.nav, { backgroundColor: bg, borderBottomColor: border }]}>
      <View style={[s.navInner, !isDesktop && s.navInnerMobile]}>
        <BrandLogo size={22} textSize={18} />
        <View style={s.navRight}>
          {isDesktop && (
            <Pressable hitSlop={8} onPress={onSignIn} accessibilityRole="button" accessibilityLabel="Log in">
              <Text style={s.navLink}>Log in</Text>
            </Pressable>
          )}
          <Pressable
            style={({ pressed }) => [s.navCta, pressed && { opacity: 0.85 }]}
            onPress={onCta}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Start 30 day trial"
          >
            <Text style={s.navCtaText}>Start trial</Text>
          </Pressable>
        </View>
      </View>
    </Animated.View>
  );
}

function HeroSection({ isDesktop, onCta }: { isDesktop: boolean; onCta: () => void }) {
  return (
    <View style={[s.hero, isDesktop && s.heroDesktop]}>
      <View style={[s.heroCol, isDesktop && s.heroColLeft]}>
        <View style={s.urgencyBadge}>
          <AlertTriangle size={12} color={Colors.warning} strokeWidth={2} />
          <Text style={s.urgencyText}>MTD for Income Tax is mandatory from April 2026</Text>
        </View>
        <Text style={[s.heroTitle, !isDesktop && s.heroTitleMobile]} accessibilityRole="header">
          Know what you owe.{'\n'}Before HMRC does.
        </Text>
        <Text style={[s.heroSubtitle, !isDesktop && s.heroSubtitleMobile]}>
          QuidSafe connects to your bank, auto-categorises every transaction, and shows your live tax bill in plain English. Ready for Making Tax Digital.
        </Text>
        <View style={s.ctaRow}>
          <Pressable
            style={({ pressed }) => [s.primaryBtn, pressed && s.btnPressed]}
            onPress={onCta}
            accessibilityRole="button"
            accessibilityLabel="Start 30 day trial"
          >
            <Text style={s.primaryBtnText}>Start 30-day trial</Text>
            <ArrowRight size={16} color={Colors.white} strokeWidth={2} />
          </Pressable>
          <Text style={s.ctaHint}>Card required. Cancel anytime in 2 clicks.</Text>
        </View>
        <View style={s.trustRow}>
          <View style={s.trustChip}>
            <Shield size={12} color={colors.textSecondary} strokeWidth={1.5} />
            <Text style={s.trustText}>FCA Open Banking</Text>
          </View>
          <View style={s.trustChip}>
            <Lock size={12} color={colors.textSecondary} strokeWidth={1.5} />
            <Text style={s.trustText}>AES-256 encrypted</Text>
          </View>
          <View style={s.trustChip}>
            <Check size={12} color={Colors.success} strokeWidth={2} />
            <Text style={s.trustText}>MTD compliant</Text>
          </View>
        </View>
      </View>
      {isDesktop && (
        <View style={[s.heroCol, s.heroColRight]}>
          <HeroMockup />
        </View>
      )}
    </View>
  );
}

function HeroMockup() {
  return (
    <View style={s.mockup} accessibilityLabel="Dashboard preview">
      <View style={s.mockupTop}>
        <Text style={s.mockupLabel}>TAX OWED 2025/26</Text>
        <View style={s.mockupDot} />
      </View>
      <Text style={s.mockupBig}>£4,127</Text>
      <Text style={s.mockupCaption}>on £23,800 of income</Text>
      <View style={s.mockupSetAside}>
        <View>
          <Text style={s.mockupSetLabel}>SET ASIDE MONTHLY</Text>
          <Text style={s.mockupSetVal}>£344</Text>
        </View>
        <View style={s.mockupBadge}>
          <Check size={11} color={Colors.success} strokeWidth={2} />
          <Text style={s.mockupBadgeText}>On track</Text>
        </View>
      </View>
      <View style={s.mockupBreakdown}>
        <View style={s.mockupRow}><Text style={s.mockupRowLabel}>Income Tax</Text><Text style={s.mockupRowVal}>£2,248</Text></View>
        <View style={s.mockupRow}><Text style={s.mockupRowLabel}>NI Class 4</Text><Text style={s.mockupRowVal}>£1,696</Text></View>
        <View style={s.mockupRow}><Text style={s.mockupRowLabel}>NI Class 2</Text><Text style={s.mockupRowVal}>£183</Text></View>
      </View>
    </View>
  );
}

function PersonaStrip() {
  return (
    <View style={s.section}>
      <Text style={s.sectionEyebrow}>WHO IT&apos;S FOR</Text>
      <Text style={s.sectionTitle}>Built for every kind of sole trader.</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={s.personaRow}
        style={{ marginHorizontal: -Spacing.lg }}
      >
        {PERSONAS.map(({ Icon, label, hint }) => (
          <View key={label} style={s.personaCard}>
            <View style={s.personaIcon}>
              <Icon size={20} color={Colors.electricBlue} strokeWidth={1.5} />
            </View>
            <Text style={s.personaLabel}>{label}</Text>
            <Text style={s.personaHint}>{hint}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

function MtdBanner() {
  return (
    <View style={s.mtdBanner}>
      <View style={s.mtdIcon}>
        <AlertTriangle size={20} color={Colors.warning} strokeWidth={2} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={s.mtdTitle}>Making Tax Digital is now mandatory.</Text>
        <Text style={s.mtdBody}>
          From April 2026, sole traders earning over £50,000 must keep digital records and submit quarterly updates to HMRC.
          Missing a quarter means penalty points. Four points = £200 fine.
        </Text>
        <Text style={s.mtdBody}>QuidSafe handles the digital records and submissions automatically.</Text>
      </View>
    </View>
  );
}

function ProblemSolutionSection({ isDesktop }: { isDesktop: boolean }) {
  return (
    <View style={s.section}>
      <Text style={s.sectionEyebrow}>THE REAL PROBLEMS</Text>
      <Text style={s.sectionTitle}>We built QuidSafe because this is broken.</Text>
      <View style={{ gap: Spacing.xl, marginTop: Spacing.lg }}>
        {PROBLEMS.map(({ Icon, problem, problemBody, solution, solutionBody }, i) => (
          <View key={problem} style={[s.psRow, isDesktop && (i % 2 === 0 ? s.psRowDesktop : s.psRowDesktopRev)]}>
            <View style={s.psHalf}>
              <View style={s.psIconBad}>
                <Icon size={18} color={Colors.error} strokeWidth={1.5} />
              </View>
              <Text style={s.psLabel}>THE PROBLEM</Text>
              <Text style={s.psTitle}>{problem}</Text>
              <Text style={s.psBody}>{problemBody}</Text>
            </View>
            <View style={s.psHalf}>
              <View style={s.psIconGood}>
                <Check size={18} color={Colors.success} strokeWidth={2} />
              </View>
              <Text style={s.psLabelGood}>QUIDSAFE FIX</Text>
              <Text style={s.psTitle}>{solution}</Text>
              <Text style={s.psBody}>{solutionBody}</Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

function TaxCalculator({ onCta, isDesktop }: { onCta: () => void; isDesktop: boolean }) {
  const [incomeStr, setIncomeStr] = useState('35000');
  const [expensesStr, setExpensesStr] = useState('5000');

  const result = useMemo(() => {
    try {
      const income = clampIncome(parseFloat(incomeStr) || 0);
      const expenses = clampIncome(parseFloat(expensesStr) || 0);
      return calculateTax({ totalIncome: income, totalExpenses: expenses });
    } catch {
      return null;
    }
  }, [incomeStr, expensesStr]);

  return (
    <View style={[s.section, s.calcSection]}>
      <Text style={s.sectionEyebrow}>TRY IT - NO SIGNUP</Text>
      <Text style={s.sectionTitle}>How much tax will you owe this year?</Text>
      <Text style={s.sectionSubtitle}>
        Real UK tax calculation. Income Tax + Class 2 + Class 4 NI. Based on the 2025/26 tax year.
      </Text>

      <View style={[s.calcWrap, isDesktop && s.calcWrapDesktop]}>
        <View style={[s.calcInputs, isDesktop && s.calcInputsDesktop]}>
          <View style={s.calcField}>
            <Text style={s.calcLabel}>Annual income (£)</Text>
            <View style={s.calcInputWrap}>
              <Text style={s.calcPrefix}>£</Text>
              <TextInput
                style={s.calcInput}
                value={incomeStr}
                onChangeText={(v) => setIncomeStr(numericOnly(v))}
                keyboardType="numeric"
                inputMode="decimal"
                placeholder="35000"
                placeholderTextColor={colors.textMuted}
                accessibilityLabel="Annual income in pounds"
              />
            </View>
          </View>
          <View style={s.calcField}>
            <Text style={s.calcLabel}>Annual expenses (£)</Text>
            <View style={s.calcInputWrap}>
              <Text style={s.calcPrefix}>£</Text>
              <TextInput
                style={s.calcInput}
                value={expensesStr}
                onChangeText={(v) => setExpensesStr(numericOnly(v))}
                keyboardType="numeric"
                inputMode="decimal"
                placeholder="5000"
                placeholderTextColor={colors.textMuted}
                accessibilityLabel="Annual allowable expenses in pounds"
              />
            </View>
            <Text style={s.calcHint}>Fuel, phone, kit, subscriptions, home office</Text>
          </View>
        </View>

        <View style={[s.calcOutput, isDesktop && s.calcOutputDesktop]}>
          <Text style={s.calcOutLabel}>YOU&apos;LL OWE</Text>
          <Text style={s.calcOutBig}>{result ? formatCurrency(result.totalTaxOwed) : '-'}</Text>
          {result && result.totalTaxOwed > 0 && (
            <Text style={s.calcOutHint}>
              That&apos;s {formatCurrency(result.setAsideMonthly)} a month to set aside.
            </Text>
          )}
          {result && (
            <View style={s.calcBreakdown}>
              <View style={s.calcBrRow}>
                <Text style={s.calcBrLabel}>Income Tax</Text>
                <Text style={s.calcBrVal}>{formatCurrency(result.incomeTax.total)}</Text>
              </View>
              <View style={s.calcBrRow}>
                <Text style={s.calcBrLabel}>NI (Class 2 + 4)</Text>
                <Text style={s.calcBrVal}>{formatCurrency(result.nationalInsurance.total)}</Text>
              </View>
              <View style={s.calcBrRow}>
                <Text style={s.calcBrLabel}>Effective rate</Text>
                <Text style={s.calcBrVal}>{result.effectiveRate}%</Text>
              </View>
            </View>
          )}
          <Pressable
            style={({ pressed }) => [s.primaryBtn, s.calcCta, pressed && s.btnPressed]}
            onPress={onCta}
            accessibilityRole="button"
            accessibilityLabel="Start tracking my tax automatically"
          >
            <Text style={s.primaryBtnText}>Track this automatically</Text>
            <ArrowRight size={16} color={Colors.white} strokeWidth={2} />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

function FeaturesGrid({ isDesktop }: { isDesktop: boolean }) {
  return (
    <View style={[s.section, s.featuresSection]}>
      <Text style={s.sectionEyebrow}>WHAT YOU GET</Text>
      <Text style={s.sectionTitle}>Everything a sole trader needs. Nothing they don&apos;t.</Text>
      <View style={[s.featureGrid, isDesktop && s.featureGridDesktop]}>
        {FEATURES.map(({ Icon, title, body }) => (
          <View key={title} style={[s.featureCard, isDesktop && s.featureCardDesktop]}>
            <View style={s.featureIcon}>
              <Icon size={18} color={Colors.electricBlue} strokeWidth={1.5} />
            </View>
            <Text style={s.featureTitle}>{title}</Text>
            <Text style={s.featureBody}>{body}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function ComparisonTable({ isDesktop }: { isDesktop: boolean }) {
  const renderCell = (v: string | boolean) => {
    if (v === true) return <Check size={16} color={Colors.success} strokeWidth={2} />;
    if (v === false) return <X size={16} color={Colors.muted} strokeWidth={2} />;
    return <Text style={s.cmpCellText}>{v}</Text>;
  };
  if (!isDesktop) {
    return (
      <View style={s.section}>
        <Text style={s.sectionEyebrow}>HOW WE COMPARE</Text>
        <Text style={s.sectionTitle}>Less faff. Less cost. Same HMRC compliance.</Text>
        <View style={s.cmpCardsStack}>
          {(['qs', 'qb', 'fa'] as const).map((key) => (
            <View key={key} style={[s.cmpCard, key === 'qs' && s.cmpCardHighlight]}>
              <Text style={[s.cmpCardTitle, key === 'qs' && s.cmpCardTitleHighlight]}>
                {key === 'qs' ? 'QuidSafe' : key === 'qb' ? 'QuickBooks' : 'FreeAgent'}
              </Text>
              {COMPETITORS.map((row) => (
                <View key={row.feature} style={s.cmpRow}>
                  <Text style={s.cmpRowLabel}>{row.feature}</Text>
                  <View style={s.cmpRowVal}>{renderCell(row[key])}</View>
                </View>
              ))}
            </View>
          ))}
        </View>
      </View>
    );
  }
  return (
    <View style={s.section}>
      <Text style={s.sectionEyebrow}>HOW WE COMPARE</Text>
      <Text style={s.sectionTitle}>Less faff. Less cost. Same HMRC compliance.</Text>
      <View style={s.cmpTable}>
        <View style={s.cmpHeader}>
          <Text style={s.cmpHeadCell}>Feature</Text>
          <Text style={[s.cmpHeadCell, s.cmpHeadCellHighlight]}>QuidSafe</Text>
          <Text style={s.cmpHeadCell}>QuickBooks</Text>
          <Text style={s.cmpHeadCell}>FreeAgent</Text>
        </View>
        {COMPETITORS.map((row, i) => (
          <View key={row.feature} style={[s.cmpTableRow, i === COMPETITORS.length - 1 && s.cmpTableRowLast]}>
            <Text style={s.cmpFeatureLabel}>{row.feature}</Text>
            <View style={[s.cmpDataCell, s.cmpDataCellHighlight]}>{renderCell(row.qs)}</View>
            <View style={s.cmpDataCell}>{renderCell(row.qb)}</View>
            <View style={s.cmpDataCell}>{renderCell(row.fa)}</View>
          </View>
        ))}
      </View>
    </View>
  );
}

function HowItWorks({ isDesktop }: { isDesktop: boolean }) {
  return (
    <View style={s.section}>
      <Text style={s.sectionEyebrow}>HOW IT WORKS</Text>
      <Text style={s.sectionTitle}>Three steps. Five minutes total.</Text>
      <View style={[s.stepsRow, !isDesktop && s.stepsRowMobile]}>
        {HOW_IT_WORKS.map(({ step, title, body }, i) => (
          <View key={step} style={s.stepCard}>
            <View style={s.stepNumWrap}>
              <Text style={s.stepNum}>{step}</Text>
              {i < HOW_IT_WORKS.length - 1 && isDesktop && <View style={s.stepLine} />}
            </View>
            <Text style={s.stepTitle}>{title}</Text>
            <Text style={s.stepBody}>{body}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function PricingSection({ annual, setAnnual, onCta }: { annual: boolean; setAnnual: (v: boolean) => void; onCta: () => void }) {
  const price = annual ? '79.99' : '7.99';
  const interval = annual ? '/year' : '/month';
  const saveText = annual ? 'Save £16 a year' : 'Cancel anytime, no lock-in';
  return (
    <View style={s.section}>
      <Text style={s.sectionEyebrow}>PRICING</Text>
      <Text style={s.sectionTitle}>One plan. Everything included.</Text>
      <View style={s.toggleWrap}>
        <Pressable
          onPress={() => setAnnual(false)}
          style={[s.toggleOpt, !annual && s.toggleOptActive]}
          accessibilityRole="button"
          accessibilityLabel="Monthly billing"
          accessibilityState={{ selected: !annual }}
        >
          <Text style={[s.toggleText, !annual && s.toggleTextActive]}>Monthly</Text>
        </Pressable>
        <Pressable
          onPress={() => setAnnual(true)}
          style={[s.toggleOpt, annual && s.toggleOptActive]}
          accessibilityRole="button"
          accessibilityLabel="Yearly billing, save 17 percent"
          accessibilityState={{ selected: annual }}
        >
          <Text style={[s.toggleText, annual && s.toggleTextActive]}>Yearly</Text>
          <View style={s.saveBadge}><Text style={s.saveBadgeText}>SAVE 17%</Text></View>
        </Pressable>
      </View>

      <View style={s.priceCard}>
        <Text style={s.priceEyebrow}>QUIDSAFE PRO</Text>
        <View style={s.priceRow}>
          <Text style={s.priceCurrency}>£</Text>
          <Text style={s.priceBig}>{price}</Text>
          <Text style={s.priceInterval}>{interval}</Text>
        </View>
        <Text style={s.priceSave}>{saveText}</Text>
        <View style={s.priceIncludes}>
          {[
            'Unlimited bank accounts',
            'AI auto-categorisation',
            'Live tax calculation',
            'MTD quarterly submissions',
            'Invoice creation',
            'CSV export',
            'Email support',
          ].map((f) => (
            <View key={f} style={s.priceIncludeRow}>
              <Check size={14} color={Colors.success} strokeWidth={2} />
              <Text style={s.priceIncludeText}>{f}</Text>
            </View>
          ))}
        </View>
        <Pressable
          style={({ pressed }) => [s.primaryBtn, s.priceCta, pressed && s.btnPressed]}
          onPress={onCta}
          accessibilityRole="button"
          accessibilityLabel="Start 30 day trial"
        >
          <Text style={s.primaryBtnText}>Start 30-day trial</Text>
          <ArrowRight size={16} color={Colors.white} strokeWidth={2} />
        </Pressable>
        <Text style={s.priceFinePrint}>
          Card required. Cancel anytime in 2 clicks. Prices include VAT. VAT-registered traders can reclaim.
        </Text>
      </View>
    </View>
  );
}

function ObjectionCards({ isDesktop }: { isDesktop: boolean }) {
  return (
    <View style={s.section}>
      <Text style={s.sectionEyebrow}>HONEST ANSWERS</Text>
      <Text style={s.sectionTitle}>The three things you&apos;re wondering.</Text>
      <View style={[s.objGrid, isDesktop && s.objGridDesktop]}>
        {OBJECTIONS.map(({ Icon, q, a }) => (
          <View key={q} style={[s.objCard, isDesktop && s.objCardDesktop]}>
            <View style={s.objIcon}>
              <Icon size={18} color={Colors.electricBlue} strokeWidth={1.5} />
            </View>
            <Text style={s.objQ}>{q}</Text>
            <Text style={s.objA}>{a}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function SocialProofBand() {
  return (
    <View style={s.proofBand}>
      <Clock size={14} color={colors.textSecondary} strokeWidth={1.5} />
      <Text style={s.proofText}>
        Currently in early access with sole traders across the UK. Built in Britain.
      </Text>
    </View>
  );
}

function FinalCta({ onCta }: { onCta: () => void }) {
  return (
    <View style={s.finalCta}>
      <Text style={s.finalEyebrow}>READY WHEN YOU ARE</Text>
      <Text style={s.finalTitle}>Get compliant in 5 minutes.{'\n'}Thirty days, on us.</Text>
      <Text style={s.finalBody}>
        Start your 30-day trial. We&apos;ll import your bank history, categorise everything, and show you what you actually owe. Cancel anytime.
      </Text>
      <Pressable
        style={({ pressed }) => [s.primaryBtn, { marginTop: Spacing.lg }, pressed && s.btnPressed]}
        onPress={onCta}
        accessibilityRole="button"
        accessibilityLabel="Start 30 day trial"
      >
        <Text style={s.primaryBtnText}>Start 30-day trial</Text>
        <ArrowRight size={16} color={Colors.white} strokeWidth={2} />
      </Pressable>
    </View>
  );
}

function SiteFooter({ router, isDesktop }: { router: ReturnType<typeof useRouter>; isDesktop: boolean }) {
  return (
    <View style={s.footer}>
      <View style={[s.footerInner, !isDesktop && s.footerInnerMobile]}>
        <View style={s.footerBrand}>
          <BrandLogo size={20} textSize={16} />
          <Text style={s.footerTagline}>Tax tracking for UK sole traders.</Text>
        </View>
        <View style={s.footerLinks}>
          <Pressable onPress={() => router.push('/about')} hitSlop={6}><Text style={s.footerLink}>About</Text></Pressable>
          <Pressable onPress={() => router.push('/privacy')} hitSlop={6}><Text style={s.footerLink}>Privacy</Text></Pressable>
          <Pressable onPress={() => router.push('/terms')} hitSlop={6}><Text style={s.footerLink}>Terms</Text></Pressable>
          <Pressable onPress={() => router.push('/cookie-policy')} hitSlop={6}><Text style={s.footerLink}>Cookies</Text></Pressable>
        </View>
      </View>
      <View style={s.footerBottom}>
        <Text style={s.footerFine}>
          QuidSafe Ltd. Open Banking connectivity by TrueLayer (FCA authorised AISP). QuidSafe is a tax tracking tool, not a financial adviser or FCA-regulated firm. Always check HMRC guidance for your specific circumstances.
        </Text>
        <Text style={s.footerFine}>© 2026 QuidSafe Ltd. All rights reserved.</Text>
      </View>
    </View>
  );
}

// ─── Main Component ──────────────────────────────────────

export default function LandingScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 1024;
  const scrollY = useRef(new Animated.Value(0)).current;
  const [annual, setAnnual] = useState(true);

  const handleCta = useCallback(() => router.push('/(auth)/signup'), [router]);
  const handleSignIn = useCallback(() => router.push('/(auth)/login'), [router]);

  return (
    <View style={s.root}>
      <StickyNav onCta={handleCta} onSignIn={handleSignIn} scrollY={scrollY} isDesktop={isDesktop} />
      <Animated.ScrollView
        contentContainerStyle={[s.scroll, isDesktop && s.scrollDesktop]}
        scrollEventThrottle={16}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: false })}
      >
        <HeroSection isDesktop={isDesktop} onCta={handleCta} />
        <PersonaStrip />
        <MtdBanner />
        <ProblemSolutionSection isDesktop={isDesktop} />
        <TaxCalculator onCta={handleCta} isDesktop={isDesktop} />
        <FeaturesGrid isDesktop={isDesktop} />
        <ComparisonTable isDesktop={isDesktop} />
        <HowItWorks isDesktop={isDesktop} />
        <PricingSection annual={annual} setAnnual={setAnnual} onCta={handleCta} />
        <ObjectionCards isDesktop={isDesktop} />
        <SocialProofBand />
        <FinalCta onCta={handleCta} />
        <SiteFooter router={router} isDesktop={isDesktop} />
      </Animated.ScrollView>
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.black },
  scroll: { paddingTop: 56 },
  scrollDesktop: { paddingTop: 64 },

  nav: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 100, borderBottomWidth: 1 },
  navInner: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl, paddingVertical: 14, maxWidth: 1200, width: '100%', alignSelf: 'center',
  },
  navInnerMobile: { paddingHorizontal: Spacing.lg, paddingVertical: 10 },
  navRight: { flexDirection: 'row', alignItems: 'center', gap: Spacing.lg },
  navLink: { fontFamily: Fonts.sourceSans.regular, fontSize: 13, color: colors.textSecondary },
  navCta: { backgroundColor: Colors.electricBlue, paddingHorizontal: 16, paddingVertical: 9, borderRadius: 8 },
  navCtaText: { fontFamily: Fonts.sourceSans.semiBold, fontSize: 13, color: Colors.white },

  hero: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.xl, paddingBottom: Spacing.xxl, maxWidth: 1200, width: '100%', alignSelf: 'center' },
  heroDesktop: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.xxl, paddingTop: 72, paddingBottom: 96, gap: Spacing.xxl },
  heroCol: { flex: 1 },
  heroColLeft: { maxWidth: 560 },
  heroColRight: { minWidth: 0, maxWidth: 520 },

  urgencyBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: 'rgba(255,149,0,0.12)', borderWidth: 1, borderColor: 'rgba(255,149,0,0.3)',
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, alignSelf: 'flex-start',
    marginBottom: Spacing.lg,
  },
  urgencyText: { fontFamily: Fonts.sourceSans.semiBold, fontSize: 11, color: Colors.warning, letterSpacing: 0.3 },

  heroTitle: {
    fontFamily: Fonts.lexend.semiBold, fontSize: 56, lineHeight: 60, letterSpacing: -1.5,
    color: Colors.white, marginBottom: Spacing.lg,
  },
  heroTitleMobile: { fontSize: 40, lineHeight: 44, letterSpacing: -1 },
  heroSubtitle: {
    fontFamily: Fonts.sourceSans.regular, fontSize: 17, lineHeight: 26,
    color: colors.textSecondary, marginBottom: Spacing.xl,
  },
  heroSubtitleMobile: { fontSize: 15, lineHeight: 22 },

  ctaRow: { gap: 10, marginBottom: Spacing.xl },
  ctaHint: { fontFamily: Fonts.sourceSans.regular, fontSize: 12, color: colors.textMuted },

  primaryBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, backgroundColor: Colors.electricBlue, paddingHorizontal: 24, paddingVertical: 16,
    borderRadius: 10, alignSelf: 'flex-start',
  },
  primaryBtnText: { fontFamily: Fonts.sourceSans.semiBold, fontSize: 15, color: Colors.white },
  btnPressed: { opacity: 0.88, transform: [{ scale: 0.98 }] },

  trustRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 4 },
  trustChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: Colors.charcoal, borderWidth: 1, borderColor: colors.border,
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999,
  },
  trustText: { fontFamily: Fonts.sourceSans.regular, fontSize: 11, color: colors.textSecondary },

  mockup: {
    backgroundColor: Colors.charcoal, borderWidth: 1, borderColor: colors.border,
    borderRadius: 16, padding: 24,
  },
  mockupTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  mockupLabel: { fontFamily: Fonts.sourceSans.semiBold, fontSize: 10, color: colors.textMuted, letterSpacing: 1 },
  mockupDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.success },
  mockupBig: { fontFamily: Fonts.mono.semiBold, fontSize: 44, color: Colors.white, letterSpacing: -1, marginTop: 8 },
  mockupCaption: { fontFamily: Fonts.sourceSans.regular, fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  mockupSetAside: {
    marginTop: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: Colors.blueGlow, borderRadius: 10, padding: 14,
  },
  mockupSetLabel: { fontFamily: Fonts.sourceSans.semiBold, fontSize: 10, color: colors.textSecondary, letterSpacing: 0.6 },
  mockupSetVal: { fontFamily: Fonts.mono.semiBold, fontSize: 22, color: Colors.electricBlue, marginTop: 2 },
  mockupBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(0,200,83,0.12)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999,
  },
  mockupBadgeText: { fontFamily: Fonts.sourceSans.semiBold, fontSize: 11, color: Colors.success },
  mockupBreakdown: { marginTop: 16, gap: 6 },
  mockupRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  mockupRowLabel: { fontFamily: Fonts.sourceSans.regular, fontSize: 12, color: colors.textSecondary },
  mockupRowVal: { fontFamily: Fonts.mono.regular, fontSize: 12, color: colors.text },

  section: {
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.xxl,
    maxWidth: 1200, width: '100%', alignSelf: 'center',
  },
  sectionEyebrow: { fontFamily: Fonts.sourceSans.semiBold, fontSize: 11, color: Colors.electricBlue, letterSpacing: 1.4, marginBottom: 10 },
  sectionTitle: { fontFamily: Fonts.lexend.semiBold, fontSize: 28, lineHeight: 34, letterSpacing: -0.6, color: Colors.white, marginBottom: Spacing.sm, maxWidth: 720 },
  sectionSubtitle: { fontFamily: Fonts.sourceSans.regular, fontSize: 15, lineHeight: 22, color: colors.textSecondary, maxWidth: 620, marginBottom: Spacing.lg },

  personaRow: { gap: 10, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md },
  personaCard: {
    width: 150, backgroundColor: Colors.charcoal, borderWidth: 1, borderColor: colors.border,
    borderRadius: 12, padding: 14,
  },
  personaIcon: {
    width: 32, height: 32, borderRadius: 8, backgroundColor: Colors.blueGlow,
    alignItems: 'center', justifyContent: 'center', marginBottom: 10,
  },
  personaLabel: { fontFamily: Fonts.sourceSans.semiBold, fontSize: 13, color: Colors.white },
  personaHint: { fontFamily: Fonts.sourceSans.regular, fontSize: 11, color: colors.textMuted, marginTop: 2 },

  mtdBanner: {
    flexDirection: 'row', gap: Spacing.md, maxWidth: 1200, width: '100%',
    alignSelf: 'center', marginHorizontal: Spacing.lg, marginVertical: Spacing.xl,
    backgroundColor: 'rgba(255,149,0,0.08)', borderWidth: 1, borderColor: 'rgba(255,149,0,0.25)',
    borderRadius: 12, padding: Spacing.lg,
  },
  mtdIcon: {
    width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(255,149,0,0.15)',
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  mtdTitle: { fontFamily: Fonts.lexend.semiBold, fontSize: 17, color: Colors.white, marginBottom: 6 },
  mtdBody: { fontFamily: Fonts.sourceSans.regular, fontSize: 14, lineHeight: 21, color: colors.textSecondary, marginBottom: 4 },

  psRow: { gap: Spacing.lg },
  psRowDesktop: { flexDirection: 'row', gap: Spacing.xl, alignItems: 'stretch' },
  psRowDesktopRev: { flexDirection: 'row-reverse', gap: Spacing.xl, alignItems: 'stretch' },
  psHalf: {
    flex: 1, backgroundColor: Colors.charcoal, borderWidth: 1, borderColor: colors.border,
    borderRadius: 12, padding: Spacing.lg,
  },
  psIconBad: {
    width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(255,59,48,0.12)',
    alignItems: 'center', justifyContent: 'center', marginBottom: 12,
  },
  psIconGood: {
    width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(0,200,83,0.12)',
    alignItems: 'center', justifyContent: 'center', marginBottom: 12,
  },
  psLabel: { fontFamily: Fonts.sourceSans.semiBold, fontSize: 10, color: Colors.error, letterSpacing: 1, marginBottom: 4 },
  psLabelGood: { fontFamily: Fonts.sourceSans.semiBold, fontSize: 10, color: Colors.success, letterSpacing: 1, marginBottom: 4 },
  psTitle: { fontFamily: Fonts.lexend.semiBold, fontSize: 18, color: Colors.white, marginBottom: 6 },
  psBody: { fontFamily: Fonts.sourceSans.regular, fontSize: 14, lineHeight: 21, color: colors.textSecondary },

  calcSection: { borderTopWidth: 1, borderBottomWidth: 1, borderColor: colors.border, backgroundColor: Colors.charcoal },
  calcWrap: { marginTop: Spacing.md, gap: Spacing.lg },
  calcWrapDesktop: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.xl },
  calcInputs: { gap: Spacing.md },
  calcInputsDesktop: { flex: 1 },
  calcField: { gap: 6 },
  calcLabel: { fontFamily: Fonts.sourceSans.semiBold, fontSize: 12, color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.6 },
  calcInputWrap: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.darkGrey, borderWidth: 1, borderColor: colors.border,
    borderRadius: 10, paddingHorizontal: 14, paddingVertical: 14,
  },
  calcPrefix: { fontFamily: Fonts.mono.semiBold, fontSize: 18, color: colors.textMuted, marginRight: 6 },
  calcInput: {
    flex: 1, fontFamily: Fonts.mono.semiBold, fontSize: 20, color: Colors.white, padding: 0,
    ...(Platform.OS === 'web' ? { outlineStyle: 'none' as unknown as undefined } : {}),
  },
  calcHint: { fontFamily: Fonts.sourceSans.regular, fontSize: 11, color: colors.textMuted },
  calcOutput: {
    backgroundColor: Colors.black, borderWidth: 1, borderColor: Colors.electricBlue,
    borderRadius: 12, padding: Spacing.lg,
  },
  calcOutputDesktop: { flex: 1 },
  calcOutLabel: { fontFamily: Fonts.sourceSans.semiBold, fontSize: 10, color: colors.textSecondary, letterSpacing: 1.2 },
  calcOutBig: { fontFamily: Fonts.mono.semiBold, fontSize: 52, color: Colors.white, letterSpacing: -1.5, marginTop: 4 },
  calcOutHint: { fontFamily: Fonts.sourceSans.regular, fontSize: 13, color: colors.textSecondary, marginTop: 4 },
  calcBreakdown: { marginTop: Spacing.md, gap: 8, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: Spacing.md },
  calcBrRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  calcBrLabel: { fontFamily: Fonts.sourceSans.regular, fontSize: 13, color: colors.textSecondary },
  calcBrVal: { fontFamily: Fonts.mono.regular, fontSize: 13, color: Colors.white },
  calcCta: { marginTop: Spacing.lg, alignSelf: 'stretch' },

  featuresSection: { backgroundColor: Colors.charcoal },
  featureGrid: { gap: Spacing.md, marginTop: Spacing.md },
  featureGridDesktop: { flexDirection: 'row', flexWrap: 'wrap' },
  featureCard: {
    backgroundColor: Colors.black, borderWidth: 1, borderColor: colors.border,
    borderRadius: 12, padding: Spacing.lg,
  },
  featureCardDesktop: { flex: 1, minWidth: 280, flexBasis: '30%' },
  featureIcon: {
    width: 36, height: 36, borderRadius: 10, backgroundColor: Colors.blueGlow,
    alignItems: 'center', justifyContent: 'center', marginBottom: 12,
  },
  featureTitle: { fontFamily: Fonts.lexend.semiBold, fontSize: 16, color: Colors.white, marginBottom: 4 },
  featureBody: { fontFamily: Fonts.sourceSans.regular, fontSize: 13, lineHeight: 20, color: colors.textSecondary },

  cmpTable: {
    marginTop: Spacing.md, backgroundColor: Colors.charcoal,
    borderWidth: 1, borderColor: colors.border, borderRadius: 12, overflow: 'hidden',
  },
  cmpHeader: {
    flexDirection: 'row', paddingVertical: Spacing.md, paddingHorizontal: Spacing.lg,
    borderBottomWidth: 1, borderBottomColor: colors.border, backgroundColor: Colors.darkGrey,
  },
  cmpHeadCell: { flex: 1, fontFamily: Fonts.sourceSans.semiBold, fontSize: 12, color: colors.textSecondary, letterSpacing: 0.5 },
  cmpHeadCellHighlight: { color: Colors.electricBlue },
  cmpTableRow: { flexDirection: 'row', paddingVertical: Spacing.md, paddingHorizontal: Spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.border, alignItems: 'center' },
  cmpTableRowLast: { borderBottomWidth: 0 },
  cmpFeatureLabel: { flex: 1, fontFamily: Fonts.sourceSans.regular, fontSize: 14, color: colors.text },
  cmpDataCell: { flex: 1, alignItems: 'flex-start' },
  cmpDataCellHighlight: {},
  cmpCellText: { fontFamily: Fonts.sourceSans.semiBold, fontSize: 13, color: colors.textSecondary },
  cmpCardsStack: { gap: Spacing.md, marginTop: Spacing.md },
  cmpCard: { backgroundColor: Colors.charcoal, borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: Spacing.lg },
  cmpCardHighlight: { borderColor: Colors.electricBlue, backgroundColor: Colors.blueGlow },
  cmpCardTitle: { fontFamily: Fonts.lexend.semiBold, fontSize: 16, color: Colors.white, marginBottom: 12 },
  cmpCardTitleHighlight: { color: Colors.electricBlue },
  cmpRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 6 },
  cmpRowLabel: { fontFamily: Fonts.sourceSans.regular, fontSize: 13, color: colors.textSecondary },
  cmpRowVal: { flexDirection: 'row', alignItems: 'center' },

  stepsRow: { flexDirection: 'row', gap: Spacing.lg, marginTop: Spacing.md },
  stepsRowMobile: { flexDirection: 'column' },
  stepCard: { flex: 1, gap: 6 },
  stepNumWrap: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 6 },
  stepNum: { fontFamily: Fonts.lexend.semiBold, fontSize: 40, color: Colors.electricBlue, letterSpacing: -1 },
  stepLine: { flex: 1, height: 1, backgroundColor: colors.border },
  stepTitle: { fontFamily: Fonts.lexend.semiBold, fontSize: 18, color: Colors.white },
  stepBody: { fontFamily: Fonts.sourceSans.regular, fontSize: 14, lineHeight: 21, color: colors.textSecondary, maxWidth: 300 },

  toggleWrap: {
    flexDirection: 'row', gap: 6, backgroundColor: Colors.charcoal,
    borderWidth: 1, borderColor: colors.border, borderRadius: 10, padding: 4,
    alignSelf: 'flex-start', marginTop: Spacing.md, marginBottom: Spacing.lg,
  },
  toggleOpt: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 6 },
  toggleOptActive: { backgroundColor: Colors.electricBlue },
  toggleText: { fontFamily: Fonts.sourceSans.semiBold, fontSize: 13, color: colors.textSecondary },
  toggleTextActive: { color: Colors.white },
  saveBadge: { backgroundColor: 'rgba(0,200,83,0.2)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  saveBadgeText: { fontFamily: Fonts.sourceSans.semiBold, fontSize: 9, color: Colors.success, letterSpacing: 0.5 },
  priceCard: {
    backgroundColor: Colors.charcoal, borderWidth: 1, borderColor: Colors.electricBlue,
    borderRadius: 16, padding: Spacing.xl, maxWidth: 480,
  },
  priceEyebrow: { fontFamily: Fonts.sourceSans.semiBold, fontSize: 11, color: Colors.electricBlue, letterSpacing: 1.2, marginBottom: 12 },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', gap: 4 },
  priceCurrency: { fontFamily: Fonts.lexend.semiBold, fontSize: 28, color: Colors.white, marginRight: 2 },
  priceBig: { fontFamily: Fonts.mono.semiBold, fontSize: 64, color: Colors.white, letterSpacing: -2 },
  priceInterval: { fontFamily: Fonts.sourceSans.regular, fontSize: 16, color: colors.textSecondary },
  priceSave: { fontFamily: Fonts.sourceSans.semiBold, fontSize: 12, color: Colors.success, marginTop: 4 },
  priceIncludes: { marginTop: Spacing.lg, gap: 10 },
  priceIncludeRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  priceIncludeText: { fontFamily: Fonts.sourceSans.regular, fontSize: 14, color: colors.text },
  priceCta: { marginTop: Spacing.lg, alignSelf: 'stretch' },
  priceFinePrint: { fontFamily: Fonts.sourceSans.regular, fontSize: 11, lineHeight: 16, color: colors.textMuted, marginTop: Spacing.md, textAlign: 'center' },

  objGrid: { gap: Spacing.md, marginTop: Spacing.md },
  objGridDesktop: { flexDirection: 'row', gap: Spacing.md },
  objCard: {
    backgroundColor: Colors.charcoal, borderWidth: 1, borderColor: colors.border,
    borderRadius: 12, padding: Spacing.lg,
  },
  objCardDesktop: { flex: 1 },
  objIcon: {
    width: 36, height: 36, borderRadius: 10, backgroundColor: Colors.blueGlow,
    alignItems: 'center', justifyContent: 'center', marginBottom: 12,
  },
  objQ: { fontFamily: Fonts.lexend.semiBold, fontSize: 16, color: Colors.white, marginBottom: 8 },
  objA: { fontFamily: Fonts.sourceSans.regular, fontSize: 14, lineHeight: 21, color: colors.textSecondary },

  proofBand: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    paddingVertical: Spacing.lg, paddingHorizontal: Spacing.lg,
    borderTopWidth: 1, borderBottomWidth: 1, borderColor: colors.border,
  },
  proofText: { fontFamily: Fonts.sourceSans.regular, fontSize: 12, color: colors.textSecondary },

  finalCta: {
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.xxl,
    alignItems: 'center', maxWidth: 720, width: '100%', alignSelf: 'center',
  },
  finalEyebrow: { fontFamily: Fonts.sourceSans.semiBold, fontSize: 11, color: Colors.electricBlue, letterSpacing: 1.4, marginBottom: 12 },
  finalTitle: { fontFamily: Fonts.lexend.semiBold, fontSize: 36, lineHeight: 42, letterSpacing: -0.8, color: Colors.white, textAlign: 'center', marginBottom: Spacing.md },
  finalBody: { fontFamily: Fonts.sourceSans.regular, fontSize: 15, lineHeight: 23, color: colors.textSecondary, textAlign: 'center', maxWidth: 520 },

  footer: { borderTopWidth: 1, borderTopColor: colors.border, paddingTop: Spacing.xl, paddingBottom: Spacing.lg, paddingHorizontal: Spacing.lg },
  footerInner: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', maxWidth: 1200, width: '100%', alignSelf: 'center', marginBottom: Spacing.lg },
  footerInnerMobile: { flexDirection: 'column', alignItems: 'flex-start', gap: Spacing.lg },
  footerBrand: { gap: 6 },
  footerTagline: { fontFamily: Fonts.sourceSans.regular, fontSize: 12, color: colors.textMuted },
  footerLinks: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.lg },
  footerLink: { fontFamily: Fonts.sourceSans.regular, fontSize: 13, color: colors.textSecondary },
  footerBottom: { maxWidth: 1200, width: '100%', alignSelf: 'center', gap: 6, paddingTop: Spacing.md, borderTopWidth: 1, borderTopColor: colors.border },
  footerFine: { fontFamily: Fonts.sourceSans.regular, fontSize: 11, lineHeight: 16, color: colors.textMuted },
});
