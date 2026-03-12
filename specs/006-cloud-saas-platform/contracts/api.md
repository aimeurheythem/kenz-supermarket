# API Contracts: Cloud-Powered Multi-Tenant Supermarket Management SaaS

**Feature**: `006-cloud-saas-platform` | **Date**: 2026-03-12

## Base URL

```
Production:  https://api.kenz.app/api/v1
Development: http://localhost:8000/api/v1
```

All endpoints require `Authorization: Bearer <access_token>` unless marked **Public**.  
All request/response bodies are `application/json`.  
All timestamps are ISO 8601 UTC (e.g., `2026-03-12T14:30:00Z`).  
All IDs are UUID v4 strings.  
Paginated list responses use `?page=1&page_size=25` (max 100).

## Standard Response Envelopes

### Success (Single)
```json
{
  "id": "uuid",
  "...fields": "..."
}
```

### Success (List / Paginated)
```json
{
  "count": 142,
  "next": "https://api.kenz.app/api/v1/products/?page=2",
  "previous": null,
  "results": [...]
}
```

### Error
```json
{
  "detail": "Human-readable message",
  "code": "machine_code",
  "errors": {
    "field_name": ["Validation error message"]
  }
}
```

HTTP status codes: 200 (OK), 201 (Created), 204 (No Content), 400 (Validation), 401 (Unauthenticated), 403 (Forbidden), 404 (Not Found), 409 (Conflict), 429 (Rate Limited).

---

## 1. Authentication

### POST /auth/register/ — **Public**
Create a new store + owner account.

**Request**:
```json
{
  "store_name": "Kenz Market",
  "email": "owner@example.com",
  "password": "SecureP@ss1",
  "full_name": "Ahmed Kenz",
  "currency": "DZD",
  "timezone": "Africa/Algiers"
}
```

**Response** (201):
```json
{
  "store": { "id": "uuid", "name": "Kenz Market", "slug": "kenz-market" },
  "user": { "id": "uuid", "email": "owner@example.com", "role": "owner" },
  "message": "Verification email sent"
}
```

### POST /auth/verify-email/ — **Public**
```json
{ "token": "email-verification-token" }
```
**Response** (200): `{ "detail": "Email verified" }`

### POST /auth/token/ — **Public**
Obtain JWT token pair.

**Request**:
```json
{ "email": "owner@example.com", "password": "SecureP@ss1" }
```

**Response** (200):
```json
{
  "access": "eyJ...",
  "refresh": "eyJ...",
  "user": {
    "id": "uuid",
    "email": "owner@example.com",
    "full_name": "Ahmed Kenz",
    "role": "owner",
    "store_id": "uuid",
    "store_name": "Kenz Market"
  }
}
```

### POST /auth/token/refresh/
```json
{ "refresh": "eyJ..." }
```
**Response** (200): `{ "access": "eyJ..." }`

### POST /auth/pin-login/
Quick POS login via PIN code.

**Request**:
```json
{ "username": "cashier1", "pin": "1234", "store_id": "uuid" }
```

**Response** (200): Same as `/auth/token/`.

### POST /auth/change-password/
```json
{ "old_password": "OldP@ss1", "new_password": "NewP@ss1" }
```
**Response** (200): `{ "detail": "Password changed. All sessions invalidated." }`

---

## 2. Store Management

### GET /store/
Get the current user's store.

**Response** (200):
```json
{
  "id": "uuid",
  "name": "Kenz Market",
  "slug": "kenz-market",
  "currency": "DZD",
  "timezone": "Africa/Algiers",
  "phone": "+213...",
  "email": "store@example.com",
  "address": "123 Main St",
  "logo_url": null,
  "is_active": true,
  "onboarding_completed": false,
  "created_at": "2026-03-12T14:30:00Z"
}
```

### PATCH /store/
Update store settings. **Roles**: owner.

**Request** (partial update):
```json
{ "name": "Kenz Premium Market", "onboarding_completed": true }
```

