import { useState, useEffect } from 'react';
import {
    Plus,
    Edit2,
    Trash2,
    Package,
    AlertTriangle,
    Filter,
    MoreHorizontal,
    Barcode,
} from 'lucide-react';
import { cn, formatCurrency } from '@/lib/utils';
import { useProductStore } from '@/stores/useProductStore';
import { useCategoryStore } from '@/stores/useCategoryStore';
import SearchInput from '@/components/common/SearchInput';
import Button from '@/components/common/Button';
import ProductFormModal from '@/components/inventory/ProductFormModal';
import type { Product } from '@/lib/types';

export default function Inventory() {
    const {
        products,
        lowStockProducts,
        loadProducts,
        loadLowStock,
        addProduct,
        updateProduct,
        deleteProduct,
        setFilters,
    } = useProductStore();

    const { categories, loadCategories } = useCategoryStore();

    const [search, setSearch] = useState('');
    const [categoryFilter, setCategoryFilter] = useState<number | undefined>();
    const [lowStockOnly, setLowStockOnly] = useState(false);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [activeMenu, setActiveMenu] = useState<number | null>(null);

    useEffect(() => {
        loadCategories();
        loadProducts();
        loadLowStock();
    }, []);

    useEffect(() => {
        setFilters({
            search: search || undefined,
            category_id: categoryFilter,
            low_stock: lowStockOnly || undefined,
        });
    }, [search, categoryFilter, lowStockOnly]);

    const handleEdit = (product: Product) => {
        setEditingProduct(product);
        setIsFormOpen(true);
        setActiveMenu(null);
    };

    const handleDelete = (id: number) => {
        if (confirm('Are you sure you want to delete this product?')) {
            deleteProduct(id);
        }
        setActiveMenu(null);
    };

    const handleCloseForm = () => {
        setIsFormOpen(false);
        setEditingProduct(null);
    };

    return (
        <div className="space-y-10 animate-fadeIn pb-12">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-extrabold text-[var(--color-text-primary)] tracking-tight">Inventory</h1>
                    <p className="text-[var(--color-text-secondary)] mt-2 text-base">
                        Manage your products, tracking stock levels and category assignments.
                    </p>
                </div>
                <Button
                    onClick={() => setIsFormOpen(true)}
                    icon={<Plus size={16} />}
                >
                    Add Product
                </Button>
            </div>

            {/* Filters Bar */}
            <div className="flex items-center gap-6 flex-wrap bg-neutral-800 px-8 py-6 rounded-3xl">
                <SearchInput
                    value={search}
                    onChange={setSearch}
                    placeholder="Search products or barcodes..."
                    className="w-96"
                />

                <div className="h-10 w-px bg-neutral-700 hidden md:block mx-2" />

                <select
                    value={categoryFilter || ''}
                    onChange={(e) => setCategoryFilter(e.target.value ? Number(e.target.value) : undefined)}
                    className={cn(
                        'px-6 py-3.5 rounded-3xl text-sm',
                        'bg-neutral-800 border border-neutral-700',
                        'text-[var(--color-text-primary)] font-semibold',
                        'focus:outline-none focus:border-[var(--color-accent)]',
                        'transition-all duration-200 cursor-pointer min-w-[200px]'
                    )}
                >
                    <option value="">All Categories</option>
                    {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                </select>

                <button
                    onClick={() => setLowStockOnly(!lowStockOnly)}
                    className={cn(
                        'flex items-center gap-3 px-6 py-3.5 rounded-3xl text-sm font-bold',
                        'border transition-all duration-200',
                        lowStockOnly
                            ? 'bg-[var(--color-warning-muted)] border-[var(--color-warning)] text-[var(--color-warning)] shadow-md'
                            : 'bg-[var(--color-bg-input)] border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-border-hover)] hover:text-[var(--color-text-primary)]'
                    )}
                >
                    <AlertTriangle size={16} />
                    <span>Low Stock Only</span>
                </button>
            </div>

            {/* Product Table */}
            <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-[var(--color-bg-secondary)] border-b border-[var(--color-border)]">
                                <th className="text-left px-6 py-4 text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-[0.1em]">
                                    Product
                                </th>
                                <th className="text-left px-6 py-4 text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-[0.1em]">
                                    Category
                                </th>
                                <th className="text-left px-6 py-4 text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-[0.1em]">
                                    Barcode
                                </th>
                                <th className="text-right px-6 py-4 text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-[0.1em]">
                                    Cost
                                </th>
                                <th className="text-right px-6 py-4 text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-[0.1em]">
                                    Price
                                </th>
                                <th className="text-right px-6 py-4 text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-[0.1em]">
                                    Stock
                                </th>
                                <th className="text-right px-6 py-4 text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-[0.1em]">
                                    Margin
                                </th>
                                <th className="text-center px-6 py-4 text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-[0.1em] w-12">
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {products.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="text-center py-12">
                                        <Package size={40} className="mx-auto text-[var(--color-text-muted)] mb-3" />
                                        <p className="text-sm text-[var(--color-text-muted)]">
                                            {search || categoryFilter ? 'No products match your filters' : 'No products yet. Add your first product!'}
                                        </p>
                                    </td>
                                </tr>
                            ) : (
                                products.map((product, idx) => {
                                    const margin = product.selling_price > 0
                                        ? ((product.selling_price - product.cost_price) / product.selling_price) * 100
                                        : 0;
                                    const isLow = product.stock_quantity <= product.reorder_level;

                                    return (
                                        <tr
                                            key={product.id}
                                            className={cn(
                                                'border-b border-[var(--color-border)] hover:bg-[var(--color-bg-hover)]',
                                                'transition-colors duration-150 group',
                                                idx % 2 === 0 ? 'bg-[var(--color-bg-card)]' : 'bg-[var(--color-bg-secondary)]/30'
                                            )}
                                        >
                                            {/* Product Name */}
                                            <td className="px-6 py-5">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-xl bg-[var(--color-accent-muted)] flex items-center justify-center shrink-0">
                                                        <Package size={18} className="text-[var(--color-accent)]" />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-bold text-[var(--color-text-primary)]">{product.name}</p>
                                                        <p className="text-xs text-[var(--color-text-muted)] mt-0.5">{product.unit}</p>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Category */}
                                            <td className="px-6 py-5">
                                                {product.category_name ? (
                                                    <span className="text-[11px] font-bold px-3 py-1 rounded-lg bg-[var(--color-bg-hover)] text-[var(--color-text-secondary)] border border-[var(--color-border)]">
                                                        {product.category_name}
                                                    </span>
                                                ) : (
                                                    <span className="text-xs text-[var(--color-text-muted)]">—</span>
                                                )}
                                            </td>

                                            {/* Barcode */}
                                            <td className="px-6 py-5">
                                                {product.barcode ? (
                                                    <div className="flex items-center gap-2">
                                                        <Barcode size={14} className="text-[var(--color-text-muted)]" />
                                                        <span className="text-xs font-mono text-[var(--color-text-secondary)] tracking-tight">
                                                            {product.barcode}
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <span className="text-xs text-[var(--color-text-muted)]">—</span>
                                                )}
                                            </td>

                                            {/* Cost */}
                                            <td className="px-6 py-5 text-right">
                                                <span className="text-sm text-[var(--color-text-secondary)] tabular-nums">
                                                    {formatCurrency(product.cost_price)}
                                                </span>
                                            </td>

                                            {/* Price */}
                                            <td className="px-6 py-5 text-right">
                                                <span className="text-sm font-bold text-[var(--color-text-primary)] tabular-nums">
                                                    {formatCurrency(product.selling_price)}
                                                </span>
                                            </td>

                                            {/* Stock */}
                                            <td className="px-6 py-5 text-right">
                                                <div className="flex items-center justify-end gap-2.5">
                                                    {isLow && <AlertTriangle size={15} className="text-[var(--color-warning)]" />}
                                                    <span
                                                        className={cn(
                                                            'text-sm font-bold tabular-nums',
                                                            isLow ? 'text-[var(--color-warning)]' : 'text-[var(--color-text-primary)]'
                                                        )}
                                                    >
                                                        {product.stock_quantity}
                                                    </span>
                                                </div>
                                            </td>

                                            {/* Margin */}
                                            <td className="px-6 py-5 text-right">
                                                <span
                                                    className="text-xs font-bold tabular-nums"
                                                    style={{
                                                        color: margin > 20 ? 'var(--color-success)' : margin > 0 ? 'var(--color-warning)' : 'var(--color-danger)',
                                                    }}
                                                >
                                                    {margin.toFixed(1)}%
                                                </span>
                                            </td>

                                            {/* Actions */}
                                            <td className="px-6 py-5 text-center relative">
                                                <button
                                                    onClick={() => setActiveMenu(activeMenu === product.id ? null : product.id)}
                                                    className="p-1.5 rounded-[var(--radius-sm)] text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-active)] transition-colors"
                                                >
                                                    <MoreHorizontal size={16} />
                                                </button>

                                                {activeMenu === product.id && (
                                                    <div className="absolute right-4 top-full mt-1 z-20 w-36 rounded-[var(--radius-md)] bg-[var(--color-bg-card)] border border-[var(--color-border)] shadow-xl py-1 animate-scaleIn">
                                                        <button
                                                            onClick={() => handleEdit(product)}
                                                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-text-primary)] transition-colors"
                                                        >
                                                            <Edit2 size={13} /> Edit
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(product.id)}
                                                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[var(--color-danger)] hover:bg-[var(--color-danger-muted)] transition-colors"
                                                        >
                                                            <Trash2 size={13} /> Delete
                                                        </button>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between px-4 py-3 bg-[var(--color-bg-secondary)] border-t border-[var(--color-border)]">
                    <span className="text-xs text-[var(--color-text-muted)]">
                        Showing {products.length} product{products.length !== 1 ? 's' : ''}
                    </span>
                    <div className="flex items-center gap-4">
                        <span className="text-xs text-[var(--color-text-muted)]">
                            Total Value: <span className="font-semibold text-[var(--color-text-secondary)]">
                                {formatCurrency(products.reduce((sum, p) => sum + p.selling_price * p.stock_quantity, 0))}
                            </span>
                        </span>
                    </div>
                </div>
            </div>

            {/* Close dropdown when clicking outside */}
            {activeMenu !== null && (
                <div className="fixed inset-0 z-10" onClick={() => setActiveMenu(null)} />
            )}

            {/* Product Form Modal */}
            <ProductFormModal
                isOpen={isFormOpen}
                onClose={handleCloseForm}
                onSubmit={(data) => {
                    if (editingProduct) {
                        updateProduct(editingProduct.id, data);
                    } else {
                        addProduct(data);
                    }
                }}
                product={editingProduct}
                categories={categories}
            />
        </div>
    );
}
