import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useProductStore } from '@/stores/useProductStore';
import { BarcodeCanvas } from '@/components/barcodes/BarcodeCanvas';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Search, Printer, Trash2, Plus, GripVertical, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn, formatCurrency } from '@/lib/utils';
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

    return (
        <div className="h-full flex flex-col gap-6 p-6 max-w-[1600px] mx-auto">
            {/* Header - Hidden on print */}
            <div className="flex items-center justify-between print:hidden">
                <div>
                    <h1 className="text-3xl font-black text-zinc-900 tracking-tight">Label Printing</h1>
                    <p className="text-zinc-500 mt-1">Generate and print product barcode labels</p>
                </div>
                <Button onClick={handlePrint} size="lg" className="bg-black text-white hover:bg-zinc-800 rounded-full gap-2">
                    <Printer size={18} />
                    Print Labels
                </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 print:hidden">
                {/* Left Column: Product Selection & Queue */}
                <div className="lg:col-span-1 space-y-6">
                    {/* Unused space filler for cleaner layout if needed, or just more content */}

                    <Card className="border-zinc-200 shadow-sm rounded-[1.5rem] overflow-hidden">
                        <CardHeader className="bg-zinc-50 border-b border-zinc-100 pb-4">
                            <CardTitle className="text-lg font-bold">Add Products</CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 space-y-4">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
                                <Input
                                    placeholder="Search by name or barcode..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-10 h-10 bg-white border-zinc-200 rounded-xl"
                                />
                            </div>

                            {/* Search Results */}
                            {searchQuery && (
                                <div className="space-y-1 max-h-[300px] overflow-y-auto">
                                    {filteredProducts.map(product => (
                                        <div
                                            key={product.id}
                                            onClick={() => addToQueue(product)}
                                            className="flex items-center justify-between p-3 bg-white hover:bg-zinc-50 border border-zinc-100 rounded-xl cursor-pointer transition-colors group"
                                        >
                                            <div className="flex flex-col">
                                                <span className="font-medium text-sm text-zinc-900 group-hover:text-black">{product.name}</span>
                                                <span className="text-xs text-zinc-500 font-mono">{product.barcode || 'NO BARCODE'}</span>
                                            </div>
                                            <Button size="icon" variant="ghost" className="h-8 w-8 text-zinc-400 group-hover:text-zinc-900">
                                                <Plus size={16} />
                                            </Button>
                                        </div>
                                    ))}
                                    {filteredProducts.length === 0 && (
                                        <div className="text-center py-4 text-zinc-400 text-sm">No products found</div>
                                    )}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Print Queue */}
                    <Card className="border-zinc-200 shadow-sm rounded-[1.5rem] overflow-hidden flex-1">
                        <CardHeader className="bg-zinc-50 border-b border-zinc-100 pb-4 flex flex-row items-center justify-between">
                            <CardTitle className="text-lg font-bold">Print Queue</CardTitle>
                            <span className="text-xs font-bold bg-zinc-200 text-zinc-600 px-2 py-1 rounded-full">{totalLabels} Labels</span>
                        </CardHeader>
                        <CardContent className="p-0 overflow-hidden">
                            <div className="max-h-[500px] overflow-y-auto p-4 space-y-2">
                                <AnimatePresence initial={false}>
                                    {queue.map(item => (
                                        <motion.div
                                            key={item.id}
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            exit={{ opacity: 0, height: 0 }}
                                            className="flex items-center gap-3 p-3 bg-white border border-zinc-100 rounded-xl shadow-sm"
                                        >
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium text-sm text-zinc-900 truncate">{item.originalProduct.name}</p>
                                                <p className="text-xs text-zinc-500 font-mono">{item.originalProduct.barcode}</p>
                                            </div>

                                            <div className="flex items-center gap-2 bg-zinc-50 rounded-lg p-1 border border-zinc-100">
                                                <button
                                                    onClick={() => updateQuantity(item.id, -1)}
                                                    className="w-6 h-6 flex items-center justify-center rounded-md hover:bg-white hover:shadow-sm text-zinc-500 transition-all font-bold"
                                                >
                                                    -
                                                </button>
                                                <span className="w-6 text-center text-sm font-semibold">{item.quantity}</span>
                                                <button
                                                    onClick={() => updateQuantity(item.id, 1)}
                                                    className="w-6 h-6 flex items-center justify-center rounded-md hover:bg-white hover:shadow-sm text-zinc-500 transition-all font-bold"
                                                >
                                                    +
                                                </button>
                                            </div>

                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-red-400 hover:text-red-600 hover:bg-red-50"
                                                onClick={() => removeFromQueue(item.id)}
                                            >
                                                <Trash2 size={16} />
                                            </Button>
                                        </motion.div>
                                    ))}
                                    {queue.length === 0 && (
                                        <div className="text-center py-12 text-zinc-400">
                                            <Printer size={32} className="mx-auto mb-3 opacity-20" />
                                            <p className="text-sm">Queue is empty</p>
                                            <p className="text-xs opacity-60">Add products to start printing</p>
                                        </div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column: Configuration & Preview */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Configuration Panel */}
                    <Card className="border-zinc-200 shadow-sm rounded-[1.5rem] overflow-hidden">
                        <CardHeader className="bg-zinc-50 border-b border-zinc-100 pb-4">
                            <CardTitle className="text-lg font-bold">Label Settings</CardTitle>
                        </CardHeader>
                        <CardContent className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Format</label>
                                    <Select value={labelFormat} onValueChange={(v: string) => setLabelFormat(v as LabelFormat)}>
                                        <SelectTrigger className="w-full">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="5160">Avery 5160 (30/Sheet)</SelectItem>
                                            <SelectItem value="thermal_50x30">Thermal 50x30mm</SelectItem>
                                            <SelectItem value="thermal_40x25">Thermal 40x25mm</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Barcode Type</label>
                                    <Select value={barcodeType} onValueChange={(v: string) => setBarcodeType(v as 'CODE128' | 'EAN13')}>
                                        <SelectTrigger className="w-full">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="CODE128">Code 128 (Standard)</SelectItem>
                                            <SelectItem value="EAN13">EAN-13 (Retail)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-4 pt-6">
                                    <div className="flex items-center space-x-2">
                                        <Checkbox id="showPrice" checked={showPrice} onCheckedChange={(c: boolean | 'indeterminate') => setShowPrice(c === true)} />
                                        <label htmlFor="showPrice" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                            Show Price
                                        </label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <Checkbox id="showName" checked={showName} onCheckedChange={(c: boolean | 'indeterminate') => setShowName(c === true)} />
                                        <label htmlFor="showName" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                            Show Product Name
                                        </label>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Preview Area */}
                    <div className="bg-zinc-100 border border-zinc-200 rounded-[1.5rem] p-8 min-h-[500px] overflow-auto flex justify-center items-start shadow-inner">
                        <div
                            className={cn(
                                "bg-white shadow-xl transition-all duration-300 origin-top",
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
                                            <p className="text-[10px] font-bold leading-tight truncate w-full mb-0.5">
                                                {product.name}
                                            </p>
                                        )}

                                        <BarcodeCanvas
                                            value={product.barcode || '00000000'}
                                            format={barcodeType}
                                            height={labelFormat === '5160' ? 30 : 25}
                                            width={1.2}
                                            fontSize={10}
                                            displayValue={true}
                                            className="w-full max-w-[90%]"
                                        />

                                        {showPrice && (
                                            <p className="text-[11px] font-black mt-0.5">
                                                {formatCurrency(product.selling_price)}
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
                                <p className="text-[10px] font-bold leading-tight truncate w-full mb-0.5">
                                    {product.name}
                                </p>
                            )}

                            <BarcodeCanvas
                                value={product.barcode || '00000000'}
                                format={barcodeType}
                                height={labelFormat === '5160' ? 30 : 25}
                                width={1.5}
                                fontSize={10}
                                displayValue={true}
                                className="w-full max-w-[90%]"
                            />

                            {showPrice && (
                                <p className="text-[11px] font-black mt-0.5">
                                    {formatCurrency(product.selling_price)}
                                </p>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
