// POSLayout.tsx — Multi-zone POS layout orchestrator (3-column CSS Grid)
import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, ScanBarcode } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

import POSHeader from './POSHeader';
import CartTicket from './CartTicket';
import TotalsBar from './TotalsBar';
import ClientInfoPanel from './ClientInfoPanel';
import ProductDetailCard from './ProductDetailCard';
import NumericKeypad from './NumericKeypad';
import ActionGrid from './ActionGrid';
import PaymentMethodsGrid from './PaymentMethodsGrid';
import ManagerPinDialog from './ManagerPinDialog';
import DiscountDialog from './DiscountDialog';
import StockErrorDialog from './StockErrorDialog';
import ReturnDialog from './ReturnDialog';
import SplitPaymentPanel from './SplitPaymentPanel';
import ReceiptPreview from './ReceiptPreview';
import CustomerSearchDialog from './CustomerSearchDialog';
import CustomerModal from '@/components/customers/CustomerModal';
import BarcodeScanner from '@/components/common/BarcodeScanner';
import { SaleRepo } from '../../../database/repositories/sale.repo';
import { useAuthStore } from '@/stores/useAuthStore';
import { useSettingsStore, selectSetting } from '@/stores/useSettingsStore';
import { useProductStore } from '@/stores/useProductStore';
import { useSaleStore, selectCartTotal, selectCartTotalWithPromotions, selectManualDiscountTotal } from '@/stores/useSaleStore';
import { usePOSStore } from '@/stores/usePOSStore';
import { useAuthorizationStore } from '@/stores/useAuthorizationStore';
import { useCustomerStore } from '@/stores/useCustomerStore';
import { useBarcodeScanner } from '@/hooks/useBarcodeScanner';
import { useFormatCurrency } from '@/hooks/useFormatCurrency';
import { useTicketNumber } from '@/hooks/useTicketNumber';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { useManagerAuth } from '@/hooks/useManagerAuth';
import type { Product, Customer, ManualDiscount, Sale, SaleItem } from '@/lib/types';

