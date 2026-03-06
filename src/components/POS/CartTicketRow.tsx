// CartTicketRow.tsx — Individual line item row for the cart ticket
import { useState, useRef, useEffect } from 'react';
import { Trash2, Minus, Plus, Percent } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import type { CartItem, PromotionResult } from '@/lib/types';

interface CartTicketRowProps {
    index: number;
    item: CartItem;
    promotion: PromotionResult | null;
    onIncrement: () => void;
    onDecrement: () => void;
    onQuantityInput: (qty: number) => void;
    onRemove: () => void;
    onDiscountClick: () => void;
    isAtMaxStock: boolean;
    formatCurrency: (amount: number) => string;
}

export default function CartTicketRow({
    index,
    item,
    promotion,
    onIncrement,
    onDecrement,
    onQuantityInput,
    onRemove,
    onDiscountClick,
    isAtMaxStock,
    formatCurrency,
}: CartTicketRowProps) {
    const { t } = useTranslation();
    const [isEditing, setIsEditing] = useState(false);
    const [editValue, setEditValue] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);

    const unitPrice = item.product.selling_price;
    const lineTotal = unitPrice * item.quantity;
    const manualDiscount = item.manualDiscount
        ? item.manualDiscount.type === 'percentage'
            ? lineTotal * (item.manualDiscount.value / 100)
            : item.manualDiscount.value
        : 0;
    const promoDiscount = promotion?.discountAmount ?? 0;
    const totalDiscount = manualDiscount + promoDiscount;
    const finalTotal = lineTotal - totalDiscount;

    useEffect(() => {
        if (isEditing && inputRef.current) {
            inputRef.current.focus();
            inputRef.current.select();
        }
    }, [isEditing]);

    const handleEditStart = () => {
        setEditValue(String(item.quantity));
        setIsEditing(true);
    };

    const handleEditConfirm = () => {
        const qty = parseInt(editValue, 10);
        if (!isNaN(qty) && qty > 0) {
            onQuantityInput(qty);
        }
        setIsEditing(false);
    };

    const handleEditKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') handleEditConfirm();
        if (e.key === 'Escape') setIsEditing(false);
    };

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, x: -50, height: 0, marginBottom: 0, overflow: 'hidden' }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        >
            <div className="flex items-center px-3 md:px-5 py-3 md:py-4 border-b border-zinc-100 hover:bg-zinc-50/60 transition-colors">
                {/* Article — name + unit price + promo */}
                <div className="flex-1 min-w-0">
                    <div className="text-sm md:text-base font-bold text-zinc-900 truncate">{item.product.name}</div>
                    <div className="flex items-center gap-1.5 md:gap-2 mt-0.5 md:mt-1 flex-wrap">
                        <span className="text-xs md:text-sm text-zinc-400 tabular-nums">
                            {formatCurrency(unitPrice)} x {item.quantity}
                        </span>
                        {totalDiscount > 0 && (
                            <span className="text-xs md:text-sm text-emerald-500 font-semibold tabular-nums">
                                -{formatCurrency(totalDiscount)}
                            </span>
                        )}
                        {promotion && (
                            <span className="text-[9px] md:text-[10px] bg-emerald-50 text-emerald-600 px-1.5 md:px-2 py-0.5 rounded-full font-medium">
                                {promotion.promotionName}
                            </span>
                        )}
                    </div>
                </div>

                {/* QTE — editable quantity */}
                <div className="w-12 md:w-14 flex items-center justify-center shrink-0">
                    {isEditing ? (
                        <input
                            ref={inputRef}
                            type="number"
                            min="1"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onBlur={handleEditConfirm}
                            onKeyDown={handleEditKeyDown}
                            className="w-12 md:w-14 h-8 md:h-10 text-base md:text-lg font-extrabold text-center text-zinc-800 border-2 border-zinc-300 rounded-xl bg-white outline-none tabular-nums focus:border-zinc-500 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                        />
                    ) : (
                        <button
                            onClick={handleEditStart}
                            className="w-12 md:w-14 h-8 md:h-10 text-base md:text-lg font-extrabold text-zinc-900 tabular-nums text-center bg-zinc-100 hover:bg-zinc-200 rounded-xl transition-colors cursor-text"
                            title={t('pos.click_to_edit', 'Click to edit quantity')}
                        >
                            {item.quantity}
                        </button>
                    )}
                </div>

                {/* Total */}
                <div className="w-16 md:w-20 text-right pr-1 md:pr-2 shrink-0">
                    <div className="text-base md:text-lg font-extrabold text-zinc-900 tabular-nums">
                        {formatCurrency(finalTotal)}
                    </div>
                    {totalDiscount > 0 && (
                        <div className="text-[10px] md:text-xs text-zinc-300 line-through tabular-nums">
                            {formatCurrency(lineTotal)}
                        </div>
                    )}
                </div>

                {/* Actions — responsive: icons only on small, full on large */}
                <div className="hidden sm:flex w-32 md:w-44 lg:w-52 xl:w-72 items-center justify-end gap-1.5 md:gap-2 lg:gap-2.5 xl:gap-3.5 shrink-0 pl-2 md:pl-4">
                    <button
                        onClick={onIncrement}
                        disabled={isAtMaxStock}
                        aria-label={t('common.increase', 'Increase')}
                        className="w-8 h-8 md:w-9 md:h-9 xl:w-10 xl:h-10 rounded-lg md:rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center hover:bg-emerald-100 active:scale-90 disabled:opacity-25 disabled:cursor-not-allowed transition-all"
                        title="+"
                    >
                        <Plus size={16} strokeWidth={2.5} className="md:hidden" />
                        <Plus size={20} strokeWidth={2.5} className="hidden md:block" />
                    </button>
                    <button
                        onClick={onDecrement}
                        disabled={item.quantity <= 1}
                        aria-label={t('common.decrease', 'Decrease')}
                        className="w-8 h-8 md:w-9 md:h-9 xl:w-10 xl:h-10 rounded-lg md:rounded-xl bg-zinc-100 text-zinc-600 flex items-center justify-center hover:bg-zinc-200 active:scale-90 disabled:opacity-25 disabled:cursor-not-allowed transition-all"
                        title="-"
                    >
                        <Minus size={16} strokeWidth={2.5} className="md:hidden" />
                        <Minus size={20} strokeWidth={2.5} className="hidden md:block" />
                    </button>
                    <button
                        onClick={onDiscountClick}
                        aria-label={t('pos.discount', 'Remise')}
                        className="w-8 h-8 md:w-9 md:h-9 xl:w-10 xl:h-10 rounded-lg md:rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center hover:bg-amber-100 active:scale-90 transition-all"
                        title={t('pos.discount', 'Remise')}
                    >
                        <Percent size={14} strokeWidth={2} className="md:hidden" />
                        <Percent size={18} strokeWidth={2} className="hidden md:block" />
                    </button>
                    <button
                        onClick={onRemove}
                        aria-label={t('pos.remove', 'Delete')}
                        className="w-8 h-8 md:w-9 md:h-9 xl:w-10 xl:h-10 rounded-lg md:rounded-xl bg-red-50 text-red-500 flex items-center justify-center hover:bg-red-100 active:scale-90 transition-all"
                        title={t('pos.remove', 'Delete')}
                    >
                        <Trash2 size={18} strokeWidth={2} />
                    </button>
                </div>
            </div>
        </motion.div>
    );
}
