// React Query hooks for QuidSafe API

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@clerk/clerk-expo';
import { useEffect, useRef, useCallback } from 'react';
import { api } from '../api';
import { getCached, setCache } from '../offlineCache';
import type { TaxCalculation, Expense } from '../types';

/** Sync Clerk token to API client — call once at root level */
export function useApiToken() {
  const { getToken } = useAuth();
  const hasSetToken = useRef(false);

  const syncToken = useCallback(async () => {
    const token = await getToken();
    api.setToken(token);
    hasSetToken.current = true;
  }, [getToken]);

  useEffect(() => {
    syncToken();
  }, [syncToken]);
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
