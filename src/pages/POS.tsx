// POS.tsx — Orchestrator
import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Search, X, Barcode, LogOut, Globe } from 'lucide-react';
import { cn, formatCurrency } from '@/lib/utils';
import { useProductStore } from '@/stores/useProductStore';
import { useSaleStore, selectCartTotal } from '@/stores/useSaleStore';
import { useAuthStore } from '@/stores/useAuthStore';
import { useQuickAccessStore } from '@/stores/useQuickAccessStore';
import { useBarcodeScanner } from '@/hooks/useBarcodeScanner';
import BarcodeScanner from '@/components/common/BarcodeScanner';
import type { Product, Sale, SaleItem, Customer } from '@/lib/types';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import QuickAccess from '@/components/POS/QuickAccess';
import InventoryPreview from '@/components/POS/InventoryPreview';
import ActivePromotionsBanner from '@/components/POS/ActivePromotionsBanner';
import CheckoutSimulation from '@/components/POS/CheckoutSimulation';
import ReceiptPreview from '@/components/POS/ReceiptPreview';
import CartPanel from '@/components/POS/CartPanel';
import ProductGrid from '@/components/POS/ProductGrid';
import EmptyCartDialog from '@/components/POS/EmptyCartDialog';
import StockErrorDialog from '@/components/POS/StockErrorDialog';
import QuickAccessManager from '@/components/POS/QuickAccessManager';
import LogoutConfirmModal from '@/components/layout/LogoutConfirmModal';
import { toast } from 'sonner';
import { getProductStyle } from '@/lib/product-styles';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useLanguageSwitch } from '@/hooks/useLanguageSwitch';

