# Implementation Plan: Cart Panel Redesign

**Branch**: `004-cart-panel` | **Date**: 2026-02-26 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/004-cart-panel/spec.md`

## Summary

Redesign the POS cart panel as a ticket/receipt-style component with three vertical sections: a header with a searchable customer selector, a body split between a scrollable cart items list (~80%) and a financial summary (~20%), and a footer with the grand total, a 2×2 payment method grid (cash, e-pay, card, credit), and an always-visible "Complete Purchase" button. Each cart item row supports inline +/− quantity adjustment with stock-limit enforcement and per-item promotion badges. Keyboard shortcuts (Enter to complete, Escape to deselect customer) improve cashier workflow speed.

## Technical Context

**Language/Version**: TypeScript 5.9.x (React 19.x)
**Primary Dependencies**: React 19, Zustand 5, Framer Motion 12, Radix UI, lucide-react, sonner (toasts), react-i18next, Tailwind CSS 4
**Storage**: sql.js (client-side SQLite) + better-sqlite3 (Electron persistence via IPC)
**Testing**: Vitest 4 + @testing-library/react 16 + jsdom
**Target Platform**: Electron 40 desktop app (Windows primary, cross-platform)
**Project Type**: Desktop POS application (Electron + Vite + React)
**Performance Goals**: <100ms for all cart interactions (add/remove/quantity change), <200ms perceived total update, customer search <1s
**Constraints**: Fixed ~340px panel width, offline-capable (client-side data), must integrate with existing useSaleStore (cart state) and useCustomerStore (customer data)
**Scale/Scope**: Single new component (`CartPanel.tsx`) replacing the deleted previous version, reusing existing `CustomerSelector.tsx`, ~1 page of UI

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Code Quality | PASS | Single-responsibility component decomposition, clear interfaces, lint/format compliant |
| II. Testing Standards | PASS | Unit tests for CartPanel rendering, quantity adjustment, payment selection, keyboard shortcuts; integration tests for checkout flow; >80% coverage target |
| III. User Experience Consistency | PASS | Follows existing POS design patterns: rounded corners, Tailwind utility classes, Framer Motion animations, lucide-react icons, sonner toasts, i18n for all strings |
| IV. Performance Requirements | PASS | All interactions <100ms (local state updates via Zustand); memoized cart item rows to prevent unnecessary re-renders; customer filtering is O(n) in-memory |
| V. Observability | PASS | Toast notifications for stock limits, error states surfaced via existing stockError pattern |
| Security | PASS | No secrets, input validation on quantity (min 0, max stock), credit requires customer |
| Quality Gates | PASS | Tests + lint + coverage included in plan |

**Gate Result: PASS** — No violations. Proceeding to Phase 0.

## Project Structure

### Documentation (this feature)

```text
specs/004-cart-panel/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
src/
├── components/
│   └── POS/
│       ├── CartPanel.tsx          # NEW: Main cart panel component (orchestrator)
│       ├── CartItemRow.tsx        # NEW: Individual cart item row with +/− and promo badge
│       ├── CartSummary.tsx        # NEW: Financial summary (subtotal, savings)
│       ├── PaymentMethodGrid.tsx  # NEW: 2×2 payment method selector
│       ├── CustomerSelector.tsx   # EXISTING: Reused as-is in cart panel header
│       ├── EmptyCartDialog.tsx    # EXISTING: Reused for clear-cart confirmation
│       └── ...                    # Other existing POS components unchanged
├── pages/
│   └── POS.tsx                    # MODIFIED: Wire CartPanel with existing state
├── stores/
│   ├── useSaleStore.ts            # EXISTING: Cart state (add, remove, clear, checkout)
│   └── useCustomerStore.ts        # EXISTING: Customer data (load, search)
└── lib/
    └── types.ts                   # EXISTING: CartItem, Customer, PromotionApplicationResult

src/__tests__/
├── CartPanel.test.tsx             # NEW: Unit/integration tests for cart panel
└── ...

database/
└── __tests__/                     # EXISTING: No changes needed
```

**Structure Decision**: Single-project frontend. All new components live under `src/components/POS/`. The cart panel is decomposed into 4 sub-components (CartPanel, CartItemRow, CartSummary, PaymentMethodGrid) following single-responsibility. Existing stores and types are consumed, not modified.

## Complexity Tracking

No constitution violations — this section is not applicable.
