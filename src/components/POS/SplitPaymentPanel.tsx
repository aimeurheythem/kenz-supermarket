// SplitPaymentPanel.tsx — Multi-tender sequential payment entry
import { useState, useCallback, useMemo } from 'react';
import { CreditCard, Banknote, Smartphone, Receipt, Trash2, CheckCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';
import type { PaymentEntryInput } from '@/lib/types';

const PAYMENT_METHODS = [
    { value: 'cash' as const, label: 'Cash', icon: Banknote, color: 'bg-emerald-500' },
    { value: 'card' as const, label: 'Card', icon: CreditCard, color: 'bg-blue-500' },
    { value: 'mobile' as const, label: 'Mobile', icon: Smartphone, color: 'bg-purple-500' },
    { value: 'credit' as const, label: 'Credit', icon: Receipt, color: 'bg-amber-500' },
];

interface SplitPaymentPanelProps {
    isOpen: boolean;
    onClose: () => void;
    grandTotal: number;
    onFinalize: (entries: PaymentEntryInput[]) => void;
    formatCurrency: (amount: number) => string;
}

export default function SplitPaymentPanel({
    isOpen,
    onClose,
    grandTotal,
    onFinalize,
    formatCurrency,
}: SplitPaymentPanelProps) {
    const { t } = useTranslation();
    const [entries, setEntries] = useState<PaymentEntryInput[]>([]);
    const [selectedMethod, setSelectedMethod] = useState<PaymentEntryInput['method']>('cash');
    const [amountStr, setAmountStr] = useState('');

    const totalPaid = useMemo(
        () => entries.reduce((sum, e) => sum + e.amount, 0),
        [entries],
    );

    const remaining = Math.max(0, grandTotal - totalPaid);
    const overpaid = Math.max(0, totalPaid - grandTotal);
    const canFinalize = totalPaid >= grandTotal && entries.length > 0;

    const handleAddEntry = useCallback(() => {
        const amount = parseFloat(amountStr);
        if (isNaN(amount) || amount <= 0) return;

        setEntries((prev) => [...prev, { method: selectedMethod, amount }]);
        setAmountStr('');
    }, [amountStr, selectedMethod]);

    const handleRemoveEntry = useCallback((index: number) => {
        setEntries((prev) => prev.filter((_, i) => i !== index));
    }, []);

    const handleFinalize = useCallback(() => {
        if (!canFinalize) return;
        onFinalize(entries);
        setEntries([]);
        setAmountStr('');
    }, [canFinalize, entries, onFinalize]);

    const handleClose = useCallback(() => {
        setEntries([]);
        setAmountStr('');
        onClose();
    }, [onClose]);

    const handleQuickFill = useCallback(() => {
        if (remaining > 0) {
            setAmountStr(remaining.toFixed(2));
        }
    }, [remaining]);

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
            <DialogContent className="max-w-md border-0 p-0 bg-white rounded-2xl shadow-2xl overflow-hidden">
                <DialogHeader className="p-5 pb-3 border-b border-zinc-100">
                    <DialogTitle className="text-lg font-bold text-zinc-900 flex items-center gap-2">
                        <CreditCard size={18} className="text-blue-500" />
                        {t('pos.split_payment', 'Split Payment')}
                    </DialogTitle>
                    <DialogDescription className="text-xs text-zinc-400">
                        {t('pos.split_desc', 'Add multiple payment methods to cover the total')}
                    </DialogDescription>
                </DialogHeader>

                {/* Total summary */}
                <div className="px-5 py-3 bg-zinc-50 border-b border-zinc-100">
                    <div className="flex items-center justify-between">
                        <span className="text-xs text-zinc-500 font-medium">{t('pos.grand_total', 'Grand Total')}</span>
                        <span className="text-lg font-black text-zinc-900 tabular-nums">{formatCurrency(grandTotal)}</span>
                    </div>
                    <div className="flex items-center justify-between mt-1">
                        <span className="text-xs text-zinc-500 font-medium">{t('pos.remaining', 'Remaining')}</span>
                        <span className={`text-sm font-bold tabular-nums ${remaining > 0 ? 'text-red-500' : 'text-emerald-600'}`}>
                            {remaining > 0 ? formatCurrency(remaining) : t('pos.fully_paid', 'Fully Paid')}
                        </span>
                    </div>
                    {overpaid > 0 && (
                        <div className="flex items-center justify-between mt-1">
                            <span className="text-xs text-zinc-500 font-medium">{t('pos.change', 'Change')}</span>
                            <span className="text-sm font-bold text-amber-600 tabular-nums">{formatCurrency(overpaid)}</span>
                        </div>
                    )}
                </div>

                {/* Method selector */}
                <div className="px-5 py-3">
                    <div className="grid grid-cols-4 gap-1.5 mb-3">
                        {PAYMENT_METHODS.map((m) => {
                            const Icon = m.icon;
                            const isSelected = selectedMethod === m.value;
                            return (
                                <button
                                    key={m.value}
                                    onClick={() => setSelectedMethod(m.value)}
                                    className={`flex flex-col items-center gap-1 p-2 rounded-xl text-xs font-bold transition-all ${
                                        isSelected
                                            ? `${m.color} text-white shadow-md`
                                            : 'bg-zinc-100 text-zinc-500 hover:bg-zinc-200'
                                    }`}
                                >
                                    <Icon size={16} />
                                    {t(`pos.payment.${m.value}`, m.label)}
                                </button>
                            );
                        })}
                    </div>

                    {/* Amount input */}
                    <div className="flex gap-2">
                        <div className="relative flex-1">
                            <input
                                type="number"
                                value={amountStr}
                                onChange={(e) => setAmountStr(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleAddEntry()}
                                placeholder={t('pos.enter_amount', 'Enter amount...')}
                                min="0"
                                step="0.01"
                                className="w-full px-3 py-2.5 rounded-xl bg-zinc-50 border border-zinc-200 text-sm font-bold text-zinc-800 placeholder:text-zinc-400 focus:outline-none focus:border-zinc-400 transition-colors tabular-nums"
                                autoFocus
                            />
                        </div>
                        {remaining > 0 && (
                            <button
                                onClick={handleQuickFill}
                                className="px-3 py-2.5 rounded-xl bg-zinc-100 text-zinc-600 text-xs font-bold hover:bg-zinc-200 transition-colors whitespace-nowrap"
                                title={t('pos.fill_remaining', 'Fill remaining amount')}
                            >
                                {formatCurrency(remaining)}
                            </button>
                        )}
                        <button
                            onClick={handleAddEntry}
                            disabled={!amountStr || parseFloat(amountStr) <= 0}
                            className="px-4 py-2.5 rounded-xl bg-blue-500 text-white text-sm font-bold hover:bg-blue-600 disabled:bg-zinc-300 disabled:cursor-not-allowed active:scale-95 transition-all"
                        >
                            {t('common.add', 'Add')}
                        </button>
                    </div>
                </div>

                {/* Entries list */}
                <div className="px-5 max-h-[200px] overflow-y-auto">
                    <AnimatePresence mode="popLayout">
                        {entries.map((entry, idx) => {
                            const methodInfo = PAYMENT_METHODS.find((m) => m.value === entry.method);
                            const Icon = methodInfo?.icon ?? Banknote;
                            return (
                                <motion.div
                                    key={`${idx}-${entry.method}-${entry.amount}`}
                                    layout
                                    initial={{ opacity: 0, y: -8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, x: 40, height: 0 }}
                                    transition={{ duration: 0.15 }}
                                    className="flex items-center justify-between py-2 border-b border-zinc-50 last:border-b-0"
                                >
                                    <div className="flex items-center gap-2">
                                        <div className={`w-6 h-6 rounded-md ${methodInfo?.color ?? 'bg-zinc-400'} flex items-center justify-center`}>
                                            <Icon size={12} className="text-white" />
                                        </div>
                                        <span className="text-xs font-semibold text-zinc-700 capitalize">{entry.method}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-bold text-zinc-800 tabular-nums">
                                            {formatCurrency(entry.amount)}
                                        </span>
                                        <button
                                            onClick={() => handleRemoveEntry(idx)}
                                            className="p-1 rounded-lg text-zinc-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                                        >
                                            <Trash2 size={12} />
                                        </button>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                    {entries.length === 0 && (
                        <div className="py-6 text-center text-xs text-zinc-400">
                            {t('pos.no_payments', 'No payment entries yet')}
                        </div>
                    )}
                </div>

                {/* Actions */}
                <div className="p-4 border-t border-zinc-100 flex gap-2">
                    <button
                        onClick={handleClose}
                        className="flex-1 py-2.5 rounded-xl bg-zinc-100 text-zinc-600 text-sm font-bold hover:bg-zinc-200 transition-colors"
                    >
                        {t('common.cancel', 'Cancel')}
                    </button>
                    <button
                        onClick={handleFinalize}
                        disabled={!canFinalize}
                        className="flex-1 py-2.5 rounded-xl bg-emerald-500 text-white text-sm font-bold hover:bg-emerald-600 disabled:bg-zinc-300 disabled:cursor-not-allowed active:scale-95 transition-all flex items-center justify-center gap-2"
                    >
                        <CheckCircle size={16} />
                        {t('pos.finalize_payment', 'Finalize')}
                    </button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
