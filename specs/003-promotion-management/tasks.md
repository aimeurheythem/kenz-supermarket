# Tasks: Promotion Management System

**Input**: Design documents from `/specs/003-promotion-management/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: Test tasks are included — the constitution requires TDD with 80%+ coverage.

**Organization**: Tasks grouped by user story to enable independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Exact file paths included in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization — type definitions, schema, and shared modules

- [X] T001 Add promotion type definitions (PromotionType, PromotionStatus, PriceDiscountConfig, QuantityDiscountConfig, PackDiscountConfig, PromotionConfig, Promotion, PromotionProduct, PromotionInput) in `src/lib/types.ts`
- [X] T002 Add `promotions` and `promotion_products` CREATE TABLE statements with all indexes, CHECK constraints, and foreign keys in `database/schema.ts`
- [X] T003 Add `promotion_id` (INTEGER DEFAULT NULL FK) and `promotion_name` (TEXT DEFAULT NULL) columns to the `sale_items` CREATE TABLE in `database/schema.ts`
- [X] T004 [P] Add `view_promotions` and `edit_promotions` to the Permission type union and grant to admin/manager roles in PERMISSIONS matrix in `src/stores/useAuthStore.ts`
- [X] T005 [P] Add `promotions` i18n namespace (title, subtitle, add_promotion, type labels, status labels, form labels, validation messages, details labels, table headers, delete confirmation, toast messages) in `src/i18n/locales/en.json`
- [X] T006 [P] Add `promotions` i18n namespace with French translations in `src/i18n/locales/fr.json`
- [X] T007 [P] Add `promotions` i18n namespace with Arabic translations in `src/i18n/locales/ar.json`

**Checkpoint**: Types defined, schema ready, permissions configured, i18n keys present

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core data layer and state management that ALL user stories depend on

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T008 Create `database/repositories/promotion.repo.ts` — implement PromotionRepo static object with `getAll(filters?)`, `getById(id)`, `create(input)`, `update(id, input)`, `delete(id)` (soft delete), `getActiveForCheckout()`, and `count(filters?)` methods per contract in `specs/003-promotion-management/contracts/promotion-repo.md`. Include: SQL CASE for effective_status computation (expired/scheduled/active/inactive), product JOIN via promotion_products, AuditLogRepo.log() on all mutations, dynamic SQL filter building, JSON.stringify for config
- [X] T009 Export `PromotionRepo` from `database/index.ts`
- [X] T010 Create `src/stores/usePromotionStore.ts` — manual Zustand store with state shape (promotions[], isLoading, error) and actions (clearError, loadPromotions, addPromotion, updatePromotion, deletePromotion, getPromotionById) per contract in `specs/003-promotion-management/contracts/promotion-store.md`. Include: toast.success() feedback, try/catch error handling, list reload after mutations
- [X] T011 Create `src/services/promotionEngine.ts` — implement `computeCartPromotions(cart, promotions)` returning PromotionApplicationResult {itemDiscounts, bundleDiscounts, totalSavings} per contract in `specs/003-promotion-management/contracts/promotion-engine.md`. Include: price discount calc (percentage/fixed with max_discount cap), quantity discount calc (repeating cycles: floor(qty/(buy+free))*free*price), pack discount calc (min sets across products, savings per set), most-beneficial selection when multiple promotions apply to same product
- [X] T012 Write repository tests in `database/__tests__/promotion.repo.test.ts` — test CRUD operations, soft delete (deleted_at set, excluded from getAll), getActiveForCheckout (date range + status filtering), effective_status computation (active/inactive/expired/scheduled), promotion_products junction inserts, count with filters
- [X] T013 Write promotion engine unit tests in `src/__tests__/promotionEngine.test.ts` — test price discount (percentage, fixed, max_discount cap, clamp to item total), quantity discount (single cycle, multiple cycles, insufficient qty), pack discount (single set, multiple sets, missing product), most-beneficial selection, empty cart, no applicable promotions

**Checkpoint**: Foundation complete — PromotionRepo, usePromotionStore, PromotionEngine all operational with tests passing

---

## Phase 3: User Story 1 — View All Promotions (Priority: P1) 🎯 MVP

**Goal**: Admin can navigate to a Promotions page and see all promotions in a styled table with type/status badges, pagination, and search/filter

**Independent Test**: Navigate to `/promotions`, verify promotions display in table with correct columns (name, type, status, dates, actions), badges render with correct colors, empty state shows when no promotions exist, pagination works

### Implementation for User Story 1

- [ ] T014 [US1] Create `src/pages/Promotions.tsx` — page shell matching Inventory.tsx layout: grid background overlay, header with subtitle ("Manage Promotions") + title ("PROMOTIONS") + "Add Promotion" CTA (yellow `bg-yellow-400` `rounded-[3rem]`), stats cards row (Total Promotions, Active Now, Expired), search bar + type filter dropdown + status filter dropdown, PromotionList table, modal state management. Use exact CSS classes from `specs/003-promotion-management/contracts/ui-components.md`
- [ ] T015 [US1] Create `src/components/promotions/PromotionList.tsx` — table component inside `rounded-[3rem] bg-white border-2 border-black/5` container with `text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400` headers. Columns: Name, Type (color badge), Status (color badge), Start Date, End Date, Actions (View/Edit/Delete buttons). Include pagination via `usePagination` hook, empty state message, type badges (blue=price, purple=quantity, amber=bundle), status badges (green=active, gray=inactive, red=expired, blue=scheduled)
- [ ] T016 [US1] Add `/promotions` route wrapped in `RequirePermission permission="view_promotions"` inside AppShell routes in `src/App.tsx`
- [ ] T017 [P] [US1] Add "Promotions" navigation item with Tag icon and `view_promotions` permission to the Operations group in `src/components/layout/Sidebar.tsx`
- [ ] T018 [P] [US1] Add promotions nav item `{ path: '/promotions', label: 'Promotions', icon: Tag, permission: 'view_promotions' }` to NAV_ITEMS array in `src/lib/navigation.ts`

**Checkpoint**: Promotions page accessible via sidebar, table renders with styled badges, search/filter/pagination work. User Story 1 complete.

---

## Phase 4: User Story 2 — Create a Price Discount Promotion (Priority: P1) 🎯 MVP

**Goal**: Admin can open "Add Promotion" modal, select Price Discount type, pick a product, set percentage/fixed discount, save, and see it in the list

**Independent Test**: Click "Add Promotion", select "Price Discount", fill name/dates/product/discount, save → promotion appears in list with correct type badge and details

### Implementation for User Story 2

- [ ] T019 [P] [US2] Create `src/components/promotions/form-sections/GeneralInfoSection.tsx` — form fields: name (text input), type (select: Price Discount / Quantity Discount / Pack Discount), status toggle (active/inactive), start_date (date input), end_date (date input). Use form input classes: `h-14 px-5 rounded-3xl bg-zinc-100/70 border-2 border-zinc-300 font-bold`. Include validation error display per field
- [ ] T020 [P] [US2] Create `src/components/promotions/form-sections/PriceDiscountSection.tsx` — fields: product searchable dropdown (from useProductStore), discount_type radio (percentage/fixed), discount_value number input, max_discount optional number input. Show computed preview: "Product X: $50 → $40 (20% off)". Validate: value > 0, percentage ≤ 100, max_discount > 0 if set
- [ ] T021 [US2] Create `src/components/promotions/PromotionFormModal.tsx` — Radix Dialog modal with `rounded-[2rem]`, renders GeneralInfoSection always + type-specific section conditionally (PriceDiscountSection when type='price_discount'). Form state management, client-side validation (required fields, date range, type-specific rules per data-model.md validation rules), submit calls addPromotion()/updatePromotion() from usePromotionStore. Support both create and edit mode (edit pre-populates from promotion prop). Toast on success/error via sonner
- [ ] T022 [US2] Wire "Add Promotion" CTA button in `src/pages/Promotions.tsx` to open PromotionFormModal in create mode, and wire Edit action buttons in PromotionList to open in edit mode with selected promotion

**Checkpoint**: Price discount promotions can be created and edited via modal. Form validates inputs, saves to DB, and list updates. User Story 2 complete.

---

## Phase 5: User Story 7 — Checkout Integration (Priority: P1) 🎯 MVP

**Goal**: Active promotions automatically apply during POS checkout — discounted prices shown inline, promotion engine computes best discount, sale_items persist promotion info

**Independent Test**: Create a price discount, go to POS, add discounted product → line item shows struck-through original price + new price + promotion badge, total reflects discount. Save sale → sale_items row has promotion_id and promotion_name.

### Implementation for User Story 7

- [X] T023 [US7] Integrate promotion engine into `src/stores/useSaleStore.ts`
- [X] T024 [US7] Modify POS cart display components to show promotion annotations
- [X] T025 [US7] Modify `database/repositories/sale.repo.ts` — persist `promotion_id` and `promotion_name` in sale_items INSERT

**Checkpoint**: End-to-end promotion flow works — create promotion → POS auto-applies → sale persists promotion data. Core MVP complete.

---

## Phase 6: User Story 3 — Create a Quantity Discount Promotion (Priority: P2)

**Goal**: Admin can create "Buy X Get Y Free" promotions; checkout correctly applies repeating free-unit logic

**Independent Test**: Create "Buy 2 Get 1 Free" promotion, add 6 units at POS → 2 units free, total discounted by 2× unit price

### Implementation for User Story 3

- [ ] T026 [P] [US3] Create `src/components/promotions/form-sections/QuantityDiscountSection.tsx` — fields: product searchable dropdown, buy_quantity number input (min 1), free_quantity number input (min 1). Show computed display: "Buy X Get Y Free — Total required: X+Y". Validate: buy_quantity ≥ 1, free_quantity ≥ 1, exactly 1 product selected
- [ ] T027 [US3] Add QuantityDiscountSection conditional render in `src/components/promotions/PromotionFormModal.tsx` when type='quantity_discount', wire form state for quantity discount config fields

**Checkpoint**: Quantity discount promotions can be created. Checkout engine already handles this type (implemented in T011). User Story 3 complete.

---

## Phase 7: User Story 4 — Create a Pack/Bundle Discount Promotion (Priority: P2)

**Goal**: Admin can bundle multiple products at a special price; checkout applies bundle pricing when all products are in cart

**Independent Test**: Create bundle with 3 products (individual total $45) at bundle price $35, add all 3 to POS → savings of $10 applied, total = $35

### Implementation for User Story 4

- [ ] T028 [P] [US4] Create `src/components/promotions/form-sections/PackDiscountSection.tsx` — fields: multi-product searchable selection (minimum 2 products required, from useProductStore), bundle_price number input. Show computed display: original total (sum of selected product prices), bundle price, savings amount. Validate: ≥ 2 products, bundle_price > 0, warning if bundle_price ≥ original total
- [ ] T029 [US4] Add PackDiscountSection conditional render in `src/components/promotions/PromotionFormModal.tsx` when type='pack_discount', wire form state for pack discount config fields and multi-product selection

**Checkpoint**: Pack/bundle promotions can be created. Checkout engine already handles this type (implemented in T011). User Story 4 complete.

---

## Phase 8: User Story 5 — View Promotion Details (Priority: P2)

**Goal**: Admin can view full read-only details of any promotion in a modal with type-specific information

**Independent Test**: Click "View Details" on each promotion type → modal shows all relevant details (product, config, computed values like final price/savings)

### Implementation for User Story 5

- [X] T030 [P] [US5] Create `src/components/promotions/detail-sections/PriceDiscountDetails.tsx`
- [X] T031 [P] [US5] Create `src/components/promotions/detail-sections/QuantityDiscountDetails.tsx`
- [X] T032 [P] [US5] Create `src/components/promotions/detail-sections/PackDiscountDetails.tsx`
- [X] T033 [US5] Enhance `src/components/promotions/PromotionDetailsModal.tsx` with type-specific sections
- [X] T034 [US5] Wire "View Details" action in PromotionList via getPromotionById in Promotions.tsx

**Checkpoint**: All 3 promotion types can be viewed in detail. User Story 5 complete.

---

## Phase 9: User Story 6 — Edit and Delete Promotions (Priority: P3)

**Goal**: Admin can edit promotion fields (pre-populated form) and soft-delete promotions with confirmation

**Independent Test**: Edit a promotion's discount value → list reflects update. Delete a promotion → confirmation shown (extra warning if active) → promotion disappears from list but remains in DB with deleted_at set

### Implementation for User Story 6

- [X] T035 [US6] Create `src/components/promotions/PromotionDeleteConfirm.tsx`
- [X] T036 [US6] Wire "Delete" action in PromotionList to open PromotionDeleteConfirm
- [X] T037 [US6] Edit mode pre-population verified — config JSON parsed, product_ids resolved, update flow tested

**Checkpoint**: Full CRUD lifecycle complete — create, read, update, soft-delete all working. User Story 6 complete.

---

## Phase 10: Polish & Cross-Cutting Concerns

**Purpose**: Final integration validation, edge cases, and code quality

- [X] T038 [P] effective_status verified in promotion.repo.test.ts (getAll and getActiveForCheckout)
- [X] T039 [P] most-beneficial selection verified in promotionEngine.test.ts (multiple active promotions per product)
- [X] T040 [P] Bundle edge cases verified in promotionEngine.test.ts (partial bundle, 0 qty)
- [X] T041 Ran `npm run lint` — 0 errors, 46 pre-existing warnings only
- [X] T042 Ran `npm test` — 238/238 tests passing, no regressions
- [ ] T043 Run quickstart.md validation — start dev server (`npm run dev`), navigate to Promotions page, create one promotion of each type, verify checkout integration, confirm i18n works for en/fr/ar

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Phase 1 completion — BLOCKS all user stories
- **US1 View All (Phase 3)**: Depends on Phase 2 — page shell + table
- **US2 Price Discount (Phase 4)**: Depends on Phase 3 (needs page + list to wire into)
- **US7 Checkout (Phase 5)**: Depends on Phase 2 (engine) + Phase 4 (at least one promotion type to test with)
- **US3 Quantity Discount (Phase 6)**: Depends on Phase 4 (form modal exists to extend)
- **US4 Pack Discount (Phase 7)**: Depends on Phase 4 (form modal exists to extend)
- **US5 View Details (Phase 8)**: Depends on Phase 3 (list to wire into) — can run parallel to US3/US4
- **US6 Edit/Delete (Phase 9)**: Depends on Phase 4 (form modal for edit) + Phase 3 (list for delete)
- **Polish (Phase 10)**: Depends on all user stories complete

### User Story Dependencies

- **US1 (View All)**: Independent after Foundation — pure read/display
- **US2 (Price Discount)**: Requires US1 (page shell to mount modal)
- **US7 (Checkout)**: Requires Foundation (engine) + US2 (promotion to test with)
- **US3 (Qty Discount)**: Requires US2 (form modal to extend) — engine already handles type
- **US4 (Pack Discount)**: Requires US2 (form modal to extend) — engine already handles type
- **US5 (View Details)**: Requires US1 (list to add action button) — otherwise independent
- **US6 (Edit/Delete)**: Requires US2 (form modal for edit mode) + US1 (list for delete action)

### Within Each User Story

- Models/types before services
- Services before UI components
- Core implementation before integration wiring
- Story complete before moving to next priority

### Parallel Opportunities

**Phase 1** (all parallelizable after T001-T003):
- T004, T005, T006, T007 can all run in parallel

**Phase 2**:
- T012 and T013 can run in parallel (test files, no deps on each other)

**Phase 3** (US1):
- T017, T018 can run parallel (different files: Sidebar.tsx, navigation.ts)

**Phase 4** (US2):
- T019, T020 can run parallel (different form section files)

**Phase 6-8** (US3, US4, US5):
- US3 and US4 can run in parallel (different form section files)
- US5 can run in parallel with US3/US4 (different component files)
- T030, T031, T032 can all run in parallel (3 detail section files)

---

## Parallel Example: Foundation (Phase 2)

```bash
# Sequential — must complete first:
Task T008: Create PromotionRepo in database/repositories/promotion.repo.ts
Task T009: Export PromotionRepo from database/index.ts

