import { useState, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { exportToCsv, parseCsvFile } from '@/lib/csv';
import {
    Plus,
    Edit2,
    Trash2,
    Package,
    AlertTriangle,
    Search,
    Box,
    BarChart3,
    LayoutGrid,
    List as ListIcon,
    ShoppingBag,
    Upload,
    Download,
    X,
    ChevronLeft,
    ChevronRight,
    MoreVertical,
    Edit,
    Edit3,
    Barcode
} from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { motion, useMotionValue, animate } from 'framer-motion';
import { cn, formatDate } from '@/lib/utils';
import { useProductStore } from '@/stores/useProductStore';
import { useCategoryStore } from '@/stores/useCategoryStore';
import ProductFormModal from '@/components/inventory/ProductFormModal';
import { DeleteConfirmModal } from '@/components/common/DeleteConfirmModal';
import type { Product, Category } from '@/lib/types';
import { useTranslation } from 'react-i18next';

export default function Inventory() {
    const { t, i18n } = useTranslation();
    const scrollContainerRef = useRef<HTMLDivElement>(null);

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
    const [categoryFilter, setCategoryFilter] = useState<number | null>(null);
    const [lowStockOnly, setLowStockOnly] = useState(false);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [productToDelete, setProductToDelete] = useState<Product | null>(null);
    const [isImporting, setIsImporting] = useState(false);
    const csvInputRef = useRef<HTMLInputElement>(null);

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 16;

    useEffect(() => {
        loadCategories();
        loadProducts();
        loadLowStock();

        // Refresh products when window becomes visible
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                loadProducts();
            }
        };
        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }, [loadProducts, loadLowStock]);

    // Debounce search to prevent too many queries
    useEffect(() => {
        const timer = setTimeout(() => {
            setFilters({
                search: search || undefined,
                category_id: categoryFilter ?? undefined,
                low_stock: lowStockOnly || undefined,
            });
            loadProducts();
            setCurrentPage(1); // Reset to first page when filtering
        }, 300); // 300ms debounce

        return () => clearTimeout(timer);
    }, [search, categoryFilter, lowStockOnly]);

    const x = useMotionValue(0);
    const containerRef = useRef<HTMLDivElement>(null);
    const [constraints, setConstraints] = useState({ left: 0, right: 0 });

    useEffect(() => {
        const updateConstraints = () => {
            if (containerRef.current && scrollContainerRef.current) {
                const containerWidth = containerRef.current.offsetWidth;
                const contentWidth = scrollContainerRef.current.scrollWidth;
                const overflow = contentWidth - containerWidth + 24;
                const isRtl = document.documentElement.dir === 'rtl';
                if (isRtl) {
                    setConstraints({ left: 0, right: overflow });
                } else {
                    setConstraints({ left: -overflow, right: 0 });
                }
            }
        };

        x.set(0);
        updateConstraints();
        window.addEventListener('resize', updateConstraints);
        return () => window.removeEventListener('resize', updateConstraints);
    }, [categories, i18n.language]);

    const scroll = (direction: 'left' | 'right') => {
        const currentX = x.get();
        const scrollAmount = 300;
        const isRtl = document.documentElement.dir === 'rtl';

        let newX: number;
        if (isRtl) {
            newX = direction === 'left'
                ? Math.max(0, currentX - scrollAmount)
                : Math.min(constraints.right, currentX + scrollAmount);
        } else {
            newX = direction === 'left'
                ? Math.min(0, currentX + scrollAmount)
                : Math.max(constraints.left, currentX - scrollAmount);
        }

        animate(x, newX, { type: "spring", stiffness: 300, damping: 30 });
    };

    const handleEdit = (product: Product) => {
        setEditingProduct(product);
        setIsFormOpen(true);
    };

    const handleDelete = (id: number) => {
        const product = products.find(p => p.id === id);
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
        exportToCsv(headers, products as unknown as Record<string, unknown>[], `inventory_${new Date().toISOString().split('T')[0]}.csv`);
        toast.success(t('inventory.export_success', `Exported ${products.length} products`));
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
        exportToCsv(headers, lowStockProducts as unknown as Record<string, unknown>[], `low_stock_${new Date().toISOString().split('T')[0]}.csv`);
        toast.success(t('inventory.export_low_stock_success', `Exported ${lowStockProducts.length} low stock items`));
    };

    const handleImportCsv = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setIsImporting(true);
        try {
            const rows = await parseCsvFile(file);
            if (rows.length === 0) {
                toast.error('CSV file is empty or invalid');
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
            toast.success(`Imported ${imported} products${skipped > 0 ? `, ${skipped} skipped` : ''}`);
        } catch {
            toast.error('Failed to parse CSV file');
        } finally {
            setIsImporting(false);
            if (csvInputRef.current) csvInputRef.current.value = '';
        }
    };

    // Calculations for stats
    const totalValue = products.reduce((sum, p) => sum + p.selling_price * p.stock_quantity, 0);

    const formatPrice = (price: number) => {
        const formatted = new Intl.NumberFormat('fr-FR', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2,
        }).format(price);
        return i18n.language === 'ar' ? `${formatted} دج` : `${formatted} DZ`;
    };

    // Styles for product cards (matching POS)
    const getProductStyle = (id: number) => {
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
        return productStyles[id % productStyles.length];
    };

    return (
        <div className="relative flex flex-col h-full gap-8 p-6 lg:p-8 animate-fadeIn mt-4 min-h-[85vh]">
            {/* Grid Background */}
            <div className="absolute inset-0 rounded-[3rem] pointer-events-none opacity-[0.15]"
                style={{
                    backgroundImage: `linear-gradient(to right, rgba(0, 0, 0, 0.3) 1px, transparent 1px), linear-gradient(to bottom, rgba(0, 0, 0, 0.3) 1px, transparent 1px)`,
                    backgroundSize: '32px 32px',
                    maskImage: 'radial-gradient(circle at top center, black, transparent 90%)',
                    WebkitMaskImage: 'radial-gradient(circle at top center, black, transparent 90%)'
                }}
            />

            {/* Header Section */}
            <div className="relative z-10 flex flex-col space-y-8">
                <div className="flex items-center justify-between">
                    <div className="flex flex-col gap-1">
                        <span className="text-[12px] text-zinc-400 tracking-[0.3em] font-bold uppercase">{t('inventory.management_system')}</span>
                        <h2 className="text-4xl font-black text-black tracking-tighter uppercase">{t('inventory.title')}</h2>
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
                            <span className="text-[10px] font-black uppercase tracking-widest text-black">{t('inventory.stats.total_products')}</span>
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
                            <span className="text-[10px] font-black uppercase tracking-widest text-black">{t('inventory.stats.low_stock')}</span>
                        </div>
                        <div className="relative z-10 flex items-baseline gap-2">
                            <span className="text-3xl font-black text-black tracking-tighter">{lowStockProducts.length}</span>
                            <span className="text-xs font-bold text-black">{t('inventory.stats.alerts')}</span>
                        </div>
                        <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-black/50 blur-[60px] pointer-events-none" />
                    </div>
                    <div className="relative overflow-hidden p-6 bg-gray-100 rounded-[3rem]">
                        <div className="relative z-10 flex items-center justify-between mb-4">
                            <div className="p-3">
                                <BarChart3 size={20} className="text-emerald-500" />
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-widest text-black">{t('inventory.stats.total_value')}</span>
                        </div>
                        <div className="relative z-10 flex items-baseline gap-2">
                            <span className="text-3xl font-black text-black tracking-tighter">{formatPrice(totalValue)}</span>
                        </div>
                        <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-black/50 blur-[60px] pointer-events-none" />
                    </div>
                </div>

                {/* Filters & Search - Redesigned Layout */}
                <div className="flex flex-col gap-6">
                    {/* Top Row: Search + Actions */}
                    <div className="flex flex-col md:flex-row gap-4 items-center">
                        {/* Search Bar */}
                        <div className="relative flex-1 w-full group">
                            <Search size={22} className="absolute left-6 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-black transition-colors" />
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder={t('inventory.filters.search_placeholder')}
                                className="w-full pl-16 pr-16 py-5 rounded-[2.5rem] bg-gray-100 border-2 border-black/20 focus:border-black focus:bg-white focus:outline-none focus:ring-0 focus:ring-offset-0 focus-visible:!ring-0 focus-visible:!outline-none focus-visible:!border-black ring-0 outline-none transition-all font-bold text-lg placeholder:text-zinc-400"
                            />
                            {search && (
                                <button
                                    onClick={() => setSearch('')}
                                    className="absolute right-6 top-1/2 -translate-y-1/2 p-2 rounded-full hover:bg-zinc-200 text-zinc-400 hover:text-black transition-all"
                                >
                                    <X size={16} strokeWidth={3} />
                                </button>
                            )}
                        </div>

                        {/* Low Stock Filter Toggle */}
                        <button
                            onClick={() => setLowStockOnly(!lowStockOnly)}
                            className={cn(
                                "group relative overflow-hidden flex items-center gap-3 px-6 py-5 rounded-[2.5rem] font-bold transition-all border-2 whitespace-nowrap",
                                lowStockOnly
                                    ? "bg-yellow-400 text-blue-600 border-yellow-400"
                                    : "bg-white text-zinc-400 border-black/30 hover:border-black/30"
                            )}
                        >
                            <div className={cn(
                                "absolute inset-0 bg-yellow-400 transition-transform duration-300 ease-out origin-bottom translate-y-[102%] group-hover:translate-y-0",
                                lowStockOnly && "hidden"
                            )} />
                            <AlertTriangle size={20} className={cn("relative z-10 transition-colors", lowStockOnly ? "text-blue-600" : "text-zinc-400 group-hover:text-blue-600")} />
                            <span className="relative z-10 transition-colors group-hover:text-blue-600">{t('inventory.filters.low_stock_only')}</span>
                            {lowStockProducts.length > 0 && (
                                <span className={cn(
                                    "relative z-10 px-2 py-0.5 rounded-full text-xs font-black transition-colors",
                                    lowStockOnly ? "bg-blue-100 text-blue-600" : "bg-zinc-100 text-zinc-500 group-hover:bg-blue-100 group-hover:text-blue-600"
                                )}>
                                    {lowStockProducts.length}
                                </span>
                            )}
                        </button>

                        {/* Export Low Stock Button */}
                        <button
                            onClick={handleExportLowStock}
                            className="flex items-center gap-3 px-6 py-4.5 text-black/30 hover:text-white hover:bg-black rounded-[2.5rem] font-bold transition-all duration-300 ease-in-out hover:border-black border-2 border-black/30 whitespace-nowrap"
                        >
                            <Download size={20} />
                            <span>{t('inventory.filters.export_low_stock')}</span>
                        </button>
                    </div>

                    {/* Category Filter Section */}
                    <div className="w-full flex flex-col gap-4">
                        {/* Header with Title and Scroll Controls */}
                        <div className="flex items-center justify-between px-2">
                            <span className="text-[10px] font-black uppercase tracking-widest text-black">{t('inventory.filters.filter_by_category')}</span>

                            {/* Controls - Top Right */}
                            <div className="flex items-center gap-3">
                                {/* View Toggles */}
                                <div className="flex items-center gap-1 bg-gray-50 rounded-full p-1 border-2 border-black/20">
                                    <button
                                        onClick={() => setViewMode('grid')}
                                        className={cn("p-2 rounded-full transition-all", viewMode === 'grid' ? "bg-black text-white" : "text-zinc-400 hover:text-black")}
                                    >
                                        <LayoutGrid size={16} strokeWidth={2.5} />
                                    </button>
                                    <button
                                        onClick={() => setViewMode('list')}
                                        className={cn("p-2 rounded-full transition-all", viewMode === 'list' ? "bg-black text-white" : "text-zinc-400 hover:text-black")}
                                    >
                                        <ListIcon size={16} strokeWidth={2.5} />
                                    </button>
                                </div>

                                {/* Scroll Controls */}
                                <div className="hidden md:flex items-center gap-1 bg-gray-50 rounded-full p-1 border-2 border-black/20">
                                    <button
                                        onClick={() => scroll('left')}
                                        className="p-2 text-zinc-400 hover:text-black transition-all"
                                    >
                                        <ChevronLeft size={18} strokeWidth={2.5} className="rtl:rotate-180" />
                                    </button>
                                    <div className="w-px h-4 bg-zinc-200" />
                                    <button
                                        onClick={() => scroll('right')}
                                        className="p-2 text-zinc-400 hover:text-black transition-all"
                                    >
                                        <ChevronRight size={18} strokeWidth={2.5} className="rtl:rotate-180" />
                                    </button>
                                </div>

                                {/* Clear Filters */}
                                {(categoryFilter !== null || search || lowStockOnly) && (
                                    <button
                                        onClick={() => {
                                            setCategoryFilter(null);
                                            setSearch('');
                                            setLowStockOnly(false);
                                        }}
                                        className="flex items-center gap-2 px-4 py-2 rounded-full bg-red-500 text-white hover:bg-red-600 transition-all font-bold text-[10px] uppercase tracking-widest"
                                    >
                                        <X size={14} strokeWidth={3} />
                                        <span>{t('inventory.filters.clear')}</span>
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Scrollable Category List */}
                        <div ref={containerRef} className="w-full overflow-hidden mask-linear-fade">
                            <motion.div
                                ref={scrollContainerRef}
                                style={{ x }}
                                drag="x"
                                dragConstraints={constraints}
                                dragElastic={0.2}
                                className="flex gap-3 w-max pb-4 cursor-grab active:cursor-grabbing"
                            >
                                <button
                                    onClick={() => setCategoryFilter(null)}
                                    // Remove default button behavior to prevent conflict with drag
                                    onPointerDown={(e) => e.preventDefault()}
                                    className={cn(
                                        "group relative overflow-hidden px-6 py-4 rounded-[1.5rem] whitespace-nowrap font-bold text-sm transition-all border-2 shrink-0",
                                        categoryFilter === null
                                            ? "bg-blue-600 text-white border-blue-600"
                                            : "bg-white text-black border-black/20 hover:border-zinc-200"
                                    )}
                                >
                                    <div className={cn(
                                        "absolute inset-0 bg-blue-400 transition-transform duration-300 ease-out origin-bottom translate-y-full group-hover:translate-y-0",
                                        categoryFilter === null && "hidden"
                                    )} />
                                    <span className="relative z-10 group-hover:text-white transition-colors">{t('inventory.filters.all_items')}</span>
                                </button>
                                {categories.map((cat: Category, index: number) => (
                                    <button
                                        key={`${cat.id}-${index}`}
                                        onClick={() => setCategoryFilter(cat.id)}
                                        // Remove default button behavior to prevent conflict with drag
                                        onPointerDown={(e) => e.preventDefault()}
                                        className={cn(
                                            "group relative overflow-hidden px-6 py-4 rounded-[1.5rem] whitespace-nowrap font-bold text-sm transition-all border-2 shrink-0",
                                            categoryFilter === cat.id
                                                ? "bg-blue-600 text-white border-blue-600"
                                                : "bg-white text-black border-black/20 hover:border-zinc-200"
                                        )}
                                    >
                                        <div className={cn(
                                            "absolute inset-0 bg-blue-400 transition-transform duration-300 ease-out origin-bottom translate-y-full group-hover:translate-y-0",
                                            categoryFilter === cat.id && "hidden"
                                        )} />
                                        <span className="relative z-10 group-hover:text-white transition-colors">
                                            {t(`categories.${cat.name}`, { defaultValue: cat.name })}
                                        </span>
                                    </button>))}
                            </motion.div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Products Grid */}
            <div className="relative z-10 flex-1 overflow-y-auto min-h-0 pr-2 custom-scrollbar">
                {products.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 text-zinc-300">
                        <Package size={64} strokeWidth={1} className="mb-4" />
                        <p className="text-xl font-black uppercase tracking-widest">{t('inventory.empty.no_products')}</p>
                    </div>
                ) : (
                    <>
                        <motion.div
                            key={viewMode}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.2 }}
                            className={cn(
                                "grid gap-4 pb-8", // Reduced padding bottom as pagination is coming
                                viewMode === 'grid'
                                    ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                                    : "grid-cols-1"
                            )}
                        >
                            {viewMode === 'list' && products.length > 0 && (
                                <div className="grid grid-cols-[60px_1.5fr_120px_60px_90px_90px_140px_1fr_1.2fr_60px] items-center gap-4 px-8 py-4 mb-2">
                                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">{t('inventory.table.id')}</span>
                                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">{t('inventory.table.product')}</span>
                                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">{t('inventory.table.barcode')}</span>
                                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 text-center">{t('inventory.table.unit')}</span>
                                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 text-right">{t('inventory.table.cost')}</span>
                                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 text-right">{t('inventory.table.selling')}</span>
                                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 text-center">{t('inventory.table.created_at')}</span>
                                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 text-center">{t('inventory.table.category')}</span>
                                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 text-center">{t('inventory.table.stock_level')}</span>
                                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 text-right pr-2">{t('inventory.table.actions')}</span>
                                </div>
                            )}
                            {products.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE).map((product) => {
                                const style = getProductStyle(product.id);
                                const isLowStock = product.stock_quantity > 0 && product.stock_quantity < (product.reorder_level || 10);
                                const isOutStock = product.stock_quantity <= 0;
                                const isInStock = product.stock_quantity >= (product.reorder_level || 10);
                                const displayStock = Math.max(0, product.stock_quantity);

                                if (viewMode === 'list') {
                                    const isOutStock = product.stock_quantity <= 0;
                                    const isLowStock = product.stock_quantity > 0 && product.stock_quantity < (product.reorder_level || 10);
                                    const isInStock = product.stock_quantity >= (product.reorder_level || 10);

                                    return (
                                        <div
                                            key={product.id}
                                            className="group grid grid-cols-[60px_1.5fr_120px_60px_90px_90px_140px_1fr_1.2fr_60px] items-center gap-4 p-4 rounded-3xl bg-white border border-zinc-100 hover:border-zinc-200 transition-all"
                                        >
                                            {/* ID */}
                                            <div className="text-[11px] font-black text-blue-900 px-2 py-1 bg-yellow-400 rounded-lg w-fit">
                                                #{product.id}
                                            </div>

                                            {/* Product Info */}
                                            <div className="flex items-center gap-4 min-w-0">
                                                <div className="w-10 h-10 flex items-center justify-center shrink-0">
                                                    <ShoppingBag size={18} className="text-black" />
                                                </div>
                                                <div className="flex flex-col min-w-0 pr-4">
                                                    <h3 className="text-sm font-black text-black uppercase tracking-tight truncate">{product.name}</h3>
                                                </div>
                                            </div>

                                            {/* Barcode */}
                                            <div className="flex items-center gap-2 font-mono text-[11px] text-zinc-400 font-bold truncate">
                                                <Barcode size={14} className="shrink-0" />
                                                <span>{product.barcode || '---'}</span>
                                            </div>

                                            {/* Unit */}
                                            <div className="text-[10px] font-black uppercase text-zinc-500 tracking-widest text-center">
                                                {product.unit}
                                            </div>

                                            {/* Cost Price */}
                                            <div className="text-right">
                                                <p className="text-sm font-black text-zinc-500">{formatPrice(product.cost_price)}</p>
                                            </div>

                                            {/* Selling Price */}
                                            <div className="text-right">
                                                <p className="text-sm font-black text-black">{formatPrice(product.selling_price)}</p>
                                            </div>

                                            {/* Created At */}
                                            <div className="text-center">
                                                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-tighter">
                                                    {formatDate(product.created_at)}
                                                </p>
                                            </div>

                                            {/* Category */}
                                            <div className="text-center">
                                                <span className="px-3 py-1.5 rounded-xl bg-zinc-50 border border-zinc-100 text-[10px] font-black uppercase text-zinc-500 tracking-widest">
                                                    {product.category_name ? t(`categories.${product.category_name}`, { defaultValue: product.category_name }) : t('categories.Uncategorized')}
                                                </span>
                                            </div>

                                            {/* Stock Status Badger */}
                                            <div className="flex justify-center">
                                                <div className={cn(
                                                    "px-4 py-2 rounded-2xl font-black text-[10px] uppercase tracking-[0.15em] flex items-center justify-center min-w-[100px] text-white",
                                                    isInStock && "bg-emerald-500",
                                                    isLowStock && "bg-orange-400",
                                                    isOutStock && "bg-red-600"
                                                )}>
                                                    <span>{Math.max(0, product.stock_quantity)} · {isInStock ? t('inventory.status.in_stock') : isLowStock ? t('inventory.status.low_stock') : t('inventory.status.out_of_stock')}</span>
                                                </div>
                                            </div>

                                            {/* Actions Dropdown */}
                                            <div className="flex justify-end pr-2">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <button className="p-2 rounded-xl hover:bg-black/5 text-zinc-400 hover:text-black transition-colors focus:outline-none">
                                                            <MoreVertical size={18} />
                                                        </button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align={i18n.dir() === 'rtl' ? 'start' : 'end'} className="w-40 rounded-xl border-black/10 bg-white">
                                                        <DropdownMenuLabel>{t('inventory.table.actions')}</DropdownMenuLabel>
                                                        <DropdownMenuSeparator className="bg-zinc-100" />
                                                        <DropdownMenuItem onClick={() => handleEdit(product)} className="gap-2 cursor-pointer focus:bg-zinc-50">
                                                            <Edit2 size={14} />
                                                            <span>{t('inventory.actions.edit')}</span>
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => handleDelete(product.id)} className="gap-2 text-red-600 focus:text-red-700 focus:bg-red-50 cursor-pointer">
                                                            <Trash2 size={14} />
                                                            <span>{t('inventory.actions.delete')}</span>
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </div>
                                        </div>
                                    );
                                }

                                return (
                                    <motion.div
                                        key={product.id}
                                        layout
                                        className={cn(
                                            "group relative flex flex-col p-5 rounded-[3rem] bg-white transition-all overflow-visible",
                                            isOutStock ? "border-2 border-red-400/50" : isLowStock ? "border-2 border-orange-400/50" : "border-2 border-black/10"
                                        )}>
                                        {/* Header Row: Icon + Title + Actions */}
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="flex items-center gap-4 overflow-hidden">
                                                {/* Icon - No Background */}
                                                <div className="w-14 h-14 rounded-[1.2rem] bg-gray-50 flex items-center justify-center shrink-0">
                                                    <ShoppingBag size={24} className="text-black" />
                                                </div>

                                                {/* Title & Category */}
                                                <div className="min-w-0">
                                                    <h3 className="text-base font-bold text-black uppercase tracking-tight truncate pr-2 leading-tight">
                                                        {product.name}
                                                    </h3>
                                                    <p className="text-xs font-medium text-zinc-400 truncate">
                                                        {product.category_name ? t(`categories.${product.category_name}`, { defaultValue: product.category_name }) : t('categories.Uncategorized')}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Actions Dropdown */}
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <button className="p-2 -mr-2 rounded-full hover:bg-black/5 text-zinc-400 hover:text-black transition-colors focus:outline-none">
                                                        <MoreVertical size={18} />
                                                    </button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="w-40 rounded-xl border-black/10 bg-white">
                                                    <DropdownMenuLabel>{t('inventory.table.actions')}</DropdownMenuLabel>
                                                    <DropdownMenuSeparator className="bg-zinc-100" />
                                                    <DropdownMenuItem onClick={() => handleEdit(product)} className="gap-2 cursor-pointer focus:bg-zinc-50">
                                                        <Edit2 size={14} />
                                                        <span>{t('inventory.actions.edit')}</span>
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => handleDelete(product.id)} className="gap-2 text-red-600 focus:text-red-700 focus:bg-red-50 cursor-pointer">
                                                        <Trash2 size={14} />
                                                        <span>{t('inventory.actions.delete')}</span>
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>

                                        {/* Stats Grid */}
                                        <div className="grid grid-cols-2 gap-4 mt-auto">
                                            {/* Price */}
                                            <div>
                                                <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">{t('inventory.table.price')}</p>
                                                <p className="text-lg font-black text-black">{formatPrice(product.selling_price)}</p>
                                            </div>

                                            {/* Stock with Color Code */}
                                            <div className="text-right rtl:text-left">
                                                <p className={cn(
                                                    "text-[10px] font-bold uppercase tracking-widest mb-1",
                                                    isOutStock ? "text-red-400" : isLowStock ? "text-orange-400" : "text-blue-400"
                                                )}>
                                                    {isOutStock ? t('inventory.status.out_of_stock') : isLowStock ? t('inventory.status.low_stock') : t('inventory.status.in_stock')}
                                                </p>
                                                <div className="flex items-center justify-end gap-2 leading-none">
                                                    <span className={cn(
                                                        "text-xl font-black",
                                                        isOutStock ? "text-red-500" : isLowStock ? "text-orange-500" : "text-blue-500"
                                                    )}>
                                                        {displayStock}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>


                                    </motion.div>
                                );

                            })}
                        </motion.div>

                        {/* Pagination Controls */}
                        {products.length > ITEMS_PER_PAGE && (
                            <div className="flex items-center justify-between py-8 px-1 border-t border-zinc-100 mb-10">
                                <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">
                                    {t('inventory.pagination.showing')} <span className="text-black">{(currentPage - 1) * ITEMS_PER_PAGE + 1}</span> {t('inventory.pagination.to')} <span className="text-black">{Math.min(currentPage * ITEMS_PER_PAGE, products.length)}</span> {t('inventory.pagination.of')} <span className="text-black">{products.length}</span> {t('inventory.title')}
                                </p>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                                        disabled={currentPage === 1}
                                        className="flex items-center gap-2 px-6 py-4 rounded-3xl bg-zinc-50 border-2 border-zinc-300 text-zinc-400 font-black uppercase tracking-widest text-[10px] transition-all hover:bg-black hover:text-white hover:border-black disabled:opacity-30 disabled:hover:bg-zinc-50 disabled:hover:text-zinc-400 disabled:hover:border-zinc-300 disabled:cursor-not-allowed"
                                    >
                                        <ChevronLeft size={16} strokeWidth={3} />
                                        <span>{t('inventory.pagination.prev')}</span>
                                    </button>

                                    <div className="flex items-center gap-1 mx-4">
                                        {Array.from({ length: Math.ceil(products.length / ITEMS_PER_PAGE) }).map((_, i) => {
                                            const pageNumber = i + 1;
                                            const totalPages = Math.ceil(products.length / ITEMS_PER_PAGE);

                                            // Smart pagination: show first, last, current, and neighbors
                                            if (
                                                totalPages > 7 &&
                                                pageNumber !== 1 &&
                                                pageNumber !== totalPages &&
                                                Math.abs(pageNumber - currentPage) > 1
                                            ) {
                                                if (Math.abs(pageNumber - currentPage) === 2) return <span key={pageNumber} className="px-1 text-zinc-300 font-bold">...</span>;
                                                return null;
                                            }

                                            return (
                                                <button
                                                    key={pageNumber}
                                                    onClick={() => setCurrentPage(pageNumber)}
                                                    className={cn(
                                                        "w-12 h-12 rounded-[1.2rem] font-black text-sm transition-all border-2",
                                                        currentPage === pageNumber
                                                            ? "bg-black text-white border-black shadow-lg shadow-black/10"
                                                            : "bg-white text-zinc-400 border-zinc-200 hover:border-zinc-400 hover:text-black"
                                                    )}
                                                >
                                                    {pageNumber}
                                                </button>
                                            );
                                        })}
                                    </div>

                                    <button
                                        onClick={() => setCurrentPage(Math.min(Math.ceil(products.length / ITEMS_PER_PAGE), currentPage + 1))}
                                        disabled={currentPage === Math.ceil(products.length / ITEMS_PER_PAGE)}
                                        className="flex items-center gap-2 px-6 py-4 rounded-3xl bg-zinc-50 border-2 border-zinc-300 text-zinc-400 font-black uppercase tracking-widest text-[10px] transition-all hover:bg-black hover:text-white hover:border-black disabled:opacity-30 disabled:hover:bg-zinc-50 disabled:hover:text-zinc-400 disabled:hover:border-zinc-300 disabled:cursor-not-allowed"
                                    >
                                        <span>{t('inventory.pagination.next')}</span>
                                        <ChevronRight size={16} strokeWidth={3} />
                                    </button>
                                </div>
                            </div>
                        )}
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
                        // Force clear all local filters to match store optimistic update
                        setSearch('');
                        setCategoryFilter(null);
                        setLowStockOnly(false);
                        setCurrentPage(1);
                        // Force reload to be safe
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
        </div >
    );
}
