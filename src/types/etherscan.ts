interface EtherscanBaseParams {
  chainid: '1'; // Ethereum mainnet
  apikey?: string;
}

export interface EtherscanBalanceParams extends EtherscanBaseParams {
  module: 'account';
  action: 'balance';
  address: string;
  tag: 'latest';
}

export interface EtherscanPriceParams extends EtherscanBaseParams {
  module: 'stats';
  action: 'ethprice';
}

/**
 * Etherscan response envelope. On failure (`status: '0'`), `result` holds an
 * error message string instead of the endpoint's data.
 */
type EtherscanResponse<TResult> =
  | { status: '1'; message: string; result: TResult }
  | { status: '0'; message: string; result: string };

export type EtherscanBalanceResponse = EtherscanResponse<string>; // Wei amount as string

export type EtherscanPriceResponse = EtherscanResponse<{
  ethbtc: string;
  ethbtc_timestamp: string;
  ethusd: string;
  ethusd_timestamp: string;
}>;
