# Component Contracts: Cart Panel Redesign (004)

**Feature**: 004-cart-panel | **Date**: 2026-02-26

## Overview

The cart panel is a UI component consumed by the POS page. These contracts define the props interfaces for each sub-component, specifying the data and callbacks expected by the parent orchestrator.

---

## CartPanel (Main Component)

**File**: `src/components/POS/CartPanel.tsx`
**Consumer**: `src/pages/POS.tsx`

### Props Interface

```typescript
interface CartPanelProps {
    // Cart data
    cart: CartItem[];
    cartTotal: number;
    promotionResult: PromotionApplicationResult | null;

    // Cart actions
    addToCart: (item: CartItem) => Promise<void>;
    removeFromCart: (productId: number) => void;
    clearCart: () => void;

    // Customer
    selectedCustomer: Customer | null;
    setSelectedCustomer: (customer: Customer | null) => void;

    // Payment
    paymentMethod: 'cash' | 'card' | 'mobile' | 'credit';
    setPaymentMethod: (method: 'cash' | 'card' | 'mobile' | 'credit') => void;

    // Checkout
    handleBeforeCheckout: () => void;
    isCheckingOut: boolean;

    // Stock error (for toast notifications)
    stockError: { productName: string; available: number } | null;
    clearStockError: () => void;
}
```

### Behavior Contract

- Renders full-height within its container (`h-full`)
- Registers `onKeyDown` on root `<div tabIndex={-1}>`:
  - `Enter` → calls `handleBeforeCheckout` (if cart non-empty and not in input)
  - `Escape` → calls `setSelectedCustomer(null)` (if not in input)
- Auto-focuses root `<div>` on mount

---

## CartItemRow (Sub-Component)

**File**: `src/components/POS/CartItemRow.tsx`
**Consumer**: `CartPanel.tsx`

### Props Interface

```typescript
interface CartItemRowProps {
    item: CartItem;
    promotion: PromotionResult | null;
    onIncrement: (productId: number) => void;
    onDecrement: (productId: number) => void;
    onRemove: (productId: number) => void;
    isAtMaxStock: boolean;
    formatCurrency: (amount: number) => string;
}
```

### Behavior Contract

- Wrapped with `React.memo` for render optimization
- Displays: product name (truncated), unit price, quantity, line total
- Shows promotion badge when `promotion` is not null
- `+` button: calls `onIncrement`; visually disabled when `isAtMaxStock` is true
- `−` button: calls `onDecrement`; at quantity=1, calls `onRemove` instead
- Trash/remove button: calls `onRemove` directly

---

## CartSummary (Sub-Component)

**File**: `src/components/POS/CartSummary.tsx`
**Consumer**: `CartPanel.tsx`

### Props Interface

```typescript
interface CartSummaryProps {
    subtotal: number;
    savings: number;
    formatCurrency: (amount: number) => string;
}
```

### Behavior Contract

- Displays subtotal line always
- Displays savings line only when `savings > 0`
- Uses dashed border separator at top for receipt aesthetic
- All values formatted via `formatCurrency`

---

## PaymentMethodGrid (Sub-Component)

**File**: `src/components/POS/PaymentMethodGrid.tsx`
**Consumer**: `CartPanel.tsx`

### Props Interface

```typescript
interface PaymentMethodGridProps {
    selected: 'cash' | 'card' | 'mobile' | 'credit';
    onSelect: (method: 'cash' | 'card' | 'mobile' | 'credit') => void;
}
```

### Behavior Contract

- Renders a 2×2 CSS grid of pill/chip buttons
- Each button shows an icon + translated label
- Selected button has accent styling; unselected buttons have neutral styling
- Options: Cash (`Banknote`), E-Pay (`Smartphone`), Card (`CreditCard`), Credit (`Wallet`)
- Clicking a button calls `onSelect` with the corresponding method value
- All labels are i18n-aware via `react-i18next`

---

## Integration with POS.tsx

The POS page wires these components using existing store hooks:

```typescript
// Existing state from stores:
const { cart, addToCart, removeFromCart, clearCart, checkout, stockError, clearStockError, promotionResult } = useSaleStore();
const cartTotal = useSaleStore(selectCartTotal);

// Existing local state in POS.tsx:
const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'mobile' | 'credit'>('cash');
const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

// Passed to CartPanel:
<CartPanel
    cart={cart}
    cartTotal={cartTotal}
    promotionResult={promotionResult}
    addToCart={addToCart}
    removeFromCart={removeFromCart}
    clearCart={clearCart}
    selectedCustomer={selectedCustomer}
    setSelectedCustomer={setSelectedCustomer}
    paymentMethod={paymentMethod}
    setPaymentMethod={setPaymentMethod}
    handleBeforeCheckout={handleBeforeCheckout}
    isCheckingOut={isCheckingOut}
    stockError={stockError}
    clearStockError={clearStockError}
/>
```
