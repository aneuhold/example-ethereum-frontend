import React from 'react';
import type { ReactElement } from 'react';
import {
  render,
  renderHook,
  type RenderHookOptions,
  type RenderOptions,
} from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';

/**
 * Create a new QueryClient for each test to avoid state leakage
 */
const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
    },
  });

/**
 * Creates a wrapper component that provides all necessary context providers. The wrapper keeps
 * one QueryClient across re-renders.
 */
const createWrapper = () => {
  const queryClient = createTestQueryClient();

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>{children}</BrowserRouter>
    </QueryClientProvider>
  );
};

/**
 * Custom render function that includes providers
 */
const customRender = (ui: ReactElement, options?: Omit<RenderOptions, 'wrapper'>) =>
  render(ui, { wrapper: createWrapper(), ...options });

/**
 * Custom renderHook function that includes providers
 */
const customRenderHook = <Result, Props>(
  hook: (initialProps: Props) => Result,
  options?: Omit<RenderHookOptions<Props>, 'wrapper'>
) => renderHook(hook, { wrapper: createWrapper(), ...options });

// Re-export everything
export * from '@testing-library/react';
export { customRender as render, customRenderHook as renderHook };
