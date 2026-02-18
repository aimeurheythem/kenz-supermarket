# SuperMarket Pro — Production Roadmap

> **Goal:** Transform the app from alpha state (4/10) to a fully functional, secure, consistent, production-ready supermarket management system (9/10).
>
> **Estimated Phases:** 6 phases | **Priority:** P0 = Critical/Blocking, P1 = High, P2 = Medium, P3 = Low

---

## Phase 1 — Security Hardening (P0)

> **Why first:** The app currently stores passwords with a trivially reversible hash and leaks credentials to the frontend. Nothing else matters until this is fixed.

### 1.1 Replace Password Hashing

- [ ] Remove `simpleHash()` from `database/repositories/user.repo.ts`
- [ ] Install `bcryptjs` (pure JS, works in both Electron and browser contexts)
- [ ] Create `hashPassword(password: string): Promise<string>` using `bcrypt.hash(password, 12)`
- [ ] Create `verifyPassword(password: string, hash: string): Promise<boolean>` using `bcrypt.compare()`
- [ ] Update `UserRepo.create()` to use `hashPassword()`
- [ ] Update `UserRepo.authenticate()` to use `verifyPassword()`
- [ ] Update `UserRepo.updatePassword()` to use `hashPassword()`
- [ ] Write a one-time migration: on app start, detect `sh_` prefix hashes and prompt the admin to reset all passwords (or auto-rehash if old passwords are still in session)

### 1.2 Hash PIN Codes

- [ ] Store PINs as bcrypt hashes instead of plaintext
- [ ] Update `UserRepo.create()` to hash PIN on creation
- [ ] Update `UserRepo.authenticateWithPin()` to use `bcrypt.compare()`
- [ ] Update `UserRepo.update()` to hash new PIN if provided
- [ ] Write migration for existing plaintext PINs (re-hash on next login)

### 1.3 Stop Leaking Credentials to Frontend

- [ ] Change `UserRepo.getAll()` from `SELECT *` to explicit column list excluding `password_hash` and `pin_code`
- [ ] Change `UserRepo.getById()` to exclude `password_hash` and `pin_code`
- [ ] Change `UserRepo.authenticate()` to return user object without `password_hash` and `pin_code`
- [ ] Change `UserRepo.authenticateWithPin()` to return user object without sensitive fields
- [ ] Change `UserRepo.getByUsername()` — only include `password_hash` internally for verification, strip before returning
- [ ] Change `UserRepo.getActiveCashiers()` to exclude sensitive fields
- [ ] Audit every repo method that returns user objects and ensure no credential leakage

### 1.4 Strengthen Password Policy

- [ ] Set minimum password length to 8 characters (currently 4 in `Onboarding.tsx`)
- [ ] Add password strength requirements: at least 1 uppercase, 1 lowercase, 1 digit
- [ ] Create shared `validatePassword(password: string): { valid: boolean; message: string }` utility
- [ ] Apply validation in `Onboarding.tsx`, `Settings.tsx` (change password), and `Users.tsx` (create/edit user)

### 1.5 Protect Destructive Operations

- [ ] Remove inline raw SQL `DROP TABLE` from `Settings.tsx` account deletion
- [ ] Create a proper `resetAllData()` function in the database layer wrapped in a transaction
- [ ] Require password re-entry before account/data deletion (not just browser `confirm()`)
- [ ] Add audit log entry before data wipe

### 1.6 Restore Focus Outlines for Accessibility

- [ ] Remove `*:focus { outline: none !important }` and `*:focus-visible { outline: none !important }` from `src/styles/globals.css`
- [ ] Add proper focus-visible styles: `*:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }`
- [ ] Test keyboard navigation across all pages

---

## Phase 2 — Data Integrity & Reliability (P0)

> **Why:** Race conditions in the data layer can cause lost stock updates, incorrect debt balances, and corrupted purchase orders.

### 2.1 Fix Race Conditions with Atomic SQL ✅

- [x] `database/repositories/stock.repo.ts` — `addStock()`: replace read-compute-write with `UPDATE products SET stock_quantity = stock_quantity + ? WHERE id = ?`
- [x] `stock.repo.ts` — `removeStock()`: use `UPDATE products SET stock_quantity = stock_quantity - ? WHERE id = ?` + add CHECK for negative stock
- [x] `stock.repo.ts` — `adjustStock()`: use atomic `UPDATE ... SET stock_quantity = ?` within a transaction
- [x] `database/repositories/customer.repo.ts` — `addTransaction()`: replace JS balance computation with `UPDATE customers SET total_debt = total_debt + ? WHERE id = ?`
- [x] `database/repositories/sale.repo.ts` — credit sale balance update (L82-95): use atomic SQL `total_debt = total_debt + ?`

