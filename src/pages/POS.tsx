// POS.tsx — Orchestrator
import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Search, X, Barcode } from 'lucide-react';
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
import CheckoutSimulation from '@/components/POS/CheckoutSimulation';
import ReceiptPreview from '@/components/POS/ReceiptPreview';
import CartPanel from '@/components/POS/CartPanel';
import ProductGrid from '@/components/POS/ProductGrid';
import EmptyCartDialog from '@/components/POS/EmptyCartDialog';
import StockErrorDialog from '@/components/POS/StockErrorDialog';
import QuickAccessManager from '@/components/POS/QuickAccessManager';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { toast } from 'sonner';
import { getProductStyle } from '@/lib/product-styles';
import { usePageTitle } from '@/hooks/usePageTitle';

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
        isLoading: isCheckingOut,
    } = useSaleStore();
    const cartTotal = useSaleStore(selectCartTotal);
    const { user, currentSession, getCurrentSessionId, closeCashierSession } = useAuthStore();
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
        !showScanner, // disable hardware scanner while camera scanner is open
    );

    useEffect(() => {
        loadProducts();
        fetchItems();
    }, [loadProducts, fetchItems]);

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

    const confirmEndShift = () => {
        closeCashierSession(0, 'Shift ended by cashier');
        setShowEndShiftConfirm(false);
    };

    const handleScan = useCallback(async (code: string) => {
        // In-memory lookup first (instant), fallback to DB if products not loaded yet
        const product = barcodeMap.get(code) ?? await getByBarcode(code);
        if (product) {
            await addToCart({ product, quantity: 1, discount: 0 });
            setShowScanner(false);
            toast.success(product.name, { description: t('pos.scan.added', 'Added to cart'), duration: 1500 });
        } else {
            toast.warning(t('pos.scan.not_found', 'Product not found with barcode: ') + code);
        }
    }, [barcodeMap, getByBarcode, addToCart, t]);

    return (
        <div className="relative flex flex-col lg:flex-row items-start gap-8 p-6 lg:p-8 animate-fadeIn mt-4">
            {/* Grid Background */}
            <div
                className="absolute inset-0 pointer-events-none opacity-[0.15] rounded-[3rem]"
                style={{
                    backgroundImage: `linear-gradient(to right, rgba(0, 0, 0, 0.3) 1px, transparent 1px), linear-gradient(to bottom, rgba(0, 0, 0, 0.3) 1px, transparent 1px)`,
                    backgroundSize: '32px 32px',
                    maskImage: 'radial-gradient(circle at top center, black, transparent 90%)',
                    WebkitMaskImage: 'radial-gradient(circle at top center, black, transparent 90%)',
                }}
            />

            {/* Left Column: Product Selection */}
            <div className="relative z-10 flex-1 flex flex-col min-w-0">
                {/* Header Section */}
                <div className="flex flex-col space-y-6 pb-6">
                    <div className="flex items-center justify-between">
                        <div className="flex flex-col gap-1">
                            <span className="text-[12px] text-zinc-400 tracking-[0.3em] font-bold">
                                {t('pos.system')}
                            </span>
                            <h2 className="text-3xl font-black text-black tracking-tighter uppercase">
                                {t('pos.title')}
                            </h2>
                        </div>
                        <div className="flex items-center gap-4">
                            {currentSession?.session && (
                                <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-full border-0 shadow-none transition-all hover:bg-zinc-50 group">
                                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                    <span className="text-[10px] font-black text-black uppercase tracking-widest">
                                        {user?.full_name}
                                    </span>
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
                    <Search
                        size={22}
                        className="absolute left-6 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-black transition-colors"
                    />
                    <input
                        ref={searchInputRef}
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder={t('pos.search_placeholder')}
                        className={cn(
                            'w-full pl-16 pr-16 py-5 rounded-[2.5rem]',
                            'bg-white border border-zinc-200 shadow-none',
                            'text-black placeholder:text-zinc-300 text-lg font-bold',
                            'focus:outline-none focus:ring-0 focus:!outline-none focus-visible:!outline-none focus-visible:ring-0 focus:border-zinc-400 transition-all placeholder:transition-opacity focus:placeholder:opacity-50',
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

            {/* Right Column: Cart Panel */}
            <CartPanel
                cart={cart}
                cartTotal={cartTotal}
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

            <ConfirmDialog
                isOpen={showEndShiftConfirm}
                onClose={() => setShowEndShiftConfirm(false)}
                onConfirm={confirmEndShift}
                title="End Shift"
                description="Are you sure you want to end your shift?"
                confirmLabel="End Shift"
                variant="warning"
            />
        </div>
    );
}
