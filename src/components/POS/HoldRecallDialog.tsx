// HoldRecallDialog.tsx — List held transactions with recall/delete actions
import { Clock, ShoppingCart, User, Trash2, RotateCcw } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';
import type { HeldTransaction } from '@/lib/types';

interface HoldRecallDialogProps {
    isOpen: boolean;
    onClose: () => void;
    heldTransactions: HeldTransaction[];
    onRecall: (id: string) => void;
    onDelete: (id: string) => void;
    formatCurrency: (amount: number) => string;
}

export default function HoldRecallDialog({
    isOpen,
    onClose,
    heldTransactions,
    onRecall,
    onDelete,
    formatCurrency,
}: HoldRecallDialogProps) {
    const { t } = useTranslation();

    const calcTotal = (held: HeldTransaction) =>
        held.cart.reduce((sum, item) => sum + item.product.selling_price * item.quantity, 0);

    const formatTime = (iso: string) => {
        const d = new Date(iso);
        return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-md border-0 p-0 bg-white rounded-2xl shadow-2xl overflow-hidden">
                <DialogHeader className="p-5 pb-3 border-b border-zinc-100">
                    <DialogTitle className="text-lg font-bold text-zinc-900 flex items-center gap-2">
                        <RotateCcw size={18} className="text-blue-500" />
                        {t('pos.held_transactions', 'Held Transactions')}
                    </DialogTitle>
                    <DialogDescription className="text-xs text-zinc-400">
                        {t('pos.held_description', 'Select a transaction to recall it to the current cart')}
                    </DialogDescription>
                </DialogHeader>

                <div className="px-5 py-3 max-h-[400px] overflow-y-auto">
                    {heldTransactions.length === 0 ? (
                        <div className="py-12 text-center">
                            <ShoppingCart size={32} className="mx-auto text-zinc-200 mb-3" />
                            <p className="text-sm text-zinc-400 font-medium">
                                {t('pos.no_held', 'No held transactions')}
                            </p>
                        </div>
                    ) : (
                        <AnimatePresence mode="popLayout">
                            {heldTransactions.map((held) => (
                                <motion.div
                                    key={held.id}
                                    layout
                                    initial={{ opacity: 0, y: -8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, x: 60, height: 0, marginBottom: 0 }}
                                    transition={{ duration: 0.2 }}
                                    className="mb-2 last:mb-0 p-3 rounded-xl bg-zinc-50 border border-zinc-100 hover:border-zinc-200 transition-colors"
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex-1 min-w-0">
                                            {/* Customer + ticket number */}
                                            <div className="flex items-center gap-2 mb-1">
                                                <User size={12} className="text-zinc-400 shrink-0" />
                                                <span className="text-sm font-semibold text-zinc-800 truncate">
                                                    {held.customer?.full_name ?? t('pos.walk_in', 'Walk-in Customer')}
                                                </span>
                                                <span className="text-[10px] font-bold text-zinc-400 bg-zinc-200 px-1.5 py-0.5 rounded">
                                                    #{String(held.ticketNumber).padStart(3, '0')}
                                                </span>
                                            </div>

                                            {/* Meta info */}
                                            <div className="flex items-center gap-3 text-[11px] text-zinc-400">
                                                <span className="flex items-center gap-1">
                                                    <Clock size={10} />
                                                    {formatTime(held.heldAt)}
                                                </span>
                                                <span>
                                                    {held.cart.length} {t('pos.items', 'items')}
                                                </span>
                                                <span className="font-bold text-zinc-600">
                                                    {formatCurrency(calcTotal(held))}
                                                </span>
                                            </div>

                                            {/* Item preview (first 3) */}
                                            <div className="mt-1.5 text-[10px] text-zinc-400 truncate">
                                                {held.cart
                                                    .slice(0, 3)
                                                    .map((item) => `${item.quantity}× ${item.product.name}`)
                                                    .join(', ')}
                                                {held.cart.length > 3 && ` +${held.cart.length - 3} more`}
                                            </div>
                                        </div>

                                        {/* Action buttons */}
                                        <div className="flex flex-col gap-1 shrink-0">
                                            <button
                                                onClick={() => onRecall(held.id)}
                                                className="px-3 py-1.5 rounded-lg bg-blue-500 text-white text-xs font-bold hover:bg-blue-600 active:scale-95 transition-all"
                                            >
                                                {t('pos.recall', 'Recall')}
                                            </button>
                                            <button
                                                onClick={() => onDelete(held.id)}
                                                className="px-3 py-1.5 rounded-lg bg-zinc-200 text-zinc-500 text-xs font-medium hover:bg-red-100 hover:text-red-600 active:scale-95 transition-all"
                                            >
                                                <Trash2 size={12} className="inline mr-1" />
                                                {t('common.delete', 'Delete')}
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    )}
                </div>

                <div className="p-4 pt-2 border-t border-zinc-100">
                    <button
                        onClick={onClose}
                        className="w-full py-2.5 rounded-xl bg-zinc-100 text-zinc-600 text-sm font-bold hover:bg-zinc-200 transition-colors"
                    >
                        {t('common.close', 'Close')}
                    </button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
