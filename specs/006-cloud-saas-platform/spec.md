# Feature Specification: Cloud-Powered Multi-Tenant Supermarket Management SaaS

**Feature Branch**: `006-cloud-saas-platform`  
**Created**: 2026-03-12  
**Status**: Draft  
**Input**: User description: "Transform the existing Kenz Supermarket Electron desktop application into a full SaaS product with a central backend API, web admin dashboard, modified desktop POS, and mobile app — all synchronized in real-time."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Store Owner Registration & Onboarding (Priority: P1)

A new store owner discovers the Kenz POS SaaS product through the marketing website. They sign up by providing their store name, contact details, and email address. After email verification, they land in their new store workspace — an empty admin dashboard ready to be configured. They add their first product category, create a few products, and invite a cashier by creating a user account. The entire process from sign-up to having a functioning store workspace takes minutes, not hours.

**Why this priority**: Without onboarding, no customer can use the product. This is the absolute foundation — it gates every other feature.

**Independent Test**: Can be fully tested by creating a new account on the website, verifying the email, logging in, and confirming the empty store workspace loads with all management sections accessible. Delivers a functional multi-tenant store workspace.

**Acceptance Scenarios**:

1. **Given** a visitor on the public website, **When** they complete the sign-up form with valid store name and email, **Then** a verification email is sent and a new isolated store workspace is created.
2. **Given** a verified store owner, **When** they log in for the first time, **Then** they see onboarding guidance and an empty admin dashboard with all management sections (Inventory, Suppliers, Stock, Purchases, Reports, Transactions, Users, Customers, Expenses, Promotions, Audit Logs, Settings).
3. **Given** a store owner in their dashboard, **When** they create a category and a product, **Then** the data is stored only within their store's isolation boundary and is invisible to other stores.

---

### User Story 2 - Backend API & Multi-Tenant Data Isolation (Priority: P1)

The central backend serves as the single source of truth for all stores. Every API request is scoped to the authenticated user's store. A store owner's data (products, sales, customers, stock, expenses, promotions, etc.) is completely isolated from every other store's data. The backend exposes REST endpoints for all 17+ entity types supporting full CRUD operations, authentication with role-based access, and real-time notifications when data changes.

**Why this priority**: The backend is the foundation that all other components (web, desktop, mobile) depend on. Nothing works without it.

**Independent Test**: Can be fully tested by making authenticated API calls for two different store accounts and confirming that each store's data is completely isolated. Delivers the core data platform.

**Acceptance Scenarios**:

1. **Given** two separate store accounts, **When** Store A creates a product, **Then** Store B cannot see or access that product through any API endpoint.
2. **Given** an authenticated user, **When** they make a CRUD request to any entity endpoint, **Then** the response contains only data belonging to their store.
3. **Given** a user with a "cashier" role, **When** they attempt to access an admin-only endpoint (e.g., manage users, view reports), **Then** the request is denied with an authorization error.
4. **Given** a valid authentication token, **When** a data change occurs for a store, **Then** all connected clients for that store receive a real-time notification of the change.

---

### User Story 3 - Web Admin Dashboard (Priority: P2)

A store owner or manager logs into the web admin dashboard from any browser. They can manage their entire store operation: add/edit products and categories, manage suppliers, track stock levels, record purchases, view sales reports and analytics, manage customer records, create/manage cashier accounts, record expenses, configure promotions, review audit logs, and adjust store settings. The dashboard reuses the existing UI components and design patterns from the current Electron app, but communicates with the central backend instead of local storage.

**Why this priority**: The web dashboard is the primary management interface for store owners. It replaces the admin functionality currently embedded in the Electron app and makes store management accessible from anywhere.

**Independent Test**: Can be fully tested by logging into the web dashboard and performing CRUD operations on every entity type (products, categories, suppliers, stock, purchases, customers, users, expenses, promotions, settings), then verifying data persists and appears correctly across page refreshes.

**Acceptance Scenarios**:

1. **Given** a store owner logged into the web dashboard, **When** they navigate to any management section, **Then** they see their store's data and can create, read, update, and delete records.
2. **Given** a manager logged into the web dashboard, **When** they attempt to access billing/subscription settings, **Then** they are denied access (owner-only).
3. **Given** a store owner viewing the dashboard, **When** a cashier makes a sale at the POS, **Then** the dashboard reflects the new sale data in real-time without requiring a page refresh.
4. **Given** the existing React components from the Electron app, **When** the web dashboard is built, **Then** it reuses the same UI components, design language, and i18n translations.

