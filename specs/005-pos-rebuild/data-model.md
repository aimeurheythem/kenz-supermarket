# Data Model: Professional POS Page Rebuild

**Feature**: 005-pos-rebuild  
**Date**: 2026-03-04  
**Source**: [spec.md](spec.md) + [research.md](research.md)

## Entity Overview

```
┌─────────────┐     ┌──────────────┐     ┌────────────────┐
│   Customer   │◄────│     Sale     │────►│   SaleItem     │
└─────────────┘     │  (Transaction)│     └────────────────┘
                    │              │
                    │  ticket_no   │     ┌────────────────┐
                    │  status      │────►│ PaymentEntry   │
                    │  original_id │     └────────────────┘
                    └──────┬───────┘
                           │
                    ┌──────┴───────┐
                    │ TicketCounter│
                    └──────────────┘

┌─────────────────────────────────────┐
│      In-Memory (Zustand)            │
│                                     │
│  HeldTransaction  (max 5/cashier)   │
│  ManualDiscount   (line + cart)     │
│  AuthorizationState (PIN modal)     │
│  KeypadState      (digits buffer)   │
└─────────────────────────────────────┘
```

## New Database Tables

### `payment_entries`

Stores individual payment methods used in a transaction. One row per payment method per sale.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | INTEGER | PRIMARY KEY AUTOINCREMENT | Unique ID |
| `sale_id` | INTEGER | NOT NULL, FK → sales(id) ON DELETE CASCADE | Parent transaction |
| `method` | TEXT | NOT NULL, CHECK(method IN ('cash','card','mobile','credit')) | Payment method |
| `amount` | REAL | NOT NULL, CHECK(amount > 0) | Amount tendered |
| `change_amount` | REAL | DEFAULT 0, CHECK(change_amount >= 0) | Change given (only > 0 for final cash entry) |
| `created_at` | TEXT | DEFAULT (datetime('now')) | Timestamp |

**Indexes**: `idx_payment_entries_sale_id ON payment_entries(sale_id)`

### `ticket_counter`

Daily-reset sequential ticket number counter.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `date` | TEXT | PRIMARY KEY | Business date (YYYY-MM-DD) |
| `last_number` | INTEGER | NOT NULL, DEFAULT 0 | Last assigned ticket number for the day |

## Modified Tables

### `sales` — New Columns

| Column | Type | Default | Description |
|--------|------|---------|-------------|
| `ticket_number` | INTEGER | NULL | Sequential ticket number within the business day |
| `original_sale_id` | INTEGER | NULL, FK → sales(id) | Reference to original sale (for returns) |
| `return_type` | TEXT | NULL, CHECK(return_type IN ('full','partial')) | Return classification |
| `cart_discount_type` | TEXT | NULL, CHECK(cart_discount_type IN ('percentage','fixed')) | Cart-level manual discount type |
| `cart_discount_value` | REAL | 0 | Cart-level discount value (e.g., 10 for 10% or 5.00) |
| `cart_discount_amount` | REAL | 0 | Resolved cart-level discount in currency |

**Updated `payment_method` CHECK**: `CHECK(payment_method IN ('cash','card','mobile','credit','split'))`

**Updated `status` CHECK**: `CHECK(status IN ('completed','refunded','voided','returned'))`

### `sale_items` — New Columns

| Column | Type | Default | Description |
|--------|------|---------|-------------|
| `manual_discount_type` | TEXT | NULL, CHECK(manual_discount_type IN ('percentage','fixed')) | Line-level manual discount type |
| `manual_discount_value` | REAL | 0 | Discount value as entered (e.g., 10 for 10%) |
| `manual_discount_amount` | REAL | 0 | Resolved discount in currency |

## TypeScript Types (New / Modified)

### New Types