export default function POS() {
    const { t, i18n } = useTranslation();
    usePageTitle(t('sidebar.pos_sales'));
    const { products, loadProducts, getByBarcode } = useProductStore();
    const {
        cart,
        addToCart,
        removeFromCart,
        clearCart,
        checkout,
        stockError,
        clearStockError,
        promotionResult,
        isLoading: isCheckingOut,
    } = useSaleStore();
    const cartTotal = useSaleStore(selectCartTotal);
    const { user, currentSession, getCurrentSessionId, closeCashierSession, logout } = useAuthStore();
    const { items: quickAccessItems, fetchItems, addItem, updateItem, deleteItem } = useQuickAccessStore();

    const [searchQuery, setSearchQuery] = useState('');
    const [showSimulation, setShowSimulation] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'mobile' | 'credit'>('cash');
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
    const [isManagerOpen, setIsManagerOpen] = useState(false);
    const [showReceipt, setShowReceipt] = useState(false);
    const [lastSale, setLastSale] = useState<Sale | null>(null);
    const [lastSaleItems, setLastSaleItems] = useState<SaleItem[]>([]);
    const [printReceipt, setPrintReceipt] = useState(true);
    const [showScanner, setShowScanner] = useState(false);
    const [showEmptyCartAlert, setShowEmptyCartAlert] = useState(false);
    const [showEndShiftConfirm, setShowEndShiftConfirm] = useState(false);
    const [showLangMenu, setShowLangMenu] = useState(false);
    const langMenuRef = useRef<HTMLDivElement>(null);
    const { languages, currentLang, changeLanguage } = useLanguageSwitch();

    const searchInputRef = useRef<HTMLInputElement>(null);

    // O(1) barcode→product lookup map — rebuilt only when products change
    const barcodeMap = useMemo(() => {
        const map = new Map<string, Product>();
        for (const p of products) {
            if (p.barcode) map.set(p.barcode, p);
        }
        return map;
    }, [products]);

    // Hardware barcode scanner: instant in-memory lookup, works even when search input is focused
    useBarcodeScanner(
        useCallback(
            async (barcode: string) => {
                const product = barcodeMap.get(barcode);
                if (product) {
                    await addToCart({ product, quantity: 1, discount: 0 });
                    toast.success(product.name, { description: t('pos.scan.added', 'Added to cart'), duration: 1500 });
                } else {
                    toast.warning(t('pos.scan.not_found', 'Product not found: ') + barcode);
                }
            },
            [barcodeMap, addToCart, t],
        ),
        !showScanner,
    );

    useEffect(() => {
        loadProducts();
        fetchItems();
    }, [loadProducts, fetchItems]);

    useEffect(() => {
        if (!showLangMenu) return;
        const handler = (e: MouseEvent) => {
            if (langMenuRef.current && !langMenuRef.current.contains(e.target as Node)) {
                setShowLangMenu(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [showLangMenu]);

    const filteredProducts = useMemo(
        () =>
            products
                .filter(
                    (p) =>
                        !searchQuery ||
                        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        (p.barcode && p.barcode.includes(searchQuery)),
                )
                .slice(0, 20),
        [products, searchQuery],
    );

    const handleAddProduct = useCallback(
        async (product: Product) => {
            if (product.stock_quantity <= 0) return;
            await addToCart({ product, quantity: 1, discount: 0 });
        },
        [addToCart],
    );

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
                total: item.product.selling_price * item.quantity - item.discount,
            }));

            const sale = await checkout(
                {
                    method: paymentMethod,
                    customer_name: selectedCustomer ? selectedCustomer.full_name : 'Walk-in Customer',
                    customer_id: selectedCustomer?.id,
                },
                user?.id,
                sessionId || undefined,
            );

            setLastSale(sale);
            setLastSaleItems(currentItems);
            setShowSimulation(false);
            setShowReceipt(true);

            setPaymentMethod('cash');
            setSelectedCustomer(null);
            loadProducts();
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Unknown error';
            console.error('Checkout failed:', err);
            toast.error('Checkout error: ' + message);
            setShowSimulation(false);
        }
    }, [checkout, paymentMethod, selectedCustomer, getCurrentSessionId, loadProducts, cart, user]);

    const handleBeforeCheckout = useCallback(() => {
        if (cart.length === 0) {
            setShowEmptyCartAlert(true);
            return;
        }
        handleFinalizeCheckout();
    }, [cart.length, handleFinalizeCheckout]);

    const confirmEndShift = async () => {
        closeCashierSession(0, 'Shift ended by cashier');
        logout();
        setShowEndShiftConfirm(false);
    };

    const handleScan = useCallback(
        async (code: string) => {
            const product = barcodeMap.get(code) ?? (await getByBarcode(code));
            if (product) {
                await addToCart({ product, quantity: 1, discount: 0 });
                setShowScanner(false);
                toast.success(product.name, { description: t('pos.scan.added', 'Added to cart'), duration: 1500 });
            } else {
                toast.warning(t('pos.scan.not_found', 'Product not found with barcode: ') + code);
            }
        },
        [barcodeMap, getByBarcode, addToCart, t],
    );

    return (
        <div className="relative h-full w-full flex flex-col animate-fadeIn bg-gray-100 overflow-hidden">

            {/* Main Content Area */}
            <div className="h-0 grow flex flex-row overflow-hidden">
                {/* LEFT: Products Section */}
                <div className="flex-1 flex flex-col min-w-0 overflow-hidden p-4 xl:p-6">
                    {/* Header */}
                    <div className="flex flex-row items-center justify-between gap-4 mb-4">
                        <div className="flex flex-col gap-1 shrink-0">
                            <span className="text-[10px] text-zinc-400 tracking-[0.3em] font-bold">
                                {t('pos.system')}
                            </span>
                            <h2 className="text-2xl sm:text-3xl font-black text-black tracking-tighter uppercase">
                                {t('pos.title')}
                            </h2>
                        </div>
                        <div className="flex items-center gap-3 flex-1 justify-end">
                            {/* Inline Search */}
                            <div className="relative flex-1 max-w-sm">
                                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                                <input
                                    ref={searchInputRef}
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder={t('pos.search_placeholder')}
                                    className="w-full pl-9 pr-8 py-2.5 rounded-xl bg-white border border-zinc-200 text-black placeholder:text-zinc-300 text-sm font-bold focus:outline-none focus:border-zinc-400 transition-colors"
                                />
                                {searchQuery && (
                                    <motion.button
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        onClick={() => setSearchQuery('')}
                                        className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded-full bg-zinc-100 text-zinc-400 hover:bg-black hover:text-white transition-all"
                                    >
                                        <X size={12} strokeWidth={3} />
                                    </motion.button>
                                )}
                            </div>
                            {currentSession?.session && (
                                <div className="hidden sm:flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                    <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                                        {user?.full_name}
                                    </span>
                                </div>
                            )}
                            <button
                                onClick={() => setShowScanner(true)}
                                className="flex items-center gap-2 px-4 py-2 bg-white border border-zinc-200 text-zinc-600 rounded-xl hover:bg-zinc-50 transition-all active:scale-95"
                            >
                                <Barcode size={16} />
                                <span className="text-[10px] font-black uppercase tracking-widest">
                                    {t('pos.scan', 'Scan')}
                                </span>
                            </button>

                            {/* Language Switcher */}
                            <div className="relative" ref={langMenuRef}>
                                <button
                                    onClick={() => setShowLangMenu((v) => !v)}
                                    className="flex items-center gap-2 px-4 py-2 bg-white border border-zinc-200 text-zinc-600 rounded-xl hover:bg-zinc-50 transition-all active:scale-95"
                                >
                                    <Globe size={16} />
                                    <span className="text-[10px] font-black uppercase tracking-widest">
                                        {currentLang.toUpperCase()}
                                    </span>
                                </button>
                                {showLangMenu && (
                                    <div className="absolute top-full mt-2 right-0 bg-white border border-zinc-200 rounded-xl shadow-xl z-50 overflow-hidden min-w-[140px]">
                                        {languages.map((lang) => (
                                            <button
                                                key={lang.code}
                                                onClick={() => {
                                                    setShowLangMenu(false);
                                                    changeLanguage(lang.code);
                                                }}
                                                className={cn(
                                                    'w-full flex items-center gap-3 px-4 py-2.5 text-sm font-bold transition-colors',
                                                    currentLang === lang.code
                                                        ? 'bg-yellow-400 text-black'
                                                        : 'text-zinc-600 hover:bg-zinc-50',
                                                )}
                                            >
                                                <span className="text-xs font-black tracking-widest">{lang.flag}</span>
                                                <span style={{ fontFamily: lang.code === 'ar' ? '"Cairo", sans-serif' : 'inherit' }}>
                                                    {lang.label}
                                                </span>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <button
                                onClick={() => setShowEndShiftConfirm(true)}
                                className="flex items-center gap-2 px-4 py-2 bg-white border border-zinc-200 text-zinc-600 rounded-xl hover:bg-red-50 hover:border-red-200 hover:text-red-600 transition-all active:scale-95"
                            >
                                <LogOut size={16} />
                                <span className="text-[10px] font-black uppercase tracking-widest">
                                    {t('pos.end_shift', 'End Shift')}
                                </span>
                            </button>
                        </div>
                    </div>

                    {/* Products Scrollable Area — 3 sections */}
                    <div className="h-0 grow overflow-y-auto scrollable scrollbar-hide" style={{ touchAction: 'pan-y' }}>
                        <div className="space-y-8 pb-6">
                            {/* Sections 1 + 2 wrapped with grid bg */}
                            {!searchQuery && (
                                <div className="relative space-y-8">
                                    {/* Grid background — covers promos + in-stock, fades out at bottom */}
                                    <div
                                        className="absolute inset-0 pointer-events-none rounded-3xl opacity-40"
                                        style={{
                                            backgroundImage: `linear-gradient(to right, rgba(0,0,0,0.07) 1px, transparent 1px), linear-gradient(to bottom, rgba(0,0,0,0.07) 1px, transparent 1px)`,
                                            backgroundSize: '32px 32px',
                                            maskImage: 'linear-gradient(to bottom, black 60%, transparent 100%)',
                                            WebkitMaskImage: 'linear-gradient(to bottom, black 60%, transparent 100%)',
                                        }}
                                    />
                                    {/* Section 1 — Promotions */}
                                    <ActivePromotionsBanner />

                                    {/* Section 2 — In-Stock Products */}
                                    <InventoryPreview
                                        products={products}
                                        cart={cart}
                                        formatCurrency={formatCurrency}
                                        i18n={i18n}
                                        handleAddProduct={handleAddProduct}
                                    />
                                </div>
                            )}

                            {/* Section 3 — Custom / Quick Access */}
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

                            {searchQuery && (
                                <ProductGrid
                                    products={filteredProducts}
                                    cart={cart}
                                    handleAddProduct={handleAddProduct}
                                    getProductStyle={getProductStyle}
                                    formatCurrency={formatCurrency}
                                    searchQuery={searchQuery}
                                />
                            )}
                        </div>
                    </div>
                </div>

                {/* RIGHT: Ticket Cart */}
                <div className="w-[340px] h-full shrink-0 bg-[#f2f2f0] overflow-hidden">
                    <CartPanel
                        cart={cart}
                        cartTotal={cartTotal}
                        promotionResult={promotionResult}
                        clearCart={clearCart}
                        removeFromCart={removeFromCart}
                        paymentMethod={paymentMethod}
                        setPaymentMethod={setPaymentMethod}
                        selectedCustomer={selectedCustomer}
                        setSelectedCustomer={setSelectedCustomer}
                        printReceipt={printReceipt}
                        setPrintReceipt={setPrintReceipt}
                        handleBeforeCheckout={handleBeforeCheckout}
                        isCheckingOut={isCheckingOut}
                        getProductStyle={getProductStyle}
                    />
                </div>
            </div>

            {/* Modals */}
            {showSimulation && <CheckoutSimulation total={cartTotal} onComplete={handleFinalizeCheckout} />}

            {showReceipt && lastSale && (
                <ReceiptPreview sale={lastSale} items={lastSaleItems} onClose={() => setShowReceipt(false)} />
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

            <StockErrorDialog error={stockError} onClose={clearStockError} />

            <EmptyCartDialog isOpen={showEmptyCartAlert} onClose={() => setShowEmptyCartAlert(false)} />

            <LogoutConfirmModal
                isOpen={showEndShiftConfirm}
                onClose={() => setShowEndShiftConfirm(false)}
                onLogout={confirmEndShift}
            />
        </div>
    );
}
