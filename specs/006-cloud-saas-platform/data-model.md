# Data Model: Cloud-Powered Multi-Tenant Supermarket Management SaaS

**Feature**: `006-cloud-saas-platform` | **Date**: 2026-03-12

## Overview

All entities use UUID v4 primary keys (client-generated, FR-040). All tenant-scoped entities inherit from `TenantModel` which provides `store_id` FK, `created_at`, and `updated_at`. The existing SQLite schema (17 tables) is migrated to PostgreSQL with the addition of `store_id` on every table and new entities for multi-tenancy (Store, Subscription) and sync (SyncLog).

## Entity Relationship Diagram

```
Store (tenant root)
├── User (owner/manager/cashier)
│   ├── CashierSession
│   ├── Sale (via user_id)
│   └── Expense (via user_id)
├── Category
│   └── Product
│       ├── ProductBatch
│       ├── SaleItem (via product_id)
│       ├── StockMovement (via product_id)
│       ├── PurchaseOrderItem (via product_id)
│       ├── POSQuickAccess (via product_id)
│       └── PromotionProduct (via product_id)
├── Supplier
│   └── PurchaseOrder
│       └── PurchaseOrderItem
├── Customer
│   ├── CustomerTransaction
│   └── Sale (via customer_id)
├── Sale
│   ├── SaleItem
│   └── PaymentEntry
├── Promotion
│   └── PromotionProduct
├── Expense
├── AuditLog
├── AppSetting
├── TicketCounter
└── StoreSubscription (1:1)
    └── (linked to Stripe via dj-stripe)

SyncLog (cross-cutting — tracks sync operations)
```

## Entities

### Store (NEW — tenant root)

The top-level tenant entity. Every other entity belongs to exactly one store.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PK, client-generated | Unique store identifier |
| name | String(255) | NOT NULL | Store display name |
| slug | String(100) | UNIQUE, NOT NULL | URL-safe identifier (e.g., "kenz-market-01") |
| owner_id | UUID | FK → User, NOT NULL | Store owner (first user created) |
| currency | String(10) | DEFAULT 'DZD' | ISO currency code |
| timezone | String(50) | DEFAULT 'Africa/Algiers' | IANA timezone |
| phone | String(20) | NULLABLE | Contact phone |
| email | String(255) | NULLABLE | Contact email |
| address | Text | NULLABLE | Physical address |
| logo_url | String(500) | NULLABLE | Store logo image URL |
| is_active | Boolean | DEFAULT true | Whether store is operational |
| onboarding_completed | Boolean | DEFAULT false | Whether initial setup wizard was finished |
| created_at | DateTime | auto | Store creation time |
| updated_at | DateTime | auto | Last modification time |

**Validation**: `slug` must be lowercase alphanumeric + hyphens, 3-100 chars. `currency` must be valid ISO 4217. `timezone` must be valid IANA timezone.

---

### User

A person who accesses the system. Migrated from existing `users` table with `store_id` added.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PK, client-generated | Unique user identifier |
| store_id | UUID | FK → Store, NOT NULL, indexed | Tenant isolation |
| email | String(255) | UNIQUE per store, NOT NULL | Login email |
| username | String(100) | UNIQUE per store, NOT NULL | Display username (from existing schema) |
| password_hash | String(255) | NOT NULL | bcrypt hash |
| pin_code | String(255) | NULLABLE | bcrypt-hashed PIN for quick POS login |
| pin_length | Integer | DEFAULT 4 | Original PIN digit count |
| full_name | String(255) | NOT NULL | Display name |
| role | Enum | 'owner' / 'manager' / 'cashier', NOT NULL | Access level |
| is_active | Boolean | DEFAULT true | Can log in |
| last_login | DateTime | NULLABLE | Last successful authentication |
| created_at | DateTime | auto | |
| updated_at | DateTime | auto | |

**Validation**: `email` format validated. `role` one of: owner, manager, cashier. `pin_code` if provided, 4-6 digits before hashing. One user per store must have role='owner'.

