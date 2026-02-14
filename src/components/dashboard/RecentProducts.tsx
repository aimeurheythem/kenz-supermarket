import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { BadgeCent, ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react';
import { useSaleStore } from '@/stores/useSaleStore';
import { useAuthStore } from '@/stores/useAuthStore';
import { formatCurrency } from '@/lib/utils';
import { motion } from 'framer-motion';

// Precise constants to ensure cards land in the EXACT same place
const CARD_W = 340;
const GAP = 18; // Reduced space between cards
const MARGIN = 15; // Small margin on the start
const VIEW_OFFSET = CARD_W + GAP;

interface SaleCardProps {
    id: string | number;
    timestamp: string;
    amount: string;
    currency: string;
    itemsCount: number;
    cashierName: string;
}

const SaleCard = ({ id, timestamp, amount, currency, itemsCount, cashierName }: SaleCardProps) => {
    const { t } = useTranslation();

    return (
        <motion.div
            className="flex-none w-[340px] p-8 rounded-[3rem] bg-gray-100 relative overflow-hidden group"
        >
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                    <span className="text-[12px] uppercase tracking-widest text-black/80">
                        {['Sale', 'ID'].includes(String(id).split(' ')[0]) ? id : `Sale #${id}`}
                    </span>
                </div>
                <span className="text-[10px] text-black/40 uppercase">
                    {timestamp}
                </span>
            </div>

            <div className="mb-8">
                <p className="text-[10px] text-black uppercase tracking-[0.2em] mb-2">
                    {t('dashboard.recent_sales.total_amount')}
                </p>
                <div className="flex items-baseline gap-2">
                    <span className="text-4xl text-black/90 tracking-tighter">
                        {amount}
                    </span>
                    <span className="text-xs text-emerald-500 uppercase">
                        {currency}
                    </span>
                </div>
            </div>

            <div className="flex items-center justify-between pt-6 border-t border-white/10">
                <div className="flex flex-col">
                    <span className="text-[9px] text-black uppercase tracking-widest mb-1">
                        {t('dashboard.recent_sales.products')}
                    </span>
                    <span className="text-sm text-black/60">
                        {itemsCount} {t('dashboard.recent_sales.items')}
                    </span>
                </div>
                <div className="flex flex-col items-end text-right">
                    <span className="text-[9px] text-black uppercase tracking-widest mb-1">
                        {t('dashboard.recent_sales.cashier')}
                    </span>
                    <span className="text-sm capitalize text-black/60">
                        {cashierName}
                    </span>
                </div>
            </div>

            {/* Background Decorative Icon */}
            <div className="absolute top-1/2 -translate-y-1/2 ltr:-right-0 rtl:-left-0 opacity-10 pointer-events-none transition-transform duration-500">
                <BadgeCent size={90} className="text-black" />
            </div>

            <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-black/50 blur-[60px] pointer-events-none" />
        </motion.div>
    );
};

export default function RecentProducts() {
    const { t, i18n } = useTranslation();
    const { recentSales } = useSaleStore();
    const { user: authUser } = useAuthStore();
    const [currentIndex, setCurrentIndex] = useState(0);

    const isRtl = i18n.dir() === 'rtl';
    const displayCount = recentSales.length > 0 ? recentSales.length : 5;

    const next = () => {
        if (currentIndex < displayCount - 3) {
            setCurrentIndex(prev => prev + 1);
        }
    };

    const prev = () => {
        if (currentIndex > 0) {
            setCurrentIndex(prev => prev - 1);
        }
    };

    const currencyLabel = i18n.language === 'ar' ? 'دج' : 'DZD';

    return (
        <div className="w-full">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <h2
                        className="text-2xl text-black uppercase tracking-tight"
                        style={{ fontFamily: isRtl ? '"Cairo", sans-serif' : 'inherit' }}
                    >
                        {t('dashboard.recent_sales.title')}
                    </h2>
                    <span className="px-2 py-0.5 rounded-full bg-black/5 text-[10px] font-bold text-black uppercase tracking-wider">
                        {displayCount}
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={prev}
                        disabled={currentIndex === 0}
                        className="w-10 h-10 flex items-center justify-center text-zinc-400 hover:text-black hover:border-zinc-300 transition-all active:scale-90 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer rtl:rotate-180"
                    >
                        <ChevronLeft size={20} />
                    </button>
                    <button
                        onClick={next}
                        disabled={currentIndex >= displayCount - 3}
                        className="w-10 h-10 flex items-center justify-center text-zinc-400 hover:text-black hover:border-zinc-300 transition-all active:scale-90 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer rtl:rotate-180"
                    >
                        <ChevronRight size={20} />
                    </button>
                    <motion.button
                        initial="initial"
                        whileHover="hover"
                        variants={{
                            initial: { backgroundColor: "#000000" },
                            hover: { backgroundColor: "#18181b" }
                        }}
                        className="ms-2 px-6 py-2 rounded-full text-white text-xs uppercase tracking-widest transition-all active:scale-95 flex items-center gap-0 hover:gap-2 cursor-pointer group/viewall"
                    >
                        <span className="text-white">{t('dashboard.recent_sales.view_all')}</span>
                        <motion.div
                            variants={{
                                initial: { width: 0, opacity: 0, marginInlineStart: 0 },
                                hover: { width: 'auto', opacity: 1, marginInlineStart: 8 }
                            }}
                            className="overflow-hidden flex items-center text-white"
                            transition={{ duration: 0.3, ease: "easeOut" }}
                        >
                            <ExternalLink size={14} className="min-w-[14px] text-white" />
                        </motion.div>
                    </motion.button>
                </div>
            </div>

            <div className="relative">
                {/* Elegant Edge Fade */}
                <div className="absolute end-0 top-0 bottom-0 w-32 bg-gradient-to-l rtl:bg-gradient-to-r from-white to-transparent z-10 pointer-events-none" />

                <div className="overflow-hidden">
                    <motion.div
                        className="flex pb-8"
                        style={{ gap: GAP, paddingInlineStart: MARGIN, paddingInlineEnd: MARGIN }}
                        animate={{ x: (isRtl ? 1 : -1) * (currentIndex * VIEW_OFFSET) }}
                        transition={{
                            type: "spring",
                            stiffness: 260,
                            damping: 24,
                            mass: 0.8
                        }}
                    >
                        {recentSales.length > 0 ? recentSales.map((sale) => (
                            <SaleCard
                                key={sale.id}
                                id={String(sale.id).slice(-4)}
                                timestamp={new Date(sale.sale_date || sale.created_at).toLocaleTimeString(i18n.language, { hour: '2-digit', minute: '2-digit' })}
                                amount={formatCurrency(sale.total).replace('DZD', '').replace('دج', '').trim()}
                                currency={currencyLabel}
                                itemsCount={12} // Placeholder logic can be improved later
                                cashierName={sale.user_name || authUser?.full_name || 'System Admin'}
                            />
                        )) : (
                            <>
                                {[1, 2, 3, 4, 5].map((idx) => (
                                    <SaleCard
                                        key={`example-${idx}`}
                                        id={`ID #${1000 + idx}`}
                                        timestamp="19:24"
                                        amount={(idx * 12500).toLocaleString(i18n.language)}
                                        currency={currencyLabel}
                                        itemsCount={15}
                                        cashierName="Rachid"
                                    />
                                ))}
                            </>
                        )}
                    </motion.div>
                </div>
            </div>
        </div>
    );
}
