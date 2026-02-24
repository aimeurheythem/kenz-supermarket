import { useTranslation } from 'react-i18next';
import { Eye, Pencil, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
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
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => onView(promotion)}
                                                    title={t('promotions.table.view', 'View')}
                                                    className="p-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-600 transition-colors"
                                                >
                                                    <Eye size={14} strokeWidth={2.5} />
                                                </button>
                                                <button
                                                    onClick={() => onEdit(promotion)}
                                                    title={t('promotions.table.edit', 'Edit')}
                                                    className="p-2 rounded-xl bg-zinc-100 hover:bg-yellow-100 text-zinc-600 hover:text-yellow-700 transition-colors"
                                                >
                                                    <Pencil size={14} strokeWidth={2.5} />
                                                </button>
                                                <button
                                                    onClick={() => onDelete(promotion)}
                                                    title={t('promotions.table.delete', 'Delete')}
                                                    className="p-2 rounded-xl bg-zinc-100 hover:bg-rose-100 text-zinc-600 hover:text-rose-600 transition-colors"
                                                >
                                                    <Trash2 size={14} strokeWidth={2.5} />
                                                </button>
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
