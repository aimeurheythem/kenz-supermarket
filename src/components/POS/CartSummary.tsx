import { useTranslation } from 'react-i18next';

export interface CartSummaryProps {
    subtotal: number;
    savings: number;
    formatCurrency: (amount: number) => string;
}

export default function CartSummary({ subtotal, savings, formatCurrency }: CartSummaryProps) {
    const { t } = useTranslation();

    return (
        <div className="relative">
            {/* Ticket cutout separator */}
            <div className="relative flex items-center">
                {/* Start notch (left in LTR, right in RTL) */}
                <div className="w-5 h-10 -ms-2.5 rounded-e-full bg-zinc-100 shrink-0 z-10" />
                {/* Dashed line */}
                <div className="flex-1 border-t-2 border-dashed border-zinc-200" />
                {/* End notch (right in LTR, left in RTL) */}
                <div className="w-5 h-10 -me-2.5 rounded-s-full bg-zinc-100 shrink-0 z-10" />
            </div>

            <div className="px-4 py-3 space-y-1.5">
            {/* Subtotal */}
            <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                    {t('pos.cart.subtotal')}
                </span>
                <span className="text-sm font-black text-black tabular-nums">
                    {formatCurrency(subtotal)}
                </span>
            </div>

            {/* Savings — only shown when > 0 */}
            {savings > 0 && (
                <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-500 uppercase tracking-wider">
                        {t('pos.cart.promo_savings')}
                    </span>
                    <span className="text-sm font-black text-emerald-600 tabular-nums">
                        −{formatCurrency(savings)}
                    </span>
                </div>
            )}
            </div>
        </div>
    );
}
