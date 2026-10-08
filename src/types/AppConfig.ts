export interface AppConfig {
  etherscanApiKey?: string;
  apiBaseUrl: string;
  refreshInterval: number;
  retryAttempts: number;
  retryDelay: number;
  useMockApi: boolean;
}
