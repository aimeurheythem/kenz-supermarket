import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Plus,
    Edit2,
    Trash2,
    Truck,
    Phone,
    Mail,
    MapPin,
    MoreHorizontal,
    User,
    Save,
    CreditCard,
    Banknote,
    Search,
    X,
    Package,
    AlertTriangle,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn, formatCurrency } from '@/lib/utils';
import { useSupplierStore } from '@/stores/useSupplierStore';
import Button from '@/components/common/Button';
import { FormModal } from '@/components/common/FormModal';
import { DeleteConfirmModal } from '@/components/common/DeleteConfirmModal';
import type { Supplier, SupplierInput } from '@/lib/types';
import { usePageTitle } from '@/hooks/usePageTitle';

const defaultForm: SupplierInput = {
    name: '',
    contact_person: '',
    phone: '',
    email: '',
    address: '',
};

export default function Suppliers() {
    const {
        items: suppliers,
        loadSuppliers,
        addSupplier,
        updateSupplier,
        deleteSupplier,
        addPayment,
    } = useSupplierStore();
    const { t } = useTranslation();
    usePageTitle(t('sidebar.suppliers'));
    const [search, setSearch] = useState('');
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
    const [form, setForm] = useState<SupplierInput>(defaultForm);
    const [activeMenu, setActiveMenu] = useState<number | null>(null);
    const [isPaymentOpen, setIsPaymentOpen] = useState(false);
    const [paymentAmount, setPaymentAmount] = useState('');
    const [selectedSupplierForPayment, setSelectedSupplierForPayment] = useState<Supplier | null>(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [supplierToDelete, setSupplierToDelete] = useState<Supplier | null>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        loadSuppliers();
    }, [loadSuppliers]);

    const filtered = suppliers.filter(
        (s) =>
            !search ||
            s.name.toLowerCase().includes(search.toLowerCase()) ||
            s.contact_person.toLowerCase().includes(search.toLowerCase()) ||
            s.email.toLowerCase().includes(search.toLowerCase()),
    );

    const totalBalance = suppliers.reduce((sum, s) => sum + s.balance, 0);
    const suppliersWithDebt = suppliers.filter((s) => s.balance > 0).length;

    const handleEdit = (supplier: Supplier) => {
        setEditingSupplier(supplier);
        setForm({
            name: supplier.name,
            contact_person: supplier.contact_person,
            phone: supplier.phone,
            email: supplier.email,
            address: supplier.address,
        });
        setIsFormOpen(true);
        setActiveMenu(null);
    };

    const handleDelete = (id: number) => {
        const supplier = suppliers.find((s) => s.id === id);
        if (supplier) {
            setSupplierToDelete(supplier);
            setIsDeleteModalOpen(true);
        }
        setActiveMenu(null);
    };

    const confirmDelete = () => {
        if (supplierToDelete) {
            deleteSupplier(supplierToDelete.id);
            setIsDeleteModalOpen(false);
            setSupplierToDelete(null);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.name.trim()) return;
        if (editingSupplier) {
            updateSupplier(editingSupplier.id, form);
        } else {
            addSupplier(form);
        }
        setIsFormOpen(false);
        setEditingSupplier(null);
        setForm(defaultForm);
    };

    const handleOpenPayment = (supplier: Supplier) => {
        setSelectedSupplierForPayment(supplier);
        setPaymentAmount('');
        setIsPaymentOpen(true);
        setActiveMenu(null);
    };

    const handlePaymentSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedSupplierForPayment || !paymentAmount) return;
        addPayment(selectedSupplierForPayment.id, Number(paymentAmount));
        setIsPaymentOpen(false);
        setSelectedSupplierForPayment(null);
        setPaymentAmount('');
    };

    const handleCloseForm = () => {
        setIsFormOpen(false);
        setEditingSupplier(null);
        setForm(defaultForm);
    };

    const inputClass = cn(
        'w-full h-14 px-5 rounded-xl bg-zinc-50 border border-zinc-200 font-bold text-black outline-none transition-all placeholder:text-zinc-400 focus:border-zinc-400 focus:bg-white',
    );
    const labelClass = 'text-[10px] font-black text-zinc-400 uppercase tracking-[0.15em] ml-1 mb-1.5 block';

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
                                {t('sidebar.suppliers')}
                            </span>
                            <h2 className="text-3xl font-black text-black tracking-tighter uppercase">
                                {t('suppliers.title')}
                            </h2>
                        </div>
                        <button
                            onClick={() => setIsFormOpen(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-md border border-black shadow-lg shadow-black/20 hover:bg-neutral-800 transition-all active:scale-95"
                        >
                            <Plus size={16} />
                            <span className="text-[10px] font-black uppercase tracking-widest">
                                {t('suppliers.add_supplier')}
                            </span>
                        </button>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    {/* Total Suppliers */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-yellow-300 border-2 border-black/10 flex flex-col justify-between aspect-[2/1] md:aspect-auto md:h-36 p-5 rounded-[2rem] relative overflow-hidden group cursor-pointer"
                    >
                        <div className="flex items-center justify-between relative z-10">
                            <span className="text-[10px] font-bold text-black/60 uppercase tracking-widest">
                                {t('suppliers.stat_total')}
                            </span>
                            <div className="p-2 bg-black/5 rounded-full">
                                <Truck size={14} className="text-black" />
                            </div>
                        </div>
                        <div className="relative z-10">
                            <span className="text-2xl font-black text-black tracking-tighter">
                                {suppliers.length.toLocaleString()}
                            </span>
                        </div>
                    </motion.div>

                    {/* Total Balance */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.05 }}
                        className="bg-black text-white flex flex-col justify-between aspect-[2/1] md:aspect-auto md:h-36 p-5 rounded-[2rem] relative overflow-hidden group cursor-pointer"
                    >
                        <div className="absolute top-0 right-0 p-16 bg-zinc-800 rounded-full blur-2xl opacity-20 -translate-y-1/2 translate-x-1/2" />
                        <div className="flex items-center justify-between relative z-10">
                            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                                {t('suppliers.stat_balance')}
                            </span>
                            <div className="p-2 bg-white/10 rounded-full">
                                <Banknote size={14} className="text-white" />
                            </div>
                        </div>
                        <div className="relative z-10">
                            <span className="text-2xl font-black text-white tracking-tighter">
                                {formatCurrency(totalBalance, false)}
                            </span>
                        </div>
                    </motion.div>

                    {/* Suppliers with Debt */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="bg-rose-100 border-2 border-rose-200 flex flex-col justify-between aspect-[2/1] md:aspect-auto md:h-36 p-5 rounded-[2rem] relative overflow-hidden group cursor-pointer"
                    >
                        <div className="flex items-center justify-between relative z-10">
                            <span className="text-[10px] font-bold text-rose-900/60 uppercase tracking-widest">
                                {t('suppliers.stat_debt')}
                            </span>
                            <div className="p-2 bg-rose-900/10 rounded-full">
                                <AlertTriangle size={14} className="text-rose-900" />
                            </div>
                        </div>
                        <div className="relative z-10">
                            <div className="flex items-baseline gap-1">
                                <span className="text-2xl font-black text-rose-900 tracking-tighter">
                                    {suppliersWithDebt}
                                </span>
                                <span className="text-[10px] font-bold text-rose-900/60 uppercase">Suppliers</span>
                            </div>
                        </div>
                    </motion.div>

                    {/* Active Suppliers */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.15 }}
                        className="bg-white border-2 border-black/10 flex flex-col justify-between aspect-[2/1] md:aspect-auto md:h-36 p-5 rounded-[2rem] relative overflow-hidden group cursor-pointer"
                    >
                        <div className="flex items-center justify-between relative z-10">
                            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                                {t('suppliers.stat_active')}
                            </span>
                            <div className="p-2 bg-zinc-100 rounded-full">
                                <Package size={14} className="text-black" />
                            </div>
                        </div>
                        <div className="relative z-10">
                            <div className="flex items-baseline gap-1">
                                <span className="text-2xl font-black text-black tracking-tighter">
                                    {suppliers.length - suppliersWithDebt}
                                </span>
                                <span className="text-[10px] font-bold text-zinc-400 uppercase">Cleared</span>
                            </div>
                        </div>
                    </motion.div>
                </div>

                {/* Search Bar */}
                <div className="relative group mb-8">
                    <Search
                        size={22}
                        className="absolute left-6 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-black transition-colors"
                    />
                    <input
                        ref={searchInputRef}
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder={t('suppliers.search_placeholder')}
                        className={cn(
                            'w-full pl-16 pr-16 py-5 rounded-[2.5rem]',
                            'bg-white border border-zinc-200 shadow-none',
                            'text-black placeholder:text-zinc-300 text-lg font-bold',
                            'focus:outline-none focus:ring-0 focus:!outline-none focus-visible:!outline-none focus-visible:ring-0 focus:border-zinc-400 transition-all placeholder:transition-opacity focus:placeholder:opacity-50',
                        )}
                    />
                    {search && (
                        <motion.button
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            onClick={() => {
                                setSearch('');
                                searchInputRef.current?.focus();
                            }}
                            className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-zinc-100 text-zinc-400 hover:bg-black hover:text-white transition-all duration-300"
                        >
                            <X size={16} strokeWidth={3} />
                        </motion.button>
                    )}
                </div>

                {/* Supplier Cards Grid */}
                {filtered.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 rounded-[2rem] bg-white border border-zinc-200">
                        <Truck size={48} className="text-zinc-200 mb-4" />
                        <p className="text-lg font-bold text-zinc-400">
                            {search ? t('suppliers.no_match') : t('suppliers.no_suppliers')}
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filtered.map((supplier) => (
                            <div
                                key={supplier.id}
                                className="rounded-[2rem] p-5 relative group bg-white border border-zinc-200 hover:border-zinc-300 transition-all duration-300"
                            >
                                {/* Header */}
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-zinc-100 flex items-center justify-center">
                                            <Truck size={18} className="text-zinc-500" />
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-bold text-black">{supplier.name}</h3>
                                            {supplier.contact_person && (
                                                <p className="text-[10px] text-zinc-400 flex items-center gap-1 mt-0.5">
                                                    <User size={10} /> {supplier.contact_person}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="relative">
                                        <button
                                            onClick={() =>
                                                setActiveMenu(activeMenu === supplier.id ? null : supplier.id)
                                            }
                                            className="p-1.5 rounded-lg text-zinc-400 hover:text-black hover:bg-zinc-100 transition-colors opacity-0 group-hover:opacity-100"
                                        >
                                            <MoreHorizontal size={16} />
                                        </button>

                                        <AnimatePresence>
                                            {activeMenu === supplier.id && (
                                                <motion.div
                                                    initial={{ opacity: 0, scale: 0.95, y: -5 }}
                                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                                    exit={{ opacity: 0, scale: 0.95, y: -5 }}
                                                    className="absolute right-0 top-full mt-1 z-20 w-36 rounded-xl bg-white border border-zinc-200 shadow-xl py-1"
                                                >
                                                    <button
                                                        onClick={() => handleOpenPayment(supplier)}
                                                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-zinc-600 hover:bg-zinc-50 hover:text-black transition-colors"
                                                    >
                                                        <CreditCard size={13} /> {t('suppliers.menu_pay')}
                                                    </button>
                                                    <button
                                                        onClick={() => handleEdit(supplier)}
                                                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-zinc-600 hover:bg-zinc-50 hover:text-black transition-colors"
                                                    >
                                                        <Edit2 size={13} /> {t('suppliers.menu_edit')}
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(supplier.id)}
                                                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-rose-500 hover:bg-rose-50 transition-colors"
                                                    >
                                                        <Trash2 size={13} /> {t('suppliers.menu_delete')}
                                                    </button>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                </div>

                                {/* Contact Details */}
                                <div className="space-y-2">
                                    {supplier.phone && (
                                        <div className="flex items-center gap-2 text-xs text-zinc-500">
                                            <Phone size={12} className="text-zinc-300" />
                                            {supplier.phone}
                                        </div>
                                    )}
                                    {supplier.email && (
                                        <div className="flex items-center gap-2 text-xs text-zinc-500">
                                            <Mail size={12} className="text-zinc-300" />
                                            {supplier.email}
                                        </div>
                                    )}
                                    {supplier.address && (
                                        <div className="flex items-center gap-2 text-xs text-zinc-500">
                                            <MapPin size={12} className="text-zinc-300" />
                                            {supplier.address}
                                        </div>
                                    )}
                                    <div className="pt-2 mt-2 border-t border-zinc-100 flex justify-between items-center">
                                        <span className="text-[10px] text-zinc-400 uppercase tracking-widest font-bold">
                                            {t('suppliers.balance')}
                                        </span>
                                        <span
                                            className={cn(
                                                'text-sm font-black',
                                                supplier.balance > 0 ? 'text-rose-500' : 'text-emerald-500',
                                            )}
                                        >
                                            {formatCurrency(supplier.balance)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Close dropdown when clicking outside */}
                {activeMenu !== null && <div className="fixed inset-0 z-10" onClick={() => setActiveMenu(null)} />}
            </div>

            {/* Supplier Form Modal */}
            <FormModal
                isOpen={isFormOpen}
                onClose={handleCloseForm}
                title={editingSupplier ? t('suppliers.form_edit_title') : t('suppliers.form_add_title')}
                description={
                    editingSupplier ? t('suppliers.form_edit_description') : t('suppliers.form_add_description')
                }
                icon={<Truck size={24} strokeWidth={1.5} />}
            >
                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label className={labelClass}>{t('suppliers.label_name')} *</label>
                        <input
                            type="text"
                            value={form.name}
                            onChange={(e) => setForm({ ...form, name: e.target.value })}
                            placeholder={t('suppliers.placeholder_name')}
                            className={inputClass}
                            required
                            autoFocus
                        />
                    </div>
                    <div>
                        <label className={labelClass}>{t('suppliers.label_contact')}</label>
                        <div className="relative">
                            <User
                                size={18}
                                className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-300"
                                strokeWidth={1.5}
                            />
                            <input
                                type="text"
                                value={form.contact_person || ''}
                                onChange={(e) => setForm({ ...form, contact_person: e.target.value })}
                                placeholder={t('suppliers.placeholder_contact')}
                                className={inputClass + ' pl-12'}
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className={labelClass}>{t('suppliers.label_phone')}</label>
                            <div className="relative">
                                <Phone
                                    size={18}
                                    className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-300"
                                    strokeWidth={1.5}
                                />
                                <input
                                    type="tel"
                                    value={form.phone || ''}
                                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                                    placeholder={t('suppliers.placeholder_phone')}
                                    className={inputClass + ' pl-12'}
                                />
                            </div>
                        </div>
                        <div>
                            <label className={labelClass}>{t('suppliers.label_email')}</label>
                            <div className="relative">
                                <Mail
                                    size={18}
                                    className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-300"
                                    strokeWidth={1.5}
                                />
                                <input
                                    type="email"
                                    value={form.email || ''}
                                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                                    placeholder={t('suppliers.placeholder_email')}
                                    className={inputClass + ' pl-12'}
                                />
                            </div>
                        </div>
                    </div>
                    <div>
                        <label className={labelClass}>{t('suppliers.label_address')}</label>
                        <div className="relative">
                            <MapPin
                                size={18}
                                className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-300"
                                strokeWidth={1.5}
                            />
                            <input
                                type="text"
                                value={form.address || ''}
                                onChange={(e) => setForm({ ...form, address: e.target.value })}
                                placeholder={t('suppliers.placeholder_address')}
                                className={inputClass + ' pl-12'}
                            />
                        </div>
                    </div>
                    <div className="flex items-center justify-end gap-3 pt-5 mt-2 border-t border-zinc-100">
                        <Button
                            variant="ghost"
                            onClick={handleCloseForm}
                            className="flex-1 h-12 rounded-xl font-black uppercase tracking-widest text-[10px] transition-all hover:bg-zinc-100 text-zinc-400 hover:text-black"
                        >
                            {t('suppliers.cancel')}
                        </Button>
                        <Button
                            type="submit"
                            icon={<Save size={16} />}
                            className="flex-[2] h-12 rounded-xl bg-yellow-400 text-black font-black uppercase tracking-widest text-[10px] transition-all hover:bg-yellow-500 flex items-center justify-center gap-2 shadow-lg shadow-yellow-400/20 border-none"
                        >
                            {editingSupplier ? t('suppliers.update_supplier') : t('suppliers.save_supplier')}
                        </Button>
                    </div>
                </form>
            </FormModal>

            {/* Payment Modal */}
            <FormModal
                isOpen={isPaymentOpen}
                onClose={() => setIsPaymentOpen(false)}
                title={t('suppliers.payment_title')}
                description={t('suppliers.payment_description')}
                icon={<CreditCard size={24} strokeWidth={1.5} />}
                maxWidth="max-w-md"
            >
                <form onSubmit={handlePaymentSubmit} className="space-y-5">
                    <div className="p-4 bg-zinc-50 rounded-xl border border-zinc-200 space-y-1">
                        <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                            {t('suppliers.current_balance')}
                        </span>
                        <div className="text-xl font-black text-black">
                            {selectedSupplierForPayment
                                ? formatCurrency(selectedSupplierForPayment.balance)
                                : formatCurrency(0)}
                        </div>
                    </div>
                    <div>
                        <label className={labelClass}>{t('suppliers.payment_label')}</label>
                        <div className="relative">
                            <Banknote
                                size={18}
                                className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-300"
                                strokeWidth={1.5}
                            />
                            <input
                                type="number"
                                step="0.01"
                                min="0.01"
                                value={paymentAmount}
                                onChange={(e) => setPaymentAmount(e.target.value)}
                                placeholder="0.00"
                                className={inputClass + ' pl-12'}
                                required
                                autoFocus
                            />
                        </div>
                    </div>
                    <div className="flex items-center justify-end gap-3 pt-5 border-t border-zinc-100">
                        <Button
                            variant="ghost"
                            onClick={() => setIsPaymentOpen(false)}
                            className="flex-1 h-12 rounded-xl text-zinc-400 font-bold uppercase text-[10px] tracking-widest"
                        >
                            {t('suppliers.cancel')}
                        </Button>
                        <Button
                            type="submit"
                            icon={<CreditCard size={15} />}
                            className="flex-[2] h-12 rounded-xl bg-yellow-400 text-black font-bold uppercase text-[10px] tracking-widest shadow-lg shadow-yellow-400/20 border-none"
                        >
                            {t('suppliers.confirm_payment')}
                        </Button>
                    </div>
                </form>
            </FormModal>

            {/* Global Delete Confirmation Modal */}
            <DeleteConfirmModal
                isOpen={isDeleteModalOpen}
                onClose={() => {
                    setIsDeleteModalOpen(false);
                    setSupplierToDelete(null);
                }}
                onConfirm={confirmDelete}
                title={t('suppliers.delete_title')}
                description={t('suppliers.delete_description', { name: supplierToDelete?.name })}
                itemName={supplierToDelete?.name}
            />
        </div>
    );
}