**State Transitions**: `is_active`: true → false (deactivated by owner) → true (reactivated). Deactivation invalidates all sessions (FR-008).

---

### Category

Product grouping. Migrated from existing `categories` table.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PK, client-generated | |
| store_id | UUID | FK → Store, NOT NULL, indexed | Tenant isolation |
| name | String(255) | NOT NULL, UNIQUE per store | Category name |
| description | Text | DEFAULT '' | |
| color | String(20) | DEFAULT '#6366f1' | Display color hex |
| created_at | DateTime | auto | |
| updated_at | DateTime | auto | |

**Validation**: `name` unique within store. `color` must be valid hex color code.

---

### Product

A sellable item. Migrated from existing `products` table.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PK, client-generated | |
| store_id | UUID | FK → Store, NOT NULL, indexed | Tenant isolation |
| barcode | String(255) | UNIQUE per store, NULLABLE | Scannable barcode |
| name | String(255) | NOT NULL | Product name |
| description | Text | DEFAULT '' | |
| category_id | UUID | FK → Category, NULLABLE (SET NULL on delete) | |
| cost_price | Decimal(10,2) | NOT NULL, DEFAULT 0 | Purchase cost |
| selling_price | Decimal(10,2) | NOT NULL, DEFAULT 0 | Retail price |
| stock_quantity | Integer | NOT NULL, DEFAULT 0 | Current stock level |
| reorder_level | Integer | NOT NULL, DEFAULT 10 | Low stock alert threshold |
| unit | String(50) | DEFAULT 'piece' | Unit of measure |
| image_url | String(500) | DEFAULT '' | Product image |
| is_active | Boolean | DEFAULT true | Available for sale |
| created_at | DateTime | auto | |
| updated_at | DateTime | auto | |

**Indexes**: `(store_id, barcode)`, `(store_id, category_id)`, `(store_id, name)`, `(store_id, is_active, updated_at)`.

**Validation**: `barcode` unique within store (not globally). `selling_price >= 0`. `cost_price >= 0`.

---

### ProductBatch

Batch/expiry tracking for products. Migrated from existing `product_batches`.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PK, client-generated | |
| store_id | UUID | FK → Store, NOT NULL, indexed | Tenant isolation |
| product_id | UUID | FK → Product, NOT NULL (CASCADE) | |
| batch_number | String(100) | NOT NULL | Supplier batch identifier |
| manufacture_date | Date | NULLABLE | |
| expiration_date | Date | NULLABLE | |
| quantity | Integer | NOT NULL, DEFAULT 0 | |
| cost_price | Decimal(10,2) | NULLABLE | Batch-specific cost |
| created_at | DateTime | auto | |

**Indexes**: `(store_id, product_id)`, `(store_id, expiration_date)`.

---

### Supplier

External vendor. Migrated from existing `suppliers` table.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PK, client-generated | |
| store_id | UUID | FK → Store, NOT NULL, indexed | |
| name | String(255) | NOT NULL | Supplier name |
| contact_person | String(255) | DEFAULT '' | |
| phone | String(50) | DEFAULT '' | |
| email | String(255) | DEFAULT '' | |
| address | Text | DEFAULT '' | |
| balance | Decimal(12,2) | DEFAULT 0 | Outstanding balance |
| is_active | Boolean | DEFAULT true | |
| created_at | DateTime | auto | |
| updated_at | DateTime | auto | |

---

### PurchaseOrder

Goods ordered from a supplier. Migrated from existing `purchase_orders`.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PK, client-generated | |
| store_id | UUID | FK → Store, NOT NULL, indexed | |
| supplier_id | UUID | FK → Supplier, NOT NULL | |
| order_date | DateTime | DEFAULT now() | |
| expected_date | DateTime | NULLABLE | |
| status | Enum | 'pending' / 'received' / 'cancelled', DEFAULT 'pending' | |
| total_amount | Decimal(12,2) | DEFAULT 0 | |
| paid_amount | Decimal(12,2) | DEFAULT 0 | |
| notes | Text | DEFAULT '' | |
| created_at | DateTime | auto | |
| updated_at | DateTime | auto | |

