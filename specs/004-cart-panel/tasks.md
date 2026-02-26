# Tasks: Cart Panel Redesign

**Input**: Design documents from `/specs/004-cart-panel/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/components.md, quickstart.md

**Tests**: Included per constitution mandate (Section II: Testing Standards — TDD required).

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup

**Purpose**: No new project initialization needed — this feature adds components to an existing codebase. Setup phase ensures the placeholder from the deleted CartPanel is ready for replacement.

- [x] T001 Verify existing placeholder div in `src/pages/POS.tsx` is present and POS page renders without errors
- [x] T002 [P] Add i18n translation keys for cart panel strings (header, empty state, payment labels, buttons) in `src/i18n/locales/`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Sub-components that are shared across multiple user stories. These must be complete before any user story can be fully wired.

**⚠️ CRITICAL**: No user story integration can begin until this phase is complete

- [x] T003 [P] Create `CartItemRow` component skeleton with props interface in `src/components/POS/CartItemRow.tsx` — display product name (truncated), unit price, quantity with +/− buttons, line total, remove button; wrap with `React.memo`; follow contracts/components.md `CartItemRowProps` interface
- [x] T004 [P] Create `CartSummary` component in `src/components/POS/CartSummary.tsx` — display subtotal always, savings line conditionally (only when savings > 0), dashed border separator; follow contracts/components.md `CartSummaryProps` interface
- [x] T005 [P] Create `PaymentMethodGrid` component in `src/components/POS/PaymentMethodGrid.tsx` — 2×2 CSS grid with icon + label pill buttons (Cash/Banknote, E-Pay/Smartphone, Card/CreditCard, Credit/Wallet), selected/unselected states, all labels i18n; follow contracts/components.md `PaymentMethodGridProps` interface
- [x] T006 Create `CartPanel` orchestrator component skeleton in `src/components/POS/CartPanel.tsx` — three-section vertical layout (header, body, footer), import sub-components, accept full `CartPanelProps` interface from contracts/components.md, receipt/ticket-style visual with dashed border separators, `tabIndex={-1}` on root div

**Checkpoint**: All four sub-components exist with correct interfaces. They render in isolation but are not yet wired to POS.tsx.

---

## Phase 3: User Story 1 — View and Manage Cart Items (Priority: P1) 🎯 MVP

**Goal**: Cashier sees all cart items in a scrollable list with product name, price, quantity (+/−), line total, and remove action. Empty state shown when cart is empty.

**Independent Test**: Add products, verify they appear in scrollable list, adjust quantity with +/−, remove items, verify empty state.

### Tests for User Story 1

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [x] T007 [P] [US1] Unit test: CartItemRow renders product name, unit price, quantity, line total in `src/__tests__/CartPanel.test.tsx`
- [x] T008 [P] [US1] Unit test: CartItemRow + button calls onIncrement, − button calls onDecrement, trash calls onRemove in `src/__tests__/CartPanel.test.tsx`
- [x] T009 [P] [US1] Unit test: CartItemRow + button is disabled when `isAtMaxStock` is true in `src/__tests__/CartPanel.test.tsx`
- [x] T010 [P] [US1] Unit test: CartPanel renders empty state message when cart is empty in `src/__tests__/CartPanel.test.tsx`
- [x] T011 [P] [US1] Unit test: CartPanel renders scrollable cart item list when cart has items in `src/__tests__/CartPanel.test.tsx`

### Implementation for User Story 1

- [x] T012 [US1] Implement `CartItemRow` full rendering logic — product name with text truncation (ellipsis), unit price formatted via `formatCurrency`, quantity display, computed line total (`price × qty - discount`), +/− buttons with 32×32px touch targets on right side, remove (trash) button in `src/components/POS/CartItemRow.tsx`
- [x] T013 [US1] Implement cart items list section in `CartPanel` body — scrollable area (`flex-1 overflow-y-auto`) occupying ~80% of body, render `CartItemRow` for each cart item with `React.memo`, build `Map<productId, PromotionResult>` via `useMemo` for O(1) promo lookup, pass `isAtMaxStock` computed from `item.quantity >= item.product.stock_quantity` in `src/components/POS/CartPanel.tsx`
- [x] T014 [US1] Implement empty state in `CartPanel` body — show icon + "No items yet" message when cart array is empty, style consistent with receipt aesthetic in `src/components/POS/CartPanel.tsx`
- [x] T015 [US1] Implement stock limit toast notification — `useEffect` watching `stockError` prop, call `toast.warning()` via sonner when stock error is set, then call `clearStockError()` in `src/components/POS/CartPanel.tsx`
- [x] T016 [US1] Wire `CartPanel` to `POS.tsx` — replace placeholder `<div>` with `<CartPanel>`, pass `cart`, `cartTotal`, `promotionResult`, `addToCart`, `removeFromCart`, `clearCart`, `stockError`, `clearStockError` from `useSaleStore`, pass `selectedCustomer`, `setSelectedCustomer`, `paymentMethod`, `setPaymentMethod`, `handleBeforeCheckout`, `isCheckingOut` from existing local state in `src/pages/POS.tsx`

**Checkpoint**: Cart items display, scroll, quantity adjusts with +/−, items removable, empty state shown, stock limit toast fires. Panel is visible in POS page.

---

## Phase 4: User Story 2 — Complete a Purchase with Payment Method Selection (Priority: P1)

**Goal**: Cashier selects payment method from 2×2 grid and presses always-visible "Complete Purchase" button to finalize the sale.

**Independent Test**: Add items, select each of the 4 payment methods, press complete, verify sale processes.

### Tests for User Story 2

- [x] T017 [P] [US2] Unit test: PaymentMethodGrid renders 4 buttons with correct icons and labels in `src/__tests__/CartPanel.test.tsx`
- [x] T018 [P] [US2] Unit test: PaymentMethodGrid highlights selected method and calls onSelect on click in `src/__tests__/CartPanel.test.tsx`
- [x] T019 [P] [US2] Unit test: CartPanel "Complete Purchase" button is disabled when cart is empty in `src/__tests__/CartPanel.test.tsx`
- [x] T020 [P] [US2] Unit test: CartPanel "Complete Purchase" button is enabled when cart has items and calls handleBeforeCheckout on click in `src/__tests__/CartPanel.test.tsx`

### Implementation for User Story 2

- [x] T021 [US2] Implement `PaymentMethodGrid` full rendering logic — 2×2 `grid-cols-2 gap-2`, each pill with icon (16–18px) + bold label inline, selected state with accent color (`bg-yellow-400 text-black font-black` or similar), unselected `bg-white border border-zinc-200 text-zinc-500`, all labels i18n-aware in `src/components/POS/PaymentMethodGrid.tsx`
- [x] T022 [US2] Implement footer section in `CartPanel` — grand total in large prominent font, `PaymentMethodGrid` with cash as default, "Complete Purchase" button always visible but disabled when `cart.length === 0` or `isCheckingOut`, loading state during checkout in `src/components/POS/CartPanel.tsx`
- [x] T023 [US2] Implement keyboard shortcut: Enter triggers `handleBeforeCheckout` — `onKeyDown` handler on root div, guard for input/textarea focus, only fire when cart is non-empty in `src/components/POS/CartPanel.tsx`

**Checkpoint**: Payment methods selectable via 2×2 grid, cash pre-selected, total displayed large, complete button always present, Enter shortcut works. Full checkout flow functional.

---

## Phase 5: User Story 3 — Search and Select a Customer (Priority: P2)

**Goal**: Cashier searches and selects a customer from the header dropdown. Credit payment requires a customer.

**Independent Test**: Open customer dropdown, type to search, select customer, verify header shows selection, clear selection, attempt credit without customer.

### Tests for User Story 3

- [x] T024 [P] [US3] Unit test: CartPanel header renders `CustomerSelector` component in `src/__tests__/CartPanel.test.tsx`
- [x] T025 [P] [US3] Unit test: CartPanel blocks checkout when payment is "credit" and no customer is selected (calls toast warning) in `src/__tests__/CartPanel.test.tsx`
- [x] T026 [P] [US3] Unit test: CartPanel Escape keyboard shortcut calls `setSelectedCustomer(null)` in `src/__tests__/CartPanel.test.tsx`

### Implementation for User Story 3

- [x] T027 [US3] Wire `CustomerSelector` in CartPanel header section — embed existing `CustomerSelector` component, pass `selectedCustomer` and `setSelectedCustomer` props, style header with receipt-style top section in `src/components/POS/CartPanel.tsx`
- [x] T028 [US3] Implement credit-requires-customer validation — in `handleBeforeCheckout` wrapper or guard, check if `paymentMethod === 'credit'` and `selectedCustomer === null`, show `toast.warning()` prompting customer selection, prevent checkout in `src/components/POS/CartPanel.tsx`
- [x] T029 [US3] Implement keyboard shortcut: Escape clears customer selection — extend `onKeyDown` handler, guard for input/textarea focus, call `setSelectedCustomer(null)` in `src/components/POS/CartPanel.tsx`

**Checkpoint**: Customer search/select works in header, credit blocked without customer, Escape clears selection.

---

## Phase 6: User Story 4 — View Subtotal, Promotional Savings, and Grand Total (Priority: P2)

**Goal**: Financial summary shows subtotal and promotional savings. Per-item promotion badges display on cart rows.

**Independent Test**: Add items with known prices, apply promotion, verify subtotal, savings, and total correct.

### Tests for User Story 4

- [x] T030 [P] [US4] Unit test: CartSummary displays subtotal formatted with `formatCurrency` in `src/__tests__/CartPanel.test.tsx`
- [x] T031 [P] [US4] Unit test: CartSummary displays savings line when savings > 0 and hides it when savings = 0 in `src/__tests__/CartPanel.test.tsx`
- [x] T032 [P] [US4] Unit test: CartItemRow displays promotion discount badge when promotion prop is not null in `src/__tests__/CartPanel.test.tsx`

### Implementation for User Story 4

- [x] T033 [US4] Implement `CartSummary` full rendering logic — subtotal line always shown, savings line with label (e.g., "Promo savings") shown only when `savings > 0`, receipt-style dashed border separator, all values via `formatCurrency` in `src/components/POS/CartSummary.tsx`
- [x] T034 [US4] Wire `CartSummary` in CartPanel body — pinned at bottom of body flex container (~20%), pass `subtotal` (cartTotal), `savings` (promotionResult?.totalSavings ?? 0), `formatCurrency` in `src/components/POS/CartPanel.tsx`
- [x] T035 [US4] Implement promotion badge in `CartItemRow` — small discount label/badge beneath or beside line total showing savings amount (e.g., "−$2.00") when `promotion` prop is not null, hidden when null, styled with accent color in `src/components/POS/CartItemRow.tsx`

**Checkpoint**: Subtotal, savings, and total all display correctly. Per-item promo badges visible. Financial picture complete.

---

## Phase 7: User Story 5 — Clear Entire Cart (Priority: P3)

**Goal**: Cashier can clear all items with a confirmation step.

**Independent Test**: Add items, press clear, confirm dialog appears, confirm clears cart, cancel preserves cart.

### Tests for User Story 5

- [x] T036 [P] [US5] Unit test: CartPanel shows clear cart button when cart has items in `src/__tests__/CartPanel.test.tsx`
- [x] T037 [P] [US5] Unit test: CartPanel clear cart button triggers confirmation dialog (EmptyCartDialog) in `src/__tests__/CartPanel.test.tsx`

### Implementation for User Story 5

- [x] T038 [US5] Implement clear cart action in CartPanel header — add trash/clear icon button visible when cart is non-empty, on click show `EmptyCartDialog` (existing component), on confirm call `clearCart()`, on cancel dismiss in `src/components/POS/CartPanel.tsx`

**Checkpoint**: Clear cart works with confirmation. Panel returns to empty state after clearing.

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [x] T039 [P] Add Framer Motion entrance/exit animations for cart item rows (AnimatePresence + motion.div) in `src/components/POS/CartItemRow.tsx`
- [x] T040 [P] Verify all user-facing strings use `t()` from react-i18next and translations exist for both languages in `src/i18n/locales/`
- [x] T041 Run lint (`npm run lint`) and fix any ESLint/Prettier issues across all new files
- [x] T042 Run test suite (`npm run test:run`) and verify all tests pass with >80% coverage for new files
- [x] T043 Run quickstart.md validation — verify setup instructions, file paths, and architecture match implementation

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Phase 1 (i18n keys). Creates all sub-component skeletons — BLOCKS all user stories
- **User Story 1 (Phase 3)**: Depends on Phase 2 — first story to wire CartPanel into POS.tsx
- **User Story 2 (Phase 4)**: Depends on Phase 2 + Phase 3 T016 (CartPanel wired to POS.tsx)
- **User Story 3 (Phase 5)**: Depends on Phase 2 + Phase 3 T016 (CartPanel wired to POS.tsx)
- **User Story 4 (Phase 6)**: Depends on Phase 2 + Phase 3 T016 (CartPanel wired to POS.tsx)
- **User Story 5 (Phase 7)**: Depends on Phase 2 + Phase 3 T016 (CartPanel wired to POS.tsx)
- **Polish (Phase 8)**: Depends on all user stories being complete

### User Story Dependencies

- **US1 (P1)**: Foundation only — delivers MVP cart display + quantity management
- **US2 (P1)**: Foundation + T016 — delivers checkout capability
- **US3 (P2)**: Foundation + T016 — delivers customer linking (independent of US2, but credit validation references payment method)
- **US4 (P2)**: Foundation + T016 — delivers financial summary (independent, reads existing promotionResult)
- **US5 (P3)**: Foundation + T016 — delivers clear cart (independent, uses existing EmptyCartDialog)

### Within Each User Story

- Tests MUST be written and FAIL before implementation begins
- Sub-component rendering before wiring
- Core logic before edge case handling
- Story complete before moving to next priority

### Parallel Opportunities

- T002 can run in parallel with T001
- T003, T004, T005 can all run in parallel (different files)
- All tests within a phase (T007–T011, T017–T020, etc.) can run in parallel
- After T016 completes, US2/US3/US4/US5 can proceed in parallel
- T039, T040 can run in parallel in Polish phase

---

## Parallel Example: User Story 1

```bash
# Step 1: Launch all tests in parallel (should FAIL):
T007: "Unit test: CartItemRow renders product name, unit price, quantity, line total"
T008: "Unit test: CartItemRow +/−/remove buttons call correct callbacks"
T009: "Unit test: CartItemRow + button disabled when isAtMaxStock"
T010: "Unit test: CartPanel renders empty state when cart empty"
T011: "Unit test: CartPanel renders scrollable cart item list"

