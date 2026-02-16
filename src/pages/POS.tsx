// Fixed POS.tsx
import { useState, useEffect, useRef, useCallback } from 'react';
import {
    ShoppingCart,
    Plus,
    Minus,
    Trash2,
    Search,
    CreditCard,
    Banknote,
    Smartphone,
    CheckCircle,
    X,
    Barcode,
    ShoppingBag,
    Zap,
    ArrowRight,
    Settings2,
    Pencil,
    Printer,
    Wallet
} from 'lucide-react';
import { cn, formatCurrency } from '@/lib/utils';
import { useProductStore } from '@/stores/useProductStore';
import { useSaleStore } from '@/stores/useSaleStore';
import { useAuthStore } from '@/stores/useAuthStore';
import { useQuickAccessStore } from '@/stores/useQuickAccessStore';
import Portal from '@/components/common/Portal';
import Button from '@/components/common/Button';
import BarcodeScanner from '@/components/common/BarcodeScanner';
import type { Product, QuickAccessItem, QuickAccessOption } from '@/lib/types';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import FlashDealsPromotions from '@/components/POS/FlashDealsPromotions';
import QuickAccess from '@/components/POS/QuickAccess';
import InventoryPreview from '@/components/POS/InventoryPreview';
import CheckoutSimulation from '@/components/POS/CheckoutSimulation';
import ReceiptPreview from '@/components/POS/ReceiptPreview';
import CustomerSelector from '@/components/POS/CustomerSelector';
import type { Sale, SaleItem, Customer } from '@/lib/types';