---

## 3. Entity CRUD Endpoints

All entity endpoints follow a consistent REST pattern. The `store_id` is implicit from the JWT token — never passed in the URL or body.

### Pattern
| Method | Path | Description | Roles |
|--------|------|-------------|-------|
| GET | /{entities}/ | List (paginated, filterable) | varies |
| POST | /{entities}/ | Create | varies |
| GET | /{entities}/{id}/ | Retrieve | varies |
| PUT | /{entities}/{id}/ | Full update | varies |
| PATCH | /{entities}/{id}/ | Partial update | varies |
| DELETE | /{entities}/{id}/ | Delete (or soft-delete) | varies |

### 3.1 Categories

**Base**: `/categories/`  
**Roles**: owner, manager (full CRUD); cashier (read-only).

**POST /categories/** request:
```json
{
  "id": "client-uuid",
  "name": "Beverages",
  "description": "Drinks and beverages",
  "color": "#3b82f6"
}
```

**GET /categories/** query params: `?search=bev&ordering=-created_at`

### 3.2 Products

**Base**: `/products/`  
**Roles**: owner, manager (full CRUD); cashier (read-only).

**POST /products/** request:
```json
{
  "id": "client-uuid",
  "barcode": "6281234567890",
  "name": "Orange Juice 1L",
  "category_id": "uuid",
  "cost_price": "150.00",
  "selling_price": "200.00",
  "stock_quantity": 50,
  "reorder_level": 10,
  "unit": "piece",
  "is_active": true
}
```

**GET /products/** query params: `?search=juice&category_id=uuid&is_active=true&barcode=628...&ordering=-selling_price&page=1&page_size=25`

**GET /products/by-barcode/{barcode}/** — Lookup by barcode (convenience).

### 3.3 Product Batches

**Base**: `/product-batches/`  
**Roles**: owner, manager (full CRUD); cashier (read-only).

**POST /product-batches/** request:
```json
{
  "id": "client-uuid",
  "product_id": "uuid",
  "batch_number": "B2026-001",
  "manufacture_date": "2026-01-15",
  "expiration_date": "2027-01-15",
  "quantity": 100,
  "cost_price": "145.00"
}
```

**GET /product-batches/** query params: `?product_id=uuid&expiration_before=2026-06-01`

### 3.4 Suppliers

**Base**: `/suppliers/`  
**Roles**: owner, manager (full CRUD); cashier (no access).

**POST /suppliers/** request:
```json
{
  "id": "client-uuid",
  "name": "AlgeriaCo Distribution",
  "contact_person": "Karim B.",
  "phone": "+213555123456",
  "email": "sales@algeriaco.dz",
  "address": "Zone Industrielle, Alger"
}
```

### 3.5 Purchase Orders

**Base**: `/purchase-orders/`  
**Roles**: owner, manager (full CRUD); cashier (no access).

**POST /purchase-orders/** request:
```json
{
  "id": "client-uuid",
  "supplier_id": "uuid",
  "expected_date": "2026-03-20T00:00:00Z",
  "notes": "Monthly restocking",
  "items": [
    {
      "id": "client-uuid",
      "product_id": "uuid",
      "quantity": 100,
      "unit_cost": "150.00"
    }
  ]
}
```

**PATCH /purchase-orders/{id}/receive/** — Mark as received:
```json
{
  "items": [
    { "id": "item-uuid", "received_quantity": 95 }
  ]
}
```

### 3.6 Customers

**Base**: `/customers/`  
**Roles**: owner, manager (full CRUD); cashier (read + create).

**POST /customers/** request:
```json
{
  "id": "client-uuid",
  "full_name": "Fatima Z.",
  "phone": "+213555987654",
  "email": "fatima@example.com",
  "notes": "Regular customer, prefers organic"
}
```

### 3.7 Customer Transactions

**Base**: `/customer-transactions/`  
**Roles**: owner, manager (full CRUD); cashier (create only — debt via sale).

**POST /customer-transactions/** request:
```json
{
  "id": "client-uuid",
  "customer_id": "uuid",
  "type": "payment",
  "amount": "5000.00",
  "description": "Partial debt payment"
}
```

### 3.8 Sales

**Base**: `/sales/`  
**Roles**: owner, manager (read, void, return); cashier (create, read own).

**POST /sales/** request:
```json
{
  "id": "client-uuid",
  "session_id": "uuid",
  "customer_id": "uuid-or-null",
  "items": [
    {
      "id": "client-uuid",
      "product_id": "uuid",
      "product_name": "Orange Juice 1L",
      "quantity": 3,
      "unit_price": "200.00",
      "promotion_id": "uuid-or-null",
      "promotion_name": "Buy 2 Get 10% Off",
      "discount": "40.00",
      "total": "560.00"
    }
  ],
  "payments": [
    {
      "id": "client-uuid",
      "method": "cash",
      "amount": "600.00",
      "change_amount": "40.00"
    }
  ],
  "cart_discount_type": "percentage",
  "cart_discount_value": "5.00",
  "ticket_number": 42
}
```

**GET /sales/** query params: `?date_from=2026-03-01&date_to=2026-03-12&user_id=uuid&status=completed&customer_id=uuid`

**POST /sales/{id}/void/** — Void a sale. **Roles**: owner, manager.
```json
{ "reason": "Customer dispute" }
```

**POST /sales/{id}/return/** — Process return. **Roles**: owner, manager.
```json
{
  "return_type": "full",
  "items": [
    { "sale_item_id": "uuid", "quantity": 1 }
  ]
}
```

### 3.9 Cashier Sessions

**Base**: `/cashier-sessions/`  
**Roles**: owner, manager (read all, force-close); cashier (own session CRUD).

**POST /cashier-sessions/** request (open session):
```json
{
  "id": "client-uuid",
  "opening_cash": "10000.00"
}
```

**PATCH /cashier-sessions/{id}/close/** request:
```json
{
  "closing_cash": "25430.00",
  "notes": "End of shift"
}
```

### 3.10 POS Quick Access

**Base**: `/pos-quick-access/`  
**Roles**: owner, manager (full CRUD); cashier (read-only).

**POST /pos-quick-access/** request:
```json
{
  "id": "client-uuid",
  "product_id": "uuid",
  "display_name": "Bread",
  "icon": "wheat",
  "color": "text-amber-600",
  "bg_color": "bg-amber-50"
}
```

### 3.11 Expenses

**Base**: `/expenses/`  
**Roles**: owner, manager (full CRUD); cashier (no access).

**POST /expenses/** request:
```json
{
  "id": "client-uuid",
  "description": "Electricity bill - March 2026",
  "amount": "12000.00",
  "category": "utilities",
  "date": "2026-03-10T00:00:00Z",
  "payment_method": "cash"
}
```

### 3.12 Promotions

**Base**: `/promotions/`  
**Roles**: owner, manager (full CRUD); cashier (read-only).

**POST /promotions/** request:
```json
{
  "id": "client-uuid",
  "name": "Ramadan Special",
  "type": "price_discount",
  "start_date": "2026-03-10T00:00:00Z",
  "end_date": "2026-04-10T00:00:00Z",
  "config": {
    "discount_type": "percentage",
    "discount_value": 15
  },
  "product_ids": ["uuid-1", "uuid-2", "uuid-3"]
}
```

**DELETE /promotions/{id}/** — Soft delete (sets `deleted_at`).

### 3.13 Audit Logs

**Base**: `/audit-logs/`  
**Roles**: owner, manager (read-only). No create/update/delete via API — server-generated.

**GET /audit-logs/** query params: `?user_id=uuid&action=create&entity=product&date_from=2026-03-01&date_to=2026-03-12&page=1`

### 3.14 App Settings

**Base**: `/settings/`  
**Roles**: owner (full CRUD); manager (read + update); cashier (read-only).

**GET /settings/** — Returns all store settings as key-value pairs:
```json
{
  "results": [
    { "key": "currency_format", "value": "DZD {amount}" },
    { "key": "tax_rate", "value": "19" },
    { "key": "receipt_header", "value": "Kenz Market - Thank You!" },
    { "key": "low_stock_threshold", "value": "10" },
    { "key": "language", "value": "ar" }
  ]
}
```

**PUT /settings/{key}/** — Upsert a setting:
```json
{ "value": "20" }
```

### 3.15 Ticket Counter

**Base**: `/ticket-counter/`  
**Roles**: owner, manager, cashier.

**POST /ticket-counter/next/** — Atomically increment and return next ticket number:
```json
{ "date": "2026-03-12" }
```
**Response** (200):
```json
{ "date": "2026-03-12", "ticket_number": 43 }
```

### 3.16 Users

**Base**: `/users/`  
**Roles**: owner (full CRUD); manager (read, create cashiers); cashier (read own).

**POST /users/** request:
```json
{
  "id": "client-uuid",
  "email": "cashier1@example.com",
  "username": "cashier1",
  "password": "CashierP@ss1",
  "pin_code": "1234",
  "full_name": "Ali Cashier",
  "role": "cashier"
}
```

### 3.17 Stock Movements

**Base**: `/stock-movements/`  
**Roles**: owner, manager (full CRUD); cashier (read-only, auto-created via sales).

**POST /stock-movements/** request:
```json
{
  "id": "client-uuid",
  "product_id": "uuid",
  "type": "adjustment",
  "quantity": -5,
  "reason": "Damaged goods"
}
```

---

## 4. Sync Endpoints

### POST /sync/push/
Push offline queue to server. POS sends queued operations in order.

**Request**:
```json
{
  "operations": [
    {
      "operation_id": "client-uuid",
      "entity": "sale",
      "action": "create",
      "payload": { "...sale fields..." },
      "local_timestamp": 1710251400000,
      "sync_order": 1,
      "client_id": "device-uuid",
      "field_hashes": {
        "total": "sha256...",
        "status": "sha256..."
      }
    }
  ]
}
```

**Response** (200):
```json
{
  "accepted": 45,
  "conflicts": [
    {
      "operation_id": "uuid",
      "entity": "product",
      "entity_id": "uuid",
      "resolution": "field_merge",
      "server_state": { "...merged fields..." },
      "merged_fields": {
        "price": { "source": "server", "value": "250.00" },
        "name": { "source": "client", "value": "Updated Name" }
      }
    }
  ],
  "rejected": [
    {
      "operation_id": "uuid",
      "reason": "duplicate_operation"
    }
  ]
}
```

### GET /sync/pull/?since={iso_timestamp}
Pull incremental changes since last sync.

**Response** (200):
```json
{
  "changes": [
    {
      "entity": "product",
      "action": "updated",
      "data": { "id": "uuid", "name": "...", "...all fields..." },
      "updated_at": "2026-03-12T14:30:00Z"
    },
    {
      "entity": "promotion",
      "action": "deleted",
      "data": { "id": "uuid", "deleted_at": "2026-03-12T14:25:00Z" },
      "updated_at": "2026-03-12T14:25:00Z"
    }
  ],
  "sync_timestamp": "2026-03-12T14:30:05Z",
  "has_more": false
}
```

### GET /sync/full/
Full data download for initial sync. Returns all entities for the store.

**Response** (200):
```json
{
  "categories": [...],
  "products": [...],
  "product_batches": [...],
  "suppliers": [...],
  "customers": [...],
  "promotions": [...],
  "promotion_products": [...],
  "pos_quick_access": [...],
  "app_settings": [...],
  "users": [...],
  "sync_timestamp": "2026-03-12T14:30:05Z"
}
```

---

## 5. WebSocket Contract

### Connection
```
ws(s)://{host}/ws/store/updates/?token={access_token}
```

The server extracts `store_id` from the JWT token claim. No `store_id` in the URL.

### Server → Client Messages

**Entity Change**:
```json
{
  "type": "entity_change",
  "entity": "product",
  "action": "created",
  "data": { "id": "uuid", "name": "...", "...all fields..." },
  "changed_by": "uuid",
  "timestamp": "2026-03-12T14:30:00Z"
}
```

**Session Invalidated**:
```json
{
  "type": "session_invalidated",
  "reason": "credentials_changed",
  "message": "Your credentials have been changed. Please log in again."
}
```

**Plan Limit Warning**:
```json
{
  "type": "plan_limit_warning",
  "resource": "products",
  "current": 48,
  "max": 50,
  "message": "You are approaching your product limit."
}
```

### Client → Server Messages

**Acknowledge Sync**:
```json
{
  "type": "sync_ack",
  "last_sync_timestamp": "2026-03-12T14:30:00Z"
}
```

### Error Codes
| Code | Meaning |
|------|---------|
| 4001 | Invalid or expired token |
| 4003 | Store access denied |

---

## 6. Subscription & Billing Endpoints

### GET /billing/subscription/
Get current store subscription status.

**Response** (200):
```json
{
  "plan_name": "basic",
  "status": "active",
  "trial_end_date": null,
  "next_billing_date": "2026-04-12T00:00:00Z",
  "cancel_at_period_end": false,
  "limits": {
    "max_products": 500,
    "max_cashiers": 3
  },
  "usage": {
    "products": 142,
    "cashiers": 2
  }
}
```

### POST /billing/checkout-session/
Create a Stripe Checkout Session for upgrade. **Roles**: owner.

**Request**:
```json
{ "plan": "pro" }
```

**Response** (200):
```json
{ "checkout_url": "https://checkout.stripe.com/c/pay/cs_..." }
```

### POST /billing/portal-session/
Create a Stripe Customer Portal session for self-service. **Roles**: owner.

**Response** (200):
```json
{ "portal_url": "https://billing.stripe.com/p/session/..." }
```

### POST /billing/webhook/ — **Public** (Stripe signature verified)
Handles Stripe webhook events. Not called by clients — called by Stripe.

Events handled: `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_succeeded`, `invoice.payment_failed`.

---

## 7. Reports Endpoints

### GET /reports/sales-summary/
**Roles**: owner, manager.  
**Query params**: `?period=daily|weekly|monthly&date_from=2026-03-01&date_to=2026-03-12`

**Response** (200):
```json
{
  "period": "daily",
  "data": [
    {
      "date": "2026-03-12",
      "total_sales": 25,
      "total_revenue": "125000.00",
      "total_cost": "87500.00",
      "profit": "37500.00",
      "average_sale": "5000.00"
    }
  ]
}
```

### GET /reports/top-products/
**Query params**: `?limit=10&date_from=...&date_to=...`

### GET /reports/stock-alerts/
Returns products below reorder level.

### GET /reports/cashier-performance/
**Query params**: `?user_id=uuid&date_from=...&date_to=...`

### GET /reports/expense-summary/
**Query params**: `?period=monthly&date_from=...&date_to=...`

---

## 8. Data Export

### POST /store/export/
Initiate full store data export. **Roles**: owner.

**Response** (202):
```json
{
  "export_id": "uuid",
  "status": "processing",
  "message": "Export started. You will receive an email with the download link."
}
```

### GET /store/export/{export_id}/
Check export status / download.

### DELETE /store/
Request permanent store deletion. **Roles**: owner. Requires password confirmation.

**Request**:
```json
{ "password": "SecureP@ss1", "confirm": "DELETE MY STORE" }
```

**Response** (200):
```json
{
  "message": "Store scheduled for deletion. 90-day retention period starts now.",
  "deletion_date": "2026-06-12T00:00:00Z"
}
```
