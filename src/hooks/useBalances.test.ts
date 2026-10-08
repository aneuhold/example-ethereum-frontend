import { afterEach, describe, expect, it, vi } from 'vitest';
import { appConfig } from '@/config/env';
import etherscanService from '@/services/Etherscan.service';
import { renderHook, waitFor } from '@/test/test-utils';
import { useBalances } from './useBalances';

describe('useBalances', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

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

  it('keeps a zero balance fresh after the refresh interval, but not a funded one', async () => {
    const fundedAddress = '0x0000000000000000000000000000000000000001';
    const emptyAddress = '0x0000000000000000000000000000000000000002';
    vi.spyOn(etherscanService, 'getBalance').mockImplementation(async (address) =>
      address === fundedAddress ? '1.000000' : '0.000000'
    );

    const { result, rerender } = renderHook(() => useBalances([fundedAddress, emptyAddress]));
    await waitFor(() => expect(result.current.every((query) => query.isSuccess)).toBe(true));

    // Only the clock is faked, so the refetch interval does not fire during the test
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(Date.now() + appConfig.refreshInterval + 1);
    rerender();

    expect(result.current.map((query) => query.isStale)).toEqual([true, false]);
  });
});
