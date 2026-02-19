import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';

interface InventoryPaginationProps {
    currentPage: number;
    setCurrentPage: (page: number) => void;
    totalItems: number;
    itemsPerPage: number;
}

export default function InventoryPagination({
    currentPage,
    setCurrentPage,
    totalItems,
    itemsPerPage,
}: InventoryPaginationProps) {
    const { t } = useTranslation();

    const totalPages = Math.ceil(totalItems / itemsPerPage);

    if (totalItems <= itemsPerPage) return null;

    return (
        <div className="flex items-center justify-between py-8 px-1 border-t border-zinc-100 mb-10">
            <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">
                {t('inventory.pagination.showing')}{' '}
                <span className="text-black">{(currentPage - 1) * itemsPerPage + 1}</span>{' '}
                {t('inventory.pagination.to')}{' '}
                <span className="text-black">{Math.min(currentPage * itemsPerPage, totalItems)}</span>{' '}
                {t('inventory.pagination.of')} <span className="text-black">{totalItems}</span> {t('inventory.title')}
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
                    {Array.from({ length: totalPages }).map((_, i) => {
                        const pageNumber = i + 1;

                        // Smart pagination: show first, last, current, and neighbors
                        if (
                            totalPages > 7 &&
                            pageNumber !== 1 &&
                            pageNumber !== totalPages &&
                            Math.abs(pageNumber - currentPage) > 1
                        ) {
                            if (Math.abs(pageNumber - currentPage) === 2)
                                return (
                                    <span key={pageNumber} className="px-1 text-zinc-300 font-bold">
                                        ...
                                    </span>
                                );
                            return null;
                        }

                        return (
                            <button
                                key={pageNumber}
                                onClick={() => setCurrentPage(pageNumber)}
                                className={cn(
                                    'w-12 h-12 rounded-[1.2rem] font-black text-sm transition-all border-2',
                                    currentPage === pageNumber
                                        ? 'bg-black text-white border-black shadow-lg shadow-black/10'
                                        : 'bg-white text-zinc-400 border-zinc-200 hover:border-zinc-400 hover:text-black',
                                )}
                            >
                                {pageNumber}
                            </button>
                        );
                    })}
                </div>

                <button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="flex items-center gap-2 px-6 py-4 rounded-3xl bg-zinc-50 border-2 border-zinc-300 text-zinc-400 font-black uppercase tracking-widest text-[10px] transition-all hover:bg-black hover:text-white hover:border-black disabled:opacity-30 disabled:hover:bg-zinc-50 disabled:hover:text-zinc-400 disabled:hover:border-zinc-300 disabled:cursor-not-allowed"
                >
                    <span>{t('inventory.pagination.next')}</span>
                    <ChevronRight size={16} strokeWidth={3} />
                </button>
            </div>
        </div>
    );
}