**State Transitions**: pending → received (goods arrived) → [terminal]. pending → cancelled → [terminal].

---

### PurchaseOrderItem

Line item in a purchase order. Migrated from existing `purchase_order_items`.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PK, client-generated | |
| store_id | UUID | FK → Store, NOT NULL, indexed | |
| purchase_order_id | UUID | FK → PurchaseOrder, NOT NULL (CASCADE) | |
| product_id | UUID | FK → Product, NOT NULL | |
| quantity | Integer | NOT NULL | Ordered quantity |
| unit_cost | Decimal(10,2) | NOT NULL | Per-unit cost |
| total_cost | Decimal(12,2) | NOT NULL | quantity × unit_cost |
| received_quantity | Integer | DEFAULT 0 | Actual received |

---

### Customer

A store's customer. Migrated from existing `customers` table.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PK, client-generated | |
| store_id | UUID | FK → Store, NOT NULL, indexed | |
| full_name | String(255) | NOT NULL | |
| phone | String(50) | NULLABLE | |
| email | String(255) | NULLABLE | |
| address | Text | NULLABLE | |
| loyalty_points | Integer | DEFAULT 0 | |
| total_debt | Decimal(12,2) | DEFAULT 0 | Outstanding credit |
| notes | Text | NULLABLE | |
| created_at | DateTime | auto | |
| updated_at | DateTime | auto | |

---

### CustomerTransaction

Ledger entries for customer credit/payments. Migrated from existing `customer_transactions`.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PK, client-generated | |
| store_id | UUID | FK → Store, NOT NULL, indexed | |
| customer_id | UUID | FK → Customer, NOT NULL (CASCADE) | |
| type | Enum | 'debt' / 'payment', NOT NULL | Transaction type |
| amount | Decimal(12,2) | NOT NULL | |
| balance_after | Decimal(12,2) | NOT NULL | Running balance |
| reference_type | String(50) | NULLABLE | 'sale' or 'payment' |
| reference_id | UUID | NULLABLE | sale_id or null |
| description | Text | NULLABLE | |
| created_at | DateTime | auto | |

---

### Sale

A completed checkout transaction. Migrated from existing `sales` table.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PK, client-generated | Supports offline creation |
| store_id | UUID | FK → Store, NOT NULL, indexed | |
| user_id | UUID | FK → User, NULLABLE | Cashier who processed |
| session_id | UUID | FK → CashierSession, NULLABLE | |
| customer_id | UUID | FK → Customer, NULLABLE (SET NULL) | |
| sale_date | DateTime | DEFAULT now() | |
| subtotal | Decimal(12,2) | NOT NULL, DEFAULT 0 | |
| tax_amount | Decimal(12,2) | DEFAULT 0 | |
| discount_amount | Decimal(12,2) | DEFAULT 0 | |
| total | Decimal(12,2) | NOT NULL, DEFAULT 0 | |
| payment_method | String(50) | DEFAULT 'cash' | Primary payment method |
| customer_name | String(255) | DEFAULT 'Walk-in Customer' | Denormalized |
| status | Enum | 'completed' / 'returned' / 'voided', DEFAULT 'completed' | |
| ticket_number | Integer | NULLABLE | Daily sequential number |
| original_sale_id | UUID | FK → Sale, NULLABLE | For returns |
| return_type | String(50) | NULLABLE | |
| cart_discount_type | String(50) | NULLABLE | 'percentage' or 'fixed' |
| cart_discount_value | Decimal(10,2) | DEFAULT 0 | |
| cart_discount_amount | Decimal(12,2) | DEFAULT 0 | |
| synced_at | DateTime | NULLABLE | When synced from offline device |
| client_id | UUID | NULLABLE | Device that created this sale |
| created_at | DateTime | auto | |

