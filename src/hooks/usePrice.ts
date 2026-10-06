import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import axios from 'axios';
import BigNumber from 'bignumber.js';
import { appConfig } from '@/config/env';
import type { EtherscanPriceResponse } from '@/types';
import { ApiError } from '@/types';

/**
 * Hook to fetch current ETH→USD price with caching and error handling.
 * @returns Query result with ETH price in USD
 */
export function usePrice(): UseQueryResult<number, ApiError> {
  return useQuery<number, ApiError>({
    queryKey: ['price', 'ETH'],
    queryFn: async ({ signal }) => {
      try {
        const params: Record<string, string> = {
          module: 'stats',
          action: 'ethprice',
        };

        // Only add API key if available
        if (appConfig.etherscanApiKey) {
          params.apikey = appConfig.etherscanApiKey;
        }

        const response = await axios.get<EtherscanPriceResponse>(
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
            response.data.message || 'Failed to fetch ETH price',
            response.status,
            'API_ERROR'
          );
        }

        const ethUsd = response.data.result?.ethusd;
        if (!ethUsd) {
          throw new ApiError(
            'Invalid price data received from API',
            500,
            'INVALID_DATA'
          );
        }

        // Parse and validate price
        const price = new BigNumber(ethUsd).toNumber();
        if (isNaN(price) || price <= 0) {
          throw new ApiError(
            'Invalid price value received from API',
            500,
            'INVALID_PRICE'
          );
        }

        return price;
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
          'An unexpected error occurred while fetching ETH price',
          500,
          'UNKNOWN_ERROR'
        );
      }
    },
    retry: (failureCount, error) => {
      // Don't retry on client errors (4xx)
      if (error instanceof ApiError && error.status === 400) {
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
    gcTime: appConfig.refreshInterval * 2,
    refetchOnWindowFocus: false,
    refetchInterval: appConfig.refreshInterval, // Auto-refresh price every 5 minutes
  });
}