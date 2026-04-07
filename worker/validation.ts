import { z } from 'zod';

// Shared validators
const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD');
const positiveAmount = z.number().positive('Amount must be positive').max(10_000_000, 'Amount too large');
const safeString = z.string().min(1).max(500).transform(s => s.trim());

// Auth signup
export const signupSchema = z.object({
  email: z.string().email('Invalid email').max(320),
  name: z.string().max(200).optional(),
});

// Expense
export const createExpenseSchema = z.object({
  description: safeString,
  amount: positiveAmount,
  date: isoDate,
  categoryId: z.number().int().optional(),
  hmrcCategory: z.string().max(100).optional(),
});

// Invoice
export const createInvoiceSchema = z.object({
  clientName: safeString,
  clientEmail: z.string().email().max(320).optional(),
  description: safeString,
  amount: positiveAmount,
  dueDate: isoDate,
});

export const updateInvoiceSchema = z.object({
  status: z.enum(['draft', 'sent', 'paid', 'overdue']).optional(),
  clientName: safeString.optional(),
  clientEmail: z.string().email().max(320).optional().nullable(),
  description: safeString.optional(),
  amount: positiveAmount.optional(),
  dueDate: isoDate.optional(),
});

// Update Expense
export const updateExpenseSchema = z.object({
  amount: positiveAmount.optional(),
  description: safeString.optional(),
  date: isoDate.optional(),
  hmrcCategory: z.string().max(100).optional(),
});

// Recurring Expense
export const createRecurringExpenseSchema = z.object({
  description: safeString,
  amount: positiveAmount,
  frequency: z.enum(['weekly', 'monthly', 'quarterly', 'yearly']),
  hmrcCategory: z.string().max(100).optional(),
  startDate: isoDate,
});

export const updateRecurringExpenseSchema = z.object({
  amount: positiveAmount.optional(),
  description: safeString.optional(),
  hmrcCategory: z.string().max(100).optional(),
  frequency: z.enum(['weekly', 'monthly', 'quarterly', 'yearly']).optional(),
  active: z.boolean().optional(),
});

// Settings
export const updateSettingsSchema = z.object({
  name: z.string().max(200).optional(),
  nino: z.string().regex(/^[A-Z]{2}\d{6}[A-Z]$/).optional(),
  notifyTaxDeadlines: z.boolean().optional(),
  notifyWeeklySummary: z.boolean().optional(),
  notifyTransactionAlerts: z.boolean().optional(),
  notifyMtdReady: z.boolean().optional(),
});

// Transaction category override
export const updateTransactionCategorySchema = z.object({
  category: z.enum(['income', 'personal', 'business_expense']),
  incomeSource: z.string().max(200).optional(),
});

// Billing checkout
export const checkoutSchema = z.object({
  plan: z.enum(['monthly', 'annual']),
});

// MTD callback
export const mtdCallbackSchema = z.object({
  code: z.string().min(1, 'Code is required').max(2000),
  state: z.string().min(1, 'State is required').max(200),
});

// MTD submit quarterly
export const mtdSubmitQuarterlySchema = z.object({
  taxYear: z.string().regex(/^\d{4}\/\d{2}$/, 'Tax year must be YYYY/YY format'),
  quarter: z.number().int().min(1).max(4),
});

// Device push token registration
export const registerDeviceSchema = z.object({
  pushToken: z.string().min(1, 'pushToken is required').max(500),
  platform: z.enum(['ios', 'android', 'web']),
});

// Device push token deletion
export const deleteDeviceSchema = z.object({
  pushToken: z.string().min(1, 'pushToken is required').max(500),
});

// Notification preferences
export const notificationPrefsSchema = z.object({
  taxDeadlines: z.boolean().optional(),
  weeklyDigest: z.boolean().optional(),
  paymentReminders: z.boolean().optional(),
  pushToken: z.string().max(500).optional(),
});
