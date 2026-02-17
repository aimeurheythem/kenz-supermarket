import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, ArrowRight, Check } from 'lucide-react';

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

export default function InventoryPreview({
    products,
    cart,
    formatCurrency,
    i18n,
    handleAddProduct
}: InventoryPreviewProps) {
    const { t } = useTranslation();
    const [addedItems, setAddedItems] = useState<Record<string, number>>({});

    const handleAdd = (product: Product) => {
        handleAddProduct(product);
        const id = String(product.id);
        setAddedItems(prev => ({ ...prev, [id]: (prev[id] || 0) + 1 }));
        setTimeout(() => {
            setAddedItems(prev => {
                const newState = { ...prev };
                delete newState[id];
                return newState;
            });
        }, 1000);
    };

    return (
        <div className="space-y-6 pt-2">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <span className="text-[12px] text-black uppercase tracking-[0.3em] font-bold">{t('pos.inventory.title')}</span>
                    <span className="px-2 py-2 rounded-full bg-yellow-300 text-[10px] font-bold text-blue-500 uppercase tracking-widest leading-none">{t('pos.inventory.quick_select')}</span>
                </div>
                <span className="text-[10px] font-bold text-zinc-300 uppercase tracking-widest">{t('pos.inventory.products_available', { count: products.length })}</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                {products.slice(0, 12).map((product) => {
                    const isOutOfStock = product.stock_quantity <= 0;
                    const inCart = cart.find(c => c.product.id === product.id);
                    const recentlyAdded = addedItems[String(product.id)];
                    const isAtLimit = inCart && inCart.quantity >= product.stock_quantity;

                    return (
                        <motion.button
                            key={`inventory-${product.id}`}
                            onClick={() => handleAdd(product)}
                            disabled={isOutOfStock}
                            whileHover={{ scale: isOutOfStock ? 1 : 0.98 }}
                            whileTap={{ scale: isOutOfStock ? 1 : 0.95 }}
                            className={cn(
                                "group relative p-5 rounded-[3rem] transition-all duration-500 ease-out text-left flex items-center gap-4 h-24",
                                "bg-white border-2 border-gray-200",
                                inCart && "border-yellow-400",
                                isOutOfStock && "opacity-30 grayscale cursor-not-allowed",
                                !isOutOfStock && isAtLimit && "opacity-60 cursor-pointer"
                            )}
                        >
                            {/* Background Layer (Handles the yellow slide effect) */}
                            <div className={cn(
                                "absolute inset-0 rounded-[3rem] overflow-hidden pointer-events-none transition-all duration-500",
                                "bg-[linear-gradient(to_bottom,white_50%,#ffee00_50%)] bg-[length:100%_300%] bg-no-repeat bg-[0%_0%] group-hover:bg-[0%_100%]",
                                inCart && "bg-[0%_100%]"
                            )} />

                            <div className="w-12 h-12 flex items-center justify-center shrink-0 relative z-10">
                                <AnimatePresence mode="wait">
                                    {recentlyAdded || inCart ? (
                                        <motion.div
                                            key="check"
                                            initial={{ scale: 0, rotate: -45 }}
                                            animate={{ scale: 1, rotate: 0 }}
                                            exit={{ scale: 0, rotate: 45 }}
                                            className="text-black"
                                        >
                                            <Check size={24} strokeWidth={3} />
                                        </motion.div>
                                    ) : (
                                        <motion.div
                                            key="bag"
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            exit={{ scale: 0 }}
                                        >
                                            <ShoppingBag size={20} className="text-zinc-400 group-hover:text-black" />
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            <div className="flex flex-col min-w-0 flex-1 relative z-10">
                                <h3 className="text-[11px] font-black text-zinc-400 group-hover:text-black uppercase tracking-tight truncate leading-none mb-2">
                                    {product.name}
                                </h3>
                                <div className="flex items-center gap-2">
                                    <span className="text-xl font-black text-black tracking-tighter">
                                        {formatCurrency(product.selling_price, false)}
                                    </span>
                                    <span className="text-[8px] font-bold text-zinc-400 group-hover:text-black/40 uppercase">
                                        {i18n.language === 'ar' ? 'دج' : 'DZ'}
                                    </span>
                                </div>
                            </div>

                            <AnimatePresence>
                                {recentlyAdded && (
                                    <motion.div
                                        initial={{ y: 20, x: 20, opacity: 0, scale: 0.5 }}
                                        animate={{ y: -60, x: 40, opacity: 1, scale: 1.5 }}
                                        exit={{ opacity: 0, scale: 0.8 }}
                                        className="absolute right-4 top-0 font-black text-yellow-500 drop-shadow-lg z-50 pointer-events-none"
                                    >
                                        +1
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {inCart && (
                                <motion.div
                                    layoutId={`count-${product.id}`}
                                    className="w-8 h-8 bg-black text-white rounded-full flex items-center justify-center text-[11px] font-black shrink-0 transition-transform group-hover:scale-110 relative z-10"
                                >
                                    {inCart.quantity}
                                </motion.div>
                            )}

                            <ArrowRight size={14} className="text-zinc-200 group-hover:text-black group-hover:-rotate-45 transition-all duration-500 relative z-10" />
                        </motion.button>
                    );
                })}
            </div>
        </div>
    );
}