**Indexes**: `(store_id, sale_date)`, `(store_id, user_id)`, `(store_id, session_id)`.

---

### SaleItem

Line item in a sale. Migrated from existing `sale_items`.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PK, client-generated | |
| store_id | UUID | FK → Store, NOT NULL, indexed | |
| sale_id | UUID | FK → Sale, NOT NULL (CASCADE) | |
| product_id | UUID | FK → Product, NOT NULL | |
| product_name | String(255) | NOT NULL | Snapshot at time of sale |
| quantity | Integer | NOT NULL | |
| unit_price | Decimal(10,2) | NOT NULL | |
| discount | Decimal(10,2) | DEFAULT 0 | |
| total | Decimal(12,2) | NOT NULL | |
| manual_discount_type | String(50) | NULLABLE | 'percentage' or 'fixed' |
| manual_discount_value | Decimal(10,2) | DEFAULT 0 | |
| manual_discount_amount | Decimal(12,2) | DEFAULT 0 | |
| promotion_id | UUID | FK → Promotion, NULLABLE (SET NULL) | |
| promotion_name | String(255) | NULLABLE | Snapshot |

---

### PaymentEntry

Split payment for a sale. Migrated from existing `payment_entries`.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PK, client-generated | |
| store_id | UUID | FK → Store, NOT NULL, indexed | |
| sale_id | UUID | FK → Sale, NOT NULL (CASCADE) | |
| method | Enum | 'cash' / 'card' / 'mobile' / 'credit', NOT NULL | |
| amount | Decimal(12,2) | NOT NULL, CHECK > 0 | |
| change_amount | Decimal(12,2) | DEFAULT 0 | Cash change given |
| created_at | DateTime | auto | |

---

### StockMovement

Stock level changes. Migrated from existing `stock_movements`.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PK, client-generated | |
| store_id | UUID | FK → Store, NOT NULL, indexed | |
| product_id | UUID | FK → Product, NOT NULL (CASCADE) | |
| type | String(50) | NOT NULL | 'purchase', 'sale', 'adjustment', 'return' |
| quantity | Integer | NOT NULL | Positive or negative |
| previous_stock | Integer | NOT NULL | Stock before movement |
| new_stock | Integer | NOT NULL | Stock after movement |
| reason | Text | DEFAULT '' | |
| reference_id | UUID | NULLABLE | Source entity ID |
| reference_type | String(50) | NULLABLE | 'sale', 'purchase_order', etc. |
| created_at | DateTime | auto | |

---

### CashierSession

Shift tracking. Migrated from existing `cashier_sessions`.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PK, client-generated | |
| store_id | UUID | FK → Store, NOT NULL, indexed | |
| cashier_id | UUID | FK → User, NOT NULL (CASCADE) | |
| login_time | DateTime | DEFAULT now() | |
| logout_time | DateTime | NULLABLE | |
| opening_cash | Decimal(12,2) | DEFAULT 0 | Cash in drawer at start |
| closing_cash | Decimal(12,2) | NULLABLE | Cash in drawer at end |
| expected_cash | Decimal(12,2) | NULLABLE | Calculated |
| cash_difference | Decimal(12,2) | NULLABLE | closing - expected |
| status | Enum | 'active' / 'closed' / 'force_closed', DEFAULT 'active' | |
| notes | Text | DEFAULT '' | |
| created_at | DateTime | auto | |

**State Transitions**: active → closed (normal logout). active → force_closed (admin override).

---

### POSQuickAccess

Product shortcuts for POS. Migrated from existing `pos_quick_access`.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PK, client-generated | |
| store_id | UUID | FK → Store, NOT NULL, indexed | |
| product_id | UUID | FK → Product, NOT NULL (CASCADE) | |
| display_name | String(255) | NOT NULL | Button label |
| icon | String(50) | DEFAULT 'shopping-bag' | Lucide icon name |
| color | String(50) | DEFAULT 'text-zinc-500' | Text color class |
| bg_color | String(50) | DEFAULT 'bg-zinc-50' | Background color class |
| options | JSON | DEFAULT '[]' | Extra options |
| created_at | DateTime | auto | |
| updated_at | DateTime | auto | |

