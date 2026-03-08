# Component Contracts: POS Layout Zones

**Feature**: 005-pos-rebuild  
**Date**: 2026-03-04

This document defines the interface contracts between the POS layout zones and their child components. Since this is a frontend desktop application, "contracts" are React component prop interfaces and Zustand store action signatures.

## Zone Layout Contract

```
┌───────────────────────────────────────────────────────┐
│                    POSHeader                          │
│  [Logo/StoreName]    [CashierName]    [DateTime]      │
├──────────┬────────────────────────┬───────────────────┤
│          │                        │                   │
│  LEFT    │       CENTER           │      RIGHT        │
│  PANEL   │       PANEL            │      PANEL        │
│  300px   │       1fr              │      280px        │
│          │                        │                   │
│ Client   │  SearchBar             │  ActionGrid       │
│ Info     │  ────────              │  (4×3 buttons)    │
│ Panel    │  CartTicket            │                   │
│          │  (scrollable)          │                   │
│ Product  │  ────────              │                   │
│ Detail   │  TotalsBar             │                   │
│ Card     │  (sticky bottom)       │                   │
│          │  ┌─────────────┐       │                   │
│ Numeric  │  │ GRAND TOTAL │       │                   │
│ Keypad   │  │  €42.50     │       │                   │
│          │  └─────────────┘       │                   │
│          │  PaymentArea           │                   │
└──────────┴────────────────────────┴───────────────────┘
```

## Component Prop Interfaces

### POSLayout

Top-level orchestrator. Replaces the current `POS.tsx` layout.

```typescript
// No props — reads all state from stores
interface POSLayoutProps {}
```

### POSHeader

```typescript
interface POSHeaderProps {
  storeName: string;
  cashierName: string;
  sessionActive: boolean;
}
```

### ClientInfoPanel

```typescript
interface ClientInfoPanelProps {
  customer: Customer | null;
  onSearch: () => void;         // opens customer search modal
  onClear: () => void;          // reverts to walk-in
  onEdit: () => void;           // opens customer edit (if selected)
  onAddNew: () => void;         // opens new customer form
}
```

### ProductDetailCard

```typescript
interface ProductDetailCardProps {
  product: Product | null;       // null = placeholder state
  formatCurrency: (amount: number) => string;
  lowStockThreshold?: number;    // default: product.reorder_level
}
```

### NumericKeypad

```typescript
interface NumericKeypadProps {
  value: string;                 // current accumulated digits
  onDigit: (digit: string) => void;     // '0'-'9'
  onBackspace: () => void;
  onClear: () => void;
  onConfirm: () => void;        // enter/submit
}
```

### CartTicket

```typescript
interface CartTicketProps {
  cart: CartItem[];
  ticketNumber: number;
  promotionResult: PromotionApplicationResult | null;
  onQuantityChange: (productId: number, quantity: number) => void;
  onRemove: (productId: number) => void;
  onDiscountClick: (productId: number) => void;   // open line discount dialog
  formatCurrency: (amount: number) => string;
}
```

### CartTicketRow

```typescript
interface CartTicketRowProps {
  index: number;                 // 1-based line number
  item: CartItem;
  promotion: PromotionResult | null;
  onIncrement: () => void;
  onDecrement: () => void;
  onQuantityInput: (qty: number) => void;
  onRemove: () => void;
  onDiscountClick: () => void;
  isAtMaxStock: boolean;
  formatCurrency: (amount: number) => string;
}
```

### TotalsBar

```typescript
interface TotalsBarProps {
  subtotal: number;
  vatRate: number;               // e.g., 0.21
  vatAmount: number;
  promoSavings: number;
  manualDiscount: number;        // combined line + cart manual discounts
  grandTotal: number;
  formatCurrency: (amount: number) => string;
}
```

### ActionGrid

```typescript
interface ActionGridProps {
  holdCount: number;             // current held transaction count
  maxHolds: number;              // 5
  onHold: () => void;
  onRecall: () => void;
  onVoid: () => void;
  onDiscount: () => void;
  onReprintReceipt: () => void;
  onOpenDrawer: () => void;
  onPriceCheck: () => void;
  onReturn: () => void;
  onDailyReport: () => void;
  onSettings: () => void;
  onEndShift: () => void;
  onGiftCard: () => void;
}
```

### ActionButton

```typescript
interface ActionButtonProps {
  icon: React.ComponentType<{ size?: number }>;
  label: string;
  shortcutKey?: string;          // e.g., 'F1'
  onClick: () => void;
  variant?: 'default' | 'danger' | 'success' | 'warning';
  disabled?: boolean;
  badge?: string | number;       // e.g., hold count "3/5"
}
```

### HoldRecallDialog

```typescript
interface HoldRecallDialogProps {
  isOpen: boolean;
  onClose: () => void;
  heldTransactions: HeldTransaction[];
  onRecall: (id: string) => void;
  formatCurrency: (amount: number) => string;
}
```

### ReturnDialog

