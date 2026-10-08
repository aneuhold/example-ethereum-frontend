import { appConfig } from '@/config/env';
import { ApiError } from '@/types/error';
import axios, { AxiosError, AxiosHeaders, type AxiosResponse } from 'axios';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import etherscanService from './Etherscan.service';

describe('EtherscanService', () => {
  const originalApiKey = appConfig.etherscanApiKey;
  const originalUseMockApi = appConfig.useMockApi;

  const address = '0x0000000000000000000000000000000000000001';

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
    await vi.advanceTimersByTimeAsync(1000);

    await expect(balance).resolves.toMatch(/^\d+\.\d{6}$/);
    await expect(price).resolves.toBeGreaterThan(0);
    expect(getSpy).not.toHaveBeenCalled();
  });

  describe('getBalance', () => {
    it('converts Wei to ETH with 6 decimals', async () => {
      vi.spyOn(axios, 'get').mockResolvedValue(
        createResponse({ status: '1', message: 'OK', result: '1234567890123456789' })
      );

      await expect(etherscanService.getBalance(address)).resolves.toBe('1.234568');
    });

    it("returns '0.000000' for a zero balance", async () => {
      vi.spyOn(axios, 'get').mockResolvedValue(
        createResponse({ status: '1', message: 'OK', result: '0' })
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
      const getSpy = vi
        .spyOn(axios, 'get')
        .mockResolvedValue(createResponse({ status: '1', message: 'OK', result: '0' }));

      await etherscanService.getBalance(address);
      appConfig.etherscanApiKey = 'test-key';
      await etherscanService.getBalance(address);

      expect(getSpy.mock.calls[0][1]?.params).not.toHaveProperty('apikey');
      expect(getSpy.mock.calls[1][1]?.params).toMatchObject({ address, apikey: 'test-key' });
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
