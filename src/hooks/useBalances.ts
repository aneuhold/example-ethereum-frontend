import { useQueries, type UseQueryOptions, type UseQueryResult } from '@tanstack/react-query';
import etherscanService from '@/services/Etherscan.service';
import type { ApiError } from '@/types/error';

/**
 * Hook to fetch the ETH balance of each address.
 * @param addresses - Ethereum addresses to fetch balances for
 * @returns One query result per address, in input order, each with the balance in ETH as a
 * string with 6 decimals
 */
export function useBalances(addresses: string[]): UseQueryResult<string, ApiError>[] {
  return useQueries<UseQueryOptions<string, ApiError>[]>({
    queries: addresses.map((address) => ({
      queryKey: ['balance', address],
      queryFn: ({ signal }) => etherscanService.getBalance(address, signal),
    })),
  });
}
