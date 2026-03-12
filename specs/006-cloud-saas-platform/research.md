# Research: Cloud-Powered Multi-Tenant Supermarket Management SaaS

**Feature**: `006-cloud-saas-platform` | **Date**: 2026-03-12

## 1. Multi-Tenancy Strategy

### Decision: Manual store_id FK + PostgreSQL Row-Level Security (Hybrid)

**Rationale**: The `django-tenants` library assumes schema-per-tenant, which doesn't scale well beyond ~50 tenants and complicates shared features, billing, and cross-store analytics. Manual `store_id` filtering with PostgreSQL RLS as a safety net is simpler, faster at 500+ stores, and maps directly to the existing codebase pattern.

**Alternatives Considered**:
- **django-tenants (schema-per-tenant)**: Rejected — migrations slow at scale (apply to N schemas), constrains API design, overkill for single-DB multi-tenancy.
- **Separate databases per tenant**: Rejected — operational complexity (backups, migrations, connection pooling) unjustified at this scale.
- **Application-level filtering only (no RLS)**: Rejected — a single missed `store_id` filter in a query could leak cross-store data. RLS provides defense-in-depth.

**Implementation Approach**:
- Abstract `TenantModel` base class with `store_id` FK, `created_at`, `updated_at` — all entity models inherit from this.
- `StoreContextMiddleware` extracts `store_id` from JWT token claim and injects into `request.store_id`.
- DRF viewsets override `get_queryset()` to filter by `request.store_id` and `perform_create()` to auto-inject `store_id`.
- PostgreSQL RLS policies on all tenant tables as a safety net using `app.current_store_id` session variable.
- `StoreIsolationPermission` class validates object-level access matches user's store.

## 2. WebSocket Real-Time Sync (Django Channels)

### Decision: Per-Store Channel Groups + JWT Authentication on Connect + Django Signal-Driven Broadcasts

**Rationale**: Django Channels with Redis channel layer supports per-store group isolation natively. JWT on the WebSocket connection query string allows stateless auth without session cookies. Django `post_save` signals trigger broadcasts automatically, keeping the sync layer decoupled from business logic.

**Alternatives Considered**:
- **Server-Sent Events (SSE)**: Rejected — unidirectional (server→client only), no client→server messaging for sync acknowledgments.
- **Third-party real-time service (Pusher, Ably)**: Rejected — adds external dependency, recurring cost, and latency. Django Channels is self-hosted and sufficient.
- **Polling**: Rejected — cannot meet the <3s real-time requirement (SC-006) without excessive server load.

**Implementation Approach**:
- WebSocket URL: `ws://{host}/ws/store/{store_id}/updates/?token={jwt}`
- Consumer validates JWT `store_id` claim matches URL `store_id` parameter on connect; rejects mismatches with 4003.
- Per-store group: `sync_store_{store_id}` — all connected clients for a store join this group.
- Django `post_save`/`post_delete` signals on entity models broadcast changes to the store's group via `channel_layer.group_send()`.
- Clients receive typed messages (`product_created`, `sale_completed`, `stock_updated`, etc.) and update local state.
- Exponential backoff reconnection (2^n seconds, max 5 retries).
- Redis channel layer (channels_redis) for pub/sub across Daphne workers.

## 3. Offline Sync Protocol (POS ↔ Backend)

### Decision: Timestamp-based Incremental Sync + UUID-keyed Ordered Offline Queue + Field-level Last-Write-Wins Merge

**Rationale**: The existing POS uses sql.js/better-sqlite3 for local persistence with IPC handlers for debounced saves. The sync protocol extends this with an offline queue stored in a separate SQLite table (`sync_queue`), ordered by a local `sync_order` counter for deterministic replay. UUID v4 primary keys eliminate ID collisions between offline devices. Field-level hashing enables smart merge: if a cashier changed `quantity` offline while an admin changed `price` online, both changes apply without conflict.

**Alternatives Considered**:
- **CRDTs (Conflict-free Replicated Data Types)**: Rejected — excessive complexity for a retail domain where conflicts are infrequent. LWW with field-level merge is simpler and sufficient.
- **Operational Transformation (OT)**: Rejected — designed for collaborative text editing, not entity CRUD operations.
- **Full sync on reconnect**: Rejected — too much data transfer for stores with thousands of products. Incremental sync using `updated_at` is efficient.
- **Row-level last-write-wins**: Rejected — would cause data loss when two devices edit different fields of the same product. Field-level merge preserves all non-conflicting changes.

**Implementation Approach**:
- **Offline Queue** (`sync_queue` SQLite table): Stores pending operations with `id`, `entity`, `action`, `payload`, `local_timestamp`, `sync_order`, `client_id`, `field_hashes`.
- **Push (Flush Queue)**: On reconnect, send pending operations to `POST /api/stores/{store_id}/sync/bulk/` in `sync_order`. Server returns 409 for conflicts with `serverState` and `serverFieldHashes`.
- **Pull (Incremental)**: `GET /api/stores/{store_id}/sync/pull/?since={iso_timestamp}` returns all entities modified since last sync, including soft deletes.
- **Conflict Resolution**: Compare field-level SHA-256 hashes. If server field hasn't changed since our snapshot, keep local value. Otherwise keep server value (last-write-wins by receipt time).
- **Duplicate Detection**: Server checks `operation_id` uniqueness to prevent replaying the same offline operation twice (crash recovery).
- **Initial Full Sync**: On first login, download all store data to local SQLite cache.
- **Periodic Sync**: Every 30 seconds while online, pull incremental changes.

