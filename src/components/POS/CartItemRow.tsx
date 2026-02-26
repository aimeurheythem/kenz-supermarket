import React from 'react';
import { Plus, Minus, Trash2, Tag } from 'lucide-react';
import { motion } from 'framer-motion';
import type { CartItem, PromotionResult } from '@/lib/types';
import { useTranslation } from 'react-i18next';

export interface CartItemRowProps {
    item: CartItem;
    promotion: PromotionResult | null;
    onIncrement: (productId: number) => void;
    onDecrement: (productId: number) => void;
    onRemove: (productId: number) => void;
    isAtMaxStock: boolean;
    formatCurrency: (amount: number) => string;
}

const CartItemRow = React.memo(function CartItemRow({
    item,
    promotion,
    onIncrement,
    onDecrement,
    onRemove,
    isAtMaxStock,
    formatCurrency,
}: CartItemRowProps) {
    const { t } = useTranslation();
    const lineTotal = item.product.selling_price * item.quantity - item.discount;

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="flex items-start gap-2 px-4 py-3 group"
        >
            {/* Product info */}
            <div className="flex-1 min-w-0">
                <p className="text-base font-black text-black truncate leading-tight">
                    {item.product.name}
                </p>
                <p className="text-sm text-zinc-400 font-semibold mt-0.5">
                    {formatCurrency(item.product.selling_price)} × {item.quantity}
                </p>
                {/* Promotion badge */}
                {promotion && (
                    <div className="flex items-center gap-1 mt-1">
                        <Tag size={10} className="text-emerald-500" />
                        <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                            −{formatCurrency(promotion.discountAmount)}
                        </span>
                    </div>
                )}
            </div>

            {/* Quantity controls + line total */}
            <div className="flex flex-col items-end gap-2 shrink-0">
                <span className="text-base font-black text-black tabular-nums">
                    {formatCurrency(lineTotal)}
                </span>
                <div className="flex items-center gap-1.5">
                    {/* Decrement */}
                    <button
                        type="button"
                        onClick={() => onDecrement(item.product.id)}
                        disabled={item.quantity <= 1}
                        className="w-10 h-10 flex items-center justify-center rounded-xl bg-zinc-100 text-zinc-600 hover:bg-zinc-200 transition-colors active:scale-90 disabled:opacity-30 disabled:cursor-not-allowed"
                        aria-label={t('common.decrease')}
                    >
                        <Minus size={16} />
                    </button>

                    {/* Quantity display */}
                    <span className="w-8 text-center text-sm font-black text-black tabular-nums">
                        {item.quantity}
                    </span>

                    {/* Increment */}
                    <button
                        type="button"
                        onClick={() => onIncrement(item.product.id)}
                        disabled={isAtMaxStock}
                        className="w-10 h-10 flex items-center justify-center rounded-xl bg-zinc-100 text-zinc-600 hover:bg-emerald-50 hover:text-emerald-600 transition-colors active:scale-90 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-zinc-100 disabled:hover:text-zinc-500"
                        aria-label={t('common.increase')}
                    >
                        <Plus size={16} />
                    </button>

                    {/* Remove button */}
                    <button
                        type="button"
                        onClick={() => onRemove(item.product.id)}
                        className="w-10 h-10 flex items-center justify-center rounded-xl bg-red-50 text-red-400 hover:bg-red-100 hover:text-red-600 transition-colors active:scale-90"
                        aria-label={t('common.remove')}
                    >
                        <Trash2 size={16} />
                    </button>
                </div>
            </div>
        </motion.div>
    );
});

export default CartItemRow;
