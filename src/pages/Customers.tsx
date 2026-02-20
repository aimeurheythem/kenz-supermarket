import { useState, useEffect, useRef } from 'react';
import { useCustomerStore } from '@/stores/useCustomerStore';
import { useTranslation } from 'react-i18next';
import { Search, Plus, Trash2, Edit, Phone, Mail, MapPin, Award, Users, UserCheck, Wallet, X } from 'lucide-react';
import { DeleteConfirmModal } from '@/components/common/DeleteConfirmModal';
import CustomerModal from '@/components/customers/CustomerModal';
import Pagination from '@/components/common/Pagination';
import { usePagination } from '@/hooks/usePagination';
import { cn, formatCurrency } from '@/lib/utils';
import type { Customer } from '@/lib/types';
import { TableSkeletonRows } from '@/components/common/TableSkeleton';
import { usePageTitle } from '@/hooks/usePageTitle';
import { motion, AnimatePresence } from 'framer-motion';

export default function Customers() {
    const { t } = useTranslation();
    usePageTitle(t('sidebar.customers'));
    const { customers, loadCustomers, deleteCustomer, isLoadingCustomers } = useCustomerStore();
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<number | null>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);

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

    const totalCustomers = customers.length;
    const totalDebt = customers.reduce((sum, c) => sum + (c.total_debt || 0), 0);
    const totalPoints = customers.reduce((sum, c) => sum + (c.loyalty_points || 0), 0);

    return (
        <div className="relative flex flex-col items-start gap-8 p-6 lg:p-8 animate-fadeIn mt-4">
            {/* Grid Background */}
            <div
                className="absolute inset-0 pointer-events-none opacity-[0.15] rounded-[3rem]"
                style={{
                    backgroundImage: `linear-gradient(to right, rgba(0, 0, 0, 0.3) 1px, transparent 1px), linear-gradient(to bottom, rgba(0, 0, 0, 0.3) 1px, transparent 1px)`,
                    backgroundSize: '32px 32px',
                    maskImage: 'radial-gradient(circle at top center, black, transparent 90%)',
                    WebkitMaskImage: 'radial-gradient(circle at top center, black, transparent 90%)',
                }}
            />

            <div className="relative z-10 flex-1 flex flex-col min-w-0 w-full">
                {/* Header Section */}
                <div className="flex flex-col space-y-6 pb-6">
                    <div className="flex items-center justify-between">
                        <div className="flex flex-col gap-1">
                            <span className="text-[12px] text-zinc-400 tracking-[0.3em] font-bold">
                                {t('sidebar.customers')}
                            </span>
                            <h2 className="text-3xl font-black text-black tracking-tighter uppercase">
                                {t('customers.title')}
                            </h2>
                        </div>
                        <button
                            onClick={() => {
                                setSelectedCustomer(null);
                                setIsModalOpen(true);
                            }}
                            className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-md border border-black shadow-lg shadow-black/20 hover:bg-neutral-800 transition-all active:scale-95"
                        >
                            <Plus size={16} />
                            <span className="text-[10px] font-black uppercase tracking-widest">
                                {t('customers.add_customer')}
                            </span>
                        </button>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-yellow-300 border-2 border-black/10 flex flex-col justify-between aspect-[2/1] md:aspect-auto md:h-36 p-6 rounded-[3rem] relative overflow-hidden group cursor-pointer"
                    >
                        <div className="flex items-center justify-between relative z-10">
                            <span className="text-[10px] font-bold text-black/60 uppercase tracking-widest">
                                {t('customers.stat_total')}
                            </span>
                            <div className="p-2 bg-black/5 rounded-full">
                                <Users size={14} className="text-black" />
                            </div>
                        </div>
                        <div className="relative z-10">
                            <div className="flex items-baseline gap-1">
                                <span className="text-2xl font-black text-black tracking-tighter">
                                    {totalCustomers}
                                </span>
                                <span className="text-[10px] font-bold text-black/60 uppercase">Customers</span>
                            </div>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.05 }}
                        className="bg-rose-100 border-2 border-rose-200 flex flex-col justify-between aspect-[2/1] md:aspect-auto md:h-36 p-6 rounded-[3rem] relative overflow-hidden group cursor-pointer"
                    >
                        <div className="flex items-center justify-between relative z-10">
                            <span className="text-[10px] font-bold text-rose-900/60 uppercase tracking-widest">
                                {t('customers.stat_debt')}
                            </span>
                            <div className="p-2 bg-rose-900/10 rounded-full">
                                <Wallet size={14} className="text-rose-900" />
                            </div>
                        </div>
                        <div className="relative z-10">
                            <span className="text-2xl font-black text-rose-900 tracking-tighter">
                                {formatCurrency(totalDebt, false)}
                            </span>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="bg-white border-2 border-black/10 flex flex-col justify-between aspect-[2/1] md:aspect-auto md:h-36 p-6 rounded-[3rem] relative overflow-hidden group cursor-pointer"
                    >
                        <div className="flex items-center justify-between relative z-10">
                            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                                {t('customers.stat_points')}
                            </span>
                            <div className="p-2 bg-zinc-100 rounded-full">
                                <Award size={14} className="text-yellow-500" />
                            </div>
                        </div>
                        <div className="relative z-10">
                            <div className="flex items-baseline gap-1">
                                <span className="text-2xl font-black text-black tracking-tighter">
                                    {totalPoints.toLocaleString()}
                                </span>
                                <span className="text-[10px] font-bold text-zinc-400 uppercase">Points</span>
                            </div>
                        </div>
                    </motion.div>
                </div>

                {/* Search Bar */}
                <div className="relative group mb-6">
                    <Search
                        size={22}
                        className="absolute left-6 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-black transition-colors"
                    />
                    <input
                        ref={searchInputRef}
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder={t('customers.search_placeholder')}
                        className={cn(
                            'w-full pl-16 pr-16 py-4 rounded-2xl',
                            'bg-white border border-zinc-200 shadow-none',
                            'text-black placeholder:text-zinc-300 text-base font-bold',
                            'focus:outline-none focus:ring-0 focus:!outline-none focus-visible:!outline-none focus-visible:ring-0 focus:border-zinc-400 transition-all placeholder:transition-opacity focus:placeholder:opacity-50',
                        )}
                    />
                    {searchTerm && (
                        <motion.button
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            onClick={() => {
                                setSearchTerm('');
                                searchInputRef.current?.focus();
                            }}
                            className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-zinc-100 text-zinc-400 hover:bg-black hover:text-white transition-all duration-300"
                        >
                            <X size={16} strokeWidth={3} />
                        </motion.button>
                    )}
                </div>

                {/* Customers Table */}
                <div className="rounded-[3rem] bg-white border-2 border-black/5 overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-zinc-50 border-b border-zinc-100">
                            <tr>
                                <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">
                                    {t('customers.col_customer')}
                                </th>
                                <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">
                                    {t('customers.col_contact')}
                                </th>
                                <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">
                                    {t('customers.col_loyalty')}
                                </th>
                                <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">
                                    {t('customers.col_debt')}
                                </th>
                                <th className="px-6 py-4 text-right text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">
                                    {t('customers.col_actions')}
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-100">
                            {isLoadingCustomers ? (
                                <TableSkeletonRows columns={5} rows={5} />
                            ) : filteredCustomers.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-16">
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="w-12 h-12 bg-zinc-100 rounded-full flex items-center justify-center">
                                                <Users size={24} className="text-zinc-300" />
                                            </div>
                                            <p className="text-sm font-bold text-zinc-400">
                                                {t('customers.no_customers')}
                                            </p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                paginatedCustomers.map((customer) => (
                                    <tr key={customer.id} className="group hover:bg-zinc-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-zinc-100 flex items-center justify-center text-sm font-bold text-zinc-600">
                                                    {customer.full_name.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-black">{customer.full_name}</p>
                                                    {customer.address && (
                                                        <div className="flex items-center gap-1 text-zinc-400 text-xs mt-0.5">
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
                                                    <div className="flex items-center gap-1.5 text-zinc-600 text-xs">
                                                        <Phone size={12} className="text-zinc-300" />
                                                        <span>{customer.phone}</span>
                                                    </div>
                                                )}
                                                {customer.email && (
                                                    <div className="flex items-center gap-1.5 text-zinc-400 text-xs">
                                                        <Mail size={12} className="text-zinc-300" />
                                                        <span>{customer.email}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <div className="p-1.5 bg-yellow-100 rounded-lg">
                                                    <Award size={14} className="text-yellow-600" />
                                                </div>
                                                <span className="text-sm font-bold text-black">
                                                    {customer.loyalty_points}
                                                </span>
                                                <span className="text-[10px] text-zinc-400 font-bold uppercase">
                                                    {t('customers.pts')}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span
                                                className={cn(
                                                    'text-sm font-black',
                                                    (customer.total_debt || 0) > 0 ? 'text-rose-500' : 'text-zinc-400',
                                                )}
                                            >
                                                {formatCurrency(customer.total_debt || 0)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => {
                                                        setSelectedCustomer(customer);
                                                        setIsModalOpen(true);
                                                    }}
                                                    className="w-9 h-9 flex items-center justify-center rounded-xl bg-zinc-100 text-zinc-500 hover:bg-black hover:text-white transition-all"
                                                >
                                                    <Edit size={14} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(customer.id)}
                                                    className="w-9 h-9 flex items-center justify-center rounded-xl bg-zinc-100 text-zinc-500 hover:bg-rose-500 hover:text-white transition-all"
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

                    {/* Pagination */}
                    <div className="px-6 pb-6">
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
