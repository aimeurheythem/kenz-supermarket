import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, CheckCircle, Eye, XCircle } from 'lucide-react';
import { cn, formatCurrency, formatDate } from '@/lib/utils';
import { usePurchaseStore } from '@/stores/usePurchaseStore';
import { useSupplierStore } from '@/stores/useSupplierStore';
import { useProductStore } from '@/stores/useProductStore';
import Button from '@/components/common/Button';
import Pagination from '@/components/common/Pagination';
import { usePagination } from '@/hooks/usePagination';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import SearchInput from '@/components/common/SearchInput';
import type { Product } from '@/lib/types';
import { usePageTitle } from '@/hooks/usePageTitle';

export default function Purchases() {
    const { t } = useTranslation();
    usePageTitle(t('sidebar.purchases'));
    const { orders, currentOrderItems, loadOrders, loadOrderItems, createOrder, receiveOrder } = usePurchaseStore();
    const { items: suppliers, loadSuppliers } = useSupplierStore();
    const { products, loadProducts } = useProductStore();

    const [isNewOrderOpen, setIsNewOrderOpen] = useState(false);
    const [viewedOrder, setViewedOrder] = useState<number | null>(null);

    // New Order Form State
    const [selectedSupplier, setSelectedSupplier] = useState<number | ''>('');
    const [orderItems, setOrderItems] = useState<{ product: Product; quantity: number; cost: number }[]>([]);
    const [itemSearch, setItemSearch] = useState('');
    const [notes, setNotes] = useState('');

    useEffect(() => {
        loadOrders();
        loadSuppliers();
        loadProducts();
    }, [loadOrders, loadSuppliers, loadProducts]);

    const { currentPage, totalPages, startIndex, endIndex, setCurrentPage, paginate } = usePagination({
        totalItems: orders.length,
    });

    const paginatedOrders = paginate(orders);

    useEffect(() => {
        if (viewedOrder) {
            loadOrderItems(viewedOrder);
        }
    }, [viewedOrder, loadOrderItems]);

    const handleAddItem = (product: Product) => {
        const existing = orderItems.find((i) => i.product.id === product.id);
        if (existing) return;
        setOrderItems([...orderItems, { product, quantity: 1, cost: product.cost_price }]);
        setItemSearch('');
    };

    const updateItem = (productId: number, field: 'quantity' | 'cost', value: number) => {
        setOrderItems((items) =>
            items.map((item) => (item.product.id === productId ? { ...item, [field]: value } : item)),
        );
    };

    const removeItem = (productId: number) => {
        setOrderItems((items) => items.filter((i) => i.product.id !== productId));
    };

    const handleSubmitOrder = () => {
        if (!selectedSupplier || orderItems.length === 0) return;
        createOrder({
            supplier_id: Number(selectedSupplier),
            status: 'pending',
            notes,
            items: orderItems.map((i) => ({
                product_id: i.product.id,
                quantity: i.quantity,
                unit_cost: i.cost,
            })),
        });
        setIsNewOrderOpen(false);
        resetForm();
    };

    const resetForm = () => {
        setSelectedSupplier('');
        setOrderItems([]);
        setNotes('');
        setItemSearch('');
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'received':
                return 'text-[var(--color-success)] bg-[var(--color-success-muted)]';
            case 'ordered':
                return 'text-[var(--color-info)] bg-[var(--color-info-muted)]';
            case 'cancelled':
                return 'text-[var(--color-danger)] bg-[var(--color-danger-muted)]';
            default:
                return 'text-[var(--color-warning)] bg-[var(--color-warning-muted)]';
        }
    };

    const filteredProducts = products.filter(
        (p) => itemSearch && p.name.toLowerCase().includes(itemSearch.toLowerCase()),
    );

    const activeOrder = orders.find((o) => o.id === viewedOrder);

    return (
        <div className="space-y-5 animate-fadeIn">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">{t('purchases.title')}</h1>
                    <p className="text-sm text-[var(--color-text-muted)] mt-1">{t('purchases.subtitle')}</p>
                </div>
                <Button className="btn-page-action" onClick={() => setIsNewOrderOpen(true)} icon={<Plus size={16} />}>
                    {t('purchases.new_order')}
                </Button>
            </div>

            {/* Orders List */}
            <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] overflow-hidden">
                <table className="w-full">
                    <thead className="bg-[var(--color-bg-secondary)] border-b border-[var(--color-border)]">
                        <tr>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--color-text-muted)] uppercase">
                                {t('purchases.col_po')}
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--color-text-muted)] uppercase">
                                {t('purchases.col_supplier')}
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--color-text-muted)] uppercase">
                                {t('purchases.col_date')}
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--color-text-muted)] uppercase">
                                {t('purchases.col_status')}
                            </th>
                            <th className="px-4 py-3 text-right text-xs font-semibold text-[var(--color-text-muted)] uppercase">
                                {t('purchases.col_total')}
                            </th>
                            <th className="px-4 py-3 text-center text-xs font-semibold text-[var(--color-text-muted)] uppercase">
                                {t('purchases.col_actions')}
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--color-border)]">
                        {orders.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="px-4 py-12 text-center text-[var(--color-text-muted)]">
                                    {t('purchases.no_orders')}
                                </td>
                            </tr>
                        ) : (
                            paginatedOrders.map((order) => (
                                <tr key={order.id} className="hover:bg-[var(--color-bg-hover)] transition-colors">
                                    <td className="px-4 py-3 text-sm font-medium text-[var(--color-text-primary)]">
                                        PO-{order.id.toString().padStart(4, '0')}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-[var(--color-text-secondary)]">
                                        {order.supplier_name}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-[var(--color-text-secondary)]">
                                        {formatDate(order.order_date)}
                                    </td>
                                    <td className="px-4 py-3">
                                        <span
                                            className={cn(
                                                'px-2 py-0.5 rounded-full text-xs font-medium capitalize',
                                                getStatusColor(order.status),
                                            )}
                                        >
                                            {order.status}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-sm font-semibold text-right text-[var(--color-text-primary)]">
                                        {formatCurrency(order.total_amount)}
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <div className="flex items-center justify-center gap-2">
                                            <button
                                                onClick={() => setViewedOrder(order.id)}
                                                className="p-1.5 rounded-[var(--radius-sm)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-active)] hover:text-[var(--color-text-primary)]"
                                                title={t('purchases.view_details')}
                                            >
                                                <Eye size={16} />
                                            </button>
                                            {order.status === 'ordered' || order.status === 'pending' ? (
                                                <button
                                                    onClick={() => receiveOrder(order.id)}
                                                    className="p-1.5 rounded-[var(--radius-sm)] text-[var(--color-success)] hover:bg-[var(--color-success-muted)]"
                                                    title={t('purchases.receive_items')}
                                                >
                                                    <CheckCircle size={16} />
                                                </button>
                                            ) : null}
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>

                {/* Pagination */}
                <div className="px-4">
                    <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        totalItems={orders.length}
                        startIndex={startIndex}
                        endIndex={endIndex}
                        onPageChange={setCurrentPage}
                        itemLabel={t('purchases.title')}
                    />
                </div>
            </div>

            {/* New Order Modal */}
            <Dialog
                open={isNewOrderOpen}
                onOpenChange={(open) => {
                    if (!open) {
                        setIsNewOrderOpen(false);
                        resetForm();
                    }
                }}
            >
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{t('purchases.create_order')}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs font-medium text-[var(--color-text-secondary)] mb-1.5 block">
                                    {t('purchases.label_supplier')}
                                </label>
                                <Select
                                    value={selectedSupplier ? String(selectedSupplier) : ''}
                                    onValueChange={(v) => setSelectedSupplier(v ? Number(v) : '')}
                                >
                                    <SelectTrigger className="w-full h-11 rounded-[var(--radius-md)] bg-[var(--color-bg-input)] border border-[var(--color-border)] text-sm font-medium !ring-0">
                                        <SelectValue placeholder={t('purchases.select_supplier')} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {suppliers.map((s) => (
                                            <SelectItem key={s.id} value={String(s.id)}>
                                                {s.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <label className="text-xs font-medium text-[var(--color-text-secondary)] mb-1.5 block">
                                    {t('purchases.label_notes')}
                                </label>
                                <input
                                    type="text"
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    placeholder={t('purchases.notes_placeholder')}
                                    className="w-full px-3 py-2.5 rounded-[var(--radius-md)] bg-[var(--color-bg-input)] border border-[var(--color-border)] text-sm focus:border-[var(--color-accent)] focus:outline-none"
                                />
                            </div>
                        </div>

                        {/* Product Search */}
                        <div className="relative">
                            <SearchInput
                                value={itemSearch}
                                onChange={setItemSearch}
                                placeholder={t('purchases.search_products')}
                            />
                            {itemSearch && filteredProducts.length > 0 && (
                                <div className="absolute top-full left-0 right-0 z-10 mt-1 max-h-48 overflow-y-auto bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-[var(--radius-md)] shadow-lg">
                                    {filteredProducts.map((p) => (
                                        <button
                                            key={p.id}
                                            onClick={() => handleAddItem(p)}
                                            className="w-full text-left px-3 py-2 text-sm hover:bg-[var(--color-bg-hover)] text-[var(--color-text-primary)]"
                                        >
                                            <span className="font-medium">{p.name}</span>
                                            <span className="text-[var(--color-text-muted)] ml-2 text-xs">
                                                {t('purchases.stock_label', { count: p.stock_quantity })}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Items List */}
                        <div className="min-h-[200px] border border-[var(--color-border)] rounded-[var(--radius-md)] overflow-hidden">
                            <table className="w-full">
                                <thead className="bg-[var(--color-bg-secondary)]">
                                    <tr>
                                        <th className="px-3 py-2 text-left text-xs font-semibold text-[var(--color-text-muted)]">
                                            {t('purchases.col_product')}
                                        </th>
                                        <th className="px-3 py-2 text-right text-xs font-semibold text-[var(--color-text-muted)] w-24">
                                            {t('purchases.col_quantity')}
                                        </th>
                                        <th className="px-3 py-2 text-right text-xs font-semibold text-[var(--color-text-muted)] w-32">
                                            {t('purchases.col_unit_cost')}
                                        </th>
                                        <th className="px-3 py-2 text-right text-xs font-semibold text-[var(--color-text-muted)] w-32">
                                            {t('purchases.col_line_total')}
                                        </th>
                                        <th className="px-3 py-2 w-10"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[var(--color-border)]">
                                    {orderItems.map((item) => (
                                        <tr key={item.product.id}>
                                            <td className="px-3 py-2 text-sm">{item.product.name}</td>
                                            <td className="px-3 py-2">
                                                <input
                                                    type="number"
                                                    min="1"
                                                    value={item.quantity}
                                                    onChange={(e) =>
                                                        updateItem(item.product.id, 'quantity', Number(e.target.value))
                                                    }
                                                    className="w-full bg-transparent text-right focus:outline-none"
                                                />
                                            </td>
                                            <td className="px-3 py-2">
                                                <input
                                                    type="number"
                                                    min="0"
                                                    step="0.01"
                                                    value={item.cost}
                                                    onChange={(e) =>
                                                        updateItem(item.product.id, 'cost', Number(e.target.value))
                                                    }
                                                    className="w-full bg-transparent text-right focus:outline-none"
                                                />
                                            </td>
                                            <td className="px-3 py-2 text-right text-sm">
                                                {formatCurrency(item.quantity * item.cost)}
                                            </td>
                                            <td className="px-3 py-2 text-center">
                                                <button
                                                    onClick={() => removeItem(item.product.id)}
                                                    className="text-[var(--color-text-muted)] hover:text-[var(--color-danger)]"
                                                >
                                                    <XCircle size={16} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    {orderItems.length === 0 && (
                                        <tr>
                                            <td
                                                colSpan={5}
                                                className="py-8 text-center text-sm text-[var(--color-text-muted)]"
                                            >
                                                {t('purchases.empty_items')}
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                                {orderItems.length > 0 && (
                                    <tfoot className="bg-[var(--color-bg-secondary)] font-semibold">
                                        <tr>
                                            <td colSpan={3} className="px-3 py-2 text-right text-sm">
                                                {t('purchases.total')}
                                            </td>
                                            <td className="px-3 py-2 text-right text-sm">
                                                {formatCurrency(
                                                    orderItems.reduce((s, i) => s + i.quantity * i.cost, 0),
                                                )}
                                            </td>
                                            <td></td>
                                        </tr>
                                    </tfoot>
                                )}
                            </table>
                        </div>

                        <div className="flex justify-end gap-3">
                            <Button
                                variant="secondary"
                                onClick={() => {
                                    setIsNewOrderOpen(false);
                                    resetForm();
                                }}
                            >
                                {t('purchases.cancel')}
                            </Button>
                            <Button onClick={handleSubmitOrder} disabled={!selectedSupplier || orderItems.length === 0}>
                                {t('purchases.create')}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* View Order Modal */}
            {viewedOrder && activeOrder && (
                <Dialog
                    open={true}
                    onOpenChange={(open) => {
                        if (!open) setViewedOrder(null);
                    }}
                >
                    <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>{t('purchases.order_details', { id: activeOrder.id })}</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-6">
                            <div className="flex justify-between items-start p-4 bg-[var(--color-bg-secondary)] rounded-[var(--radius-md)]">
                                <div>
                                    <p className="text-xs text-[var(--color-text-muted)] uppercase">
                                        {t('purchases.label_supplier')}
                                    </p>
                                    <p className="font-semibold text-lg">{activeOrder.supplier_name}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs text-[var(--color-text-muted)] uppercase">
                                        {t('purchases.col_date')}
                                    </p>
                                    <p className="font-semibold">{formatDate(activeOrder.order_date)}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs text-[var(--color-text-muted)] uppercase">
                                        {t('purchases.col_status')}
                                    </p>
                                    <span
                                        className={cn(
                                            'px-2 py-0.5 rounded-full text-xs font-medium capitalize',
                                            getStatusColor(activeOrder.status),
                                        )}
                                    >
                                        {activeOrder.status}
                                    </span>
                                </div>
                            </div>

                            <div>
                                <h3 className="font-semibold text-sm mb-2">{t('purchases.order_items')}</h3>
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b border-[var(--color-border)]">
                                            <th className="text-left py-2 text-xs font-medium text-[var(--color-text-muted)]">
                                                {t('purchases.col_product')}
                                            </th>
                                            <th className="text-right py-2 text-xs font-medium text-[var(--color-text-muted)]">
                                                {t('purchases.col_quantity')}
                                            </th>
                                            <th className="text-right py-2 text-xs font-medium text-[var(--color-text-muted)]">
                                                {t('purchases.col_unit_cost')}
                                            </th>
                                            <th className="text-right py-2 text-xs font-medium text-[var(--color-text-muted)]">
                                                {t('purchases.col_line_total')}
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[var(--color-border)]">
                                        {currentOrderItems.map((item) => (
                                            <tr key={item.id}>
                                                <td className="py-2 text-sm">{item.product_name}</td>
                                                <td className="py-2 text-right text-sm">{item.quantity}</td>
                                                <td className="py-2 text-right text-sm">
                                                    {formatCurrency(item.unit_cost)}
                                                </td>
                                                <td className="py-2 text-right text-sm font-medium">
                                                    {formatCurrency(item.total_cost)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot>
                                        <tr className="border-t border-[var(--color-border)]">
                                            <td colSpan={3} className="py-2 text-right font-bold text-sm">
                                                {t('purchases.total')}
                                            </td>
                                            <td className="py-2 text-right font-bold text-sm text-[var(--color-accent)]">
                                                {formatCurrency(activeOrder.total_amount)}
                                            </td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>

                            <div className="flex justify-end pt-4 border-t border-[var(--color-border)]">
                                <Button variant="secondary" onClick={() => setViewedOrder(null)}>
                                    {t('purchases.close')}
                                </Button>
                                {activeOrder.status !== 'received' && activeOrder.status !== 'cancelled' && (
                                    <Button
                                        className="ml-3"
                                        onClick={() => {
                                            receiveOrder(activeOrder.id);
                                            setViewedOrder(null);
                                        }}
                                        icon={<CheckCircle size={16} />}
                                    >
                                        {t('purchases.receive_order')}
                                    </Button>
                                )}
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
            )}
        </div>
    );
}
