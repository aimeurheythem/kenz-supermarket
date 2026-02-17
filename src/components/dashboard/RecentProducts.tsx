import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { BadgeCent, ChevronLeft, ChevronRight, ExternalLink, ShoppingBag } from 'lucide-react';
import { useSaleStore } from '@/stores/useSaleStore';
import { useAuthStore } from '@/stores/useAuthStore';
import { formatCurrency } from '@/lib/utils';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

// Precise constants to ensure cards land in the EXACT same place
const CARD_W = 340;
const GAP = 18;
const MARGIN = 15;
const VIEW_OFFSET = CARD_W + GAP;

interface SaleCardProps {
    id: string | number;
    timestamp: string;
    amount: string;
    currency: string;
    itemsCount: number;
    cashierName: string;
    paymentMethod?: string;
}

const SaleCard = ({ id, timestamp, amount, currency, itemsCount, cashierName, paymentMethod }: SaleCardProps) => {
    const { t } = useTranslation();

    return (
        <motion.div
            className="flex-none w-[340px] p-8 rounded-[3rem] bg-gray-100 relative overflow-hidden group"
        >
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                    <span className="text-[12px] uppercase tracking-widest text-black/80">
                        Sale #{id}
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

            {/* Payment Method Badge */}
            {paymentMethod && (
                <div className="absolute top-8 ltr:right-24 rtl:left-24">
                    <span className="text-[9px] uppercase tracking-wider px-2 py-1 rounded-full bg-black/5 text-black/40">
                        {paymentMethod}
                    </span>
                </div>
            )}

            {/* Background Decorative Icon */}
            <div className="absolute top-1/2 -translate-y-1/2 ltr:-right-0 rtl:-left-0 opacity-10 pointer-events-none transition-transform duration-500">
                <BadgeCent size={90} className="text-black" />
            </div>

            <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-black/50 blur-[60px] pointer-events-none" />
        </motion.div>
    );
};

// Empty state when no sales exist
const EmptyState = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();

    return (
        <div className="flex items-center justify-center w-full py-16">
            <div className="text-center">
                <div className="w-16 h-16 bg-black/5 rounded-full flex items-center justify-center mx-auto mb-4">
                    <ShoppingBag size={28} className="text-black/30" />
                </div>
                <h3 className="text-lg font-semibold text-black/60 mb-1">
                    {t('dashboard.recent_sales.no_sales_title', 'No Sales Yet')}
                </h3>
                <p className="text-sm text-black/40 mb-4">
                    {t('dashboard.recent_sales.no_sales_message', 'Complete your first sale in the POS to see it here.')}
                </p>
                <button
                    onClick={() => navigate('/pos')}
                    className="px-6 py-2 bg-black text-white text-xs uppercase tracking-widest rounded-full hover:bg-zinc-800 transition-colors"
                >
                    {t('dashboard.shortcuts.pos', 'Open POS')}
                </button>
            </div>
        </div>
    );
};

export default function RecentProducts() {
    const { t, i18n } = useTranslation();
    const { recentSales } = useSaleStore();
    const { user: authUser } = useAuthStore();
    const navigate = useNavigate();
    const [currentIndex, setCurrentIndex] = useState(0);

    const isRtl = i18n.dir() === 'rtl';
    const hasSales = recentSales.length > 0;

    const next = () => {
        if (currentIndex < recentSales.length - 3) {
            setCurrentIndex(prev => prev + 1);
        }
    };

    const prev = () => {
        if (currentIndex > 0) {
            setCurrentIndex(prev => prev - 1);
        }
    };

    const currencyLabel = i18n.language === 'ar' ? 'دج' : 'DZ';

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
                    {hasSales && (
                        <span className="px-2 py-0.5 rounded-full bg-black/5 text-[10px] font-bold text-black uppercase tracking-wider">
                            {recentSales.length}
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    {hasSales && (
                        <>
                            <button
                                onClick={prev}
                                disabled={currentIndex === 0}
                                className="w-10 h-10 flex items-center justify-center text-zinc-400 hover:text-black hover:border-zinc-300 transition-all active:scale-90 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer rtl:rotate-180"
                            >
                                <ChevronLeft size={20} />
                            </button>
                            <button
                                onClick={next}
                                disabled={currentIndex >= recentSales.length - 3}
                                className="w-10 h-10 flex items-center justify-center text-zinc-400 hover:text-black hover:border-zinc-300 transition-all active:scale-90 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer rtl:rotate-180"
                            >
                                <ChevronRight size={20} />
                            </button>
                        </>
                    )}
                    <motion.button
                        initial="initial"
                        whileHover="hover"
                        variants={{
                            initial: { backgroundColor: "#000000" },
                            hover: { backgroundColor: "#18181b" }
                        }}
                        onClick={() => navigate('/transactions')}
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
                {hasSales ? (
                    <>
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
                                {recentSales.map((sale) => (
                                    <SaleCard
                                        key={sale.id}
                                        id={sale.id}
                                        timestamp={new Date(sale.sale_date || sale.created_at).toLocaleTimeString(i18n.language, { hour: '2-digit', minute: '2-digit' })}
                                        amount={formatCurrency(sale.total, false)}
                                        currency={currencyLabel}
                                        itemsCount={(sale as any).item_count ?? 0}
                                        cashierName={sale.user_name || authUser?.full_name || 'Admin'}
                                        paymentMethod={sale.payment_method}
                                    />
                                ))}
                            </motion.div>
                        </div>
                    </>
                ) : (
                    <EmptyState />
                )}
            </div>
        </div>
    );
}
