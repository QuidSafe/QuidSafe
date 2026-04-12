import React from 'react';
import { ClerkProvider, ClerkLoaded } from '@clerk/clerk-expo';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { publishableKey, tokenCache } from '@/lib/auth';
import { ThemeProvider } from '@/lib/ThemeContext';
import { ToastProvider } from '@/components/ui/Toast';
import { AppErrorBoundary } from '@/components/ui/ErrorBoundary';
import { BiometricGate } from '@/components/ui/BiometricGate';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 2, refetchOnWindowFocus: false },
  },
});

export function Providers({ children }: { children: React.ReactNode }) {
  if (!publishableKey) return null;

  return (
    <ClerkProvider publishableKey={publishableKey} tokenCache={tokenCache}>
      <ClerkLoaded>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider>
            <ToastProvider>
              <BiometricGate>
                <AppErrorBoundary>
                  {children}
                </AppErrorBoundary>
              </BiometricGate>
            </ToastProvider>
          </ThemeProvider>
        </QueryClientProvider>
      </ClerkLoaded>
    </ClerkProvider>
  );
}
