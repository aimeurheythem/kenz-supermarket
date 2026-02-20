import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';

interface PaginationProps {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    startIndex: number;
    endIndex: number;
    onPageChange: (page: number) => void;
    /** Label for the items (e.g. "products", "customers"). Falls back to "items" */
    itemLabel?: string;
}

export default function Pagination({
    currentPage,
    totalPages,
    totalItems,
    startIndex,
    endIndex,
    onPageChange,
    itemLabel,
}: PaginationProps) {
    const { t } = useTranslation();

    if (totalPages <= 1) return null;

    const label = itemLabel || t('pagination.items');

    return (
        <div className="flex items-center justify-between py-6 px-1 border-t border-zinc-100">
            <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">
                {t('pagination.showing')} <span className="text-black">{startIndex + 1}</span> {t('pagination.to')}{' '}
                <span className="text-black">{endIndex}</span> {t('pagination.of')}{' '}
                <span className="text-black">{totalItems}</span> {label}
            </p>
            <div className="flex items-center gap-2">
                <button
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-zinc-50 border border-zinc-200 text-zinc-400 font-bold uppercase tracking-widest text-[10px] transition-all hover:bg-black hover:text-white hover:border-black disabled:opacity-30 disabled:hover:bg-zinc-50 disabled:hover:text-zinc-400 disabled:hover:border-zinc-200 disabled:cursor-not-allowed"
                >
                    <ChevronLeft size={14} strokeWidth={3} />
                    <span>{t('pagination.prev')}</span>
                </button>

                <div className="flex items-center gap-1 mx-2">
                    {getPageNumbers(currentPage, totalPages).map((item, idx) =>
                        item === 'ellipsis' ? (
                            <span key={`ellipsis-${idx}`} className="px-1 text-zinc-300 font-bold">
                                ...
                            </span>
                        ) : (
                            <button
                                key={item}
                                onClick={() => onPageChange(item as number)}
                                className={cn(
                                    'w-10 h-10 rounded-xl font-bold text-sm transition-all border',
                                    currentPage === item
                                        ? 'bg-black text-white border-black shadow-lg shadow-black/10'
                                        : 'bg-white text-zinc-400 border-zinc-200 hover:border-zinc-400 hover:text-black',
                                )}
                            >
                                {item}
                            </button>
                        ),
                    )}
                </div>

                <button
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-zinc-50 border border-zinc-200 text-zinc-400 font-bold uppercase tracking-widest text-[10px] transition-all hover:bg-black hover:text-white hover:border-black disabled:opacity-30 disabled:hover:bg-zinc-50 disabled:hover:text-zinc-400 disabled:hover:border-zinc-200 disabled:cursor-not-allowed"
                >
                    <span>{t('pagination.next')}</span>
                    <ChevronRight size={14} strokeWidth={3} />
                </button>
            </div>
        </div>
    );
}

/** Compute which page numbers and ellipsis markers to show */
function getPageNumbers(current: number, total: number): (number | 'ellipsis')[] {
    if (total <= 7) {
        return Array.from({ length: total }, (_, i) => i + 1);
    }

    const pages: (number | 'ellipsis')[] = [1];

    if (current > 3) {
        pages.push('ellipsis');
    }

    const start = Math.max(2, current - 1);
    const end = Math.min(total - 1, current + 1);

    for (let i = start; i <= end; i++) {
        pages.push(i);
    }

    if (current < total - 2) {
        pages.push('ellipsis');
    }

    pages.push(total);

    return pages;
}
