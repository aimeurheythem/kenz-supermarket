# Repository Contract: PromotionRepo

**Module**: `database/repositories/promotion.repo.ts`  
**Export**: `PromotionRepo` (static object with async methods)  
**Re-export from**: `database/index.ts`

## Type Definitions (in `src/lib/types.ts`)

```typescript
// =============================================
// PROMOTIONS
// =============================================

export type PromotionType = 'price_discount' | 'quantity_discount' | 'pack_discount';
export type PromotionStatus = 'active' | 'inactive';

export interface PriceDiscountConfig {
    discount_type: 'percentage' | 'fixed';
    discount_value: number;
    max_discount: number | null;
}

export interface QuantityDiscountConfig {
    buy_quantity: number;
    free_quantity: number;
}

export interface PackDiscountConfig {
    bundle_price: number;
}

export type PromotionConfig = PriceDiscountConfig | QuantityDiscountConfig | PackDiscountConfig;

export interface Promotion {
    id: number;
    name: string;
    type: PromotionType;
    status: PromotionStatus;
    start_date: string;
    end_date: string;
    config: string; // JSON string — parsed by consumers
    deleted_at: string | null;
    created_at: string;
    updated_at: string;
    // Joined fields
    products?: PromotionProduct[];
    effective_status?: 'active' | 'inactive' | 'expired' | 'scheduled';
}

export interface PromotionProduct {
    id: number;
    promotion_id: number;
    product_id: number;
    created_at: string;
    // Joined fields
    product_name?: string;
    selling_price?: number;
}

export type PromotionInput = Pick<Promotion, 'name' | 'type' | 'start_date' | 'end_date'> & {
    status?: PromotionStatus;
    config: PromotionConfig;
    product_ids: number[];
};
```

## Repository Methods

### `getAll(filters?): Promise<Promotion[]>`
- Filters: `{ type?, status?, search?, includeExpired? }`
- Excludes soft-deleted (`deleted_at IS NULL`)
- Computes `effective_status` via SQL CASE:
  - `'expired'` if `end_date < datetime('now')` and status = 'active'
  - `'scheduled'` if `start_date > datetime('now')` and status = 'active'
  - Otherwise uses stored `status`
- Includes linked products via subquery or separate fetch
- Ordered by `created_at DESC`

### `getById(id): Promise<Promotion | undefined>`
- Includes linked products with product names and prices (LEFT JOIN)
- Excludes soft-deleted

### `create(input: PromotionInput): Promise<Promotion>`
- Validates input (type-specific validation)
- Inserts into `promotions` (config as JSON.stringify)
- Inserts into `promotion_products` (one row per product_id)
- Logs to `AuditLogRepo`
- Returns full promotion via `getById`

### `update(id, input: Partial<PromotionInput>): Promise<Promotion>`
- Dynamic field-by-field SQL building
- If `product_ids` provided: DELETE existing + re-INSERT
- If `config` provided: JSON.stringify
- Updates `updated_at`
- Logs to `AuditLogRepo`
- Returns full promotion via `getById`

### `delete(id): Promise<void>`
- Soft delete: `UPDATE promotions SET deleted_at = datetime('now') WHERE id = ?`
- Logs to `AuditLogRepo`

### `getActiveForCheckout(): Promise<Promotion[]>`
- Only returns promotions where:
  - `deleted_at IS NULL`
  - `status = 'active'`
  - `start_date <= datetime('now')`
  - `end_date >= datetime('now')`
- Includes linked products with prices
- Used by the promotion engine during checkout

### `count(filters?): Promise<number>`
- Count with same filter logic as `getAll`
