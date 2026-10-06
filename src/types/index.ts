// Domain Types
export interface Address {
  id: string;
  address: string;
  balance?: string; // ETH balance as string to avoid precision issues
  balanceUsd?: string; // USD value as string
  isLoading?: boolean;
  error?: string | null;
}

export interface EthPrice {
  usd: number;
  lastUpdated: number;
}

// API Response Types
export interface EtherscanBalanceResponse {
  status: string;
  message: string;
  result: string; // Wei amount as string
}

export interface EtherscanPriceResponse {
  status: string;
  message: string;
  result: {
    ethbtc: string;
    ethbtc_timestamp: string;
    ethusd: string;
    ethusd_timestamp: string;
  };
}

// Error Types
export class ApiError extends Error {
  constructor(
    message: string,
    public status?: number,
    public code?: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

// Environment Types
export interface AppConfig {
  etherscanApiKey?: string;
  apiBaseUrl: string;
  refreshInterval: number;
  retryAttempts: number;
  retryDelay: number;
} 