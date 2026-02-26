import { memo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus } from 'lucide-react';

import { cn } from '@/lib/utils';
import type { Product } from '@/lib/types';
import { useTranslation } from 'react-i18next';

interface InventoryPreviewProps {
    products: Product[];
    cart: any[];
    formatCurrency: (amount: number, includeSymbol?: boolean) => string;
    i18n: any;
    handleAddProduct: (product: Product) => void;
}

function InventoryPreviewComponent({
    products,
    cart,
    formatCurrency,
    i18n: _i18n,
    handleAddProduct,
}: InventoryPreviewProps) {
    const { t } = useTranslation();
    const [addedItems, setAddedItems] = useState<Record<string, number>>({});

    const handleAdd = (product: Product) => {
        handleAddProduct(product);
        const id = String(product.id);
        setAddedItems((prev) => ({ ...prev, [id]: (prev[id] || 0) + 1 }));
        setTimeout(() => {
            setAddedItems((prev) => {
                const newState = { ...prev };
                delete newState[id];
                return newState;
            });
        }, 1000);
    };

    return (
        <div className="p-4 space-y-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-black">
                        {t('pos.inventory.title')}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-zinc-200 text-zinc-600 text-[9px] font-black uppercase tracking-widest leading-none">
                        {products.filter(p => p.stock_quantity > 0).length}
                    </span>
                </div>
                <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">
                    {t('pos.inventory.quick_select')}
                </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-2.5">
                {products.filter(p => p.stock_quantity > 0).slice(0, 15).map((product) => {
                    const isOutOfStock = product.stock_quantity <= 0;
                    const inCart = cart.find((c) => c.product.id === product.id);
                    const recentlyAdded = addedItems[String(product.id)];
                    const isAtLimit = inCart && inCart.quantity >= product.stock_quantity;

                    return (
                        <motion.button
                            key={`inventory-${product.id}`}
                            onClick={() => handleAdd(product)}
                            disabled={isOutOfStock}
                            whileHover={{ scale: isOutOfStock ? 1 : 0.97 }}
                            whileTap={{ scale: isOutOfStock ? 1 : 0.94 }}
                            style={{ overflow: 'visible' }}
                            className={cn(
                                'relative rounded-[2rem] border transition-all duration-200 text-left flex flex-row h-[80px]',
                                inCart
                                    ? 'bg-black border-black shadow-lg'
                                    : 'bg-white border-black/20 hover:border-black/40 hover:shadow-md',
                                isOutOfStock && 'opacity-30 grayscale cursor-not-allowed',
                                !isOutOfStock && isAtLimit && 'opacity-60',
                            )}
                        >
                            {/* ── LEFT 60%: name + category ── */}
                            <div className="flex flex-col justify-center min-w-0 px-3 py-2 pr-2" style={{ width: '70%' }}>
                                <h3 className={cn(
                                    'text-[10px] font-black uppercase tracking-tight truncate leading-tight',
                                    inCart ? 'text-white' : 'text-black',
                                )}>
                                    {product.name}
                                </h3>
                                {product.category_name && (
                                    <span className="mt-1.5 self-start px-1.5 py-1 rounded-md bg-yellow-400 text-blue-600 text-[8px] font-bold uppercase tracking-wider leading-none truncate max-w-full">
                                        {t(`categories.${product.category_name}`, { defaultValue: product.category_name })}
                                    </span>
                                )}
                            </div>

                            {/* ── VERTICAL PERFORATION ── */}
                            <div className="relative flex flex-col items-center flex-shrink-0 w-0">
                                {/* Top punch hole */}
                                <div className="absolute -top-2.5 w-5 h-5 bg-[#f2f2f0] rounded-full z-10" />
                                {/* Bottom punch hole */}
                                <div className="absolute -bottom-2.5 w-5 h-5 bg-[#f2f2f0] rounded-full z-10" />
                                {/* Dashed line */}
                                <div className={cn(
                                    'h-full border-l-2 border-dashed',
                                    inCart ? 'border-white/20' : 'border-black/20',
                                )} />
                            </div>

                            {/* ── RIGHT 40%: price + stock + plus ── */}
                            <div className="flex flex-col justify-between items-end px-3 py-2.5" style={{ width: '30%' }}>
                                {/* + button top right */}
                                <div className={cn(
                                    'w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 transition-colors',
                                    inCart ? 'bg-white/15' : 'bg-zinc-100',
                                )}>
                                    <Plus size={10} strokeWidth={3} className={inCart ? 'text-white' : 'text-zinc-500'} />
                                </div>

                                {/* Price */}
                                <div className="flex flex-col items-end gap-0.5">
                                    <span className={cn(
                                        'text-sm font-black tracking-tighter leading-none',
                                        inCart ? 'text-white' : 'text-black',
                                    )}>
                                        {formatCurrency(product.selling_price)}
                                    </span>
                                    <span className={cn(
                                        'text-[8px] font-bold leading-none',
                                        inCart ? 'text-white/50' : 'text-zinc-400',
                                    )}>
                                        {inCart
                                            ? <span className="text-[9px] font-black">{inCart.quantity} ×</span>
                                            : `${product.stock_quantity}`
                                        }
                                    </span>
                                </div>
                            </div>

                            {/* Float +1 feedback */}
                            <AnimatePresence>
                                {recentlyAdded && (
                                    <motion.div
                                        initial={{ y: 8, opacity: 0, scale: 0.8 }}
                                        animate={{ y: -24, opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0 }}
                                        className="absolute right-2 top-0 font-black text-black text-xs pointer-events-none z-50"
                                    >
                                        +1
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.button>
                    );
                })}
            </div>
        </div>
    );
}

export default memo(InventoryPreviewComponent);
