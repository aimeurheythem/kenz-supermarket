import { useRef, useState, useEffect } from 'react';
import {
    AlertTriangle,
    Search,
    LayoutGrid,
    List as ListIcon,
    Download,
    X,
    ChevronLeft,
    ChevronRight,
} from 'lucide-react';
import { motion, useMotionValue, animate } from 'framer-motion';
import { cn } from '@/lib/utils';
import type { Category } from '@/lib/types';
import { useTranslation } from 'react-i18next';
import type { i18n as I18nType } from 'i18next';

interface InventoryFiltersProps {
    search: string;
    setSearch: (value: string) => void;
    lowStockOnly: boolean;
    setLowStockOnly: (value: boolean) => void;
    lowStockCount: number;
    categoryFilter: number | null;
    setCategoryFilter: (value: number | null) => void;
    viewMode: 'grid' | 'list';
    setViewMode: (value: 'grid' | 'list') => void;
    categories: Category[];
    handleExportLowStock: () => void;
    i18n: I18nType;
}

export default function InventoryFilters({
    search,
    setSearch,
    lowStockOnly,
    setLowStockOnly,
    lowStockCount,
    categoryFilter,
    setCategoryFilter,
    viewMode,
    setViewMode,
    categories,
    handleExportLowStock,
    i18n,
}: InventoryFiltersProps) {
    const { t } = useTranslation();

    const x = useMotionValue(0);
    const containerRef = useRef<HTMLDivElement>(null);
    const scrollContainerRef = useRef<HTMLDivElement>(null);
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
    }, [categories, i18n.language, x]);

    const scroll = (direction: 'left' | 'right') => {
        const currentX = x.get();
        const scrollAmount = 300;
        const isRtl = document.documentElement.dir === 'rtl';

        let newX: number;
        if (isRtl) {
            newX =
                direction === 'left'
                    ? Math.max(0, currentX - scrollAmount)
                    : Math.min(constraints.right, currentX + scrollAmount);
        } else {
            newX =
                direction === 'left'
                    ? Math.min(0, currentX + scrollAmount)
                    : Math.max(constraints.left, currentX - scrollAmount);
        }

        animate(x, newX, { type: 'spring', stiffness: 300, damping: 30 });
    };

    return (
        <div className="flex flex-col gap-6">
            {/* Top Row: Search + Actions */}
            <div className="flex flex-col md:flex-row gap-4 items-center">
                {/* Search Bar */}
                <div className="relative flex-1 w-full group">
                    <Search
                        size={22}
                        className="absolute left-6 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-black transition-colors"
                    />
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
                        'group relative overflow-hidden flex items-center gap-3 px-6 py-5 rounded-[2.5rem] font-bold transition-all border-2 whitespace-nowrap',
                        lowStockOnly
                            ? 'bg-yellow-400 text-blue-600 border-yellow-400'
                            : 'bg-white text-zinc-400 border-black/30 hover:border-black/30',
                    )}
                >
                    <div
                        className={cn(
                            'absolute inset-0 bg-yellow-400 transition-transform duration-300 ease-out origin-bottom translate-y-[102%] group-hover:translate-y-0',
                            lowStockOnly && 'hidden',
                        )}
                    />
                    <AlertTriangle
                        size={20}
                        className={cn(
                            'relative z-10 transition-colors',
                            lowStockOnly ? 'text-blue-600' : 'text-zinc-400 group-hover:text-blue-600',
                        )}
                    />
                    <span className="relative z-10 transition-colors group-hover:text-blue-600">
                        {t('inventory.filters.low_stock_only')}
                    </span>
                    {lowStockCount > 0 && (
                        <span
                            className={cn(
                                'relative z-10 px-2 py-0.5 rounded-full text-xs font-black transition-colors',
                                lowStockOnly
                                    ? 'bg-blue-100 text-blue-600'
                                    : 'bg-zinc-100 text-zinc-500 group-hover:bg-blue-100 group-hover:text-blue-600',
                            )}
                        >
                            {lowStockCount}
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
                    <span className="text-[10px] font-black uppercase tracking-widest text-black">
                        {t('inventory.filters.filter_by_category')}
                    </span>

                    {/* Controls - Top Right */}
                    <div className="flex items-center gap-3">
                        {/* View Toggles */}
                        <div className="flex items-center gap-1 bg-gray-50 rounded-full p-1 border-2 border-black/20">
                            <button
                                onClick={() => setViewMode('grid')}
                                className={cn(
                                    'p-2 rounded-full transition-all',
                                    viewMode === 'grid' ? 'bg-black text-white' : 'text-zinc-400 hover:text-black',
                                )}
                            >
                                <LayoutGrid size={16} strokeWidth={2.5} />
                            </button>
                            <button
                                onClick={() => setViewMode('list')}
                                className={cn(
                                    'p-2 rounded-full transition-all',
                                    viewMode === 'list' ? 'bg-black text-white' : 'text-zinc-400 hover:text-black',
                                )}
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
                            onPointerDown={(e) => e.preventDefault()}
                            className={cn(
                                'group relative overflow-hidden px-6 py-4 rounded-[1.5rem] whitespace-nowrap font-bold text-sm transition-all border-2 shrink-0',
                                categoryFilter === null
                                    ? 'bg-blue-600 text-white border-blue-600'
                                    : 'bg-white text-black border-black/20 hover:border-zinc-200',
                            )}
                        >
                            <div
                                className={cn(
                                    'absolute inset-0 bg-blue-400 transition-transform duration-300 ease-out origin-bottom translate-y-full group-hover:translate-y-0',
                                    categoryFilter === null && 'hidden',
                                )}
                            />
                            <span className="relative z-10 group-hover:text-white transition-colors">
                                {t('inventory.filters.all_items')}
                            </span>
                        </button>
                        {categories.map((cat: Category, index: number) => (
                            <button
                                key={`${cat.id}-${index}`}
                                onClick={() => setCategoryFilter(cat.id)}
                                onPointerDown={(e) => e.preventDefault()}
                                className={cn(
                                    'group relative overflow-hidden px-6 py-4 rounded-[1.5rem] whitespace-nowrap font-bold text-sm transition-all border-2 shrink-0',
                                    categoryFilter === cat.id
                                        ? 'bg-blue-600 text-white border-blue-600'
                                        : 'bg-white text-black border-black/20 hover:border-zinc-200',
                                )}
                            >
                                <div
                                    className={cn(
                                        'absolute inset-0 bg-blue-400 transition-transform duration-300 ease-out origin-bottom translate-y-full group-hover:translate-y-0',
                                        categoryFilter === cat.id && 'hidden',
                                    )}
                                />
                                <span className="relative z-10 group-hover:text-white transition-colors">
                                    {t(`categories.${cat.name}`, { defaultValue: cat.name })}
                                </span>
                            </button>
                        ))}
                    </motion.div>
                </div>
            </div>
        </div>
    );
}
