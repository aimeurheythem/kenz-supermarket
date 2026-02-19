import { ShoppingCart, Trash2, CreditCard, Banknote, Smartphone, X, Printer, Wallet } from 'lucide-react';
import { cn, formatCurrency } from '@/lib/utils';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import CustomerSelector from '@/components/POS/CustomerSelector';
import type { CartItem, Customer } from '@/lib/types';
import type { ProductStyle } from '@/lib/product-styles';

interface CartPanelProps {
    cart: CartItem[];
    cartTotal: number;
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

export default function CartPanel({
    cart,
    cartTotal,
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

    return (
        <div className="relative z-10 w-full lg:w-[450px] lg:sticky lg:top-8 flex flex-col bg-white rounded-[3rem] border-2 border-gray-200 shadow-none overflow-hidden">
            <div className="p-10 pb-0">
                <div className="mb-6">
                    <CustomerSelector selectedCustomer={selectedCustomer} onSelect={setSelectedCustomer} />
                </div>
                <div className="flex items-center justify-between mb-8">
                    <div className="flex flex-col gap-1">
                        <span className="text-[10px] text-zinc-400 uppercase tracking-[0.2em] font-bold">
                            {t('pos.cart.new_order')}
                        </span>
                        <h3 className="text-2xl font-black text-black tracking-tighter uppercase">
                            {t('pos.cart.title')}
                        </h3>
                    </div>
                    <motion.button
                        onClick={clearCart}
                        disabled={cart.length === 0}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className={cn(
                            'relative px-5 py-2.5 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all duration-300 disabled:opacity-0 shadow-sm border-none',
                            'bg-black hover:bg-yellow-400 text-white hover:text-black',
                        )}
                    >
                        <span className="relative z-10 flex items-center gap-2">
                            <Trash2 size={12} strokeWidth={3} />
                            {t('pos.cart.clear_all')}
                        </span>
                    </motion.button>
                </div>
            </div>

            <div className="px-10 space-y-4">
                {cart.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center space-y-4 opacity-10">
                        <ShoppingCart size={80} className="text-black" strokeWidth={1} />
                        <p className="text-[10px] font-black uppercase tracking-[0.4em]">{t('pos.cart.empty')}</p>
                    </div>
                ) : (
                    <div className="space-y-6 py-4">
                        {cart.map((item) => (
                            <div key={item.product.id} className="flex items-center justify-between group">
                                <div className="flex items-center gap-4 flex-1">
                                    <div
                                        className={cn(
                                            'w-12 h-12 rounded-2xl flex items-center justify-center shrink-0',
                                            getProductStyle(item.product.id).bg,
                                        )}
                                    >
                                        <span className="text-[12px] font-black text-black">x{item.quantity}</span>
                                    </div>
                                    <div className="flex flex-col min-w-0">
                                        <span className="text-sm font-black text-black uppercase tracking-tight truncate">
                                            {item.product.name}
                                        </span>
                                        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                                            {formatCurrency(item.product.selling_price)}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-black text-black tracking-tighter">
                                        {formatCurrency(item.product.selling_price * item.quantity)}
                                    </span>
                                    <button
                                        onClick={() => removeFromCart(item.product.id)}
                                        className="p-1.5 text-zinc-300 hover:text-red-500 transition-colors"
                                    >
                                        <X size={14} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="p-10 pt-6 space-y-8 bg-zinc-50/50">
                <div className="space-y-4">
                    <div className="flex items-center justify-between text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                        <span>{t('pos.cart.subtotal')}</span>
                        <span className="text-black">{formatCurrency(cartTotal)}</span>
                    </div>
                    <div className="flex items-center justify-between text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                        <span>{t('pos.cart.service_fee')}</span>
                        <span className="text-black">{formatCurrency(0)}</span>
                    </div>
                    <div className="pt-6 border-t border-zinc-200 flex items-center justify-between">
                        <span className="text-xs font-black text-black uppercase tracking-widest">
                            {t('pos.cart.grand_total')}
                        </span>
                        <span className="text-4xl font-black text-black tracking-tighter italic">
                            {formatCurrency(cartTotal)}
                        </span>
                    </div>
                </div>

                <div className="flex gap-4">
                    {[
                        { key: 'cash' as const, icon: Banknote, label: 'Cash' },
                        { key: 'card' as const, icon: CreditCard, label: 'Card' },
                        { key: 'mobile' as const, icon: Smartphone, label: 'E-Pay' },
                        { key: 'credit' as const, icon: Wallet, label: 'Credit' },
                    ].map((method) => (
                        <button
                            key={method.key}
                            onClick={() => setPaymentMethod(method.key)}
                            className={cn(
                                'flex-1 flex flex-col items-center gap-3 py-5 rounded-[2rem] transition-all duration-300 relative group overflow-hidden',
                                paymentMethod === method.key
                                    ? 'bg-yellow-400 text-black'
                                    : 'bg-zinc-100 text-zinc-400 hover:bg-zinc-200',
                            )}
                        >
                            <method.icon size={24} strokeWidth={paymentMethod === method.key ? 3 : 2.5} />
                            <span
                                className={cn(
                                    'text-[10px] font-black uppercase tracking-widest transition-opacity',
                                    paymentMethod === method.key ? 'opacity-100' : 'opacity-60',
                                )}
                            >
                                {t(
                                    method.label === 'Cash'
                                        ? 'pos.cart.pay_cash'
                                        : method.label === 'Card'
                                          ? 'pos.cart.pay_card'
                                          : method.label === 'Credit'
                                            ? 'Credit'
                                            : 'pos.cart.pay_mobile',
                                )}
                            </span>
                        </button>
                    ))}
                </div>

                <div className="flex bg-zinc-200/50 p-1 rounded-2xl">
                    <button
                        onClick={() => setPrintReceipt(true)}
                        className={cn(
                            'flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all gap-2 flex items-center justify-center',
                            printReceipt ? 'bg-white text-black shadow-sm' : 'text-zinc-400 hover:text-zinc-600',
                        )}
                    >
                        <Printer size={14} className={printReceipt ? 'text-black' : 'text-zinc-400'} />
                        {t('pos.print.yes', 'Receipt')}
                    </button>
                    <button
                        onClick={() => setPrintReceipt(false)}
                        className={cn(
                            'flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all gap-2 flex items-center justify-center',
                            !printReceipt ? 'bg-white text-black shadow-sm' : 'text-zinc-400 hover:text-zinc-600',
                        )}
                    >
                        <span className={!printReceipt ? 'text-black' : 'text-zinc-400'}>✕</span>
                        {t('pos.print.no', 'No Receipt')}
                    </button>
                </div>

                <motion.button
                    onClick={handleBeforeCheckout}
                    disabled={isCheckingOut || cart.length === 0}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={cn(
                        'w-full py-6 rounded-[2.5rem] font-black text-sm uppercase tracking-[0.3em] transition-all',
                        isCheckingOut || cart.length === 0
                            ? 'bg-zinc-200 text-zinc-400 cursor-not-allowed shadow-none'
                            : 'bg-yellow-400 text-black hover:bg-yellow-300 shadow-xl shadow-yellow-400/20',
                    )}
                >
                    {isCheckingOut ? t('pos.cart.processing', 'Processing...') : t('pos.cart.checkout')}
                </motion.button>
            </div>
        </div>
    );
}
