import { describe, it, expect } from 'vitest';

// Email regex inlined from signup.tsx
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isValidEmail(email: string): boolean {
  return EMAIL_REGEX.test(email);
}

// ─── Valid email addresses ───────────────────────────────

describe('email regex - valid addresses', () => {
  it('accepts a standard email', () => {
    expect(isValidEmail('user@example.com')).toBe(true);
  });

  it('accepts plus-addressed email', () => {
    expect(isValidEmail('user+tag@example.com')).toBe(true);
  });

  it('accepts subdomain email', () => {
    expect(isValidEmail('hello@mail.example.co.uk')).toBe(true);
  });

  it('accepts numeric local part', () => {
    expect(isValidEmail('123@domain.org')).toBe(true);
  });

  it('accepts hyphenated domain', () => {
    expect(isValidEmail('contact@my-company.io')).toBe(true);
  });

  it('accepts uppercase characters', () => {
    expect(isValidEmail('User@Example.COM')).toBe(true);
  });
});

// ─── Invalid email addresses ─────────────────────────────

describe('email regex - invalid addresses', () => {
  it('rejects email with no @ symbol', () => {
    expect(isValidEmail('userexample.com')).toBe(false);
  });

  it('rejects email with no domain after @', () => {
    expect(isValidEmail('user@')).toBe(false);
  });

  it('rejects email with no TLD (no dot after @)', () => {
    expect(isValidEmail('user@domain')).toBe(false);
  });

  it('rejects email containing spaces', () => {
    expect(isValidEmail('user @example.com')).toBe(false);
  });

  it('rejects email with space in domain', () => {
    expect(isValidEmail('user@exa mple.com')).toBe(false);
  });

  it('rejects completely empty string', () => {
    expect(isValidEmail('')).toBe(false);
  });

  it('rejects @ symbol alone', () => {
    expect(isValidEmail('@')).toBe(false);
  });

  it('rejects multiple @ symbols', () => {
    // regex allows this if no spaces, but double-@ fails because second
    // segment becomes empty or violates [^\s@]+
    expect(isValidEmail('a@@b.com')).toBe(false);
  });
});

// ─── Edge cases ──────────────────────────────────────────

describe('email regex - edge cases', () => {
  it('rejects dot-only local part before @', () => {
    // The regex requires at least one [^\s@] before @
    expect(isValidEmail('@example.com')).toBe(false);
  });

  it('accepts very long but valid-format email', () => {
    const long = 'a'.repeat(64) + '@' + 'b'.repeat(60) + '.com';
    expect(isValidEmail(long)).toBe(true);
  });

  it('rejects email ending with dot (no TLD part after dot)', () => {
    // "user@example." - the part after the last dot is empty, failing [^\s@]+
    expect(isValidEmail('user@example.')).toBe(false);
  });
});
