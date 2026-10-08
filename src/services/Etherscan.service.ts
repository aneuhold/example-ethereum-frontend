import axios from 'axios';
import BigNumber from 'bignumber.js';
import { appConfig } from '@/config/env';
import type {
  EtherscanBalanceResult,
  EtherscanParams,
  EtherscanPriceResult,
  EtherscanResponse,
} from '@/types/etherscan';
import { ApiError } from '@/types/error';
import etherAddressService from '@/services/EtherAddress.service';

/**
 * Client for the Etherscan V2 API. Every request error is thrown as an `ApiError`, except
 * cancellations, which are re-thrown unchanged. When `appConfig.useMockApi` is set, it returns
 * random data instead of sending requests.
 */
class EtherscanService {
  private readonly requestTimeoutMs = 10000;

  /**
   * Fetches the ETH balance of an address.
   * @param address - Ethereum address to fetch the balance for
   * @param signal - Signal that cancels the request
   * @returns Balance in ETH as a string with 6 decimals
   */
  async getBalance(address: string, signal?: AbortSignal): Promise<string> {
    if (!etherAddressService.isValidAddress(address)) {
      throw new ApiError('Invalid Ethereum address format', 400, 'INVALID_ADDRESS');
    }
    if (appConfig.useMockApi) {
      return this.mockRequest(new BigNumber(Math.random() * 100).toFixed(6));
    }

    const weiBalance = await this.request<EtherscanBalanceResult>(
      { chainid: '1', module: 'account', action: 'balance', address, tag: 'latest' },
      signal
    );

    // Convert Wei to ETH with precision handling
    if (!weiBalance || weiBalance === '0') {
      return '0.000000';
    }
    return new BigNumber(weiBalance).dividedBy(new BigNumber(10).pow(18)).toFixed(6);
  }

  /**
   * Fetches the current ETH→USD price.
   * @param signal - Signal that cancels the request
   * @returns ETH price in USD
   */
  async getEthPrice(signal?: AbortSignal): Promise<number> {
    if (appConfig.useMockApi) {
      return this.mockRequest(
        new BigNumber(2000 + Math.random() * 2000).decimalPlaces(2).toNumber()
      );
    }

    const result = await this.request<EtherscanPriceResult>(
      { chainid: '1', module: 'stats', action: 'ethprice' },
      signal
    );

    const ethUsd = result?.ethusd;
    if (!ethUsd) {
      throw new ApiError('Invalid price data received from API', 500, 'INVALID_DATA');
    }

    // Parse and validate price
    const price = new BigNumber(ethUsd).toNumber();
    if (isNaN(price) || price <= 0) {
      throw new ApiError('Invalid price value received from API', 500, 'INVALID_PRICE');
    }

    return price;
  }

  /**
   * Decides whether a failed request is retried. Client errors (4xx) are never retried; other
   * errors are retried up to the configured number of attempts.
   * @param failureCount - Number of times the request has failed so far
   * @param error - Error from the latest failure
   */
  shouldRetryRequest(failureCount: number, error: Error): boolean {
    if (error instanceof ApiError && error.status && error.status >= 400 && error.status < 500) {
      return false;
    }
    return failureCount < appConfig.retryAttempts;
  }

  /**
   * Resolves with a value after a random delay of up to one second, so loading states show as they
   * would for a real request.
   * @param value - Value to resolve with
   */
  private async mockRequest<TValue>(value: TValue): Promise<TValue> {
    await new Promise((resolve) => setTimeout(resolve, Math.random() * 1000));
    return value;
  }

  /**
   * Sends a GET request to Etherscan.
   * @param params - Query parameters. The API key is added when one is configured.
   * @param signal - Signal that cancels the request
   * @returns The `result` field of a successful response
   */
  private async request<TResult>(params: EtherscanParams, signal?: AbortSignal): Promise<TResult> {
    try {
      const response = await axios.get<EtherscanResponse<TResult>>(appConfig.apiBaseUrl, {
        params: appConfig.etherscanApiKey
          ? { ...params, apikey: appConfig.etherscanApiKey }
          : params,
        signal,
        timeout: this.requestTimeoutMs,
      });

      // Handle API errors
      if (response.data.status === '0') {
        throw new ApiError(
          response.data.message || 'Etherscan request failed',
          response.status,
          'API_ERROR'
        );
      }

      return response.data.result;
    } catch (error) {
      // Re-throw cancellations, and the API errors thrown above, unchanged
      if (axios.isCancel(error) || error instanceof ApiError) {
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

      // Handle unexpected errors
      throw new ApiError(
        'An unexpected error occurred while calling Etherscan',
        500,
        'UNKNOWN_ERROR'
      );
    }
  }
}

const etherscanService = new EtherscanService();
export default etherscanService;
