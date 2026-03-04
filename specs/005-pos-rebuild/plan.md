# Implementation Plan: Professional POS Page Rebuild

**Branch**: `005-pos-rebuild` | **Date**: 2026-03-04 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/005-pos-rebuild/spec.md`

## Summary

Rebuild the POS page into a professional multi-zone layout inspired by commercial tablet POS systems. The layout features: a header bar (branding + session info + live clock), left panel (client info card + product detail card + numeric keypad), center panel (search/scan bar + scrollable cart/ticket list + prominent totals bar with oversized grand total), and right panel (12+ action shortcut grid). New features include: hold/recall transactions (max 5), returns/refunds from POS, split payment, manual discounts (line-level + cart-level, % or fixed), manager PIN authorization for voids/returns/large discounts, daily-reset ticket numbering, and F1–F12 keyboard shortcuts.

## Technical Context

**Language/Version**: TypeScript 5.9 (React 19.x)  
**Primary Dependencies**: Vite 7.x, React 19, Zustand 5.x (state), sql.js + better-sqlite3 (SQLite), Framer Motion 12.x (animations), Radix UI (dialogs/selects/tooltips), lucide-react (icons), sonner (toasts), react-i18next (i18n), react-router-dom 7, Tailwind CSS 4.x  
**Storage**: SQLite (client-side via sql.js; Electron persistence via IPC with better-sqlite3)  
**Testing**: Vitest 4.x + @testing-library/react 16 + vitest-axe (a11y)  
**Target Platform**: Electron 40.x desktop app (also runs in browser via Vite dev server)  
**Project Type**: Desktop app (Electron) with web fallback  
**Performance Goals**: Page interactive < 2s; cart operations < 100ms; search results < 300ms  
**Constraints**: Offline-capable (SQLite local), responsive from 1024×768 to 1920×1080, WCAG 2.1 AA  
**Scale/Scope**: Single store, 1–5 concurrent cashiers, ~1000 products, ~500 daily transactions

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Code Quality | PASS | Single-responsibility components; existing patterns (Zustand store + repo + component) preserved; lint/format enforced |
| II. Testing Standards (NON-NEGOTIABLE) | PASS | New components and store actions must have unit tests; integration tests for hold/recall and return flows; > 80% coverage on new code |
| III. User Experience Consistency | PASS | Existing design system (Tailwind + Radix + lucide-react + Framer Motion) reused; toast notifications via sonner; i18n for all new strings |
| IV. Performance Requirements | PASS | All DB queries via existing indexed repos; cart recalc < 100ms; no new API calls; memoized selectors |
| V. Observability | PASS | Audit logs for voids, refunds, discounts, manager overrides via existing `audit_logs` table |
| Security | PASS | Manager PIN authorization for sensitive actions; PIN stored as bcrypt hash; input validation on all fields |
| Quality Gates | PASS | Tests + lint + format + coverage gates apply to all new code |

**Pre-Phase 0 GATE: PASS** — No violations.

## Project Structure

### Documentation (this feature)

```text
specs/005-pos-rebuild/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
└── tasks.md             # Phase 2 output (created by /speckit.tasks)
```

### Source Code (repository root)

```text
src/
├── components/
│   └── POS/
│       ├── POSLayout.tsx              # NEW — multi-zone layout orchestrator
│       ├── POSHeader.tsx              # NEW — store branding + cashier + live clock
│       ├── ClientInfoPanel.tsx        # NEW — customer info card with search/select/clear
│       ├── ProductDetailCard.tsx      # NEW — last-scanned product preview card
│       ├── NumericKeypad.tsx          # NEW — on-screen 0–9, backspace, C, enter
│       ├── CartTicket.tsx             # NEW — redesigned cart with ticket styling
│       ├── CartTicketRow.tsx          # NEW — line item row with inline discount editing
│       ├── TotalsBar.tsx             # NEW — subtotal, VAT, discount, oversized grand total
│       ├── ActionGrid.tsx            # NEW — 4×3 (or 4×4) shortcut button grid
│       ├── ActionButton.tsx          # NEW — individual action grid button
│       ├── HoldRecallDialog.tsx      # NEW — list held transactions + recall
│       ├── ReturnDialog.tsx          # NEW — sale lookup + item selection for returns
│       ├── ManagerPinDialog.tsx      # NEW — PIN entry modal for sensitive actions
│       ├── DiscountDialog.tsx        # NEW — apply line/cart discount (% or fixed)
│       ├── SplitPaymentPanel.tsx     # NEW — multi-tender payment assignment
│       ├── CartPanel.tsx             # MODIFIED — refactored, delegates to new sub-components
│       ├── CartItemRow.tsx           # MODIFIED — add inline discount display/edit trigger
│       ├── CartSummary.tsx           # REPLACED by TotalsBar.tsx
│       ├── PaymentMethodGrid.tsx     # MODIFIED — integrated into SplitPaymentPanel
│       ├── CustomerSelector.tsx      # REUSED in ClientInfoPanel
│       ├── CheckoutSimulation.tsx    # EXISTING
│       ├── ReceiptPreview.tsx        # MODIFIED — add ticket number, split payment display
│       ├── QuickAccess.tsx           # EXISTING (moved to left panel or merged)
│       ├── QuickAccessManager.tsx    # EXISTING
│       ├── ProductGrid.tsx           # EXISTING (used in search results)
│       ├── StockErrorDialog.tsx      # EXISTING
│       ├── EmptyCartDialog.tsx       # EXISTING
│       ├── ActivePromotionsBanner.tsx # EXISTING
│       └── InventoryPreview.tsx      # EXISTING
├── pages/
│   └── POS.tsx                       # MODIFIED — delegates to POSLayout
├── stores/
│   ├── useSaleStore.ts               # MODIFIED — add hold/recall, return actions, split payment, cart-level discount
│   └── usePOSStore.ts                # NEW — UI state: selected product, keypad value, held transactions, return mode
├── hooks/
│   ├── useManagerAuth.ts             # NEW — manager PIN verification hook
│   ├── useTicketNumber.ts            # NEW — daily-reset ticket number generator
│   ├── useKeyboardShortcuts.ts       # NEW — F1–F12 + Enter/Escape/arrows for POS
│   └── useLiveClock.ts              # NEW — real-time clock for header
├── services/
│   └── promotionEngine.ts            # EXISTING — auto promotion calculation
└── lib/
    └── types.ts                      # MODIFIED — add HeldTransaction, ReturnRequest, PaymentEntry, etc.

database/
├── schema.ts                         # MODIFIED — add ticket_number column to sales, add daily_ticket_counters table
└── repositories/
    ├── sale.repo.ts                  # MODIFIED — add partial refund, ticket number logic, split payment storage
    └── user.repo.ts                  # MODIFIED — add verifyManagerPin(pin) method
```

**Structure Decision**: Single-project frontend architecture (existing pattern). All new POS components live under `src/components/POS/`. New stores and hooks are co-located with existing ones. Database changes are additive (new columns + table). No new projects or services introduced.

## Complexity Tracking

No constitution violations — no complexity justifications needed.
