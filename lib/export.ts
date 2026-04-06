// CSV export utilities for QuidSafe

import { Platform } from 'react-native';
import type { Transaction, Expense, Invoice, TaxCalculation } from './types';

// --------------- Helpers ---------------

function escapeCSV(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

function formatAmount(amount: number): string {
  return `£${Math.abs(amount).toFixed(2)}`;
}

function toCSV(headers: string[], rows: string[][]): string {
  const headerLine = headers.map(escapeCSV).join(',');
  const dataLines = rows.map((row) => row.map(escapeCSV).join(','));
  return [headerLine, ...dataLines].join('\n');
}

// --------------- Export Functions ---------------

export function exportTransactionsCSV(transactions: Transaction[]): string {
  const headers = ['Date', 'Description', 'Merchant', 'Amount', 'Category', 'Income Source', 'Type'];
  const rows = transactions.map((t) => [
    formatDate(t.transactionDate),
    t.description,
    t.merchantName ?? '',
    formatAmount(t.amount),
    t.aiCategory ?? t.rawCategory ?? '',
    t.incomeSource ?? '',
    t.isIncome ? 'Income' : 'Expense',
  ]);
  return toCSV(headers, rows);
}

export function exportExpensesCSV(expenses: Expense[]): string {
  const headers = ['Date', 'Description', 'Amount', 'HMRC Category'];
  const rows = expenses.map((e) => [
    formatDate(e.date),
    e.description,
    formatAmount(e.amount),
    e.hmrcCategory ?? '',
  ]);
  return toCSV(headers, rows);
}

export function exportInvoicesCSV(invoices: Invoice[]): string {
  const headers = ['Client', 'Description', 'Amount', 'Status', 'Due Date', 'Paid Date'];
  const rows = invoices.map((inv) => [
    inv.clientName,
    inv.description,
    formatAmount(inv.amount),
    inv.status,
    formatDate(inv.dueDate),
    inv.paidAt ? formatDate(inv.paidAt) : '',
  ]);
  return toCSV(headers, rows);
}

export function exportTaxSummaryCSV(taxData: TaxCalculation): string {
  const headers = ['Field', 'Value'];
  const rows: string[][] = [
    ['Tax Year', taxData.taxYear],
    ['Gross Income', formatAmount(taxData.totalIncome)],
    ['Allowable Expenses', formatAmount(taxData.totalExpenses)],
    ['Net Profit', formatAmount(taxData.netProfit)],
    ['Personal Allowance', formatAmount(taxData.personalAllowance)],
    ['Taxable Income', formatAmount(taxData.taxableIncome)],
    ['Income Tax', formatAmount(taxData.incomeTax.total)],
    ['National Insurance', formatAmount(taxData.nationalInsurance.total)],
    ['Total Tax', formatAmount(taxData.totalTaxOwed)],
    ['Effective Rate', `${taxData.effectiveRate.toFixed(1)}%`],
  ];
  return toCSV(headers, rows);
}

// --------------- Download / Share ---------------

export function downloadCSV(csv: string, filename: string): void {
  if (Platform.OS === 'web') {
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    anchor.style.display = 'none';
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  } else {
    // Native: copy to clipboard as fallback
    void (async () => {
      try {
        const { Clipboard } = await import('react-native');
        if (Clipboard?.setString) {
          Clipboard.setString(csv);
        }
      } catch {
        // Clipboard not available — silent fail
      }
    })();
  }
}
