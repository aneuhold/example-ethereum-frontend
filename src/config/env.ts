import type { AppConfig } from '@/types';

/**
 * Environment variable validation and configuration
 */
function validateEnv(): AppConfig {
  const config: AppConfig = {
    etherscanApiKey: import.meta.env.VITE_ETHERSCAN_API_KEY,
    apiBaseUrl: import.meta.env.VITE_API_BASE_URL || 'https://api.etherscan.io/api',
    refreshInterval: Number(import.meta.env.VITE_REFRESH_INTERVAL) || 300_000, // 5 minutes
    retryAttempts: Number(import.meta.env.VITE_RETRY_ATTEMPTS) || 3,
    retryDelay: Number(import.meta.env.VITE_RETRY_DELAY) || 1000,
  };

  // Warn about missing API key in development
  if (!config.etherscanApiKey && import.meta.env.DEV) {
    console.warn(
      '⚠️  VITE_ETHERSCAN_API_KEY not found. API requests will be rate-limited.\n' +
      'Get a free API key at: https://etherscan.io/apis'
    );
  }

  return config;
}

export const appConfig = validateEnv();

/**
 * Utility to check if we're in development mode
 */
export const isDevelopment = import.meta.env.DEV;

/**
 * Utility to check if we're in production mode
 */
export const isProduction = import.meta.env.PROD; 