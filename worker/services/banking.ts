// TrueLayer Open Banking integration for Cloudflare Workers

import { encrypt, decrypt } from '../utils/crypto';

const TRUELAYER_AUTH_URL = 'https://auth.truelayer.com';
const TRUELAYER_API_URL = 'https://api.truelayer.com';
const TRUELAYER_SANDBOX_AUTH_URL = 'https://auth.truelayer-sandbox.com';
const TRUELAYER_SANDBOX_API_URL = 'https://api.truelayer-sandbox.com';

export interface TrueLayerConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  encryptionKey: string;
  sandbox?: boolean;
}

export interface TrueLayerToken {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
}

export interface TrueLayerTransaction {
  transaction_id: string;
  timestamp: string;
  description: string;
  amount: number;
  currency: string;
  transaction_type: string;
  transaction_category: string;
  merchant_name?: string;
}

export interface BankConnectionRow {
  id: string;
  user_id: string;
  bank_name: string;
  access_token_encrypted: string;
  refresh_token_encrypted: string;
  last_synced_at: string | null;
  active: number;
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
    console.error('[TrueLayer token exchange]', { status: response.status, body: error.slice(0, 500) });
    throw new Error(`TrueLayer token exchange failed (${response.status})`);
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

/**
 * Fetch with retry and exponential backoff for TrueLayer errors.
 */
export async function fetchWithRetry(
  url: string,
  options: RequestInit,
  retries = 3,
): Promise<Response> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    const response = await fetch(url, options);

    if (response.ok) return response;

    // 401 = consent expired, don't retry
    if (response.status === 401) {
      throw new Error('BANK_CONNECTION_EXPIRED');
    }

    // 429 = rate limited, retry with backoff
    if (response.status === 429 && attempt < retries) {
      const delay = Math.pow(2, attempt) * 1000; // 1s, 2s, 4s
      await new Promise((resolve) => setTimeout(resolve, delay));
      continue;
    }

    // 5xx = server error, retry with backoff
    if (response.status >= 500 && attempt < retries) {
      const delay = Math.pow(2, attempt) * 1000;
      await new Promise((resolve) => setTimeout(resolve, delay));
      continue;
    }

    throw new Error(`TrueLayer API error: ${response.status}`);
  }

  throw new Error('TrueLayer API: max retries exceeded');
}

/**
 * Detect bank name from TrueLayer provider info.
 */
export async function detectBankName(
  accessToken: string,
  config: TrueLayerConfig,
): Promise<string> {
  const apiBase = getApiUrl(config);
  try {
    const res = await fetch(`${apiBase}/data/v1/me`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (res.ok) {
      const data = (await res.json()) as { results: { provider: { display_name: string } }[] };
      if (data.results?.[0]?.provider?.display_name) {
        return data.results[0].provider.display_name;
      }
    }
  } catch {
    // Fall through to default
  }
  return 'Connected Bank';
}

/**
 * Sync transactions from TrueLayer into D1, deduplicating by bank_transaction_id.
 */
export async function syncTransactions(
  db: D1Database,
  connection: BankConnectionRow,
  config: TrueLayerConfig,
): Promise<{ synced: number; skipped: number }> {
  // Determine sync window
  const toDate = new Date().toISOString().split('T')[0];
  const fromDate = connection.last_synced_at
    ? connection.last_synced_at.split('T')[0]
    : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]; // last 30 days for initial

  const transactions = await fetchTransactions(
    connection.access_token_encrypted,
    config,
    fromDate,
    toDate,
  );

  // Load all existing bank_transaction_id values for this connection upfront
  const existingRows = await db
    .prepare('SELECT bank_transaction_id FROM transactions WHERE bank_connection_id = ? AND user_id = ?')
    .bind(connection.id, connection.user_id)
    .all<{ bank_transaction_id: string }>();

  const existingIds = new Set(existingRows.results.map((r) => r.bank_transaction_id));

  const newTransactions = transactions.filter((tx) => !existingIds.has(tx.transaction_id));
  const skipped = transactions.length - newTransactions.length;
  const synced = newTransactions.length;

  if (newTransactions.length > 0) {
    const insertStmt = db.prepare(
      `INSERT INTO transactions (id, user_id, amount, description, merchant_name, raw_category, is_income, bank_connection_id, bank_transaction_id, transaction_date, currency, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
    );

    const batchStatements = newTransactions.map((tx) => {
      const isIncome = tx.amount > 0;
      return insertStmt.bind(
        crypto.randomUUID(),
        connection.user_id,
        tx.amount,
        tx.description,
        tx.merchant_name ?? null,
        tx.transaction_category,
        isIncome ? 1 : 0,
        connection.id,
        tx.transaction_id,
        tx.timestamp.split('T')[0],
        tx.currency,
      );
    });

    await db.batch(batchStatements);
  }

  // Update last_synced_at
  await db
    .prepare("UPDATE bank_connections SET last_synced_at = datetime('now') WHERE id = ?")
    .bind(connection.id)
    .run();

  return { synced, skipped };
}
