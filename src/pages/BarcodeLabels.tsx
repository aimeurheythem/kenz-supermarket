import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useProductStore } from '@/stores/useProductStore';
import { BarcodeCanvas } from '@/components/barcodes/BarcodeCanvas';
import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Search, Printer, Trash2, Plus, X, Barcode, ShoppingBag, Settings2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import type { Product } from '@/lib/types';

interface PrintItem {
    id: string; // Unique ID for the print queue item
    originalProduct: Product;
    quantity: number;
}

type LabelFormat = '5160' | 'thermal_50x30' | 'thermal_40x25';

export default function BarcodeLabels() {
    const { t } = useTranslation();
    const { products, loadProducts } = useProductStore();
    const [searchQuery, setSearchQuery] = useState('');
    const [queue, setQueue] = useState<PrintItem[]>([]);
    const [labelFormat, setLabelFormat] = useState<LabelFormat>('5160');
    const [showPrice, setShowPrice] = useState(true);
    const [showName, setShowName] = useState(true);
    const [barcodeType, setBarcodeType] = useState<'CODE128' | 'EAN13'>('CODE128');

    useEffect(() => {
        loadProducts();
    }, []);

    const filteredProducts = products.filter(p =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.barcode?.includes(searchQuery)
    ).slice(0, 5); // Limit search results

    const addToQueue = (product: Product) => {
        setQueue(prev => {
            const existing = prev.find(item => item.originalProduct.id === product.id);
            if (existing) {
                return prev.map(item =>
                    item.originalProduct.id === product.id
                        ? { ...item, quantity: item.quantity + 1 }
                        : item
                );
            }
            return [...prev, { id: crypto.randomUUID(), originalProduct: product, quantity: 1 }];
        });
        setSearchQuery('');
    };

    const updateQuantity = (id: string, delta: number) => {
        setQueue(prev => prev.map(item => {
            if (item.id === id) {
                const newQty = Math.max(1, item.quantity + delta);
                return { ...item, quantity: newQty };
            }
            return item;
        }));
    };

    const removeFromQueue = (id: string) => {
        setQueue(prev => prev.filter(item => item.id !== id));
    };

    const handlePrint = () => {
        window.print();
    };

    // Calculate total labels needed
    const totalLabels = queue.reduce((sum, item) => sum + item.quantity, 0);

    // Generate label array for preview
    const labelArray = queue.flatMap(item => Array(item.quantity).fill(item.originalProduct));

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('fr-FR', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(price) + ' DZ';
    };

    return (
        <div className="relative flex flex-col h-full gap-8 p-6 lg:p-8 animate-fadeIn mt-4 min-h-[85vh]">
            {/* Grid Background (Matching Dashboard/POS) */}
            <div className="absolute inset-0 rounded-[3rem] pointer-events-none opacity-[0.15]"
                style={{
                    backgroundImage: `linear-gradient(to right, rgba(0, 0, 0, 0.3) 1px, transparent 1px), linear-gradient(to bottom, rgba(0, 0, 0, 0.3) 1px, transparent 1px)`,
                    backgroundSize: '32px 32px',
                    maskImage: 'radial-gradient(circle at top center, black, transparent 90%)',
                    WebkitMaskImage: 'radial-gradient(circle at top center, black, transparent 90%)'
                }}
            />

            {/* Header Section */}
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
                <div className="flex flex-col gap-1">
                    <span className="text-[12px] text-zinc-400 tracking-[0.3em] font-bold uppercase">{t('barcode_labels.label_management')}</span>
                    <h1 className="text-4xl font-black text-black tracking-tighter uppercase">{t('barcode_labels.title')}</h1>
                </div>
                <Button
                    onClick={handlePrint}
                    disabled={queue.length === 0}
                    className="flex items-center gap-2 px-6 py-6 bg-black text-white hover:bg-zinc-800 rounded-[3rem] font-black uppercase tracking-widest text-xs transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <Printer size={18} strokeWidth={3} />
                    <span>{t('barcode_labels.print_labels')} ({totalLabels})</span>
                </Button>
            </div>

            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-3 gap-8 print:hidden flex-1 min-h-0">
                {/* Left Column: Product Selection & Queue */}
                <div className="lg:col-span-1 flex flex-col gap-6 min-h-0">

                    {/* Add Products Card */}
                    <div className="bg-white/80 rounded-[3rem] p-6 border-2 border-gray-200">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-3">
                                <Search size={20} />
                            </div>
                            <h2 className="text-lg font-black uppercase tracking-tight">{t('barcode_labels.add_products')}</h2>
                        </div>

                        <div className="relative group">
                            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-black transition-colors" size={20} />
                            <input
                                placeholder={t('barcode_labels.search_placeholder')}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-14 pr-4 py-4 bg-gray-100 border-2 border-transparent focus:border-black/10 focus:bg-white rounded-[2rem] font-bold text-sm transition-all outline-none placeholder:text-zinc-400"
                            />
                        </div>

                        {/* Search Results */}
                        <AnimatePresence>
                            {searchQuery && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="mt-4 space-y-2"
                                >
                                    {filteredProducts.map(product => (
                                        <div
                                            key={product.id}
                                            onClick={() => addToQueue(product)}
                                            className="group flex items-center justify-between p-4 bg-white hover:bg-blue-100 border border-zinc-100 hover:border-blue-100 rounded-[1.5rem] cursor-pointer transition-all active:scale-[0.98]"
                                        >
                                            <div className="flex flex-col min-w-0">
                                                <span className="font-bold text-sm text-zinc-900 group-hover:text-blue-900 uppercase tracking-tight truncate">{product.name}</span>
                                                <span className="text-[10px] text-zinc-400 font-mono font-bold">{product.barcode || t('barcode_labels.no_barcode')}</span>
                                            </div>
                                            <div className="h-8 w-8 rounded-full bg-zinc-100 group-hover:bg-blue-200 flex items-center justify-center transition-colors">
                                                <Plus size={16} className="text-zinc-400 group-hover:text-blue-600" strokeWidth={3} />
                                            </div>
                                        </div>
                                    ))}
                                    {filteredProducts.length === 0 && (
                                        <div className="text-center py-8 text-zinc-400 text-xs font-bold uppercase tracking-wider">{t('barcode_labels.no_products_found')}</div>
                                    )}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Print Queue */}
                    <div className="flex-1 bg-white rounded-[3rem] p-6 border-2 border-gray-200 flex flex-col min-h-0">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <div className="p-3">
                                    <ShoppingBag size={20} />
                                </div>
                                <h2 className="text-lg font-black uppercase tracking-tight">{t('barcode_labels.queue')}</h2>
                            </div>
                            <span className="px-3 py-1 bg-yellow-400 rounded-full text-[10px] font-black uppercase tracking-wider text-blue-600">
                                {queue.length} {t('barcode_labels.items')}
                            </span>
                        </div>

                        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-3">
                            <AnimatePresence initial={false}>
                                {queue.map(item => (
                                    <motion.div
                                        key={item.id}
                                        initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                                        animate={{ opacity: 1, height: 'auto', marginBottom: 12 }}
                                        exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                                        className="flex items-center gap-3 p-3 bg-white border-2 border-zinc-200 rounded-[1.5rem]"
                                    >
                                        <div className="flex-1 min-w-0">
                                            <p className="font-bold text-xs text-zinc-900 uppercase tracking-tight truncate">{item.originalProduct.name}</p>
                                            <p className="text-[10px] text-zinc-400 font-mono font-bold">{item.originalProduct.barcode}</p>
                                        </div>

                                        <div className="flex items-center gap-1 bg-zinc-100 rounded-xl p-1 border border-zinc-200">
                                            <button
                                                onClick={() => updateQuantity(item.id, -1)}
                                                className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white text-zinc-400 hover:text-black transition-all font-bold"
                                            >
                                                -
                                            </button>
                                            <span className="w-6 text-center text-xs font-black">{item.quantity}</span>
                                            <button
                                                onClick={() => updateQuantity(item.id, 1)}
                                                className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white text-zinc-400 hover:text-black transition-all font-bold"
                                            >
                                                +
                                            </button>
                                        </div>

                                        <button
                                            className="h-9 w-9 flex items-center justify-center rounded-xl bg-red-50 text-red-400 hover:text-white hover:bg-red-500 transition-all ml-1"
                                            onClick={() => removeFromQueue(item.id)}
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </motion.div>
                                ))}
                                {queue.length === 0 && (
                                    <div className="text-center py-12 flex flex-col items-center justify-center h-full">
                                        <div className="h-16 w-16 bg-zinc-50 rounded-full flex items-center justify-center mb-4">
                                            <Barcode size={32} className="text-zinc-300" />
                                        </div>
                                        <p className="text-sm font-black text-zinc-300 uppercase tracking-widest">{t('barcode_labels.queue_empty')}</p>
                                    </div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                </div>

                {/* Right Column: Configuration & Preview */}
                <div className="lg:col-span-2 flex flex-col gap-6 min-h-0">
                    {/* Configuration Panel */}
                    <div className="bg-white rounded-[2.5rem] p-6 border-2 border-gray-200">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-3">
                                <Settings2 size={20} />
                            </div>
                            <h2 className="text-lg font-black uppercase tracking-tight">{t('barcode_labels.settings')}</h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-2">{t('barcode_labels.paper_format')}</label>
                                <Select value={labelFormat} onValueChange={(v: string) => setLabelFormat(v as LabelFormat)}>
                                    <SelectTrigger className="w-full h-12 rounded-[2rem] border-2 border-zinc-200 bg-zinc-50 font-bold focus:ring-0">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="bg-white border-2 border-zinc-200 rounded-[1.5rem]">
                                        <SelectItem value="5160">{t('barcode_labels.formats.avery_5160')}</SelectItem>
                                        <SelectItem value="thermal_50x30">{t('barcode_labels.formats.thermal_50x30')}</SelectItem>
                                        <SelectItem value="thermal_40x25">{t('barcode_labels.formats.thermal_40x25')}</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-2">{t('barcode_labels.barcode_type')}</label>
                                <Select value={barcodeType} onValueChange={(v: string) => setBarcodeType(v as 'CODE128' | 'EAN13')}>
                                    <SelectTrigger className="w-full h-12 rounded-[2rem] border-2 border-zinc-200 bg-zinc-50 font-bold focus:ring-0">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="bg-white border-2 border-zinc-200 rounded-[1.5rem]">
                                        <SelectItem value="CODE128">{t('barcode_labels.types.code128')}</SelectItem>
                                        <SelectItem value="EAN13">{t('barcode_labels.types.ean13')}</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-4 pt-8">
                                <div className="flex items-center space-x-3">
                                    <Checkbox id="showPrice" checked={showPrice} onCheckedChange={(c: boolean | 'indeterminate') => setShowPrice(c === true)}
                                        className="h-6 w-6 rounded-lg border-2 border-zinc-300 data-[state=checked]:bg-yellow-400 data-[state=checked]:border-yellow-400"
                                    />
                                    <label htmlFor="showPrice" className="text-sm font-bold leading-none cursor-pointer select-none">
                                        {t('barcode_labels.show_price')}
                                    </label>
                                </div>
                                <div className="flex items-center space-x-3">
                                    <Checkbox id="showName" checked={showName} onCheckedChange={(c: boolean | 'indeterminate') => setShowName(c === true)}
                                        className="h-6 w-6 rounded-lg border-2 border-zinc-300 data-[state=checked]:bg-yellow-400 data-[state=checked]:border-yellow-400"
                                    />
                                    <label htmlFor="showName" className="text-sm font-bold leading-none cursor-pointer select-none">
                                        {t('barcode_labels.show_product_name')}
                                    </label>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Preview Area */}
                    <div className="flex-1 bg-zinc-100 rounded-[3rem] border-3 border-dashed border-zinc-200 p-8 min-h-[400px] overflow-auto flex justify-center items-start shadow-inner">
                        <div
                            className={cn(
                                "bg-white shadow-2xl transition-all duration-300 origin-top",
                                labelFormat === '5160' ? "w-[215.9mm] min-h-[279.4mm] p-[10mm]" :
                                    labelFormat === 'thermal_50x30' ? "w-[50mm] min-h-[30mm] p-1" :
                                        "w-[40mm] min-h-[25mm] p-1"
                            )}
                        >
                            <div
                                className={cn(
                                    "grid",
                                    labelFormat === '5160' ? "grid-cols-3 gap-x-[4mm] gap-y-[0mm]" : "grid-cols-1 gap-1"
                                )}
                            >
                                {labelArray.map((product, idx) => (
                                    <div
                                        key={`${product.id}-${idx}`}
                                        className={cn(
                                            "flex flex-col items-center justify-center text-center overflow-hidden border border-dashed border-zinc-200",
                                            labelFormat === '5160' ? "h-[25.4mm] px-2" :
                                                labelFormat === 'thermal_50x30' ? "h-[30mm] px-1" :
                                                    "h-[25mm] px-0.5"
                                        )}
                                    >
                                        {showName && (
                                            <p className={cn("font-bold leading-tight truncate w-full shrink-0", labelFormat === '5160' ? "text-[9px] mb-[1px]" : "text-[10px] mb-0.5")}>
                                                {product.name}
                                            </p>
                                        )}

                                        <BarcodeCanvas
                                            value={product.barcode || '00000000'}
                                            format={barcodeType}
                                            height={labelFormat === '5160' ? 14 : 25}
                                            width={labelFormat === '5160' ? 1 : 1.2}
                                            fontSize={labelFormat === '5160' ? 9 : 10}
                                            marginTop={labelFormat === '5160' ? 0 : 10}
                                            marginBottom={labelFormat === '5160' ? 0 : 10}
                                            marginLeft={labelFormat === '5160' ? 0 : 10}
                                            marginRight={labelFormat === '5160' ? 0 : 10}
                                            textMargin={labelFormat === '5160' ? 0 : 2}
                                            displayValue={true}
                                            className={cn("object-contain", labelFormat === '5160' ? "max-w-full max-h-[14mm]" : "w-full max-w-[95%]")}
                                        />

                                        {showPrice && (
                                            <p className={cn("font-black shrink-0", labelFormat === '5160' ? "text-[10px] mt-[1px]" : "text-[11px] mt-0.5")}>
                                                {formatPrice(product.selling_price)}
                                            </p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Print View - Only visible when printing */}
            <div className="hidden print:block absolute top-0 left-0 w-full bg-white z-[9999]">
                <div
                    className={cn(
                        "grid",
                        labelFormat === '5160' ? "grid-cols-3 gap-x-[4mm] gap-y-[0mm] p-[10mm]" : "grid-cols-1"
                    )}
                >
                    {labelArray.map((product, idx) => (
                        <div
                            key={`${product.id}-${idx}`}
                            className={cn(
                                "flex flex-col items-center justify-center text-center overflow-hidden",
                                labelFormat === '5160' ? "h-[25.4mm] px-2" :
                                    labelFormat === 'thermal_50x30' ? "h-[30mm] px-1 page-break-after-always" :
                                        "h-[25mm] px-0.5 page-break-after-always"
                            )}
                        >
                            {showName && (
                                <p className={cn("font-bold leading-tight truncate w-full shrink-0", labelFormat === '5160' ? "text-[9px] mb-[1px]" : "text-[10px] mb-0.5")}>
                                    {product.name}
                                </p>
                            )}

                            <BarcodeCanvas
                                value={product.barcode || '00000000'}
                                format={barcodeType}
                                height={labelFormat === '5160' ? 14 : 25}
                                width={labelFormat === '5160' ? 1 : 1.5}
                                fontSize={labelFormat === '5160' ? 9 : 10}
                                marginTop={labelFormat === '5160' ? 0 : 10}
                                marginBottom={labelFormat === '5160' ? 0 : 10}
                                marginLeft={labelFormat === '5160' ? 0 : 10}
                                marginRight={labelFormat === '5160' ? 0 : 10}
                                textMargin={labelFormat === '5160' ? 0 : 2}
                                displayValue={true}
                                className={cn("object-contain", labelFormat === '5160' ? "max-w-full max-h-[14mm]" : "w-full max-w-[95%]")}
                            />

                            {showPrice && (
                                <p className={cn("font-black shrink-0", labelFormat === '5160' ? "text-[10px] mt-[1px]" : "text-[11px] mt-0.5")}>
                                    {formatPrice(product.selling_price)}
                                </p>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
