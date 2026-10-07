import { describe, expect, it, vi } from 'vitest';
import etherscanService from '@/services/Etherscan.service';
import { renderHook, waitFor } from '@/test/test-utils';
import { useBalances } from './useBalances';

describe('useBalances', () => {
  it('returns one result per address, in input order', async () => {
    const balances: Record<string, string> = {
      '0x0000000000000000000000000000000000000001': '1.000000',
      '0x0000000000000000000000000000000000000002': '2.000000',
      '0x0000000000000000000000000000000000000003': '3.000000',
    };
    const addresses = Object.keys(balances).reverse();
    vi.spyOn(etherscanService, 'getBalance').mockImplementation(async (address) => {
      return balances[address];
    });

    const { result } = renderHook(() => useBalances(addresses));

    await waitFor(() => expect(result.current.every((query) => query.isSuccess)).toBe(true));
    expect(result.current.map((query) => query.data)).toEqual(
      addresses.map((address) => balances[address])
    );
  });
});