---

### User Story 4 - Desktop POS Offline-First Operation & Sync (Priority: P2)

A cashier at the store register opens the Electron POS app and logs in with credentials created by their store's admin. The POS downloads the latest product catalog, prices, and promotions from the server. The cashier processes sales, scans barcodes, uses quick access buttons, and prints receipts — all while data syncs to the server in the background. If the internet connection drops, the POS continues working seamlessly using local cached data. Sales made offline are queued and automatically pushed to the server when connectivity returns. When a manager adds a new product from the web dashboard or mobile app, the POS receives it in real-time.

**Why this priority**: The POS is the revenue-generating component — it must never stop working. Offline-first with sync is essential for retail environments with unreliable internet.

**Independent Test**: Can be fully tested by logging into the POS, making sales while online (verify data syncs), disconnecting internet, making more sales (verify POS works), reconnecting (verify offline sales sync to server), and confirming real-time updates from other devices appear on POS.

**Acceptance Scenarios**:

1. **Given** a cashier with valid credentials, **When** they log into the POS, **Then** the app authenticates against the central backend and downloads/syncs the latest store data to local cache.
2. **Given** a POS with internet connection, **When** a sale is completed, **Then** the sale is saved locally and pushed to the backend simultaneously.
3. **Given** a POS that loses internet connectivity, **When** a sale is completed, **Then** the sale is saved locally and added to the offline queue.
4. **Given** a POS with queued offline sales, **When** internet connectivity is restored, **Then** all queued sales are automatically pushed to the server in order and conflicts are resolved.
5. **Given** a connected POS, **When** a product is added/updated from the web dashboard or mobile app, **Then** the POS receives the update in real-time and reflects the change immediately.

---

### User Story 5 - Mobile Store Management (Priority: P3)

A store owner installs the mobile app on their phone and logs in with their store owner credentials. From their phone, they can view today's sales in real-time, check stock levels, add or edit products (including scanning barcodes with the phone camera), manage staff accounts, view reports, and receive push notifications for important events (low stock alerts, large sales, cashier session changes). The mobile app works as a companion to the web dashboard, giving the owner visibility and control when away from their computer.

**Why this priority**: Mobile access is a strong differentiator and convenience feature, but the core product works without it. Owners can use the web dashboard from a mobile browser as a fallback.

**Independent Test**: Can be fully tested by logging into the mobile app, performing management operations (view sales, add a product via barcode scan, check stock), verifying real-time updates appear when a cashier makes a sale, and confirming push notifications arrive for configured alerts.

**Acceptance Scenarios**:

1. **Given** a store owner with the mobile app installed, **When** they log in, **Then** they see a dashboard summarizing today's sales, revenue, and alerts for their store.
2. **Given** a store owner using the mobile app, **When** they scan a barcode with the phone camera, **Then** the app either shows the existing product or offers to create a new one.
3. **Given** a cashier making a sale at the POS, **When** the sale is processed, **Then** the store owner's mobile app reflects the updated sales data in real-time.
4. **Given** a product's stock level dropping below the configured threshold, **When** the threshold is crossed, **Then** the store owner receives a push notification on their phone.
5. **Given** the mobile app with no internet, **When** the owner makes edits (e.g., updates a product price), **Then** the edits are cached locally and synced when connectivity returns.

---

### User Story 6 - Subscription & Plan Management (Priority: P3)

A store owner starts with a free trial that gives them full access to all features for a limited period. Before the trial expires, they choose a subscription plan (Basic or Pro) and enter payment information. The system enforces plan limits (e.g., number of products, number of cashier accounts, advanced reporting access). The store owner can upgrade, downgrade, or cancel their plan at any time from the web dashboard or mobile app. If a subscription lapses, the store enters a read-only grace period before data access is restricted.

**Why this priority**: Monetization is critical for the SaaS business model, but a working product must exist first before charging for it.

**Independent Test**: Can be fully tested by signing up for a free trial, verifying all features are available, upgrading to a paid plan, confirming payment is processed, then testing plan limit enforcement by exceeding a limit.

**Acceptance Scenarios**:

