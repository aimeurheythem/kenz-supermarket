import { useState, useEffect } from 'react';
import { useCustomerStore } from '@/stores/useCustomerStore';
import { useTranslation } from 'react-i18next';
import { Search, Plus, Trash2, Edit, Phone, Mail, MapPin, Award } from 'lucide-react';
import Button from '@/components/common/Button';
import { DeleteConfirmModal } from '@/components/common/DeleteConfirmModal';
import CustomerModal from '@/components/customers/CustomerModal';
import Pagination from '@/components/common/Pagination';
import { usePagination } from '@/hooks/usePagination';
import { cn, formatCurrency } from '@/lib/utils';
import type { Customer } from '@/lib/types';
import { TableSkeletonRows } from '@/components/common/TableSkeleton';
import { usePageTitle } from '@/hooks/usePageTitle';

export default function Customers() {
    const { t } = useTranslation();
    usePageTitle(t('sidebar.customers'));
    const { customers, loadCustomers, deleteCustomer, isLoadingCustomers } = useCustomerStore();
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<number | null>(null);

    useEffect(() => {
        loadCustomers();
    }, [loadCustomers]);

    const filteredCustomers = customers.filter(
        (c) =>
            c.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.phone?.includes(searchTerm) ||
            c.email?.toLowerCase().includes(searchTerm.toLowerCase()),
    );

    const { currentPage, totalPages, startIndex, endIndex, setCurrentPage, paginate, resetPage } = usePagination({
        totalItems: filteredCustomers.length,
    });

    // Reset page when search changes
    useEffect(() => {
        resetPage();
    }, [searchTerm, resetPage]);

    const paginatedCustomers = paginate(filteredCustomers);

    const handleDelete = (id: number) => {
        setDeleteTarget(id);
    };

    const confirmDelete = async () => {
        if (deleteTarget !== null) {
            await deleteCustomer(deleteTarget);
        }
        setDeleteTarget(null);
    };

    return (
        <div className="space-y-6 animate-fadeIn pb-10">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-[var(--color-text-primary)] tracking-tight">
                        {t('customers.title')}
                    </h1>
                    <p className="text-[var(--color-text-muted)] text-sm mt-1">{t('customers.subtitle')}</p>
                </div>
                <Button
                    className="btn-page-action"
                    icon={<Plus size={18} />}
                    onClick={() => {
                        setSelectedCustomer(null);
                        setIsModalOpen(true);
                    }}
                >
                    {t('customers.add_customer')}
                </Button>
            </div>

            {/* Content */}
            <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl overflow-hidden shadow-sm">
                {/* Toolbar */}
                <div className="p-4 border-b border-[var(--color-border)] flex items-center gap-4 bg-[var(--color-bg-secondary)]">
                    <div className="relative flex-1 max-w-md">
                        <Search
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]"
                            size={14}
                        />
                        <input
                            type="text"
                            placeholder={t('customers.search_placeholder')}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-[var(--color-bg-input)] border border-[var(--color-border)] rounded-lg pl-9 pr-3 py-2 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-placeholder)] focus:outline-none focus:border-[var(--color-border-hover)] transition-colors"
                        />
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-[var(--color-bg-secondary)] text-[var(--color-text-muted)] border-b border-[var(--color-border)]">
                            <tr>
                                <th className="px-6 py-3 font-medium text-xs uppercase tracking-wider">
                                    {t('customers.col_customer')}
                                </th>
                                <th className="px-6 py-3 font-medium text-xs uppercase tracking-wider">
                                    {t('customers.col_contact')}
                                </th>
                                <th className="px-6 py-3 font-medium text-xs uppercase tracking-wider">
                                    {t('customers.col_loyalty')}
                                </th>
                                <th className="px-6 py-3 font-medium text-xs uppercase tracking-wider">
                                    {t('customers.col_debt')}
                                </th>
                                <th className="px-6 py-3 font-medium text-xs uppercase tracking-wider text-right">
                                    {t('customers.col_actions')}
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--color-border)]">
                            {isLoadingCustomers ? (
                                <TableSkeletonRows columns={5} rows={5} />
                            ) : filteredCustomers.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-[var(--color-text-muted)]">
                                        No customers found.
                                    </td>
                                </tr>
                            ) : (
                                paginatedCustomers.map((customer) => (
                                    <tr
                                        key={customer.id}
                                        className="group hover:bg-[var(--color-bg-hover)] transition-colors"
                                    >
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-[var(--color-bg-tertiary)] flex items-center justify-center text-xs font-bold text-[var(--color-text-secondary)]">
                                                    {customer.full_name.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="text-[var(--color-text-primary)] font-medium">
                                                        {customer.full_name}
                                                    </p>
                                                    {customer.address && (
                                                        <div className="flex items-center gap-1 text-[var(--color-text-muted)] text-xs mt-0.5">
                                                            <MapPin size={10} />
                                                            <span className="truncate max-w-[150px]">
                                                                {customer.address}
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col gap-1">
                                                {customer.phone && (
                                                    <div className="flex items-center gap-1.5 text-[var(--color-text-secondary)] text-xs">
                                                        <Phone size={12} className="text-[var(--color-text-muted)]" />
                                                        <span>{customer.phone}</span>
                                                    </div>
                                                )}
                                                {customer.email && (
                                                    <div className="flex items-center gap-1.5 text-[var(--color-text-muted)] text-xs">
                                                        <Mail size={12} className="text-[var(--color-text-muted)]" />
                                                        <span>{customer.email}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <Award size={16} className="text-yellow-500" />
                                                <span className="text-[var(--color-text-primary)] font-medium">
                                                    {customer.loyalty_points}
                                                </span>
                                                <span className="text-[var(--color-text-muted)] text-xs">
                                                    {t('customers.pts')}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span
                                                className={cn(
                                                    'font-bold',
                                                    (customer.total_debt || 0) > 0
                                                        ? 'text-red-500'
                                                        : 'text-[var(--color-text-muted)]',
                                                )}
                                            >
                                                {formatCurrency(customer.total_debt || 0)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => {
                                                        setSelectedCustomer(customer);
                                                        setIsModalOpen(true);
                                                    }}
                                                    className="p-2 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-hover)] rounded-lg transition-colors"
                                                >
                                                    <Edit size={14} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(customer.id)}
                                                    className="p-2 text-[var(--color-text-muted)] hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="px-4">
                    <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        totalItems={filteredCustomers.length}
                        startIndex={startIndex}
                        endIndex={endIndex}
                        onPageChange={setCurrentPage}
                        itemLabel={t('customers.title')}
                    />
                </div>
            </div>

            {/* Customer Modal */}
            <CustomerModal
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false);
                    setSelectedCustomer(null);
                }}
                customer={selectedCustomer}
            />

            <DeleteConfirmModal
                isOpen={deleteTarget !== null}
                onClose={() => setDeleteTarget(null)}
                onConfirm={confirmDelete}
                title={t('customers.delete_title')}
                description={t('customers.delete_description')}
            />
        </div>
    );
}
