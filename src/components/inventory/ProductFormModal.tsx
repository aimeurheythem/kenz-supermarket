import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Save, ScanBarcode } from 'lucide-react';
import Button from '@/components/common/Button';
import BarcodeScanner from '@/components/common/BarcodeScanner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import type { Product, ProductInput, Category } from '@/lib/types';

interface ProductFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: ProductInput) => void;
    product?: Product | null;
    categories: Category[];
}

const defaultForm: ProductInput = {
    name: '',
    barcode: '',
    description: '',
    category_id: undefined,
    cost_price: 0,
    selling_price: 0,
    stock_quantity: 0,
    reorder_level: 10,
    unit: 'piece',
};

export default function ProductFormModal({ isOpen, onClose, onSubmit, product, categories }: ProductFormModalProps) {
    const { t } = useTranslation();
    const [form, setForm] = useState<ProductInput>(defaultForm);
    const [showScanner, setShowScanner] = useState(false);
    const isEditing = !!product;

    useEffect(() => {
        if (product) {
            setForm({
                name: product.name,
                barcode: product.barcode || '',
                description: product.description,
                category_id: product.category_id || undefined,
                cost_price: product.cost_price,
                selling_price: product.selling_price,
                stock_quantity: product.stock_quantity,
                reorder_level: product.reorder_level,
                unit: product.unit,
            });
        } else {
            setForm(defaultForm);
        }
    }, [product, isOpen]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.name.trim()) return;
        onSubmit(form);
        onClose();
    };

    const inputClass =
        'w-full bg-[var(--color-bg-input)] border border-[var(--color-border)] rounded-lg px-3 py-2 text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-border-hover)] focus:ring-1 focus:ring-[var(--color-border-hover)] transition-all placeholder:text-[var(--color-text-placeholder)]';

    return (
        <>
            <Dialog
                open={isOpen}
                onOpenChange={(open) => {
                    if (!open) onClose();
                }}
            >
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto custom-scrollbar">
                    <DialogHeader>
                        <DialogTitle>
                            {isEditing ? t('inventory.form.edit_title') : t('inventory.form.new_title')}
                        </DialogTitle>
                    </DialogHeader>

                    <form id="product-form" onSubmit={handleSubmit} className="space-y-4">
                        {/* Basic Information */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-[var(--color-text-muted)] mb-1">
                                    {t('inventory.form.labels.name')}
                                </label>
                                <input
                                    type="text"
                                    value={form.name}
                                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                                    placeholder={t('inventory.form.placeholders.name_eg')}
                                    className={inputClass}
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-[var(--color-text-muted)] mb-1">
                                    {t('inventory.form.labels.barcode')}
                                </label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={form.barcode || ''}
                                        onChange={(e) => setForm({ ...form, barcode: e.target.value })}
                                        placeholder={t('inventory.form.placeholders.scan_type')}
                                        className={inputClass}
                                    />
                                    <Button
                                        type="button"
                                        variant="secondary"
                                        onClick={() => setShowScanner(true)}
                                        className="px-3 shrink-0"
                                    >
                                        <ScanBarcode size={18} />
                                    </Button>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-[var(--color-text-muted)] mb-1">
                                    {t('inventory.form.labels.category')}
                                </label>
                                <select
                                    value={form.category_id || ''}
                                    onChange={(e) => setForm({ ...form, category_id: e.target.value ? Number(e.target.value) : undefined })}
                                    className={inputClass}
                                >
                                    <option value="">{t('inventory.form.placeholders.none')}</option>
                                    {categories.map((cat) => (
                                        <option key={cat.id} value={cat.id}>
                                            {t(`categories.${cat.name}`, { defaultValue: cat.name })}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-[var(--color-text-muted)] mb-1">
                                    {t('inventory.form.labels.unit')}
                                </label>
                                <select
                                    value={form.unit || 'piece'}
                                    onChange={(e) => setForm({ ...form, unit: e.target.value })}
                                    className={inputClass}
                                >
                                    {['piece', 'kg', 'g', 'l', 'ml', 'bottle', 'box', 'pack'].map((u) => (
                                        <option key={u} value={u}>
                                            {t(`inventory.units.${u}`)}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Inventory & Pricing */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-[var(--color-text-muted)] mb-1">
                                    {t('inventory.form.labels.cost')} (DZ)
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={form.cost_price}
                                    onChange={(e) => setForm({ ...form, cost_price: parseFloat(e.target.value) || 0 })}
                                    className={inputClass}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-[var(--color-text-muted)] mb-1">
                                    {t('inventory.form.labels.selling')} (DZ)
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={form.selling_price}
                                    onChange={(e) =>
                                        setForm({ ...form, selling_price: parseFloat(e.target.value) || 0 })
                                    }
                                    className={inputClass}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-[var(--color-text-muted)] mb-1">
                                    {t('inventory.form.labels.initial_stock')}
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    step="1"
                                    value={form.stock_quantity}
                                    onChange={(e) => setForm({ ...form, stock_quantity: parseInt(e.target.value) || 0 })}
                                    className={inputClass}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-[var(--color-text-muted)] mb-1">
                                    {t('inventory.form.labels.low_stock_alert')}
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    step="1"
                                    value={form.reorder_level}
                                    onChange={(e) => setForm({ ...form, reorder_level: parseInt(e.target.value) || 0 })}
                                    className={inputClass}
                                />
                            </div>
                        </div>

                        <div className="pt-4 mt-6 border-t border-[var(--color-border)] flex justify-end gap-3">
                            <Button
                                type="button"
                                variant="secondary"
                                onClick={onClose}
                            >
                                {t('inventory.form.buttons.cancel')}
                            </Button>
                            <Button
                                type="submit"
                                variant="primary"
                                icon={<Save size={16} />}
                            >
                                {isEditing ? t('inventory.form.buttons.save') : t('inventory.form.buttons.create')}
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>

            {showScanner && (
                <BarcodeScanner
                    onScan={(code) => {
                        setForm({ ...form, barcode: code });
                        setShowScanner(false);
                    }}
                    onClose={() => setShowScanner(false)}
                />
            )}
        </>
    );
}