1. **Given** a newly registered store, **When** onboarding completes, **Then** the store is placed on a free trial with full feature access and a visible expiration date.
2. **Given** a store on a free trial, **When** the owner selects a plan and enters payment details, **Then** the subscription is activated and payment is processed.
3. **Given** a store on the Basic plan, **When** the owner attempts to exceed a plan-specific limit, **Then** the system shows a clear message explaining the limit and offers an upgrade path.
4. **Given** a store with a lapsed subscription, **When** the grace period expires, **Then** the store enters read-only mode where data can be viewed but not modified until the subscription is renewed.

---

### Edge Cases

- What happens when two devices edit the same product simultaneously? The system uses last-write-wins conflict resolution with field-level merge — the most recent change to each field is preserved, and conflicting updates are logged for audit purposes.
- What happens when the offline queue on the POS contains hundreds of sales? The sync process handles bulk uploads in batches, with progress indication, and retries individual failed items without blocking the rest.
- What happens when a cashier's credentials are revoked while they are logged into the POS? The POS checks authentication status periodically; on next check, the session is terminated and the cashier is logged out with a clear message.
- What happens when a store owner deletes a product that has pending offline sales on a POS? The sync process detects the conflict, preserves the sale record with the product snapshot at time of sale, and flags the conflict for admin review.
- What happens when multiple cashiers at the same store use the POS simultaneously? Each cashier session is independent. Sales, session totals, and ticket numbers are scoped per cashier session and synchronized without interference.
- What happens when the backend server is down? The POS continues operating offline. The web dashboard and mobile app show a connectivity warning and retry automatically. No data is lost.
- What happens when a store exceeds its plan limits mid-day? Existing operations (e.g., open cashier sessions, in-progress sales) are not interrupted. The limit is enforced only on new creation operations.
- What happens when the POS cached credentials expire after 7 days offline? The POS displays a clear message that re-authentication is required, prevents new sales from being started, but preserves all queued offline data. Once internet is available and the cashier re-authenticates, all queued sales sync normally.
- What happens when a cancelled store's 90-day retention period is about to expire? The system sends an email warning to the store owner 14 days before permanent deletion, giving them a final opportunity to resubscribe and recover their data.

## Requirements *(mandatory)*

### Functional Requirements

**Multi-Tenancy & Store Management**

- **FR-001**: System MUST support multiple independent stores within a single deployment, with complete data isolation between stores.
- **FR-002**: System MUST associate every data record with exactly one store, and no query or API response may return data from a different store.
- **FR-003**: System MUST allow new store owners to self-register, creating an isolated store workspace upon email verification.
- **FR-004**: System MUST support a guided onboarding flow that helps new store owners configure their store (name, currency, timezone, default settings) after first login.

**Authentication & Authorization**

- **FR-005**: System MUST authenticate users via email/password with secure token-based sessions across all client applications (web, desktop, mobile).
- **FR-006**: System MUST enforce role-based access control with three roles: Store Owner (full access), Manager (full access except billing/subscription), and Cashier (POS checkout operations only).
- **FR-007**: System MUST allow store owners to create, deactivate, and delete user accounts for their store.
- **FR-008**: System MUST invalidate sessions when a user's credentials are changed or their account is deactivated.

**Entity Management (Full CRUD)**

- **FR-009**: System MUST provide full create, read, update, and delete operations for all core entities: Categories, Products, Product Batches, Suppliers, Purchase Orders, Purchase Order Items, Customers, Customer Transactions, Sales, Sale Items, Payment Entries, Stock Movements, Users, Cashier Sessions, POS Quick Access, Expenses, Audit Logs, Promotions, Promotion Products, App Settings, and Ticket Counters.
- **FR-010**: System MUST validate all entity data on input (required fields, data types, referential integrity) and return clear error messages for invalid submissions.
- **FR-011**: System MUST record an audit log entry for every create, update, and delete operation, capturing who made the change, when, and what changed.

**Real-Time Synchronization**

- **FR-012**: System MUST push real-time notifications to all connected clients for a store whenever data is created, updated, or deleted.
- **FR-013**: System MUST support persistent connections (e.g., WebSocket) for real-time data delivery to web, desktop, and mobile clients.
- **FR-014**: Clients MUST reconnect automatically after a connection interruption and receive any missed updates.

**Offline-First Desktop POS**