# Step 2: Implement CartItemRow (T012) — tests T007, T008, T009 start passing

# Step 3: Implement cart list and empty state in CartPanel (T013, T014) — tests T010, T011 pass

# Step 4: Add stock toast (T15), wire to POS.tsx (T016) — full US1 functional
```

## Parallel Example: User Stories 2–5 (after T016)

```bash
# These can run in parallel once CartPanel is wired to POS.tsx:
US2: T017–T023 (Payment method grid + checkout button)
US3: T024–T029 (Customer selector + credit validation)
US4: T030–T035 (Financial summary + promo badges)
US5: T036–T038 (Clear cart with confirmation)
```

---

## Implementation Strategy

### MVP First (User Stories 1 + 2 Only)

1. Complete Phase 1: Setup (T001–T002)
2. Complete Phase 2: Foundational (T003–T006)
3. Complete Phase 3: User Story 1 — cart items display + quantity management
4. Complete Phase 4: User Story 2 — payment selection + checkout
5. **STOP and VALIDATE**: Full checkout flow works end-to-end
6. Deploy/demo if ready — cashier can view cart, adjust quantities, select payment, complete purchase

### Incremental Delivery

1. Setup + Foundational → Component skeletons ready
2. Add US1 → Cart items visible, scrollable, managed → Test independently
3. Add US2 → Payment + checkout works → Test independently → **MVP complete!**
4. Add US3 → Customer linking + credit validation → Test independently
5. Add US4 → Financial summary + promo badges → Test independently
6. Add US5 → Clear cart with confirmation → Test independently
7. Polish → Animations, i18n verify, lint, coverage
8. Each story adds value without breaking previous stories

---

## Notes

- [P] tasks = different files, no dependencies on incomplete tasks
- [Story] label maps task to specific user story for traceability
- All tests go in single file `src/__tests__/CartPanel.test.tsx` with `describe` blocks per component/story
- No new dependencies — all features use existing libraries
- "E-Pay" maps to `'mobile'` payment method value in the data model
- `CustomerSelector.tsx` is reused as-is, not modified
- `EmptyCartDialog.tsx` is reused as-is for clear-cart confirmation
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
