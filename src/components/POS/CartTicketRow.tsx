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
    isSelected: boolean;
    onSelect: () => void;
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
    isSelected,
    onSelect,
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
            onClick={onSelect}
            className={`cursor-pointer transition-all ${isSelected ? 'bg-emerald-50/30' : ''}`}
        >
            <div className={`flex items-stretch pl-4 pr-0 border-b transition-colors group min-h-[50px] ${isSelected ? 'border-emerald-200/50 bg-emerald-50/50' : 'border-zinc-100/80 hover:bg-zinc-50/50'}`}>
                {/* Left: Index + Article info */}
                <div className="flex-1 min-w-0 flex flex-col justify-center py-2">
                    <div className="flex items-baseline gap-2">
                        <span className="text-xs font-bold text-zinc-300 tabular-nums shrink-0">{index}</span>
                        <span className="text-base font-semibold text-zinc-800 truncate">{item.product.name}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1 ml-5">
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

                {/* Right-Center: Total Price (Moved here and made BIGGER) */}
                <div className="w-28 md:w-36 flex flex-col justify-center text-right shrink-0 mx-4">
                    <div className="text-xl md:text-2xl font-black text-zinc-900 tabular-nums tracking-tighter">
                        {formatCurrency(finalTotal)}
                    </div>
                    {totalDiscount > 0 && (
                        <div className="text-xs text-zinc-400 line-through tabular-nums">
                            {formatCurrency(lineTotal)}
                        </div>
                    )}
                </div>

                {/* Right: Quantity control & Actions (Combined into a seamless, full-height block) */}
                <div className="flex items-stretch shrink-0 self-stretch ml-auto">
                    {/* Quantity section */}
                    <div className="flex items-stretch border-l border-zinc-200/50">
                        <button
                            onClick={onDecrement}
                            disabled={item.quantity <= 1}
                            className="w-11 flex items-center justify-center bg-zinc-800 text-white hover:bg-zinc-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all rounded-none border-r border-white/10"
                        >
                            <Minus size={20} strokeWidth={3} />
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
                                className="w-14 h-full text-lg font-black text-center text-zinc-900 bg-white outline-none tabular-nums focus:bg-zinc-50 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none border-r border-zinc-200/50"
                            />
                        ) : (
                            <button
                                onClick={handleEditStart}
                                className="w-14 flex items-center justify-center text-lg font-black text-zinc-900 tabular-nums bg-white hover:bg-zinc-50 transition-colors cursor-text border-r border-zinc-200/50"
                                title={t('pos.click_to_edit', 'Click to edit quantity')}
                            >
                                {item.quantity}
                            </button>
                        )}
                        <button
                            onClick={onIncrement}
                            disabled={isAtMaxStock}
                            className="w-11 flex items-center justify-center bg-zinc-800 text-white hover:bg-zinc-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all rounded-none border-r border-white/10"
                        >
                            <Plus size={20} strokeWidth={3} />
                        </button>
                    </div>

                    {/* Actions section (Discount, Remove) */}
                    <button
                        onClick={onDiscountClick}
                        className="w-14 flex items-center justify-center bg-zinc-800 text-white hover:bg-zinc-700 transition-colors rounded-none border-r border-white/10"
                        title={t('pos.discount', 'Remise')}
                    >
                        <Percent size={20} strokeWidth={2.5} />
                    </button>
                    <button
                        onClick={onRemove}
                        className="w-14 flex items-center justify-center bg-zinc-800 text-white hover:bg-zinc-700 transition-colors rounded-none"
                        title={t('pos.remove', 'Delete')}
                    >
                        <Trash2 size={20} strokeWidth={2.5} />
                    </button>
                </div>
            </div>
        </motion.div>
    );
}
