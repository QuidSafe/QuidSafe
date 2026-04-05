# Data Flow Architecture

## Core Data Flow

```mermaid
sequenceDiagram
    participant U as User (App)
    participant API as QuidSafe API
    participant TL as TrueLayer
    participant Bank as User's Bank
    participant AI as Claude Haiku
    participant DB as PostgreSQL
    participant Tax as Tax Engine

    Note over U,Tax: 1. ONBOARDING & BANK CONNECTION

    U->>API: Sign up (email/Google)
    API->>DB: Create user record
    API->>U: Return JWT token

    U->>API: Connect bank
    API->>TL: Create auth link
    TL->>Bank: User logs in to bank
    Bank->>TL: Grant read-only access
    TL->>API: Auth callback + access_token
    API->>DB: Store encrypted connection

    Note over U,Tax: 2. TRANSACTION SYNC (Daily Cron)

    API->>TL: Fetch transactions (last 24h)
    TL->>Bank: Pull transaction data
    Bank->>TL: Return transactions
    TL->>API: Raw transaction list

    loop For each transaction batch (50)
        API->>AI: Categorise transactions<br/>"Is this income or personal?"
        AI->>API: Categories + confidence scores
    end

    API->>DB: Store categorised transactions

    Note over U,Tax: 3. TAX CALCULATION (After sync)

    API->>DB: Fetch all income this tax year
    DB->>API: Income total + breakdown

    API->>Tax: Calculate tax owed
    Note over Tax: Personal Allowance: £12,570<br/>Basic Rate: 20% (to £50,270)<br/>Higher Rate: 40%<br/>NI Class 2: £3.45/week<br/>NI Class 4: 6% (£12,570-£50,270)
    Tax->>API: Tax breakdown

    API->>DB: Store tax calculation
    API->>U: Push notification<br/>"Set aside £648 this month"

    Note over U,Tax: 4. DASHBOARD VIEW

    U->>API: GET /dashboard
    API->>DB: Fetch latest calculation
    DB->>API: Tax owed, income, quarters
    API->>U: Dashboard data

    Note over U,Tax: 5. MTD QUARTERLY SUBMISSION

    U->>API: Submit Q3 to HMRC
    API->>DB: Fetch Q3 income + expenses
    API->>HMRC: Submit quarterly update
    HMRC->>API: Submission receipt
    API->>DB: Store submission record
    API->>U: "Q3 submitted successfully"
```

## Database Schema (Key Tables)

```mermaid
erDiagram
    USERS {
        uuid id PK
        text email
        text name
        text subscription_tier
        timestamp created_at
    }

    BANK_CONNECTIONS {
        uuid id PK
        uuid user_id FK
        text provider
        text access_token_encrypted
        text bank_name
        timestamp last_synced
        boolean active
    }

    TRANSACTIONS {
        uuid id PK
        uuid user_id FK
        uuid connection_id FK
        text external_id
        decimal amount
        text description
        text category
        text ai_category
        float ai_confidence
        date transaction_date
        boolean is_income
        boolean is_expense_claimable
    }

    TAX_CALCULATIONS {
        uuid id PK
        uuid user_id FK
        text tax_year
        integer quarter
        decimal total_income
        decimal total_expenses
        decimal taxable_income
        decimal income_tax
        decimal ni_class2
        decimal ni_class4
        decimal total_tax
        decimal set_aside_monthly
        timestamp calculated_at
    }

    MTD_SUBMISSIONS {
        uuid id PK
        uuid user_id FK
        text tax_year
        integer quarter
        text hmrc_receipt_id
        text status
        timestamp submitted_at
    }

    SUBSCRIPTIONS {
        uuid id PK
        uuid user_id FK
        text stripe_customer_id
        text stripe_subscription_id
        text plan
        text status
        timestamp current_period_end
    }

    USERS ||--o{ BANK_CONNECTIONS : has
    USERS ||--o{ TRANSACTIONS : has
    USERS ||--o{ TAX_CALCULATIONS : has
    USERS ||--o{ MTD_SUBMISSIONS : has
    USERS ||--|| SUBSCRIPTIONS : has
    BANK_CONNECTIONS ||--o{ TRANSACTIONS : sources
```

## Security Architecture

```mermaid
graph LR
    subgraph Client
        APP[Mobile App]
    end

    subgraph Edge
        CF[Cloudflare WAF]
    end

    subgraph API Layer
        RL[Rate Limiter<br/>100 req/min]
        AUTH[JWT Verification<br/>Supabase Auth]
        RLS[Row Level Security<br/>user_id check]
    end

    subgraph Data
        ENC[AES-256 Encryption<br/>Bank tokens at rest]
        DB[(PostgreSQL<br/>RLS enabled)]
    end

    APP -->|HTTPS/TLS 1.3| CF
    CF -->|Valid requests only| RL
    RL -->|Within limits| AUTH
    AUTH -->|Valid JWT| RLS
    RLS -->|User's data only| DB
    DB --- ENC

    style ENC fill:#D94F4F,color:#fff,stroke:none
    style AUTH fill:#1B9C85,color:#fff,stroke:none
    style RL fill:#E8A838,color:#000,stroke:none
```

## Key Security Measures

1. **Bank tokens encrypted at rest** — AES-256 via Supabase Vault
2. **Row Level Security** — Users can only access their own data
3. **Rate limiting** — 100 req/min per user via Upstash Redis
4. **JWT expiry** — 1 hour access token, 7 day refresh token
5. **No card data stored** — Stripe handles all payment info
6. **Open Banking is read-only** — Cannot initiate payments
7. **HTTPS everywhere** — TLS 1.3 via Cloudflare
8. **Secrets management** — Environment variables via Fly.io secrets
