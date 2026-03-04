// CartTicket.tsx — Professional receipt/ticket-styled cart display
import { AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Receipt } from 'lucide-react';
import CartTicketRow from './CartTicketRow';
import type { CartItem, PromotionApplicationResult } from '@/lib/types';

interface CartTicketProps {
    cart: CartItem[];
    ticketNumber: number;
    promotionResult: PromotionApplicationResult | null;
    onQuantityChange: (productId: number, quantity: number) => void;
    onRemove: (productId: number) => void;
    onDiscountClick: (productId: number) => void;
    formatCurrency: (amount: number) => string;
}

export default function CartTicket({
    cart,
    ticketNumber,
    promotionResult,
    onQuantityChange,
    onRemove,
    onDiscountClick,
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
            <div className="flex flex-col items-center justify-center h-full text-zinc-400">
                <div className="text-5xl mb-3">🛒</div>
                <div className="text-sm font-medium">{t('pos.empty_cart', 'Cart is empty')}</div>
                <div className="text-xs mt-1">{t('pos.scan_to_add', 'Scan or search to add products')}</div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full">
            {/* Ticket header */}
            <div className="flex items-center justify-between px-3 py-2 border-b border-dashed border-zinc-300">
                <div className="flex items-center gap-2">
                    <Receipt size={14} className="text-zinc-400" />
                    <span className="text-xs font-bold text-zinc-500">
                        {t('pos.ticket', 'Ticket')} n° {formattedTicket}
                    </span>
                </div>
                <span className="text-xs font-medium text-zinc-400">
                    {cart.length} {cart.length === 1 ? t('pos.item', 'item') : t('pos.items', 'items')}
                </span>
            </div>

            {/* Column labels */}
            <div className="flex items-center gap-1 px-2 py-1.5 text-[10px] font-bold text-zinc-400 uppercase tracking-wider border-b border-zinc-200 bg-zinc-50/50 shrink-0">
                <span className="w-6">#</span>
                <span className="flex-1">{t('pos.item', 'Item')}</span>
                <span className="w-20 text-center">{t('pos.qty', 'Qty')}</span>
                <span className="w-20 text-right">{t('pos.total', 'Total')}</span>
                <span className="w-14" />
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
                            formatCurrency={formatCurrency}
                        />
                    ))}
                </AnimatePresence>
            </div>
        </div>
    );
}
