import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Loader2, Save } from 'lucide-react';
import Button from '@/components/common/Button';
import { useCustomerStore } from '@/stores/useCustomerStore';
import { toast } from 'sonner';
import type { Customer, CustomerInput } from '@/lib/types';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

interface CustomerModalProps {
    customer?: Customer | null;
    isOpen: boolean;
    onClose: () => void;
}

export default function CustomerModal({ customer, isOpen, onClose }: CustomerModalProps) {
    const { addCustomer, updateCustomer } = useCustomerStore();
    const { t } = useTranslation();
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState<CustomerInput>({
        full_name: '',
        phone: '',
        email: '',
        address: '',
        notes: '',
        loyalty_points: 0
    });

    useEffect(() => {
        if (customer) {
            setFormData({
                full_name: customer.full_name,
                phone: customer.phone || '',
                email: customer.email || '',
                address: customer.address || '',
                notes: customer.notes || '',
                loyalty_points: customer.loyalty_points
            });
        } else {
            setFormData({
                full_name: '',
                phone: '',
                email: '',
                address: '',
                notes: '',
                loyalty_points: 0
            });
        }
    }, [customer, isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            if (customer) {
                await updateCustomer(customer.id, formData);
            } else {
                await addCustomer(formData);
            }
            onClose();
        } catch (error) {
            console.error(error);
            toast.error(t('customer_modal.save_failed'));
        } finally {
            setIsLoading(false);
        }
    };

    const inputClass = "w-full bg-[var(--color-bg-input)] border border-[var(--color-border)] rounded-lg px-3 py-2 text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-border-hover)] focus:ring-1 focus:ring-[var(--color-border-hover)] transition-all placeholder:text-[var(--color-text-placeholder)]";

    return (
        <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <DialogTitle>{customer ? t('customer_modal.edit_title') : t('customer_modal.new_title')}</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Name Input */}
                    <div>
                        <label className="block text-sm font-medium text-[var(--color-text-muted)] mb-1">{t('customer_modal.label_name')}</label>
                        <input
                            required
                            type="text"
                            value={formData.full_name}
                            onChange={e => setFormData({ ...formData, full_name: e.target.value })}
                            className={inputClass}
                            placeholder={t('customer_modal.placeholder_name')}
                        />
                    </div>

                    {/* Contact Info Group */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-[var(--color-text-muted)] mb-1">{t('customer_modal.label_phone')}</label>
                            <input
                                type="tel"
                                value={formData.phone}
                                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                className={inputClass}
                                placeholder={t('customer_modal.placeholder_phone')}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-[var(--color-text-muted)] mb-1">{t('customer_modal.label_email')}</label>
                            <input
                                type="email"
                                value={formData.email}
                                onChange={e => setFormData({ ...formData, email: e.target.value })}
                                className={inputClass}
                                placeholder={t('customer_modal.placeholder_email')}
                            />
                        </div>
                    </div>

                    {/* Address Input */}
                    <div>
                        <label className="block text-sm font-medium text-[var(--color-text-muted)] mb-1">{t('customer_modal.label_address')}</label>
                        <input
                            type="text"
                            value={formData.address || ''}
                            onChange={e => setFormData({ ...formData, address: e.target.value })}
                            className={inputClass}
                            placeholder={t('customer_modal.placeholder_address')}
                        />
                    </div>

                    {/* Loyalty Points */}
                    <div>
                        <label className="block text-sm font-medium text-[var(--color-text-muted)] mb-1">{t('customer_modal.label_loyalty')}</label>
                        <input
                            type="number"
                            value={formData.loyalty_points}
                            onChange={e => setFormData({ ...formData, loyalty_points: parseInt(e.target.value) || 0 })}
                            className={inputClass}
                        />
                    </div>

                    {/* Notes */}
                    <div>
                        <label className="block text-sm font-medium text-[var(--color-text-muted)] mb-1">{t('customer_modal.label_notes')}</label>
                        <textarea
                            value={formData.notes || ''}
                            onChange={e => setFormData({ ...formData, notes: e.target.value })}
                            className={`${inputClass} min-h-[80px] resize-none`}
                            placeholder={t('customer_modal.placeholder_notes')}
                        />
                    </div>

                    <div className="pt-4 border-t border-[var(--color-border)] flex justify-end gap-3">
                        <Button type="button" variant="secondary" onClick={onClose} disabled={isLoading}>
                            {t('customer_modal.cancel')}
                        </Button>
                        <Button
                            type="submit"
                            variant="primary"
                            disabled={isLoading}
                            icon={isLoading ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                        >
                            {customer ? t('customer_modal.update') : t('customer_modal.create')}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
