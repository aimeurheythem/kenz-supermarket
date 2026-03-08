# Research: Professional POS Page Rebuild

**Feature**: 005-pos-rebuild  
**Date**: 2026-03-04

## 1. Hold/Recall Transaction Pattern

**Decision**: Separate Zustand store (`usePOSStore` or `useHoldStore`), session-scoped (no persist middleware), max 5 held transactions per cashier.

**Rationale**: Session-scoped matches the spec (holds don't survive app restarts). A separate store keeps hold logic decoupled from the already-complex `useSaleStore` (246 lines with cart, checkout, promotions, analytics). The 5-item cap is enforced with a simple `holds.filter(h => h.cashierId === currentCashierId).length >= 5` guard.

**Data Structure**:
```typescript
interface HeldTransaction {
  id: string;                     // crypto.randomUUID()
  ticketNumber: number;
  cart: CartItem[];
  customer: Customer | null;
  promotionResult: PromotionApplicationResult | null;
  heldAt: string;                 // ISO timestamp
  cashierId: number;
  note?: string;
}
```

**Recall behavior**: Replace current cart (with confirmation dialog if cart is non-empty). No merge option — merging creates discount/promotion ambiguity.

**Alternatives considered**:
- *SQLite table*: Rejected — adds schema migration complexity for ephemeral session-scoped data.
- *Storing in `useSaleStore`*: Rejected — separation of concerns; `useSaleStore` already handles too many responsibilities.
- *Merge option*: Rejected — merging triggers ambiguous promotion recalculation; industry POS systems (Square, Lightspeed) use replace-only.

## 2. Split Payment Implementation

**Decision**: Separate `payment_entries` SQLite table. Keep existing `sales.payment_method` column as summary (`'split'` when multiple methods).

**Schema**:
```sql
CREATE TABLE IF NOT EXISTS payment_entries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sale_id INTEGER NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
  method TEXT NOT NULL,
  amount REAL NOT NULL,
  change_amount REAL DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);
```

**UI Flow**: Stepwise modal — show grand total + remaining balance, cashier selects method + enters amount, adds entries until remaining ≤ 0. Change calculated only on the final cash entry.

**Rationale**: Separate table preserves full payment audit trail, supports receipt reprinting with breakdown, enables SQL aggregation queries (`SUM(amount) WHERE method = 'cash'`). The existing `createFromCart` transaction naturally accommodates inserting payment entries.

**Alternatives considered**:
- *JSON column*: Rejected — can't index, can't aggregate via SQL.
- *Comma-separated `payment_method`*: Rejected — worse than JSON.

## 3. Manager PIN Authorization Mid-Flow

**Decision**: Service function (`authorizationService.ts`) returning `Promise<AuthorizationResult>`, with a global singleton PIN modal managed by a tiny Zustand store (`useAuthorizationStore`).

**Verification**: Add `verifyManagerPin(pin)` to `UserRepo` — iterates all active admin/manager users, verifies against bcrypt-hashed `pin_code`. Cashier only enters the PIN; the system identifies which manager matches.

**Audit trail**: Log to existing `audit_logs` table: `action='AUTHORIZE'`, `entity='POS_ACTION'`, `details='Manager authorization for {action_type}'`, `user_id=manager_id`.

**Rationale**: Service (not hook) because authorization is called from stores and components. Global modal store avoids prop-drilling. Existing bcrypt PIN verification (`verifyPin` in `user.repo.ts`) is reused.

**Alternatives considered**:
- *Hook-based*: Rejected — hooks can't be called from Zustand store actions.
- *Per-component verification*: Rejected — duplicates logic across void, return, discount components.

## 4. Daily-Reset Ticket Numbering

**Decision**: Dedicated `ticket_counter` table with one row per date.

**Schema**:
```sql
CREATE TABLE IF NOT EXISTS ticket_counter (
  date TEXT PRIMARY KEY,
  last_number INTEGER NOT NULL DEFAULT 0
);
```

**Logic** (inside `SaleRepo.createFromCart` transaction):
```sql
INSERT INTO ticket_counter (date, last_number) VALUES (date('now'), 0)
  ON CONFLICT(date) DO NOTHING;
UPDATE ticket_counter SET last_number = last_number + 1 WHERE date = date('now');
SELECT last_number FROM ticket_counter WHERE date = date('now');
```

**Format**: Zero-padded 3-digit (`001`, `042`). Display as `Ticket n° 042`. Stored via new `sales.ticket_number INTEGER` column.

**Rationale**: Counter table is monotonic by design. `MAX(ticket_number) + 1` from sales table is fragile (voided/deleted rows cause gaps or duplicates).

**Alternatives considered**:
- *`MAX(ticket_number)` query*: Rejected — fragile with deleted/voided records.
- *In-memory counter*: Rejected — resets on page refresh, can't share across windows.

## 5. Returns/Refunds from POS

**Decision**: Model returns as negative sales with `original_sale_id` reference. Support partial returns (select individual items + quantities).

**Schema additions**:
```sql
ALTER TABLE sales ADD COLUMN original_sale_id INTEGER REFERENCES sales(id);
ALTER TABLE sales ADD COLUMN return_type TEXT; -- 'full' | 'partial'
```

**Partial return flow**: Lookup original sale → display items with checkbox + quantity spinner (max = original qty − already-returned qty) → manager PIN → create return sale record (negative total) + restock items.

**Prorated discount calculation**:
- Line-level: `refund_per_unit = unit_price - (line_discount / original_quantity)`
- Cart-level: prorate proportionally by item share of subtotal.

**Stock restoration**: Existing `stock_movements` pattern with `type = 'return'`.

**Rationale**: Negative sales keep financial reporting simple — `SUM(total)` naturally accounts for refunds. Extends the existing `_reverseSale` pattern.

**Alternatives considered**:
- *Separate `returns` table*: Rejected — doubles query complexity for financial reports.
- *Modifying original sale quantities*: Rejected — destroys audit trail.

## 6. Manual Discount (Line-level + Cart-level)

**Decision**: Order of operations: (1) Automatic promotions, (2) Manual line-level discounts, (3) Manual cart-level discount.

**Data model**:
```typescript
interface ManualDiscount {
  type: 'percentage' | 'fixed';
  value: number;
  computedAmount: number;
  reason?: string;
  authorizedBy?: number;
}
```

In `CartItem`: add `manualDiscount?: ManualDiscount`. In store state: `cartDiscount: ManualDiscount | null`.

**Schema additions**:
```sql
ALTER TABLE sale_items ADD COLUMN manual_discount_type TEXT;
ALTER TABLE sale_items ADD COLUMN manual_discount_value REAL DEFAULT 0;
ALTER TABLE sale_items ADD COLUMN manual_discount_amount REAL DEFAULT 0;

ALTER TABLE sales ADD COLUMN cart_discount_type TEXT;
ALTER TABLE sales ADD COLUMN cart_discount_value REAL DEFAULT 0;
ALTER TABLE sales ADD COLUMN cart_discount_amount REAL DEFAULT 0;
```

Existing `sales.discount_amount` remains the total of all discounts (promo + manual line + manual cart).

**Rationale**: Promotions first is industry standard — promotions are "earned," manual discounts are "granted." Applying promotions first ensures customers get earned discounts; manual is on top.

**Alternatives considered**:
- *Manual first, then promotions*: Rejected — reduces item price, may disqualify tier-based promotions.
- *Only one discount allowed*: Rejected — spec requires combining both.

## 7. Responsive Multi-Zone POS Layout

**Decision**: CSS Grid for the top-level 3-column layout. Flexbox within each column for vertical stacking.

**Layout**: `grid-template-columns: 300px 1fr 280px` (≥1440px) / `260px 1fr 240px` (1024–1439px).

**Tailwind implementation**:
```html
<div class="grid h-full grid-cols-[260px_1fr_240px] xl:grid-cols-[300px_1fr_280px]">
```

**Grand total sizing**: `text-5xl xl:text-6xl font-black tabular-nums` (48px–60px) — the most visually dominant element per FR-002.

**Rationale**: CSS Grid is purpose-built for 2D layouts with fixed-width side panels and fluid center. Flexbox can't achieve this cleanly without `calc()`.

**Alternatives considered**:
- *Pure Flexbox*: Rejected — three-column with fluid center requires hacks.
- *Fixed pixel widths for all*: Rejected — doesn't adapt to varying screen widths.

## 8. Keyboard Shortcuts (F1–F12)

**Decision**: Dedicated `useKeyboardShortcuts` hook using single `useEffect` + `keydown` listener on `window` in capture phase.

**Mapping** (hardcoded, with F-key badge on action grid buttons):
| Key | Action |
|-----|--------|
| F1 | Hold Sale |
| F2 | Recall Sale |
| F3 | Void Sale |
| F4 | Apply Discount |
| F5 | Reprint Receipt |
| F6 | Open Cash Drawer |
| F7 | Price Check |
| F8 | Returns/Refunds |
| F9 | Daily Report |
| F10 | Settings |
| F11 | End Shift |
| F12 | Loyalty/Gift Card |

**Conflict handling**: `e.preventDefault()` in capture phase blocks browser F-key defaults (F5=refresh, F11=fullscreen, F12=devtools). Coexists with existing `useBarcodeScanner` hook (which triggers on rapid multi-char sequences, not single F-keys).

**Rationale**: Dedicated hook is cleaner than scattering `useEffect` blocks. Hardcoded mapping is appropriate — F-key POS assignments are industry-standardized, configurability adds UI complexity with no clear demand.

**Alternatives considered**:
- *Third-party library (react-hotkeys-hook)*: Rejected — adds dependency for ~30 lines of code.
- *Configurable mapping*: Rejected for v1 — can be added later by moving to persisted store.
