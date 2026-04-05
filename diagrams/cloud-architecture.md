# Production Cloud Architecture

## Design Principles

1. **Cost-first** — Start near-free, scale only when revenue justifies it
2. **Serverless where possible** — Pay per request, not per hour
3. **EU region** — GDPR compliance, low latency for UK users
4. **Managed services** — Zero ops burden for a solo/small team

## Architecture Diagram

```mermaid
graph TB
    subgraph Users
        IOS_APP["iOS App<br/>React Native"]
        AND_APP["Android App<br/>React Native"]
        BROWSER["Web Browser<br/>Next.js SSR"]
    end

    subgraph CDN & Edge
        CF["Cloudflare<br/>─────────<br/>DNS, CDN, DDoS<br/>Free Tier<br/>SSL Termination"]
    end

    subgraph Compute - Fly.io London Region
        API_1["API Instance 1<br/>Hono + Bun<br/>256MB RAM<br/>shared-cpu-1x"]
        API_2["API Instance 2<br/>Hono + Bun<br/>256MB RAM<br/>shared-cpu-1x<br/>(auto-scale)"]
        WEB_FLY["Next.js<br/>256MB RAM<br/>shared-cpu-1x"]
        CRON["Cron Worker<br/>256MB RAM<br/>─────────<br/>Scheduled tasks:<br/>• Bank sync (daily)<br/>• Tax recalculation<br/>• Deadline reminders<br/>• Subscription billing"]
    end

    subgraph Database - Supabase Free → Pro
        DB["PostgreSQL 15<br/>─────────<br/>Supabase (eu-west-2)<br/>Free: 500MB / 2 projects<br/>Pro: £20/mo / 8GB<br/>─────────<br/>Row Level Security<br/>Auto backups"]
        AUTH_S["Supabase Auth<br/>─────────<br/>Magic Link / Google<br/>Free: 50k MAU<br/>JWT tokens"]
        RT["Realtime<br/>─────────<br/>Live dashboard updates<br/>WebSocket subscriptions"]
    end

    subgraph Cache - Upstash
        REDIS_U["Upstash Redis<br/>─────────<br/>Serverless Redis<br/>Free: 10k cmds/day<br/>Pay-as-you-go after<br/>eu-west-1"]
    end

    subgraph External APIs
        TL_PROD["TrueLayer<br/>Production<br/>─────────<br/>Open Banking<br/>FCA Regulated<br/>£0.10/connection/mo"]
        HMRC_PROD["HMRC MTD API<br/>Production<br/>─────────<br/>Quarterly submissions<br/>Free (gov API)"]
        STRIPE_PROD["Stripe<br/>─────────<br/>Subscriptions<br/>1.4% + 20p<br/>SCA compliant"]
        CLAUDE_PROD["Claude API<br/>Haiku<br/>─────────<br/>Categorisation<br/>~£0.001/request"]
        RESEND["Resend<br/>─────────<br/>Transactional email<br/>Free: 3k/mo<br/>then £20/mo"]
    end

    subgraph Monitoring & Logging
        SENTRY["Sentry<br/>─────────<br/>Error tracking<br/>Free: 5k events/mo"]
        AXIOM["Axiom<br/>─────────<br/>Log aggregation<br/>Free: 500MB/mo"]
        BETTERUPTIME["Better Uptime<br/>─────────<br/>Status page<br/>Free tier"]
    end

    subgraph CI/CD
        GH["GitHub Actions<br/>─────────<br/>Build, test, deploy<br/>Free: 2000 min/mo"]
    end

    %% User connections
    IOS_APP --> CF
    AND_APP --> CF
    BROWSER --> CF

    %% CDN to compute
    CF --> API_1
    CF --> API_2
    CF --> WEB_FLY

    %% API to data
    API_1 --> DB
    API_2 --> DB
    API_1 --> REDIS_U
    API_2 --> REDIS_U
    API_1 --> AUTH_S
    WEB_FLY --> API_1

    %% API to external
    API_1 --> TL_PROD
    API_1 --> HMRC_PROD
    API_1 --> STRIPE_PROD
    API_1 --> CLAUDE_PROD
    API_1 --> RESEND

    %% Cron
    CRON --> DB
    CRON --> TL_PROD
    CRON --> CLAUDE_PROD
    CRON --> RESEND

    %% Realtime
    DB --> RT
    RT --> IOS_APP
    RT --> AND_APP

    %% Monitoring
    API_1 --> SENTRY
    API_1 --> AXIOM
    WEB_FLY --> SENTRY
    BETTERUPTIME --> CF

    %% CI/CD
    GH --> API_1
    GH --> WEB_FLY

    classDef user fill:#6B5CE7,color:#fff,stroke:none,rx:8
    classDef edge fill:#F38020,color:#fff,stroke:none,rx:8
    classDef compute fill:#0F4C75,color:#fff,stroke:none,rx:8
    classDef data fill:#1B9C85,color:#fff,stroke:none,rx:8
    classDef external fill:#E8A838,color:#000,stroke:none,rx:8
    classDef monitor fill:#8896A6,color:#fff,stroke:none,rx:8
    classDef cicd fill:#24292F,color:#fff,stroke:none,rx:8

    class IOS_APP,AND_APP,BROWSER user
    class CF edge
    class API_1,API_2,WEB_FLY,CRON compute
    class DB,AUTH_S,RT,REDIS_U data
    class TL_PROD,HMRC_PROD,STRIPE_PROD,CLAUDE_PROD,RESEND external
    class SENTRY,AXIOM,BETTERUPTIME monitor
    class GH cicd
```

