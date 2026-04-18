import { describe, it, expect } from 'vitest';
import { isAdmin } from '../adminAuth';

describe('isAdmin', () => {
  it('returns false when ADMIN_EMAILS is unset', () => {
    expect(isAdmin('nate@example.com', undefined)).toBe(false);
    expect(isAdmin('nate@example.com', '')).toBe(false);
  });

  it('returns false when email is unset', () => {
    expect(isAdmin(undefined, 'nate@example.com')).toBe(false);
  });

  it('matches a single email exactly', () => {
    expect(isAdmin('nate@example.com', 'nate@example.com')).toBe(true);
    expect(isAdmin('other@example.com', 'nate@example.com')).toBe(false);
  });

  it('matches any email in a comma-separated list', () => {
    const list = 'nate@example.com, co@example.com ,third@example.com';
    expect(isAdmin('co@example.com', list)).toBe(true);
    expect(isAdmin('third@example.com', list)).toBe(true);
    expect(isAdmin('unknown@example.com', list)).toBe(false);
  });

  it('is case-insensitive on the email comparison', () => {
    expect(isAdmin('NATE@example.com', 'nate@example.com')).toBe(true);
    expect(isAdmin('nate@example.com', 'NATE@EXAMPLE.COM')).toBe(true);
  });

  it('ignores whitespace-only entries', () => {
    expect(isAdmin('nate@example.com', ' , ,nate@example.com, ')).toBe(true);
  });
});
