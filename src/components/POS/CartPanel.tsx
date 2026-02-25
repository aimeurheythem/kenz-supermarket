import { memo, useState, useRef, useEffect } from 'react';
import { ShoppingCart, Trash2, CreditCard, Banknote, Smartphone, X, Printer, Wallet, ChevronsDown, Tag, Package } from 'lucide-react';
import { cn, formatCurrency } from '@/lib/utils';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import CustomerSelector from '@/components/POS/CustomerSelector';
import type { CartItem, Customer, PromotionApplicationResult } from '@/lib/types';
import type { ProductStyle } from '@/lib/product-styles';

interface CartPanelProps {
    cart: CartItem[];
    cartTotal: number;
    promotionResult?: PromotionApplicationResult | null;
    clearCart: () => void;
    removeFromCart: (productId: number) => void;
    paymentMethod: 'cash' | 'card' | 'mobile' | 'credit';
    setPaymentMethod: (method: 'cash' | 'card' | 'mobile' | 'credit') => void;
    selectedCustomer: Customer | null;
    setSelectedCustomer: (customer: Customer | null) => void;
    printReceipt: boolean;
    setPrintReceipt: (value: boolean) => void;
    handleBeforeCheckout: () => void;
    isCheckingOut: boolean;
    getProductStyle: (id: string | number) => ProductStyle;
}

