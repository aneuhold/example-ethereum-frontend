import { StrictMode } from 'react';
import type { ErrorInfo } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { onlineManager, QueryClient } from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
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
      gcTime: 24 * 60 * 60 * 1000, // 24 hours, matching the persister's default maxAge
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

// Saves the query cache to localStorage, so cached data shows on reload and while offline
const persister = createAsyncStoragePersister({ storage: window.localStorage });

// onlineManager assumes it starts online, so a page opened offline would retry until it fails
onlineManager.setOnline(navigator.onLine);

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
      <PersistQueryClientProvider client={queryClient} persistOptions={{ persister }}>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </PersistQueryClientProvider>
    </ErrorBoundary>
  </StrictMode>
);