---

### Expense

Business expenses. Migrated from existing `expenses`.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PK, client-generated | |
| store_id | UUID | FK → Store, NOT NULL, indexed | |
| description | String(500) | NOT NULL | |
| amount | Decimal(12,2) | NOT NULL | |
| category | String(100) | NOT NULL | Expense category |
| date | DateTime | DEFAULT now() | |
| payment_method | String(50) | DEFAULT 'cash' | |
| user_id | UUID | FK → User, NULLABLE | Who recorded it |
| created_at | DateTime | auto | |

---

### AuditLog

Immutable action log. Migrated from existing `audit_logs`. Enhanced with PII access logging per FR-036.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PK, server-generated | |
| store_id | UUID | FK → Store, NOT NULL, indexed | |
| user_id | UUID | FK → User, NULLABLE | |
| user_name | String(255) | NULLABLE | Snapshot for display |
| action | String(100) | NOT NULL | 'create', 'update', 'delete', 'read_pii' |
| entity | String(100) | NOT NULL | Entity type name |
| entity_id | String(100) | NULLABLE | Entity UUID |
| details | Text | NULLABLE | Human-readable description |
| old_value | JSON | NULLABLE | Previous field values (for updates) |
| new_value | JSON | NULLABLE | New field values (for updates) |
| ip_address | String(45) | NULLABLE | IPv4 or IPv6 |
| created_at | DateTime | auto | Immutable |

**Note**: AuditLog entries are append-only. No update or delete operations are permitted. `read_pii` action tracks access to customer/user PII per FR-036.

---

### Promotion

Discount rules. Migrated from existing `promotions`.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PK, client-generated | |
| store_id | UUID | FK → Store, NOT NULL, indexed | |
| name | String(255) | NOT NULL | |
| type | Enum | 'price_discount' / 'quantity_discount' / 'pack_discount', NOT NULL | |
| status | Enum | 'active' / 'inactive', DEFAULT 'active' | |
| start_date | DateTime | NOT NULL | |
| end_date | DateTime | NOT NULL | |
| config | JSON | DEFAULT '{}' | Type-specific configuration |
| deleted_at | DateTime | NULLABLE | Soft delete |
| created_at | DateTime | auto | |
| updated_at | DateTime | auto | |

**Indexes**: `(store_id, type)`, `(store_id, status)`, `(store_id, start_date, end_date)`, `(store_id, deleted_at)`.

---

### PromotionProduct

Junction table linking promotions to products. Migrated from existing `promotion_products`.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PK, client-generated | |
| store_id | UUID | FK → Store, NOT NULL, indexed | |
| promotion_id | UUID | FK → Promotion, NOT NULL (CASCADE) | |
| product_id | UUID | FK → Product, NOT NULL (CASCADE) | |
| created_at | DateTime | auto | |

**Constraints**: UNIQUE(store_id, promotion_id, product_id).

---

### AppSetting

Key-value store settings per store. Migrated from existing `app_settings`.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PK, server-generated | |
| store_id | UUID | FK → Store, NOT NULL, indexed | |
| key | String(255) | NOT NULL | Setting key |
| value | Text | NULLABLE | Setting value (JSON or plain) |
| updated_at | DateTime | auto | |

**Constraints**: UNIQUE(store_id, key).

---

### TicketCounter

Daily sequential numbering for receipts. Migrated from existing `ticket_counter`.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PK, server-generated | |
| store_id | UUID | FK → Store, NOT NULL, indexed | |
| date | Date | NOT NULL | Calendar date |
| last_number | Integer | NOT NULL, DEFAULT 0 | Last assigned ticket number |

**Constraints**: UNIQUE(store_id, date).

---

### StoreSubscription (NEW)

