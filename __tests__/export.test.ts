import { describe, it, expect } from 'vitest';
import {
  exportTransactionsCSV,
  exportExpensesCSV,
  exportInvoicesCSV,
  exportTaxSummaryCSV,
} from '../lib/export';
import type { Transaction, Expense, Invoice, TaxCalculation } from '../lib/types';

// ─── Helpers ─────────────────────────────────────────────

function makeTransaction(overrides: Partial<Transaction> = {}): Transaction {
  return {
    id: 'tx-1',
    userId: 'user-1',
    amount: 150.5,
    currency: 'GBP',
    description: 'Web design work',
    merchantName: 'Acme Ltd',
    aiCategory: 'income',
    userOverride: false,
    isIncome: true,
    isExpenseClaimable: false,
    incomeSource: 'freelance',
    transactionDate: '2026-03-15',
    createdAt: '2026-03-15T10:00:00Z',
    ...overrides,
  };
}

function makeExpense(overrides: Partial<Expense> = {}): Expense {
  return {
    id: 'exp-1',
    userId: 'user-1',
    amount: 49.99,
    description: 'Office supplies',
    hmrcCategory: 'Office costs',
    date: '2026-02-20',
    createdAt: '2026-02-20T10:00:00Z',
    ...overrides,
  };
}

function makeInvoice(overrides: Partial<Invoice> = {}): Invoice {
  return {
    id: 'inv-1',
    userId: 'user-1',
    clientName: 'BigCorp',
    clientEmail: 'billing@bigcorp.com',
    amount: 2400,
    description: 'Q1 consulting',
    status: 'paid',
    dueDate: '2026-04-01',
    paidAt: '2026-03-28',
    createdAt: '2026-03-01T10:00:00Z',
    ...overrides,
  };
}

function makeTaxCalculation(overrides: Partial<TaxCalculation> = {}): TaxCalculation {
  return {
    taxYear: '2026/27',
    quarter: 1,
    totalIncome: 50000,
    totalExpenses: 5000,
    netProfit: 45000,
    personalAllowance: 12570,
    taxableIncome: 32430,
    incomeTax: { basicRate: 6486, higherRate: 0, additionalRate: 0, total: 6486 },
    nationalInsurance: { class2: 179.4, class4: 1945.8, total: 2125.2 },
    totalTaxOwed: 8611.2,
    setAsideMonthly: 717.6,
    effectiveRate: 19.14,
    plainEnglish: 'Set aside money for tax.',
    ...overrides,
  };
}

// ─── exportTransactionsCSV ──────────────────────────────

describe('exportTransactionsCSV', () => {
  it('produces correct headers', () => {
    const csv = exportTransactionsCSV([]);
    const headerLine = csv.split('\n')[0];
    expect(headerLine).toBe('Date,Description,Merchant,Amount,Category,Income Source,Type');
  });

  it('formats dates as DD/MM/YYYY', () => {
    const csv = exportTransactionsCSV([makeTransaction({ transactionDate: '2026-03-15' })]);
    const dataLine = csv.split('\n')[1];
    expect(dataLine).toContain('15/03/2026');
  });

  it('formats amounts with pound sign and two decimals', () => {
    const csv = exportTransactionsCSV([makeTransaction({ amount: 150.5 })]);
    const dataLine = csv.split('\n')[1];
    expect(dataLine).toContain('£150.50');
  });

  it('escapes commas in descriptions', () => {
    const csv = exportTransactionsCSV([makeTransaction({ description: 'Design, development' })]);
    const dataLine = csv.split('\n')[1];
    // The description should be wrapped in quotes
    expect(dataLine).toContain('"Design, development"');
  });

  it('escapes double quotes in descriptions', () => {
    const csv = exportTransactionsCSV([makeTransaction({ description: 'The "best" work' })]);
    const dataLine = csv.split('\n')[1];
    // Quotes should be doubled and wrapped
    expect(dataLine).toContain('"The ""best"" work"');
  });

  it('labels income and expense types correctly', () => {
    const income = makeTransaction({ isIncome: true });
    const expense = makeTransaction({ isIncome: false, id: 'tx-2' });
    const csv = exportTransactionsCSV([income, expense]);
    const lines = csv.split('\n');
    expect(lines[1]).toContain('Income');
    expect(lines[2]).toContain('Expense');
  });

  it('handles missing optional fields', () => {
    const csv = exportTransactionsCSV([
      makeTransaction({ merchantName: undefined, aiCategory: undefined, incomeSource: undefined }),
    ]);
    const dataLine = csv.split('\n')[1];
    // Should not throw and should contain empty values for those fields
    expect(dataLine).toBeTruthy();
  });
});

