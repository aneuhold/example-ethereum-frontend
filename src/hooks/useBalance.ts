import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import axios from 'axios';
import BigNumber from 'bignumber.js';
import { appConfig } from '@/config/env';
import type { EtherscanBalanceResponse } from '@/types';
import { ApiError } from '@/types';

/**
 * Hook to fetch ETH balance for an address with retry logic and error handling.
 * @param address - Ethereum address to fetch balance for
 * @returns Query result with balance in ETH as a string with 6 decimals
 */
export function useBalance(address: string): UseQueryResult<string, ApiError> {
  return useQuery<string, ApiError>({
    queryKey: ['balance', address],
    queryFn: async ({ signal }) => {
      try {
        // Validate address format (basic check)
        if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
          throw new ApiError('Invalid Ethereum address format', 400, 'INVALID_ADDRESS');
        }

        const params: Record<string, string> = {
          module: 'account',
          action: 'balance',
          address,
          tag: 'latest',
        };

        // Only add API key if available
        if (appConfig.etherscanApiKey) {
          params.apikey = appConfig.etherscanApiKey;
        }

        const response = await axios.get<EtherscanBalanceResponse>(
          appConfig.apiBaseUrl,
          {
            params,
            signal, // Support request cancellation
            timeout: 10000, // 10 second timeout
          }
        );

        // Handle API errors
        if (response.data.status === '0') {
          throw new ApiError(
            response.data.message || 'Failed to fetch balance',
            response.status,
            'API_ERROR'
          );
        }

        // Convert Wei to ETH with precision handling
        const weiBalance = response.data.result;
        if (!weiBalance || weiBalance === '0') {
          return '0.000000';
        }

        return new BigNumber(weiBalance)
          .dividedBy(new BigNumber(10).pow(18))
          .toFixed(6);
      } catch (error) {
        // Re-throw AbortError to handle query cancellation
        if (error instanceof Error && error.name === 'AbortError') {
          throw error;
        }

        // Handle network errors
        if (axios.isAxiosError(error)) {
          const message = error.response?.data?.message || error.message;
          throw new ApiError(
            `Network error: ${message}`,
            error.response?.status || 500,
            'NETWORK_ERROR'
          );
        }

        // Re-throw ApiError instances
        if (error instanceof ApiError) {
          throw error;
        }

        // Handle unexpected errors
        throw new ApiError(
          'An unexpected error occurred while fetching balance',
          500,
          'UNKNOWN_ERROR'
        );
      }
    },
    retry: (failureCount, error) => {
      // Don't retry on client errors (4xx) or validation errors
      if (error instanceof ApiError && (error.status === 400 || error.code === 'INVALID_ADDRESS')) {
        return false;
      }
      // Retry up to configured attempts for other errors
      return failureCount < appConfig.retryAttempts;
    },
    retryDelay: (attemptIndex) => {
      // Exponential backoff: 1s, 2s, 4s, etc.
      return Math.min(appConfig.retryDelay * Math.pow(2, attemptIndex), 30000);
    },
    staleTime: appConfig.refreshInterval,
    gcTime: appConfig.refreshInterval * 2, // Keep in cache longer than stale time
    refetchOnWindowFocus: false, // Don't refetch on window focus for this use case
  });
}