```typescript
/** A single payment entry in a (potentially split) payment */
interface PaymentEntry {
  id: number;
  sale_id: number;
  method: 'cash' | 'card' | 'mobile' | 'credit';
  amount: number;
  change_amount: number;
  created_at: string;
}

/** Payload for adding a payment during split payment flow */
interface PaymentEntryInput {
  method: 'cash' | 'card' | 'mobile' | 'credit';
  amount: number;
}

/** A manually applied discount (line-level or cart-level) */
interface ManualDiscount {
  type: 'percentage' | 'fixed';
  value: number;           // 10 for 10%, or 5.00 for $5
  computedAmount: number;  // resolved dollar amount
  reason?: string;
  authorizedBy?: number;   // manager user_id if above threshold
}

/** A parked/held transaction (session-scoped, in-memory) */
interface HeldTransaction {
  id: string;              // crypto.randomUUID()
  ticketNumber: number;
  cart: CartItem[];
  customer: Customer | null;
  promotionResult: PromotionApplicationResult | null;
  cartDiscount: ManualDiscount | null;
  heldAt: string;          // ISO timestamp
  cashierId: number;
  note?: string;
}

/** Item selection for a return/refund */
interface ReturnItem {
  saleItemId: number;
  productId: number;
  productName: string;
  originalQuantity: number;
  returnQuantity: number;
  unitPrice: number;
  lineDiscount: number;    // prorated discount per unit
  refundAmount: number;    // computed refund for this return line
}

/** Full return/refund request */
interface ReturnRequest {
  originalSaleId: number;
  items: ReturnItem[];
  totalRefund: number;
  reason?: string;
  authorizedBy: number;    // manager user_id (required for all returns)
}

/** Manager authorization result */
interface AuthorizationResult {
  authorized: boolean;
  managerId: number | null;
  managerName: string | null;
}

/** Authorization action types */
type AuthorizableAction = 'void_sale' | 'return' | 'large_discount' | 'price_override';

/** Numeric keypad state */
interface KeypadState {
  value: string;           // accumulated digit string
  mode: 'product_code' | 'quantity' | 'price';
}
```

### Modified Types

```typescript
// CartItem — add optional manual discount
interface CartItem {
  product: Product;
  quantity: number;
  discount: number;             // existing (promotion discount)
  manualDiscount?: ManualDiscount;  // NEW
}

// Sale — add new fields
interface Sale {
  // ... existing fields ...
  ticket_number: number | null;           // NEW
  original_sale_id: number | null;        // NEW (for returns)
  return_type: 'full' | 'partial' | null; // NEW
  cart_discount_type: 'percentage' | 'fixed' | null; // NEW
  cart_discount_value: number;            // NEW
  cart_discount_amount: number;           // NEW
  payment_method: 'cash' | 'card' | 'mobile' | 'credit' | 'split';  // MODIFIED (added 'split')
  status: 'completed' | 'refunded' | 'voided' | 'returned';         // MODIFIED (added 'returned')
}

// SaleItem — add manual discount fields
interface SaleItem {
  // ... existing fields ...
  manual_discount_type: 'percentage' | 'fixed' | null;  // NEW
  manual_discount_value: number;                          // NEW
  manual_discount_amount: number;                         // NEW
}
```

## State Management (Zustand Stores)

### `usePOSStore` (NEW)

POS UI state that doesn't belong in `useSaleStore`.

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `heldTransactions` | `HeldTransaction[]` | `[]` | Parked transactions (session-scoped, max 5) |
| `selectedProduct` | `Product \| null` | `null` | Last scanned/selected product for detail card |
| `keypadValue` | `string` | `''` | Accumulated digits on numeric keypad |
| `keypadMode` | `'product_code' \| 'quantity' \| 'price'` | `'product_code'` | What the keypad input is for |
| `returnMode` | `boolean` | `false` | Whether the return flow is active |
| `nextTicketNumber` | `number` | `1` | Preview of next ticket number |

**Actions**: `holdTransaction()`, `recallTransaction(id)`, `clearHeld(id)`, `setSelectedProduct(p)`, `appendKeypad(digit)`, `clearKeypad()`, `backspaceKeypad()`, `setKeypadMode(mode)`, `refreshNextTicket()`

### `useSaleStore` — Modifications

| New Field | Type | Default | Description |
|-----------|------|---------|-------------|
| `cartDiscount` | `ManualDiscount \| null` | `null` | Cart-level manual discount |

**New Actions**: `setCartDiscount(discount)`, `clearCartDiscount()`, `setItemManualDiscount(productId, discount)`, `clearItemManualDiscount(productId)`

**Modified Selectors**:
- `selectCartTotal` → includes manual line-level discounts in calculation
- New `selectGrandTotal` → `cartTotal - promoSavings - manualLineSavings - cartDiscountAmount`

### `useAuthorizationStore` (NEW)

Global singleton for the manager PIN modal.

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `isOpen` | `boolean` | `false` | Whether the PIN modal is showing |
| `action` | `AuthorizableAction \| null` | `null` | What action needs authorization |
| `resolve` | `((result: AuthorizationResult) => void) \| null` | `null` | Promise resolve callback |

