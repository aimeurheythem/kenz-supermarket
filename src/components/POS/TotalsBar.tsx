// TotalsBar.tsx — Prominent totals display with oversized grand total
import { useTranslation } from 'react-i18next';

interface TotalsBarProps {
    subtotal: number;
    vatRate: number;
    vatAmount: number;
    promoSavings: number;
    manualDiscount: number;
    grandTotal: number;
    formatCurrency: (amount: number) => string;
}

export default function TotalsBar({
    subtotal,
    vatRate,
    vatAmount,
    promoSavings,
    manualDiscount,
    grandTotal,
    formatCurrency,
}: TotalsBarProps) {
    const { t } = useTranslation();
    const totalDiscount = promoSavings + manualDiscount;
    const vatPercent = Math.round(vatRate * 100);

    return (
        <div className="bg-zinc-50 px-5 py-5 md:py-6 shrink-0">
            {/* Breakdown row */}
            <div className="flex flex-wrap items-center gap-x-6 gap-y-1.5 text-sm tabular-nums mb-4">
                <div className="flex items-center gap-2">
                    <span className="text-zinc-400 font-medium">{t('pos.subtotal', 'Subtotal')}</span>
                    <span className="font-bold text-zinc-700">{formatCurrency(subtotal)}</span>
                </div>

                {vatAmount > 0 && (
                    <div className="flex items-center gap-2">
                        <span className="text-zinc-400 font-medium">{t('pos.vat', 'VAT')} {vatPercent}%</span>
                        <span className="font-bold text-zinc-700">{formatCurrency(vatAmount)}</span>
                    </div>
                )}

                {promoSavings > 0 && (
                    <div className="flex items-center gap-2">
                        <span className="text-emerald-500 font-medium">{t('pos.promo_savings', 'Promo')}</span>
                        <span className="font-bold text-emerald-500">−{formatCurrency(promoSavings)}</span>
                    </div>
                )}

                {manualDiscount > 0 && (
                    <div className="flex items-center gap-2">
                        <span className="text-amber-500 font-medium">{t('pos.manual_discount', 'Discount')}</span>
                        <span className="font-bold text-amber-500">−{formatCurrency(manualDiscount)}</span>
                    </div>
                )}

                {totalDiscount > 0 && (
                    <div className="flex items-center gap-2 ml-auto">
                        <span className="text-zinc-300">{t('pos.total_savings', 'Saved')}</span>
                        <span className="font-extrabold text-emerald-500">−{formatCurrency(totalDiscount)}</span>
                    </div>
                )}
            </div>

            {/* Grand Total */}
            <div className="flex items-end justify-between">
                <span className="text-sm md:text-base font-bold text-zinc-400 uppercase tracking-widest">
                    {t('pos.grand_total', 'TOTAL')}
                </span>
                <span className="text-5xl md:text-6xl lg:text-7xl xl:text-8xl 2xl:text-9xl font-black text-zinc-900 tabular-nums tracking-tighter leading-none">
                    {formatCurrency(grandTotal)}
                </span>
            </div>
        </div>
    );
}