export default function POSLayout() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { formatCurrency } = useFormatCurrency();
    const { ticketNumber, refresh: refreshTicketNumber } = useTicketNumber();

    // Stores
    const storeName = useSettingsStore(selectSetting('store.name', 'Super Market'));
    const vatRate = parseFloat(useSettingsStore(selectSetting('tax.rate', '0')) || '0') / 100;
    const user = useAuthStore((s) => s.user);
    const currentSession = useAuthStore((s) => s.currentSession);
    const { products, loadProducts, getByBarcode } = useProductStore();
    const {
        cart,
        addToCart,
        updateCartItem,
        removeFromCart,
        clearCart,
        promotionResult,
        isLoading: isCheckingOut,
        stockError,
        clearStockError,
    } = useSaleStore();
    const cartTotal = useSaleStore(selectCartTotal);
    const cartTotalWithPromos = useSaleStore(selectCartTotalWithPromotions);
    const manualDiscountTotal = useSaleStore(selectManualDiscountTotal);
    const { setItemManualDiscount, clearItemManualDiscount, setCartDiscount, clearCartDiscount, checkout } = useSaleStore();
    const { setSelectedProduct, switchTab, clearTab, setSelectedCartProductId } = usePOSStore();
    const tabs = usePOSStore((s) => s.tabs);
    const activeTabId = usePOSStore((s) => s.activeTabId);
    const selectedProduct = usePOSStore((s) => s.selectedProduct);
    const selectedCartProductId = usePOSStore((s) => s.selectedCartProductId);
    const keypadValue = usePOSStore((s) => s.keypadValue);
    const { appendKeypad, clearKeypad, backspaceKeypad } = usePOSStore();
    const { requestAuth } = useManagerAuth();
    const { processReturn: processReturnAction } = useSaleStore();

    // Authorization store (for ManagerPinDialog)
    const authStore = useAuthorizationStore();

    // Local state
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
    const [showScanner, setShowScanner] = useState(false);
    const [showCustomerSearch, setShowCustomerSearch] = useState(false);
    const [showAddCustomer, setShowAddCustomer] = useState(false);
    const [showDiscountDialog, setShowDiscountDialog] = useState(false);
    const [discountScope, setDiscountScope] = useState<'line' | 'cart'>('cart');
    const [discountProductId, setDiscountProductId] = useState<number | null>(null);
    const [showEndShiftConfirm, setShowEndShiftConfirm] = useState(false);
    const [showReturnDialog, setShowReturnDialog] = useState(false);
    const [returnManagerId, setReturnManagerId] = useState<number | null>(null);
    const [showSplitPayment, setShowSplitPayment] = useState(false);
    const [lastSale, setLastSale] = useState<Sale | null>(null);
    const [lastSaleItems, setLastSaleItems] = useState<SaleItem[]>([]);
    const [showReceiptPreview, setShowReceiptPreview] = useState(false);
    const searchInputRef = useRef<HTMLInputElement>(null);

    // O(1) barcode→product lookup map
    const barcodeMap = useMemo(() => {
        const map = new Map<string, Product>();
        for (const p of products) {
            if (p.barcode) map.set(p.barcode, p);
        }
        return map;
    }, [products]);

    // Hardware barcode scanner
    useBarcodeScanner(
        useCallback(
            async (barcode: string) => {
                const product = barcodeMap.get(barcode);
                if (product) {
                    await addToCart({ product, quantity: 1, discount: 0 });
                    setSelectedProduct(product);
                    toast.success(product.name, { description: t('pos.scan.added', 'Added to cart'), duration: 1500 });
                } else {
                    toast.warning(t('pos.scan.not_found', 'Product not found: ') + barcode);
                }
            },
            [barcodeMap, addToCart, setSelectedProduct, t],
        ),
        !showScanner,
    );

    useEffect(() => {
        loadProducts();
    }, [loadProducts]);

    // Search filtering
    // Search filtering — show 12 products when empty, filter when typing
    const filteredProducts = useMemo(
        () => {
            if (searchQuery.length === 0) return products.filter((p) => p.is_active && p.stock_quantity > 0).slice(0, 12);
            return products
                .filter(
                    (p) =>
                        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        (p.barcode && p.barcode.includes(searchQuery)),
                )
                .slice(0, 12);
        },
        [products, searchQuery],
    );

    const handleAddProduct = useCallback(
        async (product: Product) => {
            if (product.stock_quantity <= 0) return;
            await addToCart({ product, quantity: 1, discount: 0 });
            setSelectedProduct(product);
            setSelectedCartProductId(product.id);
            setSearchQuery('');
        },
        [addToCart, setSelectedProduct, setSelectedCartProductId],
    );

    // === Multi-Cart Tab Switcher ===
    const handleTabSwitch = useCallback((tabId: string) => {
        if (tabId === activeTabId) return;

        const newTab = switchTab(tabId, {
            cart,
            customer: selectedCustomer,
            promotionResult,
            cartDiscount: useSaleStore.getState().cartDiscount
        });

        if (newTab) {
            useSaleStore.setState({
                cart: newTab.cart,
                promotionResult: newTab.promotionResult,
                cartDiscount: newTab.cartDiscount,
            });
            setSelectedCustomer(newTab.customer);
        }
    }, [activeTabId, cart, selectedCustomer, promotionResult, switchTab]);

    // === Action handlers for ActionGrid ===
    const closeCashierSession = useAuthStore((s) => s.closeCashierSession);
    const authLogout = useAuthStore((s) => s.logout);

    const handleVoid = useCallback(async () => {
        if (cart.length === 0) return;
        const result = await requestAuth('void_sale');
        if (result.authorized) {
            clearCart();
            setSelectedCustomer(null);
            clearTab(activeTabId);
            setSelectedCartProductId(null);
            toast.success(t('pos.sale_voided', 'Sale voided'), {
                description: t('pos.authorized_by', 'Authorized by {{name}}', { name: result.managerName }),
            });
        }
    }, [cart, requestAuth, clearCart, clearTab, activeTabId, t]);

    const handleDiscount = useCallback(() => {
        setDiscountScope('cart');
        setDiscountProductId(null);
        setShowDiscountDialog(true);
    }, []);

    const handleLineDiscount = useCallback((productId: number) => {
        setDiscountScope('line');
        setDiscountProductId(productId);
        setShowDiscountDialog(true);
    }, []);

    const handleApplyDiscount = useCallback((discount: ManualDiscount) => {
        if (discountScope === 'line' && discountProductId != null) {
            setItemManualDiscount(discountProductId, discount);
        } else {
            setCartDiscount(discount);
        }
    }, [discountScope, discountProductId, setItemManualDiscount, setCartDiscount]);

    const handleClearDiscount = useCallback(() => {
        if (discountScope === 'line' && discountProductId != null) {
            clearItemManualDiscount(discountProductId);
        } else {
            clearCartDiscount();
        }
    }, [discountScope, discountProductId, clearItemManualDiscount, clearCartDiscount]);

    const handleReturn = useCallback(async () => {
        const result = await requestAuth('return');
        if (result.authorized) {
            setReturnManagerId(result.managerId);
            setShowReturnDialog(true);
        }
    }, [requestAuth]);

    const handleReturnConfirm = useCallback(async (request: import('@/lib/types').ReturnRequest) => {
        try {
            await processReturnAction(request);
            setShowReturnDialog(false);
            setReturnManagerId(null);
            loadProducts();
            toast.success(t('pos.return.success', 'Return processed successfully'));
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Unknown error';
            toast.error(t('pos.return.error', 'Return failed: ') + message);
        }
    }, [processReturnAction, loadProducts, t]);

    const handleEndShift = useCallback(async () => {
        await closeCashierSession(0, 'Shift ended by cashier');
        await authLogout();
        navigate('/login');
    }, [closeCashierSession, authLogout, navigate]);

    const handleOpenDrawer = useCallback(() => {
        // Electron cash drawer command via silent print (common POS approach)
        if (window.electronAPI?.printReceipt) {
            window.electronAPI.printReceipt({ silent: true }).then((result) => {
                if (result.success) {
                    toast.success(t('pos.drawer_opened', 'Cash drawer opened'));
                } else {
                    toast.error(t('pos.drawer_error', 'Could not open cash drawer'));
                }
            });
        } else {
            toast.info(t('pos.drawer_not_available', 'Cash drawer is only available in desktop mode'));
        }
    }, [t]);

    const handleReprintReceipt = useCallback(async () => {
        if (!lastSale) {
            // Try fetching last sale from DB
            try {
                const recent = await SaleRepo.getRecentSales(1);
                if (recent.length > 0) {
                    const sale = recent[0];
                    const items = await SaleRepo.getItems(sale.id);
                    setLastSale(sale);
                    setLastSaleItems(items);
                    setShowReceiptPreview(true);
                } else {
                    toast.warning(t('pos.no_recent_sale', 'No recent sale to reprint'));
                }
            } catch {
                toast.error(t('pos.reprint_error', 'Could not load last receipt'));
            }
        } else {
            setShowReceiptPreview(true);
        }
    }, [lastSale, t]);

    const handleCheckout = useCallback(async () => {
        if (cart.length === 0) {
            toast.warning(t('pos.empty_cart_warning', 'Add items to the cart first'));
            return;
        }
        try {
            const sessionId = useAuthStore.getState().getCurrentSessionId();
            const sale = await checkout(
                {
                    method: 'cash',
                    customer_name: selectedCustomer?.full_name ?? 'Walk-in Customer',
                    customer_id: selectedCustomer?.id,
                },
                user?.id,
                sessionId || undefined,
            );
            setSelectedCustomer(null);
            clearTab(activeTabId);
            setSelectedCartProductId(null);
            loadProducts();
            refreshTicketNumber();
            // Track last sale for reprint & show receipt
            if (sale) {
                setLastSale(sale);
                SaleRepo.getItems(sale.id).then((items) => {
                    setLastSaleItems(items);
                    setShowReceiptPreview(true);
                }).catch(() => { });
            }
            toast.success(t('pos.sale_complete', 'Sale complete!'));
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Unknown error';
            toast.error(t('pos.checkout_error', 'Checkout error: ') + message);
        }
    }, [cart, checkout, selectedCustomer, user, loadProducts, refreshTicketNumber, t]);

    const handleCheckoutWithMethod = useCallback(async (method: 'card' | 'mobile') => {
        if (cart.length === 0) {
            toast.warning(t('pos.empty_cart_warning', 'Add items to the cart first'));
            return;
        }
        try {
            const sessionId = useAuthStore.getState().getCurrentSessionId();
            const sale = await checkout(
                {
                    method: method,
                    customer_name: selectedCustomer?.full_name ?? 'Walk-in Customer',
                    customer_id: selectedCustomer?.id,
                },
                user?.id,
                sessionId || undefined,
            );
            setSelectedCustomer(null);
            clearTab(activeTabId);
            setSelectedCartProductId(null);
            loadProducts();
            refreshTicketNumber();
            if (sale) {
                setLastSale(sale);
                SaleRepo.getItems(sale.id).then((items) => {
                    setLastSaleItems(items);
                    setShowReceiptPreview(true);
                }).catch(() => { });
            }
            toast.success(t('pos.sale_with_method', 'Sale completed via {{method}}!', { method }));
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Unknown error';
            toast.error(t('pos.checkout_error', 'Checkout error: ') + message);
        }
    }, [cart, checkout, selectedCustomer, user, loadProducts, refreshTicketNumber, t]);

    const handlePayDebt = useCallback(async () => {
        if (cart.length === 0) return;
        if (!selectedCustomer) {
            toast.warning(t('pos.debt_requires_customer', 'A customer must be selected to record debt.'));
            return;
        }
        try {
            const sessionId = useAuthStore.getState().getCurrentSessionId();
            const sale = await checkout(
                {
                    method: 'credit',
                    customer_name: selectedCustomer.full_name,
                    customer_id: selectedCustomer.id,
                },
                user?.id,
                sessionId || undefined,
            );
            setSelectedCustomer(null);
            clearTab(activeTabId);
            setSelectedCartProductId(null);
            loadProducts();
            refreshTicketNumber();
            if (sale) {
                setLastSale(sale);
                SaleRepo.getItems(sale.id).then((items) => {
                    setLastSaleItems(items);
                    setShowReceiptPreview(true);
                }).catch(() => { });
            }
            toast.success(t('pos.debt_recorded', 'Sale recorded as debt for {{name}}', { name: selectedCustomer.full_name }));
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Unknown error';
            toast.error(t('pos.debt_error', 'Credit/Debt error: ') + message);
        }
    }, [cart, checkout, selectedCustomer, user, loadProducts, refreshTicketNumber, t]);

    const handleSplitPaymentFinalize = useCallback(async (entries: import('@/lib/types').PaymentEntryInput[]) => {
        try {
            const sessionId = useAuthStore.getState().getCurrentSessionId();
            await useSaleStore.getState().checkoutWithSplitPayment(
                entries,
                {
                    name: selectedCustomer?.full_name ?? 'Walk-in Customer',
                    id: selectedCustomer?.id,
                },
                user?.id,
                sessionId || undefined,
            );
            setSelectedCustomer(null);
            setShowSplitPayment(false);
            clearTab(activeTabId);
            setSelectedCartProductId(null);
            loadProducts();
            refreshTicketNumber();
            // Track last sale for reprint & show receipt
            try {
                const recent = await SaleRepo.getRecentSales(1);
                if (recent.length > 0) {
                    setLastSale(recent[0]);
                    const items = await SaleRepo.getItems(recent[0].id);
                    setLastSaleItems(items);
                    setShowReceiptPreview(true);
                }
            } catch { /* ignore */ }
            toast.success(t('pos.sale_complete', 'Sale complete!'));
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Unknown error';
            toast.error(t('pos.checkout_error', 'Checkout error: ') + message);
        }
    }, [selectedCustomer, user, loadProducts, refreshTicketNumber, t]);

    const handleScan = useCallback(
        async (code: string) => {
            const product = barcodeMap.get(code) ?? (await getByBarcode(code));
            if (product) {
                await addToCart({ product, quantity: 1, discount: 0 });
                setSelectedProduct(product);
                setSelectedCartProductId(product.id);
                setShowScanner(false);
                toast.success(product.name, { description: t('pos.scan.added', 'Added to cart'), duration: 1500 });
            } else {
                toast.warning(t('pos.scan.not_found', 'Product not found with barcode: ') + code);
            }
        },
        [barcodeMap, getByBarcode, addToCart, setSelectedProduct, setSelectedCartProductId, t],
    );

    const handleKeypadConfirm = useCallback(async () => {
        const code = usePOSStore.getState().keypadValue.trim();
        if (!code) return;
        const product = barcodeMap.get(code) ?? (await getByBarcode(code));
        if (product) {
            await addToCart({ product, quantity: 1, discount: 0 });
            setSelectedProduct(product);
            setSelectedCartProductId(product.id);
            clearKeypad();
            toast.success(product.name, { description: t('pos.added_via_keypad', 'Added via keypad'), duration: 1500 });
        } else {
            toast.warning(t('pos.keypad_not_found', 'No product found for code: ') + code);
        }
    }, [barcodeMap, getByBarcode, addToCart, setSelectedProduct, setSelectedCartProductId, clearKeypad, t]);

    const handleIncrementQuantity = useCallback(() => {
        if (!selectedCartProductId) return;
        const item = cart.find(c => c.product.id === selectedCartProductId);
        if (item) {
            updateCartItem(item.product.id, item.quantity + 1);
        }
    }, [selectedCartProductId, cart, updateCartItem]);

    const handleDecrementQuantity = useCallback(() => {
        if (!selectedCartProductId) return;
        const item = cart.find(c => c.product.id === selectedCartProductId);
        if (item && item.quantity > 1) {
            updateCartItem(item.product.id, item.quantity - 1);
        }
    }, [selectedCartProductId, cart, updateCartItem]);

    const handleSelectPrevious = useCallback(() => {
        if (cart.length === 0) return;
        const currentIndex = cart.findIndex(c => c.product.id === selectedCartProductId);
        const nextIndex = currentIndex <= 0 ? cart.length - 1 : currentIndex - 1;
        setSelectedCartProductId(cart[nextIndex].product.id);
    }, [cart, selectedCartProductId, setSelectedCartProductId]);

    const handleSelectNext = useCallback(() => {
        if (cart.length === 0) return;
        const currentIndex = cart.findIndex(c => c.product.id === selectedCartProductId);
        const nextIndex = (currentIndex === -1 || currentIndex >= cart.length - 1) ? 0 : currentIndex + 1;
        setSelectedCartProductId(cart[nextIndex].product.id);
    }, [cart, selectedCartProductId, setSelectedCartProductId]);

    const handleDeleteSelected = useCallback(() => {
        if (!selectedCartProductId) return;
        const currentIndex = cart.findIndex(c => c.product.id === selectedCartProductId);
        removeFromCart(selectedCartProductId);

        // Auto-select next/previous item
        const newCart = cart.filter(c => c.product.id !== selectedCartProductId);
        if (newCart.length > 0) {
            const nextIndex = Math.min(currentIndex, newCart.length - 1);
            setSelectedCartProductId(newCart[nextIndex].product.id);
        } else {
            setSelectedCartProductId(null);
        }

        toast.info(t('pos.item_removed', 'Item removed from cart'));
    }, [selectedCartProductId, cart, removeFromCart, setSelectedCartProductId, t]);

    // Keyboard shortcuts
    useKeyboardShortcuts({
        onTab1: () => handleTabSwitch('tab-1'),
        onTab2: () => handleTabSwitch('tab-2'),
        onTab3: () => handleTabSwitch('tab-3'),
        onTab4: () => handleTabSwitch('tab-4'),
        onTab5: () => handleTabSwitch('tab-5'),
        onTab6: () => handleTabSwitch('tab-6'),
        onVoid: handleVoid,
        onDiscount: handleDiscount,
        onReprint: handleReprintReceipt,
        onDrawer: handleOpenDrawer,
        onPriceCheck: () => searchInputRef.current?.focus(),
        onReturn: handleReturn,
        onReport: () => navigate('/pos/reports'),
        onSettings: () => navigate('/pos/settings'),
        onEndShift: () => setShowEndShiftConfirm(true),
        onGiftCard: () => toast.info(t('pos.gift_card_not_available', 'Gift card feature is not available yet')),

        // Keypad physical keyboard support
        onDigit: appendKeypad,
        onBackspace: backspaceKeypad,
        onClear: clearKeypad,
        onConfirm: handleKeypadConfirm,

        // Cart quantity shortcuts
        onArrowUp: handleSelectPrevious,
        onArrowDown: handleSelectNext,
        onArrowLeft: handleDecrementQuantity,
        onArrowRight: handleIncrementQuantity,
        onDelete: handleDeleteSelected,
    });

    // Discount dialog context
    const discountItem = discountProductId != null ? cart.find((c) => c.product.id === discountProductId) : null;
    const discountMaxAmount = discountScope === 'line' && discountItem
        ? discountItem.product.selling_price * discountItem.quantity
        : cartTotal;
    const discountCurrent = discountScope === 'line' && discountItem
        ? discountItem.manualDiscount ?? null
        : useSaleStore.getState().cartDiscount;

    return (
        <div className="flex flex-col h-full w-full bg-zinc-50 overflow-hidden">
            {/* Header */}
            <POSHeader
                storeName={storeName}
                cashierName={user?.full_name ?? t('pos.unknown_cashier', 'Cashier')}
                sessionActive={!!currentSession?.session}
                shiftStartTime={currentSession?.session?.login_time}
                onEndShift={() => setShowEndShiftConfirm(true)}
                onPriceCheck={() => searchInputRef.current?.focus()}
                onReport={() => navigate('/pos/reports')}
                onSettings={() => navigate('/pos/settings')}
                onGiftCard={() => toast.info(t('pos.gift_card_not_available', 'Gift card feature is not available yet'))}
            />

            {/* Main 3-column grid — stacks on small screens, adapts at every breakpoint */}
            <div className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-[1fr_2fr] lg:grid-cols-[2fr_3fr_minmax(280px,1fr)] xl:grid-cols-[2fr_3fr_minmax(380px,1fr)] gap-0">
                {/* LEFT PANEL — Product catalog (40%) */}
                <aside className="hidden lg:flex flex-col border-r border-zinc-100 bg-zinc-950 overflow-hidden" aria-label="Product catalog">
                    {/* Search bar */}
                    <div className="shrink-0 bg-white border-b border-zinc-100">
                        <div className="relative">
                            <Search size={15} strokeWidth={1.5} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-300" />
                            <input
                                ref={searchInputRef}
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder={t('pos.search_placeholder', 'Search products or scan barcode...')}
                                aria-label={t('pos.search_placeholder', 'Search products or scan barcode...')}
                                className="w-full pl-11 pr-14 py-3.5 bg-white text-zinc-700 placeholder:text-zinc-300 text-sm font-medium focus:outline-none transition-colors"
                            />
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                                {searchQuery && (
                                    <motion.button
                                        initial={{ opacity: 0, scale: 0.8 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        onClick={() => setSearchQuery('')}
                                        className="p-1 rounded-full bg-zinc-100 text-zinc-400 hover:bg-zinc-200 hover:text-zinc-500 transition-all"
                                    >
                                        <X size={12} strokeWidth={2} />
                                    </motion.button>
                                )}
                                <button
                                    onClick={() => setShowScanner(true)}
                                    className="p-1.5 text-zinc-300 hover:text-zinc-500 transition-all"
                                    title={t('pos.scan', 'Scan Barcode')}
                                >
                                    <ScanBarcode size={16} strokeWidth={1.5} />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Product grid — scrollable */}
                    <div className="flex-1 min-h-0 overflow-y-auto bg-white [&::-webkit-scrollbar-thumb]:!bg-zinc-200 [&::-webkit-scrollbar-thumb:hover]:!bg-zinc-300 [&::-webkit-scrollbar-track]:!bg-white" style={{ scrollbarColor: '#e4e4e7 white' }}>
                        {filteredProducts.length > 0 ? (
                            <div className="grid grid-cols-2 2xl:grid-cols-3 gap-px bg-zinc-100 min-h-full">
                                {filteredProducts.map((product) => {
                                    const inCart = cart.find((c) => c.product.id === product.id);
                                    const isOutOfStock = product.stock_quantity <= 0;
                                    const isLowStock = product.stock_quantity > 0 && product.stock_quantity <= 5;
                                    const isInCart = !!inCart;
                                    return (
                                        <button
                                            key={product.id}
                                            onClick={() => handleAddProduct(product)}
                                            disabled={isOutOfStock}
                                            className={`relative flex flex-col justify-between p-3 xl:p-4 min-h-[88px] xl:min-h-[96px] text-left transition-colors duration-100 active:brightness-95 disabled:opacity-25 disabled:cursor-not-allowed ${isInCart ? 'bg-zinc-900' : 'bg-white hover:bg-zinc-50'}`}
                                        >
                                            {/* Quantity badge */}
                                            {isInCart && (
                                                <span className="absolute top-2 right-2.5 bg-emerald-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
                                                    {inCart.quantity}
                                                </span>
                                            )}

                                            {/* Product name */}
                                            <span className={`text-[13px] font-semibold leading-snug line-clamp-2 pr-6 ${isInCart ? 'text-white' : 'text-zinc-800'}`}>
                                                {product.name}
                                            </span>

                                            {/* Price + stock */}
                                            <div className="flex items-end justify-between mt-auto pt-1.5">
                                                <span className={`text-[15px] xl:text-base font-bold tabular-nums tracking-tight ${isInCart ? 'text-emerald-400' : 'text-zinc-900'}`}>
                                                    {formatCurrency(product.selling_price)}
                                                </span>
                                                {!isInCart && (
                                                    <span className={`text-[10px] font-medium tabular-nums ${isOutOfStock ? 'text-red-400' : isLowStock ? 'text-amber-500' : 'text-zinc-300'}`}>
                                                        {product.stock_quantity}
                                                    </span>
                                                )}
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full text-zinc-300">
                                <Search size={28} strokeWidth={1} className="mb-3 text-zinc-200" />
                                <div className="text-xs font-medium text-zinc-400">{t('pos.no_products_found', 'No products found')}</div>
                            </div>
                        )}
                    </div>

                    {/* Selected product detail — collapsible footer */}
                    {selectedProduct && (
                        <div className="shrink-0">
                            <ProductDetailCard
                                product={selectedProduct}
                                formatCurrency={formatCurrency}
                            />
                        </div>
                    )}

                    {/* 6 Multi-Cart Tabs — 3x2 Grid */}
                    <div className="shrink-0 bg-zinc-200 border-t border-zinc-100 overflow-hidden">
                        <div className="grid grid-cols-3 gap-px">
                            {Object.values(tabs).map(tab => {
                                const isActive = tab.id === activeTabId;
                                const tabCart = isActive ? cart : tab.cart;
                                const itemCount = tabCart.reduce((sum, item) => sum + item.quantity, 0);
                                const subtotal = tabCart.reduce((sum, item) => sum + (item.product.selling_price * item.quantity - (item.discount || 0)), 0);

                                return (
                                    <button
                                        key={tab.id}
                                        onClick={() => handleTabSwitch(tab.id)}
                                        className={`relative flex flex-col justify-between p-3 min-h-[85px] text-left transition-all duration-100 active:brightness-95 ${isActive
                                            ? 'bg-zinc-900 text-white'
                                            : 'bg-white hover:bg-zinc-50 text-zinc-900'
                                            }`}
                                    >
                                        <div className="flex justify-between w-full items-start">
                                            <span className={`text-[11px] font-bold uppercase tracking-wider ${isActive ? 'text-zinc-400' : 'text-zinc-500'}`}>
                                                [{`F${tab.id.split('-')[1]}`}] {tab.name}
                                            </span>
                                            {itemCount > 0 && (
                                                <span className={`text-[10px] w-5 h-5 flex items-center justify-center rounded-full font-bold tabular-nums ${isActive ? 'bg-emerald-500 text-white' : 'bg-zinc-900 text-white'
                                                    }`}>
                                                    {itemCount}
                                                </span>
                                            )}
                                        </div>
                                        <div className="mt-auto">
                                            <div className={`text-[10px] font-medium uppercase tracking-tight ${isActive ? 'text-zinc-500' : 'text-zinc-400'}`}>
                                                {t('pos.tab_total', 'Total')}:
                                            </div>
                                            <div className={`text-sm xl:text-base font-black tabular-nums tracking-tight ${isActive ? 'text-emerald-400' : 'text-zinc-900'}`}>
                                                {formatCurrency(subtotal)}
                                            </div>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </aside>

                {/* CENTER PANEL — Cart + Totals */}
                <main className="flex flex-col min-h-0 overflow-hidden bg-white" role="main" aria-label="Cart and totals">
                    {/* Client Info — above cart */}
                    <div className="hidden md:block shrink-0 border-b border-zinc-100 overflow-hidden">
                        <ClientInfoPanel
                            customer={selectedCustomer}
                            onSearch={() => setShowCustomerSearch(true)}
                            onClear={() => setSelectedCustomer(null)}
                            onEdit={() => {/* TODO: open edit modal */ }}
                            onAddNew={() => setShowAddCustomer(true)}
                        />
                    </div>

                    {/* Mobile/tablet search bar — visible when left panel is hidden */}
                    <div className="lg:hidden p-3 border-b border-zinc-100">
                        <div className="relative">
                            <Search size={15} strokeWidth={1.5} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-300" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder={t('pos.search_placeholder', 'Search products or scan barcode...')}
                                className="w-full pl-10 pr-12 py-2.5 rounded-2xl bg-zinc-50 border border-zinc-100 text-zinc-700 placeholder:text-zinc-300 text-sm font-medium focus:outline-none focus:border-zinc-200 focus:bg-white transition-colors"
                            />
                        </div>
                    </div>

                    {/* Cart area — CartTicket */}
                    <div className="flex-1 min-h-0 overflow-hidden">
                        <CartTicket
                            cart={cart}
                            ticketNumber={ticketNumber}
                            promotionResult={promotionResult}
                            selectedCartProductId={selectedCartProductId}
                            onQuantityChange={(productId, qty) => updateCartItem(productId, qty)}
                            onRemove={(productId) => {
                                const currentIndex = cart.findIndex(c => c.product.id === productId);
                                removeFromCart(productId);
                                if (selectedCartProductId === productId) {
                                    const newCart = cart.filter(c => c.product.id !== productId);
                                    if (newCart.length > 0) {
                                        const nextIndex = Math.min(currentIndex, newCart.length - 1);
                                        setSelectedCartProductId(newCart[nextIndex].product.id);
                                    } else {
                                        setSelectedCartProductId(null);
                                    }
                                }
                            }}
                            onDiscountClick={handleLineDiscount}
                            onSelect={setSelectedCartProductId}
                            formatCurrency={formatCurrency}
                        />
                    </div>

                    {/* Totals bar — sticky bottom */}
                    <TotalsBar
                        subtotal={cartTotal}
                        vatRate={vatRate}
                        vatAmount={cartTotal * vatRate}
                        promoSavings={promotionResult?.totalSavings ?? 0}
                        manualDiscount={manualDiscountTotal}
                        grandTotal={cartTotalWithPromos + cartTotal * vatRate - manualDiscountTotal}
                        formatCurrency={formatCurrency}
                    />

                    {/* NumericKeypad (Moved from left panel) */}
                    <div className="shrink-0 bg-white border-t border-zinc-100 hidden md:block">
                        <NumericKeypad
                            value={keypadValue}
                            onDigit={appendKeypad}
                            onBackspace={backspaceKeypad}
                            onClear={clearKeypad}
                            onConfirm={handleKeypadConfirm}
                        />
                    </div>

                    {/* Mobile/tablet checkout — visible when right panel is hidden */}
                    <div className="lg:hidden p-3 bg-white border-t border-zinc-100 flex gap-2">
                        <button
                            onClick={() => {
                                if (cart.length === 0) {
                                    toast.warning(t('pos.empty_cart_warning', 'Add items to the cart first'));
                                    return;
                                }
                                setShowSplitPayment(true);
                            }}
                            disabled={cart.length === 0 || isCheckingOut}
                            className="flex-1 py-3 bg-zinc-100 hover:bg-zinc-200 disabled:bg-zinc-50 disabled:cursor-not-allowed text-zinc-600 text-sm font-medium rounded-2xl transition-all active:scale-[0.98]"
                        >
                            {t('pos.split_payment', 'Split Payment')}
                        </button>
                        <button
                            onClick={handleCheckout}
                            disabled={cart.length === 0 || isCheckingOut}
                            className="flex-[2] py-3 bg-zinc-900 hover:bg-zinc-800 disabled:hover:bg-zinc-900 disabled:cursor-not-allowed text-white text-base font-semibold rounded-2xl transition-all active:scale-[0.98]"
                        >
                            {isCheckingOut ? t('pos.processing', 'Processing...') : t('pos.checkout', 'CHECKOUT')}
                        </button>
                    </div>
                </main>

                {/* RIGHT PANEL — Actions, Checkout */}
                <aside className="hidden lg:flex flex-col bg-zinc-950 overflow-hidden" aria-label="Actions and checkout">
                    {/* Operation Actions */}
                    <ActionGrid
                        onVoid={handleVoid}
                        onDiscount={handleDiscount}
                        onReprintReceipt={handleReprintReceipt}
                        onOpenDrawer={handleOpenDrawer}
                        onReturn={handleReturn}
                        onEndShift={() => setShowEndShiftConfirm(true)}
                    />

                    {/* Payment Actions */}
                    <div className="flex-1 mt-auto border-t border-zinc-900 bg-zinc-950 flex flex-col">
                        <PaymentMethodsGrid
                            onPayCash={handleCheckout}
                            onPayCard={() => handleCheckoutWithMethod('card')}
                            onPayMobile={() => handleCheckoutWithMethod('mobile')}
                            onPayDebt={handlePayDebt}
                            onSplitPayment={() => {
                                if (cart.length === 0) {
                                    toast.warning(t('pos.empty_cart_warning', 'Add items to the cart first'));
                                    return;
                                }
                                setShowSplitPayment(true);
                            }}
                            isProcessing={isCheckingOut}
                        />

                        {/* Huge primary checkout button — Minimal style */}
                        <button
                            onClick={handleCheckout}
                            disabled={isCheckingOut || cart.length === 0}
                            className="w-full h-48 lg:h-60 bg-emerald-600 hover:bg-emerald-500 disabled:hover:bg-emerald-600 text-white text-xl lg:text-2xl xl:text-4xl font-black uppercase tracking-[0.2em] transition-all active:scale-[0.98] disabled:cursor-not-allowed border-t border-white/10"
                        >
                            {isCheckingOut ? t('pos.processing', 'Processing...') : t('pos.checkout', 'CHECKOUT')}
                        </button>
                    </div>
                </aside>
            </div>

            {/* === Global Modals === */}
            <ManagerPinDialog
                isOpen={authStore.isOpen}
                action={authStore.action}
                onSubmit={authStore.submitPin}
                onCancel={authStore.cancel}
                isVerifying={authStore.isVerifying}
                error={authStore.error ?? undefined}
            />

            <DiscountDialog
                isOpen={showDiscountDialog}
                onClose={() => setShowDiscountDialog(false)}
                scope={discountScope}
                currentDiscount={discountCurrent}
                maxAmount={discountMaxAmount}
                onApply={handleApplyDiscount}
                onClear={handleClearDiscount}
            />

            <ReturnDialog
                isOpen={showReturnDialog}
                onClose={() => { setShowReturnDialog(false); setReturnManagerId(null); }}
                onConfirm={handleReturnConfirm}
                managerId={returnManagerId}
            />

            <StockErrorDialog error={stockError} onClose={clearStockError} />

            <SplitPaymentPanel
                isOpen={showSplitPayment}
                onClose={() => setShowSplitPayment(false)}
                grandTotal={cartTotalWithPromos + cartTotal * vatRate - manualDiscountTotal}
                onFinalize={handleSplitPaymentFinalize}
                formatCurrency={formatCurrency}
            />

            {
                showScanner && (
                    <BarcodeScanner
                        onScan={handleScan}
                        onClose={() => setShowScanner(false)}
                    />
                )
            }

            {/* End Shift Confirmation Dialog */}
            {
                showEndShiftConfirm && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                            onClick={() => setShowEndShiftConfirm(false)}
                        />
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="relative bg-white border border-gray-100 rounded-2xl p-6 w-full max-w-sm shadow-2xl"
                        >
                            <div className="text-center mb-6">
                                <h3 className="text-lg font-bold text-black mb-1">
                                    {t('pos.end_shift_title', 'End Shift?')}
                                </h3>
                                <p className="text-black/40 text-sm">
                                    {t('pos.end_shift_message', 'This will close your current cashier session and log you out. Are you sure?')}
                                </p>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setShowEndShiftConfirm(false)}
                                    className="flex-1 py-2.5 bg-gray-50 text-black font-bold rounded-xl transition-all hover:bg-gray-100"
                                >
                                    {t('common.cancel', 'Cancel')}
                                </button>
                                <button
                                    onClick={async () => {
                                        setShowEndShiftConfirm(false);
                                        await handleEndShift();
                                    }}
                                    className="flex-1 py-2.5 bg-red-500 text-white font-bold rounded-xl transition-all hover:bg-red-600"
                                >
                                    {t('pos.end_shift_confirm', 'End Shift')}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )
            }

            {/* Reprint Receipt Preview */}
            {
                showReceiptPreview && lastSale && (
                    <ReceiptPreview
                        sale={lastSale}
                        items={lastSaleItems}
                        onClose={() => setShowReceiptPreview(false)}
                    />
                )
            }

            {/* Customer Search Dialog */}
            <CustomerSearchDialog
                isOpen={showCustomerSearch}
                onClose={() => setShowCustomerSearch(false)}
                onSelect={(customer) => setSelectedCustomer(customer)}
            />

            {/* Add New Customer Modal */}
            <CustomerModal
                isOpen={showAddCustomer}
                onClose={() => {
                    setShowAddCustomer(false);
                    useCustomerStore.getState().loadCustomers();
                }}
            />
        </div >
    );
}
