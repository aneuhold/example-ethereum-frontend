import { StrictMode } from 'react';
import type { ErrorInfo } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { appConfig, isDevelopment } from '@/config/env';
import etherscanService from '@/services/Etherscan.service';
import App from './App';
import './index.css';

// Initialize React Query client with better defaults
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: appConfig.refreshInterval,
      gcTime: appConfig.refreshInterval * 2, // Keep in cache longer than stale time
      retry: (failureCount, error) => etherscanService.shouldRetryRequest(failureCount, error),
      retryDelay: (attemptIndex) => {
        // Exponential backoff: 1s, 2s, 4s, etc.
        return Math.min(appConfig.retryDelay * Math.pow(2, attemptIndex), 30000);
      },
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 1,
    },
  },
});

// Error handler for ErrorBoundary
const handleError = (error: Error, errorInfo: ErrorInfo) => {
  if (isDevelopment) {
    console.error('Application Error:', error, errorInfo);
  }
  // In production, you would send this to your error reporting service
  // trackError(error, errorInfo);
};

createRoot(document.getElementById('root') as HTMLElement).render(
  <StrictMode>
    <ErrorBoundary onError={handleError}>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </QueryClientProvider>
    </ErrorBoundary>
  </StrictMode>
);
