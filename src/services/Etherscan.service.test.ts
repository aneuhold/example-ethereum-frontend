import { appConfig } from '@/config/env';
import { ApiError } from '@/types/error';
import axios, { AxiosError, AxiosHeaders, type AxiosResponse } from 'axios';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import etherscanService from './Etherscan.service';

describe('EtherscanService', () => {
  const originalApiKey = appConfig.etherscanApiKey;
  const originalUseMockApi = appConfig.useMockApi;

  const address = '0x0000000000000000000000000000000000000001';
  const otherAddress = '0x00000000219ab540356cbb839cbe05303d7705fa';

  /**
   * Builds `count` distinct valid addresses.
   */
  const createAddresses = (count: number) =>
    Array.from({ length: count }, (_, index) => `0x${(index + 1).toString(16).padStart(40, '0')}`);

  /**
   * Builds an Axios response with the given body and HTTP status.
   */
  const createResponse = (data: unknown, status = 200): AxiosResponse => ({
    data,
    status,
    statusText: '',
    headers: {},
    config: { headers: new AxiosHeaders() },
  });

  beforeEach(() => {
    appConfig.etherscanApiKey = undefined;
    appConfig.useMockApi = false;
  });

  afterEach(() => {
    appConfig.etherscanApiKey = originalApiKey;
    appConfig.useMockApi = originalUseMockApi;
    vi.useRealTimers();
  });

  it('returns random data without sending a request when the mock API is on', async () => {
    appConfig.useMockApi = true;
    vi.useFakeTimers();
    const getSpy = vi.spyOn(axios, 'get');

    const balance = etherscanService.getBalance(address);
    const price = etherscanService.getEthPrice();
    await vi.runAllTimersAsync();

    await expect(balance).resolves.toMatch(/^\d+\.\d{6}$/);
    await expect(price).resolves.toBeGreaterThan(0);
    expect(getSpy).not.toHaveBeenCalled();
  });

  describe('getBalance', () => {
    it('converts Wei to ETH with 6 decimals', async () => {
      vi.spyOn(axios, 'get').mockResolvedValue(
        createResponse({
          status: '1',
          message: 'OK',
          result: [{ account: address, balance: '1234567890123456789' }],
        })
      );

      await expect(etherscanService.getBalance(address)).resolves.toBe('1.234568');
    });

    it("returns '0.000000' for a zero balance", async () => {
      vi.spyOn(axios, 'get').mockResolvedValue(
        createResponse({ status: '1', message: 'OK', result: [{ account: address, balance: '0' }] })
      );

      await expect(etherscanService.getBalance(address)).resolves.toBe('0.000000');
    });

    it('throws INVALID_ADDRESS without sending a request for an invalid address', async () => {
      const getSpy = vi.spyOn(axios, 'get');

      await expect(etherscanService.getBalance('0x123')).rejects.toMatchObject({
        code: 'INVALID_ADDRESS',
        status: 400,
      });
      expect(getSpy).not.toHaveBeenCalled();
    });

    it('includes the API key only when it is configured', async () => {
      const getSpy = vi.spyOn(axios, 'get').mockResolvedValue(
        createResponse({
          status: '1',
          message: 'OK',
          result: [{ account: address, balance: '0' }],
        })
      );

      await etherscanService.getBalance(address);
      appConfig.etherscanApiKey = 'test-key';
      await etherscanService.getBalance(address);

      expect(getSpy.mock.calls[0][1]?.params).not.toHaveProperty('apikey');
      expect(getSpy.mock.calls[1][1]?.params).toMatchObject({ address, apikey: 'test-key' });
    });

    it('sends concurrent calls in one request and matches results by account', async () => {
      const getSpy = vi.spyOn(axios, 'get').mockResolvedValue(
        createResponse({
          status: '1',
          message: 'OK',
          result: [
            {
              account: otherAddress.toUpperCase().replace('0X', '0x'),
              balance: '2000000000000000000',
            },
            { account: address, balance: '1000000000000000000' },
          ],
        })
      );

      const balances = Promise.all([
        etherscanService.getBalance(address),
        etherscanService.getBalance(otherAddress),
        etherscanService.getBalance(address),
      ]);

      await expect(balances).resolves.toEqual(['1.000000', '2.000000', '1.000000']);
      expect(getSpy).toHaveBeenCalledTimes(1);
      expect(getSpy.mock.calls[0][1]?.params).toMatchObject({
        action: 'balancemulti',
        address: `${address},${otherAddress}`,
      });
    });

    it('sends calls made a few milliseconds apart in one request', async () => {
      vi.useFakeTimers();
      const getSpy = vi.spyOn(axios, 'get').mockResolvedValue(
        createResponse({
          status: '1',
          message: 'OK',
          result: [
            { account: address, balance: '0' },
            { account: otherAddress, balance: '0' },
          ],
        })
      );

      const first = etherscanService.getBalance(address);
      await vi.advanceTimersByTimeAsync(20);
      const second = etherscanService.getBalance(otherAddress);
      await vi.runAllTimersAsync();

      await expect(Promise.all([first, second])).resolves.toEqual(['0.000000', '0.000000']);
      expect(getSpy).toHaveBeenCalledTimes(1);
    });

    it('sends 21 addresses in two requests of 20 and 1', async () => {
      const addresses = createAddresses(21);
      const getSpy = vi.spyOn(axios, 'get').mockImplementation(async (_url, config) => {
        const requested: string = config?.params.address;
        return createResponse({
          status: '1',
          message: 'OK',
          result: requested.split(',').map((account) => ({ account, balance: '0' })),
        });
      });

      await Promise.all(addresses.map((each) => etherscanService.getBalance(each)));

      expect(getSpy).toHaveBeenCalledTimes(2);
      expect(getSpy.mock.calls[0][1]?.params.address).toBe(addresses.slice(0, 20).join(','));
      expect(getSpy.mock.calls[1][1]?.params.address).toBe(addresses[20]);
    });

    it('throws INVALID_DATA for an address missing from the result', async () => {
      vi.spyOn(axios, 'get').mockResolvedValue(
        createResponse({ status: '1', message: 'OK', result: [{ account: address, balance: '0' }] })
      );

      const balances = Promise.allSettled([
        etherscanService.getBalance(address),
        etherscanService.getBalance(otherAddress),
      ]);

      const [present, missing] = await balances;
      expect(present).toEqual({ status: 'fulfilled', value: '0.000000' });
      expect(missing).toMatchObject({ status: 'rejected', reason: { code: 'INVALID_DATA' } });
    });

    it('rejects only the addresses in a failed request', async () => {
      const addresses = createAddresses(21);
      vi.spyOn(axios, 'get')
        .mockRejectedValueOnce(new AxiosError('timeout', 'ECONNABORTED'))
        .mockResolvedValueOnce(
          createResponse({
            status: '1',
            message: 'OK',
            result: [{ account: addresses[20], balance: '0' }],
          })
        );

      const results = await Promise.allSettled(
        addresses.map((each) => etherscanService.getBalance(each))
      );

      expect(results.slice(0, 20).every((result) => result.status === 'rejected')).toBe(true);
      expect(results[0]).toMatchObject({ reason: { code: 'NETWORK_ERROR' } });
      expect(results[20]).toEqual({ status: 'fulfilled', value: '0.000000' });
    });
  });

  describe('getEthPrice', () => {
    it('parses ethusd', async () => {
      vi.spyOn(axios, 'get').mockResolvedValue(
        createResponse({ status: '1', message: 'OK', result: { ethusd: '2000.50' } })
      );

      await expect(etherscanService.getEthPrice()).resolves.toBe(2000.5);
    });

    it('throws INVALID_DATA when ethusd is missing', async () => {
      vi.spyOn(axios, 'get').mockResolvedValue(
        createResponse({ status: '1', message: 'OK', result: {} })
      );

      await expect(etherscanService.getEthPrice()).rejects.toMatchObject({ code: 'INVALID_DATA' });
    });

    it.each(['0', 'not-a-number'])('throws INVALID_PRICE when ethusd is %s', async (ethusd) => {
      vi.spyOn(axios, 'get').mockResolvedValue(
        createResponse({ status: '1', message: 'OK', result: { ethusd } })
      );

      await expect(etherscanService.getEthPrice()).rejects.toMatchObject({
        code: 'INVALID_PRICE',
      });
    });
  });

  describe('error mapping', () => {
    it("throws API_ERROR with the response message for status '0'", async () => {
      vi.spyOn(axios, 'get').mockResolvedValue(
        createResponse({ status: '0', message: 'NOTOK', result: 'Invalid API Key' })
      );

      await expect(etherscanService.getBalance(address)).rejects.toMatchObject({
        code: 'API_ERROR',
        message: 'NOTOK',
        status: 200,
      });
    });

    it('throws NETWORK_ERROR with the response status for an Axios error with a response', async () => {
      vi.spyOn(axios, 'get').mockRejectedValue(
        new AxiosError(
          'Request failed',
          'ERR_BAD_RESPONSE',
          undefined,
          undefined,
          createResponse({ message: 'Service unavailable' }, 503)
        )
      );

      await expect(etherscanService.getBalance(address)).rejects.toMatchObject({
        code: 'NETWORK_ERROR',
        message: 'Network error: Service unavailable',
        status: 503,
      });
    });

    it('throws NETWORK_ERROR with status 500 for an Axios error without a response', async () => {
      vi.spyOn(axios, 'get').mockRejectedValue(new AxiosError('timeout', 'ECONNABORTED'));

      await expect(etherscanService.getBalance(address)).rejects.toMatchObject({
        code: 'NETWORK_ERROR',
        message: 'Network error: timeout',
        status: 500,
      });
    });

    it('re-throws a cancellation unchanged', async () => {
      const canceledError = new axios.CanceledError();
      vi.spyOn(axios, 'get').mockRejectedValue(canceledError);

      await expect(etherscanService.getBalance(address)).rejects.toBe(canceledError);
    });

    it('throws UNKNOWN_ERROR for any other error', async () => {
      vi.spyOn(axios, 'get').mockRejectedValue(new TypeError('boom'));

      await expect(etherscanService.getBalance(address)).rejects.toMatchObject({
        code: 'UNKNOWN_ERROR',
        status: 500,
      });
    });
  });

  describe('shouldRetryRequest', () => {
    it('does not retry a 4xx ApiError', () => {
      expect(etherscanService.shouldRetryRequest(0, new ApiError('Bad request', 429))).toBe(false);
    });

    it('retries a 5xx ApiError below the attempt limit', () => {
      const error = new ApiError('Server error', 503, 'NETWORK_ERROR');

      expect(etherscanService.shouldRetryRequest(appConfig.retryAttempts - 1, error)).toBe(true);
    });

    it('stops retrying once the attempt limit is reached', () => {
      const error = new ApiError('Server error', 503, 'NETWORK_ERROR');

      expect(etherscanService.shouldRetryRequest(appConfig.retryAttempts, error)).toBe(false);
    });
  });
});