- **FR-015**: The desktop POS MUST maintain a local data cache that allows full checkout operations (sales, barcode scanning, quick access, receipt printing, cashier session management) without an internet connection.
- **FR-016**: The desktop POS MUST queue all data changes made while offline and automatically synchronize them with the server when connectivity returns.
- **FR-017**: The POS sync process MUST handle conflicts using last-write-wins with field-level merge and log all conflicts for admin review.
- **FR-018**: The desktop POS MUST perform an initial full sync on first login and incremental syncs periodically and on reconnection.
- **FR-019**: The desktop POS login screen MUST authenticate against the central backend (requiring internet for initial login), then allow offline operation using cached credentials. Cached credentials MUST expire after 7 days, at which point the POS requires an internet connection to re-authenticate before resuming operation.
- **FR-040**: All entities MUST use client-generated UUID v4 as their primary identifier, allowing any device to create records offline without ID collisions. The server MUST accept client-generated UUIDs as primary keys during sync.

**Web Admin Dashboard**

- **FR-020**: The web admin dashboard MUST provide all store management functionality: inventory (products, categories), suppliers, stock control, purchases, sales reports & analytics, customer management, user management, expenses, promotions, audit logs, and settings.
- **FR-021**: The web admin dashboard MUST NOT include the POS checkout screen — checkout is exclusive to the desktop POS application.
- **FR-022**: The web admin dashboard MUST reuse the existing React component library, design patterns, i18n translations, and styling from the current Electron application.
- **FR-023**: The web admin dashboard MUST include public-facing pages: landing page, pricing, features overview, sign-up, and login.

**Mobile Application**

- **FR-024**: The mobile app MUST provide the same store management functionality as the web admin dashboard, optimized for mobile interaction patterns.
- **FR-025**: The mobile app MUST support barcode scanning using the device camera for product lookup and creation.
- **FR-026**: The mobile app MUST deliver push notifications for configurable events: low stock alerts, large sales, cashier session open/close.
- **FR-027**: The mobile app MUST support light offline caching and an offline queue for product edits.

**Subscription & Billing**

- **FR-028**: System MUST support subscription tiers: Free Trial, Basic, and Pro, each with defined feature limits and access levels.
- **FR-029**: System MUST enforce plan limits at the operation level (e.g., maximum products, maximum user accounts, access to advanced reports).
- **FR-030**: Store owners MUST be able to view, upgrade, downgrade, and cancel their subscription from the web dashboard and mobile app.
- **FR-031**: System MUST provide a grace period after subscription lapse during which data is accessible in read-only mode before full restriction. After the grace period, store data MUST be retained for 90 days. The system MUST send an email warning 14 days before permanent deletion. After 90 days, all store data is permanently and irreversibly deleted.

**Reporting & Analytics**

- **FR-032**: System MUST provide reporting endpoints/views for: daily/weekly/monthly sales summaries, revenue breakdowns, top-selling products, stock level alerts, cashier performance metrics, and expense tracking.
- **FR-033**: Reports MUST be scoped to the authenticated user's store and respect role-based access (e.g., cashiers cannot access reports).

**Security & Data Protection**

- **FR-034**: System MUST enforce TLS encryption for all data in transit between clients and the backend.
- **FR-035**: System MUST enforce password complexity rules: minimum 8 characters with at least one uppercase letter, one lowercase letter, one digit, and one special character.
- **FR-036**: System MUST log all access to personally identifiable information (PII) — customer records, user accounts, and payment data — for audit purposes.
- **FR-037**: Store owners MUST be able to export all their store data in a standard format and request complete deletion of their store and all associated data.

**Desktop App Distribution**

- **FR-038**: The desktop POS MUST be distributable as a downloadable installer for Windows and macOS, available from the SaaS marketing website.
- **FR-039**: The desktop POS MUST support automatic updates so store owners receive new versions without manual intervention.

### Key Entities

