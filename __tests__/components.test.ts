import { describe, it, expect } from 'vitest';
import { Colors, Spacing, BorderRadius, Shadows } from '../constants/Colors';

// ─── DateInput formatting logic ─────────────────────────
// Extracted from components/ui/DateInput.tsx handleNativeChange
// We test the pure formatting logic without rendering the component.

function formatDateDigits(text: string): { display: string; isoOutput: string } {
  const digits = text.replace(/\D/g, '');

  let formatted = '';
  if (digits.length <= 2) {
    formatted = digits;
  } else if (digits.length <= 4) {
    formatted = `${digits.slice(0, 2)}/${digits.slice(2)}`;
  } else {
    formatted = `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4, 8)}`;
  }

  let iso = '';
  if (digits.length === 8) {
    const dd = digits.slice(0, 2);
    const mm = digits.slice(2, 4);
    const yyyy = digits.slice(4, 8);
    iso = `${yyyy}-${mm}-${dd}`;
  }

  return { display: formatted, isoOutput: iso };
}

/** Extracted from DateInput: convert ISO value to display format */
function isoToDisplay(value: string): string {
  if (!value) return '';
  const parts = value.split('-');
  if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
  return '';
}

describe('DateInput formatting logic', () => {
  it('formats 8 digits as DD/MM/YYYY display', () => {
    const result = formatDateDigits('25122025');
    expect(result.display).toBe('25/12/2025');
  });

  it('produces YYYY-MM-DD ISO output for 8 digits', () => {
    const result = formatDateDigits('25122025');
    expect(result.isoOutput).toBe('2025-12-25');
  });

  it('formats partial input (2 digits) as DD', () => {
    const result = formatDateDigits('25');
    expect(result.display).toBe('25');
    expect(result.isoOutput).toBe('');
  });

  it('formats partial input (4 digits) as DD/MM', () => {
    const result = formatDateDigits('2512');
    expect(result.display).toBe('25/12');
    expect(result.isoOutput).toBe('');
  });

  it('formats 6 digits as DD/MM/YY (partial year)', () => {
    const result = formatDateDigits('251220');
    expect(result.display).toBe('25/12/20');
    expect(result.isoOutput).toBe('');
  });

  it('strips non-digit characters', () => {
    const result = formatDateDigits('25/12/2025');
    expect(result.display).toBe('25/12/2025');
    expect(result.isoOutput).toBe('2025-12-25');
  });

  it('handles empty string', () => {
    const result = formatDateDigits('');
    expect(result.display).toBe('');
    expect(result.isoOutput).toBe('');
  });

  it('converts ISO value to display format', () => {
    expect(isoToDisplay('2025-12-25')).toBe('25/12/2025');
    expect(isoToDisplay('2026-01-05')).toBe('05/01/2026');
  });

  it('returns empty string for empty ISO value', () => {
    expect(isoToDisplay('')).toBe('');
  });

  it('returns empty string for non-3-part value', () => {
    expect(isoToDisplay('notadate')).toBe('');
  });
});

// ─── Colors constants ───────────────────────────────────

// Tokens branch on Platform.OS at module load - Vitest resolves react-native
// to react-native-web, so these values reflect the web (light) palette.
describe('Colors constants', () => {
  it('exposes a brand-accent that is stable across platforms', () => {
    expect(Colors.secondary).toBe('#0066FF');
    expect(Colors.accent).toBe('#0066FF');
  });

  it('exposes status colours as valid hex strings', () => {
    expect(Colors.success).toMatch(/^#[0-9A-F]{6}$/i);
    expect(Colors.error).toMatch(/^#[0-9A-F]{6}$/i);
    expect(Colors.warning).toMatch(/^#[0-9A-F]{6}$/i);
  });

  it('exposes primary text/background tokens as hex strings', () => {
    expect(Colors.primary).toMatch(/^#[0-9A-F]{6}$/i);
    expect(Colors.white).toMatch(/^#[0-9A-F]{6}$/i);
  });

  it('exposes a nested dark theme object with required tokens', () => {
    expect(Colors.dark).toBeDefined();
    expect(Colors.dark.text).toMatch(/^#[0-9A-F]{6}$/i);
    expect(Colors.dark.background).toMatch(/^#[0-9A-F]{6}$/i);
  });
});

// ─── Spacing constants ──────────────────────────────────

describe('Spacing constants', () => {
  it('has expected spacing values', () => {
    expect(Spacing.xs).toBe(4);
    expect(Spacing.sm).toBe(8);
    expect(Spacing.md).toBe(16);
    expect(Spacing.lg).toBe(24);
    expect(Spacing.xl).toBe(32);
    expect(Spacing.xxl).toBe(48);
  });
});

// ─── BorderRadius constants ─────────────────────────────

describe('BorderRadius constants', () => {
  it('has expected border radius values', () => {
    expect(BorderRadius.card).toBe(12);
    expect(BorderRadius.input).toBe(8);
    expect(BorderRadius.pill).toBe(999);
    expect(BorderRadius.button).toBe(8);
  });
});

// ─── Shadows removed from design system ─────────────────

describe('Shadows constants (legacy compat)', () => {
  it('exports zeroed-out shadow presets for backward compat', () => {
    expect(Shadows.soft).toBeDefined();
    expect(Shadows.soft.elevation).toBe(0);
    expect(Shadows.medium.elevation).toBe(0);
    expect(Shadows.large.elevation).toBe(0);
  });
});