### 2.2 Wrap Multi-Step Operations in Transactions ✅

- [x] `database/repositories/purchase.repo.ts` — `create()`: wrap PO + items + total update in `BEGIN/COMMIT/ROLLBACK`
- [x] `purchase.repo.ts` — `receive()`: wrap stock updates + item received_quantity updates in transaction
- [x] `database/repositories/settings.repo.ts` — `setMany()`: wrap batch settings in transaction
- [x] `database/repositories/cashier-session.repo.ts` — `startSession()`: wrap force-close + INSERT + SELECT in transaction
- [x] Audit all repos: any method with 2+ write operations must use transactions (stock.repo.ts 3 methods + customer.repo.ts addTransaction)

### 2.3 Add Defensive JSON Parsing

- [ ] `database/repositories/audit-log.repo.ts` — `getLogs()`: wrap `JSON.parse(log.old_value)` and `JSON.parse(log.new_value)` in try/catch, default to raw string on failure
- [ ] `database/repositories/quick_access.repo.ts` — `getAll()` and `getById()`: wrap `JSON.parse(row.options)` in try/catch, default to `[]`

### 2.4 Fix SQL Interpolation in Report Repo

- [ ] `database/repositories/report.repo.ts` — `getSalesChart()` (L71): replace `${groupBy}` string interpolation with two separate static SQL strings chosen via `if/else` on the `period` parameter

### 2.5 Add Audit Logging to Missing Repos

- [ ] Add audit logging to `SaleRepo` — `createFromCart()`, `refundSale()`, `voidSale()`
- [ ] Add audit logging to `StockRepo` — `addStock()`, `removeStock()`, `adjustStock()`
- [ ] Add audit logging to `PurchaseRepo` — `create()`, `receive()`
- [ ] Add audit logging to `SupplierRepo` — `create()`, `update()`, `delete()`
- [ ] Add audit logging to `ExpenseRepo` — `create()`, `delete()`

---

## Phase 3 — Store Layer & Error Handling (P1)

> **Why:** Most Zustand stores silently swallow errors, leave `isLoading` stuck on failure, and don't surface problems to the UI.

### 3.1 Standardize Error Handling Pattern

- [ ] Define a standard async action pattern for all stores:
  ```
  try { set({ isLoading: true, error: null }); ... } 
  catch (e) { set({ error: e.message }); throw e; } 
  finally { set({ isLoading: false }); }
  ```
- [ ] Apply to `useCategoryStore` — add try/catch/finally to all 4 actions, add `error` state
- [ ] Apply to `usePurchaseStore` — add try/catch/finally to all 5 actions, add `error` state
- [ ] Apply to `useSupplierStore` — add try/catch/finally to all 5 actions, add `error` state
- [ ] Apply to `useUserStore` — add try/catch/finally to all 6 actions, add `error` state
- [ ] Apply to `useReportStore` — add try/catch/finally to all 7 actions, add `error` state
- [ ] Apply to `useProductStore` — add try/catch/finally to `loadLowStock`, `addProduct`, `updateProduct`, `deleteProduct`, `getByBarcode`; add `error` state
- [ ] Apply to `useSaleStore` — add `isLoading` state, add try/catch/finally to all load methods and `checkout`; add `error` state
- [ ] Apply to `useSettingsStore` — add try/catch/finally + rollback on failure for `updateSetting`/`updateSettings`; add `error` state

### 3.2 Fix `isLoading` Race Conditions

- [ ] `useReportStore` — replace single `isLoading` with individual loading flags (`isLoadingReports`, `isLoadingCashier`, `isLoadingSales`) OR use a counter-based approach (`loadingCount++` / `loadingCount--`)
- [ ] `useCustomerStore` — split into `isLoadingCustomers` and `isLoadingTransactions`
- [ ] `useUserStore` — split into `isLoadingUsers` and `isLoadingSessions`
- [ ] Ensure all `isLoading` resets use `finally` blocks (audit every store)

### 3.3 Fix Fire-and-Forget Async Calls

- [ ] `useProductStore.setFilters()` — `await loadProducts()`
- [ ] `useReportStore.setPeriod()` — `await` all three load calls sequentially or use `Promise.all`
- [ ] `useReportStore.setSelectedCashier()` — `await` load calls
- [ ] `useAuthStore.logout()` — `await closeCashierSession()` before clearing state

### 3.4 Fix Stale Data Validation