**Actions**: `requestAuth(action)` → opens modal, returns `Promise<AuthorizationResult>`; `submitPin(pin)` → verifies, resolves promise; `cancel()` → resolves with `{ authorized: false }`

## Calculation Rules

### Cart Total Calculation Order

```
1. For each cart item:
   base_price = unit_price × quantity
   promo_discount = promotion engine discount (existing)
   after_promo = base_price - promo_discount
   manual_line = manualDiscount?.computedAmount ?? 0
   line_total = max(0, after_promo - manual_line)

2. subtotal = sum(all line_totals)

3. promo_bundle_savings = bundleDiscounts from promotionResult (existing)

4. cart_discount = cartDiscount?.computedAmount ?? 0

5. total_before_tax = max(0, subtotal - promo_bundle_savings - cart_discount)

6. vat = total_before_tax × vat_rate  (from settings, default 0.21)

7. grand_total = total_before_tax + vat
```

### Refund Calculation for Partial Returns

```
For each returned item:
  original_line_total = sale_item.total  (as stored)
  original_qty = sale_item.quantity
  refund_per_unit = original_line_total / original_qty
  refund_amount = refund_per_unit × return_quantity

If cart-level discount was applied:
  item_proportion = original_line_total / sale.subtotal
  cart_discount_share = sale.cart_discount_amount × item_proportion
  prorated_cart_discount = cart_discount_share × (return_quantity / original_qty)
  refund_amount -= prorated_cart_discount

total_refund = sum(all refund_amounts)
```

## Ticket Number Flow

```
Transaction Start:
  → Query: SELECT COALESCE(last_number, 0) + 1 FROM ticket_counter WHERE date = date('now')
  → Display as "Ticket n° {padded_number}" on cart header

Checkout (inside createFromCart transaction):
  → INSERT INTO ticket_counter (date, last_number) VALUES (date('now'), 0) ON CONFLICT(date) DO NOTHING
  → UPDATE ticket_counter SET last_number = last_number + 1 WHERE date = date('now')
  → SELECT last_number FROM ticket_counter WHERE date = date('now')
  → INSERT INTO sales (..., ticket_number) VALUES (..., last_number)
```

## Relationships

| From | To | Cardinality | Description |
|------|-----|-------------|-------------|
| Sale | PaymentEntry | 1:N | A sale has one (simple) or many (split) payment entries |
| Sale | SaleItem | 1:N | Existing — line items in a sale |
| Sale | Sale (self) | N:1 | Return references original sale via `original_sale_id` |
| Sale | Customer | N:1 | Existing — optional customer association |
| Sale | User | N:1 | Existing — cashier who processed the sale |
| TicketCounter | Sale | 1:N (implicit) | Counter generates `ticket_number` for sales on a given date |

## Validation Rules

| Entity | Field | Rule |
|--------|-------|------|
| PaymentEntry | `amount` | Must be > 0 |
| PaymentEntry | `method` | Must be one of: cash, card, mobile, credit |
| PaymentEntry | (sum) | Total of all entries for a sale must ≥ `sale.total` |
| ManualDiscount | `value` | Must be > 0; if percentage, must be ≤ 100 |
| ManualDiscount | `computedAmount` | Must not exceed the line total (for line-level) or subtotal (for cart-level) |
| ManualDiscount (threshold) | `computedAmount` | If above configured threshold → requires manager authorization |
| HeldTransaction | (count) | Max 5 per cashier session |
| ReturnItem | `returnQuantity` | 1 ≤ qty ≤ (original_qty − already_returned_qty) |
| Sale (return) | `original_sale_id` | Must reference a valid completed sale |
| TicketCounter | `last_number` | Monotonically increasing per date; never decremented |

## State Transitions

### Sale Status

```
[new] → completed     (successful checkout)
[new] → voided        (void before payment, requires manager PIN)
completed → returned   (full or partial return, requires manager PIN)
completed → refunded   (legacy full refund via existing flow)
completed → voided     (post-completion void, requires manager PIN)
returned → (terminal)  (no further transitions)
voided → (terminal)    (no further transitions)
refunded → (terminal)  (no further transitions)
```

### Held Transaction Lifecycle

```
[active cart] → held          (hold action, cart snapshot saved)
held → [active cart]          (recall action, held entry removed)
held → (discarded)            (session ends, all holds cleared)
```
