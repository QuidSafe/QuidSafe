# Prompt 04 — Open Banking Integration (TrueLayer)

## Context
QuidSafe connects to users' UK bank accounts via TrueLayer's Open Banking API. This is the data backbone of the entire app — all income detection and tax calculation flows from bank transactions.

## Task
Implement the full TrueLayer integration in `packages/api/`.

## Requirements

### 1. OAuth Flow
- `GET /banking/connect` — Generate TrueLayer auth link with required scopes (accounts, transactions, balance). Redirect URI back to the app.
- `GET /banking/callback` — Handle OAuth callback. Store encrypted access_token + refresh_token in `bank_connections` table. Trigger initial transaction sync.
- `DELETE /banking/connections/:id` — Disconnect a bank. Revoke TrueLayer token. Mark connection as inactive.

### 2. Transaction Sync Service
Create `packages/api/src/services/banking.ts`:

- `syncTransactions(userId, connectionId)` — Fetch transactions from TrueLayer for the last 30 days (initial) or since last sync (subsequent). Deduplicate by `external_id`. Store raw in `transactions` table.
- `refreshToken(connectionId)` — Refresh expired access tokens using refresh_token. Update stored encrypted tokens.
- Handle TrueLayer error codes: 401 (re-auth needed), 429 (rate limit), 500 (retry with backoff).

### 3. Cron Job — Daily Sync
Create a scheduled task that runs at 6:00 AM daily:
1. Get all active bank connections
2. For each: refresh token if needed, sync last 24h of transactions
3. After sync: trigger AI categorisation (Prompt 05)
4. After categorisation: trigger tax recalculation (Prompt 06)
5. Log sync results (success/fail per connection)

### 4. Token Encryption
- Encrypt access_token and refresh_token using AES-256-GCM before storing
- Decrypt only when making API calls to TrueLayer
- Store the encryption key in environment variable `ENCRYPTION_KEY`
- Create utility functions: `encrypt(plaintext)` → `ciphertext` and `decrypt(ciphertext)` → `plaintext`

### 5. Multi-Bank Support
- Users can connect up to 3 banks on Pro tier (1 on Free)
- Each connection syncs independently
- Transactions from all banks merge into the same dashboard

## API Response Format
```json
{
  "connections": [
    {
      "id": "uuid",
      "bank_name": "Monzo",
      "last_synced": "2026-04-05T06:00:00Z",
      "active": true,
      "transaction_count": 247
    }
  ]
}
```

## Error Handling
- If TrueLayer consent expires (90 days), notify user to reconnect
- If bank is down, retry 3x with exponential backoff
- Never expose raw TrueLayer errors to the client

## Output
Complete banking service, API routes, cron job, and encryption utilities.
