import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowUpCircle, ArrowDownCircle, RotateCcw, Package, AlertTriangle, Container, Banknote } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn, formatCurrency, getCurrencySymbol } from '@/lib/utils';
import { useProductStore } from '@/stores/useProductStore';
import { useStockStore } from '@/stores/useStockStore';
import SearchInput from '@/components/common/SearchInput';
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

    // Reset stock page when search/filter changes
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

    const getMovementColor = (type: string) => {
        switch (type) {
            case 'in':
            case 'return':
                return 'var(--color-success)';
            case 'out':
                return 'var(--color-danger)';
            case 'adjustment':
                return 'var(--color-warning)';
            default:
                return 'var(--color-text-muted)';
        }
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
        'w-full px-4 py-3.5 rounded-2xl',
        'bg-zinc-50 border-2 border-transparent',
        'text-[15px] font-medium text-black placeholder:text-black/30',
        'focus:outline-none focus:bg-white focus:border-black/10 focus:ring-4 focus:ring-black/[0.02]',
        'transition-all duration-300',
    );

    return (
        <div className="space-y-8 animate-fadeIn pb-12 h-full flex flex-col mt-8">
            {/* Header / Welcome Card (Matches Dashboard) */}
            <div className="relative overflow-hidden bg-white border-2 border-gray-200 p-8 rounded-[4rem] animate-fadeIn flex flex-col md:flex-row md:items-center justify-between gap-6 transition-all duration-300">
                {/* Grid Background */}
                <div
                    className="absolute inset-0 pointer-events-none opacity-40"
                    style={{
                        backgroundImage: `linear-gradient(to right, rgba(0, 0, 0, 0.3) 1px, transparent 1px), linear-gradient(to bottom, rgba(0, 0, 0, 0.3) 1px, transparent 1px)`,
                        backgroundSize: '32px 32px',
                        maskImage: 'radial-gradient(circle at top center, black, transparent 80%)',
                        WebkitMaskImage: 'radial-gradient(circle at top center, black, transparent 80%)',
                    }}
                />

                <div className="relative z-10 flex flex-col gap-1">
                    <div className="flex items-center gap-3">
                        <span className="text-[15px] text-black uppercase tracking-[0.3em] mb-1">
                            {t('sidebar.stock_control')}
                        </span>
                    </div>
                    <h2 className="text-3xl font-bold text-black tracking-tight font-sans flex items-center gap-3">
                        {t('stock_control.title')}
                        <div className="bg-emerald-100 p-2 rounded-full transform hover:rotate-12 transition-transform duration-300">
                            <Package className="w-8 h-8 text-emerald-500" strokeWidth={2.5} />
                        </div>
                    </h2>
                    <p className="text-zinc-500 text-sm font-medium">{t('stock_control.subtitle')}</p>
                </div>
            </div>

            {/* Stats Grid - Matches Dashboard */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Total Products (Yellow Theme) */}
                <motion.div className="bg-yellow-300 border-2 border-black/10 flex flex-col justify-between aspect-[2/1] md:aspect-auto md:h-40 p-6 rounded-[2.5rem] relative overflow-hidden group cursor-pointer">
                    <div className="flex items-center justify-between relative z-10">
                        <span className="text-[10px] font-bold text-black/60 uppercase tracking-widest">
                            {t('stock_control.stat_total_products')}
                        </span>
                        <div className="p-2 bg-black/5 rounded-full">
                            <Package size={16} className="text-black" />
                        </div>
                    </div>
                    <div className="relative z-10">
                        <div className="flex items-baseline gap-1">
                            <span className="text-3xl font-black text-black tracking-tighter">
                                {products.length.toLocaleString()}
                            </span>
                        </div>
                    </div>
                </motion.div>

                {/* Total Units (White Theme) */}
                <motion.div className="bg-white border-2 border-black/10 flex flex-col justify-between aspect-[2/1] md:aspect-auto md:h-40 p-6 rounded-[2.5rem] relative overflow-hidden group cursor-pointer">
                    <div className="flex items-center justify-between relative z-10">
                        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                            {t('stock_control.stat_total_units')}
                        </span>
                        <div className="p-2 bg-zinc-100 rounded-full">
                            <Container size={16} className="text-black" />
                        </div>
                    </div>
                    <div className="relative z-10">
                        <div className="flex items-baseline gap-1">
                            <span className="text-3xl font-black text-black tracking-tighter">
                                {products.reduce((s, p) => s + p.stock_quantity, 0).toLocaleString()}
                            </span>
                            <span className="text-[10px] font-bold text-zinc-400 uppercase">Items</span>
                        </div>
                    </div>
                </motion.div>

                {/* Stock Value (Black Theme) */}
                <motion.div className="bg-black text-white flex flex-col justify-between aspect-[2/1] md:aspect-auto md:h-40 p-6 rounded-[2.5rem] relative overflow-hidden group cursor-pointer">
                    <div className="absolute top-0 right-0 p-16 bg-zinc-800 rounded-full blur-2xl opacity-20 -translate-y-1/2 translate-x-1/2" />
                    <div className="flex items-center justify-between relative z-10">
                        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                            {t('stock_control.stat_stock_value')}
                        </span>
                        <div className="p-2 bg-white/10 rounded-full">
                            <Banknote size={16} className="text-white" />
                        </div>
                    </div>
                    <div className="relative z-10">
                        <div className="flex items-baseline gap-1">
                            <span className="text-3xl font-black text-white tracking-tighter">
                                {formatCurrency(products.reduce((s, p) => s + p.cost_price * p.stock_quantity, 0), false)}
                            </span>
                            <span className="text-[10px] font-bold text-zinc-500 uppercase">
                                {getCurrencySymbol()}
                            </span>
                        </div>
                    </div>
                </motion.div>

                {/* Low Stock (Red/Rose Theme) */}
                <motion.div className="bg-rose-100 border-2 border-rose-200 flex flex-col justify-between aspect-[2/1] md:aspect-auto md:h-40 p-6 rounded-[2.5rem] relative overflow-hidden group cursor-pointer">
                    <div className="flex items-center justify-between relative z-10">
                        <span className="text-[10px] font-bold text-rose-900/60 uppercase tracking-widest">
                            {t('stock_control.stat_low_stock')}
                        </span>
                        <div className="p-2 bg-rose-900/10 rounded-full">
                            <AlertTriangle size={16} className="text-rose-900" />
                        </div>
                    </div>
                    <div className="relative z-10">
                        <div className="flex items-baseline gap-1">
                            <span className="text-3xl font-black text-rose-900 tracking-tighter">
                                {lowStockProducts.length}
                            </span>
                            <span className="text-[10px] font-bold text-rose-900/60 uppercase">Items</span>
                        </div>
                    </div>
                </motion.div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 xl:gap-8">
                {/* Stock List */}
                <div className="lg:col-span-3 space-y-6">
                    {/* Search & Filter Header within a soft wrapper */}
                    <div className="flex flex-col sm:flex-row items-center gap-4">
                        <SearchInput
                            value={search}
                            onChange={setSearch}
                            placeholder={t('stock_control.search_placeholder')}
                            className="flex-1 w-full"
                        />
                        <button
                            onClick={() => setShowLowOnly(!showLowOnly)}
                            className={cn(
                                'flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl text-sm font-bold transition-all duration-300 min-w-[140px] w-full sm:w-auto',
                                showLowOnly
                                    ? 'bg-rose-100 text-rose-600 hover:bg-rose-200'
                                    : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200 hover:text-black',
                            )}
                        >
                            <AlertTriangle size={16} />
                            {t('stock_control.low_stock_filter')}
                        </button>
                    </div>

                    <div className="rounded-[3rem] p-6 sm:p-8 bg-white border-2 border-black/[0.04] overflow-hidden min-h-[400px] flex flex-col relative">
                        {filtered.length === 0 ? (
                            <div className="flex-1 flex flex-col items-center justify-center py-12">
                                <Package size={48} className="text-black/10 mb-4" />
                                <p className="text-lg font-bold text-black/40">
                                    {t('stock_control.no_products')}
                                </p>
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
                                            className="group flex items-center gap-4 py-4 border-b border-black/[0.04] last:border-0 hover:bg-zinc-50 transition-colors sm:-mx-8 sm:px-8 -mx-6 px-6"
                                        >
                                            <div className="p-3 bg-zinc-100 rounded-2xl group-hover:bg-white transition-colors">
                                                <Package size={20} className="text-black/40" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-[15px] font-bold text-black truncate leading-tight">
                                                    {product.name}
                                                </p>
                                                <p className="text-xs text-black/40 font-medium uppercase tracking-wider mt-0.5 mt-1">
                                                    {product.category_name || t('stock_control.no_category')}
                                                </p>
                                            </div>

                                            <div className="w-24 hidden sm:block">
                                                <div className="h-1.5 rounded-full bg-zinc-100 overflow-hidden">
                                                    <div
                                                        className="h-full rounded-full transition-all duration-500 ease-out"
                                                        style={{
                                                            width: `${pct}%`,
                                                            backgroundColor: isLow
                                                                ? '#f43f5e' /* rose-500 */
                                                                : '#10b981' /* emerald-500 */,
                                                        }}
                                                    />
                                                </div>
                                            </div>

                                            <div className="text-right min-w-[70px]">
                                                <span
                                                    className={cn(
                                                        'text-lg font-black tracking-tight',
                                                        isLow
                                                            ? 'text-rose-600'
                                                            : 'text-black',
                                                    )}
                                                >
                                                    {product.stock_quantity}
                                                </span>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => setAdjustModal({ product, type: 'remove' })}
                                                    className="w-10 h-10 flex items-center justify-center rounded-xl bg-rose-50 text-rose-500 hover:bg-rose-500 hover:text-white transition-all duration-200"
                                                    title={t('stock_control.remove_stock')}
                                                >
                                                    <ArrowDownCircle size={18} />
                                                </button>
                                                <button
                                                    onClick={() => setAdjustModal({ product, type: 'add' })}
                                                    className="w-10 h-10 flex items-center justify-center rounded-xl bg-emerald-50 text-emerald-500 hover:bg-emerald-500 hover:text-white transition-all duration-200"
                                                    title={t('stock_control.add_stock')}
                                                >
                                                    <ArrowUpCircle size={18} />
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        <div className="mt-8 pt-4 border-t border-black/[0.04]">
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
                    <div className="rounded-[3rem] p-6 sm:p-8 bg-zinc-50 border-2 border-black/[0.04] h-full flex flex-col min-h-[400px]">
                        <div className="mb-6 flex items-center justify-between">
                            <div>
                                <h2 className="text-xl font-bold text-black tracking-tight">
                                    {t('stock_control.recent_movements')}
                                </h2>
                                <p className="text-[10px] text-black/40 uppercase tracking-[0.2em] mt-1">
                                    History Log
                                </p>
                            </div>
                            <div className="p-2 bg-white rounded-xl shadow-sm">
                                <RotateCcw size={18} className="text-black/40" />
                            </div>
                        </div>

                        {movements.length === 0 ? (
                            <div className="flex-1 flex flex-col items-center justify-center py-12">
                                <RotateCcw size={48} className="text-black/10 mb-4" />
                                <p className="text-lg font-bold text-black/40">
                                    {t('stock_control.no_movements')}
                                </p>
                            </div>
                        ) : (
                            <div className="flex-1 flex flex-col gap-2">
                                {paginatedMovements.map((mvt) => {
                                    const Icon = getMovementIcon(mvt.type);
                                    let colorClasses = 'bg-zinc-200/50 text-zinc-600';
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
                                        <div key={mvt.id} className="flex items-center gap-4 bg-white p-4 rounded-2xl border border-black/[0.03] shadow-sm shadow-black/[0.01]">
                                            <div className={cn("p-2.5 rounded-xl", colorClasses)}>
                                                <Icon size={18} className={iconColor} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-bold text-black truncate">
                                                    {mvt.reference_id}
                                                </p>
                                                <p className="text-[10px] font-bold uppercase tracking-wider text-black/40 mt-0.5">
                                                    {mvt.type}
                                                </p>
                                            </div>
                                            <span className={cn('text-lg font-black tracking-tight', iconColor)}>
                                                {mvt.quantity > 0 ? '+' : ''}{mvt.quantity}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        <div className="mt-6 pt-6 border-t border-black/[0.04]">
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
                    <DialogContent className="max-w-md rounded-[2.5rem] p-6 sm:p-8 bg-white border-0 shadow-2xl overflow-hidden">
                        <DialogHeader className="mb-6">
                            <DialogTitle className="text-2xl font-bold text-black tracking-tight">
                                {adjustModal.type === 'add'
                                    ? t('stock_control.modal_add')
                                    : t('stock_control.modal_remove')}{' '}
                                — {adjustModal.product.name}
                            </DialogTitle>
                        </DialogHeader>
                        <div className="space-y-6">
                            <div className="flex items-center gap-4 p-4 rounded-2xl bg-zinc-50 border border-black/[0.04]">
                                <div className="p-3 bg-white rounded-xl shadow-sm">
                                    <Package size={20} className="text-black/40" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-[15px] font-bold text-black truncate leading-tight">
                                        {adjustModal.product.name}
                                    </p>
                                    <p className="text-xs font-bold text-black/40 uppercase tracking-wider mt-1">
                                        {t('stock_control.current_stock', {
                                            count: adjustModal.product.stock_quantity,
                                        })}
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="text-xs font-bold text-black/40 uppercase tracking-widest mb-2 block ml-1">
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
                                    <label className="text-xs font-bold text-black/40 uppercase tracking-widest mb-2 block ml-1">
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

                            <div className="flex justify-end gap-3 pt-6 mt-2">
                                <Button
                                    variant="secondary"
                                    className="rounded-2xl px-6"
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
                                        "rounded-2xl px-6 font-bold shadow-lg shadow-black/5",
                                        adjustModal.type === 'remove' && "bg-rose-500 hover:bg-rose-600 text-white border-0"
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
