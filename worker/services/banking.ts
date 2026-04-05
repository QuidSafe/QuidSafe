// TrueLayer Open Banking integration for Cloudflare Workers

import { encrypt, decrypt } from '../utils/crypto';

const TRUELAYER_AUTH_URL = 'https://auth.truelayer.com';
const TRUELAYER_API_URL = 'https://api.truelayer.com';
const TRUELAYER_SANDBOX_AUTH_URL = 'https://auth.truelayer-sandbox.com';
const TRUELAYER_SANDBOX_API_URL = 'https://api.truelayer-sandbox.com';

interface TrueLayerConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  encryptionKey: string;
  sandbox?: boolean;
}

interface TrueLayerToken {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
}

interface TrueLayerTransaction {
  transaction_id: string;
  timestamp: string;
  description: string;
  amount: number;
  currency: string;
  transaction_type: string;
  transaction_category: string;
  merchant_name?: string;
}

function getAuthUrl(config: TrueLayerConfig): string {
  return config.sandbox ? TRUELAYER_SANDBOX_AUTH_URL : TRUELAYER_AUTH_URL;
}

function getApiUrl(config: TrueLayerConfig): string {
  return config.sandbox ? TRUELAYER_SANDBOX_API_URL : TRUELAYER_API_URL;
}

/**
 * Generate the TrueLayer auth link for a user to connect their bank.
 */
export function getConnectUrl(config: TrueLayerConfig, state: string): string {
  const authBase = getAuthUrl(config);
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    scope: 'info accounts balance transactions',
    state,
    providers: 'uk-ob-all uk-oauth-all',
  });

  return `${authBase}/?${params.toString()}`;
}

/**
 * Exchange OAuth code for access + refresh tokens.
 */
export async function exchangeCode(
  code: string,
  config: TrueLayerConfig,
): Promise<TrueLayerToken> {
  const authBase = getAuthUrl(config);
  const response = await fetch(`${authBase}/connect/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: config.clientId,
      client_secret: config.clientSecret,
      redirect_uri: config.redirectUri,
      code,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`TrueLayer token exchange failed: ${error}`);
  }

  return response.json() as Promise<TrueLayerToken>;
}

/**
 * Refresh an expired access token.
 */
export async function refreshAccessToken(
  refreshTokenEncrypted: string,
  config: TrueLayerConfig,
): Promise<TrueLayerToken> {
  const refreshToken = await decrypt(refreshTokenEncrypted, config.encryptionKey);
  const authBase = getAuthUrl(config);

  const response = await fetch(`${authBase}/connect/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      client_id: config.clientId,
      client_secret: config.clientSecret,
      refresh_token: refreshToken,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`TrueLayer token refresh failed: ${error}`);
  }

  return response.json() as Promise<TrueLayerToken>;
}

/**
 * Encrypt tokens for storage in D1.
 */
export async function encryptTokens(
  tokens: TrueLayerToken,
  encryptionKey: string,
): Promise<{ accessTokenEncrypted: string; refreshTokenEncrypted: string }> {
  return {
    accessTokenEncrypted: await encrypt(tokens.access_token, encryptionKey),
    refreshTokenEncrypted: await encrypt(tokens.refresh_token, encryptionKey),
  };
}

/**
 * Fetch transactions from TrueLayer for a given account.
 */
export async function fetchTransactions(
  accessTokenEncrypted: string,
  config: TrueLayerConfig,
  fromDate: string,
  toDate: string,
): Promise<TrueLayerTransaction[]> {
  const accessToken = await decrypt(accessTokenEncrypted, config.encryptionKey);
  const apiBase = getApiUrl(config);

  // First get accounts
  const accountsRes = await fetch(`${apiBase}/data/v1/accounts`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!accountsRes.ok) {
    if (accountsRes.status === 401) throw new Error('BANK_CONNECTION_EXPIRED');
    throw new Error(`TrueLayer accounts fetch failed: ${accountsRes.status}`);
  }

  const accountsData = (await accountsRes.json()) as {
    results: { account_id: string }[];
  };

  // Fetch transactions from all accounts
  const allTransactions: TrueLayerTransaction[] = [];

  for (const account of accountsData.results) {
    const txRes = await fetch(
      `${apiBase}/data/v1/accounts/${account.account_id}/transactions?from=${fromDate}&to=${toDate}`,
      { headers: { Authorization: `Bearer ${accessToken}` } },
    );

    if (txRes.ok) {
      const txData = (await txRes.json()) as { results: TrueLayerTransaction[] };
      allTransactions.push(...txData.results);
    }
  }

  return allTransactions;
}
