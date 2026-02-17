import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Package, Box, DollarSign, Barcode, Scale, Save, ChevronDown, Check, ScanBarcode } from 'lucide-react';
import { FormModal } from '@/components/common/FormModal';
import Button from '@/components/common/Button';
import BarcodeScanner from '@/components/common/BarcodeScanner';
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
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

    const inputWrapperClass = "space-y-2";
    const labelClass = "text-[10px] font-black text-zinc-400 uppercase tracking-[0.15em] ml-1";
    const inputClass = "w-full h-14 px-5 rounded-3xl bg-zinc-100/70 border-2 border-zinc-300 font-bold text-black outline-none !ring-0 focus:ring-0 focus-visible:ring-0 focus:outline-none transition-all placeholder:text-zinc-300";
    const selectTriggerClass = "w-full h-14 px-5 flex items-center justify-between rounded-3xl bg-zinc-100/50 border-2 border-zinc-300 font-bold text-black outline-none !ring-0 focus:!ring-0 focus-visible:!ring-0 focus:outline-none transition-all cursor-pointer group";
    const sectionTitleClass = "flex items-center gap-3 mb-6";
    const sectionLineClass = "h-px bg-zinc-100 flex-1";
    const sectionLabelClass = "text-[10px] font-black uppercase tracking-[0.2em] text-zinc-300";

    const currentCategory = categories.find(c => c.id === form.category_id);

    return (
        <FormModal
            isOpen={isOpen}
            onClose={onClose}
            title={isEditing ? t('inventory.form.edit_title') : t('inventory.form.new_title')}
            description={isEditing ? t('inventory.form.edit_desc') : t('inventory.form.new_desc')}
            icon={isEditing ? <Box size={20} strokeWidth={2} /> : <Package size={20} strokeWidth={2} />}
        >
            <form id="product-form" onSubmit={handleSubmit} className="space-y-10">
                {/* Basic Information */}
                <div className="space-y-6">
                    <div className={sectionTitleClass}>
                        <span className={sectionLabelClass}>{t('inventory.form.sections.basic')}</span>
                        <div className={sectionLineClass} />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className={inputWrapperClass}>
                            <label className={labelClass}>{t('inventory.form.labels.name')}</label>
                            <input
                                type="text"
                                value={form.name}
                                onChange={(e) => setForm({ ...form, name: e.target.value })}
                                placeholder={t('inventory.form.placeholders.name_eg')}
                                className={inputClass}
                                required
                            />
                        </div>
                        <div className={inputWrapperClass}>
                            <label className={labelClass}>{t('inventory.form.labels.barcode')}</label>
                            <div className="relative">
                                <Barcode size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-400" strokeWidth={1.5} />
                                <input
                                    type="text"
                                    value={form.barcode || ''}
                                    onChange={(e) => setForm({ ...form, barcode: e.target.value })}
                                    placeholder={t('inventory.form.placeholders.scan_type')}
                                    className={inputClass + " pl-12 pr-12 font-mono text-sm"}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowScanner(true)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 p-1.5 rounded-lg bg-zinc-200 hover:bg-zinc-300 text-zinc-600 transition-colors"
                                    title="Scan Barcode"
                                >
                                    <ScanBarcode size={18} />
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className={inputWrapperClass}>
                            <label className={labelClass}>{t('inventory.form.labels.category')}</label>
                            <DropdownMenu>
                                <DropdownMenuTrigger className={selectTriggerClass}>
                                    <span className={cn(form.category_id ? "text-black" : "text-zinc-300")}>
                                        {currentCategory ? t(`categories.${currentCategory.name}`, { defaultValue: currentCategory.name }) : t('inventory.form.placeholders.select_category')}
                                    </span>
                                    <ChevronDown size={14} className="text-zinc-400 group-hover:text-black transition-colors" />
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="w-[var(--radix-dropdown-menu-trigger-width)] bg-white border border-zinc-100 rounded-2xl p-1 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                                    <DropdownMenuItem
                                        onClick={() => setForm({ ...form, category_id: undefined })}
                                        className="text-zinc-400 hover:text-black focus:bg-zinc-50 rounded-xl px-4 py-3 font-bold transition-all cursor-pointer"
                                    >
                                        {t('inventory.form.placeholders.none')}
                                    </DropdownMenuItem>
                                    {categories.map((cat) => (
                                        <DropdownMenuItem
                                            key={cat.id}
                                            onClick={() => setForm({ ...form, category_id: cat.id })}
                                            className={cn(
                                                "flex items-center justify-between px-4 py-3 rounded-xl font-bold transition-all cursor-pointer",
                                                form.category_id === cat.id ? "text-black bg-zinc-50" : "text-zinc-400 hover:text-black focus:bg-zinc-50"
                                            )}
                                        >
                                            {t(`categories.${cat.name}`, { defaultValue: cat.name })}
                                            {form.category_id === cat.id && <Check size={14} className="text-black" />}
                                        </DropdownMenuItem>
                                    ))}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                        <div className={inputWrapperClass}>
                            <label className={labelClass}>{t('inventory.form.labels.unit')}</label>
                            <DropdownMenu>
                                <DropdownMenuTrigger className={selectTriggerClass}>
                                    <div className="flex items-center gap-4">
                                        <Scale size={18} className="text-zinc-400" />
                                        <span className="text-black uppercase tracking-wider text-xs">
                                            {t(`inventory.units.${form.unit || 'piece'}`)}
                                        </span>
                                    </div>
                                    <ChevronDown size={14} className="text-zinc-400 group-hover:text-black transition-colors" />
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="w-[var(--radix-dropdown-menu-trigger-width)] bg-white border border-zinc-100 rounded-2xl p-1 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                                    {['piece', 'kg', 'g', 'l', 'ml', 'box', 'pack'].map((u) => (
                                        <DropdownMenuItem
                                            key={u}
                                            onClick={() => setForm({ ...form, unit: u })}
                                            className={cn(
                                                "px-4 py-3 rounded-xl font-bold uppercase text-[10px] tracking-[0.2em] transition-all cursor-pointer",
                                                form.unit === u ? "text-black bg-zinc-50" : "text-zinc-400 hover:text-black focus:bg-zinc-50"
                                            )}
                                        >
                                            {t(`inventory.units.${u}`)}
                                        </DropdownMenuItem>
                                    ))}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>
                </div>

                {/* Inventory & Pricing */}
                <div className="space-y-6">
                    <div className={sectionTitleClass}>
                        <span className={sectionLabelClass}>{t('inventory.form.sections.inventory_pricing')}</span>
                        <div className={sectionLineClass} />
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                        <div className={inputWrapperClass}>
                            <label className={labelClass}>{t('inventory.form.labels.cost')}</label>
                            <div className="relative">
                                <input
                                    type="number"
                                    step="0.01"
                                    value={form.cost_price}
                                    onChange={(e) => setForm({ ...form, cost_price: parseFloat(e.target.value) || 0 })}
                                    className={inputClass + " pr-12"}
                                />
                                <span className="absolute right-5 top-1/2 -translate-y-1/2 text-zinc-400 font-black text-[10px]">DZ</span>
                            </div>
                        </div>
                        <div className={inputWrapperClass}>
                            <label className={labelClass}>{t('inventory.form.labels.selling')}</label>
                            <div className="relative">
                                <input
                                    type="number"
                                    step="0.01"
                                    value={form.selling_price}
                                    onChange={(e) => setForm({ ...form, selling_price: parseFloat(e.target.value) || 0 })}
                                    className={inputClass + " bg-zinc-200/50 pr-12"}
                                />
                                <span className="absolute right-5 top-1/2 -translate-y-1/2 text-zinc-500 font-black text-[10px]">DZ</span>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                        <div className={inputWrapperClass}>
                            <label className={labelClass}>{t('inventory.form.labels.initial_stock')}</label>
                            <input
                                type="number"
                                value={form.stock_quantity}
                                onChange={(e) => setForm({ ...form, stock_quantity: parseInt(e.target.value) || 0 })}
                                className={inputClass}
                            />
                        </div>
                        <div className={inputWrapperClass}>
                            <label className={labelClass}>{t('inventory.form.labels.low_stock_alert')}</label>
                            <input
                                type="number"
                                value={form.reorder_level}
                                onChange={(e) => setForm({ ...form, reorder_level: parseInt(e.target.value) || 0 })}
                                className={inputClass + " bg-red-100/10 text-red-600"}
                            />
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex gap-4 pt-4">
                    <Button
                        variant="ghost"
                        onClick={onClose}
                        className="flex-1 h-16 rounded-2xl font-black uppercase tracking-widest text-xs transition-all hover:bg-zinc-100 text-zinc-400 hover:text-black"
                    >
                        {t('inventory.form.buttons.cancel')}
                    </Button>
                    <Button
                        type="submit"
                        className="flex-[2] h-16 rounded-2xl bg-black text-white font-black uppercase tracking-widest text-xs transition-all hover:bg-black/90 flex items-center justify-center gap-2 shadow-none border-none"
                    >
                        <Save size={18} />
                        {isEditing ? t('inventory.form.buttons.save') : t('inventory.form.buttons.create')}
                    </Button>
                </div>
            </form>

            {showScanner && (
                <BarcodeScanner
                    onScan={(code) => {
                        setForm({ ...form, barcode: code });
                        setShowScanner(false);
                    }}
                    onClose={() => setShowScanner(false)}
                />
            )}
        </FormModal>
    );
}


