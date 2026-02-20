import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Printer, X, CheckCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import Portal from '@/components/common/Portal';
import Button from '@/components/common/Button';
import { formatCurrency, formatDate, cn } from '@/lib/utils';
import type { Sale, SaleItem } from '@/lib/types';
import { useAuthStore } from '@/stores/useAuthStore';
import { useSettingsStore, selectSetting } from '@/stores/useSettingsStore';

interface ReceiptPreviewProps {
    sale: Sale;
    items: SaleItem[];
    onClose: () => void;
    onPrint?: () => void;
}

interface StoreInfo {
    name: string;
    address: string;
    phone: string;
    email: string;
    header: string;
    footer: string;
    showLogo: boolean;
}

/**
 * Shared receipt content — single source of truth for both screen preview and print output.
 * The `forPrint` prop toggles between the styled screen card and monospace thermal layout.
 */
function ReceiptContent({
    sale,
    items,
    storeInfo,
    cashierName,
    forPrint,
}: {
    sale: Sale;
    items: SaleItem[];
    storeInfo: StoreInfo;
    cashierName: string;
    forPrint: boolean;
}) {
    const { t } = useTranslation();

    return (
        <div
            className={cn(
                forPrint
                    ? 'font-mono text-black'
                    : 'bg-white border border-zinc-200 shadow-sm p-6 rounded-xl space-y-4',
            )}
        >
            {/* ── Store Header ── */}
            <div
                className={cn(
                    'text-center',
                    forPrint ? 'mb-4' : 'space-y-1 border-b border-dashed border-zinc-200 pb-4',
                )}
            >
                <h3 className={cn('font-black uppercase', forPrint ? 'text-xl mb-1' : 'text-lg tracking-wider')}>
                    {storeInfo.name}
                </h3>
                <p className={cn('whitespace-pre-line', forPrint ? 'text-[10px]' : 'text-xs text-zinc-500')}>
                    {storeInfo.address}
                </p>
                <p className={cn(forPrint ? 'text-[10px]' : 'text-xs text-zinc-500')}>{storeInfo.phone}</p>
                {storeInfo.header && (
                    <p
                        className={cn(
                            'italic whitespace-pre-line',
                            forPrint ? 'text-[10px] mt-2' : 'text-xs text-zinc-400 mt-2',
                        )}
                    >
                        {storeInfo.header}
                    </p>
                )}
            </div>

            {/* ── Sale Metadata ── */}
            <div
                className={cn(
                    forPrint
                        ? 'mb-4 text-[10px] flex justify-between border-b border-black pb-2 border-dashed'
                        : 'space-y-2 text-sm',
                )}
            >
                {forPrint ? (
                    <>
                        <div className="flex flex-col">
                            <span>{formatDate(sale.created_at)}</span>
                            <span>ID: {sale.id}</span>
                        </div>
                        <div className="flex flex-col items-end">
                            <span>
                                {t('pos.receipt.cashier', 'Cashier')}: {cashierName}
                            </span>
                            <span className="uppercase">{sale.payment_method}</span>
                        </div>
                    </>
                ) : (
                    <>
                        <div className="flex justify-between text-zinc-500 text-xs">
                            <span>{formatDate(sale.created_at)}</span>
                            <span>#{sale.id.toString().padStart(6, '0')}</span>
                        </div>
                        <div className="flex justify-between text-zinc-500 text-xs">
                            <span>{t('pos.receipt.cashier', 'Cashier')}:</span>
                            <span>{cashierName}</span>
                        </div>
                    </>
                )}
            </div>

            {/* ── Items ── */}
            {forPrint ? (
                <div className="mb-4 border-b border-black pb-2 border-dashed">
                    <table className="w-full text-[10px] text-left">
                        <thead>
                            <tr className="uppercase border-b border-black">
                                <th className="pb-1">{t('pos.receipt.item', 'Item')}</th>
                                <th className="pb-1 text-right">{t('pos.receipt.qty', 'Qty')}</th>
                                <th className="pb-1 text-right">{t('pos.receipt.price', 'Price')}</th>
                                <th className="pb-1 text-right">{t('pos.receipt.total', 'Total')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.map((item, idx) => (
                                <tr key={idx}>
                                    <td className="py-1 pr-1 truncate max-w-[80px]">{item.product_name}</td>
                                    <td className="py-1 text-right">{item.quantity}</td>
                                    <td className="py-1 text-right">{formatCurrency(item.unit_price)}</td>
                                    <td className="py-1 text-right font-bold">{formatCurrency(item.total)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="border-t border-dashed border-zinc-200 py-2 space-y-1">
                    {items.map((item, idx) => (
                        <div key={idx} className="flex justify-between text-sm py-1">
                            <div className="flex-1">
                                <span className="font-medium text-zinc-700">{item.product_name}</span>
                                <div className="text-xs text-zinc-400">
                                    {item.quantity} x {formatCurrency(item.unit_price)}
                                </div>
                            </div>
                            <div className="font-bold text-zinc-900">{formatCurrency(item.total)}</div>
                        </div>
                    ))}
                </div>
            )}

            {/* ── Totals ── */}
            <div className={cn(forPrint ? 'space-y-1 text-[12px] mb-6' : 'border-t border-zinc-900 pt-2 space-y-2')}>
                <div className={cn('flex justify-between', !forPrint && 'items-center text-sm')}>
                    <span className={cn(!forPrint && 'text-zinc-500 font-medium')}>
                        {t('pos.receipt.subtotal', 'Subtotal')}
                    </span>
                    <span className={cn(!forPrint && 'font-bold')}>{formatCurrency(sale.subtotal)}</span>
                </div>
                {sale.discount_amount > 0 && (
                    <div className={cn('flex justify-between', !forPrint && 'items-center text-sm text-red-500')}>
                        <span className={cn(!forPrint && 'font-medium')}>{t('pos.receipt.discount', 'Discount')}</span>
                        <span className={cn(!forPrint && 'font-bold')}>-{formatCurrency(sale.discount_amount)}</span>
                    </div>
                )}
                <div
                    className={cn(
                        'flex justify-between font-black',
                        forPrint
                            ? 'text-sm pt-2 border-t border-black border-dashed'
                            : 'items-center text-lg pt-2 border-t border-dashed border-zinc-200',
                    )}
                >
                    <span className={cn(!forPrint && 'uppercase tracking-wider')}>
                        {t('pos.receipt.total', 'Total')}
                    </span>
                    <span>{formatCurrency(sale.total)}</span>
                </div>
                {!forPrint && (
                    <div className="flex justify-between items-center text-xs text-zinc-500 pt-1">
                        <span className="uppercase tracking-wider">{sale.payment_method}</span>
                        <span>{storeInfo.footer}</span>
                    </div>
                )}
            </div>

            {/* ── Footer (print only) ── */}
            {forPrint && (
                <div className="text-center text-[10px] pt-4 border-t border-black border-dashed">
                    <p className="font-bold mb-1">{storeInfo.footer}</p>
                    <div className="mt-4 mx-auto w-2/3 h-8 bg-black/10 flex items-center justify-center text-[8px] tracking-widest uppercase">
                        {t('pos.receipt.barcode_area', 'Barcode Area')}
                    </div>
                </div>
            )}

            {/* Barcode visual (screen only) */}
            {!forPrint && (
                <div className="pt-4 flex justify-center opacity-40">
                    <div
                        className="h-8 w-2/3 bg-current"
                        style={{
                            background: 'repeating-linear-gradient(90deg, currentColor 0 1px, transparent 1px 3px)',
                        }}
                    ></div>
                </div>
            )}
        </div>
    );
}

export default function ReceiptPreview({ sale, items, onClose, onPrint }: ReceiptPreviewProps) {
    const { t } = useTranslation();
    const { user } = useAuthStore();
    const [isPrinting, setIsPrinting] = useState(false);

    const storeName = useSettingsStore(selectSetting('store.name', 'SuperMarket Pro'));
    const storeAddress = useSettingsStore(selectSetting('store.address', 'Store Address'));
    const storePhone = useSettingsStore(selectSetting('store.phone', ''));
    const storeEmail = useSettingsStore(selectSetting('store.email', ''));
    const receiptHeader = useSettingsStore(selectSetting('receipt.header', ''));
    const receiptFooter = useSettingsStore(selectSetting('receipt.footer', 'Thank you for your visit!'));
    const receiptShowLogo = useSettingsStore(selectSetting('receipt.showLogo', 'false'));

    const storeInfo: StoreInfo = {
        name: storeName,
        address: storeAddress,
        phone: storePhone,
        email: storeEmail,
        header: receiptHeader,
        footer: receiptFooter,
        showLogo: receiptShowLogo === 'true',
    };

    const cashierName = user?.full_name || 'Staff';

    const handlePrint = useCallback(async () => {
        setIsPrinting(true);
        onPrint?.();

        try {
            // Try Electron native print first (provides success/failure callback)
            if (window.electronAPI?.printReceipt) {
                const result = await window.electronAPI.printReceipt({ silent: false });
                if (result.success) {
                    toast.success(t('pos.receipt.print_success', 'Receipt sent to printer'));
                } else if (result.failureReason === 'cancelled') {
                    toast.info(t('pos.receipt.print_cancelled', 'Print cancelled'));
                } else {
                    toast.error(
                        t('pos.receipt.print_failed', 'Print failed: {{reason}}', {
                            reason: result.failureReason || t('common.unknown_error', 'Unknown error'),
                        }),
                    );
                }
            } else {
                // Browser fallback — use window.print() with afterprint detection
                await new Promise<void>((resolve) => {
                    const onAfterPrint = () => {
                        window.removeEventListener('afterprint', onAfterPrint);
                        resolve();
                    };
                    window.addEventListener('afterprint', onAfterPrint);
                    window.print();
                    // Safety timeout in case afterprint doesn't fire
                    setTimeout(() => {
                        window.removeEventListener('afterprint', onAfterPrint);
                        resolve();
                    }, 10_000);
                });
                toast.success(t('pos.receipt.print_complete', 'Print dialog completed'));
            }
        } catch {
            toast.error(t('pos.receipt.print_error', 'An error occurred while printing'));
        } finally {
            setIsPrinting(false);
        }
    }, [onPrint, t]);

    return (
        <Portal>
            <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 print:p-0 print:bg-white print:static">
                {/* Modal Content — Hidden during print */}
                <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh] print:hidden animate-fadeIn">
                    <div className="p-6 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/50">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                                <CheckCircle size={20} />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-zinc-900">
                                    {t('pos.receipt.title', 'Payment Successful')}
                                </h2>
                                <p className="text-xs text-zinc-500 font-medium">
                                    {t('pos.receipt.subtitle', 'Transaction completed')}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-400 hover:bg-zinc-200 hover:text-zinc-600 transition-colors"
                        >
                            <X size={16} />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 bg-zinc-50/30">
                        <ReceiptContent
                            sale={sale}
                            items={items}
                            storeInfo={storeInfo}
                            cashierName={cashierName}
                            forPrint={false}
                        />
                    </div>

                    <div className="p-6 border-t border-zinc-100 flex gap-3 bg-white">
                        <Button variant="secondary" className="flex-1 py-4" onClick={onClose}>
                            {t('common.close', 'Close')}
                        </Button>
                        <Button
                            className="flex-[2] py-4 bg-black text-white hover:bg-zinc-800 shadow-xl shadow-black/10"
                            onClick={handlePrint}
                            disabled={isPrinting}
                            icon={isPrinting ? <Loader2 size={20} className="animate-spin" /> : <Printer size={20} />}
                        >
                            {isPrinting ? t('pos.receipt.printing', 'Printing...') : t('common.print', 'Print Receipt')}
                        </Button>
                    </div>
                </div>

                {/* Printable Content — Only visible when printing */}
                <div className="hidden print:block print:w-[80mm] print:p-2">
                    <ReceiptContent
                        sale={sale}
                        items={items}
                        storeInfo={storeInfo}
                        cashierName={cashierName}
                        forPrint={true}
                    />
                </div>
            </div>
        </Portal>
    );
}
