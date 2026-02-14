import { useState, useEffect } from 'react';
import { Save } from 'lucide-react';
import Modal from '@/components/common/Modal';
import Button from '@/components/common/Button';
import { cn } from '@/lib/utils';
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
    const [form, setForm] = useState<ProductInput>(defaultForm);
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

    const inputClass = cn(
        'w-full px-3 py-2.5 rounded-[var(--radius-md)]',
        'bg-[var(--color-bg-input)] border border-[var(--color-border)]',
        'text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)]',
        'focus:outline-none focus:border-[var(--color-accent)] focus:ring-1 focus:ring-[var(--color-accent)]',
        'transition-all duration-200'
    );

    const labelClass = 'text-xs font-medium text-[var(--color-text-secondary)] mb-1.5 block';

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={isEditing ? 'Edit Product' : 'Add New Product'} maxWidth="max-w-2xl">
            <form onSubmit={handleSubmit} className="space-y-5">
                {/* Row 1: Name + Barcode */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className={labelClass}>Product Name *</label>
                        <input
                            type="text"
                            value={form.name}
                            onChange={(e) => setForm({ ...form, name: e.target.value })}
                            placeholder="e.g. Whole Milk 1L"
                            className={inputClass}
                            required
                            autoFocus
                        />
                    </div>
                    <div>
                        <label className={labelClass}>Barcode</label>
                        <input
                            type="text"
                            value={form.barcode || ''}
                            onChange={(e) => setForm({ ...form, barcode: e.target.value })}
                            placeholder="e.g. 5901234123457"
                            className={inputClass}
                        />
                    </div>
                </div>

                {/* Row 2: Category + Unit */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className={labelClass}>Category</label>
                        <select
                            value={form.category_id || ''}
                            onChange={(e) => setForm({ ...form, category_id: e.target.value ? Number(e.target.value) : undefined })}
                            className={inputClass}
                        >
                            <option value="">No Category</option>
                            {categories.map((cat) => (
                                <option key={cat.id} value={cat.id}>{cat.name}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className={labelClass}>Unit</label>
                        <select
                            value={form.unit || 'piece'}
                            onChange={(e) => setForm({ ...form, unit: e.target.value })}
                            className={inputClass}
                        >
                            <option value="piece">Piece</option>
                            <option value="kg">Kilogram (kg)</option>
                            <option value="g">Gram (g)</option>
                            <option value="l">Liter (L)</option>
                            <option value="ml">Milliliter (mL)</option>
                            <option value="box">Box</option>
                            <option value="pack">Pack</option>
                        </select>
                    </div>
                </div>

                {/* Row 3: Cost + Selling Price */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className={labelClass}>Cost Price ($) *</label>
                        <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={form.cost_price}
                            onChange={(e) => setForm({ ...form, cost_price: parseFloat(e.target.value) || 0 })}
                            className={inputClass}
                            required
                        />
                    </div>
                    <div>
                        <label className={labelClass}>Selling Price ($) *</label>
                        <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={form.selling_price}
                            onChange={(e) => setForm({ ...form, selling_price: parseFloat(e.target.value) || 0 })}
                            className={inputClass}
                            required
                        />
                    </div>
                </div>

                {/* Profit margin indicator */}
                {form.selling_price > 0 && form.cost_price > 0 && (
                    <div className="flex items-center gap-2 px-3 py-2 rounded-[var(--radius-md)] bg-[var(--color-bg-hover)]">
                        <span className="text-xs text-[var(--color-text-muted)]">Profit Margin:</span>
                        <span
                            className="text-xs font-semibold"
                            style={{
                                color:
                                    ((form.selling_price - form.cost_price) / form.selling_price) * 100 > 20
                                        ? 'var(--color-success)'
                                        : 'var(--color-warning)',
                            }}
                        >
                            {(((form.selling_price - form.cost_price) / form.selling_price) * 100).toFixed(1)}%
                        </span>
                        <span className="text-xs text-[var(--color-text-muted)]">
                            (${(form.selling_price - form.cost_price).toFixed(2)} per unit)
                        </span>
                    </div>
                )}

                {/* Row 4: Stock + Reorder Level */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className={labelClass}>Current Stock</label>
                        <input
                            type="number"
                            min="0"
                            value={form.stock_quantity || 0}
                            onChange={(e) => setForm({ ...form, stock_quantity: parseInt(e.target.value) || 0 })}
                            className={inputClass}
                        />
                    </div>
                    <div>
                        <label className={labelClass}>Reorder Level</label>
                        <input
                            type="number"
                            min="0"
                            value={form.reorder_level || 10}
                            onChange={(e) => setForm({ ...form, reorder_level: parseInt(e.target.value) || 0 })}
                            className={inputClass}
                        />
                    </div>
                </div>

                {/* Description */}
                <div>
                    <label className={labelClass}>Description</label>
                    <textarea
                        value={form.description || ''}
                        onChange={(e) => setForm({ ...form, description: e.target.value })}
                        placeholder="Optional product description..."
                        rows={2}
                        className={cn(inputClass, 'resize-none')}
                    />
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-3 pt-3 border-t border-[var(--color-border)]">
                    <Button variant="secondary" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button type="submit" icon={<Save size={15} />}>
                        {isEditing ? 'Update Product' : 'Add Product'}
                    </Button>
                </div>
            </form>
        </Modal>
    );
}
