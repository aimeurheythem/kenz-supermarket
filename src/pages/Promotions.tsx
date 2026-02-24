import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Tag, CheckCircle2, XCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { usePromotionStore } from '@/stores/usePromotionStore';
import PromotionList from '@/components/promotions/PromotionList';
import { usePageTitle } from '@/hooks/usePageTitle';
import type { Promotion } from '@/lib/types';

// Lazy-loaded modal components (imported dynamically to keep bundle lean)
import PromotionFormModal from '@/components/promotions/PromotionFormModal';
import PromotionDetailsModal from '@/components/promotions/PromotionDetailsModal';
import PromotionDeleteConfirm from '@/components/promotions/PromotionDeleteConfirm';

export default function Promotions() {
    const { t } = useTranslation();
    usePageTitle(t('sidebar.promotions'));

    const { promotions, isLoading, loadPromotions, deletePromotion, getPromotionById } = usePromotionStore();

    // Modal state
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [selectedPromotion, setSelectedPromotion] = useState<Promotion | null>(null);
    const [editingPromotion, setEditingPromotion] = useState<Promotion | null>(null);

    // Filter state
    const [searchTerm, setSearchTerm] = useState('');
    const [typeFilter, setTypeFilter] = useState<string>('all');
    const [statusFilter, setStatusFilter] = useState<string>('all');

    useEffect(() => {
        loadPromotions();
    }, [loadPromotions]);

    const filteredPromotions = useMemo(() => {
        return promotions.filter((p) => {
            const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesType = typeFilter === 'all' || p.type === typeFilter;
            const matchesStatus = statusFilter === 'all' || (p.effective_status ?? p.status) === statusFilter;
            return matchesSearch && matchesType && matchesStatus;
        });
    }, [promotions, searchTerm, typeFilter, statusFilter]);

    // Stats
    const today = new Date().toISOString().split('T')[0];
    const totalCount = promotions.length;
    const activeCount = promotions.filter(
        (p) => p.status === 'active' && p.start_date <= today && p.end_date >= today
    ).length;
    const expiredCount = promotions.filter((p) => p.end_date < today).length;

    const handleAddPromotion = () => {
        setEditingPromotion(null);
        setIsFormOpen(true);
    };

    const handleEdit = (promotion: Promotion) => {
        setEditingPromotion(promotion);
        setIsFormOpen(true);
    };

    const handleView = async (promotion: Promotion) => {
        // Fetch full promotion with product data before showing details
        const full = await getPromotionById(promotion.id);
        setSelectedPromotion(full ?? promotion);
        setIsDetailsOpen(true);
    };

    const handleDeleteRequest = (promotion: Promotion) => {
        setSelectedPromotion(promotion);
        setIsDeleteOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!selectedPromotion) return;
        await deletePromotion(selectedPromotion.id);
        setIsDeleteOpen(false);
        setSelectedPromotion(null);
    };

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
                            {t('promotions.subtitle')}
                        </span>
                        <h2 className="text-4xl font-black text-black tracking-tighter uppercase">
                            {t('promotions.title')}
                        </h2>
                    </div>
                    <button
                        onClick={handleAddPromotion}
                        className="flex items-center gap-2 px-5 py-3 bg-yellow-400 hover:bg-yellow-300 text-black rounded-[3rem] font-black uppercase tracking-widest text-xs transition-all"
                    >
                        <Plus size={18} strokeWidth={3} />
                        <span>{t('promotions.add_promotion')}</span>
                    </button>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="relative overflow-hidden p-6 bg-gray-100 rounded-[3rem]"
                    >
                        <div className="relative z-10 flex items-center justify-between mb-4">
                            <div className="p-3">
                                <Tag size={20} className="text-black" />
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-widest text-black">
                                {t('promotions.stat_total')}
                            </span>
                        </div>
                        <div className="relative z-10 flex items-baseline gap-2">
                            <span className="text-3xl font-black text-black tracking-tighter">{totalCount}</span>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.05 }}
                        className="relative overflow-hidden p-6 bg-black rounded-[3rem]"
                    >
                        <div className="relative z-10 flex items-center justify-between mb-4">
                            <div className="p-3">
                                <CheckCircle2 size={20} className="text-yellow-400" />
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-widest text-yellow-400">
                                {t('promotions.stat_active')}
                            </span>
                        </div>
                        <div className="relative z-10 flex items-baseline gap-2">
                            <span className="text-3xl font-black text-white tracking-tighter">{activeCount}</span>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="relative overflow-hidden p-6 bg-gray-100 rounded-[3rem]"
                    >
                        <div className="relative z-10 flex items-center justify-between mb-4">
                            <div className="p-3">
                                <XCircle size={20} className="text-rose-500" />
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-widest text-black">
                                {t('promotions.stat_expired')}
                            </span>
                        </div>
                        <div className="relative z-10 flex items-baseline gap-2">
                            <span className="text-3xl font-black text-black tracking-tighter">{expiredCount}</span>
                        </div>
                    </motion.div>
                </div>
            </div>

            {/* Table Section */}
            <div className="relative z-10 flex flex-col gap-4 flex-1">
                {/* Search + Filters */}
                <div className="flex flex-wrap gap-3 items-center">
                    <div className="relative flex-1 min-w-[200px]">
                        <input
                            type="text"
                            placeholder={t('promotions.search_placeholder')}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full h-12 px-5 rounded-[3rem] bg-white border-2 border-zinc-200 text-sm font-semibold placeholder:text-zinc-400 focus:outline-none focus:border-yellow-400 transition-colors"
                        />
                    </div>

                    <select
                        value={typeFilter}
                        onChange={(e) => setTypeFilter(e.target.value)}
                        className="h-12 px-5 rounded-[3rem] bg-white border-2 border-zinc-200 text-sm font-semibold text-zinc-700 focus:outline-none focus:border-yellow-400 transition-colors cursor-pointer"
                    >
                        <option value="all">{t('promotions.filter_type')}</option>
                        <option value="price_discount">{t('promotions.type.price_discount')}</option>
                        <option value="quantity_discount">{t('promotions.type.quantity_discount')}</option>
                        <option value="pack_discount">{t('promotions.type.pack_discount')}</option>
                    </select>

                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="h-12 px-5 rounded-[3rem] bg-white border-2 border-zinc-200 text-sm font-semibold text-zinc-700 focus:outline-none focus:border-yellow-400 transition-colors cursor-pointer"
                    >
                        <option value="all">{t('promotions.filter_status')}</option>
                        <option value="active">{t('promotions.status.active')}</option>
                        <option value="inactive">{t('promotions.status.inactive')}</option>
                        <option value="expired">{t('promotions.status.expired')}</option>
                        <option value="scheduled">{t('promotions.status.scheduled')}</option>
                    </select>
                </div>

                <PromotionList
                    promotions={filteredPromotions}
                    isLoading={isLoading}
                    onView={handleView}
                    onEdit={handleEdit}
                    onDelete={handleDeleteRequest}
                />
            </div>

            {/* Modals */}
            {isFormOpen && (
                <PromotionFormModal
                    isOpen={isFormOpen}
                    onClose={() => { setIsFormOpen(false); setEditingPromotion(null); }}
                    promotion={editingPromotion ?? undefined}
                />
            )}

            {isDetailsOpen && selectedPromotion && (
                <PromotionDetailsModal
                    isOpen={isDetailsOpen}
                    onClose={() => { setIsDetailsOpen(false); setSelectedPromotion(null); }}
                    promotion={selectedPromotion}
                />
            )}

            {isDeleteOpen && selectedPromotion && (
                <PromotionDeleteConfirm
                    isOpen={isDeleteOpen}
                    onClose={() => { setIsDeleteOpen(false); setSelectedPromotion(null); }}
                    onConfirm={handleConfirmDelete}
                    promotionName={selectedPromotion.name}
                />
            )}
        </div>
    );
}
