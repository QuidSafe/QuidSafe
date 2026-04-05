// QuidSafe — Shared TypeScript Types

export type SubscriptionTier = 'free' | 'pro';

export type TransactionCategory = 'income' | 'personal' | 'business_expense';

export interface User {
  id: string;
  email: string;
  name: string;
  subscriptionTier: SubscriptionTier;
  onboardingCompleted: boolean;
  createdAt: Date;
}

export interface BankConnection {
  id: string;
  bankName: string;
  lastSyncedAt: Date;
  active: boolean;
  transactionCount: number;
}

export interface Transaction {
  id: string;
  amount: number;
  description: string;
  merchantName?: string;
  aiCategory: TransactionCategory;
  aiConfidence: number;
  isIncome: boolean;
  incomeSource?: string;
  transactionDate: string;
}

export interface Expense {
  id: string;
  amount: number;
  description: string;
  category: string;
  hmrcCategory: string;
  receiptUrl?: string;
  date: string;
  createdAt: string;
}

export interface Invoice {
  id: string;
  clientName: string;
  clientEmail: string;
  amount: number;
  description: string;
  status: 'draft' | 'sent' | 'paid' | 'overdue';
  dueDate: string;
  createdAt: string;
}

export interface TaxCalculation {
  taxYear: string;
  quarter: number;
  totalIncome: number;
  totalExpenses: number;
  taxableIncome: number;
  incomeTax: number;
  niClass2: number;
  niClass4: number;
  totalTaxOwed: number;
  setAsideMonthly: number;
  plainEnglish: string;
}

export interface ActionItem {
  id: string;
  title: string;
  description: string;
  type: 'warning' | 'info' | 'action';
  actionRoute?: string;
  priority: number;
}

export interface QuarterInfo {
  quarter: number;
  startDate: string;
  endDate: string;
  deadline: string;
  status: 'submitted' | 'due' | 'upcoming' | 'overdue';
}

export interface QuarterTimeline {
  current: QuarterInfo;
  timeline: QuarterInfo[];
}

export interface IncomeBreakdown {
  total: number;
  bySource: { name: string; amount: number; percentage: number }[];
  byMonth: { month: string; income: number; expenses: number }[];
}

export interface DashboardData {
  user: Pick<User, 'name' | 'subscriptionTier'>;
  tax: TaxCalculation;
  income: IncomeBreakdown;
  actions: ActionItem[];
  quarters: QuarterTimeline;
}

export interface Settings {
  notifications: {
    deadlineReminders: boolean;
    weeklySummary: boolean;
    taxPotCheck: boolean;
    mtdReady: boolean;
  };
}

export interface ApiError {
  error: {
    code: string;
    message: string;
    action?: string;
    details?: Record<string, unknown>;
  };
}
