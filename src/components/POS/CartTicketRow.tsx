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
            <div className="flex items-center px-4 py-3 md:py-4 border-b border-zinc-100/80 hover:bg-zinc-50/50 transition-colors group">
                {/* Index */}
                <span className="text-xs md:text-sm font-bold text-zinc-300 tabular-nums w-6 shrink-0">{index}</span>

                {/* Article info */}
                <div className="flex-1 min-w-0 ml-2">
                    <div className="text-base md:text-lg font-semibold text-zinc-800 truncate">{item.product.name}</div>
                    <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-sm text-zinc-400 tabular-nums">
                            {formatCurrency(unitPrice)} × {item.quantity}
                        </span>
                        {totalDiscount > 0 && (
                            <span className="text-sm text-emerald-500 font-semibold tabular-nums">
                                −{formatCurrency(totalDiscount)}
                            </span>
                        )}
                        {promotion && (
                            <span className="text-[10px] bg-emerald-500/10 text-emerald-600 px-1.5 py-0.5 rounded font-medium">
                                {promotion.promotionName}
                            </span>
                        )}
                    </div>
                </div>

                {/* Quantity control */}
                <div className="flex items-center gap-1 shrink-0 mx-3">
                    <button
                        onClick={onDecrement}
                        disabled={item.quantity <= 1}
                        className="w-10 h-10 flex items-center justify-center rounded-lg text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700 disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
                    >
                        <Minus size={18} strokeWidth={2.5} />
                    </button>
                    {isEditing ? (
                        <input
                            ref={inputRef}
                            type="number"
                            min="1"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onBlur={handleEditConfirm}
                            onKeyDown={handleEditKeyDown}
                            className="w-14 h-10 text-base font-bold text-center text-zinc-800 border border-zinc-300 rounded-lg bg-white outline-none tabular-nums focus:border-zinc-500 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                        />
                    ) : (
                        <button
                            onClick={handleEditStart}
                            className="w-14 h-10 text-base font-bold text-zinc-800 tabular-nums text-center bg-zinc-100 hover:bg-zinc-200 rounded-lg transition-colors cursor-text"
                            title={t('pos.click_to_edit', 'Click to edit quantity')}
                        >
                            {item.quantity}
                        </button>
                    )}
                    <button
                        onClick={onIncrement}
                        disabled={isAtMaxStock}
                        className="w-10 h-10 flex items-center justify-center rounded-lg text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700 disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
                    >
                        <Plus size={18} strokeWidth={2.5} />
                    </button>
                </div>

                {/* Total */}
                <div className="w-24 text-right shrink-0">
                    <div className="text-base md:text-lg font-bold text-zinc-900 tabular-nums">
                        {formatCurrency(finalTotal)}
                    </div>
                    {totalDiscount > 0 && (
                        <div className="text-xs text-zinc-300 line-through tabular-nums">
                            {formatCurrency(lineTotal)}
                        </div>
                    )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1.5 shrink-0 ml-3">
                    <button
                        onClick={onDiscountClick}
                        className="w-10 h-10 flex items-center justify-center rounded-lg text-amber-500 hover:bg-amber-50 transition-colors"
                        title={t('pos.discount', 'Remise')}
                    >
                        <Percent size={18} strokeWidth={2} />
                    </button>
                    <button
                        onClick={onRemove}
                        className="w-10 h-10 flex items-center justify-center rounded-lg text-red-400 hover:bg-red-50 transition-colors"
                        title={t('pos.remove', 'Delete')}
                    >
                        <Trash2 size={18} strokeWidth={2} />
                    </button>
                </div>
            </div>
        </motion.div>
    );
}
