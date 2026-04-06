// API client for QuidSafe Cloudflare Worker backend

import type { User, Transaction, Expense, Invoice, BankConnection, TaxCalculation } from './types';

const API_BASE = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8787';

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
      };
      quarters: { current: { taxYear: string; quarter: number } };
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

  getQuarterlyBreakdown() {
    return this.request<{ taxYear: string; quarters: { quarter: number; from: string; to: string; income: number; expenses: number }[] }>('/tax/quarterly');
  }

  // Expenses
  getExpenses() {
    return this.request<{ expenses: Expense[] }>('/expenses');
  }

  addExpense(data: { amount: number; description: string; categoryId?: number; hmrcCategory?: string; date: string }) {
    return this.request<{ id: string; success: boolean }>('/expenses', { method: 'POST', body: JSON.stringify(data) });
  }

  deleteExpense(id: string) {
    return this.request<{ deleted: boolean }>(`/expenses/${id}`, { method: 'DELETE' });
  }

  // Invoices
  getInvoices(status?: string) {
    const query = status ? `?status=${status}` : '';
    return this.request<{ invoices: Invoice[] }>(`/invoices${query}`);
  }

  createInvoice(data: { clientName: string; clientEmail?: string; amount: number; description: string; dueDate: string }) {
    return this.request<{ id: string; success: boolean }>('/invoices', { method: 'POST', body: JSON.stringify(data) });
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

  updateSettings(data: { name?: string }) {
    return this.request<{ user: User }>('/settings', { method: 'PUT', body: JSON.stringify(data) });
  }
}

export const api = new ApiClient();
