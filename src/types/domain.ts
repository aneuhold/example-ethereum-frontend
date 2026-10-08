import type BigNumber from 'bignumber.js';
import type { ApiError } from '@/types/error';

export interface Address {
  address: string;
  balance: BigNumber | undefined; // ETH
  balanceUsd: BigNumber | undefined; // USD
  isLoading: boolean;
  error: ApiError | null;
}

export interface EthPrice {
  usd: number;
  lastUpdated: number;
}
