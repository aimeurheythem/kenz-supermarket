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
        <div className="border-t border-zinc-100 bg-white px-6 py-5 shrink-0">
            <div className="space-y-2">
                {/* Subtotal */}
                <div className="flex justify-between text-sm">
                    <span className="text-zinc-400 font-medium">{t('pos.subtotal', 'Subtotal')}</span>
                    <span className="font-medium text-zinc-600 tabular-nums">{formatCurrency(subtotal)}</span>
                </div>

                {/* VAT */}
                {vatAmount > 0 && (
                    <div className="flex justify-between text-sm">
                        <span className="text-zinc-400 font-medium">
                            {t('pos.vat', 'VAT')} ({vatPercent}%)
                        </span>
                        <span className="font-medium text-zinc-600 tabular-nums">{formatCurrency(vatAmount)}</span>
                    </div>
                )}

                {/* Promo savings */}
                {promoSavings > 0 && (
                    <div className="flex justify-between text-sm">
                        <span className="text-emerald-500 font-medium">{t('pos.promo_savings', 'Promo Savings')}</span>
                        <span className="font-medium text-emerald-500 tabular-nums">-{formatCurrency(promoSavings)}</span>
                    </div>
                )}

                {/* Manual discount */}
                {manualDiscount > 0 && (
                    <div className="flex justify-between text-sm">
                        <span className="text-amber-500 font-medium">{t('pos.manual_discount', 'Discount')}</span>
                        <span className="font-medium text-amber-500 tabular-nums">-{formatCurrency(manualDiscount)}</span>
                    </div>
                )}

                {/* Total discount summary */}
                {totalDiscount > 0 && (
                    <div className="flex justify-between text-xs pt-2 border-t border-dashed border-zinc-100">
                        <span className="text-zinc-300">{t('pos.total_savings', 'Total Savings')}</span>
                        <span className="font-semibold text-emerald-500 tabular-nums">-{formatCurrency(totalDiscount)}</span>
                    </div>
                )}

                {/* Grand Total — the hero element */}
                <div className="flex justify-between items-end pt-5 mt-2 border-t border-zinc-200">
                    <span className="text-base font-semibold text-zinc-400 uppercase tracking-widest">
                        {t('pos.grand_total', 'TOTAL')}
                    </span>
                    <span className="text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-bold text-zinc-900 tabular-nums tracking-tighter leading-none">
                        {formatCurrency(grandTotal)}
                    </span>
                </div>
            </div>
        </div>
    );
}