Subscription/billing state for a store. Linked to Stripe via dj-stripe.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PK, server-generated | |
| store_id | UUID | FK → Store, ONE-TO-ONE, NOT NULL | |
| stripe_customer_id | String(255) | NULLABLE | Stripe customer ID |
| stripe_subscription_id | String(255) | NULLABLE | Stripe subscription ID |
| plan_name | Enum | 'free' / 'basic' / 'pro', DEFAULT 'free' | Current plan |
| status | Enum | 'trial' / 'active' / 'past_due' / 'canceled' / 'expired', DEFAULT 'trial' | |
| trial_end_date | DateTime | NULLABLE | Trial expiration |
| next_billing_date | DateTime | NULLABLE | Next charge date |
| cancel_at_period_end | Boolean | DEFAULT false | Scheduled cancellation |
| grace_period_end | DateTime | NULLABLE | 90 days after cancellation |
| max_products | Integer | DEFAULT 50 | Plan limit |
| max_cashiers | Integer | DEFAULT 1 | Plan limit |
| created_at | DateTime | auto | |
| updated_at | DateTime | auto | |

**State Transitions**: trial → active (upgrade). trial → expired (trial ends, no payment). active → past_due (payment failed). active → canceled (owner cancels). past_due → active (payment retried). canceled → expired (grace period ends). Any → active (resubscribe).

---

### SyncLog (NEW — cross-cutting)

Tracks sync operations between POS devices and the backend. Used for conflict detection and duplicate prevention.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PK, server-generated | |
| store_id | UUID | FK → Store, NOT NULL, indexed | |
| operation_id | UUID | NOT NULL, UNIQUE | Client-generated sync operation ID |
| entity | String(100) | NOT NULL | Entity type |
| action | String(50) | NOT NULL | 'create', 'update', 'delete' |
| client_id | UUID | NOT NULL | Device that originated the change |
| local_timestamp | BigInteger | NOT NULL | Client's local timestamp (ms) |
| sync_order | Integer | NOT NULL | Client's sync order counter |
| conflict_detected | Boolean | DEFAULT false | |
| conflict_resolution | JSON | NULLABLE | Merge details if conflict occurred |
| created_at | DateTime | auto | Server receipt time |

**Indexes**: `(store_id, entity, created_at)`, `(operation_id)` UNIQUE.

---

## Migration Notes

### From SQLite (INTEGER AUTOINCREMENT) to PostgreSQL (UUID v4)

1. All existing `id INTEGER PRIMARY KEY AUTOINCREMENT` columns become `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`.
2. All FKs change from `INTEGER REFERENCES` to `UUID REFERENCES`.
3. Every table gains a `store_id UUID NOT NULL REFERENCES stores(id)` column.
4. Unique constraints that were global (e.g., `categories.name UNIQUE`) become store-scoped: `UNIQUE(store_id, name)`.
5. `app_settings` changes from `key TEXT PRIMARY KEY` to `UNIQUE(store_id, key)` with a UUID PK.
6. `ticket_counter` changes from `date TEXT PRIMARY KEY` to `UNIQUE(store_id, date)` with a UUID PK.

### Indexes to Preserve (adapted for multi-tenant)

All existing single-column indexes are adapted to composite `(store_id, ...)` indexes:
- `idx_products_barcode` → `(store_id, barcode)`
- `idx_products_category` → `(store_id, category_id)`
- `idx_sales_date` → `(store_id, sale_date)`
- `idx_sales_user` → `(store_id, user_id)`
- `idx_sale_items_sale` → `(store_id, sale_id)`
- `idx_stock_movements_product` → `(store_id, product_id)`
- `idx_purchase_orders_supplier` → `(store_id, supplier_id)`
- `idx_product_batches_product` → `(store_id, product_id)`
- `idx_promotions_type` → `(store_id, type)`
- `idx_promotions_status` → `(store_id, status)`
- `idx_promotions_dates` → `(store_id, start_date, end_date)`
