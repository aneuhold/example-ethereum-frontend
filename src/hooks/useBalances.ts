import {
  useQueries,
  type Query,
  type UseQueryOptions,
  type UseQueryResult,
} from '@tanstack/react-query';
import { appConfig } from '@/config/env';
import etherscanService from '@/services/Etherscan.service';
import type { ApiError } from '@/types/error';

/**
 * Time a cached balance stays fresh before it is refetched. A zero balance carries no exposure and
 * rarely changes, so it is refetched six times less often.
 * @param query - Balance query, with the balance in ETH as its data once loaded
 */
const getBalanceTtl = (query: Query<string, ApiError>): number =>
  query.state.data === '0.000000' ? appConfig.refreshInterval * 6 : appConfig.refreshInterval;

/**
 * Hook to fetch the ETH balance of each address. Each balance is refetched in the background once
 * it goes stale: after `appConfig.refreshInterval` (5 minutes by default), or six times that for a
 * zero balance. Refetches pause while the tab is hidden.
 * @param addresses - Ethereum addresses to fetch balances for
 * @returns One query result per address, in input order, each with the balance in ETH as a
 * string with 6 decimals
 */
export function useBalances(addresses: string[]): UseQueryResult<string, ApiError>[] {
  return useQueries<UseQueryOptions<string, ApiError>[]>({
    queries: addresses.map((address) => ({
      queryKey: ['balance', address],
      queryFn: () => etherscanService.getBalance(address),
      staleTime: getBalanceTtl,
      refetchInterval: getBalanceTtl,
    })),
  });
}