## 4. Subscription & Billing (Stripe Integration)

### Decision: dj-stripe Library + Custom Plan Limit Enforcement Middleware

**Rationale**: `dj-stripe` handles Stripe webhook verification, idempotent object syncing, and subscription lifecycle events out of the box. Rolling our own Stripe integration would require manual signature verification, webhook replay handling, and subscription state machine management — all solved problems.

**Alternatives Considered**:
- **Direct Stripe API (bare `stripe` Python library)**: Rejected — webhook signature verification is error-prone, subscription state management requires manual state machine, no idempotent object syncing.
- **Paddle / Lemon Squeezy**: Rejected — less established in the Django ecosystem, smaller community, and Stripe is explicitly specified in the tech stack.

**Implementation Approach**:
- `StoreSubscription` model wraps dj-stripe's `Subscription` with plan-specific limits (`max_products`, `max_cashiers`, `max_monthly_sales`) and feature flags.
- Three tiers: Free Trial (14 days, full access), Basic (500 products, 3 cashiers), Pro (10,000 products, 50 cashiers, advanced features).
- `PlanLimitEnforcementMiddleware` checks limits on POST/PUT/DELETE before the view executes.
- dj-stripe signal receivers (`subscription_made`, `subscription_updated`, `subscription_deleted`) auto-sync Stripe → Django.
- Stripe Checkout Sessions for plan upgrades; Stripe Customer Portal for self-service management.
- Grace period: 90 days post-cancellation before data deletion, with 14-day email warning.

## 5. Authentication Strategy (JWT + Offline Credentials)

### Decision: SimpleJWT with Store-Scoped Claims + bcrypt-Hashed Cached Credentials

**Rationale**: The existing app already uses bcrypt for password hashing (users table has `password_hash`). SimpleJWT extends this with store-aware tokens. For offline POS, the JWT refresh token (7-day expiry) is stored in Electron's secure storage with the user's hashed credentials cached in local SQLite for offline PIN-based login.

**Implementation Approach**:
- JWT access token (15min) with custom claims: `store_id`, `role`, `user_id`.
- JWT refresh token (7 days) — matches the clarified offline credential expiry policy.
- Custom `TokenObtainPairSerializer` injects `store_id` and `role` into token payload.
- POS caches refresh token + user record (hashed password/PIN) in local SQLite for offline auth.
- On token expiry (7 days), POS requires internet reconnection for re-authentication.
- WebSocket uses the access token on connection handshake.

## 6. Frontend Architecture (Code Sharing Strategy)

### Decision: Extract Shared UI to frontend/, Keep POS in src/, New mobile/ for Expo

**Rationale**: The existing `src/` directory contains both POS checkout UI and admin management pages. For the SaaS transformation: admin pages move to `frontend/` (Vite web app calling Django API), POS checkout stays in `src/` (Electron app with local SQLite + sync layer), and `mobile/` is a new Expo project. Shared concerns (types, i18n keys, component design tokens) are kept consistent manually via code review, with potential for a shared package later.

**Alternatives Considered**:
- **Monorepo with shared packages (Turborepo/Nx)**: Rejected for now — adds tooling complexity before the product has market validation. Can migrate later.
- **Single codebase serving all platforms**: Rejected — Electron, Vite web, and Expo have fundamentally different build pipelines and platform APIs.

**Implementation Approach**:
- `frontend/` copies existing `src/components/`, `src/pages/` (minus POS), `src/hooks/`, `src/i18n/`, `src/lib/` as the starting point.
- Zustand stores in `frontend/` are refactored: replace `repo.getAll()` calls with `apiClient.get('/products/')` calls.
- `src/stores/` (POS) keep local SQLite calls but add sync layer hooks.
- `mobile/` uses NativeWind for Tailwind-compatible styling, ensuring visual consistency with web.
- Shared TypeScript types can be copied or symlinked between projects.

## 7. Deployment Strategy

### Decision: Render (Free Tier) for Backend + Vercel (Free) for Web Dashboard + App Stores for Mobile

**Rationale**: Matches the spec's stated hosting preferences. Render's free tier supports Django + PostgreSQL + Redis (for Channels). Vercel's free tier handles the static/SSR React frontend. Expo EAS builds for iOS/Android app store distribution.

**Implementation Approach**:
- **Backend**: Render Web Service (Gunicorn + Daphne for WebSocket) + Render PostgreSQL + Render Redis.
- **Web dashboard**: Vercel with Vite build output, environment variables for API URL.
- **Desktop POS**: electron-builder for Windows (.exe) and macOS (.dmg), hosted as GitHub Releases or on the marketing site. Auto-update via electron-updater pointing to latest release.
- **Mobile**: Expo EAS Build → Apple App Store + Google Play Store.
- **Migration path**: Render free → Oracle Cloud / Hetzner when profitable (as stated in spec).
