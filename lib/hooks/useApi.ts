// React Query hooks for QuidSafe API

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@clerk/clerk-expo';
import { useEffect, useRef, useCallback } from 'react';
import { api } from '../api';

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

export function useDashboard() {
  return useQuery({
    queryKey: ['dashboard'],
    queryFn: () => api.getDashboard(),
    staleTime: 30_000,
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

export function useQuarterlyBreakdown() {
  return useQuery({
    queryKey: ['tax', 'quarterly'],
    queryFn: () => api.getQuarterlyBreakdown(),
    staleTime: 60_000,
  });
}

export function useExpenses() {
  return useQuery({
    queryKey: ['expenses'],
    queryFn: () => api.getExpenses(),
    staleTime: 30_000,
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
    mutationFn: (data: { name?: string; notifyTaxDeadlines?: boolean; notifyWeeklySummary?: boolean; notifyTransactionAlerts?: boolean }) =>
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
