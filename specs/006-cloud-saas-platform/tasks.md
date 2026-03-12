# Tasks: Cloud-Powered Multi-Tenant Supermarket Management SaaS

**Input**: Design documents from `/specs/006-cloud-saas-platform/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/api.md, quickstart.md

**Tests**: Not explicitly requested in the specification. Test tasks are NOT included.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story. US1 (Registration/Onboarding) and US2 (Backend API/Multi-Tenant) are combined into one phase since they are both P1 and interdependent (the API is the foundation for onboarding).

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2)
- Exact file paths included in every task description

## Path Conventions

- **Backend**: `backend/` (Django 5.x REST API)
- **Web Dashboard**: `frontend/` (React 19 Vite app)
- **Desktop POS**: `src/` + `electron/` (existing Electron app, modified)
- **Mobile**: `mobile/` (Expo React Native app)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Initialize all four project components and shared tooling

- [x] T001 Create Django project skeleton with `backend/manage.py`, `backend/config/settings/base.py`, `backend/config/settings/development.py`, `backend/config/settings/production.py`, `backend/config/urls.py`, `backend/config/asgi.py`, `backend/config/wsgi.py`
- [x] T002 Create `backend/requirements.txt` with Django 5.x, djangorestframework, django-channels, channels-redis, djangorestframework-simplejwt, dj-stripe, django-cors-headers, psycopg[binary], gunicorn, daphne, django-filter, python-dotenv, factory-boy, pytest, pytest-django
- [x] T003 [P] Create `backend/.env.example` with DATABASE_URL, REDIS_URL, SECRET_KEY, STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, FRONTEND_URL, EMAIL_BACKEND per quickstart.md
- [x] T004 [P] Initialize `frontend/` Vite + React 19 project with `frontend/package.json`, `frontend/vite.config.ts`, `frontend/tsconfig.json`, `frontend/index.html`
- [x] T005 [P] Install frontend dependencies: zustand, @radix-ui/*, tailwindcss, framer-motion, recharts, react-router-dom, react-i18next, lucide-react, sonner, axios in `frontend/package.json`
- [x] T006 [P] Initialize `mobile/` Expo project with `mobile/package.json`, `mobile/app.json`, `mobile/tsconfig.json`
- [x] T007 [P] Install mobile dependencies: expo-router, nativewind, react-navigation, zustand, expo-sqlite, expo-camera, expo-notifications in `mobile/package.json`
- [x] T008 [P] Configure ESLint + Prettier for `frontend/eslint.config.js` and Ruff for `backend/pyproject.toml`
- [x] T009 [P] Create shared TypeScript types file `frontend/src/types/entities.ts` with all 23 entity interfaces from data-model.md (Store, User, Category, Product, ProductBatch, Supplier, PurchaseOrder, PurchaseOrderItem, Customer, CustomerTransaction, Sale, SaleItem, PaymentEntry, StockMovement, CashierSession, POSQuickAccess, Expense, AuditLog, Promotion, PromotionProduct, AppSetting, TicketCounter, StoreSubscription)
- [x] T010 [P] Copy shared types to `mobile/types/entities.ts` (same interfaces as T009, adapted for React Native)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core backend infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T011 Create TenantModel abstract base class in `backend/apps/core/models.py` with `store_id` FK, `created_at`, `updated_at`, UUID v4 PK (per research.md decision #1)
- [x] T012 Create Store model in `backend/apps/stores/models.py` with all fields from data-model.md (id, name, slug, owner_id, currency, timezone, phone, email, address, logo_url, is_active, onboarding_completed)
- [x] T013 Create User model (custom AbstractBaseUser) in `backend/apps/accounts/models.py` with store_id FK, email, username, password_hash, pin_code, pin_length, full_name, role enum (owner/manager/cashier), is_active, last_login per data-model.md
- [x] T014 Run initial Django migrations for Store and User models via `backend/apps/stores/migrations/` and `backend/apps/accounts/migrations/`
- [x] T015 Implement StoreContextMiddleware in `backend/apps/core/middleware.py` to extract store_id from JWT claims and inject into request.store_id (per research.md decision #1)
- [x] T016 Implement StoreIsolationPermission class in `backend/apps/core/permissions.py` for object-level store access validation
- [x] T017 [P] Implement RoleBasedPermission classes in `backend/apps/core/permissions.py` for owner, manager, cashier role-based access (FR-006)
- [x] T018 Configure SimpleJWT in `backend/config/settings/base.py` with 15min access token, 7-day refresh token, custom claims (store_id, role, user_id) per research.md decision #5
- [x] T019 Create custom TokenObtainPairSerializer in `backend/apps/accounts/serializers.py` that injects store_id and role into JWT payload
- [x] T020 Create auth endpoints in `backend/apps/accounts/urls.py` and `backend/apps/accounts/views.py`: POST /auth/token/, POST /auth/token/refresh/, POST /auth/pin-login/, POST /auth/change-password/ per contracts/api.md
- [x] T021 [P] Create TenantViewSet base class in `backend/apps/core/views.py` that overrides get_queryset() to filter by request.store_id and perform_create() to auto-inject store_id (reusable for all entity viewsets)
- [x] T022 [P] Implement password complexity validator in `backend/apps/accounts/validators.py` enforcing FR-035 (min 8 chars, uppercase, lowercase, digit, special char)
- [x] T023 [P] Configure Django Channels in `backend/config/asgi.py` with Redis channel layer, routing to `backend/apps/realtime/routing.py`
- [x] T024 [P] Create AuditLog model in `backend/apps/audit/models.py` with all fields from data-model.md (store_id, user_id, user_name, action, entity, entity_id, details, old_value, new_value, ip_address) — append-only, no update/delete
- [x] T025 Implement audit logging mixin in `backend/apps/core/mixins.py` that auto-creates AuditLog entries on create/update/delete operations (FR-011)
- [x] T026 [P] Configure CORS in `backend/config/settings/base.py` via django-cors-headers for FRONTEND_URL
- [x] T027 [P] Create base API URL routing in `backend/config/urls.py` with /api/v1/ prefix and include all app URLs
- [x] T028 [P] Implement standard error response handler in `backend/apps/core/exceptions.py` matching the error envelope in contracts/api.md (detail, code, errors fields)
- [x] T029 [P] Setup PostgreSQL RLS policies SQL migration in `backend/apps/core/migrations/` for defense-in-depth store isolation (per research.md decision #1)

**Checkpoint**: Foundation ready — auth works, store isolation enforced, audit logging active. User story implementation can now begin.

---

## Phase 3: User Story 1 + User Story 2 — Registration, Onboarding & Backend API (Priority: P1) 🎯 MVP

**Goal**: A store owner can register, verify email, log in, and perform CRUD on all 21 entity types via a fully isolated, multi-tenant REST API. Real-time notifications push changes to connected clients.

**Independent Test**: Create two store accounts via POST /auth/register/. Log in to each. Create products in Store A. Verify Store B cannot see them. Verify all 17 entity CRUD endpoints return correct data scoped to the authenticated store.

### US1: Registration & Onboarding

- [x] T030 [US1] Implement store registration endpoint POST /auth/register/ in `backend/apps/stores/views.py` and `backend/apps/stores/serializers.py` — creates Store + owner User atomically, sends verification email (FR-003)
- [x] T031 [US1] Implement email verification endpoint POST /auth/verify-email/ in `backend/apps/accounts/views.py` using signed token (FR-003)
- [x] T032 [US1] Implement GET /store/ and PATCH /store/ endpoints in `backend/apps/stores/views.py` for store profile management (owner-only for PATCH)
- [x] T033 [US1] Create StoreSubscription model in `backend/apps/billing/models.py` with plan_name, status, trial_end_date, max_products, max_cashiers per data-model.md — auto-created with 14-day free trial on store registration
- [x] T034 [US1] Implement onboarding completion logic in `backend/apps/stores/views.py` — mark onboarding_completed=true after first category + product created (FR-004)

### US2: Entity CRUD Endpoints (All 17 Entity Types)

- [x] T035 [P] [US2] Create Category model and viewset in `backend/apps/inventory/models.py` and `backend/apps/inventory/views.py` with serializer in `backend/apps/inventory/serializers.py` — GET/POST/PUT/PATCH/DELETE /categories/ per contracts/api.md §3.1
- [x] T036 [P] [US2] Create Product model and viewset in `backend/apps/inventory/models.py` and `backend/apps/inventory/views.py` with serializer — GET/POST/PUT/PATCH/DELETE /products/ including GET /products/by-barcode/{barcode}/ per contracts/api.md §3.2
- [x] T037 [P] [US2] Create ProductBatch model and viewset in `backend/apps/inventory/models.py` and `backend/apps/inventory/views.py` — GET/POST/PUT/PATCH/DELETE /product-batches/ per contracts/api.md §3.3
- [x] T038 [P] [US2] Create StockMovement model and viewset in `backend/apps/stock/models.py` and `backend/apps/stock/views.py` — GET/POST/PUT/PATCH/DELETE /stock-movements/ per contracts/api.md §3.17
- [x] T039 [P] [US2] Create Supplier model and viewset in `backend/apps/purchasing/models.py` and `backend/apps/purchasing/views.py` — GET/POST/PUT/PATCH/DELETE /suppliers/ per contracts/api.md §3.4
- [x] T040 [P] [US2] Create PurchaseOrder + PurchaseOrderItem models and viewset in `backend/apps/purchasing/models.py` and `backend/apps/purchasing/views.py` — GET/POST/PUT/PATCH/DELETE /purchase-orders/ with nested items, PATCH /purchase-orders/{id}/receive/ per contracts/api.md §3.5
- [x] T041 [P] [US2] Create Customer model and viewset in `backend/apps/customers/models.py` and `backend/apps/customers/views.py` — GET/POST/PUT/PATCH/DELETE /customers/ per contracts/api.md §3.6
- [x] T042 [P] [US2] Create CustomerTransaction model and viewset in `backend/apps/customers/models.py` and `backend/apps/customers/views.py` — GET/POST /customer-transactions/ with auto balance_after calculation per contracts/api.md §3.7
- [x] T043 [P] [US2] Create Sale + SaleItem + PaymentEntry models in `backend/apps/sales/models.py` per data-model.md
- [x] T044 [US2] Create Sale viewset in `backend/apps/sales/views.py` — POST /sales/ (creates sale + items + payments atomically), GET /sales/, POST /sales/{id}/void/, POST /sales/{id}/return/ per contracts/api.md §3.8
- [x] T045 [P] [US2] Create CashierSession model and viewset in `backend/apps/sales/models.py` and `backend/apps/sales/views.py` — POST /cashier-sessions/, PATCH /cashier-sessions/{id}/close/ per contracts/api.md §3.9
- [x] T046 [P] [US2] Create POSQuickAccess model and viewset in `backend/apps/inventory/models.py` and `backend/apps/inventory/views.py` — GET/POST/PUT/PATCH/DELETE /pos-quick-access/ per contracts/api.md §3.10
- [x] T047 [P] [US2] Create Expense model and viewset in `backend/apps/expenses/models.py` and `backend/apps/expenses/views.py` — GET/POST/PUT/PATCH/DELETE /expenses/ per contracts/api.md §3.11
- [x] T048 [P] [US2] Create Promotion + PromotionProduct models and viewset in `backend/apps/promotions/models.py` and `backend/apps/promotions/views.py` — GET/POST/PUT/PATCH/DELETE /promotions/ with soft-delete per contracts/api.md §3.12
- [x] T049 [P] [US2] Create AuditLog viewset (read-only) in `backend/apps/audit/views.py` — GET /audit-logs/ with filtering per contracts/api.md §3.13
- [x] T050 [P] [US2] Create AppSetting model and viewset in `backend/apps/settings_app/models.py` and `backend/apps/settings_app/views.py` — GET /settings/, PUT /settings/{key}/ per contracts/api.md §3.14
- [x] T051 [P] [US2] Create TicketCounter model and viewset in `backend/apps/settings_app/models.py` and `backend/apps/settings_app/views.py` — POST /ticket-counter/next/ with atomic increment per contracts/api.md §3.15
- [x] T052 [US2] Create User management viewset in `backend/apps/accounts/views.py` — GET/POST/PUT/PATCH/DELETE /users/ with role-based restrictions (owner creates all roles, manager creates cashiers only) per contracts/api.md §3.16

### US2: Reports Endpoints

- [x] T053 [P] [US2] Implement GET /reports/sales-summary/ in `backend/apps/reports/views.py` — daily/weekly/monthly aggregation per contracts/api.md §7
- [x] T054 [P] [US2] Implement GET /reports/top-products/ in `backend/apps/reports/views.py`
- [x] T055 [P] [US2] Implement GET /reports/stock-alerts/ in `backend/apps/reports/views.py` — products below reorder level
- [x] T056 [P] [US2] Implement GET /reports/cashier-performance/ in `backend/apps/reports/views.py`
- [x] T057 [P] [US2] Implement GET /reports/expense-summary/ in `backend/apps/reports/views.py`

### US2: Real-Time Notifications (WebSocket)

- [x] T058 [US2] Create StoreSyncConsumer in `backend/apps/realtime/consumers.py` — WebSocket consumer with JWT auth on connect, per-store channel group joining per research.md decision #2 and contracts/api.md §5
- [x] T059 [US2] Create WebSocket routing in `backend/apps/realtime/routing.py` for ws/store/updates/ path
- [x] T060 [US2] Implement Django post_save/post_delete signal handlers in `backend/apps/realtime/signals.py` that broadcast entity changes to store's channel group (FR-012)
- [x] T061 [US2] Register signals for all entity models in `backend/apps/realtime/apps.py` ready() method

### US2: Data Export & Deletion

- [x] T062 [P] [US2] Implement POST /store/export/ and GET /store/export/{id}/ in `backend/apps/stores/views.py` for full store data export (FR-037)
- [x] T063 [P] [US2] Implement DELETE /store/ in `backend/apps/stores/views.py` — schedule store for permanent deletion with 90-day retention (FR-037)

### US2: URL Wiring

- [x] T064 [US2] Wire all app URL configs into `backend/config/urls.py` — include stores, accounts, inventory, sales, purchasing, customers, promotions, expenses, reports, settings_app, audit, billing, sync, realtime URLs under /api/v1/ prefix

### US2: Django Migrations

- [x] T065 [US2] Generate and run Django migrations for all entity models created in T035–T051 via `python manage.py makemigrations` and `python manage.py migrate`

**Checkpoint**: Full REST API operational. Two stores can be registered, all 21 entity types support CRUD with complete store isolation, audit logging enabled, real-time WebSocket notifications broadcasting changes. This is the MVP backend.

---

## Phase 4: User Story 3 — Web Admin Dashboard (Priority: P2)

**Goal**: Store owners/managers can manage their entire store from a browser — products, categories, suppliers, stock, purchases, customers, users, expenses, promotions, audit logs, settings, and reports — all backed by the API.

**Independent Test**: Log into the web dashboard, navigate to every management section, perform CRUD operations on each entity type, verify data persists. Verify a sale made via API/POS appears in real-time on the dashboard.

### US3: Foundation (API Client, Auth, Layout)

- [x] T066 [US3] Create API client service in `frontend/src/services/apiClient.ts` with axios instance, base URL from env, JWT interceptor (attach access token, auto-refresh on 401)
- [x] T067 [US3] Create WebSocket client service in `frontend/src/services/wsClient.ts` with auto-connect, JWT auth via query param, reconnect with exponential backoff, typed message handlers per contracts/api.md §5
- [x] T068 [US3] Create auth store in `frontend/src/stores/authStore.ts` with Zustand — login(), logout(), register(), verifyEmail(), refreshToken(), user state, token management
- [x] T069 [US3] Create auth pages: `frontend/src/pages/LoginPage.tsx`, `frontend/src/pages/RegisterPage.tsx`, `frontend/src/pages/VerifyEmailPage.tsx` — using Radix UI + Tailwind, calling auth store
- [x] T070 [US3] Create app layout in `frontend/src/components/layout/AppLayout.tsx` with sidebar navigation (all 12 management sections from spec US1 acceptance scenario #2), top bar, role-based menu filtering
- [x] T071 [US3] Configure React Router in `frontend/src/App.tsx` with protected routes (redirect to login if unauthenticated), public routes (landing, login, register, verify-email, pricing)
- [x] T072 [US3] Copy i18n configuration and locale files from existing `src/i18n/` to `frontend/src/i18n/` — adapt imports for API-backed architecture (FR-022)

### US3: Public Pages

- [x] T073 [P] [US3] Create landing page in `frontend/src/pages/public/LandingPage.tsx` — marketing hero, features overview, CTA to register (FR-023)
- [x] T074 [P] [US3] Create pricing page in `frontend/src/pages/public/PricingPage.tsx` — Free Trial, Basic, Pro tier comparison table (FR-023)

### US3: Management Pages (Reuse Existing Components)

- [x] T075 [P] [US3] Create Zustand store factory `frontend/src/stores/createApiStore.ts` — generic CRUD store that calls apiClient instead of local SQLite repo (replaces existing createCrudStore pattern for web)
- [x] T076 [P] [US3] Create product store + page: `frontend/src/stores/productStore.ts` and `frontend/src/pages/InventoryPage.tsx` — list, create, edit, delete products with category filter, barcode search (FR-020, reuse existing component patterns from src/components/inventory/)
- [x] T077 [P] [US3] Create category store + page: `frontend/src/stores/categoryStore.ts` and `frontend/src/pages/CategoriesPage.tsx` — category CRUD with color picker
- [x] T078 [P] [US3] Create supplier store + page: `frontend/src/stores/supplierStore.ts` and `frontend/src/pages/SuppliersPage.tsx` — supplier CRUD
- [x] T079 [P] [US3] Create purchase order store + page: `frontend/src/stores/purchaseStore.ts` and `frontend/src/pages/PurchasesPage.tsx` — PO CRUD with nested items, receive functionality
- [x] T080 [P] [US3] Create customer store + page: `frontend/src/stores/customerStore.ts` and `frontend/src/pages/CustomersPage.tsx` — customer CRUD with transaction ledger view
- [x] T081 [P] [US3] Create sales page: `frontend/src/stores/saleStore.ts` and `frontend/src/pages/SalesPage.tsx` — read-only sale list with filters (date, cashier, status), void/return actions (FR-021 — no POS checkout)
- [x] T082 [P] [US3] Create stock page: `frontend/src/stores/stockStore.ts` and `frontend/src/pages/StockPage.tsx` — stock movements list, manual adjustment form
- [x] T083 [P] [US3] Create user management page: `frontend/src/stores/userStore.ts` and `frontend/src/pages/UsersPage.tsx` — user CRUD (owner creates managers/cashiers), activate/deactivate toggle
- [x] T084 [P] [US3] Create expense store + page: `frontend/src/stores/expenseStore.ts` and `frontend/src/pages/ExpensesPage.tsx` — expense CRUD with category filter
- [x] T085 [P] [US3] Create promotion store + page: `frontend/src/stores/promotionStore.ts` and `frontend/src/pages/PromotionsPage.tsx` — promotion CRUD with product selection, date range, type config
- [x] T086 [P] [US3] Create audit log page: `frontend/src/stores/auditStore.ts` and `frontend/src/pages/AuditLogsPage.tsx` — read-only filtered list (user, action, entity, date range)
- [x] T087 [P] [US3] Create settings page: `frontend/src/stores/settingsStore.ts` and `frontend/src/pages/SettingsPage.tsx` — key-value settings editor (currency, tax, receipt header/footer, language, low stock threshold)

### US3: Reports Dashboard

- [x] T088 [P] [US3] Create reports store in `frontend/src/stores/reportStore.ts` calling /reports/ endpoints
- [x] T089 [P] [US3] Create dashboard page in `frontend/src/pages/DashboardPage.tsx` — today's sales summary, revenue chart (Recharts), top products, stock alerts, recent activity (FR-020)
- [x] T090 [P] [US3] Create reports page in `frontend/src/pages/ReportsPage.tsx` — sales summary, top products, cashier performance, expense summary with date range filters and Recharts visualizations (FR-032)

### US3: Real-Time Integration

- [x] T091 [US3] Integrate WebSocket client (T067) with all Zustand stores — on entity_change message, update the relevant store's state in-place, triggering React re-renders for real-time UI updates (FR-012, FR-014)

### US3: Onboarding Flow

- [ ] T092 [US3] Create onboarding wizard in `frontend/src/components/onboarding/OnboardingWizard.tsx` — step-by-step guide (store settings → first category → first product → invite cashier → download POS), shown when onboarding_completed=false (FR-004)

**Checkpoint**: Web admin dashboard fully functional. All 12 management sections operational, real-time updates working, public pages live. Store owners can manage their business from any browser.

---

## Phase 5: User Story 4 — Desktop POS Offline-First Operation & Sync (Priority: P2)

**Goal**: The existing Electron POS authenticates against the backend, caches data locally, processes sales offline, and syncs changes bidirectionally. Real-time updates from other devices appear instantly.

**Independent Test**: Log into the POS (requires internet). Make a sale while online (verify synced). Disconnect internet. Make more sales. Reconnect. Verify all offline sales appear on the backend. Add a product from the web dashboard and verify it appears on the POS within 3 seconds.

### US4: Backend Sync Endpoints

- [ ] T093 [US4] Create SyncLog model in `backend/apps/sync/models.py` with all fields from data-model.md (operation_id, entity, action, client_id, local_timestamp, sync_order, conflict_detected, conflict_resolution)
- [ ] T094 [US4] Implement POST /sync/push/ endpoint in `backend/apps/sync/views.py` — accept ordered operation array, detect duplicates via operation_id, perform field-level LWW merge, return accepted/conflicts/rejected per contracts/api.md §4
- [ ] T095 [US4] Implement GET /sync/pull/?since={timestamp} endpoint in `backend/apps/sync/views.py` — return all entities modified since timestamp, including soft deletes per contracts/api.md §4
- [ ] T096 [US4] Implement GET /sync/full/ endpoint in `backend/apps/sync/views.py` — return all store entities for initial full sync per contracts/api.md §4
- [ ] T097 [US4] Implement conflict resolution service in `backend/apps/sync/services.py` — field-level SHA-256 hash comparison, LWW merge, conflict logging per research.md decision #3

### US4: POS Auth Modifications

- [ ] T098 [US4] Create POS login screen in `src/components/auth/POSLoginScreen.tsx` — authenticates against backend API POST /auth/token/ (requires internet for first login), stores JWT refresh token + user record in local SQLite cache per research.md decision #5
- [ ] T099 [US4] Implement cached credential manager in `src/services/cachedAuth.ts` — store hashed credentials in local SQLite, validate PIN offline, enforce 7-day expiry on cached refresh token (FR-019)
- [ ] T100 [US4] Implement token refresh logic in `src/services/apiClient.ts` — auto-refresh access token using refresh token, handle 401 with re-auth prompt

### US4: Sync Engine

- [ ] T101 [US4] Create offline queue SQLite table and OfflineQueue class in `src/services/offlineQueue.ts` — stores pending operations with operation_id (UUID v4), entity, action, payload, local_timestamp, sync_order counter, field_hashes per research.md decision #3
- [ ] T102 [US4] Create SyncEngine service in `src/services/syncEngine.ts` — orchestrates push (flush queue), pull (incremental), and full sync operations. Calls /sync/push/, /sync/pull/, /sync/full/ endpoints
- [ ] T103 [US4] Implement connectivity monitor in `src/services/connectivityMonitor.ts` — detect online/offline state, trigger sync on reconnect, display connection status indicator in POS UI
- [ ] T104 [US4] Implement periodic sync timer in `src/services/syncEngine.ts` — pull incremental changes every 30 seconds while online (FR-018)
- [ ] T105 [US4] Implement initial full sync on first login in `src/services/syncEngine.ts` — download all store data to local SQLite cache via GET /sync/full/ (FR-018)

### US4: POS Store Modifications

- [ ] T106 [US4] Modify existing Zustand stores in `src/stores/` to use UUID v4 primary keys instead of autoincrement integers — update all store interfaces and SQLite schema (FR-040)
- [ ] T107 [US4] Add sync hooks to existing CRUD stores in `src/stores/createCrudStore.ts` — on local create/update/delete, enqueue operation in OfflineQueue, then attempt immediate push if online
- [ ] T108 [US4] Integrate WebSocket client in `src/services/wsClient.ts` — connect to ws/store/updates/, receive entity_change messages, update local SQLite + Zustand stores in real-time (FR-012)

### US4: POS UUID Migration

- [ ] T109 [US4] Update `database/schema.ts` to use UUID v4 TEXT primary keys instead of INTEGER AUTOINCREMENT across all 21 tables, add synced_at and client_id columns to sale-related tables
- [ ] T110 [US4] Update all repository files in `database/repositories/*.repo.ts` to generate UUID v4 on create, accept string IDs instead of numbers

### US4: Electron IPC Updates

- [ ] T111 [US4] Update `electron/main.js` to initialize SyncEngine on app startup, pass auth tokens via IPC, handle sync status events
- [ ] T112 [US4] Update `electron/preload.js` to expose sync IPC channels: sync:start, sync:status, sync:push, sync:pull, connectivity:status

**Checkpoint**: POS authenticates against backend, syncs data bidirectionally, works fully offline, and receives real-time updates. The core revenue-generating flow (scan items → checkout → print receipt) works with or without internet.

---

## Phase 6: User Story 5 — Mobile Store Management (Priority: P3)

**Goal**: Store owners can manage their store from a mobile app — view sales, check stock, add products via barcode scan, manage staff, and receive push notifications for alerts.

**Independent Test**: Log into the mobile app, view today's sales, scan a barcode to add a product, verify real-time updates appear when a POS sale is made, verify push notification received for low stock alert.

### US5: Mobile Foundation

- [ ] T113 [US5] Create API client service in `mobile/services/apiClient.ts` — axios instance with JWT interceptor, base URL from env
- [ ] T114 [US5] Create auth store in `mobile/stores/authStore.ts` — login(), logout(), token management, secure token storage via expo-secure-store
- [ ] T115 [US5] Create WebSocket client in `mobile/services/wsClient.ts` — connect, auth, reconnect, typed handlers (same pattern as frontend)
- [ ] T116 [US5] Create navigation structure in `mobile/app/_layout.tsx` — tab navigator with Dashboard, Products, Sales, More tabs, auth guard for login screen

### US5: Mobile Screens

- [ ] T117 [P] [US5] Create mobile dashboard screen in `mobile/app/(tabs)/dashboard.tsx` — today's sales count, revenue, recent sales list, stock alerts (FR-024)
- [ ] T118 [P] [US5] Create mobile products screen in `mobile/app/(tabs)/products.tsx` — product list with search, add/edit product form, category filter (FR-024)
- [ ] T119 [P] [US5] Create barcode scanner screen in `mobile/app/scan.tsx` — expo-camera barcode scanner, lookup product or offer creation flow (FR-025)
- [ ] T120 [P] [US5] Create mobile sales screen in `mobile/app/(tabs)/sales.tsx` — sale list with date filter, sale detail view
- [ ] T121 [P] [US5] Create mobile more screen in `mobile/app/(tabs)/more.tsx` — links to customers, suppliers, users, expenses, promotions, settings, reports sub-screens
- [ ] T122 [P] [US5] Create mobile settings screen in `mobile/app/settings.tsx` — store profile, notification preferences
- [ ] T123 [P] [US5] Create mobile reports screen in `mobile/app/reports.tsx` — sales summary chart, top products

### US5: Push Notifications

- [ ] T124 [US5] Implement push notification registration in `mobile/services/pushNotifications.ts` — register device token with expo-notifications, send token to backend
- [ ] T125 [US5] Create notification endpoint POST /notifications/register-device/ in `backend/apps/realtime/views.py` — store device tokens per user
- [ ] T126 [US5] Implement push notification dispatch in `backend/apps/realtime/services.py` — send Expo push notifications for low stock alerts, large sales, cashier session changes (FR-026)

### US5: Mobile Offline Cache

- [ ] T127 [US5] Implement light offline cache in `mobile/services/offlineCache.ts` using expo-sqlite — cache products, categories for offline viewing, queue product edits for sync (FR-027)

**Checkpoint**: Mobile app fully functional. Owners can manage their store on the go, scan barcodes, receive push notifications, and see real-time updates from POS devices.

---

## Phase 7: User Story 6 — Subscription & Plan Management (Priority: P3)

**Goal**: Stores start with a 14-day free trial. Owners can upgrade to Basic or Pro, with plan limits enforced. Subscription management via Stripe.

**Independent Test**: Register a new store (auto-starts free trial). Verify all features available during trial. Upgrade to Basic plan via Stripe Checkout. Verify payment processed. Exceed product limit and verify enforcement. Cancel subscription and verify grace period behavior.

### US6: Backend Billing

- [ ] T128 [US6] Configure dj-stripe in `backend/config/settings/base.py` — STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, djstripe app, webhook URL per research.md decision #4
- [ ] T129 [US6] Create plan tier configuration in `backend/apps/billing/plans.py` — Free Trial (14 days, full access), Basic (500 products, 3 cashiers), Pro (10000 products, 50 cashiers) with feature flags
- [ ] T130 [US6] Implement PlanLimitEnforcementMiddleware in `backend/apps/billing/middleware.py` — check limits on POST requests for products, users before view execution (FR-029)
- [ ] T131 [US6] Implement GET /billing/subscription/ endpoint in `backend/apps/billing/views.py` — return plan, status, limits, current usage per contracts/api.md §6
- [ ] T132 [US6] Implement POST /billing/checkout-session/ endpoint in `backend/apps/billing/views.py` — create Stripe Checkout Session for plan upgrade (FR-030)
- [ ] T133 [US6] Implement POST /billing/portal-session/ endpoint in `backend/apps/billing/views.py` — create Stripe Customer Portal session for self-service management (FR-030)
- [ ] T134 [US6] Implement POST /billing/webhook/ endpoint in `backend/apps/billing/views.py` — handle Stripe webhook events (subscription.created, subscription.updated, subscription.deleted, invoice.payment_succeeded, invoice.payment_failed) via dj-stripe signal receivers per research.md decision #4
- [ ] T135 [US6] Implement subscription lifecycle management in `backend/apps/billing/services.py` — handle state transitions (trial→active, active→past_due, active→canceled, canceled→expired), grace period logic (90-day retention), 14-day deletion warning email (FR-031)

### US6: Frontend Billing UI

- [ ] T136 [P] [US6] Create subscription page in `frontend/src/pages/SubscriptionPage.tsx` — display current plan, usage meters, upgrade/downgrade buttons, cancel option (FR-030)
- [ ] T137 [P] [US6] Add plan limit warnings to entity creation forms in `frontend/src/components/common/PlanLimitBanner.tsx` — show warning when approaching limits, block with upgrade CTA when at limit (FR-029)
- [ ] T138 [P] [US6] Create grace period banner in `frontend/src/components/common/GracePeriodBanner.tsx` — persistent warning when subscription is past_due or canceled, countdown to read-only mode

### US6: Mobile Billing UI

- [ ] T139 [US6] Create subscription screen in `mobile/app/subscription.tsx` — plan display, usage, link to Stripe portal for management (FR-030)

**Checkpoint**: Full billing lifecycle working. Stores start on free trial, can upgrade/downgrade, plan limits enforced, graceful degradation on subscription lapse.

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Security hardening, distribution, deployment, and refinements across all components

- [ ] T140 [P] Implement PII access logging middleware in `backend/apps/audit/middleware.py` — log read access to customer, user, payment endpoints (FR-036)
- [ ] T141 [P] Add rate limiting to auth endpoints in `backend/config/settings/base.py` — throttle login/register to prevent brute force
- [ ] T142 [P] Configure electron-builder auto-update in `electron-builder.yml` and `electron/main.js` — point to GitHub Releases for update feed (FR-039)
- [ ] T143 [P] Create desktop installer build script in `package.json` scripts — cross-platform builds for Windows (.exe) and macOS (.dmg) via electron-builder (FR-038)
- [ ] T144 [P] Create `backend/Dockerfile` and `backend/render.yaml` for Render deployment — Gunicorn + Daphne, PostgreSQL, Redis per research.md decision #7
- [ ] T145 [P] Create `frontend/vercel.json` for Vercel deployment — Vite build, API proxy rewrite, environment variables
- [ ] T146 [P] Configure Expo EAS Build in `mobile/eas.json` for iOS + Android builds per research.md decision #7
- [ ] T147 [P] Create seed data management command `backend/apps/core/management/commands/seed_demo_store.py` — create demo store with sample products, categories, customers, sales for development/demo
- [ ] T148 [P] Add health check endpoint GET /health/ in `backend/config/urls.py` — database + Redis connectivity check for monitoring (SC-013)
- [ ] T149 Run quickstart.md validation — verify all four components start successfully with documented commands, environment variables, and prerequisites

**Checkpoint**: All components production-ready. Installers built, deployment configs in place, security hardened, monitoring enabled.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Phase 1 — **BLOCKS all user stories**
- **US1+US2 (Phase 3)**: Depends on Phase 2 — core backend API
- **US3 (Phase 4)**: Depends on Phase 3 (needs API endpoints to call)
- **US4 (Phase 5)**: Depends on Phase 3 (needs API + sync endpoints)
- **US5 (Phase 6)**: Depends on Phase 3 (needs API endpoints)
- **US6 (Phase 7)**: Depends on Phase 3 (needs store + subscription models)
- **Polish (Phase 8)**: Depends on all desired user story phases being complete

### User Story Dependencies

- **US1+US2 (P1)**: Foundation → Immediately after Phase 2. No other story dependencies.
- **US3 (P2 — Web Dashboard)**: Requires Phase 3 complete (all API endpoints). No dependency on US4/US5/US6.
- **US4 (P2 — POS Sync)**: Requires Phase 3 complete (sync endpoints T093-T097). No dependency on US3/US5/US6.
- **US5 (P3 — Mobile)**: Requires Phase 3 complete (all API endpoints). No dependency on US3/US4/US6.
- **US6 (P3 — Billing)**: Requires Phase 3 complete (StoreSubscription model). No dependency on US3/US4/US5.

**Key Insight**: After Phase 3 (backend API), Phases 4–7 are completely independent and can proceed in parallel.

### Within Each User Story

- Models → Serializers → Viewsets → URL wiring → Migrations (backend)
- Services → Stores → Pages → Integration (frontend/mobile)
- Core implementation before integration/polish

### Parallel Opportunities

**Phase 1**: T003–T010 can all run in parallel (different projects/files)

**Phase 2**: T017, T021–T024, T26–T29 can run in parallel after T011–T016

**Phase 3**: T035–T048 (all entity CRUD viewsets) can run in parallel after Phase 2. T053–T057 (reports) parallel. T062–T063 (export) parallel.

**Phase 4**: T073–T090 (all management pages) can run in parallel after T066–T072 (foundation)

**Phase 5**: Backend (T093–T097) and POS modifications (T098–T112) have internal sequencing but backend sync endpoints can parallel with POS auth work

**Phase 6**: T117–T123 (mobile screens) all parallel after T113–T116 (foundation)

**Phase 7**: T136–T138 (frontend billing UI) parallel after T128–T135 (backend billing)

---

## Parallel Example: Phase 3 Entity CRUD Sprint

```
# After Phase 2 foundation is complete, launch all entity viewsets in parallel:

Parallel batch 1 (models + viewsets — all different files):
  T035: Category model + viewset     → backend/apps/inventory/
  T036: Product model + viewset      → backend/apps/inventory/
  T039: Supplier model + viewset     → backend/apps/purchasing/
  T041: Customer model + viewset     → backend/apps/customers/
  T043: Sale models                  → backend/apps/sales/
  T045: CashierSession               → backend/apps/sales/
  T047: Expense model + viewset      → backend/apps/expenses/
  T048: Promotion models + viewset   → backend/apps/promotions/
  T050: AppSetting model + viewset   → backend/apps/settings_app/

Parallel batch 2 (after models exist):
  T044: Sale viewset (depends on T043)
  T053–T057: All report endpoints in parallel
  T062–T063: Export + deletion endpoints
```

## Parallel Example: Phase 4 Web Dashboard Pages

```
# After foundation (T066–T072) is complete:

All management pages can launch in parallel:
  T076: Products page        → frontend/src/pages/InventoryPage.tsx
  T077: Categories page      → frontend/src/pages/CategoriesPage.tsx
  T078: Suppliers page       → frontend/src/pages/SuppliersPage.tsx
  T079: Purchases page       → frontend/src/pages/PurchasesPage.tsx
  T080: Customers page       → frontend/src/pages/CustomersPage.tsx
  T081: Sales page           → frontend/src/pages/SalesPage.tsx
  T082: Stock page           → frontend/src/pages/StockPage.tsx
  T083: Users page           → frontend/src/pages/UsersPage.tsx
  T084: Expenses page        → frontend/src/pages/ExpensesPage.tsx
  T085: Promotions page      → frontend/src/pages/PromotionsPage.tsx
  T086: Audit Logs page      → frontend/src/pages/AuditLogsPage.tsx
  T087: Settings page        → frontend/src/pages/SettingsPage.tsx
  T088–T090: Reports/Dashboard pages
```

---

## Implementation Strategy

### MVP First (Phase 1 + 2 + 3 = Backend API Only)

1. Complete Phase 1: Setup — scaffold all projects
2. Complete Phase 2: Foundational — auth, store isolation, base infrastructure
3. Complete Phase 3: US1+US2 — registration, all entity CRUD, real-time, reports
4. **STOP and VALIDATE**: Test full API with Postman/curl. Register two stores. Verify complete data isolation. Verify all 21 entity CRUD endpoints. Verify WebSocket real-time notifications.
5. MVP deliverable: Working multi-tenant API — the hardest and most critical piece

### Incremental Delivery

1. Phase 1+2+3 → **Backend API MVP** — test independently
2. Add Phase 4 (US3) → **Web Dashboard** — test independently → Deploy web
3. Add Phase 5 (US4) → **POS Sync** — test independently → Ship updated POS
4. Add Phase 6 (US5) → **Mobile App** — test independently → Submit to App Stores
5. Add Phase 7 (US6) → **Billing** — test independently → Enable monetization
6. Phase 8 → Polish, harden, deploy all
7. Each phase adds value without breaking previous work

### Parallel Team Strategy

With multiple developers after Phase 2 is complete:

1. Team completes Phase 1 + 2 together (foundation)
2. One developer: Phase 3 (backend API — critical path)
3. Once Phase 3 is done, split:
   - Developer A: Phase 4 (Web Dashboard)
   - Developer B: Phase 5 (POS Sync)
   - Developer C: Phase 6 (Mobile)
   - Developer D: Phase 7 (Billing)
4. All four phases proceed independently and integrate at Phase 8

---

## Notes

- [P] tasks = different files, no dependencies on other tasks in same batch
- [Story] label maps task to specific user story for traceability
- Each user story phase is independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate the story independently
- No tests generated — tests were not explicitly requested in the specification
