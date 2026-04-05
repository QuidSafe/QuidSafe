// API client for QuidSafe Cloudflare Worker backend

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
    return this.request('/auth/signup', { method: 'POST', body: JSON.stringify({ email, name }) });
  }

  getSession() {
    return this.request<{ user: Record<string, unknown> }>('/auth/session', { method: 'POST' });
  }

  completeOnboarding() {
    return this.request('/auth/onboarding', { method: 'PUT' });
  }

  deleteAccount() {
    return this.request('/auth/account', { method: 'DELETE' });
  }

  // Dashboard
  getDashboard() {
    return this.request<{
      user: { name: string; subscriptionTier: string };
      tax: {
        taxYear: string;
        quarter: number;
        totalIncome: number;
        totalExpenses: number;
        netProfit: number;
        totalTaxOwed: number;
        setAsideMonthly: number;
        effectiveRate: number;
        plainEnglish: string;
        incomeTax: { basicRate: number; higherRate: number; additionalRate: number; total: number };
        nationalInsurance: { class2: number; class4: number; total: number };
      };
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
    return this.request<{ transactions: Record<string, unknown>[]; total: number }>(`/transactions?${query}`);
  }

  getUncategorised() {
    return this.request<{ transactions: Record<string, unknown>[] }>('/transactions/uncategorised');
  }

  overrideCategory(id: string, category: string, incomeSource?: string) {
    return this.request(`/transactions/${id}/category`, {
      method: 'PUT',
      body: JSON.stringify({ category, incomeSource }),
    });
  }

  // Banking
  getConnectUrl() {
    return this.request<{ url: string }>('/banking/connect');
  }

  getConnections() {
    return this.request<{ connections: Record<string, unknown>[] }>('/banking/connections');
  }

  disconnectBank(id: string) {
    return this.request(`/banking/connections/${id}`, { method: 'DELETE' });
  }

  // Tax
  getTaxCalculation() {
    return this.request<Record<string, unknown>>('/tax/calculation');
  }

  getQuarterlyBreakdown() {
    return this.request<{ taxYear: string; quarters: Record<string, unknown>[] }>('/tax/quarterly');
  }

  // Expenses
  getExpenses() {
    return this.request<{ expenses: Record<string, unknown>[] }>('/expenses');
  }

  addExpense(data: { amount: number; description: string; categoryId?: number; hmrcCategory?: string; date: string }) {
    return this.request<{ id: string }>('/expenses', { method: 'POST', body: JSON.stringify(data) });
  }

  deleteExpense(id: string) {
    return this.request(`/expenses/${id}`, { method: 'DELETE' });
  }

  // Invoices
  getInvoices(status?: string) {
    const query = status ? `?status=${status}` : '';
    return this.request<{ invoices: Record<string, unknown>[] }>(`/invoices${query}`);
  }

  createInvoice(data: { clientName: string; clientEmail?: string; amount: number; description: string; dueDate: string }) {
    return this.request<{ id: string }>('/invoices', { method: 'POST', body: JSON.stringify(data) });
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
    return this.request<{ user: Record<string, unknown> }>('/settings');
  }

  updateSettings(data: { name?: string }) {
    return this.request<{ user: Record<string, unknown> }>('/settings', { method: 'PUT', body: JSON.stringify(data) });
  }
}

export const api = new ApiClient();