- [ ] `useSaleStore.addToCart()` — fetch fresh product from DB before checking `stock_quantity`, or validate stock server-side in `checkout()`
- [ ] `useSaleStore.updateCartItem()` — same fresh-fetch fix
- [ ] Add stock validation inside `SaleRepo.createFromCart()` (within the transaction) to reject if insufficient stock at commit time

### 3.5 Clean Up Store Design

- [ ] Remove `checkAuth()` from `useAuthStore` — it's just `get().isAuthenticated`
- [ ] Move `NAV_ITEMS` from `useAuthStore` to a separate `src/lib/navigation.ts` config file
- [ ] Convert `useSaleStore.getCartTotal()` from action to a derived selector
- [ ] Convert `useSettingsStore.getSetting()` to a standalone selector
- [ ] Merge `useSystemStore` into `useLayoutStore` (both are tiny UI state)
- [ ] Remove `useProductStore` cross-window sync via `localStorage` events (unnecessary for a single-window Electron app)
- [ ] Fix `useProductStore.addProduct()` — remove the pointless optimistic update that's immediately overwritten by `loadProducts()`
- [ ] Fix `useProductStore.addProduct()` — don't reset filters as a side effect

---

## Phase 4 — UI/UX Consistency & Polish (P1)

> **Why:** The app currently has 3 different visual themes, uses browser `alert()` dialogs, and has many non-functional UI elements.

### 4.1 Unify Theming — One Design System

- [ ] **Choose ONE theme:** the light theme with CSS variables (defined in `globals.css`) is the most complete — standardize on it
- [ ] Audit and fix dark-themed pages to use the light theme:
  - [ ] `src/pages/Customers.tsx` — remove `bg-neutral-900`, `text-white`, replace with CSS variable classes
  - [ ] `src/pages/Reports.tsx` — remove dark theme classes
  - [ ] `src/pages/Transactions.tsx` — remove dark theme classes
  - [ ] `src/pages/Users.tsx` — remove dark theme classes
  - [ ] `src/pages/Help.tsx` — remove dark theme classes
  - [ ] `src/pages/Terms.tsx` — remove dark theme classes
  - [ ] `src/components/customers/CustomerModal.tsx` — remove `bg-neutral-900`
  - [ ] `src/components/dashboard/CashierSelector.tsx` — remove dark theme
  - [ ] `src/components/reports/SaleDetailModal.tsx` — remove `bg-neutral-900`
- [ ] Audit pages using raw CSS variable classes and ensure they match the Tailwind-based pages:
  - [ ] `src/pages/Purchases.tsx`
  - [ ] `src/pages/StockControl.tsx`
  - [ ] `src/pages/Suppliers.tsx`
  - [ ] `src/pages/Settings.tsx`
- [ ] Extract shared color tokens into Tailwind config so `var(--accent)` maps to `text-accent` etc.
- [ ] Remove duplicate `custom-scrollbar` CSS block from `globals.css`

### 4.2 Standardize Modals — One Pattern

- [ ] Adopt `FormModal` (shadcn `Dialog` wrapper) as the single modal standard
- [ ] Refactor `CashierLoginModal.tsx` to use `FormModal` / shadcn `Dialog` instead of custom Portal overlay
- [ ] Refactor `ExpenseModal.tsx` to use `FormModal`
- [ ] Refactor `CustomerModal.tsx` to use `FormModal`
- [ ] Refactor `SaleDetailModal.tsx` to use `FormModal`
- [ ] Refactor `BarcodeScanner.tsx` overlay to use shadcn `Dialog`
- [ ] Delete `src/components/common/Modal.tsx` (custom modal is now redundant)
- [ ] Ensure all modals have proper focus trapping, Escape to close, and click-outside-to-close

### 4.3 Replace `alert()` / `confirm()` with Proper UI

- [ ] Create a toast/notification system (use `sonner` or build on top of shadcn `Toast`)
- [ ] Install and configure toast provider in `App.tsx`
- [ ] Replace all `alert()` calls with toast notifications:
  - [ ] `src/pages/Credit.tsx` — payment failed alert
  - [ ] `src/pages/Onboarding.tsx` — setup failed alert
  - [ ] `src/pages/POS.tsx` — checkout error, barcode not found
  - [ ] `src/pages/Settings.tsx` — save/password/restore alerts
  - [ ] `src/pages/Users.tsx` — validation alerts
  - [ ] `src/components/customers/CustomerModal.tsx` — save error alert