## Cost Breakdown by Scale

### Phase 1: Launch (0-2,000 users) — THE FREE TIER STACK

| Service | Tier | Monthly Cost |
|---------|------|-------------|
| Supabase (DB + Auth + Edge Functions + Cron) | Free | **£0** |
| Vercel (Expo web export) | Free | **£0** |
| Cloudflare (DNS + CDN) | Free | **£0** |
| Sentry (error tracking) | Free | **£0** |
| Resend (email) | Free (3k/mo) | **£0** |
| EAS Build (app builds) | Free (30 builds/mo) | **£0** |
| GitHub Actions (CI) | Free | **£0** |
| TrueLayer | Pay-per-use | ~£20 |
| Claude API (Haiku) | Pay-per-use | ~£10 |
| Stripe | 1.4% + 20p | ~£17 |
| **Total** | | **~£47/mo** |
| **Total (before first paying user)** | | **~£0/mo** |

**Key insight:** Until you have paying users generating TrueLayer/Claude/Stripe usage, your hosting cost is literally £0/mo. Everything runs on free tiers.

### Phase 2: Growth (2,000-10,000 users)

| Service | Tier | Monthly Cost |
|---------|------|-------------|
| Fly.io (4 instances) | Scale | £40 |
| Supabase | Pro | £20 |
| Upstash Redis | Pay-as-you-go | £5 |
| Cloudflare | Free | £0 |
| Sentry | Team | £26 |
| Axiom | Free | £0 |
| Resend | Pro | £20 |
| TrueLayer | | £150 |
| Claude API | | £75 |
| Stripe | | £126 |
| **Total** | | **~£462/mo** |

### Phase 3: Scale (10,000-80,000 users)

| Service | Tier | Monthly Cost |
|---------|------|-------------|
| Fly.io (8 instances + dedicated) | Performance | £200 |
| Supabase | Pro (scaled) | £75 |
| Upstash Redis | Pro | £30 |
| Cloudflare | Pro | £18 |
| Sentry | Team | £26 |
| Axiom | Pro | £20 |
| Resend | Business | £50 |
| TrueLayer | | £600 |
| Claude API | | £300 |
| Stripe | | £504 |
| **Total** | | **~£1,823/mo** |

## Why This Stack Over AWS/GCP/Azure

| Factor | Fly.io + Supabase | AWS | GCP |
|--------|-------------------|-----|-----|
| **Time to deploy** | Minutes | Hours/days | Hours/days |
| **Cost at 0-2k users** | ~£47/mo | ~£150/mo | ~£120/mo |
| **Ops burden** | Near zero | High (IAM, VPCs, etc.) | Medium |
| **EU compliance** | Built-in (LHR region) | Manual config | Manual config |
| **Scaling** | Auto | Manual/complex | Auto (but expensive) |
| **Best for** | Solo dev / small team | Enterprise | Enterprise |

**The key insight:** You're a bootstrapped sole trader tool. Every pound saved on infra is a pound you keep. The stack above runs at essentially **£0/mo until you have paying users**, then scales linearly with revenue.

## Migration Path to Cloud Providers

When you hit ~50,000+ users and need more control:

```
Fly.io API → AWS ECS Fargate or GCP Cloud Run
Supabase → AWS RDS PostgreSQL or GCP Cloud SQL
Upstash → AWS ElastiCache or GCP Memorystore
```

This migration is straightforward because the app uses standard PostgreSQL, Redis, and HTTP — no vendor lock-in.