- **Store**: The top-level tenant — represents a single supermarket business. All other entities belong to exactly one store. Key attributes: name, currency, timezone, subscription plan, owner.
- **User**: A person who can access the system. Belongs to one store. Has a role (Owner, Manager, or Cashier). Key attributes: email, name, role, active status.
- **Product**: A sellable item in the store's inventory. Belongs to a category, has pricing, barcode, stock level. Can have multiple batches with different expiry dates.
- **Category**: A grouping for products (e.g., "Beverages", "Dairy"). Used for organization and reporting.
- **Supplier**: An external vendor from whom the store purchases goods. Linked to purchase orders.
- **Purchase Order**: A record of goods ordered from a supplier, containing line items with quantities and costs.
- **Customer**: A store's customer who may have a loyalty record or transaction history.
- **Sale**: A completed checkout transaction. Contains sale items, payment entries, and is linked to a cashier session. Identified by a client-generated UUID to support offline creation.
- **Sale Item**: A line item within a sale — one product, quantity, unit price, and any applied promotion discount.
- **Payment Entry**: A payment made against a sale (cash, card, or split). A sale can have multiple payment entries.
- **Stock Movement**: A record of stock level changes (purchase receipt, sale, adjustment, return). Provides full stock audit trail.
- **Cashier Session**: A time-bounded work session for a cashier — tracks opening/closing balances, total sales, and discrepancies.
- **Expense**: A business expense recorded by the store (rent, utilities, supplies, etc.).
- **Promotion**: A discount rule (price discount, quantity discount, pack deal) that applies to specific products for a defined time period.
- **Audit Log**: An immutable record of every significant action in the system — who did what, when, and what changed.
- **App Settings**: Store-level configuration: currency format, receipt header/footer, tax rate, low stock threshold, language, and other preferences.
- **POS Quick Access**: Shortcut buttons configured by the store for frequently sold products, displayed on the POS checkout screen.
- **Ticket Counter**: Sequential numbering for sales receipts, managed per store.
- **Subscription**: The store's billing plan (trial, basic, pro), payment status, and feature entitlements.

## Clarifications

### Session 2026-03-12

- Q: What security posture should the system enforce for data protection? → A: Standard SaaS — TLS in transit, password complexity rules, PII access logging, store data export & deletion on owner request.
- Q: How should offline-generated records be uniquely identified to avoid collisions across devices? → A: Client-generated UUIDs — devices generate UUID v4 locally; server accepts them as primary keys.
- Q: What backend availability target should the system aim for? → A: 99.5% uptime (~3.65h downtime/month), single-region deployment, planned maintenance windows allowed.
- Q: How long should POS cached credentials remain valid before forcing re-authentication? → A: 7-day token expiry — offline operation for up to 1 week; re-auth required on next internet connection after 7 days.
- Q: What happens to store data after subscription cancellation and grace period? → A: 90-day retention post-grace; permanent deletion with 14-day advance email warning.

## Assumptions

- Standard email/password authentication is appropriate for the initial release; social login (Google, Apple) can be added later.
- "Last-write-wins with field-level merge" is an acceptable conflict resolution strategy for the retail domain where data conflicts are infrequent.
- The free trial period is 14 days (industry standard for SaaS products).
- Plan limits (e.g., max products, max users) will be defined during the planning phase based on business analysis.
- Push notifications for the mobile app rely on the device OS notification system (APNs for iOS, FCM for Android).
- The desktop POS requires internet for initial login/setup but operates fully offline thereafter until re-authentication is needed.
- Receipt printing uses the same printing infrastructure already present in the Electron app.
- The web dashboard supports modern browsers (Chrome, Firefox, Safari, Edge — latest 2 versions).
- Data export (CSV/PDF) capabilities from the existing app will be preserved in the web dashboard.
- Multi-language support (i18n) already present in the app will be extended to all client applications.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A new store owner can sign up, verify their email, and access their empty store workspace in under 3 minutes.
- **SC-002**: A store owner can add their first 50 products and invite their first cashier within 30 minutes of onboarding.
- **SC-003**: The POS checkout process completes a sale (scan items, accept payment, print receipt) in under 15 seconds per average transaction, matching or improving the current offline-only speed.
- **SC-004**: The POS operates without interruption or data loss during internet outages lasting up to 24 hours.
- **SC-005**: Offline sales sync to the server within 60 seconds of internet connectivity being restored.
- **SC-006**: Real-time updates (e.g., new product added from web) appear on connected POS devices within 3 seconds.
- **SC-007**: 100% of data is isolated between stores — no cross-store data leakage under any operation.
- **SC-008**: The system supports at least 500 concurrent stores with up to 5 simultaneous connected devices per store without performance degradation.
- **SC-013**: The backend MUST achieve 99.5% uptime (no more than ~3.65 hours unplanned downtime per month), with planned maintenance windows communicated 24 hours in advance.
- **SC-009**: 90% of store owners successfully complete onboarding and make their first sale within 1 hour of sign-up.
- **SC-010**: The mobile app loads the store dashboard within 3 seconds on a standard mobile connection.
- **SC-011**: The web admin dashboard loads any management page within 2 seconds on a standard broadband connection.
- **SC-012**: Push notifications for critical events (low stock, large sales) are delivered to the mobile app within 30 seconds of the triggering event.