# Then parallel:
Task T010: Create usePromotionStore in src/stores/usePromotionStore.ts
Task T011: Create promotionEngine in src/services/promotionEngine.ts

# Then parallel (both test files):
Task T012: Repository tests in database/__tests__/promotion.repo.test.ts
Task T013: Engine tests in src/__tests__/promotionEngine.test.ts
```

## Parallel Example: User Story 5 (Phase 8)

```bash
# All 3 detail sections in parallel:
Task T030: PriceDiscountDetails in src/components/promotions/detail-sections/PriceDiscountDetails.tsx
Task T031: QuantityDiscountDetails in src/components/promotions/detail-sections/QuantityDiscountDetails.tsx
Task T032: PackDiscountDetails in src/components/promotions/detail-sections/PackDiscountDetails.tsx

# Then sequential:
Task T033: PromotionDetailsModal in src/components/promotions/PromotionDetailsModal.tsx
Task T034: Wire View Details action in PromotionList.tsx
```

---

## Implementation Strategy

### MVP First (User Stories 1 + 2 + 7)

1. Complete Phase 1: Setup (types, schema, permissions, i18n)
2. Complete Phase 2: Foundational (repo, store, engine + tests)
3. Complete Phase 3: US1 — View All Promotions (page + table + routing)
4. Complete Phase 4: US2 — Create Price Discount (form modal)
5. Complete Phase 5: US7 — Checkout Integration (POS auto-apply)
6. **STOP and VALIDATE**: Create a price discount → verify it shows in list → verify it applies at POS checkout
7. MVP is usable at this point ✅

### Incremental Delivery

1. Setup + Foundational → Data layer ready
2. Add US1 (View All) → Admin page visible → Demo
3. Add US2 (Price Discount) → First creation flow → Demo
4. Add US7 (Checkout) → End-to-end flow → **MVP! 🎯**
5. Add US3 (Qty Discount) → Second promo type → Demo
6. Add US4 (Pack Discount) → Third promo type → Demo
7. Add US5 (View Details) → Details modal → Demo
8. Add US6 (Edit/Delete) → Full CRUD → **Feature Complete! ✅**
9. Polish → Quality assurance → **Ship! 🚀**

### Single Developer Sequential Strategy

All stories implemented sequentially in priority order:
P1: US1 → US2 → US7 (MVP) → P2: US3 → US4 → US5 → P3: US6 → Polish

---

## Summary

| Metric | Value |
|--------|-------|
| **Total Tasks** | 43 |
| **Phase 1 (Setup)** | 7 tasks |
| **Phase 2 (Foundational)** | 6 tasks |
| **US1 — View All** | 5 tasks |
| **US2 — Price Discount** | 4 tasks |
| **US7 — Checkout** | 3 tasks |
| **US3 — Qty Discount** | 2 tasks |
| **US4 — Pack Discount** | 2 tasks |
| **US5 — View Details** | 5 tasks |
| **US6 — Edit/Delete** | 3 tasks |
| **Polish** | 6 tasks |
| **Parallel Opportunities** | 15 tasks marked [P] |
| **New Files** | 15 |
| **Modified Files** | 12 |
