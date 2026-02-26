import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { ShoppingBag, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { AnimatePresence } from 'framer-motion';
import { formatCurrency } from '@/lib/utils';
import type { CartItem, Customer, PromotionApplicationResult, PromotionResult } from '@/lib/types';
import CartItemRow from './CartItemRow';
import CartSummary from './CartSummary';
import PaymentMethodGrid from './PaymentMethodGrid';
import CustomerSelector from './CustomerSelector';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';

export interface CartPanelProps {
    // Cart data
    cart: CartItem[];
    cartTotal: number;
    promotionResult: PromotionApplicationResult | null;

    // Cart actions
    addToCart: (item: CartItem) => Promise<void>;
    updateCartItem: (productId: number, quantity: number) => Promise<void>;
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

export default function CartPanel({
    cart,
    cartTotal,
    promotionResult,
    addToCart,
    updateCartItem,
    removeFromCart,
    clearCart,
    selectedCustomer,
    setSelectedCustomer,
    paymentMethod,
    setPaymentMethod,
    handleBeforeCheckout,
    isCheckingOut,
    stockError,
    clearStockError,
}: CartPanelProps) {
    const { t } = useTranslation();
    const rootRef = useRef<HTMLDivElement>(null);
    const [showClearConfirm, setShowClearConfirm] = useState(false);

    // Auto-focus panel on mount
    useEffect(() => {
        rootRef.current?.focus();
    }, []);

    // Stock error toast
    useEffect(() => {
        if (stockError) {
            toast.warning(
                t('pos.cart.stock_limit_reached', {
                    product: stockError.productName,
                    available: stockError.available,
                }),
            );
            clearStockError();
        }
    }, [stockError, clearStockError, t]);

    // Build promo lookup map: productId → PromotionResult
    const promoMap = useMemo(() => {
        const map = new Map<number, PromotionResult>();
        if (promotionResult?.itemDiscounts) {
            for (const d of promotionResult.itemDiscounts) {
                map.set(d.productId, d);
            }
        }
        return map;
    }, [promotionResult]);

    const savings = promotionResult?.totalSavings ?? 0;
    const grandTotal = cartTotal - savings;

    // Callbacks for cart item actions
    const handleIncrement = useCallback(
        (productId: number) => {
            const item = cart.find((c) => c.product.id === productId);
            if (item) {
                addToCart({ product: item.product, quantity: 1, discount: 0 });
            }
        },
        [cart, addToCart],
    );

    const handleDecrement = useCallback(
        (productId: number) => {
            const item = cart.find((c) => c.product.id === productId);
            if (!item) return;
            if (item.quantity <= 1) {
                removeFromCart(productId);
            } else {
                updateCartItem(productId, item.quantity - 1);
            }
        },
        [cart, updateCartItem, removeFromCart],
    );

    // Checkout with credit guard
    const handleCheckout = useCallback(() => {
        if (cart.length === 0) return;
        if (paymentMethod === 'credit' && !selectedCustomer) {
            toast.warning(t('pos.cart.credit_requires_customer'));
            return;
        }
        handleBeforeCheckout();
    }, [cart.length, paymentMethod, selectedCustomer, handleBeforeCheckout, t]);

    // Scroll tracking — detect if user can scroll down
    const scrollRef = useRef<HTMLDivElement>(null);
    const [canScrollDown, setCanScrollDown] = useState(false);

    const checkScroll = useCallback(() => {
        const el = scrollRef.current;
        if (!el) return;
        const threshold = 8;
        setCanScrollDown(el.scrollHeight - el.scrollTop - el.clientHeight > threshold);
    }, []);

    useEffect(() => {
        checkScroll();
    }, [cart, checkScroll]);

    // Keyboard shortcuts
    const handleKeyDown = useCallback(
        (e: React.KeyboardEvent) => {
            const target = e.target as HTMLElement;
            if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;

            if (e.key === 'Enter') {
                e.preventDefault();
                handleCheckout();
            } else if (e.key === 'Escape') {
                e.preventDefault();
                setSelectedCustomer(null);
            }
        },
        [handleCheckout, setSelectedCustomer],
    );

    return (
        <div
            ref={rootRef}
            tabIndex={-1}
            onKeyDown={handleKeyDown}
            className="w-[340px] h-full shrink-0 bg-white flex flex-col outline-none border-l border-zinc-100"
        >
            {/* ═══ HEADER ═══ */}
            <div className="px-4 pt-4 pb-3 space-y-3">
                {/* Title row */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-black/20" />
                        <span className="text-[9px] text-zinc-400 font-bold uppercase tracking-[0.3em]">
                            {t('pos.cart.title')}
                        </span>
                        {cart.length > 0 && (
                            <span className="text-[9px] font-bold text-zinc-300 tabular-nums">
                                {t('pos.cart.items_count', { count: cart.length })}
                            </span>
                        )}
                    </div>
                    {/* Clear cart button */}
                    {cart.length > 0 && (
                        <button
                            type="button"
                            onClick={() => setShowClearConfirm(true)}
                            className="px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider text-zinc-400 hover:text-red-500 hover:bg-red-50 transition-colors active:scale-95"
                            aria-label={t('pos.cart.clear_all')}
                        >
                            {t('pos.cart.clear_all')}
                        </button>
                    )}
                </div>

                {/* Customer selector */}
                <CustomerSelector
                    onSelect={setSelectedCustomer}
                    selectedCustomer={selectedCustomer}
                />
            </div>

            {/* Dashed separator */}
            <div className="border-t border-dashed border-zinc-200" />

            {/* ═══ BODY ═══ */}
            <div className="h-0 grow flex flex-col overflow-hidden">
                {/* Cart items — scrollable (~80%) */}
                {cart.length === 0 ? (
                    /* Empty state */
                    <div className="flex-1 flex flex-col items-center justify-center gap-3 px-8">
                        <div className="w-14 h-14 rounded-2xl bg-zinc-50 flex items-center justify-center">
                            <ShoppingBag size={24} className="text-zinc-300" />
                        </div>
                        <div className="text-center">
                            <p className="text-sm font-black text-zinc-300 uppercase tracking-wider">
                                {t('pos.cart.no_items_yet')}
                            </p>
                            <p className="text-[11px] text-zinc-300 font-medium mt-1">
                                {t('pos.cart.empty_hint')}
                            </p>
                        </div>
                    </div>
                ) : (
                    <>
                        {/* Scrollable cart items — absolute fill for guaranteed scroll */}
                        <div className="relative h-0 grow">
                            <div
                                ref={scrollRef}
                                onScroll={checkScroll}
                                className="absolute inset-0 overflow-y-auto scrollbar-hide scrollable divide-y divide-zinc-50"
                                style={{ touchAction: 'pan-y' }}
                            >
                                <AnimatePresence initial={false}>
                                    {cart.map((item) => (
                                        <CartItemRow
                                            key={item.product.id}
                                            item={item}
                                            promotion={promoMap.get(item.product.id) ?? null}
                                            onIncrement={handleIncrement}
                                            onDecrement={handleDecrement}
                                            onRemove={removeFromCart}
                                            isAtMaxStock={item.quantity >= item.product.stock_quantity}
                                            formatCurrency={formatCurrency}
                                        />
                                    ))}
                                </AnimatePresence>
                            </div>

                            {/* White fade at bottom */}
                            {canScrollDown && (
                                <div className="absolute bottom-0 left-0 right-0 pointer-events-none z-10">
                                    <div className="w-full h-8 bg-gradient-to-t from-white to-transparent" />
                                </div>
                            )}
                        </div>

                        {/* Financial summary — pinned at bottom of body */}
                        <CartSummary
                            subtotal={cartTotal}
                            savings={savings}
                            formatCurrency={formatCurrency}
                        />
                    </>
                )}
            </div>

            {/* ═══ FOOTER ═══ */}
            <div className="px-4 pb-4 pt-3 space-y-3 border-t border-dashed border-zinc-200">
                {/* Grand total */}
                <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-zinc-400 uppercase tracking-wider">
                        {t('pos.cart.grand_total')}
                    </span>
                    <span className="text-4xl font-black text-black tabular-nums tracking-tight">
                        {formatCurrency(grandTotal)}
                    </span>
                </div>

                {/* Payment method grid */}
                <PaymentMethodGrid
                    selected={paymentMethod}
                    onSelect={setPaymentMethod}
                />

                {/* Complete Purchase button */}
                <button
                    type="button"
                    onClick={handleCheckout}
                    disabled={cart.length === 0 || isCheckingOut}
                    className="w-full py-3.5 bg-black text-white rounded-xl text-[10px] font-black uppercase tracking-[0.25em] transition-all active:scale-[0.98] hover:bg-zinc-800 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-black flex items-center justify-center gap-2"
                >
                    {isCheckingOut ? (
                        <>
                            <Loader2 size={14} className="animate-spin" />
                            {t('pos.cart.processing')}
                        </>
                    ) : (
                        t('pos.cart.complete_purchase')
                    )}
                </button>
            </div>

            {/* Clear cart confirmation */}
            <ConfirmDialog
                isOpen={showClearConfirm}
                onClose={() => setShowClearConfirm(false)}
                onConfirm={() => {
                    clearCart();
                    setShowClearConfirm(false);
                }}
                title={t('pos.cart.clear_all')}
                description={t('pos.cart.empty_alert_hint')}
                confirmLabel={t('pos.cart.clear_all')}
                variant="warning"
            />
        </div>
    );
}
