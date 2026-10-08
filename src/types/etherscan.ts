interface EtherscanBaseParams {
  chainid: '1'; // Ethereum mainnet
  apikey?: string;
}

export interface EtherscanBalanceParams extends EtherscanBaseParams {
  module: 'account';
  action: 'balancemulti';
  address: string; // Comma-separated addresses, up to 20
  tag: 'latest';
}

export interface EtherscanPriceParams extends EtherscanBaseParams {
  module: 'stats';
  action: 'ethprice';
}

export type EtherscanParams = EtherscanBalanceParams | EtherscanPriceParams;

/**
 * Etherscan response envelope. On failure (`status: '0'`), `result` holds an
 * error message string instead of the endpoint's data.
 */
export type EtherscanResponse<TResult> =
  | { status: '1'; message: string; result: TResult }
  | { status: '0'; message: string; result: string };

export type EtherscanBalanceResult = {
  account: string;
  balance: string; // Wei amount as string
}[];

export interface EtherscanPriceResult {
  ethbtc: string;
  ethbtc_timestamp: string;
  ethusd: string;
  ethusd_timestamp: string;
}
