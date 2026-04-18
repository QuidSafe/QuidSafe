// React Query hooks for QuidSafe API

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@clerk/clerk-expo';
import { useEffect, useRef, useCallback } from 'react';
import { api } from '../api';
import { getCached, setCache } from '../offlineCache';
import type { TaxCalculation, Expense } from '../types';

/** Sync Clerk token to API client - call once at root level.
 *  Registers a provider that fetches a fresh JWT on every API request
 *  (Clerk caches internally so this is cheap). Prevents the Worker's
 *  1h token-age guard from tripping during long sessions. */
export function useApiToken() {
  const { getToken, isSignedIn } = useAuth();
  const getTokenRef = useRef(getToken);
  getTokenRef.current = getToken;

  useEffect(() => {
    let cancelled = false;

    // Register a provider so every request pulls a fresh JWT.
    api.setTokenProvider(async () => {
      try {
        return await getTokenRef.current();
      } catch {
        return null;
      }
    });

    // Also do a one-off sync so the first few requests before a provider
    // callback resolves still have a token in hand (e.g. dashboard prefetch).
    async function warmCache() {
      try {
        const token = await getTokenRef.current();
        if (!cancelled) api.setToken(token);
      } catch {
        if (!cancelled) api.setToken(null);
      }
    }
    warmCache();

    return () => {
      cancelled = true;
      api.setTokenProvider(null);
    };
  }, [isSignedIn]);
}

export function useArticles() {
  return useQuery({
    queryKey: ['articles'],
    queryFn: () => api.getArticles(),
    staleTime: 5 * 60_000,
  });
}

export function useDashboard() {
  type DashboardResponse = Awaited<ReturnType<typeof api.getDashboard>>;
  return useQuery({
    queryKey: ['dashboard'],
    queryFn: async () => {
      try {
        const data = await api.getDashboard();
        setCache('dashboard', data).catch(() => {});
        return data;
      } catch (error) {
        const cached = await getCached<DashboardResponse>('dashboard');
        if (cached) return cached;
        throw error;
      }
    },
    staleTime: 5 * 60_000,
  });
}

export function useTransactions(params?: { limit?: number; offset?: number; category?: string }) {
  return useQuery({
    queryKey: ['transactions', params],
    queryFn: () => api.getTransactions(params),
    staleTime: 30_000,
  });
}

export function useUncategorised() {
  return useQuery({
    queryKey: ['transactions', 'uncategorised'],
    queryFn: () => api.getUncategorised(),
    staleTime: 30_000,
  });
}

export function useOverrideCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, category, incomeSource }: { id: string; category: string; incomeSource?: string }) =>
      api.overrideCategory(id, category, incomeSource),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useBankConnections() {
  return useQuery({
    queryKey: ['banking', 'connections'],
    queryFn: () => api.getConnections(),
    staleTime: 60_000,
  });
}

export function useQuarterlyBreakdown(taxYear?: string) {
  return useQuery({
    queryKey: ['tax', 'quarterly', taxYear],
    queryFn: () => api.getQuarterlyBreakdown(taxYear),
    staleTime: 60_000,
  });
}

export function useExpenses() {
  return useQuery({
    queryKey: ['expenses'],
    queryFn: async () => {
      try {
        const data = await api.getExpenses();
        setCache('expenses', data).catch(() => {});
        return data;
      } catch (error) {
        const cached = await getCached<{ expenses: Expense[] }>('expenses');
        if (cached) return cached;
        throw error;
      }
    },
    staleTime: 5 * 60_000,
  });
}

export function useAddExpense() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { amount: number; description: string; date: string; categoryId?: number; hmrcCategory?: string }) =>
      api.addExpense(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useUpdateExpense() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: { amount?: number; description?: string; date?: string; hmrcCategory?: string } }) =>
      api.updateExpense(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useRecurringExpenses() {
  return useQuery({
    queryKey: ['expenses', 'recurring'],
    queryFn: () => api.getRecurringExpenses(),
    staleTime: 60_000,
  });
}

export function useCreateRecurringExpense() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { amount: number; description: string; hmrcCategory?: string; frequency: 'weekly' | 'monthly' | 'quarterly' | 'yearly'; startDate: string }) =>
      api.createRecurringExpense(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses', 'recurring'] });
    },
  });
}

export function useDeleteRecurringExpense() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.deleteRecurringExpense(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses', 'recurring'] });
    },
  });
}

export function useSettings() {
  return useQuery({
    queryKey: ['settings'],
    queryFn: () => api.getSettings(),
    staleTime: 60_000,
  });
}

export function useUpdateSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { name?: string; nino?: string; notifyTaxDeadlines?: boolean; notifyWeeklySummary?: boolean; notifyTransactionAlerts?: boolean; notifyMtdReady?: boolean }) =>
      api.updateSettings(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
    },
  });
}

export function useInvoices(status?: string) {
  return useQuery({
    queryKey: ['invoices', status],
    queryFn: () => api.getInvoices(status),
    staleTime: 30_000,
  });
}

export function useCreateInvoice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { clientName: string; clientEmail?: string; amount: number; description: string; dueDate: string }) =>
      api.createInvoice(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
    },
  });
}

export function useUpdateInvoice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: { status?: string; clientName?: string; amount?: number; description?: string; dueDate?: string } }) =>
      api.updateInvoice(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useDeleteInvoice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.deleteInvoice(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useSendInvoice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, recipientEmail }: { id: string; recipientEmail: string }) =>
      api.sendInvoice(id, recipientEmail),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
    },
  });
}

export function useDeleteExpense() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.deleteExpense(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useSyncBank() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.syncBank(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['banking'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useDisconnectBank() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.disconnectBank(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['banking'] });
    },
  });
}

export function useCreateCheckout() {
  return useMutation({
    mutationFn: (plan: 'monthly' | 'annual') => api.createCheckout(plan),
  });
}

export function useBillingStatus() {
  return useQuery({
    queryKey: ['billing', 'status'],
    queryFn: () => api.getBillingStatus(),
    staleTime: 60_000,
  });
}

export function useMileage(taxYear?: string) {
  return useQuery({
    queryKey: ['mileage', taxYear],
    queryFn: () => api.getMileage(taxYear),
    staleTime: 30_000,
  });
}

export function useClients() {
  return useQuery({
    queryKey: ['clients'],
    queryFn: () => api.getClients(),
    staleTime: 30_000,
  });
}

export function useRecurringInvoices() {
  return useQuery({
    queryKey: ['recurring-invoices'],
    queryFn: () => api.getRecurringInvoices(),
    staleTime: 30_000,
  });
}

export function useTaxCalculation() {
  return useQuery({
    queryKey: ['tax', 'calculation'],
    queryFn: async () => {
      try {
        const data = await api.getTaxCalculation();
        setCache('tax', data).catch(() => {});
        return data;
      } catch (error) {
        const cached = await getCached<TaxCalculation>('tax');
        if (cached) return cached;
        throw error;
      }
    },
    staleTime: 5 * 60_000,
  });
}

export function useMtdObligations() {
  return useQuery({
    queryKey: ['mtd', 'obligations'],
    queryFn: () => api.getMtdObligations(),
    staleTime: 60_000,
  });
}

export function useSubmitQuarterly() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ taxYear, quarter }: { taxYear: string; quarter: number }) =>
      api.submitQuarterly(taxYear, quarter),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mtd'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}
