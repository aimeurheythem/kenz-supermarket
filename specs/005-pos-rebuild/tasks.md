# Tasks: Professional POS Page Rebuild

**Input**: Design documents from `/specs/005-pos-rebuild/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/component-contracts.md, quickstart.md

**Tests**: Not explicitly requested — test tasks omitted per template rules. Constitution II requires tests alongside implementation (>80% coverage on new code); each task implementor should write accompanying tests.

**Organization**: Tasks are grouped by user story (12 stories from spec.md) to enable independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2...)
- Exact file paths included in all descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: New types, database schema, and store scaffolds that all user stories depend on

- [ ] T001 [P] Add new TypeScript types (PaymentEntry, PaymentEntryInput, ManualDiscount, HeldTransaction, ReturnItem, ReturnRequest, AuthorizationResult, AuthorizableAction, KeypadState) to src/lib/types.ts
- [ ] T002 [P] Update database schema: create payment_entries table, ticket_counter table, add new columns (ticket_number, original_sale_id, return_type, cart_discount_type/value/amount) to sales table, add new columns (manual_discount_type/value/amount) to sale_items table in database/schema.ts
- [ ] T003 [P] Create usePOSStore with typed state (heldTransactions, selectedProduct, keypadValue, keypadMode, returnMode, nextTicketNumber) and stub actions in src/stores/usePOSStore.ts
- [ ] T004 [P] Create useAuthorizationStore with isOpen/action/resolve state and requestAuth/submitPin/cancel actions returning Promise<AuthorizationResult> in src/stores/useAuthorizationStore.ts

**Checkpoint**: All new types compiled, schema migrations applied on next app start, empty stores importable

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Repository methods and store modifications that multiple user stories depend on

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T005 [P] Add verifyManagerPin(pin: string) method that checks all active admin/manager users against bcrypt-hashed pin_code in database/repositories/user.repo.ts
- [ ] T006 [P] Add ticket number methods (getNextTicketNumber peek, atomic incrementAndGet inside checkout transaction) and split payment storage (createFromCartWithSplitPayment with PaymentEntryInput[], getPaymentEntries) to database/repositories/sale.repo.ts
- [ ] T007 Add partial return methods (createPartialReturn with ReturnRequest, getReturnedQuantities returning Map<productId, returnedQty>) to database/repositories/sale.repo.ts

**Checkpoint**: Foundation ready — repo methods callable, store actions functional, user story implementation can begin

---

## Phase 3: User Story 1 — Professional Multi-Zone POS Layout (Priority: P1) 🎯 MVP

**Goal**: Rebuild the POS page into a 3-column CSS Grid layout with header bar, left panel, center panel, and right panel — all zones visible at a glance on 1024×768+ screens.

**Independent Test**: Open POS page on 1024×768+ screen → verify header, left panel (260px), center panel (fluid), and right panel (240px) render in designated positions without overlap or scrolling.

### Implementation for User Story 1

- [ ] T008 [P] [US1] Create useLiveClock hook returning formatted date and time string, updating every second via setInterval in src/hooks/useLiveClock.ts
- [ ] T009 [US1] Create POSHeader component displaying store name (placeholder), cashier name from useAuthStore, and live clock from useLiveClock in src/components/POS/POSHeader.tsx
- [ ] T010 [US1] Create POSLayout component with CSS Grid layout (grid-cols-[260px_1fr_240px] xl:grid-cols-[300px_1fr_280px]), rendering POSHeader at top and empty placeholder panels for left/center/right zones in src/components/POS/POSLayout.tsx
- [ ] T011 [US1] Refactor src/pages/POS.tsx to render POSLayout as the main content, moving existing state management (barcode scanner, search, customer selection) into POSLayout or preserving via props

**Checkpoint**: POS page shows the new 3-column grid layout with header — the shell is ready for content

---

## Phase 4: User Story 2 — Fast Product Entry via Search, Scan, and Keypad (Priority: P1)

**Goal**: Enable product entry via barcode scan, text search, and (later) numeric keypad — all accessible from the main POS view without navigation.

**Independent Test**: Add 10 products using search and barcode scan → verify all appear correctly in the cart with quantities incrementing for duplicates.

### Implementation for User Story 2

- [ ] T012 [US2] Integrate existing search bar (with real-time product dropdown within 300ms) and barcode scanner hook into POSLayout center panel top, wiring product selection to usePOSStore.setSelectedProduct in src/components/POS/POSLayout.tsx

**Checkpoint**: Products can be added via search and scan in the new layout; keypad entry added in US11

---

## Phase 5: User Story 3 — Rich Cart/Ticket Display with Inline Editing (Priority: P1)

**Goal**: Replace the current cart with a professional receipt/ticket-styled display showing line numbers, product name, unit price, quantity (editable), line discount, and line total with smooth animations.

**Independent Test**: Add 5 items → modify quantities via +/- and direct input → remove one item → verify all line totals and cart total update correctly.

### Implementation for User Story 3

- [ ] T013 [P] [US3] Create CartTicketRow component with line number, product name, unit price, quantity controls (+/- stepper and direct input), manual discount display, remove button with exit animation, and onDiscountClick callback in src/components/POS/CartTicketRow.tsx
- [ ] T014 [US3] Create CartTicket component with ticket-styled header (column labels), scrollable AnimatePresence list of CartTicketRow, sticky header row, and ticket number placeholder in src/components/POS/CartTicket.tsx
- [ ] T015 [US3] Integrate CartTicket into POSLayout center panel, replacing existing CartPanel usage, wiring cart state from useSaleStore and promotion results in src/components/POS/POSLayout.tsx

**Checkpoint**: Cart displays as a professional ticket with editable lines and smooth remove animations

---

## Phase 6: User Story 4 — Prominent Totals Bar (Priority: P1)

**Goal**: Show a large, always-visible totals bar at the bottom of the cart with subtotal, VAT, discount (accent color), and an oversized grand total (3× larger than subtotal, readable from 2m away).

**Independent Test**: Add items → verify subtotal, VAT (21%), discount, and grand total update in real time; grand total font is text-5xl/6xl and is the most dominant visual element.

### Implementation for User Story 4

- [ ] T016 [US4] Create TotalsBar component displaying Subtotal, VAT (with configurable % from settings), Discount (accent color, combining promo + manual), and Grand Total (text-5xl xl:text-6xl font-black tabular-nums) with formatCurrency in src/components/POS/TotalsBar.tsx
- [ ] T017 [US4] Add manual discount actions (setItemManualDiscount, clearItemManualDiscount, setCartDiscount, clearCartDiscount) and selectGrandTotal selector to useSaleStore, then integrate TotalsBar into POSLayout center panel bottom (sticky) in src/stores/useSaleStore.ts and src/components/POS/POSLayout.tsx

**Checkpoint**: Totals bar is always visible, grand total is the largest element on screen, all discount types combine correctly

---

## Phase 7: User Story 5 — Client/Customer Info Panel (Priority: P2)

**Goal**: Show customer name, ID, address, phone, email in the left panel — or "Walk-in Customer" when no customer is selected — with search, clear, edit, and add-new actions.

**Independent Test**: Select a customer → verify info displays → complete a sale → verify sale record references customer → clear → verify "Walk-in Customer" shown.

### Implementation for User Story 5

- [ ] T018 [P] [US5] Create ClientInfoPanel component showing customer fields (name, client number, address, phone, email) or "Walk-in Customer" placeholder, with Search/Clear/Edit/Add New action buttons in src/components/POS/ClientInfoPanel.tsx
- [ ] T019 [US5] Integrate ClientInfoPanel into POSLayout left panel top, wiring customer state from existing CustomerSelector logic in src/components/POS/POSLayout.tsx

**Checkpoint**: Customer info panel works in left panel with search, select, and clear

---

## Phase 8: User Story 6 — Selected Product Detail Card (Priority: P2)

**Goal**: Show a detail card for the last-scanned/selected product with image, name, variant, reference, barcode, price, and stock (with low-stock warning).

**Independent Test**: Scan a product → verify detail card shows correct info; scan a low-stock product → verify stock quantity highlighted in warning color.

### Implementation for User Story 6

- [ ] T020 [P] [US6] Create ProductDetailCard component with product image (or placeholder), name, variant info, reference, barcode, selling price, stock quantity (warning color if below reorder_level) in src/components/POS/ProductDetailCard.tsx
- [ ] T021 [US6] Integrate ProductDetailCard into POSLayout left panel below ClientInfoPanel, reading selectedProduct from usePOSStore in src/components/POS/POSLayout.tsx

**Checkpoint**: Product detail card updates on every scan/search selection; low-stock items show visual warning

---

## Phase 9: User Story 7 — Action Shortcuts Grid (Priority: P2)

**Goal**: Provide a 4×3 grid of large shortcut buttons (hold, recall, void, discount, reprint, cash drawer, price check, returns, daily report, settings, end shift, gift card) — all reachable with one tap or F1–F12 keyboard shortcut.

**Independent Test**: Tap each of the 12 buttons → verify correct action triggers or modal opens; press F1–F12 → verify matching action fires.

### Implementation for User Story 7

- [ ] T022 [P] [US7] Create ActionButton component with icon (lucide-react), label, optional F-key badge, variant styling (default/danger/success/warning), disabled state, and optional badge (e.g., "3/5") in src/components/POS/ActionButton.tsx
- [ ] T023 [US7] Create ActionGrid component rendering 4×3 grid of ActionButton instances for all 12 actions per FR-034, with hold count badge, wired to callback props in src/components/POS/ActionGrid.tsx
- [ ] T024 [P] [US7] Create useManagerAuth hook wrapping useAuthorizationStore.requestAuth for component-level authorization calls in src/hooks/useManagerAuth.ts
- [ ] T025 [US7] Create ManagerPinDialog component (Radix Dialog) with 4–6 digit PIN input, loading spinner during verification, error message display, cancel button, calling useAuthorizationStore.submitPin in src/components/POS/ManagerPinDialog.tsx
- [ ] T026 [US7] Create DiscountDialog component (Radix Dialog) with line/cart scope toggle, percentage/fixed mode switch, amount input with validation (max = item total or subtotal), apply and clear buttons, manager PIN trigger if above threshold in src/components/POS/DiscountDialog.tsx
- [ ] T027 [P] [US7] Create useKeyboardShortcuts hook with capture-phase keydown listener for F1–F12 (preventDefault to block browser defaults), mapping to action callbacks via POS_SHORTCUTS config in src/hooks/useKeyboardShortcuts.ts
- [ ] T028 [US7] Integrate ActionGrid into POSLayout right panel, wire useKeyboardShortcuts, render ManagerPinDialog and DiscountDialog as global modals in src/components/POS/POSLayout.tsx

**Checkpoint**: All 12 action buttons visible and functional; F1–F12 keyboard shortcuts fire correct actions; manager PIN prompts for void/discount above threshold

---

## Phase 10: User Story 8 — Hold and Recall Transactions (Priority: P2)

**Goal**: Allow cashiers to park/hold the current cart (max 5), start a new sale, then recall a held sale later — with visual indicator showing hold usage.

**Independent Test**: Hold a cart with 3 items → verify cart clears → start new sale → complete it → recall held sale → verify 3 items restored → hold 5 more → verify 6th is blocked.

### Implementation for User Story 8

- [ ] T029 [US8] Implement holdTransaction (snapshot cart + customer + promos + discount into HeldTransaction[], enforce max 5 per cashierId) and recallTransaction (remove from list, return data, warn if current cart non-empty) in src/stores/usePOSStore.ts
- [ ] T030 [US8] Create HoldRecallDialog component (Radix Dialog) listing held transactions (item count, total, timestamp, customer name) with recall button per row and replace-cart confirmation prompt in src/components/POS/HoldRecallDialog.tsx
- [ ] T031 [US8] Wire Hold (F1) and Recall (F2) action buttons to HoldRecallDialog and usePOSStore actions, update ActionButton badge to show "{count}/5" in src/components/POS/POSLayout.tsx

**Checkpoint**: Hold/recall fully functional with max-5 enforcement and visual indicator; held sales survive navigation within session

---

## Phase 11: User Story 9 — Returns and Refunds (Priority: P2)

**Goal**: Process returns by looking up the original sale, selecting items and quantities to return, requiring manager PIN, creating a refund record, and restocking inventory.

**Independent Test**: Complete a sale → initiate return → select 1 of 3 items → enter manager PIN → verify refund record created, stock restored, return receipt shown.

### Implementation for User Story 9

- [ ] T032 [US9] Create ReturnDialog component (Radix Dialog) with sale lookup (by receipt number/ticket, date, customer name), original sale display with item checkboxes and return-quantity spinners (max = original qty − already returned), prorated refund preview, confirm button in src/components/POS/ReturnDialog.tsx
- [ ] T033 [US9] Add checkoutReturn flow: wire Return (F8) button → ReturnDialog → ManagerPinDialog authorization → useSaleStore.processReturn (calling SaleRepo.createPartialReturn) → success toast + return receipt in src/stores/useSaleStore.ts and src/components/POS/POSLayout.tsx

**Checkpoint**: Full and partial returns work end-to-end with manager authorization, stock restoration, and audit logging

---

## Phase 12: User Story 10 — Ticket Number and Sale Metadata (Priority: P3)

**Goal**: Assign each transaction a unique daily-reset sequential ticket number displayed on the cart and receipt.

**Independent Test**: Complete 3 sales → verify ticket numbers are 001, 002, 003; next day → verify reset to 001.

### Implementation for User Story 10

- [ ] T034 [P] [US10] Create useTicketNumber hook that peeks the next ticket number from SaleRepo.getNextTicketNumber and formats as zero-padded 3-digit string in src/hooks/useTicketNumber.ts
- [ ] T035 [US10] Display ticket number ("Ticket n° 042") in CartTicket header area, refreshing on each checkout completion in src/components/POS/CartTicket.tsx
- [ ] T036 [US10] Add ticket number and formatted sale date to ReceiptPreview as a unique sale reference in src/components/POS/ReceiptPreview.tsx

**Checkpoint**: Every sale gets a sequential ticket number; receipt shows ticket + date reference

---

## Phase 13: User Story 11 — On-Screen Numeric Keypad (Priority: P3)

**Goal**: Provide an on-screen 0–9 keypad with backspace, clear, and confirm for touchscreen terminals to enter product codes.

**Independent Test**: Type a product code via keypad → press confirm → verify product is found and added to cart (or error toast if not found).

### Implementation for User Story 11

- [ ] T037 [US11] Create NumericKeypad component with 0–9 digit buttons in calculator grid layout, backspace (←), clear (C), and confirm (↵) buttons, digit display field showing accumulated value from usePOSStore.keypadValue in src/components/POS/NumericKeypad.tsx
- [ ] T038 [US11] Integrate NumericKeypad into POSLayout left panel below ProductDetailCard, wire confirm action to product code lookup (search by barcode/reference → addToCart or show error toast) in src/components/POS/POSLayout.tsx

**Checkpoint**: Numeric keypad fully functional for product code entry on touchscreen

---

## Phase 14: User Story 12 — Header Bar with Store Branding and Session Info (Priority: P3)

**Goal**: Display the actual store name/logo from settings and live-updating date/time clock in the POS header.

**Independent Test**: Log in → verify header shows correct store name from settings, cashier's full name, and clock updates every minute.

### Implementation for User Story 12

- [ ] T039 [US12] Load store name/logo from app_settings table via settings.repo and display in POSHeader, replacing placeholder in src/components/POS/POSHeader.tsx
- [ ] T040 [US12] Add cashier session metadata (shift start time from cashier_sessions) to POSHeader display in src/components/POS/POSHeader.tsx

**Checkpoint**: Header shows real store branding, live clock, and session context

---

## Phase 15: Polish & Cross-Cutting Concerns

**Purpose**: Split payment feature, i18n, responsive testing, accessibility, and final validation

- [ ] T041 [P] Create SplitPaymentPanel component with sequential multi-tender entry (method selector + amount input), running remaining-balance display, entry remove buttons, and finalize button (blocked until remaining ≤ 0) in src/components/POS/SplitPaymentPanel.tsx
- [ ] T042 Integrate SplitPaymentPanel into checkout flow: show when payment method = 'split', wire to useSaleStore.checkoutWithSplitPayment in src/components/POS/POSLayout.tsx
- [ ] T043 Update ReceiptPreview to display split payment method breakdown (each method + amount) when sale.payment_method = 'split' in src/components/POS/ReceiptPreview.tsx
- [ ] T044 [P] Add i18n translation keys for all new POS components (button labels, dialog titles, error messages, totals labels) in src/i18n/locales/en.json, src/i18n/locales/ar.json, and src/i18n/locales/fr.json
- [ ] T045 Test and adjust responsive layout for 1024×768, 1366×768, and 1920×1080 breakpoints — ensure cart and totals are always visible, zones stack on smaller screens in src/components/POS/POSLayout.tsx
- [ ] T046 Accessibility pass: add ARIA labels to all action buttons, manage focus for modal dialogs (ManagerPinDialog, HoldRecallDialog, ReturnDialog, DiscountDialog), ensure keyboard navigation across all new POS components
- [ ] T047 Run quickstart.md validation scenarios end-to-end (5-item sale < 45s, hold/recall, return, split payment, all 3 product entry methods)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately. All 4 tasks are [P] parallel.
- **Foundational (Phase 2)**: Depends on Setup completion — BLOCKS all user stories.
  - T005 [P] and T006 [P] can run in parallel (different repo files).
  - T007 depends on T006 (same file: sale.repo.ts).
- **User Stories (Phase 3+)**: All depend on Foundational phase completion.
  - US1 (Layout) must complete first — it creates POSLayout that all other stories extend.
  - After US1: US2, US3, US5, US6, US7, US11, US12 can proceed in parallel.
  - US4 (Totals) depends on US3 (cart must exist to place totals below).
  - US8 (Hold/Recall) depends on US7 (action grid) + US3 (cart).
  - US9 (Returns) depends on US7 (return button) + US3 (cart).
  - US10 (Ticket) depends on US3 (CartTicket header).
- **Polish (Phase 15)**: Depends on all desired user stories being complete.

### User Story Dependencies

```
Phase 2 (Foundational)
  └─► Phase 3 (US1: Layout) ← GATEWAY
        ├─► Phase 4 (US2: Product Entry)
        │     └─► Phase 8 (US6: Product Detail)  [needs product selection events]
        ├─► Phase 5 (US3: Cart/Ticket)
        │     ├─► Phase 6 (US4: Totals Bar)
        │     └─► Phase 12 (US10: Ticket Numbers)
        ├─► Phase 7 (US5: Client Panel)
        ├─► Phase 9 (US7: Action Grid)
        │     ├─► Phase 10 (US8: Hold/Recall)
        │     └─► Phase 11 (US9: Returns)
        ├─► Phase 13 (US11: Keypad)
        └─► Phase 14 (US12: Header)