- [ ] Replace all `confirm()` calls with `DeleteConfirmModal` or a custom confirmation dialog:
  - [ ] `src/pages/Customers.tsx` — delete customer confirm
  - [ ] `src/pages/Expenses.tsx` — delete expense confirm
  - [ ] `src/pages/POS.tsx` — end shift confirm
  - [ ] `src/pages/Settings.tsx` — delete account confirm (should require password)
  - [ ] `src/pages/Users.tsx` — delete user confirm
  - [ ] `src/components/reports/SaleDetailModal.tsx` — refund/void confirm

### 4.4 Fix Non-Functional UI Elements

- [ ] `src/pages/Inventory.tsx` — implement Import CSV functionality on import button
- [ ] `src/pages/Inventory.tsx` — implement Export CSV functionality on export button
- [ ] `src/pages/Credit.tsx` — implement Filter button functionality
- [ ] `src/pages/Credit.tsx` — implement Download/Export button functionality
- [ ] `src/pages/Expenses.tsx` — implement Filter button functionality
- [ ] `src/pages/Expenses.tsx` — implement Download/Export button functionality
- [ ] `src/pages/Login.tsx` — either implement "Forgot password?" or remove the link
- [ ] `src/pages/Terms.tsx` — implement "Contact Us" button or remove it
- [ ] `src/pages/Help.tsx` — replace placeholder FAQ with real content or remove the page
- [ ] `src/pages/Dashboard.tsx` — make `CashierSelector` actually filter dashboard data
- [ ] `src/pages/POS.tsx` — either implement Card/E-Pay payment methods or hide them (don't show "coming soon")
- [ ] `src/pages/Credit.tsx` — remove "(Coming Soon)..." from search placeholder (search works)

### 4.5 Fix TitleBar Breadcrumbs

- [ ] `src/components/layout/TitleBar.tsx` — add missing routes to `pathMap`:
  - `/barcodes` → "Barcode Labels"
  - `/credit` → "Credit Management"
  - `/expenses` → "Expenses"
  - `/transactions` → "Transactions"
  - `/audit-logs` → "Audit Logs"
  - `/customers` → "Customers"
  - `/help` → "Help & Support"
  - `/terms` → "Terms of Use"
  - `/onboarding` → "Setup"
- [ ] Make breadcrumb labels use i18n translation keys

### 4.6 Add Loading Skeletons

- [ ] Create a reusable `TableSkeleton` component (shimmer rows)
- [ ] Create a reusable `CardSkeleton` component
- [ ] Create a reusable `ChartSkeleton` component
- [ ] Replace all `"Loading..."` text with skeleton components across pages
- [ ] Ensure `useSaleStore` has `isLoading` so POS checkout shows proper loading state

### 4.7 Fix Layout Bugs

- [ ] `src/pages/Customers.tsx` — fix `colSpan={4}` on loading/empty rows (table has 5 columns, should be `colSpan={5}`)
- [ ] `src/components/layout/AppShell.tsx` — remove commented-out CSS on L22
- [ ] `src/components/layout/AppShell.tsx` — bottom gradient is hardcoded white — tie to CSS variable
- [ ] `src/pages/Login.tsx` — replace external Unsplash background image with a local asset (Electron must work offline)
- [ ] `src/pages/Login.tsx` — remove inline `<style>` tag, use Tailwind responsive classes

---

## Phase 5 — Internationalization Completion (P1)

> **Why:** The i18n framework is set up and ~50% of pages use it, but the other half has hardcoded English strings.

### 5.1 Complete Page Translations

- [ ] `src/pages/AuditLogs.tsx` — replace all hardcoded strings with `t()` keys (already has `useTranslation` imported)
- [ ] `src/pages/Credit.tsx` — replace all hardcoded strings with `t()` keys
- [ ] `src/pages/Customers.tsx` — replace all hardcoded strings with `t()` keys
- [ ] `src/pages/Expenses.tsx` — replace all hardcoded strings with `t()` keys
- [ ] `src/pages/Transactions.tsx` — replace all hardcoded strings with `t()` keys
- [ ] `src/pages/Purchases.tsx` — add `useTranslation` import, replace all strings with `t()` keys
- [ ] `src/pages/Reports.tsx` — add `useTranslation` import, replace all strings with `t()` keys
- [ ] `src/pages/Settings.tsx` — add `useTranslation` import, replace all strings with `t()` keys
- [ ] `src/pages/StockControl.tsx` — add `useTranslation` import, replace all strings with `t()` keys
- [ ] `src/pages/Suppliers.tsx` — add `useTranslation` import, replace all strings with `t()` keys
- [ ] `src/pages/Users.tsx` — add `useTranslation` import, replace all strings with `t()` keys
- [ ] `src/pages/Onboarding.tsx` — replace hardcoded strings with `t()` keys

### 5.2 Complete Component Translations

- [ ] `src/components/auth/CashierLoginModal.tsx` — replace hardcoded English strings
- [ ] `src/components/common/ErrorBoundary.tsx` — replace hardcoded English strings
- [ ] `src/components/common/DatabaseInitialization.tsx` — replace hardcoded bilingual strings with i18n
- [ ] `src/components/customers/CustomerModal.tsx` — replace hardcoded strings
- [ ] `src/components/expenses/ExpenseModal.tsx` — replace hardcoded strings
- [ ] `src/components/reports/SaleDetailModal.tsx` — replace hardcoded strings
- [ ] `src/components/layout/Sidebar.tsx` — translate the 6 hardcoded nav item labels ("Labels", "Transactions", "Expenses", "Audit Logs", "Customers", etc.)

### 5.3 Add Missing Translation Keys

- [ ] Add all new keys to `src/i18n/locales/en.json`
- [ ] Add all new keys to `src/i18n/locales/fr.json`
- [ ] Add all new keys to `src/i18n/locales/ar.json`
- [ ] Fix the 3 missing keys in French (`fr.json` has 325 keys vs 328 in EN/AR)
- [ ] Verify key parity across all 3 locale files

### 5.4 Fix `formatCurrency` Locale

- [ ] `src/lib/utils.ts` — `formatCurrency()`: replace hardcoded `'fr-FR'` locale with dynamic locale from `i18n.language`
- [ ] `src/pages/BarcodeLabels.tsx` — remove local `formatPrice` function, use shared `formatCurrency`
- [ ] `src/pages/Suppliers.tsx` — payment modal: replace hardcoded "DZ" currency with settings store value
- [ ] Make `formatCurrency` reactive — consider making it a hook (`useFormatCurrency`) that re-reads settings on change

---

## Phase 6 — Code Quality & Maintainability (P2)

> **Why:** Zero tests, no linting, 900+ line components, duplicated code. Technical debt will compound if not addressed.

### 6.1 Add Linting & Formatting

- [ ] Install `eslint` + `@eslint/js` + `typescript-eslint` + `eslint-plugin-react-hooks` + `eslint-plugin-react-refresh`
- [ ] Create `.eslintrc.cjs` with recommended rules + React hooks rules + unused imports rule
- [ ] Install `prettier` + `eslint-config-prettier`
- [ ] Create `.prettierrc` with project conventions (single quotes, trailing commas, 4-space indent to match existing code)
- [ ] Add `"lint": "eslint src/ database/"` and `"format": "prettier --write src/ database/"` to `package.json` scripts
- [ ] Run initial lint fix pass to clean up existing warnings
- [ ] Fix all unused imports flagged by ESLint

### 6.2 Break Up Monolithic Components

#### POS.tsx (933 lines → ~5 files)
- [ ] Extract `EmptyCartDialog` to `src/components/POS/EmptyCartDialog.tsx`
- [ ] Extract `StockErrorDialog` to `src/components/POS/StockErrorDialog.tsx`
- [ ] Extract `QuickAccessManager` + `QuickAccessForm` to `src/components/POS/QuickAccessManager.tsx`
- [ ] Extract cart panel to `src/components/POS/CartPanel.tsx`
- [ ] Extract product search/grid to `src/components/POS/ProductGrid.tsx`
- [ ] POS.tsx should become an orchestrator of ~200 lines max

#### Inventory.tsx (777 lines → ~4 files)
- [ ] Extract `InventoryGrid` (grid view) to `src/components/inventory/InventoryGrid.tsx`
- [ ] Extract `InventoryList` (table view) to `src/components/inventory/InventoryList.tsx`
- [ ] Extract `InventoryFilters` (category carousel, search, toggles) to `src/components/inventory/InventoryFilters.tsx`
- [ ] Extract `InventoryPagination` to `src/components/inventory/InventoryPagination.tsx`
- [ ] Inventory.tsx should become an orchestrator of ~150 lines max

#### Settings.tsx (557 lines → ~6 files)
- [ ] Extract `AccountTab` to `src/components/settings/AccountTab.tsx`
- [ ] Extract `StoreInfoTab` to `src/components/settings/StoreInfoTab.tsx`
- [ ] Extract `LocalizationTab` to `src/components/settings/LocalizationTab.tsx`
- [ ] Extract `TaxTab` to `src/components/settings/TaxTab.tsx`
- [ ] Extract `ReceiptTab` to `src/components/settings/ReceiptTab.tsx`
- [ ] Extract `SystemTab` (backup/restore/data) to `src/components/settings/SystemTab.tsx`
- [ ] Settings.tsx should become a tab container of ~80 lines max

#### Sidebar.tsx (339 lines → ~2 files)
- [ ] Extract `LogoutConfirmModal` to `src/components/layout/LogoutConfirmModal.tsx`
- [ ] Remove duplicate language switcher logic (use the existing `LanguageSwitcher.tsx` component)
- [ ] Sidebar.tsx should be ~200 lines max

### 6.3 Eliminate Duplicated Code

- [ ] Extract shared `productStyles` / `getProductStyle` array from POS.tsx and Inventory.tsx into `src/lib/product-styles.ts`
- [ ] Remove local `formatPrice` from `BarcodeLabels.tsx` — use shared `formatCurrency` from `src/lib/utils.ts`
- [ ] Deduplicate language switch logic between `LanguageSwitcher.tsx` and `Sidebar.tsx`
- [ ] Create a shared CRUD store factory (optional pattern) to reduce boilerplate across Category, Supplier, Purchase, User stores that all follow identical load-mutate-reload patterns

### 6.4 Fix Inconsistent Patterns

- [ ] `database/repositories/expense.repo.ts` — change from `class` with `static` methods to object literal (match all other repos)
- [ ] `database/repositories/expense.repo.ts` — change import from `@/lib/types` to relative `../../src/lib/types` (match all other repos) OR change all repos to use `@/lib/types` consistently
- [ ] `src/stores/useQuickAccessStore.ts` — replace dynamic `import()` calls with static imports (match all other stores)
- [ ] `src/stores/useQuickAccessStore.ts` — rename `loading` to `isLoading` (match all other stores)
- [ ] Ensure all repos that return user-visible entities include `getById()` and `update()` (missing from `ExpenseRepo`)
- [ ] Standardize all stores: every store gets `error: string | null` state + `clearError()` action

### 6.5 Remove Direct Repo Imports from Pages

- [ ] `src/pages/AuditLogs.tsx` — create `useAuditLogStore` (or add actions to existing store) instead of importing `AuditLogRepo` directly
- [ ] `src/pages/Dashboard.tsx` — move `SaleRepo` calls to `useSaleStore` actions
- [ ] `src/pages/Onboarding.tsx` — move `UserRepo.create()` call to `useUserStore.addUser()` or `useAuthStore`
- [ ] `src/pages/StockControl.tsx` — move `StockRepo` calls to a proper store or extend `useProductStore`
- [ ] `src/components/dashboard/SalesAnalytics.tsx` — move `SaleRepo` calls to store
- [ ] `src/pages/App.tsx` — move `UserRepo.hasAnyUsers()` check to `useAuthStore` or `useUserStore`

### 6.6 Clean Up Dead Code

- [ ] Delete `src/components/POS/FlashDealsPromotions.tsx` (renders nothing — `promoProducts` is `[]`)
- [ ] Remove all `console.log` statements from `src/components/auth/CashierLoginModal.tsx` (~18 statements)
- [ ] Remove `console.log` from `src/pages/Login.tsx` `handleCashierSuccess`
- [ ] Remove unused `query` import from `src/pages/AuditLogs.tsx`
- [ ] Remove unused `ArrowRight`, `Filter` imports from `src/pages/AuditLogs.tsx`
- [ ] Remove unused `Calendar`, `ArrowUpRight`, `ArrowDownLeft` imports from `src/pages/Expenses.tsx`
- [ ] Remove unused `Search`, `ChevronRight`, `FileText` imports from `src/pages/Reports.tsx`
- [ ] Remove unused `Audio` object creation from `src/components/common/BarcodeScanner.tsx`
- [ ] Remove `currentTime` state and its `setInterval` from `src/pages/POS.tsx` (updates every second but is never rendered)
- [ ] Remove the artificial 800ms `setTimeout` delay from `src/pages/Login.tsx` login handler
- [ ] Remove/reduce the 5-second artificial delay from `src/components/common/LanguageSwitcher.tsx` (2.8s + 2.2s for a ~50ms operation — reduce to 500ms max)
- [ ] Remove the static "Collection Health: Good" fake metric from `src/pages/Credit.tsx`
- [ ] Remove `FlashDealsPromotions` import from `src/pages/POS.tsx`
- [ ] Remove `src/components/common/Modal.tsx` after all modals are migrated to shadcn Dialog
- [ ] Delete duplicate section comment `// DASHBOARD / REPORTS` from `src/lib/types.ts`
- [ ] Remove import of `cn` from `src/components/common/PagePlaceholder.tsx` (imported but unused)

### 6.7 Rename Misnamed Entities

- [ ] Rename `src/components/dashboard/RecentProducts.tsx` to `RecentSales.tsx` (it shows recent sales, not products)
- [ ] Update all imports of `RecentProducts` to `RecentSales`

---

## Phase 7 — Missing Features & Completeness (P2)

> **Why:** Several advertised features are stubs. The app needs these to be credible for production use.

### 7.1 Proper Pagination

- [ ] Create a reusable `usePagination(totalItems, pageSize)` hook
- [ ] Add pagination to `src/pages/Inventory.tsx` (already partially implemented — verify correctness)
- [ ] Add pagination to `src/pages/Transactions.tsx` (currently hardcoded to 100 records)
- [ ] Add pagination to `src/pages/AuditLogs.tsx`
- [ ] Add pagination to `src/pages/Customers.tsx`
- [ ] Add pagination to `src/pages/Expenses.tsx`
- [ ] Add pagination to `src/pages/Purchases.tsx`
- [ ] Add pagination to `src/pages/StockControl.tsx` (both product list and movement history)
- [ ] Add pagination to `src/pages/Users.tsx`
- [ ] Update repo methods to accept `limit` and `offset` parameters

### 7.2 CSV Import/Export

- [ ] Create `src/lib/csv.ts` with:
  - `exportToCsv(headers, rows, filename)` — handles value escaping (commas, quotes, newlines)
  - `parseCsvFile(file): Promise<Record<string, string>[]>` — parses uploaded CSV
- [ ] Implement product CSV export in `src/pages/Inventory.tsx`
- [ ] Implement product CSV import in `src/pages/Inventory.tsx` (with validation, preview, and error reporting)
- [ ] Fix CSV export in `src/pages/Reports.tsx` — use proper escaping instead of raw string concatenation
- [ ] Implement expense CSV export in `src/pages/Expenses.tsx`
- [ ] Implement credit history download in `src/pages/Credit.tsx`

### 7.3 Input Validation

- [ ] `src/pages/Credit.tsx` — validate payment amount (must be positive, must not exceed outstanding debt)
- [ ] `src/pages/Onboarding.tsx` — add email format validation for store email
- [ ] `src/pages/Users.tsx` — validate PIN format (4-6 digits) on create/edit
- [ ] `src/pages/POS.tsx` — validate discount amount (must not exceed item total)
- [ ] Add number formatting validation on all price/quantity inputs across the app

### 7.4 Fix Audit Logs Page

- [ ] Implement text search in `src/pages/AuditLogs.tsx` — `filters.search` is set but never sent to repo
- [ ] Remove unused `query` import

### 7.5 Implement Real Metrics

- [ ] `src/pages/Credit.tsx` — replace "Collection Health: Good" with a real calculated metric based on payment-to-debt ratio

### 7.6 Improve Print Functionality

- [ ] `src/components/POS/ReceiptPreview.tsx` — consolidate two receipt layouts (screen + print) to avoid drift
- [ ] Add print error handling (detect if print dialog was cancelled)
- [ ] Add thermal printer support via Electron IPC (optional — if target users have thermal printers)

### 7.7 Naming Consistency

- [ ] Fix branding: `Onboarding.tsx` says "Kenzy" while other places say "SuperMarket Pro" or "SparkPOS" — unify to one brand name
- [ ] Update `src/components/common/DatabaseInitialization.tsx` hardcoded version "v1.0" to read from `package.json`

---

## Phase 8 — Testing (P2)

> **Why:** Zero test coverage. Critical business logic (checkout, stock updates, financial calculations) must have automated tests.

### 8.1 Set Up Test Infrastructure

- [ ] Install `vitest` + `@testing-library/react` + `@testing-library/jest-dom` + `@testing-library/user-event`
- [ ] Create `vitest.config.ts` with proper path aliases (`@/`, `@db/`)
- [ ] Add `"test": "vitest"` and `"test:coverage": "vitest --coverage"` scripts to `package.json`
- [ ] Create test setup file that mocks `sql.js` and `window.electronAPI`

### 8.2 Unit Tests — Database Layer

- [ ] Test `UserRepo.create()` — password is hashed
- [ ] Test `UserRepo.authenticate()` — correct password returns user, wrong password returns null
- [ ] Test `UserRepo.authenticateWithPin()` — correct PIN returns user
- [ ] Test `SaleRepo.createFromCart()` — stock is decremented, sale items are created, totals are correct
- [ ] Test `SaleRepo.createFromCart()` — transaction rolls back on error
- [ ] Test `StockRepo.addStock()` / `removeStock()` — atomic updates
- [ ] Test `CustomerRepo.addTransaction()` — debt balance is correct
- [ ] Test `PurchaseRepo.create()` — PO + items created in transaction
- [ ] Test `PurchaseRepo.receive()` — stock is updated, items marked received

### 8.3 Unit Tests — Store Layer

- [ ] Test `useSaleStore.checkout()` — cart is cleared on success, error is set on failure
- [ ] Test `useSaleStore.addToCart()` — respects stock limits
- [ ] Test `useAuthStore.login()` — sets user and isAuthenticated on success
- [ ] Test `useProductStore.loadProducts()` — sets products, handles error, toggles isLoading

### 8.4 Integration Tests — Critical Flows

- [ ] Test full POS flow: search product → add to cart → checkout → verify sale created + stock decremented
- [ ] Test credit sale flow: select customer → checkout on credit → verify debt updated
- [ ] Test purchase receive flow: create PO → receive → verify stock increased
- [ ] Test refund flow: complete sale → refund → verify stock restored + sale status updated

### 8.5 Accessibility Tests

- [ ] Add `axe-core` or `vitest-axe` for automated accessibility checks
- [ ] Test all modal components for focus trapping
- [ ] Test keyboard navigation on Sidebar, POS product grid, and all forms

---

## Phase 9 — Performance & Polish (P3)

### 9.1 Performance Optimizations

- [ ] `src/pages/POS.tsx` — memoize product grid with `React.memo` + `useMemo`
- [ ] `src/pages/Reports.tsx` — memoize chart data transformations with `useMemo`
- [ ] `src/pages/Expenses.tsx` — stop double-sorting `stats.byCategory` on every render (sort once in a `useMemo`)
- [ ] `src/pages/Users.tsx` — memoize `getPerformanceStats` (currently called as IIFE in JSX on every render)
- [ ] `src/pages/Dashboard.tsx` — memoize `getDefaultRoute` with `useMemo`
- [ ] `src/components/dashboard/SalesAnalytics.tsx` — memoize `peakHour` calculation
- [ ] `src/pages/Inventory.tsx` — remove duplicate variable declarations for `isOutStock`/`isLowStock`/`isInStock` in list view
- [ ] Remove `useProductStore` `visibilitychange` listener (fires full reload on every tab focus — not needed in Electron)

### 9.2 Electron-Specific Improvements

- [ ] Add `app-before-quit` handler in `electron/main.js` to trigger `saveDatabaseImmediate()` before exit
- [ ] Add auto-update support via `electron-updater` (optional)
- [ ] Add proper app icon for all platforms (currently only `build/icon.ico` referenced but not confirmed to exist)
- [ ] Abstract `window.electronAPI` access behind a utility/hook: `useElectron()` — don't access directly in components
- [ ] `src/components/layout/TitleBar.tsx` — move `window.electronAPI` calls behind the hook

### 9.3 Final Polish

- [ ] Add proper `<title>` per page using `useEffect` or a `usePageTitle` hook
- [ ] Add `ErrorBoundary` wrapper at the page level (component exists but is only used at root)
- [ ] Remove or replace all `window.location.reload()` hacks with proper React state resets:
  - `src/pages/Onboarding.tsx`
  - `src/pages/Settings.tsx` (restore)
  - `src/components/common/BarcodeScanner.tsx` (camera reset)
- [ ] Verify all `useEffect` dependency arrays are correct (several flagged during review)
- [ ] Review TODOs left in source (e.g., `loadSales` cashier filtering comment in `useReportStore`)

---

## Completion Checklist

When all phases are complete, verify:

- [ ] All passwords hashed with bcrypt (12+ rounds)
- [ ] All PINs hashed
- [ ] No credentials leaked to frontend
- [ ] All multi-step DB operations wrapped in transactions
- [ ] Every store has `isLoading`, `error`, and proper `finally` blocks
- [ ] All 19 pages use i18n for every user-visible string
- [ ] All 3 locale files have the same key count
- [ ] One consistent visual theme across all pages
- [ ] One consistent modal pattern (shadcn Dialog via FormModal)
- [ ] Zero `alert()` / `confirm()` calls remaining
- [ ] Zero `console.log` statements in production code
- [ ] Zero unused imports
- [ ] No component exceeds ~300 lines
- [ ] ESLint passes with zero warnings
- [ ] All critical paths have automated tests
- [ ] All buttons/links have working handlers (no dead UI)
- [ ] Keyboard navigation works throughout the app
- [ ] App works fully offline in Electron
- [ ] CSV export properly escapes values
- [ ] All pages have pagination where lists can grow

---

*Generated: February 18, 2026*
*Based on full file-by-file code review of SuperMarket Pro v1.0.0*
