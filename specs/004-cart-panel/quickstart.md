# Quickstart: Cart Panel Redesign (004)

**Feature**: 004-cart-panel | **Branch**: `004-cart-panel`

## Prerequisites

- Node.js 20.x+
- npm installed
- Repository cloned and on branch `004-cart-panel`

## Setup

```bash
# Install dependencies (if not already)
npm install

# Start development server
npm run dev

# Or start with Electron
npm run electron:dev
```

## Development Workflow

### Files to Create

| File | Purpose |
|------|---------|
| `src/components/POS/CartPanel.tsx` | Main cart panel orchestrator |
| `src/components/POS/CartItemRow.tsx` | Individual cart item row (memo'd) |
| `src/components/POS/CartSummary.tsx` | Financial summary (subtotal/savings) |
| `src/components/POS/PaymentMethodGrid.tsx` | 2×2 payment method selector |
| `src/__tests__/CartPanel.test.tsx` | Unit & integration tests |

### Files to Modify

| File | Change |
|------|--------|
| `src/pages/POS.tsx` | Replace placeholder `<div>` with `<CartPanel>`, pass props from stores |

### Files NOT Modified (consumed as-is)

| File | How Used |
|------|----------|
| `src/components/POS/CustomerSelector.tsx` | Embedded in cart panel header |
| `src/stores/useSaleStore.ts` | Cart state: `cart`, `addToCart`, `removeFromCart`, `clearCart`, `stockError`, `promotionResult` |
| `src/stores/useCustomerStore.ts` | Customer data: `customers`, `loadCustomers`, `searchCustomers` |
| `src/lib/types.ts` | `CartItem`, `Customer`, `PromotionApplicationResult`, `PromotionResult` |

## Running Tests

```bash
# Run all tests
npm test

# Run only cart panel tests
npx vitest run src/__tests__/CartPanel.test.tsx

# Run with coverage
npm run test:coverage
```

## Key Decisions

1. **Component decomposition**: CartPanel → CartItemRow + CartSummary + PaymentMethodGrid (single responsibility)
2. **Memoization**: Each `CartItemRow` is `React.memo`'d; promotion lookups via `useMemo` Map
3. **Keyboard shortcuts**: `onKeyDown` on focused container `<div tabIndex={-1}>`, guarded for input fields
4. **Stock enforcement**: Store is authoritative (fresh DB check); component does presentational disable + toast
5. **Payment grid**: 2×2 CSS grid with icon + label pills; "E-Pay" maps to `'mobile'` value
6. **No new dependencies**: All features use existing libraries (lucide-react, sonner, framer-motion, react-i18next)

## Architecture Notes

```
POS.tsx (orchestrator)
  └── CartPanel
        ├── CustomerSelector (existing, reused)
        ├── CartItemRow[] (scrollable, memoized)
        ├── CartSummary (pinned at bottom of body)
        └── Footer
              ├── Grand Total (large font)
              ├── PaymentMethodGrid (2×2)
              └── Complete Purchase button (always visible)
```

All state lives in Zustand stores (`useSaleStore`, `useCustomerStore`). The cart panel is a pure presentation layer that receives data and callbacks via props.
