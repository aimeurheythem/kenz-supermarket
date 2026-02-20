import { useState, useEffect } from 'react';
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
} from 'lucide-react';
import { cn, formatCurrency } from '@/lib/utils';
import { useSupplierStore } from '@/stores/useSupplierStore';
import SearchInput from '@/components/common/SearchInput';
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
    const { suppliers, loadSuppliers, addSupplier, updateSupplier, deleteSupplier, addPayment } = useSupplierStore();
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
        'w-full h-14 px-5 rounded-3xl bg-zinc-100/50 border border-zinc-200 font-bold text-black outline-none transition-all placeholder:text-zinc-300',
    );
    const labelClass = 'text-[10px] font-black text-zinc-400 uppercase tracking-[0.15em] ml-1 mb-1.5 block';

    return (
        <div className="space-y-5 animate-fadeIn">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">{t('suppliers.title')}</h1>
                    <p className="text-sm text-[var(--color-text-muted)] mt-1">
                        {t('suppliers.registered_count', { count: suppliers.length })}
                    </p>
                </div>
                <Button
                    className="bg-yellow-300 border-none rounded-[3rem] hover:bg-yellow-300"
                    onClick={() => setIsFormOpen(true)}
                    icon={<Plus size={16} />}
                >
                    {t('suppliers.add_supplier')}
                </Button>
            </div>

            {/* Search */}
            <SearchInput
                value={search}
                onChange={setSearch}
                placeholder={t('suppliers.search_placeholder')}
                className="w-72"
            />

            {/* Supplier Cards Grid */}
            {filtered.length === 0 ? (
                <div className="text-center py-16">
                    <Truck size={48} className="mx-auto text-[var(--color-text-muted)] mb-3" />
                    <p className="text-sm text-[var(--color-text-muted)]">
                        {search ? t('suppliers.no_match') : t('suppliers.no_suppliers')}
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filtered.map((supplier) => (
                        <div
                            key={supplier.id}
                            className={cn(
                                'rounded-[var(--radius-lg)] p-5 relative group',
                                'bg-[var(--color-bg-card)] border border-[var(--color-border)]',
                                'hover:border-[var(--color-border-hover)] transition-all duration-300',
                            )}
                        >
                            {/* Header */}
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-[var(--radius-md)] bg-[var(--color-accent-muted)] flex items-center justify-center">
                                        <Truck size={18} className="text-[var(--color-accent)]" />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">
                                            {supplier.name}
                                        </h3>
                                        {supplier.contact_person && (
                                            <p className="text-xs text-[var(--color-text-muted)] flex items-center gap-1 mt-0.5">
                                                <User size={10} /> {supplier.contact_person}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                <div className="relative">
                                    <button
                                        onClick={() => setActiveMenu(activeMenu === supplier.id ? null : supplier.id)}
                                        className="p-1.5 rounded-[var(--radius-sm)] text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-active)] transition-colors opacity-0 group-hover:opacity-100"
                                    >
                                        <MoreHorizontal size={16} />
                                    </button>

                                    {activeMenu === supplier.id && (
                                        <div className="absolute right-0 top-full mt-1 z-20 w-36 rounded-[var(--radius-md)] bg-[var(--color-bg-card)] border border-[var(--color-border)] shadow-xl py-1 animate-scaleIn">
                                            <button
                                                onClick={() => handleOpenPayment(supplier)}
                                                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-text-primary)] transition-colors"
                                            >
                                                <CreditCard size={13} /> {t('suppliers.menu_pay')}
                                            </button>
                                            <button
                                                onClick={() => handleEdit(supplier)}
                                                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-text-primary)] transition-colors"
                                            >
                                                <Edit2 size={13} /> {t('suppliers.menu_edit')}
                                            </button>
                                            <button
                                                onClick={() => handleDelete(supplier.id)}
                                                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[var(--color-danger)] hover:bg-[var(--color-danger-muted)] transition-colors"
                                            >
                                                <Trash2 size={13} /> {t('suppliers.menu_delete')}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Contact Details */}
                            <div className="space-y-2">
                                {supplier.phone && (
                                    <div className="flex items-center gap-2 text-xs text-[var(--color-text-secondary)]">
                                        <Phone size={12} className="text-[var(--color-text-muted)]" />
                                        {supplier.phone}
                                    </div>
                                )}
                                {supplier.email && (
                                    <div className="flex items-center gap-2 text-xs text-[var(--color-text-secondary)]">
                                        <Mail size={12} className="text-[var(--color-text-muted)]" />
                                        {supplier.email}
                                    </div>
                                )}
                                {supplier.address && (
                                    <div className="flex items-center gap-2 text-xs text-[var(--color-text-secondary)]">
                                        <MapPin size={12} className="text-[var(--color-text-muted)]" />
                                        {supplier.address}
                                    </div>
                                )}
                                <div className="pt-2 mt-2 border-t border-[var(--color-border)] flex justify-between items-center">
                                    <span className="text-xs text-[var(--color-text-muted)]">
                                        {t('suppliers.balance')}
                                    </span>
                                    <span
                                        className={cn(
                                            'text-sm font-medium',
                                            supplier.balance > 0
                                                ? 'text-[var(--color-danger)]'
                                                : 'text-[var(--color-success)]',
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
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className={labelClass}>{t('suppliers.label_name')} *</label>
                        <div className="relative">
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
                    <div className="flex items-center justify-end gap-4 pt-6 mt-6 border-t border-zinc-100">
                        <Button
                            variant="ghost"
                            onClick={handleCloseForm}
                            className="flex-1 h-14 rounded-2xl font-black uppercase tracking-widest text-xs transition-all hover:bg-zinc-100 text-zinc-400 hover:text-black"
                        >
                            {t('suppliers.cancel')}
                        </Button>
                        <Button
                            type="submit"
                            icon={<Save size={18} />}
                            className="flex-[2] h-14 rounded-2xl bg-yellow-400 text-black font-black uppercase tracking-widest text-xs transition-all hover:bg-yellow-500 flex items-center justify-center gap-2 shadow-xl shadow-yellow-400/10 border-none"
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
                <form onSubmit={handlePaymentSubmit} className="space-y-6">
                    <div className="p-4 bg-zinc-50 rounded-3xl border border-zinc-200 space-y-1">
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
                    <div className="flex items-center justify-end gap-3 pt-6 border-t border-zinc-100">
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
                            className="flex-[2] h-12 rounded-xl bg-yellow-400 text-black font-bold uppercase text-[10px] tracking-widest shadow-lg shadow-yellow-400/10 border-none"
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