function CartPanelComponent({
    cart,
    cartTotal,
    promotionResult,
    clearCart,
    removeFromCart,
    paymentMethod,
    setPaymentMethod,
    selectedCustomer,
    setSelectedCustomer,
    printReceipt,
    setPrintReceipt,
    handleBeforeCheckout,
    isCheckingOut,
    getProductStyle,
}: CartPanelProps) {
    const { t } = useTranslation();
    const [canScrollMore, setCanScrollMore] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);
    const promoSavings = promotionResult?.totalSavings ?? 0;
    const grandTotal = Math.max(0, cartTotal - promoSavings);

    useEffect(() => {
        const el = scrollRef.current;
        if (!el) return;
        const check = () => setCanScrollMore(el.scrollTop + el.clientHeight < el.scrollHeight - 20);
        // Use a small timeout to let the DOM paint before measuring
        const id = setTimeout(check, 50);
        return () => clearTimeout(id);
    }, [cart]);

    return (
        <div className="relative z-10 w-full h-full flex flex-col bg-gray-100 p-3 overflow-hidden">
            {/* ── Ticket Card ── */}
            <div className="relative flex-1 min-h-0 flex flex-col bg-white rounded-[2.5rem] shadow-xl overflow-hidden">

                {/* ══ TOP HALF — scrollable items ══ */}
                <div className="flex-1 min-h-0 flex flex-col overflow-hidden rounded-t-[2.5rem]">
                    <div className="px-6 pt-6 pb-0 flex-shrink-0">
                        <div className="mb-4">
                            <CustomerSelector selectedCustomer={selectedCustomer} onSelect={setSelectedCustomer} />
                        </div>
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex flex-col gap-0.5">
                                <span className="text-[9px] text-zinc-400 uppercase tracking-[0.25em] font-bold">
                                    {t('pos.cart.new_order')}
                                </span>
                                <h3 className="text-xl font-black text-black tracking-tighter uppercase leading-none">
                                    {t('pos.cart.title')}
                                </h3>
                            </div>
                            <button
                                onClick={clearCart}
                                disabled={cart.length === 0}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-100 text-zinc-400 hover:bg-red-50 hover:text-red-400 text-[9px] font-black uppercase tracking-widest transition-all disabled:opacity-0"
                            >
                                <Trash2 size={11} strokeWidth={3} />
                                {t('pos.cart.clear_all')}
                            </button>
                        </div>
                    </div>

                    {/* Items scroll area */}
                    <div className="relative flex-1 min-h-0 overflow-hidden">
                        <div
                            ref={scrollRef}
                            className="absolute inset-0 overflow-y-auto scrollbar-hide px-6"
                            style={{ touchAction: 'pan-y' }}
                            onScroll={(e) => {
                                const el = e.currentTarget;
                                setCanScrollMore(el.scrollTop + el.clientHeight < el.scrollHeight - 20);
                            }}
                        >
                            {cart.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center space-y-3 opacity-[0.08] py-10">
                                    <ShoppingCart size={64} className="text-black" strokeWidth={1} />
                                    <p className="text-[10px] font-black uppercase tracking-[0.4em]">{t('pos.cart.empty')}</p>
                                </div>
                            ) : (
                                <div className="space-y-2 py-3">
                                    {cart.map((item) => {
                                        const appliedPromo = promotionResult?.itemDiscounts.find(
                                            (d) => d.productId === item.product.id,
                                        );
                                        const originalTotal = item.product.selling_price * item.quantity;
                                        const discountedTotal = appliedPromo
                                            ? Math.max(0, originalTotal - appliedPromo.discountAmount)
                                            : originalTotal;

                                        const accentBar = appliedPromo
                                            ? appliedPromo.promotionType === 'quantity_discount'
                                                ? 'border-l-4 border-purple-300 bg-purple-50/50 pl-3'
                                                : 'border-l-4 border-amber-300 bg-amber-50/50 pl-3'
                                            : 'pl-0';
                                        const badgeBg = appliedPromo
                                            ? appliedPromo.promotionType === 'quantity_discount'
                                                ? 'bg-purple-100 text-purple-700'
                                                : 'bg-amber-100 text-amber-700'
                                            : '';
                                        const priceColor = appliedPromo
                                            ? appliedPromo.promotionType === 'quantity_discount'
                                                ? 'text-purple-600'
                                                : 'text-amber-600'
                                            : 'text-black';

                                        return (
                                            <div
                                                key={item.product.id}
                                                className={cn(
                                                    'flex items-center justify-between rounded-2xl pr-2 py-2 transition-colors',
                                                    accentBar,
                                                )}
                                            >
                                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                                    <div
                                                        className={cn(
                                                            'w-10 h-10 rounded-xl flex items-center justify-center shrink-0',
                                                            getProductStyle(item.product.id).bg,
                                                        )}
                                                    >
                                                        <span className="text-[11px] font-black text-black">×{item.quantity}</span>
                                                    </div>
                                                    <div className="flex flex-col min-w-0">
                                                        <span className="text-[11px] font-black text-black uppercase tracking-tight truncate leading-tight">
                                                            {item.product.name}
                                                        </span>
                                                        <span className="text-[10px] font-bold text-zinc-400">
                                                            {formatCurrency(item.product.selling_price)}
                                                        </span>
                                                        {appliedPromo && (
                                                            <span className={cn(
                                                                'inline-flex items-center gap-1 mt-0.5 text-[9px] font-black tracking-wider uppercase px-2 py-0.5 rounded-full w-fit',
                                                                badgeBg,
                                                            )}>
                                                                <Tag size={8} strokeWidth={3} />
                                                                -{formatCurrency(appliedPromo.discountAmount)}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2 shrink-0">
                                                    <div className="flex flex-col items-end">
                                                        {appliedPromo ? (
                                                            <>
                                                                <span className="text-[10px] font-bold text-zinc-300 line-through">
                                                                    {formatCurrency(originalTotal)}
                                                                </span>
                                                                <span className={cn('text-sm font-black tracking-tighter', priceColor)}>
                                                                    {formatCurrency(discountedTotal)}
                                                                </span>
                                                            </>
                                                        ) : (
                                                            <span className="text-sm font-black text-black tracking-tighter">
                                                                {formatCurrency(originalTotal)}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <button
                                                        onClick={() => removeFromCart(item.product.id)}
                                                        className="w-8 h-8 flex items-center justify-center rounded-xl bg-zinc-100 text-zinc-400 hover:bg-red-500 hover:text-white active:scale-95 transition-all"
                                                    >
                                                        <Trash2 size={13} strokeWidth={2.5} />
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}

                                    {/* Bundle discount cards */}
                                    {(promotionResult?.bundleDiscounts ?? []).length > 0 && (
                                        <div className="mt-2 space-y-2">
                                            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-orange-500 flex items-center gap-1.5 px-1">
                                                <Package size={10} strokeWidth={3} />
                                                {t('pos.cart.bundle_deals', 'Bundle Deals')}
                                            </p>
                                            {promotionResult!.bundleDiscounts.map((bundle) => {
                                                const bundleProducts = cart
                                                    .filter((c) => bundle.productIds.includes(c.product.id))
                                                    .map((c) => c.product.name);
                                                return (
                                                    <div
                                                        key={bundle.promotionId}
                                                        className="rounded-2xl bg-orange-50 border-l-4 border-orange-300 px-3 py-2"
                                                    >
                                                        <div className="flex items-center justify-between mb-1">
                                                            <span className="text-[11px] font-black text-orange-700 flex items-center gap-1.5">
                                                                <Package size={10} strokeWidth={2.5} />
                                                                {bundle.promotionName}
                                                            </span>
                                                            <span className="text-[10px] font-black text-orange-600 bg-orange-100 px-2 py-0.5 rounded-full">
                                                                -{formatCurrency(bundle.savings)}
                                                            </span>
                                                        </div>
                                                        <p className="text-[10px] text-orange-400 truncate">
                                                            {bundleProducts.join(' · ')}
                                                        </p>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Scroll fade hint */}
                        {cart.length > 0 && (
                            <div
                                className="absolute bottom-0 left-0 right-0 z-20 pointer-events-none transition-opacity duration-300"
                                style={{ opacity: canScrollMore ? 1 : 0 }}
                            >
                                <div
                                    className="h-16"
                                    style={{ background: 'linear-gradient(to top, #ffffff 0%, rgba(255,255,255,0) 100%)' }}
                                />
                                <div className="absolute bottom-2 left-0 right-0 flex justify-center">
                                    <ChevronsDown size={13} className="text-zinc-300 animate-bounce" />
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* ══ PERFORATION ══ */}
                <div className="relative flex-shrink-0 flex items-center py-3">
                    {/* Left punch hole — semicircle notch */}
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 w-6 h-6 bg-gray-100 rounded-full z-10" />
                    {/* Right punch hole — semicircle notch */}
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-6 h-6 bg-gray-100 rounded-full z-10" />
                    {/* Dashed line */}
                    <div className="flex-1 border-t-2 border-dashed border-zinc-200 mx-6" />
                </div>

                {/* ══ BOTTOM HALF — totals + payment + checkout ══ */}
                <div className="flex-shrink-0 px-6 pb-6 pt-0 space-y-4 rounded-b-[2.5rem]">

                    {/* Totals */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                            <span>{t('pos.cart.subtotal')}</span>
                            <span className="text-zinc-600">{formatCurrency(cartTotal)}</span>
                        </div>
                        {promoSavings > 0 && (
                            <div className="flex items-center justify-between">
                                <span className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-emerald-600">
                                    <Tag size={10} strokeWidth={3} />
                                    {t('pos.cart.promo_savings', 'Savings')}
                                </span>
                                <span className="text-[10px] font-black text-emerald-600">-{formatCurrency(promoSavings)}</span>
                            </div>
                        )}
                        <div className="flex items-end justify-between pt-2 border-t border-zinc-100">
                            <span className="text-[9px] font-black text-zinc-400 uppercase tracking-[0.2em]">
                                {t('pos.cart.grand_total')}
                            </span>
                            <span className="text-3xl font-black text-black tracking-tighter italic leading-none">
                                {formatCurrency(grandTotal)}
                            </span>
                        </div>
                    </div>

                    {/* Payment methods */}
                    <div className="grid grid-cols-4 gap-2">
                        {[
                            { key: 'cash' as const, icon: Banknote, label: t('pos.cart.pay_cash') },
                            { key: 'card' as const, icon: CreditCard, label: t('pos.cart.pay_card') },
                            { key: 'mobile' as const, icon: Smartphone, label: 'E-Pay' },
                            { key: 'credit' as const, icon: Wallet, label: 'Credit' },
                        ].map((method) => (
                            <button
                                key={method.key}
                                onClick={() => setPaymentMethod(method.key)}
                                className={cn(
                                    'flex flex-col items-center gap-1.5 py-3 rounded-2xl text-[9px] font-black uppercase tracking-wider transition-all',
                                    paymentMethod === method.key
                                        ? 'bg-black text-white shadow-sm'
                                        : 'bg-zinc-100 text-zinc-400 hover:bg-zinc-200',
                                )}
                            >
                                <method.icon size={15} strokeWidth={paymentMethod === method.key ? 2.5 : 2} />
                                {method.label}
                            </button>
                        ))}
                    </div>

                    {/* Print receipt toggle */}
                    <div className="flex items-center justify-between px-1">
                        <div className="flex items-center gap-2 text-zinc-400">
                            <Printer size={13} strokeWidth={2} />
                            <span className="text-[10px] font-bold uppercase tracking-wider">{t('pos.print.yes', 'Print Receipt')}</span>
                        </div>
                        <button
                            onClick={() => setPrintReceipt(!printReceipt)}
                            className={cn(
                                'relative w-10 h-5 rounded-full transition-colors duration-200',
                                printReceipt ? 'bg-black' : 'bg-zinc-200',
                            )}
                        >
                            <span
                                className={cn(
                                    'absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-all duration-200',
                                    printReceipt ? 'translate-x-5' : 'translate-x-0.5',
                                )}
                            />
                        </button>
                    </div>

                    {/* Checkout button */}
                    <motion.button
                        onClick={handleBeforeCheckout}
                        disabled={isCheckingOut || cart.length === 0}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className={cn(
                            'w-full py-4 rounded-[2rem] font-black text-sm uppercase tracking-[0.3em] transition-all',
                            isCheckingOut || cart.length === 0
                                ? 'bg-zinc-100 text-zinc-300 cursor-not-allowed'
                                : 'bg-black text-white hover:bg-zinc-800 shadow-lg',
                        )}
                    >
                        {isCheckingOut ? t('pos.cart.processing', 'Processing...') : t('pos.cart.checkout')}
                    </motion.button>
                </div>
            </div>
        </div>
    );
}

export default memo(CartPanelComponent);
