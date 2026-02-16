import React, { useEffect, useState } from 'react';
import { X, RefreshCcw, Ban, Printer, Loader2 } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';
import type { Sale, SaleItem } from '@/lib/types';
import { SaleRepo } from '../../../database/repositories/sale.repo';
import Button from '@/components/common/Button';
import { motion, AnimatePresence } from 'framer-motion';

interface SaleDetailModalProps {
    sale: Sale;
    onClose: () => void;
    onRefund: (saleId: number) => Promise<void>;
    onVoid: (saleId: number) => Promise<void>;
}

export default function SaleDetailModal({ sale, onClose, onRefund, onVoid }: SaleDetailModalProps) {
    const [items, setItems] = useState<SaleItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        loadItems();
    }, [sale.id]);

    const loadItems = async () => {
        setLoading(true);
        try {
            const data = await SaleRepo.getItems(sale.id);
            setItems(data);
        } catch (error) {
            console.error('Failed to load sale items:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async (action: 'refund' | 'void') => {
        if (!confirm(`Are you sure you want to ${action} this sale? This action cannot be undone.`)) return;

        setProcessing(true);
        try {
            if (action === 'refund') await onRefund(sale.id);
            else await onVoid(sale.id);
            onClose();
        } catch (error) {
            alert(`Failed to ${action} sale: ${error instanceof Error ? error.message : 'Unknown error'}`);
        } finally {
            setProcessing(false);
        }
    };

    const statusColors = {
        completed: 'bg-emerald-500/10 text-emerald-500',
        refunded: 'bg-blue-500/10 text-blue-500',
        voided: 'bg-red-500/10 text-red-500',
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl"
            >
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-neutral-800">
                    <div>
                        <div className="flex items-center gap-3">
                            <h2 className="text-xl font-bold text-white">Sale #{sale.id}</h2>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${statusColors[sale.status]}`}>
                                {sale.status}
                            </span>
                        </div>
                        <p className="text-sm text-zinc-400 mt-1">
                            {formatDate(sale.sale_date)} • {sale.payment_method}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-full hover:bg-neutral-800 text-zinc-400 hover:text-white transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {loading ? (
                        <div className="flex justify-center py-12">
                            <Loader2 className="w-8 h-8 text-neutral-600 animate-spin" />
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {/* Items Table */}
                            <table className="w-full text-left text-sm">
                                <thead>
                                    <tr className="text-zinc-500 border-b border-neutral-800">
                                        <th className="pb-3 font-medium">Item</th>
                                        <th className="pb-3 font-medium text-right">Qty</th>
                                        <th className="pb-3 font-medium text-right">Price</th>
                                        <th className="pb-3 font-medium text-right">Total</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-neutral-800">
                                    {items.map((item) => (
                                        <tr key={item.id} className="group">
                                            <td className="py-3 text-white group-hover:text-orange-500 transition-colors">
                                                {item.product_name}
                                            </td>
                                            <td className="py-3 text-right text-zinc-300">{item.quantity}</td>
                                            <td className="py-3 text-right text-zinc-300">{formatCurrency(item.unit_price)}</td>
                                            <td className="py-3 text-right text-white font-medium">{formatCurrency(item.total)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            {/* Summary */}
                            <div className="bg-neutral-800/50 rounded-xl p-4 space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-zinc-400">Subtotal</span>
                                    <span className="text-white">{formatCurrency(sale.subtotal)}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-zinc-400">Tax</span>
                                    <span className="text-white">{formatCurrency(sale.tax_amount)}</span>
                                </div>
                                {sale.discount_amount > 0 && (
                                    <div className="flex justify-between text-sm text-emerald-500">
                                        <span>Discount</span>
                                        <span>-{formatCurrency(sale.discount_amount)}</span>
                                    </div>
                                )}
                                <div className="pt-2 mt-2 border-t border-neutral-700 flex justify-between items-center">
                                    <span className="font-bold text-white">Total</span>
                                    <span className="text-xl font-bold text-white">{formatCurrency(sale.total)}</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer Actions */}
                <div className="p-6 border-t border-neutral-800 flex justify-end gap-3 bg-neutral-900/50 rounded-b-2xl">
                    {/* Only show Refund/Void if completed */}
                    {sale.status === 'completed' && (
                        <>
                            <Button
                                variant="danger"
                                icon={processing ? <Loader2 className="animate-spin" /> : <Ban size={16} />}
                                onClick={() => handleAction('void')}
                                disabled={processing}
                            >
                                Void Transaction
                            </Button>
                            <Button
                                variant="secondary"
                                icon={processing ? <Loader2 className="animate-spin" /> : <RefreshCcw size={16} />}
                                onClick={() => handleAction('refund')}
                                disabled={processing}
                                className="bg-blue-600/10 text-blue-500 hover:bg-blue-600/20 border-blue-600/20"
                            >
                                Refund Sale
                            </Button>
                        </>
                    )}
                    <Button variant="secondary" onClick={onClose} disabled={processing}>
                        Close
                    </Button>
                </div>
            </motion.div>
        </div>
    );
}
