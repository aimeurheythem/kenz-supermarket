// DiscountDialog.tsx — Apply line/cart discount (percentage or fixed)
import { useState, useEffect } from 'react';
import { Tag, Percent, DollarSign } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';
import { useTranslation } from 'react-i18next';
import type { ManualDiscount } from '@/lib/types';

interface DiscountDialogProps {
    isOpen: boolean;
    onClose: () => void;
    scope: 'line' | 'cart';
    currentDiscount: ManualDiscount | null;
    maxAmount: number;
    onApply: (discount: ManualDiscount) => void;
    onClear: () => void;
}

export default function DiscountDialog({
    isOpen,
    onClose,
    scope,
    currentDiscount,
    maxAmount,
    onApply,
    onClear,
}: DiscountDialogProps) {
    const { t } = useTranslation();
    const [type, setType] = useState<'percentage' | 'fixed'>(currentDiscount?.type ?? 'percentage');
    const [value, setValue] = useState(currentDiscount?.value.toString() ?? '');
    const [error, setError] = useState('');

    useEffect(() => {
        if (isOpen) {
            setType(currentDiscount?.type ?? 'percentage');
            setValue(currentDiscount?.value.toString() ?? '');
            setError('');
        }
    }, [isOpen, currentDiscount]);

    const handleApply = () => {
        const numValue = parseFloat(value);
        if (isNaN(numValue) || numValue <= 0) {
            setError(t('pos.discount_invalid', 'Enter a valid amount'));
            return;
        }
        if (type === 'percentage' && numValue > 100) {
            setError(t('pos.discount_max_percent', 'Percentage cannot exceed 100%'));
            return;
        }
        if (type === 'fixed' && numValue > maxAmount) {
            setError(t('pos.discount_max_amount', 'Discount cannot exceed the total'));
            return;
        }
        onApply({
            type, value: numValue,
            computedAmount: 0
        });
        onClose();
    };

    const handleClear = () => {
        onClear();
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-sm">
                <DialogHeader>
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-amber-100 rounded-lg">
                            <Tag size={18} className="text-amber-600" />
                        </div>
                        <div>
                            <DialogTitle className="text-base">
                                {scope === 'line'
                                    ? t('pos.line_discount', 'Line Discount')
                                    : t('pos.cart_discount', 'Cart Discount')}
                            </DialogTitle>
                            <DialogDescription className="text-xs">
                                {scope === 'line'
                                    ? t('pos.apply_to_item', 'Apply discount to this item')
                                    : t('pos.apply_to_cart', 'Apply discount to entire cart')}
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <div className="space-y-4">
                    {/* Type toggle */}
                    <div className="grid grid-cols-2 gap-2">
                        <button
                            onClick={() => { setType('percentage'); setError(''); }}
                            className={`flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-sm transition-all ${
                                type === 'percentage'
                                    ? 'bg-amber-500 text-white'
                                    : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                            }`}
                        >
                            <Percent size={14} />
                            {t('pos.percentage', 'Percentage')}
                        </button>
                        <button
                            onClick={() => { setType('fixed'); setError(''); }}
                            className={`flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-sm transition-all ${
                                type === 'fixed'
                                    ? 'bg-amber-500 text-white'
                                    : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                            }`}
                        >
                            <DollarSign size={14} />
                            {t('pos.fixed_amount', 'Fixed')}
                        </button>
                    </div>

                    {/* Amount input */}
                    <div className="relative">
                        <input
                            type="number"
                            step="0.01"
                            min="0"
                            max={type === 'percentage' ? 100 : maxAmount}
                            value={value}
                            onChange={(e) => { setValue(e.target.value); setError(''); }}
                            placeholder={type === 'percentage' ? '10' : '5.00'}
                            className="w-full px-4 py-3 text-2xl font-black text-center text-zinc-900 bg-zinc-50 border-2 border-zinc-200 rounded-xl focus:outline-none focus:border-amber-400 transition-colors tabular-nums [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                            autoFocus
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 font-bold">
                            {type === 'percentage' ? '%' : ''}
                        </span>
                    </div>

                    {/* Error */}
                    {error && (
                        <div className="text-sm text-red-600 text-center font-medium">{error}</div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2">
                        {currentDiscount && (
                            <button
                                onClick={handleClear}
                                className="px-4 py-2.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl font-bold text-sm transition-all"
                            >
                                {t('pos.clear_discount', 'Clear')}
                            </button>
                        )}
                        <button
                            onClick={onClose}
                            className="flex-1 py-2.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-xl font-bold text-sm transition-all"
                        >
                            {t('common.cancel', 'Cancel')}
                        </button>
                        <button
                            onClick={handleApply}
                            className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold text-sm transition-all"
                        >
                            {t('pos.apply', 'Apply')}
                        </button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
