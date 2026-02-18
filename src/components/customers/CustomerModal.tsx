import { useState, useEffect } from 'react';
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
            toast.error('Failed to save customer');
        } finally {
            setIsLoading(false);
        }
    };

    const inputClass = "w-full bg-[var(--color-bg-input)] border border-[var(--color-border)] rounded-lg px-3 py-2 text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-border-hover)] focus:ring-1 focus:ring-[var(--color-border-hover)] transition-all placeholder:text-[var(--color-text-placeholder)]";

    return (
        <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <DialogTitle>{customer ? 'Edit Customer' : 'New Customer'}</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Name Input */}
                    <div>
                        <label className="block text-sm font-medium text-[var(--color-text-muted)] mb-1">Full Name *</label>
                        <input
                            required
                            type="text"
                            value={formData.full_name}
                            onChange={e => setFormData({ ...formData, full_name: e.target.value })}
                            className={inputClass}
                            placeholder="e.g. John Doe"
                        />
                    </div>

                    {/* Contact Info Group */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-[var(--color-text-muted)] mb-1">Phone</label>
                            <input
                                type="tel"
                                value={formData.phone}
                                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                className={inputClass}
                                placeholder="+1 234 567 890"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-[var(--color-text-muted)] mb-1">Email</label>
                            <input
                                type="email"
                                value={formData.email}
                                onChange={e => setFormData({ ...formData, email: e.target.value })}
                                className={inputClass}
                                placeholder="john@example.com"
                            />
                        </div>
                    </div>

                    {/* Address Input */}
                    <div>
                        <label className="block text-sm font-medium text-[var(--color-text-muted)] mb-1">Address</label>
                        <input
                            type="text"
                            value={formData.address || ''}
                            onChange={e => setFormData({ ...formData, address: e.target.value })}
                            className={inputClass}
                            placeholder="Street, City, Zip"
                        />
                    </div>

                    {/* Loyalty Points */}
                    <div>
                        <label className="block text-sm font-medium text-[var(--color-text-muted)] mb-1">Loyalty Points</label>
                        <input
                            type="number"
                            value={formData.loyalty_points}
                            onChange={e => setFormData({ ...formData, loyalty_points: parseInt(e.target.value) || 0 })}
                            className={inputClass}
                        />
                    </div>

                    {/* Notes */}
                    <div>
                        <label className="block text-sm font-medium text-[var(--color-text-muted)] mb-1">Notes</label>
                        <textarea
                            value={formData.notes || ''}
                            onChange={e => setFormData({ ...formData, notes: e.target.value })}
                            className={`${inputClass} min-h-[80px] resize-none`}
                            placeholder="Internal notes about this customer..."
                        />
                    </div>

                    <div className="pt-4 border-t border-[var(--color-border)] flex justify-end gap-3">
                        <Button type="button" variant="secondary" onClick={onClose} disabled={isLoading}>
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            variant="primary"
                            disabled={isLoading}
                            icon={isLoading ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                        >
                            {customer ? 'Update Customer' : 'Create Customer'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
