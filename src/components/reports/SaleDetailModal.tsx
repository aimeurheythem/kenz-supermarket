import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { RefreshCcw, Ban, Loader2 } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';
import type { Sale, SaleItem } from '@/lib/types';
import { useSaleStore } from '@/stores/useSaleStore';
import Button from '@/components/common/Button';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

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
    const [pendingAction, setPendingAction] = useState<'refund' | 'void' | null>(null);
    const { t } = useTranslation();
    const { getItems } = useSaleStore();

    useEffect(() => {
        const loadItems = async () => {
            setLoading(true);
            try {
                const data = await getItems(sale.id);
                setItems(data);
            } catch (error) {
                console.error('Failed to load sale items:', error);
            } finally {
                setLoading(false);
            }
        };
        loadItems();
    }, [sale.id, getItems]);

    const handleAction = (action: 'refund' | 'void') => {
        setPendingAction(action);
    };

    const confirmAction = async () => {
        if (!pendingAction) return;
        const action = pendingAction;
        setPendingAction(null);
        setProcessing(true);
        try {
            if (action === 'refund') await onRefund(sale.id);
            else await onVoid(sale.id);
            onClose();
        } catch (_error) {
            toast.error(t('sale_detail.action_failed', { action }));
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
        <Dialog
            open={true}
            onOpenChange={(open) => {
                if (!open) onClose();
            }}
        >
            <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-0 overflow-hidden">
                {/* Header */}
                <DialogHeader className="p-6 pb-4">
                    <div className="flex items-center gap-3">
                        <DialogTitle className="text-xl font-bold">
                            {t('sale_detail.title', { id: sale.id })}
                        </DialogTitle>
                        <span
                            className={`px-2 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${statusColors[sale.status]}`}
                        >
                            {sale.status}
                        </span>
                    </div>
                    <DialogDescription>
                        {formatDate(sale.sale_date)} &bull; {sale.payment_method}
                    </DialogDescription>
                </DialogHeader>

                {/* Content */}
                <div className="flex-1 overflow-y-auto px-6 pb-6">
                    {loading ? (
                        <div className="flex justify-center py-12">
                            <Loader2 className="w-8 h-8 text-neutral-600 animate-spin" />
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {/* Items Table */}
                            <table className="w-full text-left text-sm">
                                <thead>
                                    <tr className="text-[var(--color-text-muted)] border-b border-[var(--color-border)]">
                                        <th className="pb-3 font-medium">{t('sale_detail.col_item')}</th>
                                        <th className="pb-3 font-medium text-right">{t('sale_detail.col_qty')}</th>
                                        <th className="pb-3 font-medium text-right">{t('sale_detail.col_price')}</th>
                                        <th className="pb-3 font-medium text-right">{t('sale_detail.col_total')}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[var(--color-border)]">
                                    {items.map((item) => (
                                        <tr key={item.id} className="group">
                                            <td className="py-3 text-[var(--color-text-primary)] group-hover:text-orange-500 transition-colors">
                                                {item.product_name}
                                            </td>
                                            <td className="py-3 text-right text-[var(--color-text-secondary)]">
                                                {item.quantity}
                                            </td>
                                            <td className="py-3 text-right text-[var(--color-text-secondary)]">
                                                {formatCurrency(item.unit_price)}
                                            </td>
                                            <td className="py-3 text-right text-[var(--color-text-primary)] font-medium">
                                                {formatCurrency(item.total)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            {/* Summary */}
                            <div className="bg-[var(--color-bg-secondary)] rounded-xl p-4 space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-[var(--color-text-muted)]">{t('sale_detail.subtotal')}</span>
                                    <span className="text-[var(--color-text-primary)]">
                                        {formatCurrency(sale.subtotal)}
                                    </span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-[var(--color-text-muted)]">{t('sale_detail.tax')}</span>
                                    <span className="text-[var(--color-text-primary)]">
                                        {formatCurrency(sale.tax_amount)}
                                    </span>
                                </div>
                                {sale.discount_amount > 0 && (
                                    <div className="flex justify-between text-sm text-emerald-500">
                                        <span>{t('sale_detail.discount')}</span>
                                        <span>-{formatCurrency(sale.discount_amount)}</span>
                                    </div>
                                )}
                                <div className="pt-2 mt-2 border-t border-[var(--color-border)] flex justify-between items-center">
                                    <span className="font-bold text-[var(--color-text-primary)]">
                                        {t('sale_detail.total')}
                                    </span>
                                    <span className="text-xl font-bold text-[var(--color-text-primary)]">
                                        {formatCurrency(sale.total)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer Actions */}
                <div className="p-6 border-t border-[var(--color-border)] flex justify-end gap-3 bg-[var(--color-bg-secondary)] rounded-b-2xl">
                    {/* Only show Refund/Void if completed */}
                    {sale.status === 'completed' && (
                        <>
                            <Button
                                variant="danger"
                                icon={processing ? <Loader2 className="animate-spin" /> : <Ban size={16} />}
                                onClick={() => handleAction('void')}
                                disabled={processing}
                            >
                                {t('sale_detail.void_transaction')}
                            </Button>
                            <Button
                                variant="secondary"
                                icon={processing ? <Loader2 className="animate-spin" /> : <RefreshCcw size={16} />}
                                onClick={() => handleAction('refund')}
                                disabled={processing}
                                className="bg-blue-600/10 text-blue-500 hover:bg-blue-600/20 border-blue-600/20"
                            >
                                {t('sale_detail.refund_sale')}
                            </Button>
                        </>
                    )}
                    <Button variant="secondary" onClick={onClose} disabled={processing}>
                        {t('sale_detail.close')}
                    </Button>
                </div>

                <ConfirmDialog
                    isOpen={pendingAction !== null}
                    onClose={() => setPendingAction(null)}
                    onConfirm={confirmAction}
                    title={
                        pendingAction === 'void'
                            ? t('sale_detail.confirm_void_title')
                            : t('sale_detail.confirm_refund_title')
                    }
                    description={t('sale_detail.confirm_description', { action: pendingAction })}
                    confirmLabel={pendingAction === 'void' ? t('sale_detail.void_btn') : t('sale_detail.refund_btn')}
                    variant="danger"
                    loading={processing}
                />
            </DialogContent>
        </Dialog>
    );
}
