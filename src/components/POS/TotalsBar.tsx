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
        <div className="border-t-2 border-zinc-200 bg-white px-4 py-3 shrink-0">
            <div className="space-y-1">
                {/* Subtotal */}
                <div className="flex justify-between text-sm">
                    <span className="text-zinc-500">{t('pos.subtotal', 'Subtotal')}</span>
                    <span className="font-semibold text-zinc-700 tabular-nums">{formatCurrency(subtotal)}</span>
                </div>

                {/* VAT */}
                {vatAmount > 0 && (
                    <div className="flex justify-between text-sm">
                        <span className="text-zinc-500">
                            {t('pos.vat', 'VAT')} ({vatPercent}%)
                        </span>
                        <span className="font-semibold text-zinc-700 tabular-nums">{formatCurrency(vatAmount)}</span>
                    </div>
                )}

                {/* Promo savings */}
                {promoSavings > 0 && (
                    <div className="flex justify-between text-sm">
                        <span className="text-emerald-600">{t('pos.promo_savings', 'Promo Savings')}</span>
                        <span className="font-semibold text-emerald-600 tabular-nums">-{formatCurrency(promoSavings)}</span>
                    </div>
                )}

                {/* Manual discount */}
                {manualDiscount > 0 && (
                    <div className="flex justify-between text-sm">
                        <span className="text-amber-600">{t('pos.manual_discount', 'Discount')}</span>
                        <span className="font-semibold text-amber-600 tabular-nums">-{formatCurrency(manualDiscount)}</span>
                    </div>
                )}

                {/* Total discount summary */}
                {totalDiscount > 0 && (
                    <div className="flex justify-between text-xs pt-1 border-t border-dashed border-zinc-200">
                        <span className="text-zinc-400">{t('pos.total_savings', 'Total Savings')}</span>
                        <span className="font-bold text-emerald-600 tabular-nums">-{formatCurrency(totalDiscount)}</span>
                    </div>
                )}

                {/* Grand Total — the hero element */}
                <div className="flex justify-between items-baseline pt-3 border-t-2 border-zinc-900">
                    <span className="text-lg font-bold text-zinc-600 uppercase tracking-wide">
                        {t('pos.grand_total', 'TOTAL')}
                    </span>
                    <span className="text-4xl md:text-5xl xl:text-6xl font-black text-zinc-900 tabular-nums tracking-tight leading-none">
                        {formatCurrency(grandTotal)}
                    </span>
                </div>
            </div>
        </div>
    );
}
