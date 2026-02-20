import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
    ArrowUpCircle,
    ArrowDownCircle,
    RotateCcw,
    Package,
    AlertTriangle,
    Container,
    Banknote,
    Search,
    X,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn, formatCurrency, getCurrencySymbol } from '@/lib/utils';
import { useProductStore } from '@/stores/useProductStore';
import { useStockStore } from '@/stores/useStockStore';
import Button from '@/components/common/Button';
import Pagination from '@/components/common/Pagination';
import { usePagination } from '@/hooks/usePagination';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import type { Product } from '@/lib/types';
import { usePageTitle } from '@/hooks/usePageTitle';

export default function StockControl() {
    const { t } = useTranslation();
    usePageTitle(t('sidebar.stock_control'));
    const { products, lowStockProducts, loadProducts, loadLowStock } = useProductStore();
    const { movements, loadMovements, addStock, removeStock, adjustStock } = useStockStore();
    const [search, setSearch] = useState('');
    const [showLowOnly, setShowLowOnly] = useState(false);
    const [adjustModal, setAdjustModal] = useState<{ product: Product; type: 'add' | 'remove' | 'adjust' } | null>(
        null,
    );
    const [adjustQty, setAdjustQty] = useState(0);
    const [adjustReason, setAdjustReason] = useState('');
    const searchInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        loadProducts();
        loadLowStock();
        loadMovements({ limit: 20 });
    }, [loadProducts, loadLowStock, loadMovements]);

    const filtered = products.filter((p) => {
        if (showLowOnly && p.stock_quantity > p.reorder_level) return false;
        if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false;
        return true;
    });

    const {
        currentPage: stockPage,
        totalPages: stockTotalPages,
        startIndex: stockStart,
        endIndex: stockEnd,
        setCurrentPage: setStockPage,
        paginate: paginateStock,
        resetPage: resetStockPage,
    } = usePagination({ totalItems: filtered.length });

    const {
        currentPage: mvtPage,
        totalPages: mvtTotalPages,
        startIndex: mvtStart,
        endIndex: mvtEnd,
        setCurrentPage: setMvtPage,
        paginate: paginateMvt,
    } = usePagination({ totalItems: movements.length });

    useEffect(() => {
        resetStockPage();
    }, [search, showLowOnly, resetStockPage]);

    const paginatedProducts = paginateStock(filtered);
    const paginatedMovements = paginateMvt(movements);

    const handleAdjust = async () => {
        if (!adjustModal || adjustQty <= 0) return;
        const { product, type } = adjustModal;
        if (type === 'add') {
            await addStock(product.id, adjustQty, adjustReason || 'Stock added');
        } else if (type === 'remove') {
            await removeStock(product.id, adjustQty, adjustReason || 'Stock removed');
        } else {
            await adjustStock(product.id, adjustQty, adjustReason || 'Stock adjusted');
        }
        setAdjustModal(null);
        setAdjustQty(0);
        setAdjustReason('');
        await loadProducts();
        await loadLowStock();
        await loadMovements({ limit: 20 });
    };

    const getMovementIcon = (type: string) => {
        switch (type) {
            case 'in':
            case 'return':
                return ArrowUpCircle;
            case 'out':
                return ArrowDownCircle;
            default:
                return RotateCcw;
        }
    };

    const inputClass = cn(
        'w-full px-4 py-3.5 rounded-xl',
        'bg-zinc-50 border border-zinc-200',
        'text-base font-medium text-black placeholder:text-zinc-400',
        'focus:outline-none focus:border-zinc-400 focus:bg-white',
        'transition-all duration-300',
    );

    return (
        <div className="relative flex flex-col items-start gap-8 p-6 lg:p-8 animate-fadeIn mt-4">
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

            <div className="relative z-10 flex-1 flex flex-col min-w-0 w-full">
                {/* Header Section */}
                <div className="flex flex-col space-y-6 pb-6">
                    <div className="flex items-center justify-between">
                        <div className="flex flex-col gap-1">
                            <span className="text-[12px] text-zinc-400 tracking-[0.3em] font-bold">
                                {t('sidebar.stock_control')}
                            </span>
                            <h2 className="text-3xl font-black text-black tracking-tighter uppercase">
                                {t('stock_control.title')}
                            </h2>
                        </div>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    {/* Total Products */}
                    <motion.div className="bg-yellow-300 border-2 border-black/10 flex flex-col justify-between aspect-[2/1] md:aspect-auto md:h-36 p-5 rounded-[2rem] relative overflow-hidden group cursor-pointer">
                        <div className="flex items-center justify-between relative z-10">
                            <span className="text-[10px] font-bold text-black/60 uppercase tracking-widest">
                                {t('stock_control.stat_total_products')}
                            </span>
                            <div className="p-2 bg-black/5 rounded-full">
                                <Package size={14} className="text-black" />
                            </div>
                        </div>
                        <div className="relative z-10">
                            <span className="text-2xl font-black text-black tracking-tighter">
                                {products.length.toLocaleString()}
                            </span>
                        </div>
                    </motion.div>

                    {/* Total Units */}
                    <motion.div className="bg-white border-2 border-black/10 flex flex-col justify-between aspect-[2/1] md:aspect-auto md:h-36 p-5 rounded-[2rem] relative overflow-hidden group cursor-pointer">
                        <div className="flex items-center justify-between relative z-10">
                            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                                {t('stock_control.stat_total_units')}
                            </span>
                            <div className="p-2 bg-zinc-100 rounded-full">
                                <Container size={14} className="text-black" />
                            </div>
                        </div>
                        <div className="relative z-10">
                            <div className="flex items-baseline gap-1">
                                <span className="text-2xl font-black text-black tracking-tighter">
                                    {products.reduce((s, p) => s + p.stock_quantity, 0).toLocaleString()}
                                </span>
                                <span className="text-[10px] font-bold text-zinc-400 uppercase">Items</span>
                            </div>
                        </div>
                    </motion.div>

                    {/* Stock Value */}
                    <motion.div className="bg-black text-white flex flex-col justify-between aspect-[2/1] md:aspect-auto md:h-36 p-5 rounded-[2rem] relative overflow-hidden group cursor-pointer">
                        <div className="absolute top-0 right-0 p-16 bg-zinc-800 rounded-full blur-2xl opacity-20 -translate-y-1/2 translate-x-1/2" />
                        <div className="flex items-center justify-between relative z-10">
                            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                                {t('stock_control.stat_stock_value')}
                            </span>
                            <div className="p-2 bg-white/10 rounded-full">
                                <Banknote size={14} className="text-white" />
                            </div>
                        </div>
                        <div className="relative z-10">
                            <div className="flex items-baseline gap-1">
                                <span className="text-2xl font-black text-white tracking-tighter">
                                    {formatCurrency(
                                        products.reduce((s, p) => s + p.cost_price * p.stock_quantity, 0),
                                        false,
                                    )}
                                </span>
                                <span className="text-[10px] font-bold text-zinc-500 uppercase">
                                    {getCurrencySymbol()}
                                </span>
                            </div>
                        </div>
                    </motion.div>

                    {/* Low Stock */}
                    <motion.div className="bg-rose-100 border-2 border-rose-200 flex flex-col justify-between aspect-[2/1] md:aspect-auto md:h-36 p-5 rounded-[2rem] relative overflow-hidden group cursor-pointer">
                        <div className="flex items-center justify-between relative z-10">
                            <span className="text-[10px] font-bold text-rose-900/60 uppercase tracking-widest">
                                {t('stock_control.stat_low_stock')}
                            </span>
                            <div className="p-2 bg-rose-900/10 rounded-full">
                                <AlertTriangle size={14} className="text-rose-900" />
                            </div>
                        </div>
                        <div className="relative z-10">
                            <div className="flex items-baseline gap-1">
                                <span className="text-2xl font-black text-rose-900 tracking-tighter">
                                    {lowStockProducts.length}
                                </span>
                                <span className="text-[10px] font-bold text-rose-900/60 uppercase">Items</span>
                            </div>
                        </div>
                    </motion.div>
                </div>

                {/* Search Bar */}
                <div className="relative group mb-8">
                    <Search
                        size={22}
                        className="absolute left-6 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-black transition-colors"
                    />
                    <input
                        ref={searchInputRef}
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder={t('stock_control.search_placeholder')}
                        className={cn(
                            'w-full pl-16 pr-16 py-5 rounded-[2.5rem]',
                            'bg-white border border-zinc-200 shadow-none',
                            'text-black placeholder:text-zinc-300 text-lg font-bold',
                            'focus:outline-none focus:ring-0 focus:!outline-none focus-visible:!outline-none focus-visible:ring-0 focus:border-zinc-400 transition-all placeholder:transition-opacity focus:placeholder:opacity-50',
                        )}
                    />
                    {search && (
                        <motion.button
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            onClick={() => {
                                setSearch('');
                                searchInputRef.current?.focus();
                            }}
                            className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-zinc-100 text-zinc-400 hover:bg-black hover:text-white transition-all duration-300"
                        >
                            <X size={16} strokeWidth={3} />
                        </motion.button>
                    )}
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 xl:gap-8">
                    {/* Stock List */}
                    <div className="lg:col-span-3 space-y-6">
                        {/* Filter Button */}
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => setShowLowOnly(!showLowOnly)}
                                className={cn(
                                    'flex items-center gap-2 px-4 py-2 rounded-md border shadow-lg transition-all active:scale-95',
                                    showLowOnly
                                        ? 'bg-rose-500 text-white border-rose-500 shadow-rose-500/20 hover:bg-rose-600'
                                        : 'bg-black text-white border-black shadow-black/20 hover:bg-neutral-800',
                                )}
                            >
                                <AlertTriangle size={16} />
                                <span className="text-[10px] font-black uppercase tracking-widest">
                                    {t('stock_control.low_stock_filter')}
                                </span>
                            </button>
                        </div>

                        {/* Products List */}
                        <div className="rounded-[2rem] p-6 bg-white border border-zinc-200 overflow-hidden min-h-[400px] flex flex-col">
                            {filtered.length === 0 ? (
                                <div className="flex-1 flex flex-col items-center justify-center py-12">
                                    <Package size={48} className="text-zinc-200 mb-4" />
                                    <p className="text-lg font-bold text-zinc-400">{t('stock_control.no_products')}</p>
                                </div>
                            ) : (
                                <div className="flex-1 flex flex-col">
                                    {paginatedProducts.map((product) => {
                                        const isLow = product.stock_quantity <= product.reorder_level;
                                        const pct = Math.min(
                                            100,
                                            (product.stock_quantity / Math.max(1, product.reorder_level * 3)) * 100,
                                        );
                                        return (
                                            <div
                                                key={product.id}
                                                className="group flex items-center gap-4 py-4 border-b border-zinc-100 last:border-0 transition-colors -mx-6 px-6"
                                            >
                                                <div className="p-3 bg-zinc-50 rounded-xl group-hover:bg-zinc-100 transition-colors">
                                                    <Package size={18} className="text-zinc-400" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-bold text-black truncate leading-tight">
                                                        {product.name}
                                                    </p>
                                                    <p className="text-[10px] text-zinc-400 font-medium uppercase tracking-wider mt-0.5">
                                                        {product.category_name || t('stock_control.no_category')}
                                                    </p>
                                                </div>

                                                <div className="w-20 hidden sm:block">
                                                    <div className="h-1 rounded-full bg-zinc-100 overflow-hidden">
                                                        <div
                                                            className="h-full rounded-full transition-all duration-500 ease-out"
                                                            style={{
                                                                width: `${pct}%`,
                                                                backgroundColor: isLow ? '#f43f5e' : '#10b981',
                                                            }}
                                                        />
                                                    </div>
                                                </div>

                                                <div className="text-right min-w-[60px]">
                                                    <span
                                                        className={cn(
                                                            'text-base font-black tracking-tight',
                                                            isLow ? 'text-rose-500' : 'text-black',
                                                        )}
                                                    >
                                                        {product.stock_quantity}
                                                    </span>
                                                </div>

                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => setAdjustModal({ product, type: 'remove' })}
                                                        className="w-9 h-9 flex items-center justify-center rounded-lg bg-zinc-100 text-zinc-500 hover:bg-rose-500 hover:text-white transition-all duration-200"
                                                        title={t('stock_control.remove_stock')}
                                                    >
                                                        <ArrowDownCircle size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => setAdjustModal({ product, type: 'add' })}
                                                        className="w-9 h-9 flex items-center justify-center rounded-lg bg-zinc-100 text-zinc-500 hover:bg-emerald-500 hover:text-white transition-all duration-200"
                                                        title={t('stock_control.add_stock')}
                                                    >
                                                        <ArrowUpCircle size={16} />
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            <div className="mt-6 pt-4 border-t border-zinc-100">
                                <Pagination
                                    currentPage={stockPage}
                                    totalPages={stockTotalPages}
                                    totalItems={filtered.length}
                                    startIndex={stockStart}
                                    endIndex={stockEnd}
                                    onPageChange={setStockPage}
                                    itemLabel={t('stock_control.title')}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Movement History */}
                    <div className="lg:col-span-2">
                        <div className="rounded-[2rem] p-6 bg-zinc-50 border border-zinc-200 h-full flex flex-col min-h-[400px]">
                            <div className="mb-6 flex items-center justify-between">
                                <div>
                                    <h2 className="text-lg font-bold text-black tracking-tight">
                                        {t('stock_control.recent_movements')}
                                    </h2>
                                    <p className="text-[10px] text-zinc-400 uppercase tracking-[0.2em] mt-1">
                                        History Log
                                    </p>
                                </div>
                                <div className="p-2 bg-white rounded-xl shadow-sm">
                                    <RotateCcw size={16} className="text-zinc-400" />
                                </div>
                            </div>

                            {movements.length === 0 ? (
                                <div className="flex-1 flex flex-col items-center justify-center py-12">
                                    <RotateCcw size={48} className="text-zinc-200 mb-4" />
                                    <p className="text-lg font-bold text-zinc-400">{t('stock_control.no_movements')}</p>
                                </div>
                            ) : (
                                <div className="flex-1 flex flex-col gap-2">
                                    {paginatedMovements.map((mvt) => {
                                        const Icon = getMovementIcon(mvt.type);
                                        let colorClasses = 'bg-zinc-100 text-zinc-600';
                                        let iconColor = 'text-zinc-500';

                                        if (mvt.type === 'in' || mvt.type === 'return') {
                                            colorClasses = 'bg-emerald-100 text-emerald-700';
                                            iconColor = 'text-emerald-600';
                                        } else if (mvt.type === 'out') {
                                            colorClasses = 'bg-rose-100 text-rose-700';
                                            iconColor = 'text-rose-600';
                                        } else if (mvt.type === 'adjustment') {
                                            colorClasses = 'bg-yellow-100 text-yellow-700';
                                            iconColor = 'text-yellow-600';
                                        }

                                        return (
                                            <div
                                                key={mvt.id}
                                                className="flex items-center gap-4 bg-white p-4 rounded-xl border border-zinc-100"
                                            >
                                                <div className={cn('p-2 rounded-lg', colorClasses)}>
                                                    <Icon size={16} className={iconColor} />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-bold text-black truncate">
                                                        {mvt.reference_id}
                                                    </p>
                                                    <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 mt-0.5">
                                                        {mvt.type}
                                                    </p>
                                                </div>
                                                <span className={cn('text-base font-black tracking-tight', iconColor)}>
                                                    {mvt.quantity > 0 ? '+' : ''}
                                                    {mvt.quantity}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            <div className="mt-6 pt-4 border-t border-zinc-100">
                                <Pagination
                                    currentPage={mvtPage}
                                    totalPages={mvtTotalPages}
                                    totalItems={movements.length}
                                    startIndex={mvtStart}
                                    endIndex={mvtEnd}
                                    onPageChange={setMvtPage}
                                    itemLabel={t('stock_control.recent_movements')}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Adjust Stock Modal */}
            {adjustModal && (
                <Dialog
                    open={true}
                    onOpenChange={(open) => {
                        if (!open) {
                            setAdjustModal(null);
                            setAdjustQty(0);
                            setAdjustReason('');
                        }
                    }}
                >
                    <DialogContent className="max-w-md rounded-[2rem] p-6 bg-white border border-zinc-200 shadow-xl overflow-hidden">
                        <DialogHeader className="mb-6">
                            <DialogTitle className="text-xl font-bold text-black tracking-tight">
                                {adjustModal.type === 'add'
                                    ? t('stock_control.modal_add')
                                    : t('stock_control.modal_remove')}{' '}
                                — {adjustModal.product.name}
                            </DialogTitle>
                        </DialogHeader>
                        <div className="space-y-5">
                            <div className="flex items-center gap-4 p-4 rounded-xl bg-zinc-50 border border-zinc-100">
                                <div className="p-3 bg-white rounded-lg shadow-sm">
                                    <Package size={18} className="text-zinc-400" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-bold text-black truncate leading-tight">
                                        {adjustModal.product.name}
                                    </p>
                                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mt-1">
                                        {t('stock_control.current_stock', {
                                            count: adjustModal.product.stock_quantity,
                                        })}
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2 block ml-1">
                                        {t('stock_control.label_quantity')}
                                    </label>
                                    <input
                                        type="number"
                                        min="1"
                                        step="1"
                                        value={adjustQty || ''}
                                        onChange={(e) => setAdjustQty(parseInt(e.target.value) || 0)}
                                        className={inputClass}
                                        autoFocus
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2 block ml-1">
                                        {t('stock_control.label_reason')}
                                    </label>
                                    <input
                                        type="text"
                                        value={adjustReason}
                                        onChange={(e) => setAdjustReason(e.target.value)}
                                        placeholder={t('stock_control.reason_placeholder')}
                                        className={inputClass}
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-4">
                                <Button
                                    variant="secondary"
                                    className="rounded-xl px-5"
                                    onClick={() => {
                                        setAdjustModal(null);
                                        setAdjustQty(0);
                                        setAdjustReason('');
                                    }}
                                >
                                    {t('stock_control.cancel')}
                                </Button>
                                <Button
                                    onClick={handleAdjust}
                                    disabled={adjustQty <= 0}
                                    className={cn(
                                        'rounded-xl px-5 font-bold',
                                        adjustModal.type === 'remove' &&
                                            'bg-rose-500 hover:bg-rose-600 text-white border-0',
                                    )}
                                >
                                    {adjustModal.type === 'add'
                                        ? t('stock_control.confirm_add')
                                        : t('stock_control.confirm_remove')}
                                </Button>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
            )}
        </div>
    );
}