```typescript
interface ReturnDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (request: ReturnRequest) => void;
}
```

### ManagerPinDialog

```typescript
interface ManagerPinDialogProps {
  isOpen: boolean;
  action: AuthorizableAction | null;
  onSubmit: (pin: string) => void;
  onCancel: () => void;
  isVerifying: boolean;
  error?: string;
}
```

### DiscountDialog

```typescript
interface DiscountDialogProps {
  isOpen: boolean;
  onClose: () => void;
  scope: 'line' | 'cart';
  currentDiscount: ManualDiscount | null;
  maxAmount: number;             // max allowed discount (item total or subtotal)
  onApply: (discount: ManualDiscount) => void;
  onClear: () => void;
}
```

### SplitPaymentPanel

```typescript
interface SplitPaymentPanelProps {
  grandTotal: number;
  entries: PaymentEntryInput[];
  remainingBalance: number;
  onAddEntry: (entry: PaymentEntryInput) => void;
  onRemoveEntry: (index: number) => void;
  onFinalize: () => void;
  formatCurrency: (amount: number) => string;
}
```

## Store Action Contracts

### useSaleStore — New Actions

```typescript
interface SaleStoreActions {
  // Existing actions preserved...
  
  // Manual discounts
  setItemManualDiscount: (productId: number, discount: ManualDiscount) => void;
  clearItemManualDiscount: (productId: number) => void;
  setCartDiscount: (discount: ManualDiscount) => void;
  clearCartDiscount: () => void;
  
  // Split payment checkout
  checkoutWithSplitPayment: (
    entries: PaymentEntryInput[],
    customer: { name: string; id?: number },
    userId?: number,
    sessionId?: number
  ) => Promise<Sale>;
  
  // Returns
  processReturn: (request: ReturnRequest) => Promise<Sale>;
}
```

### usePOSStore — All Actions

```typescript
interface POSStoreActions {
  // Hold/Recall
  holdTransaction: (cart: CartItem[], customer: Customer | null, 
                     promotionResult: PromotionApplicationResult | null,
                     cartDiscount: ManualDiscount | null,
                     ticketNumber: number, cashierId: number) => boolean;  // false if at max
  recallTransaction: (id: string) => HeldTransaction | null;
  removeHeld: (id: string) => void;
  getHoldCount: (cashierId: number) => number;
  
  // Product detail
  setSelectedProduct: (product: Product | null) => void;
  
  // Keypad
  appendKeypad: (digit: string) => void;
  clearKeypad: () => void;
  backspaceKeypad: () => void;
  setKeypadMode: (mode: 'product_code' | 'quantity' | 'price') => void;
  
  // Ticket
  refreshNextTicket: () => Promise<void>;
}
```

### useAuthorizationStore — All Actions

```typescript
interface AuthorizationStoreActions {
  requestAuth: (action: AuthorizableAction) => Promise<AuthorizationResult>;
  submitPin: (pin: string) => Promise<void>;
  cancel: () => void;
}
```

## Database Repository Contracts

### SaleRepo — New Methods

```typescript
interface SaleRepoExtensions {
  // Ticket numbers
  getNextTicketNumber: () => number;                    // peek (no increment)
  
  // Split payment
  createFromCartWithSplitPayment: (
    cart: CartItem[],
    payments: PaymentEntryInput[],
    customer: { name: string; id?: number },
    userId?: number,
    sessionId?: number,
    promotionResult?: PromotionApplicationResult,
    cartDiscount?: ManualDiscount
  ) => Sale;
  
  // Partial return
  createPartialReturn: (request: ReturnRequest) => Sale;
  
  // Payment entries
  getPaymentEntries: (saleId: number) => PaymentEntry[];
  
  // Return tracking
  getReturnedQuantities: (saleId: number) => Map<number, number>;  // productId → total returned qty
}
```

### UserRepo — New Methods

```typescript
interface UserRepoExtensions {
  verifyManagerPin: (pin: string) => Promise<User | null>;  // returns matching manager, or null
}
```

## Keyboard Shortcut Map

```typescript
const POS_SHORTCUTS: Record<string, { action: string; label: string }> = {
  'F1':  { action: 'holdSale',        label: 'Hold Sale' },
  'F2':  { action: 'recallSale',      label: 'Recall Sale' },
  'F3':  { action: 'voidSale',        label: 'Void Sale' },
  'F4':  { action: 'applyDiscount',   label: 'Discount' },
  'F5':  { action: 'reprintReceipt',  label: 'Reprint' },
  'F6':  { action: 'openCashDrawer',  label: 'Cash Drawer' },
  'F7':  { action: 'priceCheck',      label: 'Price Check' },
  'F8':  { action: 'returnRefund',    label: 'Returns' },
  'F9':  { action: 'dailyReport',     label: 'Daily Report' },
  'F10': { action: 'settings',        label: 'Settings' },
  'F11': { action: 'endShift',        label: 'End Shift' },
  'F12': { action: 'giftCard',        label: 'Gift Card' },
};
```
