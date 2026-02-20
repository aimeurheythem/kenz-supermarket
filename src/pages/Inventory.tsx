import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { toast } from 'sonner';
import { exportToCsv, parseCsvFile } from '@/lib/csv';
import { Plus, Package, AlertTriangle, Box, BarChart3, Upload, Download, Barcode } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn, formatCurrency } from '@/lib/utils';
import { useProductStore } from '@/stores/useProductStore';
import { useCategoryStore } from '@/stores/useCategoryStore';
import ProductFormModal from '@/components/inventory/ProductFormModal';
import { DeleteConfirmModal } from '@/components/common/DeleteConfirmModal';
import InventoryFilters from '@/components/inventory/InventoryFilters';
import InventoryGrid from '@/components/inventory/InventoryGrid';
import InventoryList from '@/components/inventory/InventoryList';
import Pagination from '@/components/common/Pagination';
import { usePagination } from '@/hooks/usePagination';
import BarcodeScanner from '@/components/common/BarcodeScanner';
import { useBarcodeScanner } from '@/hooks/useBarcodeScanner';
import type { Product } from '@/lib/types';
import { getProductStyle } from '@/lib/product-styles';
import { useTranslation } from 'react-i18next';
import { usePageTitle } from '@/hooks/usePageTitle';

export default function Inventory() {
    const { t, i18n } = useTranslation();
    usePageTitle(t('sidebar.inventory'));

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

    const { items: categories, loadCategories } = useCategoryStore();

    const [search, setSearch] = useState('');
    const [categoryFilter, setCategoryFilter] = useState<number | null>(null);
    const [lowStockOnly, setLowStockOnly] = useState(false);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [productToDelete, setProductToDelete] = useState<Product | null>(null);
    const [isImporting, setIsImporting] = useState(false);
    const [showScanner, setShowScanner] = useState(false);
    const csvInputRef = useRef<HTMLInputElement>(null);

    const ITEMS_PER_PAGE = 16;
    const { currentPage, totalPages, startIndex, endIndex, setCurrentPage, paginate, resetPage } = usePagination({
        totalItems: products.length,
        pageSize: ITEMS_PER_PAGE,
    });

    // O(1) barcode→product lookup for instant scan results
    const barcodeMap = useMemo(() => {
        const map = new Map<string, Product>();
        for (const p of products) {
            if (p.barcode) map.set(p.barcode, p);
        }
        return map;
    }, [products]);

    const handleBarcodeScan = useCallback(
        (barcode: string) => {
            const product = barcodeMap.get(barcode);
            if (product) {
                setSearch(barcode);
                setShowScanner(false);
                toast.success(product.name, {
                    description: t('inventory.scan_found', 'Product found — showing in results'),
                    duration: 2000,
                });
            } else {
                toast.warning(t('inventory.scan_not_found', 'No product with barcode: ') + barcode);
            }
        },
        [barcodeMap, t],
    );

    // Hardware barcode scanner support (works even when search is focused)
    useBarcodeScanner(handleBarcodeScan, !showScanner);

    useEffect(() => {
        loadCategories();
        loadProducts();
        loadLowStock();
    }, [loadCategories, loadProducts, loadLowStock]);

    useEffect(() => {
        const timer = setTimeout(() => {
            setFilters({
                search: search || undefined,
                category_id: categoryFilter ?? undefined,
                low_stock: lowStockOnly || undefined,
            });
            loadProducts();
            resetPage();
        }, 300);

        return () => clearTimeout(timer);
    }, [search, categoryFilter, lowStockOnly, loadProducts, setFilters, resetPage]);

    const handleEdit = (product: Product) => {
        setEditingProduct(product);
        setIsFormOpen(true);
    };

    const handleDelete = (id: number) => {
        const product = products.find((p) => p.id === id);
        if (product) {
            setProductToDelete(product);
            setIsDeleteModalOpen(true);
        }
    };

    const confirmDelete = () => {
        if (productToDelete) {
            deleteProduct(productToDelete.id);
            setIsDeleteModalOpen(false);
            setProductToDelete(null);
        }
    };

    const handleCloseForm = () => {
        setIsFormOpen(false);
        setEditingProduct(null);
    };

    const handleExportCsv = () => {
        const headers = [
            { key: 'id', label: 'ID' },
            { key: 'barcode', label: 'Barcode' },
            { key: 'name', label: 'Name' },
            { key: 'category_name', label: 'Category' },
            { key: 'cost_price', label: 'Cost Price' },
            { key: 'selling_price', label: 'Selling Price' },
            { key: 'stock_quantity', label: 'Stock Quantity' },
            { key: 'reorder_level', label: 'Reorder Level' },
            { key: 'unit', label: 'Unit' },
            { key: 'created_at', label: 'Created At' },
        ];
        exportToCsv(
            headers,
            products as unknown as Record<string, unknown>[],
            `inventory_${new Date().toISOString().split('T')[0]}.csv`,
        );
        toast.success(t('inventory.export_success', { count: products.length }));
    };

    const handleExportLowStock = () => {
        const headers = [
            { key: 'id', label: 'ID' },
            { key: 'barcode', label: 'Barcode' },
            { key: 'name', label: 'Name' },
            { key: 'category_name', label: 'Category' },
            { key: 'stock_quantity', label: 'Stock Quantity' },
            { key: 'reorder_level', label: 'Reorder Level' },
        ];
        exportToCsv(
            headers,
            lowStockProducts as unknown as Record<string, unknown>[],
            `low_stock_${new Date().toISOString().split('T')[0]}.csv`,
        );
        toast.success(t('inventory.export_low_stock_success', { count: lowStockProducts.length }));
    };

    const handleImportCsv = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setIsImporting(true);
        try {
            const rows = await parseCsvFile(file);
            if (rows.length === 0) {
                toast.error(t('inventory.csv_empty'));
                return;
            }
            let imported = 0;
            let skipped = 0;
            for (const row of rows) {
                const name = row['Name'] || row['name'];
                const costPrice = parseFloat(row['Cost Price'] || row['cost_price'] || '0');
                const sellingPrice = parseFloat(row['Selling Price'] || row['selling_price'] || '0');
                if (!name || isNaN(costPrice) || isNaN(sellingPrice)) {
                    skipped++;
                    continue;
                }
                try {
                    await addProduct({
                        name,
                        barcode: row['Barcode'] || row['barcode'] || undefined,
                        cost_price: costPrice,
                        selling_price: sellingPrice,
                        stock_quantity: parseInt(row['Stock Quantity'] || row['stock_quantity'] || '0', 10) || 0,
                        reorder_level: parseInt(row['Reorder Level'] || row['reorder_level'] || '10', 10) || 10,
                        unit: row['Unit'] || row['unit'] || 'piece',
                    });
                    imported++;
                } catch {
                    skipped++;
                }
            }
            await loadProducts();
            await loadLowStock();
            toast.success(t('inventory.import_success', { imported, skipped }));
        } catch {
            toast.error(t('inventory.csv_parse_error'));
        } finally {
            setIsImporting(false);
            if (csvInputRef.current) csvInputRef.current.value = '';
        }
    };

    // Calculations for stats
    const totalValue = products.reduce((sum, p) => sum + p.selling_price * p.stock_quantity, 0);

    const paginatedProducts = paginate(products);

    return (
        <div className="relative flex flex-col h-full gap-8 p-6 lg:p-8 animate-fadeIn mt-4 min-h-[85vh]">
            {/* Grid Background */}
            <div
                className="absolute inset-0 rounded-[3rem] pointer-events-none opacity-[0.15]"
                style={{
                    backgroundImage: `linear-gradient(to right, rgba(0, 0, 0, 0.3) 1px, transparent 1px), linear-gradient(to bottom, rgba(0, 0, 0, 0.3) 1px, transparent 1px)`,
                    backgroundSize: '32px 32px',
                    maskImage: 'radial-gradient(circle at top center, black, transparent 90%)',
                    WebkitMaskImage: 'radial-gradient(circle at top center, black, transparent 90%)',
                }}
            />

            {/* Header Section */}
            <div className="relative z-10 flex flex-col space-y-8">
                <div className="flex items-center justify-between">
                    <div className="flex flex-col gap-1">
                        <span className="text-[12px] text-zinc-400 tracking-[0.3em] font-bold uppercase">
                            {t('inventory.management_system')}
                        </span>
                        <h2 className="text-4xl font-black text-black tracking-tighter uppercase">
                            {t('inventory.title')}
                        </h2>
                    </div>
                    <div className="flex gap-3">
                        <input
                            ref={csvInputRef}
                            type="file"
                            accept=".csv"
                            className="hidden"
                            onChange={handleImportCsv}
                        />
                        <button
                            onClick={() => setShowScanner(true)}
                            className="flex items-center gap-2 px-5 py-3 bg-black text-white hover:bg-zinc-800 rounded-[3rem] font-black uppercase tracking-widest text-xs transition-all"
                        >
                            <Barcode size={18} strokeWidth={3} />
                            <span>{t('inventory.scan', 'Scan')}</span>
                        </button>
                        <button
                            onClick={() => csvInputRef.current?.click()}
                            disabled={isImporting}
                            className="flex items-center gap-2 px-5 py-3 bg-black text-white hover:bg-zinc-800 rounded-[3rem] font-black uppercase tracking-widest text-xs transition-all disabled:opacity-50"
                        >
                            <Upload size={18} strokeWidth={3} />
                            <span>{isImporting ? 'Importing...' : t('inventory.import')}</span>
                        </button>
                        <button
                            onClick={handleExportCsv}
                            className="flex items-center gap-2 px-5 py-3 bg-black text-white hover:bg-zinc-800 rounded-[3rem] font-black uppercase tracking-widest text-xs transition-all"
                        >
                            <Download size={18} strokeWidth={3} />
                            <span>{t('inventory.export')}</span>
                        </button>
                        <button
                            onClick={() => setIsFormOpen(true)}
                            className="flex items-center gap-2 px-6 py-3 bg-yellow-400 hover:bg-yellow-300 text-black rounded-[3rem] font-black uppercase tracking-widest text-xs transition-all"
                        >
                            <Plus size={18} strokeWidth={3} />
                            <span>{t('inventory.add_product')}</span>
                        </button>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="relative overflow-hidden p-6 bg-gray-100 rounded-[3rem]">
                        <div className="relative z-10 flex items-center justify-between mb-4">
                            <div className="p-3">
                                <Box size={20} className="text-black" />
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-widest text-black">
                                {t('inventory.stats.total_products')}
                            </span>
                        </div>
                        <div className="relative z-10 flex items-baseline gap-2">
                            <span className="text-3xl font-black text-black tracking-tighter">{products.length}</span>
                            <span className="text-xs font-bold text-black">{t('inventory.stats.items')}</span>
                        </div>
                        <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-black/50 blur-[60px] pointer-events-none" />
                    </div>
                    <div className="relative overflow-hidden p-6 bg-gray-100 rounded-[3rem]">
                        <div className="relative z-10 flex items-center justify-between mb-4">
                            <div className="p-3">
                                <AlertTriangle size={20} className="text-orange-500" />
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-widest text-black">
                                {t('inventory.stats.low_stock')}
                            </span>
                        </div>
                        <div className="relative z-10 flex items-baseline gap-2">
                            <span className="text-3xl font-black text-black tracking-tighter">
                                {lowStockProducts.length}
                            </span>
                            <span className="text-xs font-bold text-black">{t('inventory.stats.alerts')}</span>
                        </div>
                        <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-black/50 blur-[60px] pointer-events-none" />
                    </div>
                    <div className="relative overflow-hidden p-6 bg-gray-100 rounded-[3rem]">
                        <div className="relative z-10 flex items-center justify-between mb-4">
                            <div className="p-3">
                                <BarChart3 size={20} className="text-emerald-500" />
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-widest text-black">
                                {t('inventory.stats.total_value')}
                            </span>
                        </div>
                        <div className="relative z-10 flex items-baseline gap-2">
                            <span className="text-3xl font-black text-black tracking-tighter">
                                {formatCurrency(totalValue)}
                            </span>
                        </div>
                        <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-black/50 blur-[60px] pointer-events-none" />
                    </div>
                </div>

                {/* Filters */}
                <InventoryFilters
                    search={search}
                    setSearch={setSearch}
                    lowStockOnly={lowStockOnly}
                    setLowStockOnly={setLowStockOnly}
                    lowStockCount={lowStockProducts.length}
                    categoryFilter={categoryFilter}
                    setCategoryFilter={setCategoryFilter}
                    viewMode={viewMode}
                    setViewMode={setViewMode}
                    categories={categories}
                    handleExportLowStock={handleExportLowStock}
                    i18n={i18n}
                />
            </div>

            {/* Products Grid/List */}
            <div className="relative z-10 flex-1 overflow-y-auto min-h-0 pr-2 custom-scrollbar">
                {products.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 text-zinc-300">
                        <Package size={64} strokeWidth={1} className="mb-4" />
                        <p className="text-xl font-black uppercase tracking-widest">
                            {t('inventory.empty.no_products')}
                        </p>
                    </div>
                ) : (
                    <>
                        <motion.div
                            key={viewMode}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.2 }}
                            className={cn(
                                'grid gap-4 pb-8',
                                viewMode === 'grid'
                                    ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
                                    : 'grid-cols-1',
                            )}
                        >
                            {viewMode === 'list' ? (
                                <InventoryList
                                    products={paginatedProducts}
                                    handleEdit={handleEdit}
                                    handleDelete={handleDelete}
                                />
                            ) : (
                                <InventoryGrid
                                    products={paginatedProducts}
                                    getProductStyle={getProductStyle}
                                    handleEdit={handleEdit}
                                    handleDelete={handleDelete}
                                    categories={categories}
                                />
                            )}
                        </motion.div>

                        <Pagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            totalItems={products.length}
                            startIndex={startIndex}
                            endIndex={endIndex}
                            onPageChange={setCurrentPage}
                            itemLabel={t('inventory.title')}
                        />
                    </>
                )}
            </div>

            {/* Product Form Modal */}
            <ProductFormModal
                isOpen={isFormOpen}
                onClose={handleCloseForm}
                onSubmit={async (data) => {
                    if (editingProduct) {
                        await updateProduct(editingProduct.id, data);
                    } else {
                        await addProduct(data);
                        setSearch('');
                        setCategoryFilter(null);
                        setLowStockOnly(false);
                        resetPage();
                        loadProducts();
                    }
                    handleCloseForm();
                }}
                product={editingProduct}
                categories={categories}
            />

            {/* Delete Confirmation Modal */}
            <DeleteConfirmModal
                isOpen={isDeleteModalOpen}
                onClose={() => {
                    setIsDeleteModalOpen(false);
                    setProductToDelete(null);
                }}
                onConfirm={confirmDelete}
                title={t('inventory.delete_modal.title')}
                description={t('inventory.delete_modal.description')}
                itemName={productToDelete?.name}
            />

            {/* Camera Barcode Scanner */}
            {showScanner && (
                <BarcodeScanner
                    onScan={handleBarcodeScan}
                    onClose={() => setShowScanner(false)}
                    title={t('inventory.scan_product', 'Scan Product')}
                />
            )}
        </div>
    );
}
