// Wrapper hooks that add automatic toast notifications to API mutations

import { useToast } from '@/components/ui/Toast';
import {
  useCreateInvoice,
  useUpdateInvoice,
  useDeleteInvoice,
  useSendInvoice,
  useAddExpense,
  useDeleteExpense,
  useUpdateSettings,
  useOverrideCategory,
  useSyncBank,
  useDisconnectBank,
  useSubmitQuarterly,
} from './useApi';

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  return 'Something went wrong. Please try again.';
}

export function useCreateInvoiceWithToast() {
  const mutation = useCreateInvoice();
  const { show } = useToast();

  return {
    ...mutation,
    mutateAsync: async (...args: Parameters<typeof mutation.mutateAsync>) => {
      try {
        const result = await mutation.mutateAsync(...args);
        show('Invoice created', 'success');
        return result;
      } catch (error) {
        show(getErrorMessage(error), 'error');
        throw error;
      }
    },
  };
}

export function useUpdateInvoiceWithToast() {
  const mutation = useUpdateInvoice();
  const { show } = useToast();

  return {
    ...mutation,
    mutateAsync: async (...args: Parameters<typeof mutation.mutateAsync>) => {
      try {
        const result = await mutation.mutateAsync(...args);
        show('Invoice updated', 'success');
        return result;
      } catch (error) {
        show(getErrorMessage(error), 'error');
        throw error;
      }
    },
  };
}

export function useDeleteInvoiceWithToast() {
  const mutation = useDeleteInvoice();
  const { show } = useToast();

  return {
    ...mutation,
    mutateAsync: async (...args: Parameters<typeof mutation.mutateAsync>) => {
      try {
        const result = await mutation.mutateAsync(...args);
        show('Invoice deleted', 'success');
        return result;
      } catch (error) {
        show(getErrorMessage(error), 'error');
        throw error;
      }
    },
  };
}

export function useSendInvoiceWithToast() {
  const mutation = useSendInvoice();
  const { show } = useToast();

  return {
    ...mutation,
    mutateAsync: async (...args: Parameters<typeof mutation.mutateAsync>) => {
      try {
        const result = await mutation.mutateAsync(...args);
        show('Invoice sent', 'success');
        return result;
      } catch (error) {
        show(getErrorMessage(error), 'error');
        throw error;
      }
    },
  };
}

export function useAddExpenseWithToast() {
  const mutation = useAddExpense();
  const { show } = useToast();

  return {
    ...mutation,
    mutateAsync: async (...args: Parameters<typeof mutation.mutateAsync>) => {
      try {
        const result = await mutation.mutateAsync(...args);
        show('Expense added', 'success');
        return result;
      } catch (error) {
        show(getErrorMessage(error), 'error');
        throw error;
      }
    },
  };
}

export function useDeleteExpenseWithToast() {
  const mutation = useDeleteExpense();
  const { show } = useToast();

  return {
    ...mutation,
    mutateAsync: async (...args: Parameters<typeof mutation.mutateAsync>) => {
      try {
        const result = await mutation.mutateAsync(...args);
        show('Expense deleted', 'success');
        return result;
      } catch (error) {
        show(getErrorMessage(error), 'error');
        throw error;
      }
    },
  };
}

export function useUpdateSettingsWithToast() {
  const mutation = useUpdateSettings();
  const { show } = useToast();

  return {
    ...mutation,
    mutateAsync: async (...args: Parameters<typeof mutation.mutateAsync>) => {
      try {
        const result = await mutation.mutateAsync(...args);
        show('Settings saved', 'success');
        return result;
      } catch (error) {
        show(getErrorMessage(error), 'error');
        throw error;
      }
    },
  };
}

export function useOverrideCategoryWithToast() {
  const mutation = useOverrideCategory();
  const { show } = useToast();

  return {
    ...mutation,
    mutateAsync: async (...args: Parameters<typeof mutation.mutateAsync>) => {
      try {
        const result = await mutation.mutateAsync(...args);
        show('Category updated', 'success');
        return result;
      } catch (error) {
        show(getErrorMessage(error), 'error');
        throw error;
      }
    },
  };
}

export function useSyncBankWithToast() {
  const mutation = useSyncBank();
  const { show } = useToast();

  return {
    ...mutation,
    mutateAsync: async (...args: Parameters<typeof mutation.mutateAsync>) => {
      try {
        const result = await mutation.mutateAsync(...args);
        show('Bank synced successfully', 'success');
        return result;
      } catch (error) {
        show(getErrorMessage(error), 'error');
        throw error;
      }
    },
  };
}

export function useDisconnectBankWithToast() {
  const mutation = useDisconnectBank();
  const { show } = useToast();

  return {
    ...mutation,
    mutateAsync: async (...args: Parameters<typeof mutation.mutateAsync>) => {
      try {
        const result = await mutation.mutateAsync(...args);
        show('Bank disconnected', 'success');
        return result;
      } catch (error) {
        show(getErrorMessage(error), 'error');
        throw error;
      }
    },
  };
}

export function useSubmitQuarterlyWithToast() {
  const mutation = useSubmitQuarterly();
  const { show } = useToast();

  return {
    ...mutation,
    mutateAsync: async (...args: Parameters<typeof mutation.mutateAsync>) => {
      try {
        const result = await mutation.mutateAsync(...args);
        show('Quarterly submission sent', 'success');
        return result;
      } catch (error) {
        show(getErrorMessage(error), 'error');
        throw error;
      }
    },
  };
}
