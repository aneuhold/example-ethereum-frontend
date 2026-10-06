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
