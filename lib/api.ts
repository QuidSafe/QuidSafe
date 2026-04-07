// API client for QuidSafe Cloudflare Worker backend

import type { User, Transaction, Expense, Invoice, BankConnection, TaxCalculation, RecurringExpense, RecurringFrequency, MTDObligation, MTDSubmission, Article } from './types';

const API_BASE = process.env.EXPO_PUBLIC_API_URL || 'https://quidsafe-api.nathanlufc.workers.dev';

class ApiClient {
  private token: string | null = null;

  setToken(token: string | null) {
    this.token = token;
  }

  private async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: { message: 'Request failed' } }));
      throw new Error((error as { error?: { message?: string } }).error?.message ?? `HTTP ${response.status}`);
    }

    return response.json() as Promise<T>;
  }

  // Articles (public — no auth required)
  getArticles() {
    return this.request<{ articles: Article[] }>('/articles');
  }

  getArticle(id: string) {
    return this.request<{ article: Article }>(`/articles/${id}`);
  }

  // Auth
  signup(email: string, name?: string) {
    return this.request<{ user: User }>('/auth/signup', { method: 'POST', body: JSON.stringify({ email, name }) });
  }

  getSession() {
    return this.request<{ user: User }>('/auth/session', { method: 'POST' });
  }

  completeOnboarding() {
    return this.request<{ success: boolean }>('/auth/onboarding', { method: 'PUT' });
  }

  deleteAccount() {
    return this.request<{ deleted: boolean }>('/auth/account', { method: 'DELETE' });
  }

  // Dashboard
  getDashboard() {
    return this.request<{
      user: { name: string; subscriptionTier: string };
      tax: TaxCalculation;
      income: {
        total: number;
        bySource: { name: string; amount: number; percentage: number }[];
        byMonth?: { month: string; income: number; expenses: number }[];
      };
      quarters: { current: { taxYear: string; quarter: number } };
      actions: { id: string; type: string; title: string; subtitle: string; priority: number }[];
    }>('/dashboard');
  }

  // Transactions
  getTransactions(params?: { limit?: number; offset?: number; category?: string }) {
    const query = new URLSearchParams();
    if (params?.limit) query.set('limit', String(params.limit));
    if (params?.offset) query.set('offset', String(params.offset));
    if (params?.category) query.set('category', params.category);
    return this.request<{ transactions: Transaction[]; total: number }>(`/transactions?${query}`);
  }

  categoriseTransactions() {
    return this.request<{ categorised: number; autoAccepted: number; flaggedForReview: number; uncategorised: number }>('/transactions/categorise', { method: 'POST' });
  }

  getUncategorised() {
    return this.request<{ transactions: Transaction[] }>('/transactions/uncategorised');
  }

  overrideCategory(id: string, category: string, incomeSource?: string) {
    return this.request<{ success: boolean }>(`/transactions/${id}/category`, {
      method: 'PUT',
      body: JSON.stringify({ category, incomeSource }),
    });
  }

  // Banking
  getConnectUrl() {
    return this.request<{ url: string }>('/banking/connect');
  }

  getConnections() {
    return this.request<{ connections: BankConnection[] }>('/banking/connections');
  }

  syncBank(id: string) {
    return this.request<{ success: boolean; synced: number; skipped: number }>(`/banking/sync/${id}`, { method: 'POST' });
  }

  disconnectBank(id: string) {
    return this.request<{ disconnected: boolean }>(`/banking/connections/${id}`, { method: 'DELETE' });
  }

  // Tax
  getTaxCalculation() {
    return this.request<TaxCalculation>('/tax/calculation');
  }

  getQuarterlyBreakdown(taxYear?: string) {
    const params = taxYear ? `?taxYear=${taxYear}` : '';
    return this.request<{
      taxYear: string;
      quarters: { quarter: number; startDate: string; endDate: string; deadline: string; income: number; expenses: number; tax: number; setAsideMonthly: number }[];
      yearTotal: { income: number; expenses: number; totalTaxOwed: number; effectiveRate: number; setAsideMonthly: number; plainEnglish: string };
    }>(`/tax/quarters${params}`);
  }

  // Expenses
  getExpenses() {
    return this.request<{ expenses: Expense[] }>('/expenses');
  }

  addExpense(data: { amount: number; description: string; categoryId?: number; hmrcCategory?: string; date: string }) {
    return this.request<{ id: string; success: boolean }>('/expenses', { method: 'POST', body: JSON.stringify(data) });
  }

  updateExpense(id: string, data: { amount?: number; description?: string; date?: string; hmrcCategory?: string }) {
    return this.request<{ expense: Expense; success: boolean }>(`/expenses/${id}`, { method: 'PUT', body: JSON.stringify(data) });
  }

  deleteExpense(id: string) {
    return this.request<{ deleted: boolean }>(`/expenses/${id}`, { method: 'DELETE' });
  }

  // Recurring Expenses
  getRecurringExpenses() {
    return this.request<{ recurringExpenses: RecurringExpense[] }>('/expenses/recurring');
  }

  createRecurringExpense(data: { amount: number; description: string; hmrcCategory?: string; frequency: RecurringFrequency; startDate: string }) {
    return this.request<{ id: string; success: boolean }>('/expenses/recurring', { method: 'POST', body: JSON.stringify(data) });
  }

  updateRecurringExpense(id: string, data: { amount?: number; description?: string; hmrcCategory?: string; frequency?: RecurringFrequency; active?: boolean }) {
    return this.request<{ success: boolean }>(`/expenses/recurring/${id}`, { method: 'PUT', body: JSON.stringify(data) });
  }

  deleteRecurringExpense(id: string) {
    return this.request<{ deleted: boolean }>(`/expenses/recurring/${id}`, { method: 'DELETE' });
  }

  // Invoices
  getInvoices(status?: string) {
    const query = status ? `?status=${status}` : '';
    return this.request<{ invoices: Invoice[] }>(`/invoices${query}`);
  }

  createInvoice(data: { clientName: string; clientEmail?: string; amount: number; description: string; dueDate: string }) {
    return this.request<{ id: string; success: boolean }>('/invoices', { method: 'POST', body: JSON.stringify(data) });
  }

  updateInvoice(id: string, data: { status?: string; clientName?: string; amount?: number; description?: string; dueDate?: string }) {
    return this.request<{ success: boolean }>(`/invoices/${id}`, { method: 'PUT', body: JSON.stringify(data) });
  }

  deleteInvoice(id: string) {
    return this.request<{ deleted: boolean }>(`/invoices/${id}`, { method: 'DELETE' });
  }

  // Billing
  createCheckout(plan: 'monthly' | 'annual') {
    return this.request<{ url: string }>('/billing/checkout', { method: 'POST', body: JSON.stringify({ plan }) });
  }

  createPortalSession() {
    return this.request<{ url: string }>('/billing/portal', { method: 'POST' });
  }

  getBillingStatus() {
    return this.request<{ plan: string; status: string; trialEndsAt: string | null; currentPeriodEnd: string | null }>('/billing/status');
  }

  // Settings
  getSettings() {
    return this.request<{ user: User }>('/settings');
  }

  updateSettings(data: {
    name?: string;
    notifyTaxDeadlines?: boolean;
    notifyWeeklySummary?: boolean;
    notifyTransactionAlerts?: boolean;
    notifyMtdReady?: boolean;
  }) {
    return this.request<{ user: User }>('/settings', { method: 'PUT', body: JSON.stringify(data) });
  }

  // Devices
  registerDevice(pushToken: string, platform: string) {
    return this.request<{ registered: boolean }>('/devices', { method: 'POST', body: JSON.stringify({ pushToken, platform }) });
  }

  removeDevice(pushToken: string) {
    return this.request<{ removed: boolean }>('/devices', { method: 'DELETE', body: JSON.stringify({ pushToken }) });
  }

  // Tax quarters
  getQuarters(taxYear?: string) {
    return this.getQuarterlyBreakdown(taxYear);
  }

  // HMRC MTD
  getHmrcAuthUrl() {
    return this.request<{ url: string }>('/mtd/auth');
  }

  submitHmrcCallback(code: string) {
    return this.request<{ connected: boolean }>('/mtd/callback', { method: 'POST', body: JSON.stringify({ code }) });
  }

  getMtdObligations() {
    return this.request<{ obligations: MTDObligation[]; submissions: { quarter: number; status: string; hmrc_receipt_id: string | null }[] }>('/mtd/obligations');
  }

  submitQuarterly(taxYear: string, quarter: number) {
    return this.request<{ success: boolean; submissionId: string; hmrcReceiptId: string; summary: { taxYear: string; quarter: number; totalIncome: number; totalExpenses: number; netProfit: number } }>(
      '/mtd/submit-quarterly',
      { method: 'POST', body: JSON.stringify({ taxYear, quarter }) },
    );
  }

  getMtdSubmission(id: string) {
    return this.request<{ submission: MTDSubmission }>(`/mtd/submission/${id}`);
  }
}

export const api = new ApiClient();
