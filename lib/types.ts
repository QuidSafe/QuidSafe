// QuidSafe - Shared TypeScript Types

export type SubscriptionTier = 'trialing' | 'pro' | 'past_due' | 'cancelled';
export type SubscriptionPlan = 'pro_monthly' | 'pro_annual';
export type SubscriptionStatus = 'active' | 'past_due' | 'cancelled' | 'trialing';

export type TransactionCategory = 'income' | 'personal' | 'business_expense';
export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue';
export type MTDStatus = 'draft' | 'submitted' | 'accepted' | 'rejected';

export interface User {
  id: string;
  email: string;
  name: string;
  subscriptionTier: SubscriptionTier;
  onboardingCompleted: boolean;
  stripeCustomerId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BankConnection {
  id: string;
  userId: string;
  provider: string;
  bankName: string;
  lastSyncedAt?: string;
  active: boolean;
  createdAt: string;
}

export interface Transaction {
  id: string;
  userId: string;
  amount: number;
  currency: string;
  description: string;
  merchantName?: string;
  rawCategory?: string;
  aiCategory?: TransactionCategory;
  aiConfidence?: number;
  aiReasoning?: string;
  userOverride: boolean;
  isIncome: boolean;
  isExpenseClaimable: boolean;
  incomeSource?: string;
  bankConnectionId?: string;
  bankTransactionId?: string;
  transactionDate: string;
  createdAt: string;
}

export interface Expense {
  id: string;
  userId: string;
  amount: number;
  description: string;
  categoryId?: number;
  hmrcCategory?: string;
  receiptUrl?: string;
  date: string;
  createdAt: string;
}

export type RecurringFrequency = 'weekly' | 'monthly' | 'quarterly' | 'yearly';

export interface RecurringExpense {
  id: string;
  userId: string;
  amount: number;
  description: string;
  hmrcCategory: string;
  frequency: RecurringFrequency;
  startDate: string;
  nextDueDate: string;
  active: boolean;
  createdAt: string;
}

export interface Invoice {
  id: string;
  userId: string;
  clientName: string;
  clientEmail?: string;
  amount: number;
  description: string;
  status: InvoiceStatus;
  dueDate: string;
  paidAt?: string;
  createdAt: string;
}

export interface Subscription {
  id: string;
  userId: string;
  stripeCustomerId: string;
  stripeSubscriptionId?: string;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  trialEndsAt?: string;
  currentPeriodStart?: string;
  currentPeriodEnd?: string;
  createdAt: string;
}

export interface MTDObligation {
  periodKey: string;
  start: string;
  end: string;
  due: string;
  status: 'Open' | 'Fulfilled';
  received?: string;
}

export interface MTDSubmission {
  id: string;
  userId: string;
  taxYear: string;
  quarter: number;
  hmrcReceiptId?: string;
  status: MTDStatus;
  payloadJson: string;
  responseJson?: string;
  submittedAt?: string;
  createdAt: string;
}

export interface CategoryCorrection {
  id: number;
  userId: string;
  transactionId: string;
  originalCategory: TransactionCategory;
  correctedCategory: TransactionCategory;
  merchantName?: string;
  createdAt: string;
}

export interface TaxCalculation {
  taxYear: string;
  quarter: number;
  totalIncome: number;
  totalExpenses: number;
  netProfit: number;
  personalAllowance: number;
  taxableIncome: number;
  incomeTax: { basicRate: number; higherRate: number; additionalRate: number; total: number };
  nationalInsurance: { class2: number; class4: number; total: number };
  totalTaxOwed: number;
  setAsideMonthly: number;
  effectiveRate: number;
  plainEnglish: string;
}

export interface ActionItem {
  id: string;
  title: string;
  description: string;
  type: 'warning' | 'info' | 'action' | 'urgent';
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
  /** Most recent bank_connections.last_synced_at across all active connections (ISO 8601), or null when no active connection. */
  lastSyncedAt: string | null;
}

export interface Settings {
  notifications: {
    deadlineReminders: boolean;
    weeklySummary: boolean;
    taxPotCheck: boolean;
    mtdReady: boolean;
  };
}

export type ArticleCategory = 'mtd' | 'expenses' | 'vat' | 'deadlines' | 'bank-safety' | 'getting-started';

export interface Article {
  id: string;
  title: string;
  summary: string;
  body: string;
  category: ArticleCategory;
  read_time_min: number;
  published_at: string;
  updated_at: string;
}

export interface ApiError {
  error: {
    code: string;
    message: string;
    action?: string;
    details?: Record<string, unknown>;
  };
}

// ─── Admin dashboard ──────────────────────────────────────
export interface AdminEnvVarStatus {
  key: string;
  kind: 'secret' | 'var';
  description: string;
  present: boolean;
  preview: string | null;
}

export interface AdminMigrationStatus {
  filename: string;
  applied: boolean;
  appliedAt: string | null;
}

export interface AdminExternalServiceStatus {
  name: string;
  dashboardUrl: string;
  configured: boolean;
}

export interface AdminSetupPayload {
  environment: string;
  generatedAt: string;
  envVars: AdminEnvVarStatus[];
  migrations: {
    totalInRepo: number;
    totalApplied: number;
    latestApplied: string | null;
    latestAppliedAt: string | null;
    rows: AdminMigrationStatus[];
  };
  externalServices: AdminExternalServiceStatus[];
  runtime: {
    commitSha: string | null;
    appUrl: string | null;
    sandboxBanking: boolean;
  };
}
