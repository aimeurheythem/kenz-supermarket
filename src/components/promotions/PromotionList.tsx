import { useTranslation } from 'react-i18next';
import { Eye, Pencil, Trash2, MoreVertical } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import Pagination from '@/components/common/Pagination';
import { usePagination } from '@/hooks/usePagination';
import { cn } from '@/lib/utils';
import type { Promotion, PromotionEffectiveStatus, PromotionType } from '@/lib/types';

interface PromotionListProps {
    promotions: Promotion[];
    isLoading: boolean;
    onView: (promotion: Promotion) => void;
    onEdit: (promotion: Promotion) => void;
    onDelete: (promotion: Promotion) => void;
}

// ── Badge Helpers ──────────────────────────────────────────────────────────

function TypeBadge({ type }: { type: PromotionType }) {
    const { t } = useTranslation();
    const map: Record<PromotionType, string> = {
        price_discount: 'bg-blue-100 text-blue-700',
        quantity_discount: 'bg-purple-100 text-purple-700',
        pack_discount: 'bg-amber-100 text-amber-700',
    };
    return (
        <span className={cn('inline-flex items-center px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wide', map[type])}>
            {t(`promotions.type.${type}`)}
        </span>
    );
}

function StatusBadge({ status }: { status: PromotionEffectiveStatus }) {
    const { t } = useTranslation();
    const map: Record<PromotionEffectiveStatus, string> = {
        active: 'bg-emerald-100 text-emerald-700',
        inactive: 'bg-zinc-100 text-zinc-500',
        expired: 'bg-rose-100 text-rose-600',
        scheduled: 'bg-sky-100 text-sky-600',
    };
    return (
        <span className={cn('inline-flex items-center px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wide', map[status] ?? 'bg-zinc-100 text-zinc-500')}>
            {t(`promotions.status.${status}`)}
        </span>
    );
}

// ── Component ──────────────────────────────────────────────────────────────

const ITEMS_PER_PAGE = 15;

export default function PromotionList({ promotions, isLoading, onView, onEdit, onDelete }: PromotionListProps) {
    const { t } = useTranslation();

    const { currentPage, totalPages, paginate, setCurrentPage, startIndex, endIndex } = usePagination({
        totalItems: promotions.length,
        pageSize: ITEMS_PER_PAGE,
    });

    const paginatedPromotions = paginate(promotions);

    const today = new Date().toISOString().split('T')[0];

    /** Compute effective status client-side if not provided by repo */
    function resolveStatus(p: Promotion): PromotionEffectiveStatus {
        if (p.effective_status) return p.effective_status;
        if (p.status === 'inactive') return 'inactive';
        if (p.end_date < today) return 'expired';
        if (p.start_date > today) return 'scheduled';
        return 'active';
    }

    if (isLoading) {
        return (
            <div className="rounded-[3rem] bg-white border-2 border-black/5 overflow-hidden">
                <div className="p-8 flex items-center justify-center">
                    <div className="animate-pulse text-zinc-400 font-semibold text-sm">Loading…</div>
                </div>
            </div>
        );
    }

    return (
        <div className="rounded-[3rem] bg-white border-2 border-black/5 overflow-hidden">
            {promotions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 gap-3 text-zinc-400">
                    <span className="text-5xl">🏷️</span>
                    <p className="font-black uppercase tracking-widest text-sm">{t('promotions.no_promotions', 'No Promotions Found')}</p>
                </div>
            ) : (
                <>
                    <table className="w-full">
                        <thead>
                            <tr className="border-b-2 border-zinc-100">
                                <th className="text-start px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">
                                    {t('promotions.table.name')}
                                </th>
                                <th className="text-start px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">
                                    {t('promotions.table.type')}
                                </th>
                                <th className="text-start px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">
                                    {t('promotions.table.status')}
                                </th>
                                <th className="text-start px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">
                                    {t('promotions.table.start_date')}
                                </th>
                                <th className="text-start px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">
                                    {t('promotions.table.end_date')}
                                </th>
                                <th className="text-end px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">
                                    {t('promotions.table.actions')}
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            <AnimatePresence initial={false}>
                                {paginatedPromotions.map((promotion, idx) => (
                                    <motion.tr
                                        key={promotion.id}
                                        initial={{ opacity: 0, y: 4 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0 }}
                                        transition={{ delay: idx * 0.02 }}
                                        className="border-b border-zinc-50 hover:bg-zinc-50 transition-colors"
                                    >
                                        <td className="px-6 py-4">
                                            <span className="font-bold text-black text-sm">{promotion.name}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <TypeBadge type={promotion.type} />
                                        </td>
                                        <td className="px-6 py-4">
                                            <StatusBadge status={resolveStatus(promotion)} />
                                        </td>
                                        <td className="px-6 py-4 text-sm text-zinc-600 font-medium">
                                            {promotion.start_date}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-zinc-600 font-medium">
                                            {promotion.end_date}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex justify-end">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <button className="p-2 rounded-xl hover:bg-black/5 text-zinc-400 hover:text-black transition-colors focus:outline-none">
                                                            <MoreVertical size={18} />
                                                        </button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end" className="w-40 rounded-xl border-black/10 bg-white">
                                                        <DropdownMenuLabel>{t('promotions.table.actions')}</DropdownMenuLabel>
                                                        <DropdownMenuSeparator className="bg-zinc-100" />
                                                        <DropdownMenuItem
                                                            onClick={() => onView(promotion)}
                                                            className="gap-2 cursor-pointer focus:bg-zinc-50"
                                                        >
                                                            <Eye size={14} />
                                                            <span>{t('promotions.table.view', 'View')}</span>
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            onClick={() => onEdit(promotion)}
                                                            className="gap-2 cursor-pointer focus:bg-zinc-50"
                                                        >
                                                            <Pencil size={14} />
                                                            <span>{t('promotions.table.edit', 'Edit')}</span>
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            onClick={() => onDelete(promotion)}
                                                            className="gap-2 text-red-600 focus:text-red-700 focus:bg-red-50 cursor-pointer"
                                                        >
                                                            <Trash2 size={14} />
                                                            <span>{t('promotions.table.delete', 'Delete')}</span>
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </div>
                                        </td>
                                    </motion.tr>
                                ))}
                            </AnimatePresence>
                        </tbody>
                    </table>

                    {totalPages > 1 && (
                        <div className="px-6 py-4 border-t border-zinc-100">
                            <Pagination
                                currentPage={currentPage}
                                totalPages={totalPages}
                                totalItems={promotions.length}
                                startIndex={startIndex}
                                endIndex={endIndex}
                                onPageChange={setCurrentPage}
                            />
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
