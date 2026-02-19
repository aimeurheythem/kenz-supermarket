import React from 'react';
import { useTranslation } from 'react-i18next';
import { Printer, X, CheckCircle } from 'lucide-react';
import Portal from '@/components/common/Portal';
import Button from '@/components/common/Button';
import { formatCurrency, formatDate } from '@/lib/utils';
import type { Sale, SaleItem } from '@/lib/types';
import { useAuthStore } from '@/stores/useAuthStore';
import { useSettingsStore, selectSetting } from '@/stores/useSettingsStore';

interface ReceiptPreviewProps {
    sale: Sale;
    items: SaleItem[];
    onClose: () => void;
    onPrint?: () => void;
}

export default function ReceiptPreview({ sale, items, onClose, onPrint }: ReceiptPreviewProps) {
    const { t } = useTranslation();
    const { user } = useAuthStore();
    const storeName = useSettingsStore(selectSetting('store.name', 'SuperMarket Pro'));
    const storeAddress = useSettingsStore(selectSetting('store.address', 'Store Address'));
    const storePhone = useSettingsStore(selectSetting('store.phone', ''));
    const storeEmail = useSettingsStore(selectSetting('store.email', ''));
    const receiptHeader = useSettingsStore(selectSetting('receipt.header', ''));
    const receiptFooter = useSettingsStore(selectSetting('receipt.footer', 'Thank you for your visit!'));
    const receiptShowLogo = useSettingsStore(selectSetting('receipt.showLogo', 'false'));
    const handlePrint = () => {
        if (onPrint) onPrint();
        window.print();
    };

    // Store settings from store
    const storeInfo = {
        name: storeName,
        address: storeAddress,
        phone: storePhone,
        email: storeEmail,
        header: receiptHeader,
        footer: receiptFooter,
        showLogo: receiptShowLogo === 'true',
    };

    return (
        <Portal>
            <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 print:p-0 print:bg-white print:static">
                {/* Modal Content - Hidden during print */}
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
                        {/* Receipt Preview Visual */}
                        <div className="bg-white border border-zinc-200 shadow-sm p-6 rounded-xl space-y-4">
                            <div className="text-center space-y-1 border-b border-dashed border-zinc-200 pb-4">
                                <h3 className="font-black text-lg uppercase tracking-wider">{storeInfo.name}</h3>
                                <p className="text-xs text-zinc-500 whitespace-pre-line">{storeInfo.address}</p>
                                <p className="text-xs text-zinc-500">{storeInfo.phone}</p>
                                {storeInfo.header && (
                                    <p className="text-xs text-zinc-400 mt-2 italic whitespace-pre-line">
                                        {storeInfo.header}
                                    </p>
                                )}
                            </div>

                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between text-zinc-500 text-xs">
                                    <span>{formatDate(sale.created_at)}</span>
                                    <span>#{sale.id.toString().padStart(6, '0')}</span>
                                </div>
                                <div className="flex justify-between text-zinc-500 text-xs">
                                    <span>{t('pos.receipt.cashier', 'Cashier')}:</span>
                                    <span>{user?.full_name || 'Staff'}</span>
                                </div>
                            </div>

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

                            <div className="border-t border-zinc-900 pt-2 space-y-2">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-zinc-500 font-medium">
                                        {t('pos.receipt.subtotal', 'Subtotal')}
                                    </span>
                                    <span className="font-bold">{formatCurrency(sale.subtotal)}</span>
                                </div>
                                {sale.discount_amount > 0 && (
                                    <div className="flex justify-between items-center text-sm text-red-500">
                                        <span className="font-medium">{t('pos.receipt.discount', 'Discount')}</span>
                                        <span className="font-bold">-{formatCurrency(sale.discount_amount)}</span>
                                    </div>
                                )}
                                <div className="flex justify-between items-center text-lg pt-2 border-t border-dashed border-zinc-200">
                                    <span className="font-black uppercase tracking-wider">
                                        {t('pos.receipt.total', 'Total')}
                                    </span>
                                    <span className="font-black">{formatCurrency(sale.total)}</span>
                                </div>
                                <div className="flex justify-between items-center text-xs text-zinc-500 pt-1">
                                    <span className="uppercase tracking-wider">{sale.payment_method}</span>
                                    <span>{storeInfo.footer}</span>
                                </div>
                            </div>

                            {/* Barcode Placeholder */}
                            <div className="pt-4 flex justify-center opacity-40">
                                <div
                                    className="h-8 w-2/3 bg-current repeating-linear-gradient(90deg,currentColor 0 2px,transparent 0 4px)"
                                    style={{
                                        background:
                                            'repeating-linear-gradient(90deg, currentColor 0 1px, transparent 1px 3px)',
                                    }}
                                ></div>
                            </div>
                        </div>
                    </div>

                    <div className="p-6 border-t border-zinc-100 flex gap-3 bg-white">
                        <Button variant="secondary" className="flex-1 py-4" onClick={onClose}>
                            {t('common.close', 'Close')}
                        </Button>
                        <Button
                            className="flex-[2] py-4 bg-black text-white hover:bg-zinc-800 shadow-xl shadow-black/10"
                            onClick={handlePrint}
                            icon={<Printer size={20} />}
                        >
                            {t('common.print', 'Print Receipt')}
                        </Button>
                    </div>
                </div>

                {/* Actual Printable Content - Only visible when printing */}
                <div className="hidden print:block print:w-[80mm] print:p-2 font-mono text-black">
                    <div className="text-center mb-4">
                        <h1 className="font-black text-xl uppercase mb-1">{storeInfo.name}</h1>
                        <p className="text-[10px] whitespace-pre-line">{storeInfo.address}</p>
                        <p className="text-[10px]">{storeInfo.phone}</p>
                        {storeInfo.header && (
                            <p className="text-[10px] mt-2 italic whitespace-pre-line">{storeInfo.header}</p>
                        )}
                    </div>

                    <div className="mb-4 text-[10px] flex justify-between border-b border-black pb-2 border-dashed">
                        <div className="flex flex-col">
                            <span>{formatDate(sale.created_at)}</span>
                            <span>ID: {sale.id}</span>
                        </div>
                        <div className="flex flex-col items-end">
                            <span>OP: {user?.full_name}</span>
                            <span className="uppercase">{sale.payment_method}</span>
                        </div>
                    </div>

                    <div className="mb-4 border-b border-black pb-2 border-dashed">
                        <table className="w-full text-[10px] text-left">
                            <thead>
                                <tr className="uppercase border-b border-black">
                                    <th className="pb-1">Item</th>
                                    <th className="pb-1 text-right">Qty</th>
                                    <th className="pb-1 text-right">Price</th>
                                    <th className="pb-1 text-right">Total</th>
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

                    <div className="space-y-1 text-[12px] mb-6">
                        <div className="flex justify-between">
                            <span>Subtotal</span>
                            <span>{formatCurrency(sale.subtotal)}</span>
                        </div>
                        {sale.discount_amount > 0 && (
                            <div className="flex justify-between">
                                <span>Discount</span>
                                <span>-{formatCurrency(sale.discount_amount)}</span>
                            </div>
                        )}
                        <div className="flex justify-between font-black text-sm pt-2 border-t border-black border-dashed">
                            <span className="uppercase">Total</span>
                            <span>{formatCurrency(sale.total)}</span>
                        </div>
                    </div>

                    <div className="text-center text-[10px] pt-4 border-t border-black border-dashed">
                        <p className="font-bold mb-1">{storeInfo.footer}</p>
                        <p>No returns without receipt.</p>
                        <div className="mt-4 mx-auto w-2/3 h-8 bg-black/10 flex items-center justify-center text-[8px] tracking-widest uppercase">
                            Barcode Area
                        </div>
                    </div>
                </div>
            </div>
        </Portal>
    );
}
