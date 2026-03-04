// CartTicketRow.tsx — Individual line item row for the cart ticket
import { useState, useRef, useEffect } from 'react';
import { X, Minus, Plus, Tag } from 'lucide-react';
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
            className="group"
        >
            <div className="flex items-start gap-1 px-2 py-2 rounded-lg hover:bg-zinc-50 transition-colors">
                {/* Line number */}
                <span className="w-6 text-xs font-bold text-zinc-300 pt-0.5 shrink-0">
                    {String(index).padStart(2, '0')}
                </span>

                {/* Product info */}
                <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-zinc-800 truncate">{item.product.name}</div>
                    <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-zinc-400 tabular-nums">
                            {formatCurrency(unitPrice)}
                        </span>
                        {totalDiscount > 0 && (
                            <span className="text-xs text-emerald-600 font-medium tabular-nums">
                                -{formatCurrency(totalDiscount)}
                            </span>
                        )}
                        {promotion && (
                            <span className="text-[9px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded font-bold">
                                {promotion.promotionName}
                            </span>
                        )}
                    </div>
                </div>

                {/* Quantity controls */}
                <div className="w-20 flex items-center justify-center gap-0.5 shrink-0">
                    <button
                        onClick={onDecrement}
                        disabled={item.quantity <= 1}
                        aria-label={t('common.decrease', 'Decrease')}
                        className="w-6 h-6 rounded bg-zinc-100 text-zinc-600 flex items-center justify-center hover:bg-zinc-200 active:scale-90 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                    >
                        <Minus size={12} />
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
                            className="w-8 h-6 text-sm font-bold text-center text-zinc-800 border border-blue-400 rounded bg-blue-50 outline-none tabular-nums [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                        />
                    ) : (
                        <button
                            onClick={handleEditStart}
                            className="w-8 h-6 text-sm font-bold text-zinc-800 tabular-nums text-center hover:bg-blue-50 hover:text-blue-600 rounded transition-colors cursor-text"
                            title={t('pos.click_to_edit', 'Click to edit quantity')}
                        >
                            {item.quantity}
                        </button>
                    )}
                    <button
                        onClick={onIncrement}
                        disabled={isAtMaxStock}
                        aria-label={t('common.increase', 'Increase')}
                        className="w-6 h-6 rounded bg-zinc-100 text-zinc-600 flex items-center justify-center hover:bg-zinc-200 active:scale-90 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                    >
                        <Plus size={12} />
                    </button>
                </div>

                {/* Line total */}
                <div className="w-20 text-right shrink-0 pt-0.5">
                    <div className="text-sm font-bold text-zinc-800 tabular-nums">
                        {formatCurrency(finalTotal)}
                    </div>
                    {totalDiscount > 0 && (
                        <div className="text-[10px] text-zinc-400 line-through tabular-nums">
                            {formatCurrency(lineTotal)}
                        </div>
                    )}
                </div>

                {/* Actions */}
                <div className="w-14 flex items-center justify-end gap-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                        onClick={onDiscountClick}
                        className="w-6 h-6 rounded flex items-center justify-center text-zinc-400 hover:text-amber-500 hover:bg-amber-50 transition-all"
                        title={t('pos.discount', 'Discount')}
                        aria-label={t('pos.discount', 'Discount')}
                    >
                        <Tag size={12} />
                    </button>
                    <button
                        onClick={onRemove}
                        className="w-6 h-6 rounded flex items-center justify-center text-zinc-400 hover:text-red-500 hover:bg-red-50 transition-all"
                        title={t('pos.remove', 'Remove')}
                        aria-label={t('pos.remove', 'Remove')}
                    >
                        <X size={14} />
                    </button>
                </div>
            </div>
        </motion.div>
    );
}
