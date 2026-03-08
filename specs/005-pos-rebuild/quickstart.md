# Quickstart: Professional POS Page Rebuild

**Feature**: 005-pos-rebuild  
**Branch**: `005-pos-rebuild`  
**Date**: 2026-03-04

## Prerequisites

- Node.js 20+ installed
- Project dependencies installed: `npm install`
- SQLite database initialized (auto-seeds on first run)

## Development

```bash
# Start dev server (browser)
npm run dev

# Start Electron + dev server
npm run electron:dev

# Run tests
npm test

# Run tests once (CI)
npm run test:run

# Lint
npm run lint

# Format
npm run format
```

## Feature Overview

This feature rebuilds the POS page (`src/pages/POS.tsx`) into a professional multi-zone layout. Key changes:

### New Files to Create

| File | Purpose |
|------|---------|
| `src/components/POS/POSLayout.tsx` | Multi-zone grid layout orchestrator |
| `src/components/POS/POSHeader.tsx` | Store branding + cashier name + live clock |
| `src/components/POS/ClientInfoPanel.tsx` | Customer info card with search/select/clear |
| `src/components/POS/ProductDetailCard.tsx` | Last-scanned product detail preview |
| `src/components/POS/NumericKeypad.tsx` | On-screen 0–9 keypad with display |
| `src/components/POS/CartTicket.tsx` | Redesigned cart with ticket/receipt styling |
| `src/components/POS/CartTicketRow.tsx` | Line item with inline discount editing |
| `src/components/POS/TotalsBar.tsx` | Subtotal/VAT/Discount/Grand Total (oversized) |
| `src/components/POS/ActionGrid.tsx` | 4×3 action shortcut button grid |
| `src/components/POS/ActionButton.tsx` | Individual action button with F-key badge |
| `src/components/POS/HoldRecallDialog.tsx` | List + recall held transactions |
| `src/components/POS/ReturnDialog.tsx` | Sale lookup + item selection for returns |
| `src/components/POS/ManagerPinDialog.tsx` | Manager PIN entry modal |
| `src/components/POS/DiscountDialog.tsx` | Apply line/cart discount (%, fixed) |
| `src/components/POS/SplitPaymentPanel.tsx` | Multi-tender payment entry |
| `src/stores/usePOSStore.ts` | UI state: holds, selected product, keypad |
| `src/stores/useAuthorizationStore.ts` | Global manager PIN modal state |
| `src/hooks/useKeyboardShortcuts.ts` | F1–F12 + Enter/Escape for POS |
| `src/hooks/useLiveClock.ts` | Real-time clock for header |
| `src/hooks/useTicketNumber.ts` | Daily-reset ticket number |
| `src/hooks/useManagerAuth.ts` | Manager PIN verification |

### Files to Modify

| File | Changes |
|------|---------|
| `src/pages/POS.tsx` | Refactor to delegate to `POSLayout` |
| `src/stores/useSaleStore.ts` | Add manual discount, split payment, return actions |
| `src/lib/types.ts` | Add new types (PaymentEntry, ManualDiscount, HeldTransaction, etc.) |
| `database/schema.ts` | Add `payment_entries` + `ticket_counter` tables; alter `sales` + `sale_items` |
| `database/repositories/sale.repo.ts` | Add split payment, ticket number, partial return methods |
| `database/repositories/user.repo.ts` | Add `verifyManagerPin()` method |
| `src/components/POS/ReceiptPreview.tsx` | Add ticket number + split payment display |

### Database Migrations

Two new tables + column additions (applied in `schema.ts` init):

```sql
-- New table: payment_entries
CREATE TABLE IF NOT EXISTS payment_entries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sale_id INTEGER NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
  method TEXT NOT NULL CHECK(method IN ('cash','card','mobile','credit')),
  amount REAL NOT NULL CHECK(amount > 0),
  change_amount REAL DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);

-- New table: ticket_counter
CREATE TABLE IF NOT EXISTS ticket_counter (
  date TEXT PRIMARY KEY,
  last_number INTEGER NOT NULL DEFAULT 0
);

-- Alter sales: add ticket_number, return fields, cart discount, split payment method
-- Alter sale_items: add manual discount fields
```

## Testing Strategy

### Unit Tests (new)
- `usePOSStore` — hold/recall (max 5 enforcement, recall replace)
- `useAuthorizationStore` — PIN modal lifecycle
- `NumericKeypad` — digit entry, backspace, clear, confirm
- `TotalsBar` — calculation correctness (subtotal, VAT, combined discounts)
- `ActionGrid` — all 12 buttons render with correct labels/icons
- Manual discount calculation — percentage/fixed, line/cart scope

### Integration Tests (new)
- Hold → new sale → recall → checkout: full flow
- Return flow: lookup sale → select items → manager PIN → verify refund + stock
- Split payment: add entries → verify remaining → finalize
- Keyboard shortcuts: F1–F12 fire correct actions

### Existing Tests (verify no regression)
- `CartPanel.test.tsx` — extend for new props
- `useSaleStore.test.ts` — extend for new discount/return actions
- `promotionEngine.test.ts` — verify manual + promo discount ordering

## Architecture Notes

- **Stores**: `useSaleStore` (cart + checkout), `usePOSStore` (UI state + holds), `useAuthorizationStore` (PIN modal). Three stores, single responsibility each.
- **Layout**: CSS Grid 3-column (`grid-cols-[260px_1fr_240px]`), responsive at `xl:` breakpoint.
- **Held transactions**: In-memory only (Zustand, no persist), session-scoped, max 5 per cashier.
- **Authorization**: Service pattern — UI triggers → service opens PIN modal → verifies → returns result.
- **Ticket numbers**: `ticket_counter` SQLite table, daily reset, atomic increment inside checkout transaction.
