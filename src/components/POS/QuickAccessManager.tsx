import { useState } from 'react';
import { Settings2, X, ShoppingBag, Plus, Pencil, Trash2 } from 'lucide-react';
import { cn, formatCurrency } from '@/lib/utils';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import Portal from '@/components/common/Portal';
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
        <Portal>
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="bg-white w-full max-w-4xl max-h-[90vh] rounded-[3rem] shadow-2xl overflow-hidden flex flex-col"
                >
                    <div className="p-8 border-b border-zinc-100 flex items-center justify-between bg-[#fcfcfc]">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-black text-white rounded-2xl">
                                <Settings2 size={24} />
                            </div>
                            <div>
                                <h2 className="text-2xl font-black text-black uppercase tracking-tight">
                                    {t('pos.quick_access.configure')}
                                </h2>
                                <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-[0.2em]">
                                    {t('pos.quick_access.manage_buttons')}
                                </p>
                            </div>
                        </div>
                        <button onClick={onClose} className="p-4 hover:bg-zinc-100 rounded-full transition-colors">
                            <X size={24} className="text-zinc-400" />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-8 bg-white custom-scrollbar">
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
                            <div className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {items.filter(Boolean).map((item: QuickAccessItem) => (
                                        <div
                                            key={item.id}
                                            className={cn(
                                                'p-6 rounded-[2rem] border border-zinc-100/50 flex flex-col gap-4 transition-all hover:border-zinc-200',
                                                item.bg_color,
                                            )}
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 bg-white rounded-xl shadow-sm">
                                                        <ShoppingBag className={item.color} size={18} />
                                                    </div>
                                                    <span className="font-black text-black uppercase tracking-tight">
                                                        {item.display_name}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <button
                                                        onClick={() => setEditingItem(item)}
                                                        className="p-2 hover:bg-white rounded-lg transition-colors text-zinc-400 hover:text-black"
                                                    >
                                                        <Pencil size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => onDelete(item.id)}
                                                        className="p-2 hover:bg-white rounded-lg transition-colors text-zinc-400 hover:text-red-500"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </div>
                                            <div className="flex flex-wrap gap-2">
                                                {(Array.isArray(item.options) ? item.options : []).map((opt) => (
                                                    <div
                                                        key={opt.label}
                                                        className="bg-white px-3 py-1.5 rounded-xl border border-zinc-100 text-[10px] font-black uppercase tracking-widest flex items-center gap-2"
                                                    >
                                                        <span className="text-zinc-400">{opt.label}:</span>
                                                        <span className="text-emerald-500">
                                                            {formatCurrency(opt.price)}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                    <button
                                        onClick={() => setIsAdding(true)}
                                        className="p-8 border-2 border-dashed border-zinc-100 rounded-[2rem] flex flex-col items-center justify-center gap-3 text-zinc-300 hover:border-zinc-200 hover:text-zinc-400 transition-all group"
                                    >
                                        <div className="w-12 h-12 bg-zinc-50 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                                            <Plus size={24} />
                                        </div>
                                        <span className="font-black uppercase tracking-widest text-xs">
                                            {t('pos.quick_access.add_product')}
                                        </span>
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </motion.div>
            </div>
        </Portal>
    );
}

interface QuickAccessFormProps {
    products: Product[];
    initialData: QuickAccessItem | null;
    onSave: (data: QuickAccessItemInput) => void;
    onCancel: () => void;
}

function QuickAccessForm({ products, initialData, onSave, onCancel }: QuickAccessFormProps) {
    const { t } = useTranslation();
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

    return (
        <div className="space-y-8 animate-fadeIn">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">
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
                            <SelectTrigger className="w-full h-14 px-6 rounded-2xl bg-zinc-50 border border-zinc-100 font-bold !ring-0">
                                <SelectValue placeholder="Select a product..." />
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

                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">
                            {t('pos.quick_access.display_name')}
                        </label>
                        <input
                            type="text"
                            value={formData.display_name}
                            onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                            placeholder="e.g. Fresh Eggs"
                            className="w-full h-14 px-6 rounded-2xl bg-zinc-50 border border-zinc-100 font-bold outline-none focus:border-black transition-all"
                        />
                    </div>

                    <div className="space-y-4">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">
                            {t('pos.quick_access.theme_color')}
                        </label>
                        <div className="flex flex-wrap gap-3">
                            {colorPairs.map((pair) => (
                                <button
                                    key={pair.color}
                                    onClick={() => setFormData({ ...formData, color: pair.color, bg_color: pair.bg })}
                                    className={cn(
                                        'w-12 h-12 rounded-xl flex items-center justify-center transition-all border-2',
                                        pair.bg,
                                        formData.color === pair.color ? 'border-black' : 'border-transparent',
                                    )}
                                >
                                    <ShoppingBag size={18} className={pair.color} />
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">
                            {t('pos.quick_access.variations')}
                        </label>
                        <button
                            onClick={addOption}
                            className="text-[10px] font-black uppercase tracking-widest text-emerald-500 hover:underline"
                        >
                            {t('pos.quick_access.add_option')}
                        </button>
                    </div>

                    <div className="space-y-3">
                        {formData.options.map((opt: { label: string; qty: number; price: number }, idx: number) => (
                            <div key={idx} className="flex gap-2 animate-fadeIn">
                                <input
                                    placeholder="Label (e.g. 10 Pcs)"
                                    value={opt.label}
                                    onChange={(e) => updateOption(idx, 'label', e.target.value)}
                                    className="flex-1 h-12 px-4 rounded-xl bg-zinc-50 border border-zinc-100 text-xs font-bold outline-none focus:border-black"
                                />
                                <input
                                    type="number"
                                    min="1"
                                    step="1"
                                    placeholder="Qty"
                                    value={opt.qty}
                                    onChange={(e) => updateOption(idx, 'qty', parseInt(e.target.value))}
                                    className="w-20 h-12 px-4 rounded-xl bg-zinc-50 border border-zinc-100 text-xs font-bold outline-none focus:border-black"
                                />
                                <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    placeholder="Price"
                                    value={opt.price}
                                    onChange={(e) => updateOption(idx, 'price', parseFloat(e.target.value))}
                                    className="w-28 h-12 px-4 rounded-xl bg-zinc-50 border border-zinc-100 text-xs font-bold outline-none focus:border-black text-emerald-600"
                                />
                                <button
                                    onClick={() => removeOption(idx)}
                                    disabled={formData.options.length === 1}
                                    className="p-3 text-zinc-300 hover:text-red-500 transition-colors disabled:opacity-0"
                                >
                                    <X size={16} />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="flex gap-4 pt-4 border-t border-zinc-50">
                <button
                    onClick={onCancel}
                    className="flex-1 h-14 bg-zinc-100 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-zinc-200 transition-all"
                >
                    {t('pos.quick_access.cancel')}
                </button>
                <button
                    onClick={() => onSave(formData as QuickAccessItemInput)}
                    disabled={!formData.product_id || !formData.display_name}
                    className="flex-[2] h-14 bg-black text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-zinc-800 disabled:bg-zinc-200 transition-all shadow-xl shadow-black/10"
                >
                    {t('pos.quick_access.save')}
                </button>
            </div>
        </div>
    );
}
