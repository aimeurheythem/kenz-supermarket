import { Banknote, Smartphone, CreditCard, Wallet } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';

export interface PaymentMethodGridProps {
    selected: 'cash' | 'card' | 'mobile' | 'credit';
    onSelect: (method: 'cash' | 'card' | 'mobile' | 'credit') => void;
}

const METHODS = [
    { value: 'cash' as const, icon: Banknote, labelKey: 'pos.cart.pay_cash' },
    { value: 'mobile' as const, icon: Smartphone, labelKey: 'pos.cart.pay_mobile' },
    { value: 'card' as const, icon: CreditCard, labelKey: 'pos.cart.pay_card' },
    { value: 'credit' as const, icon: Wallet, labelKey: 'pos.cart.pay_credit' },
];

export default function PaymentMethodGrid({ selected, onSelect }: PaymentMethodGridProps) {
    const { t } = useTranslation();

    return (
        <div className="grid grid-cols-2 gap-2">
            {METHODS.map(({ value, icon: Icon, labelKey }) => {
                const isSelected = selected === value;
                return (
                    <button
                        key={value}
                        type="button"
                        onClick={() => onSelect(value)}
                        className={cn(
                            'flex items-center justify-center gap-2 py-2.5 px-3 rounded-2xl text-xs font-semibold uppercase tracking-wider transition-all duration-150 active:scale-[0.97]',
                            isSelected
                                ? 'bg-zinc-900 text-white shadow-sm'
                                : 'bg-zinc-50 border border-zinc-100 text-zinc-400 hover:border-zinc-200 hover:text-zinc-600',
                        )}
                    >
                        <Icon size={15} strokeWidth={1.5} />
                        <span>{t(labelKey)}</span>
                    </button>
                );
            })}
        </div>
    );
}
