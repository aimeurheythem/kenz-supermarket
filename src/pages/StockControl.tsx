import { useState, useEffect } from 'react';
import {
    ArrowUpCircle,
    ArrowDownCircle,
    RotateCcw,
    Package,
    AlertTriangle,
    TrendingUp,
    TrendingDown,
    Filter,
} from 'lucide-react';
import { cn, formatCurrency } from '@/lib/utils';
import { useProductStore } from '@/stores/useProductStore';
import SearchInput from '@/components/common/SearchInput';
import Button from '@/components/common/Button';
import Modal from '@/components/common/Modal';
import type { Product } from '@/lib/types';
import { StockRepo } from '../../database/repositories/stock.repo';
import type { StockMovement } from '@/lib/types';

export default function StockControl() {
    const { products, lowStockProducts, loadProducts, loadLowStock } = useProductStore();
    const [search, setSearch] = useState('');
    const [showLowOnly, setShowLowOnly] = useState(false);
    const [movements, setMovements] = useState<StockMovement[]>([]);
    const [adjustModal, setAdjustModal] = useState<{ product: Product; type: 'add' | 'remove' | 'adjust' } | null>(null);
    const [adjustQty, setAdjustQty] = useState(0);
    const [adjustReason, setAdjustReason] = useState('');

    useEffect(() => {
        loadProducts();
        loadLowStock();
        loadMovements();
    }, []);

    const loadMovements = async () => {
        const mvts = await StockRepo.getMovements({ limit: 20 });
        setMovements(mvts);
    };

    const filtered = products.filter((p) => {
        if (showLowOnly && p.stock_quantity > p.reorder_level) return false;
        if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false;
        return true;
    });

    const handleAdjust = async () => {
        if (!adjustModal || adjustQty <= 0) return;
        const { product, type } = adjustModal;
        if (type === 'add') {
            await StockRepo.addStock(product.id, adjustQty, adjustReason || 'Stock added');
        } else if (type === 'remove') {
            await StockRepo.removeStock(product.id, adjustQty, adjustReason || 'Stock removed');
        } else {
            await StockRepo.adjustStock(product.id, adjustQty, adjustReason || 'Stock adjusted');
        }
        setAdjustModal(null);
        setAdjustQty(0);
        setAdjustReason('');
        await loadProducts();
        await loadLowStock();
        await loadMovements();
    };

    const getMovementColor = (type: string) => {
        switch (type) {
            case 'purchase': case 'addition': return 'var(--color-success)';
            case 'sale': case 'removal': return 'var(--color-danger)';
            case 'adjustment': return 'var(--color-warning)';
            default: return 'var(--color-text-muted)';
        }
    };

    const getMovementIcon = (type: string) => {
        switch (type) {
            case 'purchase': case 'addition': return ArrowUpCircle;
            case 'sale': case 'removal': return ArrowDownCircle;
            default: return RotateCcw;
        }
    };

    const inputClass = cn(
        'w-full px-3 py-2.5 rounded-[var(--radius-md)]',
        'bg-[var(--color-bg-input)] border border-[var(--color-border)]',
        'text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)]',
        'focus:outline-none focus:border-[var(--color-accent)] focus:ring-1 focus:ring-[var(--color-accent)]',
        'transition-all duration-200'
    );

    return (
        <div className="space-y-5 animate-fadeIn">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Stock Control</h1>
                <p className="text-sm text-[var(--color-text-muted)] mt-1">
                    Monitor stock levels and manage inventory movements
                </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div className="rounded-[var(--radius-lg)] p-4 bg-[var(--color-bg-card)] border border-[var(--color-border)]">
                    <p className="text-xs text-[var(--color-text-muted)] uppercase font-medium">Total Products</p>
                    <p className="text-xl font-bold text-[var(--color-text-primary)] mt-1">{products.length}</p>
                </div>
                <div className="rounded-[var(--radius-lg)] p-4 bg-[var(--color-bg-card)] border border-[var(--color-border)]">
                    <p className="text-xs text-[var(--color-text-muted)] uppercase font-medium">Total Units</p>
                    <p className="text-xl font-bold text-[var(--color-text-primary)] mt-1">
                        {products.reduce((s, p) => s + p.stock_quantity, 0).toLocaleString()}
                    </p>
                </div>
                <div className="rounded-[var(--radius-lg)] p-4 bg-[var(--color-bg-card)] border border-[var(--color-border)]">
                    <p className="text-xs text-[var(--color-text-muted)] uppercase font-medium">Stock Value</p>
                    <p className="text-xl font-bold text-[var(--color-text-primary)] mt-1">
                        {formatCurrency(products.reduce((s, p) => s + p.cost_price * p.stock_quantity, 0))}
                    </p>
                </div>
                <div className="rounded-[var(--radius-lg)] p-4 bg-[var(--color-warning-muted)] border border-[var(--color-warning)]/30">
                    <p className="text-xs text-[var(--color-warning)] uppercase font-medium">Low Stock Alerts</p>
                    <p className="text-xl font-bold text-[var(--color-warning)] mt-1">{lowStockProducts.length}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
                {/* Stock List */}
                <div className="lg:col-span-3 space-y-3">
                    <div className="flex items-center gap-3">
                        <SearchInput value={search} onChange={setSearch} placeholder="Search products..." className="flex-1" />
                        <button
                            onClick={() => setShowLowOnly(!showLowOnly)}
                            className={cn(
                                'flex items-center gap-2 px-3 py-2.5 rounded-[var(--radius-md)] text-sm font-medium border transition-all',
                                showLowOnly
                                    ? 'bg-[var(--color-warning-muted)] border-[var(--color-warning)] text-[var(--color-warning)]'
                                    : 'bg-[var(--color-bg-input)] border-[var(--color-border)] text-[var(--color-text-secondary)]'
                            )}
                        >
                            <AlertTriangle size={14} />
                            Low Stock
                        </button>
                    </div>

                    <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] overflow-hidden">
                        {filtered.length === 0 ? (
                            <div className="text-center py-12">
                                <Package size={36} className="mx-auto text-[var(--color-text-muted)] mb-2" />
                                <p className="text-sm text-[var(--color-text-muted)]">No products match your filters</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-[var(--color-border)]">
                                {filtered.map((product) => {
                                    const isLow = product.stock_quantity <= product.reorder_level;
                                    const pct = Math.min(100, (product.stock_quantity / Math.max(1, product.reorder_level * 3)) * 100);
                                    return (
                                        <div key={product.id} className="flex items-center gap-4 px-4 py-3 hover:bg-[var(--color-bg-hover)] transition-colors">
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-[var(--color-text-primary)] truncate">{product.name}</p>
                                                <p className="text-xs text-[var(--color-text-muted)]">{product.category_name || 'No category'}</p>
                                            </div>

                                            <div className="w-24">
                                                <div className="h-1.5 rounded-full bg-[var(--color-bg-primary)]">
                                                    <div
                                                        className="h-full rounded-full transition-all"
                                                        style={{
                                                            width: `${pct}%`,
                                                            background: isLow ? 'var(--color-danger)' : 'var(--color-success)',
                                                        }}
                                                    />
                                                </div>
                                            </div>

                                            <div className="text-right min-w-[60px]">
                                                <span className={cn('text-sm font-semibold', isLow ? 'text-[var(--color-warning)]' : 'text-[var(--color-text-primary)]')}>
                                                    {product.stock_quantity}
                                                </span>
                                                {isLow && <AlertTriangle size={12} className="inline ml-1 text-[var(--color-warning)]" />}
                                            </div>

                                            <div className="flex items-center gap-1">
                                                <button
                                                    onClick={() => setAdjustModal({ product, type: 'add' })}
                                                    className="p-1.5 rounded-[var(--radius-sm)] text-[var(--color-success)] hover:bg-[var(--color-success-muted)] transition-colors"
                                                    title="Add Stock"
                                                >
                                                    <ArrowUpCircle size={16} />
                                                </button>
                                                <button
                                                    onClick={() => setAdjustModal({ product, type: 'remove' })}
                                                    className="p-1.5 rounded-[var(--radius-sm)] text-[var(--color-danger)] hover:bg-[var(--color-danger-muted)] transition-colors"
                                                    title="Remove Stock"
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
                </div>

                {/* Movement History */}
                <div className="lg:col-span-2">
                    <div className="rounded-[var(--radius-lg)] bg-[var(--color-bg-card)] border border-[var(--color-border)]">
                        <div className="px-4 py-3 border-b border-[var(--color-border)]">
                            <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">Recent Movements</h2>
                        </div>
                        {movements.length === 0 ? (
                            <div className="text-center py-12">
                                <RotateCcw size={28} className="mx-auto text-[var(--color-text-muted)] mb-2" />
                                <p className="text-sm text-[var(--color-text-muted)]">No stock movements yet</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-[var(--color-border)] max-h-[500px] overflow-y-auto">
                                {movements.map((mvt) => {
                                    const Icon = getMovementIcon(mvt.type);
                                    return (
                                        <div key={mvt.id} className="flex items-center gap-3 px-4 py-3">
                                            <div className="p-1.5 rounded-full" style={{ background: `${getMovementColor(mvt.type)}20` }}>
                                                <Icon size={14} style={{ color: getMovementColor(mvt.type) }} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs font-medium text-[var(--color-text-primary)] truncate">{mvt.reference_id}</p>
                                                <p className="text-[10px] text-[var(--color-text-muted)]">{mvt.type}</p>
                                            </div>
                                            <span
                                                className="text-xs font-semibold"
                                                style={{ color: getMovementColor(mvt.type) }}
                                            >
                                                {mvt.quantity > 0 ? '+' : ''}{mvt.quantity}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Adjust Stock Modal */}
            {adjustModal && (
                <Modal
                    isOpen={true}
                    onClose={() => { setAdjustModal(null); setAdjustQty(0); setAdjustReason(''); }}
                    title={`${adjustModal.type === 'add' ? 'Add' : 'Remove'} Stock — ${adjustModal.product.name}`}
                >
                    <div className="space-y-4">
                        <div className="flex items-center gap-3 p-3 rounded-[var(--radius-md)] bg-[var(--color-bg-hover)]">
                            <Package size={18} className="text-[var(--color-accent)]" />
                            <div>
                                <p className="text-sm font-medium text-[var(--color-text-primary)]">{adjustModal.product.name}</p>
                                <p className="text-xs text-[var(--color-text-muted)]">Current stock: {adjustModal.product.stock_quantity} units</p>
                            </div>
                        </div>
                        <div>
                            <label className="text-xs font-medium text-[var(--color-text-secondary)] mb-1.5 block">Quantity</label>
                            <input
                                type="number"
                                min="1"
                                value={adjustQty || ''}
                                onChange={(e) => setAdjustQty(parseInt(e.target.value) || 0)}
                                className={inputClass}
                                autoFocus
                            />
                        </div>
                        <div>
                            <label className="text-xs font-medium text-[var(--color-text-secondary)] mb-1.5 block">Reason</label>
                            <input
                                type="text"
                                value={adjustReason}
                                onChange={(e) => setAdjustReason(e.target.value)}
                                placeholder="e.g. Received shipment, Damaged goods..."
                                className={inputClass}
                            />
                        </div>
                        <div className="flex justify-end gap-3 pt-3 border-t border-[var(--color-border)]">
                            <Button variant="secondary" onClick={() => { setAdjustModal(null); setAdjustQty(0); setAdjustReason(''); }}>Cancel</Button>
                            <Button
                                onClick={handleAdjust}
                                disabled={adjustQty <= 0}
                                variant={adjustModal.type === 'remove' ? 'danger' : 'primary'}
                            >
                                {adjustModal.type === 'add' ? 'Add Stock' : 'Remove Stock'}
                            </Button>
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
}
