import { describe, it, expect } from 'vitest';
import {
  createInvoiceSchema,
  sendInvoiceEmailSchema,
  updateSettingsSchema,
} from '../validation';

// ─── createInvoiceSchema ─────────────────────────────────

describe('createInvoiceSchema', () => {
  const valid = {
    clientName: 'BigCorp Ltd',
    clientEmail: 'billing@bigcorp.com',
    description: 'Q1 consulting work',
    amount: 1500,
    dueDate: '2026-05-01',
  };

  it('accepts a fully valid invoice payload', () => {
    const result = createInvoiceSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it('accepts payload without optional clientEmail', () => {
    const { clientEmail: _omit, ...withoutEmail } = valid;
    const result = createInvoiceSchema.safeParse(withoutEmail);
    expect(result.success).toBe(true);
  });

  it('fails when clientName is missing', () => {
    const { clientName: _omit, ...missing } = valid;
    const result = createInvoiceSchema.safeParse(missing);
    expect(result.success).toBe(false);
  });

  it('fails when description is missing', () => {
    const { description: _omit, ...missing } = valid;
    const result = createInvoiceSchema.safeParse(missing);
    expect(result.success).toBe(false);
  });

  it('fails when amount is missing', () => {
    const { amount: _omit, ...missing } = valid;
    const result = createInvoiceSchema.safeParse(missing);
    expect(result.success).toBe(false);
  });

  it('fails when dueDate is missing', () => {
    const { dueDate: _omit, ...missing } = valid;
    const result = createInvoiceSchema.safeParse(missing);
    expect(result.success).toBe(false);
  });

  it('fails when amount is negative', () => {
    const result = createInvoiceSchema.safeParse({ ...valid, amount: -100 });
    expect(result.success).toBe(false);
  });

  it('fails when amount is zero', () => {
    const result = createInvoiceSchema.safeParse({ ...valid, amount: 0 });
    expect(result.success).toBe(false);
  });

  it('fails when dueDate is not ISO format', () => {
    const result = createInvoiceSchema.safeParse({ ...valid, dueDate: '01/05/2026' });
    expect(result.success).toBe(false);
  });

  it('fails when clientEmail is an invalid email', () => {
    const result = createInvoiceSchema.safeParse({ ...valid, clientEmail: 'not-an-email' });
    expect(result.success).toBe(false);
  });

  it('trims whitespace from clientName', () => {
    const result = createInvoiceSchema.safeParse({ ...valid, clientName: '  BigCorp  ' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.clientName).toBe('BigCorp');
    }
  });
});

// ─── sendInvoiceEmailSchema ──────────────────────────────

describe('sendInvoiceEmailSchema', () => {
  it('accepts a valid recipient email', () => {
    const result = sendInvoiceEmailSchema.safeParse({ recipientEmail: 'client@example.com' });
    expect(result.success).toBe(true);
  });

  it('fails for an invalid email format', () => {
    const result = sendInvoiceEmailSchema.safeParse({ recipientEmail: 'notvalid' });
    expect(result.success).toBe(false);
  });

  it('fails when recipientEmail is missing', () => {
    const result = sendInvoiceEmailSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it('fails when recipientEmail is empty string', () => {
    const result = sendInvoiceEmailSchema.safeParse({ recipientEmail: '' });
    expect(result.success).toBe(false);
  });

  it('accepts email with plus addressing', () => {
    const result = sendInvoiceEmailSchema.safeParse({ recipientEmail: 'user+invoice@domain.co.uk' });
    expect(result.success).toBe(true);
  });
});

// ─── updateSettingsSchema ────────────────────────────────

describe('updateSettingsSchema', () => {
  it('accepts an empty object (all fields optional)', () => {
    const result = updateSettingsSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it('accepts a valid NINO', () => {
    const result = updateSettingsSchema.safeParse({ nino: 'AB123456C' });
    expect(result.success).toBe(true);
  });

  it('rejects a NINO with wrong format (lowercase)', () => {
    const result = updateSettingsSchema.safeParse({ nino: 'ab123456c' });
    expect(result.success).toBe(false);
  });

  it('rejects a NINO that is too short', () => {
    const result = updateSettingsSchema.safeParse({ nino: 'AB12345C' });
    expect(result.success).toBe(false);
  });

  it('rejects a NINO with wrong suffix (number instead of letter)', () => {
    const result = updateSettingsSchema.safeParse({ nino: 'AB1234561' });
    expect(result.success).toBe(false);
  });

  it('accepts notification boolean flags', () => {
    const result = updateSettingsSchema.safeParse({
      notifyTaxDeadlines: true,
      notifyWeeklySummary: false,
      notifyTransactionAlerts: true,
      notifyMtdReady: false,
    });
    expect(result.success).toBe(true);
  });

  it('rejects non-boolean notification values', () => {
    const result = updateSettingsSchema.safeParse({ notifyTaxDeadlines: 'yes' });
    expect(result.success).toBe(false);
  });

  it('accepts a valid name string', () => {
    const result = updateSettingsSchema.safeParse({ name: 'Jane Smith' });
    expect(result.success).toBe(true);
  });

  it('rejects a name exceeding 200 characters', () => {
    const result = updateSettingsSchema.safeParse({ name: 'A'.repeat(201) });
    expect(result.success).toBe(false);
  });
});
