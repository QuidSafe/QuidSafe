# Prompt 04 — Open Banking Integration (TrueLayer)

## Context
QuidSafe connects to users' UK bank accounts via TrueLayer's Open Banking API. This is the data backbone of the entire app — all income detection and tax calculation flows from bank transactions.

## Stack
- **Backend:** Cloudflare Workers + Hono
- **Database:** Cloudflare D1 (SQLite)
- **Encryption:** AES-256-GCM via `worker/utils/crypto.ts`
- **Service:** `worker/services/banking.ts`
- **Routes:** `worker/index.ts` (under `// ── Banking ──` section)

## Implementation

### 1. OAuth Flow

| Route | Method | Purpose |
|-------|--------|---------|
| `/banking/connect` | GET | Generate TrueLayer auth link with scopes (info, accounts, balance, transactions). Enforces multi-bank limits before generating URL. |
| `/banking/callback` | GET | Handle OAuth callback. Exchange code for tokens, encrypt and store, detect bank name via TrueLayer `/me` endpoint, trigger initial 30-day transaction sync. |
| `/banking/connections` | GET | List active bank connections with transaction counts. |
| `/banking/sync/:id` | POST | Manually trigger sync for a specific connection. |
| `/banking/connections/:id` | DELETE | Soft-deactivate a bank connection (sets `active = 0`). |

### 2. Transaction Sync Service (`worker/services/banking.ts`)

- **`syncTransactions(db, connection, config)`** — Fetches transactions from TrueLayer for last 30 days (initial) or since `last_synced_at` (subsequent). Deduplicates by `bank_transaction_id`. Stores raw in `transactions` table. Updates `last_synced_at`.
- **`refreshAccessToken(refreshTokenEncrypted, config)`** — Refreshes expired access tokens using stored encrypted refresh_token.
- **`fetchTransactions(accessTokenEncrypted, config, fromDate, toDate)`** — Fetches from all accounts under a connection.
- **`detectBankName(accessToken, config)`** — Queries TrueLayer `/data/v1/me` to get the provider display name (e.g., "Monzo", "Starling").
- **`fetchWithRetry(url, options, retries)`** — Retry with exponential backoff for 429 (rate limit) and 5xx errors. Throws immediately on 401 (expired consent).
- **`encryptTokens(tokens, encryptionKey)`** — Encrypts both access and refresh tokens via AES-256-GCM.

### 3. Cron Job — Daily Sync

Configured in `wrangler.toml`:
```toml
[triggers]
crons = ["0 6 * * *"]
```

The `scheduled` handler in `worker/index.ts`:
1. Gets all active bank connections from D1
2. For each connection: refreshes token, syncs last 24h of transactions
3. If consent expired (401): deactivates connection, logs warning
4. Logs sync results (success/fail per connection)

### 4. Token Encryption (`worker/utils/crypto.ts`)

- **Algorithm:** AES-256-GCM
- **Key:** 32-byte hex string stored in `ENCRYPTION_KEY` env var
- **Format:** Base64-encoded `iv (12 bytes) + ciphertext + GCM tag (16 bytes)`
- **Functions:** `encrypt(plaintext, hexKey)` → `ciphertext`, `decrypt(ciphertext, hexKey)` → `plaintext`
- Uses Web Crypto API (`crypto.subtle`) — Workers-native, no external dependencies

### 5. Multi-Bank Support

- **Free tier:** 1 bank connection max
- **Pro tier:** Up to 3 bank connections
- Enforced in `/banking/connect` before generating auth URL
- Each connection syncs independently (own tokens, own `last_synced_at`)
- Transactions from all banks merge into the same user's dashboard

### 6. Sandbox/Production

```typescript
const TRUELAYER_AUTH_URL = 'https://auth.truelayer.com';
const TRUELAYER_SANDBOX_AUTH_URL = 'https://auth.truelayer-sandbox.com';
// Switched via env.ENVIRONMENT !== 'production'
```

## API Response Formats

### GET /banking/connections
```json
{
  "connections": [
    {
      "id": "uuid",
      "bank_name": "Monzo",
      "last_synced_at": "2026-04-05T06:00:00",
      "active": 1,
      "created_at": "2026-03-01T12:00:00",
      "transaction_count": 247
    }
  ]
}
```

### GET /banking/callback (success)
```json
{
  "connectionId": "uuid",
  "bankName": "Monzo",
  "success": true,
  "synced": 45
}
```

### POST /banking/sync/:id (success)
```json
{
  "success": true,
  "synced": 12,
  "skipped": 33
}
```

## Error Handling

| Scenario | Response | Action |
|----------|----------|--------|
| Consent expired (401) | `BANK_CONNECTION_EXPIRED` | Deactivate connection, prompt reconnect |
| Rate limited (429) | Retry 3x with backoff (1s, 2s, 4s) | Automatic |
| Server error (5xx) | Retry 3x with backoff | Automatic |
| Bank limit reached | `BANK_LIMIT_REACHED` (403) | Tell user to upgrade or disconnect |
| Initial sync fails | Connection saved, sync = 0 | Will retry on next cron |

## Files

| File | Purpose |
|------|---------|
| `worker/services/banking.ts` | TrueLayer service (OAuth, sync, retry, detection) |
| `worker/utils/crypto.ts` | AES-256-GCM encrypt/decrypt |
| `worker/index.ts` | Banking API routes + scheduled handler |
| `worker/migrations/002_full_schema.sql` | `bank_connections` table schema |
| `wrangler.toml` | Cron trigger config |
| `lib/api.ts` | Frontend API client (`getConnectUrl`, `getConnections`, `syncBank`, `disconnectBank`) |
