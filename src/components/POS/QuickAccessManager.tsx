import { useState } from 'react';
import { ShoppingBag, Plus, Pencil, Trash2, X, Save } from 'lucide-react';
import { cn, formatCurrency } from '@/lib/utils';
import { useTranslation } from 'react-i18next';
import Button from '@/components/common/Button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Product, QuickAccessItem, QuickAccessItemInput } from '@/lib/types';

interface QuickAccessManagerProps {
    onClose: () => void;
    products: Product[];
    items: QuickAccessItem[];
    onAdd: (input: QuickAccessItemInput) => Promise<void>;
    onUpdate: (id: number, input: Partial<QuickAccessItemInput>) => Promise<void>;
    onDelete: (id: number) => Promise<void>;
}

export default function QuickAccessManager({
    onClose,
    products,
    items,
    onAdd,
    onUpdate,
    onDelete,
}: QuickAccessManagerProps) {
    const { t } = useTranslation();
    const [isAdding, setIsAdding] = useState(false);
    const [editingItem, setEditingItem] = useState<QuickAccessItem | null>(null);

    return (
        <Dialog
            open={true}
            onOpenChange={(open) => {
                if (!open) onClose();
            }}
        >
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto custom-scrollbar">
                <DialogHeader>
                    <DialogTitle>
                        {t('pos.quick_access.configure')}
                    </DialogTitle>
                </DialogHeader>

                {isAdding || editingItem ? (
                    <QuickAccessForm
                        products={products}
                        initialData={editingItem}
                        onCancel={() => {
                            setIsAdding(false);
                            setEditingItem(null);
                        }}
                        onSave={(data: QuickAccessItemInput) => {
                            if (editingItem) {
                                onUpdate(editingItem.id, data);
                            } else {
                                onAdd(data);
                            }
                            setIsAdding(false);
                            setEditingItem(null);
                        }}
                    />
                ) : (
                    <div className="space-y-4">
                        <p className="text-sm text-[var(--color-text-muted)]">
                            {t('pos.quick_access.manage_buttons')}
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {items.filter(Boolean).map((item: QuickAccessItem) => (
                                <div
                                    key={item.id}
                                    className={cn(
                                        'p-4 rounded-xl border border-[var(--color-border)] flex flex-col gap-3 transition-all hover:border-[var(--color-border-hover)]',
                                        item.bg_color,
                                    )}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-white rounded-lg shadow-sm">
                                                <ShoppingBag className={item.color} size={18} />
                                            </div>
                                            <span className="text-sm font-semibold text-[var(--color-text-primary)]">
                                                {item.display_name}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <button
                                                onClick={() => setEditingItem(item)}
                                                className="p-1.5 hover:bg-white/80 rounded-lg transition-colors text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
                                            >
                                                <Pencil size={14} />
                                            </button>
                                            <button
                                                onClick={() => onDelete(item.id)}
                                                className="p-1.5 hover:bg-white/80 rounded-lg transition-colors text-[var(--color-text-muted)] hover:text-red-500"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </div>
                                    <div className="flex flex-wrap gap-1.5">
                                        {(Array.isArray(item.options) ? item.options : []).map((opt) => (
                                            <span
                                                key={opt.label}
                                                className="bg-white/80 px-2.5 py-1 rounded-lg border border-[var(--color-border)] text-xs font-medium text-[var(--color-text-muted)]"
                                            >
                                                {opt.label}: <span className="text-emerald-600 font-semibold">{formatCurrency(opt.price)}</span>
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <button
                            onClick={() => setIsAdding(true)}
                            className="w-full p-4 border-2 border-dashed border-[var(--color-border)] rounded-xl flex items-center justify-center gap-2 text-[var(--color-text-muted)] hover:border-[var(--color-border-hover)] hover:text-[var(--color-text-primary)] transition-all"
                        >
                            <Plus size={18} />
                            <span className="text-sm font-medium">
                                {t('pos.quick_access.add_product')}
                            </span>
                        </button>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}

interface QuickAccessFormProps {
    products: Product[];
    initialData: QuickAccessItem | null;
    onSave: (data: QuickAccessItemInput) => void;
    onCancel: () => void;
}

const inputClass =
    'w-full bg-[var(--color-bg-input)] border border-[var(--color-border)] rounded-lg px-3 py-2 text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-border-hover)] focus:ring-1 focus:ring-[var(--color-border-hover)] transition-all placeholder:text-[var(--color-text-placeholder)]';

const selectTriggerClass =
    'w-full bg-[var(--color-bg-input)] border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-border-hover)] focus:ring-1 focus:ring-[var(--color-border-hover)] transition-all h-auto font-normal';

function QuickAccessForm({ products, initialData, onSave, onCancel }: QuickAccessFormProps) {
    const { t } = useTranslation();
    const isEditing = !!initialData;
    const [formData, setFormData] = useState<{
        product_id: number | '';
        display_name: string;
        color: string;
        bg_color: string;
        options: { label: string; qty: number; price: number }[];
    }>({
        product_id: initialData?.product_id || '',
        display_name: initialData?.display_name || '',
        color: initialData?.color || 'text-zinc-500',
        bg_color: initialData?.bg_color || 'bg-zinc-50',
        options: initialData?.options || [{ label: '', qty: 1, price: 0 }],
    });

    const addOption = () => {
        setFormData({ ...formData, options: [...formData.options, { label: '', qty: 1, price: 0 }] });
    };

    const removeOption = (idx: number) => {
        setFormData({
            ...formData,
            options: formData.options.filter(
                (_: { label: string; qty: number; price: number }, i: number) => i !== idx,
            ),
        });
    };

    const updateOption = (idx: number, field: string, value: string | number) => {
        const newOptions = formData.options.map((opt: { label: string; qty: number; price: number }, i: number) =>
            i === idx ? { ...opt, [field]: value } : opt,
        );
        setFormData({ ...formData, options: newOptions });
    };

    const colorPairs = [
        { color: 'text-zinc-500', bg: 'bg-zinc-50' },
        { color: 'text-red-500', bg: 'bg-red-50' },
        { color: 'text-sky-500', bg: 'bg-sky-50' },
        { color: 'text-emerald-500', bg: 'bg-emerald-50' },
        { color: 'text-amber-500', bg: 'bg-amber-50' },
        { color: 'text-orange-500', bg: 'bg-orange-50' },
        { color: 'text-purple-500', bg: 'bg-purple-50' },
        { color: 'text-pink-500', bg: 'bg-pink-50' },
    ];

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.product_id || !formData.display_name) return;
        onSave(formData as QuickAccessItemInput);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {/* Product & Display Name */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-[var(--color-text-muted)] mb-1">
                        {t('pos.quick_access.select_product')}
                    </label>
                    <Select
                        value={formData.product_id ? String(formData.product_id) : ''}
                        onValueChange={(val) => {
                            if (!val) {
                                setFormData({ ...formData, product_id: '', display_name: '' });
                                return;
                            }
                            const prodId = parseInt(val);
                            const product = products.find((p) => p.id === prodId);
                            setFormData({ ...formData, product_id: prodId, display_name: product?.name || '' });
                        }}
                    >
                        <SelectTrigger className={selectTriggerClass}>
                            <SelectValue placeholder={t('pos.quick_access.select_product_placeholder', 'Choose a product...')} />
                        </SelectTrigger>
                        <SelectContent>
                            {products.map((p) => (
                                <SelectItem key={p.id} value={String(p.id)}>
                                    {p.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-[var(--color-text-muted)] mb-1">
                        {t('pos.quick_access.display_name')}
                    </label>
                    <input
                        type="text"
                        value={formData.display_name}
                        onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                        placeholder={t('pos.quick_access.display_name_placeholder', 'e.g. Fresh Eggs')}
                        className={inputClass}
                        required
                    />
                </div>
            </div>

            {/* Theme Color */}
            <div>
                <label className="block text-sm font-medium text-[var(--color-text-muted)] mb-2">
                    {t('pos.quick_access.theme_color')}
                </label>
                <div className="flex flex-wrap gap-2">
                    {colorPairs.map((pair) => (
                        <button
                            key={pair.color}
                            type="button"
                            onClick={() => setFormData({ ...formData, color: pair.color, bg_color: pair.bg })}
                            className={cn(
                                'w-10 h-10 rounded-lg flex items-center justify-center transition-all border-2',
                                pair.bg,
                                formData.color === pair.color
                                    ? 'border-[var(--color-border-hover)] ring-1 ring-[var(--color-border-hover)]'
                                    : 'border-transparent',
                            )}
                        >
                            <ShoppingBag size={16} className={pair.color} />
                        </button>
                    ))}
                </div>
            </div>

            {/* Variations / Options */}
            <div>
                <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-[var(--color-text-muted)]">
                        {t('pos.quick_access.variations')}
                    </label>
                    <button
                        type="button"
                        onClick={addOption}
                        className="text-xs font-medium text-emerald-600 hover:text-emerald-700 hover:underline transition-colors"
                    >
                        + {t('pos.quick_access.add_option')}
                    </button>
                </div>

                <div className="space-y-3">
                    {formData.options.map((opt: { label: string; qty: number; price: number }, idx: number) => (
                        <div key={idx} className="grid grid-cols-[1fr_80px_100px_auto] gap-2 items-center">
                            <input
                                placeholder={t('pos.quick_access.option_label_placeholder', 'Label (e.g. 10 Pcs)')}
                                value={opt.label}
                                onChange={(e) => updateOption(idx, 'label', e.target.value)}
                                className={inputClass}
                            />
                            <input
                                type="number"
                                min="1"
                                step="1"
                                placeholder={t('pos.quick_access.qty_placeholder', 'Qty')}
                                value={opt.qty}
                                onChange={(e) => updateOption(idx, 'qty', parseInt(e.target.value))}
                                className={inputClass}
                            />
                            <input
                                type="number"
                                min="0"
                                step="0.01"
                                placeholder={t('pos.quick_access.price_placeholder', 'Price')}
                                value={opt.price}
                                onChange={(e) => updateOption(idx, 'price', parseFloat(e.target.value))}
                                className={inputClass}
                            />
                            <button
                                type="button"
                                onClick={() => removeOption(idx)}
                                disabled={formData.options.length === 1}
                                className="p-2 text-[var(--color-text-muted)] hover:text-red-500 transition-colors disabled:opacity-30"
                            >
                                <X size={16} />
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            {/* Footer buttons — identical to ProductFormModal */}
            <div className="pt-4 mt-6 border-t border-[var(--color-border)] flex justify-end gap-3">
                <Button
                    type="button"
                    variant="secondary"
                    onClick={onCancel}
                >
                    {t('pos.quick_access.cancel')}
                </Button>
                <Button
                    type="submit"
                    variant="primary"
                    icon={<Save size={16} />}
                    disabled={!formData.product_id || !formData.display_name}
                >
                    {isEditing ? t('pos.quick_access.save') : t('pos.quick_access.add_product')}
                </Button>
            </div>
        </form>
    );
}
