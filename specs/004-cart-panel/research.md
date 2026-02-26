# Research: Cart Panel Redesign (004)

**Feature**: 004-cart-panel | **Date**: 2026-02-26

## 1. Receipt/Ticket-Style Cart UI Layout

**Decision**: Three-section vertical layout with fixed header, flex body (scrollable items ~80% + pinned financial summary ~20%), and fixed footer.

**Rationale**: The existing POS layout reserves a `w-[340px] h-full shrink-0` slot. A receipt metaphor maps naturally: header = customer selector, body = line items + subtotal, footer = total + payment. At 340px, use 12–16px horizontal padding (~308–316px usable). Section dividers use subtle dashed borders (`border-dashed border-zinc-200`) to evoke a thermal receipt. The financial summary is pinned (non-scrollable) at the bottom of the body flex container so the cashier always sees subtotal/savings.

**Alternatives considered**:
- Tabbed layout (items/summary tabs): Rejected — hides critical financial info, adds cognitive load.
- Overlay/modal cart: Rejected — POS needs persistent side-panel visibility.
- Full-scroll with sticky footer: Rejected — financial summary scrolls away with many items.

## 2. Inline Quantity Adjustment Placement & Timing

**Decision**: Place +/−/qty stepper on the **right side** of each row. Use **immediate dispatch** (no debounce) per tap.

**Rationale**: Right-side placement matches right-hand dominant interaction; product info on the left is the primary read target. The existing `addToCart` in useSaleStore already handles stock checks on each call. Debouncing would create perceived latency. Zustand `set()` is synchronous and React batches renders, so rapid taps are already efficient. Buttons should be minimum 32×32px touch targets. The − button at quantity=1 removes the item (FR-018).

**Alternatives considered**:
- Left-side stepper: Rejected — competes with product name.
- Debounced updates (200ms): Rejected — introduces visible delay for a synchronous state update.
- Swipe-to-reveal stepper: Rejected — hidden controls slow cashiers.

## 3. Memoization Strategy for Cart Item List

**Decision**: Wrap each cart row with `React.memo`. Use `useMemo` for computed values (line totals, promotion badge lookups) in the parent. Build a `Map<productId, PromotionResult>` via `useMemo` for O(1) per-row promo lookup.

**Rationale**: The cart array reference changes on every Zustand `set()`. With `React.memo` on each row, only changed rows re-render. Computed values passed as props make shallow comparison work correctly. React 19's compiler helps but doesn't guarantee skip for list items — explicit `memo` is cheap insurance.

**Alternatives considered**:
- No memoization (rely on React 19 compiler): Rejected — not guaranteed for list items.
- Virtualized list (react-window): Rejected — POS carts rarely exceed 20–30 items; unnecessary complexity.

## 4. Payment Method 2×2 Grid Layout

**Decision**: CSS Grid `grid-cols-2` with `gap-2` (8px). Each pill: full cell width, `py-2.5 px-3`, 16–18px icon + bold label inline. Selected state: accent color. Unselected: `bg-white border border-zinc-200`.

**Rationale**: At ~308–316px usable width, 2-column grid gives ~150px per button — sufficient for icon + short label. Touch targets are ~150×40px (well above 44px minimum). Icons: `Banknote` (cash), `Smartphone` (e-pay), `CreditCard` (card), `Wallet` (credit).

**Alternatives considered**:
- Horizontal row (4 across): Rejected — ~70px per button too narrow for icon + label, especially with i18n.
- Radio buttons: Rejected — slower for POS touch interaction.
- 3+1 asymmetric layout: Rejected — visually unbalanced.

## 5. Keyboard Shortcuts Strategy

**Decision**: Focused container approach — `onKeyDown` on the cart panel root `<div tabIndex={-1}>`. Guard: skip when `e.target` is an `HTMLInputElement` or `HTMLTextAreaElement`. Enter = checkout, Escape = clear customer.

**Rationale**: The POS page has multiple inputs (search, customer selector) and a global barcode scanner listener (`useBarcodeScanner`). A global `document.addEventListener` would fire in inputs. A focused-container scopes shortcuts safely. Auto-focus the panel on mount via `useEffect`. Since barcode input is rapid multi-character and Enter/Escape are single keypresses, there's no conflict.

**Alternatives considered**:
- Global `document.addEventListener`: Rejected — conflicts with `useBarcodeScanner` and input fields.
- Third-party library (react-hotkeys-hook): Rejected — overkill for 2 shortcuts; no existing hotkey dependency.

## 6. Stock Limit Enforcement

**Decision**: Stock check happens in the **store action** (authoritative, fetches fresh DB stock). Component does **presentational disable** of the + button (`item.quantity >= item.product.stock_quantity`). Toast triggered in component via `useEffect` watching `stockError` state.

**Rationale**: The store is the single source of truth — it fetches fresh stock preventing stale data issues if another cashier is active. The component's disable is purely visual (prevents unnecessary clicks). Toast via `sonner`'s `toast.warning()` in a `useEffect` follows the project's established pattern.

**Alternatives considered**:
- Component-only check: Rejected — `product.stock_quantity` could be stale.
- Store-triggered toast: Rejected — mixing UI side-effects into store violates separation of concerns.
- Optimistic disable + store rollback: Rejected — unnecessary complexity.
