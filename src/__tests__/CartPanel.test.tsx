/**
 * Cart Panel Tests — All User Stories
 *
 * Covers:
 *  - US1: CartItemRow rendering, +/−/remove actions, max stock, empty state, cart list
 *  - US2: PaymentMethodGrid rendering, selection, complete button disabled/enabled
 *  - US3: CustomerSelector in header, credit-requires-customer, Escape shortcut
 *  - US4: CartSummary subtotal/savings display
 *  - US5: Clear cart button and confirmation
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import type { CartItem, Product, PromotionResult } from '@/lib/types';

// ── Mocks ──────────────────────────────────────────

vi.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: (key: string, fallbackOrParams?: string | Record<string, unknown>) => {
            if (typeof fallbackOrParams === 'string') return fallbackOrParams;
            // Return the key for deterministic testing
            return key;
        },
        i18n: { language: 'en', dir: () => 'ltr', changeLanguage: vi.fn() },
    }),
    initReactI18next: { type: '3rdParty', init: vi.fn() },
    I18nextProvider: ({ children }: { children: React.ReactNode }) => children,
}));

vi.mock('framer-motion', () => {
    const actual = React;
    return {
        motion: new Proxy(
            {},
            {
                get: (_target, prop: string) =>
                    actual.forwardRef((props: Record<string, unknown>, ref: React.Ref<unknown>) => {
                        const { initial: _initial, animate: _animate, exit: _exit, whileHover: _whileHover, whileTap: _whileTap, transition: _transition, variants: _variants, layout: _layout, ...rest } =
                            props;
                        return actual.createElement(prop as string, { ...rest, ref });
                    }),
            },
        ),
        AnimatePresence: ({ children }: { children: React.ReactNode }) => children,
    };
});

vi.mock('sonner', () => ({
    toast: {
        success: vi.fn(),
        error: vi.fn(),
        warning: vi.fn(),
        info: vi.fn(),
    },
}));

vi.mock('@/lib/utils', () => ({
    cn: (...args: string[]) => args.filter(Boolean).join(' '),
    formatCurrency: (amount: number) => `$${amount.toFixed(2)}`,
}));

vi.mock('@/stores/useCustomerStore', () => ({
    useCustomerStore: () => ({
        customers: [],
        loadCustomers: vi.fn(),
        isLoadingCustomers: false,
    }),
}));

vi.mock('@/components/common/ConfirmDialog', () => ({
    ConfirmDialog: ({ isOpen, onClose, onConfirm, title }: {
        isOpen: boolean;
        onClose: () => void;
        onConfirm: () => void;
        title: string;
    }) =>
        isOpen ? (
            <div data-testid="confirm-dialog">
                <span>{title}</span>
                <button onClick={onConfirm}>confirm</button>
                <button onClick={onClose}>cancel</button>
            </div>
        ) : null,
}));

// ── Helpers ──────────────────────────────────────────

function makeProduct(overrides: Partial<Product> = {}): Product {
    return {
        id: 1,
        barcode: '123456',
        name: 'Test Product',
        description: '',
        category_id: 1,
        cost_price: 5,
        selling_price: 10,
        stock_quantity: 20,
        reorder_level: 5,
        unit: 'pcs',
        image_url: '',
        is_active: 1,
        created_at: '',
        updated_at: '',
        ...overrides,
    };
}

function makeCartItem(overrides: Partial<CartItem & { product: Partial<Product> }> = {}): CartItem {
    const { product: productOverrides, ...rest } = overrides;
    return {
        product: makeProduct(productOverrides),
        quantity: 1,
        discount: 0,
        ...rest,
    };
}

const defaultFormatCurrency = (amount: number) => `$${amount.toFixed(2)}`;

// ── Imports (after mocks) ──────────────────────────

import CartItemRow from '@/components/POS/CartItemRow';
import CartSummary from '@/components/POS/CartSummary';
import PaymentMethodGrid from '@/components/POS/PaymentMethodGrid';
import CartPanel from '@/components/POS/CartPanel';
import { toast } from 'sonner';

// Default CartPanel props factory
function makeCartPanelProps(overrides: Partial<React.ComponentProps<typeof CartPanel>> = {}) {
    return {
        cart: [] as CartItem[],
        cartTotal: 0,
        promotionResult: null,
        addToCart: vi.fn().mockResolvedValue(undefined),
        updateCartItem: vi.fn().mockResolvedValue(undefined),
        removeFromCart: vi.fn(),
        clearCart: vi.fn(),
        selectedCustomer: null,
        setSelectedCustomer: vi.fn(),
        paymentMethod: 'cash' as const,
        setPaymentMethod: vi.fn(),
        handleBeforeCheckout: vi.fn(),
        isCheckingOut: false,
        stockError: null,
        clearStockError: vi.fn(),
        ...overrides,
    };
}

// ══════════════════════════════════════════════════════
// US1 — View and Manage Cart Items
// ══════════════════════════════════════════════════════

describe('US1: CartItemRow', () => {
    // T007
    it('renders product name, unit price, quantity, and line total', () => {
        const item = makeCartItem({
            product: { name: 'Apple Juice', selling_price: 3.5 },
            quantity: 2,
            discount: 0,
        });

        render(
            <CartItemRow
                item={item}
                promotion={null}
                onIncrement={vi.fn()}
                onDecrement={vi.fn()}
                onRemove={vi.fn()}
                isAtMaxStock={false}
                formatCurrency={defaultFormatCurrency}
            />,
        );

        expect(screen.getByText('Apple Juice')).toBeInTheDocument();
        expect(screen.getByText('$3.50 × 2')).toBeInTheDocument();
        expect(screen.getByText('$7.00')).toBeInTheDocument(); // lineTotal = 3.5 * 2 - 0
        expect(screen.getByText('2')).toBeInTheDocument(); // quantity display
    });

    // T008
    it('+ button calls onIncrement, − calls onDecrement, trash calls onRemove', async () => {
        const user = userEvent.setup();
        const onIncrement = vi.fn();
        const onDecrement = vi.fn();
        const onRemove = vi.fn();

        const item = makeCartItem({
            product: { id: 42, selling_price: 5 },
            quantity: 3,
        });

        render(
            <CartItemRow
                item={item}
                promotion={null}
                onIncrement={onIncrement}
                onDecrement={onDecrement}
                onRemove={onRemove}
                isAtMaxStock={false}
                formatCurrency={defaultFormatCurrency}
            />,
        );

        // + button
        const plusBtn = screen.getByRole('button', { name: /increase/i });
        await user.click(plusBtn);
        expect(onIncrement).toHaveBeenCalledWith(42);

        // − button (quantity > 1, so calls onDecrement)
        const minusBtn = screen.getByRole('button', { name: /decrease/i });
        await user.click(minusBtn);
        expect(onDecrement).toHaveBeenCalledWith(42);

        // Trash/remove button
        const removeBtn = screen.getByRole('button', { name: /remove/i });
        await user.click(removeBtn);
        expect(onRemove).toHaveBeenCalledWith(42);
    });

    // T008 - at quantity 1, minus button is disabled and remove button works
    it('at quantity 1, minus button is disabled and remove button removes item', async () => {
        const user = userEvent.setup();
        const onDecrement = vi.fn();
        const onRemove = vi.fn();

        const item = makeCartItem({
            product: { id: 7 },
            quantity: 1,
        });

        render(
            <CartItemRow
                item={item}
                promotion={null}
                onIncrement={vi.fn()}
                onDecrement={onDecrement}
                onRemove={onRemove}
                isAtMaxStock={false}
                formatCurrency={defaultFormatCurrency}
            />,
        );

        // At qty=1, minus button is disabled
        const decreaseBtn = screen.getByRole('button', { name: /decrease/i });
        expect(decreaseBtn).toBeDisabled();

        // Dedicated remove button calls onRemove
        const removeBtn = screen.getByRole('button', { name: /remove/i });
        await user.click(removeBtn);
        expect(onRemove).toHaveBeenCalledWith(7);
        expect(onDecrement).not.toHaveBeenCalled();
    });

    // T009
    it('+ button is disabled when isAtMaxStock is true', () => {
        const item = makeCartItem({ quantity: 5 });

        render(
            <CartItemRow
                item={item}
                promotion={null}
                onIncrement={vi.fn()}
                onDecrement={vi.fn()}
                onRemove={vi.fn()}
                isAtMaxStock={true}
                formatCurrency={defaultFormatCurrency}
            />,
        );

        const plusBtn = screen.getByRole('button', { name: /increase/i });
        expect(plusBtn).toBeDisabled();
    });
});

describe('US1: CartPanel — empty and list states', () => {
    // T010
    it('renders empty state message when cart is empty', () => {
        const props = makeCartPanelProps({ cart: [], cartTotal: 0 });
        render(<CartPanel {...props} />);

        expect(screen.getByText('pos.cart.no_items_yet')).toBeInTheDocument();
    });

    // T011
    it('renders cart items when cart has items', () => {
        const items = [
            makeCartItem({ product: { id: 1, name: 'Milk', selling_price: 2 }, quantity: 1 }),
            makeCartItem({ product: { id: 2, name: 'Bread', selling_price: 3 }, quantity: 2 }),
        ];

        const props = makeCartPanelProps({
            cart: items,
            cartTotal: 8,
        });

        render(<CartPanel {...props} />);

        expect(screen.getByText('Milk')).toBeInTheDocument();
        expect(screen.getByText('Bread')).toBeInTheDocument();
        expect(screen.queryByText('pos.cart.no_items_yet')).not.toBeInTheDocument();
    });
});

// ══════════════════════════════════════════════════════
// US2 — Payment Method Selection & Checkout
// ══════════════════════════════════════════════════════

describe('US2: PaymentMethodGrid', () => {
    // T017
    it('renders 4 payment method buttons', () => {
        render(<PaymentMethodGrid selected="cash" onSelect={vi.fn()} />);

        expect(screen.getByText('pos.cart.pay_cash')).toBeInTheDocument();
        expect(screen.getByText('pos.cart.pay_mobile')).toBeInTheDocument();
        expect(screen.getByText('pos.cart.pay_card')).toBeInTheDocument();
        expect(screen.getByText('pos.cart.pay_credit')).toBeInTheDocument();
    });

    // T018
    it('highlights selected method and calls onSelect on click', async () => {
        const user = userEvent.setup();
        const onSelect = vi.fn();

        render(<PaymentMethodGrid selected="cash" onSelect={onSelect} />);

        // Cash button should have the selected styling (bg-yellow-400)
        const cashBtn = screen.getByText('pos.cart.pay_cash').closest('button')!;
        expect(cashBtn.className).toContain('bg-yellow-400');

        // Card button should not have selected styling
        const cardBtn = screen.getByText('pos.cart.pay_card').closest('button')!;
        expect(cardBtn.className).not.toContain('bg-yellow-400');
        expect(cardBtn.className).toContain('bg-white');

        // Click card
        await user.click(cardBtn);
        expect(onSelect).toHaveBeenCalledWith('card');
    });
});

describe('US2: CartPanel — Complete Purchase button', () => {
    // T019
    it('"Complete Purchase" button is disabled when cart is empty', () => {
        const props = makeCartPanelProps({ cart: [], cartTotal: 0 });
        render(<CartPanel {...props} />);

        const btn = screen.getByText('pos.cart.complete_purchase').closest('button')!;
        expect(btn).toBeDisabled();
    });

    // T020
    it('"Complete Purchase" button is enabled with items and calls handleBeforeCheckout', async () => {
        const user = userEvent.setup();
        const handleBeforeCheckout = vi.fn();
        const items = [makeCartItem({ product: { id: 1, name: 'Pen' }, quantity: 1 })];

        const props = makeCartPanelProps({
            cart: items,
            cartTotal: 10,
            handleBeforeCheckout,
        });

        render(<CartPanel {...props} />);

        const btn = screen.getByText('pos.cart.complete_purchase').closest('button')!;
        expect(btn).not.toBeDisabled();

        await user.click(btn);
        expect(handleBeforeCheckout).toHaveBeenCalledOnce();
    });
});

// ══════════════════════════════════════════════════════
// US3 — Customer Selection & Credit Validation
// ══════════════════════════════════════════════════════

describe('US3: CartPanel — Customer & Credit', () => {
    // T024
    it('header renders CustomerSelector area', () => {
        const props = makeCartPanelProps();
        render(<CartPanel {...props} />);

        // The customer selector's search input should be present
        expect(screen.getByPlaceholderText(/search customer/i)).toBeInTheDocument();
    });

    // T025
    it('blocks checkout when payment is "credit" and no customer selected', async () => {
        const user = userEvent.setup();
        const handleBeforeCheckout = vi.fn();
        const items = [makeCartItem({ product: { id: 1 }, quantity: 1 })];

        const props = makeCartPanelProps({
            cart: items,
            cartTotal: 10,
            paymentMethod: 'credit',
            selectedCustomer: null,
            handleBeforeCheckout,
        });

        render(<CartPanel {...props} />);

        const btn = screen.getByText('pos.cart.complete_purchase').closest('button')!;
        await user.click(btn);

        // Should NOT call handleBeforeCheckout
        expect(handleBeforeCheckout).not.toHaveBeenCalled();
        // Should show warning toast
        expect(toast.warning).toHaveBeenCalledWith('pos.cart.credit_requires_customer');
    });

    // T026
    it('Escape key calls setSelectedCustomer(null)', async () => {
        const user = userEvent.setup();
        const setSelectedCustomer = vi.fn();

        const props = makeCartPanelProps({
            setSelectedCustomer,
        });

        const { container } = render(<CartPanel {...props} />);

        // Focus the panel root
        const root = container.firstElementChild as HTMLElement;
        root.focus();

        await user.keyboard('{Escape}');
        expect(setSelectedCustomer).toHaveBeenCalledWith(null);
    });
});

// ══════════════════════════════════════════════════════
// US4 — Financial Summary & Promo Badges
// ══════════════════════════════════════════════════════

describe('US4: CartSummary', () => {
    // T030
    it('displays subtotal formatted with formatCurrency', () => {
        render(
            <CartSummary
                subtotal={42.5}
                savings={0}
                formatCurrency={defaultFormatCurrency}
            />,
        );

        expect(screen.getByText('$42.50')).toBeInTheDocument();
    });

    // T031
    it('displays savings line when > 0 and hides it when = 0', () => {
        const { rerender } = render(
            <CartSummary subtotal={50} savings={5} formatCurrency={defaultFormatCurrency} />,
        );

        expect(screen.getByText('−$5.00')).toBeInTheDocument();
        expect(screen.getByText('pos.cart.promo_savings')).toBeInTheDocument();

        // Re-render with 0 savings
        rerender(
            <CartSummary subtotal={50} savings={0} formatCurrency={defaultFormatCurrency} />,
        );

        expect(screen.queryByText('pos.cart.promo_savings')).not.toBeInTheDocument();
    });
});

describe('US4: CartItemRow — Promotion badge', () => {
    // T032
    it('displays promotion discount badge when promotion is not null', () => {
        const item = makeCartItem({
            product: { id: 1, name: 'Soda', selling_price: 5 },
            quantity: 2,
        });

        const promo: PromotionResult = {
            productId: 1,
            promotionId: 10,
            promotionName: 'Summer Sale',
            promotionType: 'percentage',
            discountAmount: 2,
            description: '20% off',
        };

        render(
            <CartItemRow
                item={item}
                promotion={promo}
                onIncrement={vi.fn()}
                onDecrement={vi.fn()}
                onRemove={vi.fn()}
                isAtMaxStock={false}
                formatCurrency={defaultFormatCurrency}
            />,
        );

        expect(screen.getByText('−$2.00')).toBeInTheDocument();
    });

    it('does NOT display promotion badge when promotion is null', () => {
        const item = makeCartItem({
            product: { id: 1, name: 'Soda', selling_price: 5 },
            quantity: 2,
        });

        render(
            <CartItemRow
                item={item}
                promotion={null}
                onIncrement={vi.fn()}
                onDecrement={vi.fn()}
                onRemove={vi.fn()}
                isAtMaxStock={false}
                formatCurrency={defaultFormatCurrency}
            />,
        );

        // No savings badge shown
        expect(screen.queryByText(/−\$/)).not.toBeInTheDocument();
    });
});

// ══════════════════════════════════════════════════════
// US5 — Clear Cart
// ══════════════════════════════════════════════════════

describe('US5: CartPanel — Clear Cart', () => {
    // T036
    it('shows clear cart button when cart has items', () => {
        const items = [makeCartItem({ product: { id: 1 }, quantity: 1 })];
        const props = makeCartPanelProps({ cart: items, cartTotal: 10 });

        render(<CartPanel {...props} />);

        const clearBtn = screen.getByRole('button', { name: /pos\.cart\.clear_all/i });
        expect(clearBtn).toBeInTheDocument();
    });

    it('does NOT show clear cart button when cart is empty', () => {
        const props = makeCartPanelProps({ cart: [], cartTotal: 0 });
        render(<CartPanel {...props} />);

        expect(screen.queryByRole('button', { name: /pos\.cart\.clear_all/i })).not.toBeInTheDocument();
    });

    // T037
    it('clear cart button triggers confirmation dialog and confirming clears cart', async () => {
        const user = userEvent.setup();
        const clearCart = vi.fn();
        const items = [makeCartItem({ product: { id: 1 }, quantity: 1 })];

        const props = makeCartPanelProps({
            cart: items,
            cartTotal: 10,
            clearCart,
        });

        render(<CartPanel {...props} />);

        // Click the clear button
        const clearBtn = screen.getByRole('button', { name: /pos\.cart\.clear_all/i });
        await user.click(clearBtn);

        // Confirmation dialog should appear
        const dialog = screen.getByTestId('confirm-dialog');
        expect(dialog).toBeInTheDocument();

        // Click confirm
        await user.click(within(dialog).getByText('confirm'));
        expect(clearCart).toHaveBeenCalledOnce();
    });
});
