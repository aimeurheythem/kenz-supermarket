import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowUpCircle, ArrowDownCircle, RotateCcw, Package, AlertTriangle } from 'lucide-react';
import { cn, formatCurrency } from '@/lib/utils';
import { useProductStore } from '@/stores/useProductStore';
import { useStockStore } from '@/stores/useStockStore';
import SearchInput from '@/components/common/SearchInput';
import Button from '@/components/common/Button';
import Pagination from '@/components/common/Pagination';
import { usePagination } from '@/hooks/usePagination';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import type { Product } from '@/lib/types';

export default function StockControl() {
    const { t } = useTranslation();
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
            case 'purchase':
            case 'addition':
                return 'var(--color-success)';
            case 'sale':
            case 'removal':
                return 'var(--color-danger)';
            case 'adjustment':
                return 'var(--color-warning)';
            default:
                return 'var(--color-text-muted)';
        }
    };

    const getMovementIcon = (type: string) => {
        switch (type) {
            case 'purchase':
            case 'addition':
                return ArrowUpCircle;
            case 'sale':
            case 'removal':
                return ArrowDownCircle;
            default:
                return RotateCcw;
        }
    };

    const inputClass = cn(
        'w-full px-3 py-2.5 rounded-[var(--radius-md)]',
        'bg-[var(--color-bg-input)] border border-[var(--color-border)]',
        'text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)]',
        'focus:outline-none focus:border-[var(--color-accent)] focus:ring-1 focus:ring-[var(--color-accent)]',
        'transition-all duration-200',
    );

    return (
        <div className="space-y-5 animate-fadeIn">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">{t('stock_control.title')}</h1>
                <p className="text-sm text-[var(--color-text-muted)] mt-1">{t('stock_control.subtitle')}</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div className="rounded-[var(--radius-lg)] p-4 bg-[var(--color-bg-card)] border border-[var(--color-border)]">
                    <p className="text-xs text-[var(--color-text-muted)] uppercase font-medium">
                        {t('stock_control.stat_total_products')}
                    </p>
                    <p className="text-xl font-bold text-[var(--color-text-primary)] mt-1">{products.length}</p>
                </div>
                <div className="rounded-[var(--radius-lg)] p-4 bg-[var(--color-bg-card)] border border-[var(--color-border)]">
                    <p className="text-xs text-[var(--color-text-muted)] uppercase font-medium">
                        {t('stock_control.stat_total_units')}
                    </p>
                    <p className="text-xl font-bold text-[var(--color-text-primary)] mt-1">
                        {products.reduce((s, p) => s + p.stock_quantity, 0).toLocaleString()}
                    </p>
                </div>
                <div className="rounded-[var(--radius-lg)] p-4 bg-[var(--color-bg-card)] border border-[var(--color-border)]">
                    <p className="text-xs text-[var(--color-text-muted)] uppercase font-medium">
                        {t('stock_control.stat_stock_value')}
                    </p>
                    <p className="text-xl font-bold text-[var(--color-text-primary)] mt-1">
                        {formatCurrency(products.reduce((s, p) => s + p.cost_price * p.stock_quantity, 0))}
                    </p>
                </div>
                <div className="rounded-[var(--radius-lg)] p-4 bg-[var(--color-warning-muted)] border border-[var(--color-warning)]/30">
                    <p className="text-xs text-[var(--color-warning)] uppercase font-medium">
                        {t('stock_control.stat_low_stock')}
                    </p>
                    <p className="text-xl font-bold text-[var(--color-warning)] mt-1">{lowStockProducts.length}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
                {/* Stock List */}
                <div className="lg:col-span-3 space-y-3">
                    <div className="flex items-center gap-3">
                        <SearchInput
                            value={search}
                            onChange={setSearch}
                            placeholder={t('stock_control.search_placeholder')}
                            className="flex-1"
                        />
                        <button
                            onClick={() => setShowLowOnly(!showLowOnly)}
                            className={cn(
                                'flex items-center gap-2 px-3 py-2.5 rounded-[var(--radius-md)] text-sm font-medium border transition-all',
                                showLowOnly
                                    ? 'bg-[var(--color-warning-muted)] border-[var(--color-warning)] text-[var(--color-warning)]'
                                    : 'bg-[var(--color-bg-input)] border-[var(--color-border)] text-[var(--color-text-secondary)]',
                            )}
                        >
                            <AlertTriangle size={14} />
                            {t('stock_control.low_stock_filter')}
                        </button>
                    </div>

                    <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] overflow-hidden">
                        {filtered.length === 0 ? (
                            <div className="text-center py-12">
                                <Package size={36} className="mx-auto text-[var(--color-text-muted)] mb-2" />
                                <p className="text-sm text-[var(--color-text-muted)]">
                                    {t('stock_control.no_products')}
                                </p>
                            </div>
                        ) : (
                            <div className="divide-y divide-[var(--color-border)]">
                                {paginatedProducts.map((product) => {
                                    const isLow = product.stock_quantity <= product.reorder_level;
                                    const pct = Math.min(
                                        100,
                                        (product.stock_quantity / Math.max(1, product.reorder_level * 3)) * 100,
                                    );
                                    return (
                                        <div
                                            key={product.id}
                                            className="flex items-center gap-4 px-4 py-3 hover:bg-[var(--color-bg-hover)] transition-colors"
                                        >
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-[var(--color-text-primary)] truncate">
                                                    {product.name}
                                                </p>
                                                <p className="text-xs text-[var(--color-text-muted)]">
                                                    {product.category_name || t('stock_control.no_category')}
                                                </p>
                                            </div>

                                            <div className="w-24">
                                                <div className="h-1.5 rounded-full bg-[var(--color-bg-primary)]">
                                                    <div
                                                        className="h-full rounded-full transition-all"
                                                        style={{
                                                            width: `${pct}%`,
                                                            background: isLow
                                                                ? 'var(--color-danger)'
                                                                : 'var(--color-success)',
                                                        }}
                                                    />
                                                </div>
                                            </div>

                                            <div className="text-right min-w-[60px]">
                                                <span
                                                    className={cn(
                                                        'text-sm font-semibold',
                                                        isLow
                                                            ? 'text-[var(--color-warning)]'
                                                            : 'text-[var(--color-text-primary)]',
                                                    )}
                                                >
                                                    {product.stock_quantity}
                                                </span>
                                                {isLow && (
                                                    <AlertTriangle
                                                        size={12}
                                                        className="inline ml-1 text-[var(--color-warning)]"
                                                    />
                                                )}
                                            </div>

                                            <div className="flex items-center gap-1">
                                                <button
                                                    onClick={() => setAdjustModal({ product, type: 'add' })}
                                                    className="p-1.5 rounded-[var(--radius-sm)] text-[var(--color-success)] hover:bg-[var(--color-success-muted)] transition-colors"
                                                    title={t('stock_control.add_stock')}
                                                >
                                                    <ArrowUpCircle size={16} />
                                                </button>
                                                <button
                                                    onClick={() => setAdjustModal({ product, type: 'remove' })}
                                                    className="p-1.5 rounded-[var(--radius-sm)] text-[var(--color-danger)] hover:bg-[var(--color-danger-muted)] transition-colors"
                                                    title={t('stock_control.remove_stock')}
                                                >
                                                    <ArrowDownCircle size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

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

                {/* Movement History */}
                <div className="lg:col-span-2">
                    <div className="rounded-[var(--radius-lg)] bg-[var(--color-bg-card)] border border-[var(--color-border)]">
                        <div className="px-4 py-3 border-b border-[var(--color-border)]">
                            <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">
                                {t('stock_control.recent_movements')}
                            </h2>
                        </div>
                        {movements.length === 0 ? (
                            <div className="text-center py-12">
                                <RotateCcw size={28} className="mx-auto text-[var(--color-text-muted)] mb-2" />
                                <p className="text-sm text-[var(--color-text-muted)]">
                                    {t('stock_control.no_movements')}
                                </p>
                            </div>
                        ) : (
                            <div className="divide-y divide-[var(--color-border)] max-h-[500px] overflow-y-auto">
                                {paginatedMovements.map((mvt) => {
                                    const Icon = getMovementIcon(mvt.type);
                                    return (
                                        <div key={mvt.id} className="flex items-center gap-3 px-4 py-3">
                                            <div
                                                className="p-1.5 rounded-full"
                                                style={{ background: `${getMovementColor(mvt.type)}20` }}
                                            >
                                                <Icon size={14} style={{ color: getMovementColor(mvt.type) }} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs font-medium text-[var(--color-text-primary)] truncate">
                                                    {mvt.reference_id}
                                                </p>
                                                <p className="text-[10px] text-[var(--color-text-muted)]">{mvt.type}</p>
                                            </div>
                                            <span
                                                className="text-xs font-semibold"
                                                style={{ color: getMovementColor(mvt.type) }}
                                            >
                                                {mvt.quantity > 0 ? '+' : ''}
                                                {mvt.quantity}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

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
                    <DialogContent className="max-w-md">
                        <DialogHeader>
                            <DialogTitle>
                                {adjustModal.type === 'add'
                                    ? t('stock_control.modal_add')
                                    : t('stock_control.modal_remove')}{' '}
                                — {adjustModal.product.name}
                            </DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                            <div className="flex items-center gap-3 p-3 rounded-[var(--radius-md)] bg-[var(--color-bg-hover)]">
                                <Package size={18} className="text-[var(--color-accent)]" />
                                <div>
                                    <p className="text-sm font-medium text-[var(--color-text-primary)]">
                                        {adjustModal.product.name}
                                    </p>
                                    <p className="text-xs text-[var(--color-text-muted)]">
                                        {t('stock_control.current_stock', {
                                            count: adjustModal.product.stock_quantity,
                                        })}
                                    </p>
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-medium text-[var(--color-text-secondary)] mb-1.5 block">
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
                                <label className="text-xs font-medium text-[var(--color-text-secondary)] mb-1.5 block">
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
                            <div className="flex justify-end gap-3 pt-3 border-t border-[var(--color-border)]">
                                <Button
                                    variant="secondary"
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
                                    variant={adjustModal.type === 'remove' ? 'danger' : 'primary'}
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