export default function POS() {
    const { t, i18n } = useTranslation();
    const { products, loadProducts, getByBarcode } = useProductStore();
    const { cart, addToCart, updateCartItem, removeFromCart, clearCart, getCartTotal, checkout } = useSaleStore();
    const { user, currentSession, getCurrentSessionId, closeCashierSession } = useAuthStore();
    const { items: quickAccessItems, fetchItems, addItem, updateItem, deleteItem } = useQuickAccessStore();

    const [searchQuery, setSearchQuery] = useState('');
    const [showSimulation, setShowSimulation] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'mobile' | 'credit'>('cash');
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
    const [promoIndex, setPromoIndex] = useState(0);
    const [isManagerOpen, setIsManagerOpen] = useState(false);
    const [showReceipt, setShowReceipt] = useState(false);
    const [lastSale, setLastSale] = useState<Sale | null>(null);
    const [lastSaleItems, setLastSaleItems] = useState<SaleItem[]>([]);
    const [printReceipt, setPrintReceipt] = useState(true);
    const [showScanner, setShowScanner] = useState(false);

    const [currentTime, setCurrentTime] = useState(new Date());
    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const searchInputRef = useRef<HTMLInputElement>(null);

    const barcodeBuffer = useRef('');
    const barcodeTimer = useRef<NodeJS.Timeout | null>(null);

    const handleBarcodeInput = useCallback(async (e: KeyboardEvent) => {
        const target = e.target as HTMLElement;
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;

        if (e.key === 'Enter' && barcodeBuffer.current.length > 3) {
            const barcode = barcodeBuffer.current;
            barcodeBuffer.current = '';
            const product = await getByBarcode(barcode);
            if (product) {
                addToCart({ product, quantity: 1, discount: 0 });
            }
            return;
        }

        if (e.key.length === 1) {
            barcodeBuffer.current += e.key;
            if (barcodeTimer.current) clearTimeout(barcodeTimer.current);
            barcodeTimer.current = setTimeout(() => {
                barcodeBuffer.current = '';
            }, 100);
        }
    }, [getByBarcode, addToCart]);

    useEffect(() => {
        window.addEventListener('keydown', handleBarcodeInput);
        return () => window.removeEventListener('keydown', handleBarcodeInput);
    }, [handleBarcodeInput]);

    useEffect(() => {
        loadProducts();
        fetchItems();
    }, []);

    const filteredProducts = products.filter((p) =>
        !searchQuery ||
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.barcode && p.barcode.includes(searchQuery))
    ).slice(0, 20);

    const productStyles = [
        { bg: 'bg-[#fff5f5]', iconColor: 'text-red-500' },
        { bg: 'bg-[#f0f9ff]', iconColor: 'text-sky-500' },
        { bg: 'bg-[#f0fdf4]', iconColor: 'text-emerald-500' },
        { bg: 'bg-[#fefce8]', iconColor: 'text-yellow-500' },
        { bg: 'bg-[#faf5ff]', iconColor: 'text-purple-500' },
        { bg: 'bg-[#fff7ed]', iconColor: 'text-orange-500' },
        { bg: 'bg-[#f5f3ff]', iconColor: 'text-indigo-500' },
        { bg: 'bg-[#ecfeff]', iconColor: 'text-cyan-500' },
    ];

    const getProductStyle = (id: string | number) => {
        const index = typeof id === 'number' ? id : (id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0));
        return productStyles[index % productStyles.length];
    };

    const handleAddProduct = (product: Product) => {
        if (product.stock_quantity <= 0) return;
        addToCart({ product, quantity: 1, discount: 0 });
    };

    const handleBeforeCheckout = useCallback(() => {
        if (cart.length === 0) return;
        handleFinalizeCheckout();
    }, [cart.length, printReceipt]);

    const handleFinalizeCheckout = useCallback(async () => {
        try {
            const sessionId = getCurrentSessionId();

            const currentItems: SaleItem[] = cart.map((item) => ({
                id: 0,
                sale_id: 0,
                product_id: item.product.id,
                product_name: item.product.name,
                quantity: item.quantity,
                unit_price: item.product.selling_price,
                discount: item.discount,
                total: (item.product.selling_price * item.quantity) - item.discount
            }));

            const sale = await checkout(
                {
                    method: paymentMethod,
                    customer_name: selectedCustomer ? selectedCustomer.full_name : 'Walk-in Customer',
                    customer_id: selectedCustomer?.id
                },
                undefined,
                sessionId || undefined
            );

            setLastSale(sale);
            setLastSaleItems(currentItems);
            setShowSimulation(false);
            setShowReceipt(true);

            setPaymentMethod('cash');
            setSelectedCustomer(null);
            loadProducts();
        } catch (err: any) {
            console.error('Checkout failed:', err);
            alert('Checkout error: ' + (err.message || 'Unknown error'));
            setShowSimulation(false);
        }
    }, [checkout, paymentMethod, selectedCustomer, getCurrentSessionId, loadProducts, cart]);

    const handleEndShift = () => {
        if (confirm('Are you sure you want to end your shift?')) {
            closeCashierSession(0, 'Shift ended by cashier');
        }
    };

    const handleScan = async (code: string) => {
        const product = await getByBarcode(code);
        if (product) {
            addToCart({ product, quantity: 1, discount: 0 });
            setShowScanner(false);
        } else {
            alert(t('pos.scan.not_found', 'Product not found with barcode: ') + code);
        }
    };

    const cartTotal = getCartTotal();

    return (
        <div className="relative flex flex-col lg:flex-row items-start gap-8 p-6 lg:p-8 animate-fadeIn mt-4">
            {/* Grid Background */}
            <div className="absolute inset-0 pointer-events-none opacity-[0.15] rounded-[3rem]"
                style={{
                    backgroundImage: `linear-gradient(to right, rgba(0, 0, 0, 0.3) 1px, transparent 1px), linear-gradient(to bottom, rgba(0, 0, 0, 0.3) 1px, transparent 1px)`,
                    backgroundSize: '32px 32px',
                    maskImage: 'radial-gradient(circle at top center, black, transparent 90%)',
                    WebkitMaskImage: 'radial-gradient(circle at top center, black, transparent 90%)'
                }}
            />

            {/* Left Column: Product Selection */}
            <div className="relative z-10 flex-1 flex flex-col min-w-0">
                {/* Header Section */}
                <div className="flex flex-col space-y-6 pb-6">
                    <div className="flex items-center justify-between">
                        <div className="flex flex-col gap-1">
                            <span className="text-[12px] text-zinc-400 tracking-[0.3em] font-bold">{t('pos.system')}</span>
                            <h2 className="text-3xl font-black text-black tracking-tighter uppercase">{t('pos.title')}</h2>
                        </div>
                        <div className="flex items-center gap-4">
                            {currentSession?.session && (
                                <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-full border-0 shadow-none transition-all hover:bg-zinc-50 group">
                                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                    <span className="text-[10px] font-black text-black uppercase tracking-widest">{user?.full_name}</span>
                                </div>
                            )}
                            <button
                                onClick={() => setShowScanner(true)}
                                className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-md border border-black shadow-lg shadow-black/20 hover:bg-neutral-800 transition-all active:scale-95"
                            >
                                <Barcode size={16} />
                                <span className="text-[10px] font-black uppercase tracking-widest">
                                    {t('pos.scan', 'Scan')}
                                </span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Search Bar */}
                <div className="relative group">
                    <Search size={22} className="absolute left-6 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-black transition-colors" />
                    <input
                        ref={searchInputRef}
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder={t('pos.search_placeholder')}
                        className={cn(
                            "w-full pl-16 pr-16 py-5 rounded-[2.5rem]",
                            "bg-white border border-zinc-200 shadow-none",
                            "text-black placeholder:text-zinc-300 text-lg font-bold",
                            "focus:outline-none focus:ring-0 focus:!outline-none focus-visible:!outline-none focus-visible:ring-0 focus:border-zinc-400 transition-all placeholder:transition-opacity focus:placeholder:opacity-50"
                        )}
                    />
                    {searchQuery && (
                        <motion.button
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            onClick={() => {
                                setSearchQuery('');
                                searchInputRef.current?.focus();
                            }}
                            className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-zinc-100 text-zinc-400 hover:bg-black hover:text-white transition-all duration-300"
                        >
                            <X size={16} strokeWidth={3} />
                        </motion.button>
                    )}
                </div>

                {/* Product Grid Area */}
                <div className="space-y-12 w-full mt-8">
                    {!searchQuery && (
                        <InventoryPreview
                            products={products}
                            cart={cart}
                            formatCurrency={formatCurrency}
                            i18n={i18n}
                            handleAddProduct={handleAddProduct}
                        />
                    )}

                    {!searchQuery && (
                        <QuickAccess
                            user={user}
                            items={quickAccessItems}
                            products={products}
                            cart={cart}
                            addToCart={addToCart}
                            setIsManagerOpen={setIsManagerOpen}
                        />
                    )}

                    {!searchQuery && (
                        <FlashDealsPromotions
                            products={products}
                            cart={cart}
                            promoIndex={promoIndex}
                            setPromoIndex={setPromoIndex}
                            handleAddProduct={handleAddProduct}
                        />
                    )}

                    {searchQuery && (
                        <>
                            <div className="flex items-center justify-between">
                                <span className="text-[12px] text-emerald-500 uppercase tracking-[0.3em] font-bold">{t('pos.search_results')}</span>
                                <div className="h-[1px] flex-1 bg-zinc-100 mx-6" />
                                <span className="text-[10px] font-bold text-zinc-400 uppercase">{t('pos.items_found', { count: filteredProducts.length })}</span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6 pb-12">
                                {filteredProducts.map((product) => {
                                    const inCart = cart.find((c) => c.product.id === product.id);
                                    const isOutOfStock = product.stock_quantity <= 0;
                                    const style = getProductStyle(product.id);

                                    return (
                                        <motion.button
                                            key={product.id}
                                            onClick={() => handleAddProduct(product)}
                                            disabled={isOutOfStock}
                                            whileHover={{ scale: 0.98 }}
                                            whileTap={{ scale: 0.95 }}
                                            className={cn(
                                                "group relative flex flex-col p-8 rounded-[3rem] text-left transition-all duration-300 border-0 shadow-none overflow-hidden",
                                                style.bg,
                                                isOutOfStock ? "opacity-30 grayscale cursor-not-allowed" : "cursor-pointer"
                                            )}
                                        >
                                            {inCart && (
                                                <div className="absolute top-6 right-6 w-9 h-9 bg-black text-white rounded-full flex items-center justify-center text-[12px] font-black shadow-none z-20">
                                                    {inCart.quantity}
                                                </div>
                                            )}
                                            <div className="mb-10 relative">
                                                <div className="w-16 h-16 rounded-[1.5rem] bg-white flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                                                    <ShoppingBag size={28} className={style.iconColor} />
                                                </div>
                                            </div>
                                            <div className="mt-auto space-y-2">
                                                <h3 className="text-[17px] font-black text-black leading-tight uppercase tracking-tight">
                                                    {product.name}
                                                </h3>
                                                <div className="flex items-center justify-between pt-2">
                                                    <span className="text-xl font-black text-black tracking-tighter">
                                                        {formatCurrency(product.selling_price)}
                                                    </span>
                                                    <div className="flex items-center gap-2">
                                                        <div className={cn(
                                                            "w-1.5 h-1.5 rounded-full",
                                                            product.stock_quantity > 10 ? "bg-emerald-500" : "bg-red-500"
                                                        )} />
                                                        <span className="text-[10px] font-bold text-black/40 uppercase tracking-widest">
                                                            {product.stock_quantity}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </motion.button>
                                    );
                                })}
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Right Column: Mini-POS / Receipt Panel */}
            <div className="relative z-10 w-full lg:w-[450px] lg:sticky lg:top-8 flex flex-col bg-white rounded-[3rem] border-2 border-gray-200 shadow-none overflow-hidden">
                <div className="p-10 pb-0">
                    <div className="mb-6">
                        <CustomerSelector
                            selectedCustomer={selectedCustomer}
                            onSelect={setSelectedCustomer}
                        />
                    </div>
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex flex-col gap-1">
                            <span className="text-[10px] text-zinc-400 uppercase tracking-[0.2em] font-bold">{t('pos.cart.new_order')}</span>
                            <h3 className="text-2xl font-black text-black tracking-tighter uppercase">{t('pos.cart.title')}</h3>
                        </div>
                        <motion.button
                            onClick={clearCart}
                            disabled={cart.length === 0}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className={cn(
                                "relative px-5 py-2.5 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all duration-300 disabled:opacity-0 shadow-sm border-none",
                                "bg-black hover:bg-yellow-400 text-white hover:text-black"
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
                                        <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center shrink-0", getProductStyle(item.product.id).bg)}>
                                            <span className="text-[12px] font-black text-black">x{item.quantity}</span>
                                        </div>
                                        <div className="flex flex-col min-w-0">
                                            <span className="text-sm font-black text-black uppercase tracking-tight truncate">{item.product.name}</span>
                                            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{formatCurrency(item.product.selling_price)}</span>
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
                            <span className="text-xs font-black text-black uppercase tracking-widest">{t('pos.cart.grand_total')}</span>
                            <span className="text-4xl font-black text-black tracking-tighter italic">
                                {formatCurrency(cartTotal)}
                            </span>
                        </div>
                    </div>

                    <div className="flex gap-4">
                        {[
                            { key: 'cash' as const, icon: Banknote, label: 'Cash', comingSoon: false },
                            { key: 'card' as const, icon: CreditCard, label: 'Card', comingSoon: true },
                            { key: 'mobile' as const, icon: Smartphone, label: 'E-Pay', comingSoon: true },
                            { key: 'credit' as const, icon: Wallet, label: 'Credit', comingSoon: false },
                        ].map((method) => (
                            <button
                                key={method.key}
                                onClick={() => !method.comingSoon && setPaymentMethod(method.key)}
                                className={cn(
                                    "flex-1 flex flex-col items-center gap-3 py-5 rounded-[2rem] transition-all duration-300 relative group overflow-hidden",
                                    paymentMethod === method.key
                                        ? "bg-yellow-400 text-black"
                                        : "bg-zinc-100 text-zinc-400 hover:bg-zinc-200",
                                    method.comingSoon && "cursor-not-allowed opacity-50"
                                )}
                            >
                                <method.icon size={24} strokeWidth={paymentMethod === method.key ? 3 : 2.5} />
                                <span className={cn(
                                    "text-[10px] font-black uppercase tracking-widest transition-opacity",
                                    paymentMethod === method.key ? "opacity-100" : "opacity-60"
                                )}>{t(method.label === 'Cash' ? 'pos.cart.pay_cash' : method.label === 'Card' ? 'pos.cart.pay_card' : method.label === 'Credit' ? 'Credit' : 'pos.cart.pay_mobile')}</span>
                                {method.comingSoon && (
                                    <div className="absolute inset-0 bg-white/95 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
                                        <span className="text-[8px] font-black uppercase tracking-tighter text-black leading-none px-2 text-center whitespace-pre-line">
                                            {t('pos.cart.coming_soon')}
                                        </span>
                                    </div>
                                )}
                            </button>
                        ))}
                    </div>

                    <div className="flex bg-zinc-200/50 p-1 rounded-2xl">
                        <button
                            onClick={() => setPrintReceipt(true)}
                            className={cn(
                                "flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all gap-2 flex items-center justify-center",
                                printReceipt ? "bg-white text-black shadow-sm" : "text-zinc-400 hover:text-zinc-600"
                            )}
                        >
                            <Printer size={14} className={printReceipt ? "text-black" : "text-zinc-400"} />
                            {t('pos.print.yes', 'Receipt')}
                        </button>
                        <button
                            onClick={() => setPrintReceipt(false)}
                            className={cn(
                                "flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all gap-2 flex items-center justify-center",
                                !printReceipt ? "bg-white text-black shadow-sm" : "text-zinc-400 hover:text-zinc-600"
                            )}
                        >
                            <span className={!printReceipt ? "text-black" : "text-zinc-400"}>✕</span>
                            {t('pos.print.no', 'No Receipt')}
                        </button>
                    </div>

                    <motion.button
                        onClick={handleBeforeCheckout}
                        disabled={cart.length === 0}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className={cn(
                            "w-full py-6 rounded-[2.5rem] font-black text-sm uppercase tracking-[0.3em] transition-all",
                            cart.length > 0
                                ? "bg-yellow-400 text-black hover:bg-yellow-300 shadow-xl shadow-yellow-400/20"
                                : "bg-zinc-100 text-zinc-300 cursor-not-allowed"
                        )}
                    >
                        {t('pos.cart.checkout')}
                    </motion.button>
                </div>
            </div>

            {/* Modals */}
            {showSimulation && (
                <CheckoutSimulation
                    total={cartTotal}
                    onComplete={handleFinalizeCheckout}
                />
            )}

            {showReceipt && lastSale && (
                <ReceiptPreview
                    sale={lastSale}
                    items={lastSaleItems}
                    onClose={() => setShowReceipt(false)}
                />
            )}

            <AnimatePresence>
                {isManagerOpen && (
                    <QuickAccessManager
                        onClose={() => setIsManagerOpen(false)}
                        products={products}
                        items={quickAccessItems}
                        onAdd={addItem}
                        onUpdate={updateItem}
                        onDelete={deleteItem}
                    />
                )}
            </AnimatePresence>

            {showScanner && (
                <BarcodeScanner
                    onScan={handleScan}
                    onClose={() => setShowScanner(false)}
                    title={t('pos.scan_product', 'Scan Product')}
                />
            )}
        </div>
    );
}

function QuickAccessManager({ onClose, products, items, onAdd, onUpdate, onDelete }: any) {
    const { t } = useTranslation();
    const [isAdding, setIsAdding] = useState(false);
    const [editingItem, setEditingItem] = useState<any>(null);

    return (
        <Portal>
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="bg-white w-full max-w-4xl max-h-[90vh] rounded-[3rem] shadow-2xl overflow-hidden flex flex-col"
                >
                    <div className="p-8 border-b border-zinc-100 flex items-center justify-between bg-[#fcfcfc]">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-black text-white rounded-2xl">
                                <Settings2 size={24} />
                            </div>
                            <div>
                                <h2 className="text-2xl font-black text-black uppercase tracking-tight">{t('pos.quick_access.configure')}</h2>
                                <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-[0.2em]">{t('pos.quick_access.manage_buttons')}</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="p-4 hover:bg-zinc-100 rounded-full transition-colors">
                            <X size={24} className="text-zinc-400" />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-8 bg-white custom-scrollbar">
                        {isAdding || editingItem ? (
                            <QuickAccessForm
                                products={products}
                                initialData={editingItem}
                                onCancel={() => { setIsAdding(false); setEditingItem(null); }}
                                onSave={(data: any) => {
                                    if (editingItem) {
                                        onUpdate(editingItem.id, data);
                                    } else {
                                        onAdd(data);
                                    }
                                    setIsAdding(false);
                                    setEditingItem(null);
                                }}
                            />
                        ) : (
                            <div className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {items.filter(Boolean).map((item: any) => (
                                        <div key={item.id} className={cn("p-6 rounded-[2rem] border border-zinc-100/50 flex flex-col gap-4 transition-all hover:border-zinc-200", item.bg_color)}>
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 bg-white rounded-xl shadow-sm">
                                                        <ShoppingBag className={item.color} size={18} />
                                                    </div>
                                                    <span className="font-black text-black uppercase tracking-tight">{item.display_name}</span>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <button onClick={() => setEditingItem(item)} className="p-2 hover:bg-white rounded-lg transition-colors text-zinc-400 hover:text-black">
                                                        <Pencil size={16} />
                                                    </button>
                                                    <button onClick={() => onDelete(item.id)} className="p-2 hover:bg-white rounded-lg transition-colors text-zinc-400 hover:text-red-500">
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </div>
                                            <div className="flex flex-wrap gap-2">
                                                {(Array.isArray(item.options) ? item.options : []).map((opt: any) => (
                                                    <div key={opt.label} className="bg-white px-3 py-1.5 rounded-xl border border-zinc-100 text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                                                        <span className="text-zinc-400">{opt.label}:</span>
                                                        <span className="text-emerald-500">{formatCurrency(opt.price)}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                    <button
                                        onClick={() => setIsAdding(true)}
                                        className="p-8 border-2 border-dashed border-zinc-100 rounded-[2rem] flex flex-col items-center justify-center gap-3 text-zinc-300 hover:border-zinc-200 hover:text-zinc-400 transition-all group"
                                    >
                                        <div className="w-12 h-12 bg-zinc-50 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                                            <Plus size={24} />
                                        </div>
                                        <span className="font-black uppercase tracking-widest text-xs">{t('pos.quick_access.add_product')}</span>
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </motion.div>
            </div>
        </Portal>
    );
}

function QuickAccessForm({ products, initialData, onSave, onCancel }: any) {
    const { t } = useTranslation();
    const [formData, setFormData] = useState({
        product_id: initialData?.product_id || '',
        display_name: initialData?.display_name || '',
        color: initialData?.color || 'text-zinc-500',
        bg_color: initialData?.bg_color || 'bg-zinc-50',
        options: initialData?.options || [{ label: '', qty: 1, price: 0 }]
    });

    const addOption = () => {
        setFormData({ ...formData, options: [...formData.options, { label: '', qty: 1, price: 0 }] });
    };

    const removeOption = (idx: number) => {
        setFormData({ ...formData, options: formData.options.filter((_: any, i: number) => i !== idx) });
    };

    const updateOption = (idx: number, field: string, value: any) => {
        const newOptions = formData.options.map((opt: any, i: number) =>
            i === idx ? { ...opt, [field]: value } : opt
        );
        setFormData({ ...formData, options: newOptions });
    };

    const colorPairs = [
        { color: 'text-zinc-500', bg: 'bg-zinc-50' },
        { color: 'text-red-500', bg: 'bg-red-50' },
        { color: 'text-sky-500', bg: 'bg-sky-50' },
        { color: 'text-emerald-500', bg: 'bg-emerald-50' },
        { color: 'text-amber-500', bg: 'bg-amber-50' },
        { color: 'text-orange-500', bg: 'bg-orange-50' },
        { color: 'text-purple-500', bg: 'bg-purple-50' },
        { color: 'text-pink-500', bg: 'bg-pink-50' },
    ];

    return (
        <div className="space-y-8 animate-fadeIn">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">{t('pos.quick_access.select_product')}</label>
                        <select
                            value={formData.product_id}
                            onChange={(e) => {
                                const val = e.target.value;
                                if (!val) {
                                    setFormData({ ...formData, product_id: '', display_name: '' });
                                    return;
                                }
                                const prodId = parseInt(val);
                                const product = products.find((p: any) => p.id === prodId);
                                setFormData({ ...formData, product_id: prodId, display_name: product?.name || '' });
                            }}
                            className="w-full h-14 px-6 rounded-2xl bg-zinc-50 border border-zinc-100 font-bold outline-none focus:border-black transition-all"
                        >
                            <option value="">Select a product...</option>
                            {products.map((p: any) => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">{t('pos.quick_access.display_name')}</label>
                        <input
                            type="text"
                            value={formData.display_name}
                            onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                            placeholder="e.g. Fresh Eggs"
                            className="w-full h-14 px-6 rounded-2xl bg-zinc-50 border border-zinc-100 font-bold outline-none focus:border-black transition-all"
                        />
                    </div>

                    <div className="space-y-4">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">{t('pos.quick_access.theme_color')}</label>
                        <div className="flex flex-wrap gap-3">
                            {colorPairs.map((pair) => (
                                <button
                                    key={pair.color}
                                    onClick={() => setFormData({ ...formData, color: pair.color, bg_color: pair.bg })}
                                    className={cn(
                                        "w-12 h-12 rounded-xl flex items-center justify-center transition-all border-2",
                                        pair.bg,
                                        formData.color === pair.color ? "border-black" : "border-transparent"
                                    )}
                                >
                                    <ShoppingBag size={18} className={pair.color} />
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">{t('pos.quick_access.variations')}</label>
                        <button onClick={addOption} className="text-[10px] font-black uppercase tracking-widest text-emerald-500 hover:underline">
                            {t('pos.quick_access.add_option')}
                        </button>
                    </div>

                    <div className="space-y-3">
                        {formData.options.map((opt: any, idx: number) => (
                            <div key={idx} className="flex gap-2 animate-fadeIn">
                                <input
                                    placeholder="Label (e.g. 10 Pcs)"
                                    value={opt.label}
                                    onChange={(e) => updateOption(idx, 'label', e.target.value)}
                                    className="flex-1 h-12 px-4 rounded-xl bg-zinc-50 border border-zinc-100 text-xs font-bold outline-none focus:border-black"
                                />
                                <input
                                    type="number"
                                    placeholder="Qty"
                                    value={opt.qty}
                                    onChange={(e) => updateOption(idx, 'qty', parseInt(e.target.value))}
                                    className="w-20 h-12 px-4 rounded-xl bg-zinc-50 border border-zinc-100 text-xs font-bold outline-none focus:border-black"
                                />
                                <input
                                    type="number"
                                    placeholder="Price"
                                    value={opt.price}
                                    onChange={(e) => updateOption(idx, 'price', parseFloat(e.target.value))}
                                    className="w-28 h-12 px-4 rounded-xl bg-zinc-50 border border-zinc-100 text-xs font-bold outline-none focus:border-black text-emerald-600"
                                />
                                <button
                                    onClick={() => removeOption(idx)}
                                    disabled={formData.options.length === 1}
                                    className="p-3 text-zinc-300 hover:text-red-500 transition-colors disabled:opacity-0"
                                >
                                    <X size={16} />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="flex gap-4 pt-4 border-t border-zinc-50">
                <button
                    onClick={onCancel}
                    className="flex-1 h-14 bg-zinc-100 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-zinc-200 transition-all"
                >
                    {t('pos.quick_access.cancel')}
                </button>
                <button
                    onClick={() => onSave(formData)}
                    disabled={!formData.product_id || !formData.display_name}
                    className="flex-[2] h-14 bg-black text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-zinc-800 disabled:bg-zinc-200 transition-all shadow-xl shadow-black/10"
                >
                    {t('pos.quick_access.save')}
                </button>
            </div>
        </div>
    );
}