```

### Within Each User Story

- Component creation before integration into POSLayout
- Store modifications before component wiring
- Core implementation before polish

### Parallel Opportunities

**Phase 1** (all 4 tasks parallel — all new files):
```
T001 ─┐
T002 ─┤  All parallel (different files)
T003 ─┤
T004 ─┘
```

**Phase 2** (2 parallel groups):
```
T005 (user.repo.ts) ─┐
T006 (sale.repo.ts) ─┤  Parallel (different files)
                      └─► T007 (sale.repo.ts, depends on T006)
```

**After US1 completes** (many stories can start in parallel):
```
US2 (Product Entry) ─┐
US3 (Cart/Ticket)   ─┤
US5 (Client Panel)  ─┤  All parallel on different component files
US7 (Action Grid)   ─┤
US11 (Keypad)       ─┤
US12 (Header)       ─┘
```

**Within US7** (3 parallel groups):
```
T022 (ActionButton.tsx) ─┐
T024 (useManagerAuth.ts)─┤  Parallel (new files)
T027 (useKeyboardShortcuts.ts)─┘
  └─► T023 (ActionGrid) ─► T025 (ManagerPinDialog) ─► T026 (DiscountDialog) ─► T028 (Integration)
```

---

## Implementation Strategy

### MVP First (User Stories 1–4 Only)

1. Complete Phase 1: Setup (types + schema + stores)
2. Complete Phase 2: Foundational (repo methods + store modifications)
3. Complete Phase 3: US1 Layout → **STOP & VALIDATE**: 3-column grid renders correctly
4. Complete Phase 4: US2 Product Entry → Products addable via search/scan
5. Complete Phase 5: US3 Cart/Ticket → Professional cart display working
6. Complete Phase 6: US4 Totals Bar → Oversized totals visible
7. **MVP COMPLETE**: Professional layout with search, cart, and totals — deploy/demo

### Incremental Delivery

1. **MVP** (US1–US4): Layout + Product Entry + Cart + Totals → Core POS usable
2. **+Customer** (US5): Client info panel → Sales tied to customers
3. **+Product Detail** (US6): Detail card → Visual product confirmation
4. **+Actions** (US7): Action grid + keyboard shortcuts → Professional workflow
5. **+Hold/Recall** (US8): Transaction parking → Multi-customer handling
6. **+Returns** (US9): Refund processing → Full POS capability
7. **+Ticket Numbers** (US10): Sale references → Audit trail
8. **+Keypad** (US11): Touchscreen support → Hardware-independent
9. **+Header** (US12): Branding → Professional appearance
10. **+Polish** (Phase 15): Split payment + i18n + responsive + a11y → Production-ready

### Parallel Team Strategy

With 2–3 developers after Foundational + US1:

| Developer A | Developer B | Developer C |
|-------------|-------------|-------------|
| US3 (Cart) | US7 (Action Grid) | US5 (Client Panel) |
| US4 (Totals) | US8 (Hold/Recall) | US6 (Product Detail) |
| US10 (Tickets) | US9 (Returns) | US11 (Keypad) + US12 (Header) |
| Polish | Polish | Polish |

---

## Notes

- [P] tasks = different files, no dependencies on incomplete tasks
- [Story] label maps task to specific user story for traceability
- Each user story is independently completable and testable after Foundational + US1
- POSLayout.tsx is the main integration point — most stories add to it
- Commit after each task or logical group
- Stop at any checkpoint to demo/validate independently
- Constitution II requires tests alongside implementation (>80% coverage on new code) — write unit tests as part of each task
- Avoid editing the same file in parallel across different stories
