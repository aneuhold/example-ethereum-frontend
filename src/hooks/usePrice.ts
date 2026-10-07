import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { appConfig } from '@/config/env';
import etherscanService from '@/services/Etherscan.service';
import type { ApiError } from '@/types/error';

/**
 * Hook to fetch the current ETH→USD price, refreshed on the configured interval.
 * @returns Query result with ETH price in USD
 */
export function usePrice(): UseQueryResult<number, ApiError> {
  return useQuery<number, ApiError>({
    queryKey: ['price', 'ETH'],
    queryFn: ({ signal }) => etherscanService.getEthPrice(signal),
    refetchInterval: appConfig.refreshInterval, // Auto-refresh price every 5 minutes
  });
}
