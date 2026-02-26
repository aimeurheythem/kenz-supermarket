# Data Model: Cart Panel Redesign (004)

**Feature**: 004-cart-panel | **Date**: 2026-02-26

## Overview

The cart panel is a **presentation-layer** component. It does **not** introduce new database entities or modify existing schemas. All data flows through existing types and store interfaces. This document maps the existing entities consumed by the cart panel.

## Entities Used (All Existing — No Changes)

### CartItem

Represents a product added to the current sale.

| Field | Type | Description |
|-------|------|-------------|
| product | `Product` | Full product object reference (includes `stock_quantity`, `selling_price`, `name`, etc.) |
| quantity | `number` | Quantity of this product in the cart (≥ 1) |
| discount | `number` | Per-item discount amount |

**Source**: `src/lib/types.ts` — `CartItem`
**Managed by**: `useSaleStore` (add, remove, clear, quantity changes)

**Computed fields** (derived in component, not stored):
- `lineTotal`: `product.selling_price × quantity - discount`
- `isAtMaxStock`: `quantity >= product.stock_quantity`

### Product

The underlying product referenced by a CartItem.

| Field | Type | Relevant to Cart Panel |
|-------|------|----------------------|
| id | `number` | Used as unique key for list rendering and promo lookup |
| name | `string` | Displayed in cart item row (truncated with ellipsis if long) |
| selling_price | `number` | Displayed as unit price |
| stock_quantity | `number` | Used to disable + button at max stock |
| barcode | `string \| null` | Not displayed, but used by scanner to add items |
| category_name | `string \| undefined` | Not displayed in cart panel |

**Source**: `src/lib/types.ts` — `Product`

### Customer

Optional entity linked to the sale. Selected via the header's searchable dropdown.

| Field | Type | Relevant to Cart Panel |
|-------|------|----------------------|
| id | `number` | Used to link sale to customer |
| full_name | `string` | Displayed in header when selected |
| phone | `string \| undefined` | Displayed in header; also used as search criterion |
| loyalty_points | `number` | Displayed in header badge when selected |
| total_debt | `number` | Relevant for credit payment validation |

**Source**: `src/lib/types.ts` — `Customer`
**Managed by**: `useCustomerStore` (loadCustomers, searchCustomers)

### PromotionApplicationResult

Computed discount data passed into the cart panel from the promotion engine.

| Field | Type | Description |
|-------|------|-------------|
| itemDiscounts | `PromotionResult[]` | Per-product discount entries |
| bundleDiscounts | `BundleResult[]` | Bundle/pack discount entries |
| totalSavings | `number` | Aggregate savings amount |

**Source**: `src/lib/types.ts` — `PromotionApplicationResult`
**Managed by**: `useSaleStore` (recomputed when cart changes)

### PromotionResult (per-item)

| Field | Type | Used in Cart Panel |
|-------|------|--------------------|
| productId | `number` | Key to match with CartItem product id |
| promotionName | `string` | Used in promotion badge tooltip |
| discountAmount | `number` | Displayed as savings badge on cart item row |
| description | `string` | Tooltip/alt text for promotion badge |

**Source**: `src/lib/types.ts` — `PromotionResult`

### PaymentMethod (Enumeration)

| Value | Display Label | Icon | Maps to DB Value |
|-------|--------------|------|-----------------|
| `'cash'` | Cash | `Banknote` | `'cash'` |
| `'mobile'` | E-Pay | `Smartphone` | `'mobile'` |
| `'card'` | Card | `CreditCard` | `'card'` |
| `'credit'` | Credit | `Wallet` | `'credit'` |

**Source**: `src/lib/types.ts` — union type `'cash' | 'card' | 'mobile' | 'credit'`
**Note**: The UI label "E-Pay" maps to the existing `'mobile'` value in the data model.

## Relationships

```
Customer (0..1) ─────── linked to ───── Sale (via checkout)
                                           │
CartItem (1..*) ─────── line items ───────┘
    │
    └── Product (1) ── references ── stock_quantity (for +/− limit)

PromotionApplicationResult ── computed from ── CartItem[] + active promotions
    │
    ├── itemDiscounts[] ── matched to ── CartItem.product.id
    └── bundleDiscounts[] ── matched to ── CartItem[].product.id groups
```

## State Transitions

### Cart Lifecycle

```
Empty → Has Items → Checkout → Empty
  │         │           │
  │         ├── Item Added (addToCart)
  │         ├── Item Removed (removeFromCart)
  │         ├── Quantity Changed (+/−)
  │         ├── Cart Cleared (clearCart + confirm)
  │         └── Promotions Recomputed (auto on change)
  │
  └── Complete Purchase button: disabled
       └── Has Items → button: enabled
            └── Credit + No Customer → blocked (must select customer)
```

### Payment Method State

```
Cash (default) ←→ E-Pay ←→ Card ←→ Credit
                                       │
                                       └── Requires Customer selected
```

## Validation Rules

| Rule | Where Enforced | Error Behavior |
|------|---------------|----------------|
| Quantity ≥ 1 | Component: − at qty=1 removes item | Item removed from cart |
| Quantity ≤ stock_quantity | Store: authoritative check; Component: + button disabled | Toast notification + button disabled |
| Credit requires Customer | Component: checkout handler | Block checkout, prompt to select customer |
| Cart non-empty for checkout | Component: button disabled state | Button visually disabled |
| Customer selection | Component: Escape keyboard shortcut | Clears selection, unlinks sale |
