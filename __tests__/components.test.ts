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

describe('Colors constants', () => {
  it('has Trust Navy as primary (#0F172A)', () => {
    expect(Colors.primary).toBe('#0F172A');
  });

  it('has Royal Blue as secondary (#1E3A8A)', () => {
    expect(Colors.secondary).toBe('#1E3A8A');
  });

  it('has Warm Gold as accent (#CA8A04)', () => {
    expect(Colors.accent).toBe('#CA8A04');
  });

  it('has Success Green (#16A34A)', () => {
    expect(Colors.success).toBe('#16A34A');
  });

  it('has Error Red (#DC2626)', () => {
    expect(Colors.error).toBe('#DC2626');
  });

  it('has white (#FFFFFF)', () => {
    expect(Colors.white).toBe('#FFFFFF');
  });

  it('has dark theme object (dark-only mode)', () => {
    expect(Colors.dark).toBeDefined();
    expect(Colors.dark.text).toBe('#FFFFFF');
    expect(Colors.dark.background).toBe('#000000');
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
    expect(BorderRadius.card).toBe(16);
    expect(BorderRadius.input).toBe(12);
    expect(BorderRadius.pill).toBe(9999);
    expect(BorderRadius.button).toBe(12);
    expect(BorderRadius.hero).toBe(24);
  });
});

// ─── Shadows constants ──────────────────────────────────

describe('Shadows constants', () => {
  it('has soft, medium, and large shadow presets', () => {
    expect(Shadows.soft).toBeDefined();
    expect(Shadows.medium).toBeDefined();
    expect(Shadows.large).toBeDefined();
  });

  it('soft shadow has expected properties', () => {
    expect(Shadows.soft.shadowColor).toBe('#0F172A');
    expect(Shadows.soft.elevation).toBe(2);
  });

  it('elevation increases with shadow intensity', () => {
    expect(Shadows.soft.elevation).toBeLessThan(Shadows.medium.elevation);
    expect(Shadows.medium.elevation).toBeLessThan(Shadows.large.elevation);
  });
});
