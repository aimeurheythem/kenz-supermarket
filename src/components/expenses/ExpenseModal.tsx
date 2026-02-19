import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Banknote, Calendar, Tag } from 'lucide-react';
import Button from '@/components/common/Button';
import { useExpenseStore } from '@/stores/useExpenseStore';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface ExpenseModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function ExpenseModal({ isOpen, onClose }: ExpenseModalProps) {
    const { addExpense } = useExpenseStore();
    const { t } = useTranslation();
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        description: '',
        amount: '',
        category: 'Other',
        payment_method: 'cash',
        date: new Date().toISOString().split('T')[0],
    });

    const categories = [
        { value: 'Rent', label: t('expense_modal.cat_rent') },
        { value: 'Salaries', label: t('expense_modal.cat_salaries') },
        { value: 'Utilities', label: t('expense_modal.cat_utilities') },
        { value: 'Maintenance', label: t('expense_modal.cat_maintenance') },
        { value: 'Marketing', label: t('expense_modal.cat_marketing') },
        { value: 'Inventory', label: t('expense_modal.cat_inventory') },
        { value: 'Other', label: t('expense_modal.cat_other') },
    ];

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            await addExpense({
                description: formData.description,
                amount: parseFloat(formData.amount),
                category: formData.category,
                payment_method: formData.payment_method,
                date: formData.date,
            });
            onClose();
            setFormData({
                description: '',
                amount: '',
                category: 'Other',
                payment_method: 'cash',
                date: new Date().toISOString().split('T')[0],
            });
        } catch (error) {
            console.error('Failed to add expense:', error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog
            open={isOpen}
            onOpenChange={(open) => {
                if (!open) onClose();
            }}
        >
            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <DialogTitle>{t('expense_modal.title')}</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Amount Input */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-widest text-zinc-500 ml-1">
                            {t('expense_modal.label_amount')}
                        </label>
                        <div className="relative">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400">
                                <Banknote size={20} />
                            </div>
                            <input
                                type="number"
                                step="0.01"
                                required
                                value={formData.amount}
                                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                className="w-full h-14 pl-12 pr-4 bg-zinc-50 border-2 border-transparent focus:border-black/5 focus:bg-white rounded-2xl outline-none transition-all font-bold text-lg text-black placeholder:text-zinc-300"
                                placeholder={t('expense_modal.placeholder_amount')}
                            />
                        </div>
                    </div>

                    {/* Description */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-widest text-zinc-500 ml-1">
                            {t('expense_modal.label_description')}
                        </label>
                        <input
                            type="text"
                            required
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            className="w-full h-12 px-4 bg-zinc-50 border-2 border-transparent focus:border-black/5 focus:bg-white rounded-xl outline-none transition-all font-medium text-black placeholder:text-zinc-300"
                            placeholder={t('expense_modal.placeholder_description')}
                        />
                    </div>

                    {/* Grid Inputs */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-widest text-zinc-500 ml-1">
                                {t('expense_modal.label_category')}
                            </label>
                            <div className="relative">
                                <Tag className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
                                <select
                                    value={formData.category}
                                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                    className="w-full h-12 pl-10 pr-4 bg-zinc-50 border-2 border-transparent focus:border-black/5 focus:bg-white rounded-xl outline-none transition-all font-medium text-black appearance-none cursor-pointer"
                                >
                                    {categories.map((c) => (
                                        <option key={c.value} value={c.value}>
                                            {c.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-widest text-zinc-500 ml-1">
                                {t('expense_modal.label_date')}
                            </label>
                            <div className="relative">
                                <Calendar
                                    className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400"
                                    size={16}
                                />
                                <input
                                    type="date"
                                    required
                                    value={formData.date}
                                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                    className="w-full h-12 pl-10 pr-4 bg-zinc-50 border-2 border-transparent focus:border-black/5 focus:bg-white rounded-xl outline-none transition-all font-medium text-black"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-widest text-zinc-500 ml-1">
                            {t('expense_modal.label_payment_method')}
                        </label>
                        <div className="flex gap-2">
                            {[
                                { value: 'cash', label: t('expense_modal.pm_cash') },
                                { value: 'card', label: t('expense_modal.pm_card') },
                                { value: 'bank_transfer', label: t('expense_modal.pm_bank_transfer') },
                            ].map((method) => (
                                <button
                                    key={method.value}
                                    type="button"
                                    onClick={() => setFormData({ ...formData, payment_method: method.value })}
                                    className={`flex-1 h-10 rounded-lg text-xs font-bold uppercase tracking-wide border transition-all ${
                                        formData.payment_method === method.value
                                            ? 'bg-black text-white border-black'
                                            : 'bg-white text-zinc-400 border-zinc-200 hover:border-zinc-300'
                                    }`}
                                >
                                    {method.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="pt-4 flex gap-3">
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={onClose}
                            disabled={isLoading}
                            className="flex-1"
                        >
                            {t('expense_modal.cancel')}
                        </Button>
                        <Button
                            type="submit"
                            disabled={isLoading}
                            className="flex-1 bg-yellow-400 text-black hover:bg-yellow-500"
                        >
                            {isLoading ? t('expense_modal.saving') : t('expense_modal.add')}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
