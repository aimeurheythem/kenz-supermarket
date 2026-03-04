// ReturnDialog.tsx — Sale lookup + item selection for returns/refunds
import { useState, useCallback, useEffect } from 'react';
import { Search, Undo2, AlertTriangle, Package, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';
import type { Sale, SaleItem, ReturnItem, ReturnRequest } from '@/lib/types';
import { SaleRepo } from '../../../database/repositories/sale.repo';

interface ReturnDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (request: ReturnRequest) => void;
    managerId: number | null;
}

interface ReturnLineState {
    saleItem: SaleItem;
    maxReturn: number; // original qty minus already-returned
    returnQty: number; // selected return qty
    refundAmount: number;
}

export default function ReturnDialog({
    isOpen,
    onClose,
    onConfirm,
    managerId,
}: ReturnDialogProps) {
    const { t } = useTranslation();

    // Lookup state
    const [lookupQuery, setLookupQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [foundSale, setFoundSale] = useState<Sale | null>(null);
    const [saleItems, setSaleItems] = useState<SaleItem[]>([]);
    const [returnLines, setReturnLines] = useState<ReturnLineState[]>([]);
    const [searchError, setSearchError] = useState<string | null>(null);
    const [reason, setReason] = useState('');
    const [step, setStep] = useState<'lookup' | 'select'>('lookup');

    // Reset on open/close
    useEffect(() => {
        if (!isOpen) {
            setLookupQuery('');
            setFoundSale(null);
            setSaleItems([]);
            setReturnLines([]);
            setSearchError(null);
            setReason('');
            setStep('lookup');
        }
    }, [isOpen]);

    const handleSearch = useCallback(async () => {
        if (!lookupQuery.trim()) return;
        setIsSearching(true);
        setSearchError(null);

        try {
            const saleId = parseInt(lookupQuery.trim(), 10);
            if (isNaN(saleId)) {
                setSearchError(t('pos.return.invalid_id', 'Please enter a valid sale/ticket number'));
                setIsSearching(false);
                return;
            }

            const sale = await SaleRepo.getById(saleId);
            if (!sale) {
                setSearchError(t('pos.return.not_found', 'Sale not found'));
                setIsSearching(false);
                return;
            }

            if (sale.status === 'voided') {
                setSearchError(t('pos.return.voided', 'This sale has been voided'));
                setIsSearching(false);
                return;
            }

            const items = await SaleRepo.getItems(saleId);
            const returnedQtys = await SaleRepo.getReturnedQuantities(saleId);

            const lines: ReturnLineState[] = items.map((item) => {
                const alreadyReturned = returnedQtys.get(item.product_id) ?? 0;
                const maxReturn = Math.max(0, item.quantity - alreadyReturned);
                return {
                    saleItem: item,
                    maxReturn,
                    returnQty: 0,
                    refundAmount: 0,
                };
            });

            setFoundSale(sale);
            setSaleItems(items);
            setReturnLines(lines);
            setStep('select');
        } catch (err) {
            console.error('Return lookup error:', err);
            setSearchError(t('pos.return.search_error', 'Error searching for sale'));
        } finally {
            setIsSearching(false);
        }
    }, [lookupQuery, t]);

    const updateReturnQty = useCallback((index: number, qty: number) => {
        setReturnLines((prev) => {
            const next = [...prev];
            const line = next[index];
            const clampedQty = Math.max(0, Math.min(qty, line.maxReturn));
            const unitRefund = line.saleItem.unit_price - (line.saleItem.discount / line.saleItem.quantity);
            next[index] = {
                ...line,
                returnQty: clampedQty,
                refundAmount: clampedQty * unitRefund,
            };
            return next;
        });
    }, []);

    const selectedLines = returnLines.filter((l) => l.returnQty > 0);
    const totalRefund = selectedLines.reduce((sum, l) => sum + l.refundAmount, 0);

    const handleConfirm = useCallback(() => {
        if (selectedLines.length === 0 || !foundSale || managerId == null) return;

        const request: ReturnRequest = {
            originalSaleId: foundSale.id,
            items: selectedLines.map((l) => ({
                saleItemId: l.saleItem.id,
                productId: l.saleItem.product_id,
                productName: l.saleItem.product_name,
                originalQuantity: l.saleItem.quantity,
                returnQuantity: l.returnQty,
                unitPrice: l.saleItem.unit_price,
                lineDiscount: l.saleItem.discount / l.saleItem.quantity,
                refundAmount: l.refundAmount,
            })),
            totalRefund,
            reason: reason.trim() || undefined,
            authorizedBy: managerId,
        };

        onConfirm(request);
    }, [selectedLines, foundSale, managerId, totalRefund, reason, onConfirm]);

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-lg border-0 p-0 bg-white rounded-2xl shadow-2xl overflow-hidden">
                <DialogHeader className="p-5 pb-3 border-b border-zinc-100">
                    <DialogTitle className="text-lg font-bold text-zinc-900 flex items-center gap-2">
                        <Undo2 size={18} className="text-orange-500" />
                        {t('pos.return.title', 'Process Return')}
                    </DialogTitle>
                    <DialogDescription className="text-xs text-zinc-400">
                        {step === 'lookup'
                            ? t('pos.return.lookup_desc', 'Enter the sale ID or ticket number to look up')
                            : t('pos.return.select_desc', 'Select items and quantities to return')}
                    </DialogDescription>
                </DialogHeader>

                <AnimatePresence mode="wait">
                    {step === 'lookup' ? (
                        <motion.div
                            key="lookup"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="p-5"
                        >
                            <div className="flex gap-2">
                                <div className="relative flex-1">
                                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                                    <input
                                        type="text"
                                        value={lookupQuery}
                                        onChange={(e) => setLookupQuery(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                        placeholder={t('pos.return.search_placeholder', 'Sale ID or ticket number...')}
                                        className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-zinc-50 border border-zinc-200 text-sm font-medium text-zinc-800 placeholder:text-zinc-400 focus:outline-none focus:border-zinc-400 transition-colors"
                                        autoFocus
                                    />
                                </div>
                                <button
                                    onClick={handleSearch}
                                    disabled={isSearching || !lookupQuery.trim()}
                                    className="px-4 py-2.5 rounded-xl bg-orange-500 text-white text-sm font-bold hover:bg-orange-600 disabled:bg-zinc-300 disabled:cursor-not-allowed active:scale-95 transition-all"
                                >
                                    {isSearching ? <Loader2 size={16} className="animate-spin" /> : t('common.search', 'Search')}
                                </button>
                            </div>

                            {searchError && (
                                <div className="mt-3 flex items-center gap-2 px-3 py-2 bg-red-50 text-red-600 text-xs font-medium rounded-lg">
                                    <AlertTriangle size={14} />
                                    {searchError}
                                </div>
                            )}
                        </motion.div>
                    ) : (
                        <motion.div
                            key="select"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            className="flex flex-col"
                        >
                            {/* Sale info header */}
                            {foundSale && (
                                <div className="px-5 py-2 bg-zinc-50 border-b border-zinc-100">
                                    <div className="flex items-center justify-between text-xs text-zinc-500">
                                        <span>
                                            {t('pos.return.sale', 'Sale')} #{foundSale.id}
                                            {foundSale.ticket_number && ` · Ticket #${String(foundSale.ticket_number).padStart(3, '0')}`}
                                        </span>
                                        <span>{new Date(foundSale.sale_date).toLocaleDateString()}</span>
                                    </div>
                                    <div className="text-xs text-zinc-400 mt-0.5">
                                        {foundSale.customer_name}
                                    </div>
                                </div>
                            )}

                            {/* Item list */}
                            <div className="px-5 py-3 max-h-[300px] overflow-y-auto space-y-2">
                                {returnLines.map((line, index) => (
                                    <div
                                        key={line.saleItem.id}
                                        className={`p-3 rounded-xl border transition-colors ${
                                            line.returnQty > 0
                                                ? 'border-orange-200 bg-orange-50'
                                                : 'border-zinc-100 bg-zinc-50'
                                        } ${line.maxReturn === 0 ? 'opacity-50' : ''}`}
                                    >
                                        <div className="flex items-center justify-between gap-3">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <Package size={12} className="text-zinc-400 shrink-0" />
                                                    <span className="text-sm font-semibold text-zinc-800 truncate">
                                                        {line.saleItem.product_name}
                                                    </span>
                                                </div>
                                                <div className="text-[11px] text-zinc-400 mt-0.5">
                                                    {t('pos.return.original_qty', 'Qty: {{qty}}', { qty: line.saleItem.quantity })}
                                                    {line.maxReturn < line.saleItem.quantity && (
                                                        <span className="text-orange-500 ml-2">
                                                            ({t('pos.return.max_returnable', 'max {{max}}', { max: line.maxReturn })})
                                                        </span>
                                                    )}
                                                    <span className="ml-2">
                                                        @ {(line.saleItem.unit_price).toFixed(2)}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Quantity spinner */}
                                            {line.maxReturn > 0 ? (
                                                <div className="flex items-center gap-1">
                                                    <button
                                                        onClick={() => updateReturnQty(index, line.returnQty - 1)}
                                                        disabled={line.returnQty === 0}
                                                        className="w-7 h-7 rounded-lg bg-zinc-200 text-zinc-600 font-bold text-sm hover:bg-zinc-300 disabled:opacity-40 transition-all"
                                                    >
                                                        −
                                                    </button>
                                                    <span className="w-8 text-center text-sm font-bold text-zinc-800">
                                                        {line.returnQty}
                                                    </span>
                                                    <button
                                                        onClick={() => updateReturnQty(index, line.returnQty + 1)}
                                                        disabled={line.returnQty >= line.maxReturn}
                                                        className="w-7 h-7 rounded-lg bg-zinc-200 text-zinc-600 font-bold text-sm hover:bg-zinc-300 disabled:opacity-40 transition-all"
                                                    >
                                                        +
                                                    </button>
                                                </div>
                                            ) : (
                                                <span className="text-[10px] text-zinc-400 font-medium">
                                                    {t('pos.return.already_returned', 'Returned')}
                                                </span>
                                            )}
                                        </div>

                                        {/* Refund preview */}
                                        {line.returnQty > 0 && (
                                            <div className="mt-1.5 text-right text-xs font-bold text-orange-600">
                                                {t('pos.return.refund', 'Refund')}: {line.refundAmount.toFixed(2)}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>

                            {/* Reason input */}
                            <div className="px-5 py-2">
                                <input
                                    type="text"
                                    value={reason}
                                    onChange={(e) => setReason(e.target.value)}
                                    placeholder={t('pos.return.reason_placeholder', 'Reason for return (optional)...')}
                                    className="w-full px-3 py-2 rounded-lg bg-zinc-50 border border-zinc-200 text-xs text-zinc-700 placeholder:text-zinc-400 focus:outline-none focus:border-zinc-400 transition-colors"
                                />
                            </div>

                            {/* Total + actions */}
                            <div className="px-5 py-4 border-t border-zinc-100 bg-zinc-50">
                                <div className="flex items-center justify-between mb-3">
                                    <span className="text-xs text-zinc-500 font-medium">
                                        {t('pos.return.total_refund', 'Total Refund')}
                                    </span>
                                    <span className="text-xl font-black text-orange-600 tabular-nums">
                                        {totalRefund.toFixed(2)}
                                    </span>
                                </div>

                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setStep('lookup')}
                                        className="flex-1 py-2.5 rounded-xl bg-zinc-200 text-zinc-600 text-sm font-bold hover:bg-zinc-300 transition-colors"
                                    >
                                        {t('common.back', 'Back')}
                                    </button>
                                    <button
                                        onClick={handleConfirm}
                                        disabled={selectedLines.length === 0}
                                        className="flex-1 py-2.5 rounded-xl bg-orange-500 text-white text-sm font-bold hover:bg-orange-600 disabled:bg-zinc-300 disabled:cursor-not-allowed active:scale-95 transition-all"
                                    >
                                        {t('pos.return.confirm', 'Process Return')}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </DialogContent>
        </Dialog>
    );
}