// ─── exportExpensesCSV ──────────────────────────────────

describe('exportExpensesCSV', () => {
  it('produces correct headers', () => {
    const csv = exportExpensesCSV([]);
    const headerLine = csv.split('\n')[0];
    expect(headerLine).toBe('Date,Description,Amount,HMRC Category');
  });

  it('handles empty array (header only)', () => {
    const csv = exportExpensesCSV([]);
    const lines = csv.split('\n');
    expect(lines).toHaveLength(1);
    expect(lines[0]).toBe('Date,Description,Amount,HMRC Category');
  });

  it('formats expense rows correctly', () => {
    const csv = exportExpensesCSV([makeExpense()]);
    const lines = csv.split('\n');
    expect(lines).toHaveLength(2);
    expect(lines[1]).toContain('20/02/2026');
    expect(lines[1]).toContain('Office supplies');
    expect(lines[1]).toContain('£49.99');
    expect(lines[1]).toContain('Office costs');
  });

  it('handles missing hmrcCategory', () => {
    const csv = exportExpensesCSV([makeExpense({ hmrcCategory: undefined })]);
    const dataLine = csv.split('\n')[1];
    // Should end with an empty value
    expect(dataLine).toBeTruthy();
  });
});

// ─── exportInvoicesCSV ──────────────────────────────────

describe('exportInvoicesCSV', () => {
  it('produces correct headers', () => {
    const csv = exportInvoicesCSV([]);
    const headerLine = csv.split('\n')[0];
    expect(headerLine).toBe('Client,Description,Amount,Status,Due Date,Paid Date');
  });

  it('formats paid date when present', () => {
    const csv = exportInvoicesCSV([makeInvoice({ paidAt: '2026-03-28' })]);
    const dataLine = csv.split('\n')[1];
    expect(dataLine).toContain('28/03/2026');
  });

  it('handles missing paidAt date', () => {
    const csv = exportInvoicesCSV([makeInvoice({ paidAt: undefined })]);
    const dataLine = csv.split('\n')[1];
    // The last field (Paid Date) should be empty
    // Row: BigCorp,Q1 consulting,£2400.00,paid,01/04/2026,
    expect(dataLine).toMatch(/,$/);
  });

  it('includes all invoice fields', () => {
    const csv = exportInvoicesCSV([makeInvoice()]);
    const dataLine = csv.split('\n')[1];
    expect(dataLine).toContain('BigCorp');
    expect(dataLine).toContain('Q1 consulting');
    expect(dataLine).toContain('£2400.00');
    expect(dataLine).toContain('paid');
    expect(dataLine).toContain('01/04/2026');
    expect(dataLine).toContain('28/03/2026');
  });
});

// ─── exportTaxSummaryCSV ────────────────────────────────

describe('exportTaxSummaryCSV', () => {
  it('produces correct headers', () => {
    const csv = exportTaxSummaryCSV(makeTaxCalculation());
    const headerLine = csv.split('\n')[0];
    expect(headerLine).toBe('Field,Value');
  });

  it('contains all expected field/value pairs', () => {
    const csv = exportTaxSummaryCSV(makeTaxCalculation());
    const lines = csv.split('\n');
    // 1 header + 10 data rows
    expect(lines).toHaveLength(11);

    // Check field names exist
    const fields = lines.slice(1).map((line) => line.split(',')[0]);
    expect(fields).toEqual([
      'Tax Year',
      'Gross Income',
      'Allowable Expenses',
      'Net Profit',
      'Personal Allowance',
      'Taxable Income',
      'Income Tax',
      'National Insurance',
      'Total Tax',
      'Effective Rate',
    ]);
  });

  it('includes tax year as-is', () => {
    const csv = exportTaxSummaryCSV(makeTaxCalculation({ taxYear: '2026/27' }));
    expect(csv).toContain('2026/27');
  });

  it('formats effective rate with percent sign', () => {
    const csv = exportTaxSummaryCSV(makeTaxCalculation({ effectiveRate: 19.14 }));
    expect(csv).toContain('19.1%');
  });

  it('formats amounts with pound sign', () => {
    const csv = exportTaxSummaryCSV(makeTaxCalculation({ totalIncome: 50000 }));
    expect(csv).toContain('£50000.00');
  });
});
