# Data Model: Promotion Management System

**Feature**: 003-promotion-management  
**Date**: 2026-02-24

## Entity Relationship Diagram

```
┌──────────────────────┐       ┌──────────────────────────┐
│     promotions       │       │   promotion_products     │
├──────────────────────┤       ├──────────────────────────┤
│ id (PK)              │──┐    │ id (PK)                  │
│ name                 │  │    │ promotion_id (FK) ───────┤──→ promotions.id
│ type                 │  │    │ product_id (FK) ─────────┤──→ products.id
│ status               │  └───▶│                          │
│ start_date           │       └──────────────────────────┘
│ end_date             │
│ config (JSON)        │       ┌──────────────────────────┐
│ deleted_at           │       │     products (existing)  │
│ created_at           │       ├──────────────────────────┤
│ updated_at           │       │ id (PK)                  │
└──────────────────────┘       │ name                     │
                               │ selling_price            │
                               │ ...                      │
                               └──────────────────────────┘

       ┌──────────────────────────┐
       │   sale_items (existing)  │
       ├──────────────────────────┤
       │ id (PK)                  │
       │ sale_id (FK)             │
       │ product_id (FK)          │
       │ discount (REAL)          │ ← promotion discount written here
       │ promotion_id (FK) ──────┤──→ promotions.id  (NEW nullable column)
       │ promotion_name (TEXT)    │ ← snapshot for receipts  (NEW column)
       │ ...                      │
       └──────────────────────────┘
```

## Tables

### `promotions` (NEW)

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | INTEGER | PRIMARY KEY AUTOINCREMENT | Unique identifier |
| `name` | TEXT | NOT NULL | Admin-defined promotion name/title |
| `type` | TEXT | NOT NULL, CHECK(type IN ('price_discount', 'quantity_discount', 'pack_discount')) | Promotion type discriminator |
| `status` | TEXT | DEFAULT 'active', CHECK(status IN ('active', 'inactive')) | Admin-set operational status |
| `start_date` | TEXT | NOT NULL | ISO date — promotion start |
| `end_date` | TEXT | NOT NULL | ISO date — promotion end |
| `config` | TEXT | DEFAULT '{}' | JSON — type-specific configuration (see below) |
| `deleted_at` | TEXT | DEFAULT NULL | Soft delete timestamp, NULL = not deleted |
| `created_at` | TEXT | DEFAULT (datetime('now')) | Record creation timestamp |
| `updated_at` | TEXT | DEFAULT (datetime('now')) | Last update timestamp |

**Indexes**:
- `idx_promotions_type` ON `promotions(type)`
- `idx_promotions_status` ON `promotions(status)`
- `idx_promotions_dates` ON `promotions(start_date, end_date)`
- `idx_promotions_deleted` ON `promotions(deleted_at)`

### `promotion_products` (NEW)

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | INTEGER | PRIMARY KEY AUTOINCREMENT | Unique identifier |
| `promotion_id` | INTEGER | NOT NULL, REFERENCES promotions(id) ON DELETE CASCADE | Parent promotion |
| `product_id` | INTEGER | NOT NULL, REFERENCES products(id) ON DELETE CASCADE | Linked product |
| `created_at` | TEXT | DEFAULT (datetime('now')) | Record creation timestamp |

**Indexes**:
- `idx_promo_products_promotion` ON `promotion_products(promotion_id)`
- `idx_promo_products_product` ON `promotion_products(product_id)`
- UNIQUE(`promotion_id`, `product_id`) — prevent duplicates

### `sale_items` (MODIFIED — 2 new columns)

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `promotion_id` | INTEGER | DEFAULT NULL, REFERENCES promotions(id) ON DELETE SET NULL | Applied promotion (for audit/reporting) |
| `promotion_name` | TEXT | DEFAULT NULL | Snapshot of promotion name at time of sale (denormalized for receipts) |

## Config JSON Schemas (per promotion type)

### Price Discount (`type = 'price_discount'`)

```json
{
  "discount_type": "percentage" | "fixed",
  "discount_value": 20,
  "max_discount": null | 10.00
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `discount_type` | `"percentage"` or `"fixed"` | Yes | How discount is calculated |
| `discount_value` | number | Yes | Discount amount (% or currency units) |
| `max_discount` | number or null | No | Cap on discount amount (for percentage type) |

### Quantity Discount (`type = 'quantity_discount'`)

```json
{
  "buy_quantity": 2,
  "free_quantity": 1
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `buy_quantity` | integer | Yes | Number of units customer must buy (X) |
| `free_quantity` | integer | Yes | Number of free units (Y) |

**Computed at read time**: `total_required = buy_quantity + free_quantity`

### Pack Discount (`type = 'pack_discount'`)

```json
{
  "bundle_price": 35.00
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `bundle_price` | number | Yes | Special price for the complete bundle |

**Computed at read time**: `original_total` = sum of individual product prices, `savings` = original_total - bundle_price

## Validation Rules

### Promotion (all types)
- `name`: required, non-empty, max 200 characters
- `type`: required, must be one of the 3 valid types
- `status`: must be 'active' or 'inactive'
- `start_date`: required, valid ISO date
- `end_date`: required, valid ISO date, must be after `start_date`
- At least 1 product must be linked via `promotion_products`

### Price Discount config
- `discount_type`: required, must be 'percentage' or 'fixed'
- `discount_value`: required, must be > 0
- If `discount_type == 'percentage'`: `discount_value` must be ≤ 100
- `max_discount`: if provided, must be > 0
- Exactly 1 product linked

### Quantity Discount config
- `buy_quantity`: required, integer, must be ≥ 1
- `free_quantity`: required, integer, must be ≥ 1
- Exactly 1 product linked

### Pack Discount config
- `bundle_price`: required, must be > 0
- At least 2 products linked
- Warning (non-blocking) if `bundle_price` ≥ sum of product selling prices

## State Transitions

```
              ┌─────────────┐
   create →   │   Active    │ ← edit (if end_date extended)
              └──────┬──────┘
                     │
         ┌───────────┼──────────────┐
         │           │              │
    admin toggle   end_date      admin delete
    (manual)       passes        (soft delete)
         │        (auto)            │
         ▼           ▼              ▼
   ┌───────────┐ ┌───────────┐ ┌──────────┐
   │  Inactive │ │  Inactive │ │ Archived │
   │ (manual)  │ │ (expired) │ │(deleted) │
   └───────────┘ └───────────┘ └──────────┘
         │                          │
    extend end_date          NOT recoverable
    + set active                via UI
         │
         ▼
   ┌───────────┐
   │   Active   │
   └───────────┘
```

- **Active**: `status = 'active'` AND `end_date >= now` AND `deleted_at IS NULL`
- **Inactive (manual)**: `status = 'inactive'` AND `deleted_at IS NULL`
- **Inactive (expired)**: `status = 'active'` but `end_date < now` AND `deleted_at IS NULL` — displayed as "Expired"
- **Archived**: `deleted_at IS NOT NULL` — hidden from all lists, retained for historical queries
