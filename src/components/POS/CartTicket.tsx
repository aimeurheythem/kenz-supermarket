// CartTicket.tsx — Professional receipt/ticket-styled cart display
import { AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { FileText, ShoppingCart } from 'lucide-react';
import CartTicketRow from './CartTicketRow';
import type { CartItem, PromotionApplicationResult } from '@/lib/types';

interface CartTicketProps {
    cart: CartItem[];
    ticketNumber: number;
    promotionResult: PromotionApplicationResult | null;
    selectedCartProductId: number | null;
    onQuantityChange: (productId: number, quantity: number) => void;
    onRemove: (productId: number) => void;
    onDiscountClick: (productId: number) => void;
    onSelect: (productId: number) => void;
    formatCurrency: (amount: number) => string;
}

export default function CartTicket({
    cart,
    ticketNumber,
    promotionResult,
    selectedCartProductId,
    onQuantityChange,
    onRemove,
    onDiscountClick,
    onSelect,
    formatCurrency,
}: CartTicketProps) {
    const { t } = useTranslation();

    // Build productId → PromotionResult lookup
    const promoMap = new Map(
        (promotionResult?.itemDiscounts ?? []).map((d) => [d.productId, d]),
    );

    const formattedTicket = String(ticketNumber).padStart(3, '0');

    if (cart.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-zinc-300">
                <ShoppingCart size={32} strokeWidth={1} className="mb-3 text-zinc-200" />
                <div className="text-sm font-medium text-zinc-400">{t('pos.empty_cart', 'Cart is empty')}</div>
                <div className="text-xs mt-1 text-zinc-300">{t('pos.scan_to_add', 'Scan or search to add products')}</div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full">
            {/* Ticket header */}
            <div className="flex items-center justify-between px-4 py-2 border-b border-zinc-200/60 bg-zinc-50 shrink-0">
                <div className="flex items-center gap-2">
                    <FileText size={13} strokeWidth={1.5} className="text-zinc-400" />
                    <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
                        #{formattedTicket}
                    </span>
                </div>
                <span className="text-[10px] font-semibold text-zinc-400 tabular-nums">
                    {cart.length} {cart.length === 1 ? t('pos.item', 'item') : t('pos.items', 'items')}
                </span>
            </div>

            {/* Scrollable cart rows */}
            <div className="flex-1 min-h-0 overflow-y-auto">
                <AnimatePresence initial={false}>
                    {cart.map((item, idx) => (
                        <CartTicketRow
                            key={item.product.id}
                            index={idx + 1}
                            item={item}
                            promotion={promoMap.get(item.product.id) ?? null}
                            onIncrement={() => onQuantityChange(item.product.id, item.quantity + 1)}
                            onDecrement={() => onQuantityChange(item.product.id, Math.max(1, item.quantity - 1))}
                            onQuantityInput={(qty) => onQuantityChange(item.product.id, qty)}
                            onRemove={() => onRemove(item.product.id)}
                            onDiscountClick={() => onDiscountClick(item.product.id)}
                            isAtMaxStock={item.quantity >= item.product.stock_quantity}
                            isSelected={item.product.id === selectedCartProductId}
                            onSelect={() => onSelect(item.product.id)}
                            formatCurrency={formatCurrency}
                        />
                    ))}
                </AnimatePresence>
            </div>
        </div>
    );
}
