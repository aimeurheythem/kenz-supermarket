import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, BadgePercent, ShoppingCart, Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { formatCurrency, cn } from '@/lib/utils';
import type { Product } from '@/lib/types';

interface FlashDealsPromotionsProps {
    products: Product[];
    cart: any[];
    promoIndex: number;
    setPromoIndex: (index: number | ((prev: number) => number)) => void;
    handleAddProduct: (product: Product) => void;
}

export default function FlashDealsPromotions({
    products,
    cart,
    promoIndex,
    setPromoIndex,
    handleAddProduct
}: FlashDealsPromotionsProps) {
    const { t, i18n } = useTranslation();
    const [addedItems, setAddedItems] = useState<Record<string, boolean>>({});

    const handleAdd = (product: Product) => {
        if (product.stock_quantity <= 0) return;
        handleAddProduct(product);
        const id = String(product.id);
        setAddedItems(prev => ({ ...prev, [id]: true }));
        setTimeout(() => {
            setAddedItems(prev => {
                const newState = { ...prev };
                delete newState[id];
                return newState;
            });
        }, 1000);
    };

    // Temporarily disabled products from Flash Deals as requested
    const promoProducts: Product[] = [];

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <span className="text-[12px] text-black uppercase tracking-[0.3em] font-bold">{t('pos.flash_deals.title')}</span>
                    <span className="px-2 py-0.5 rounded-full bg-yellow-400 text-[10px] font-bold text-blue-600 uppercase tracking-wider">
                        {promoProducts.length}
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setPromoIndex(prev => Math.max(0, prev - 1))}
                        disabled={promoIndex === 0}
                        className="w-10 h-10 flex items-center justify-center text-zinc-400 hover:text-black transition-all active:scale-90 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                    >
                        <ChevronLeft size={20} className={i18n.dir() === 'rtl' ? "rotate-180" : ""} />
                    </button>
                    <button
                        onClick={() => setPromoIndex(prev => Math.min(Math.max(0, promoProducts.length - 3), prev + 1))}
                        disabled={promoIndex >= promoProducts.length - 3}
                        className="w-10 h-10 flex items-center justify-center text-zinc-400 hover:text-black transition-all active:scale-90 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                    >
                        <ChevronRight size={20} className={i18n.dir() === 'rtl' ? "rotate-180" : ""} />
                    </button>
                </div>
            </div>

            {/* Promotions Section (Horizontal Carousel) */}
            <div className="relative">
                <div className="overflow-hidden">
                    <motion.div
                        className="flex pb-8"
                        style={{ gap: 18, paddingInlineStart: 15, paddingInlineEnd: 15 }}
                        animate={{ x: (i18n.dir() === 'rtl' ? 1 : -1) * (promoIndex * (340 + 18)) }}
                        transition={{
                            type: "spring",
                            stiffness: 260,
                            damping: 24,
                            mass: 0.8
                        }}
                    >
                        {promoProducts.map((product) => {
                            const isAdded = addedItems[String(product.id)];
                            const inCart = cart.find(c => c.product.id === product.id);

                            const isOutOfStock = product.stock_quantity <= 0;

                            return (
                                <motion.button
                                    key={`promo-${product.id}`}
                                    disabled={isOutOfStock}
                                    className={cn(
                                        "flex-none w-[340px] p-5 rounded-[3rem] relative cursor-pointer transition-all duration-500 group text-left",
                                        "bg-gray-100 border-2 border-transparent",
                                        isOutOfStock && "opacity-50 grayscale cursor-not-allowed"
                                    )}
                                    onClick={() => handleAdd(product)}
                                >
                                    {/* Background Layer */}
                                    <div className={cn(
                                        "absolute inset-0 rounded-[3rem] overflow-hidden pointer-events-none transition-all duration-500",
                                        inCart && "bg-yellow-400"
                                    )} />

                                    {/* Main Content (Blur on Hover) */}
                                    <div className="transition-all duration-500 group-hover:blur-[8px] group-hover:scale-[0.98] group-hover:opacity-40">
                                        <div className="flex items-center justify-between mb-8 relative z-10">
                                            <div className="flex items-center gap-3">
                                                <span className="text-[12px] uppercase tracking-widest text-black/80">Promo #{String(product.id).slice(-4)}</span>
                                            </div>
                                            <span className="text-[10px] bg-yellow-400 px-2 py-1 rounded-full text-blue-600 font-bold uppercase flex items-center gap-1">
                                                <BadgePercent size={12} strokeWidth={3} />
                                                {t('pos.flash_deals.off', { percent: 20 })}
                                            </span>
                                        </div>

                                        <div className="mb-8 relative z-10">
                                            <p className="text-[10px] text-black uppercase tracking-[0.2em] mb-2">{t('pos.flash_deals.special_price')}</p>
                                            <div className="flex items-baseline gap-2">
                                                <span className="text-4xl text-black/90 tracking-tighter">
                                                    {formatCurrency(product.selling_price * 0.8, false)}
                                                </span>
                                                <span className="text-xs text-emerald-500 uppercase">
                                                    {i18n.language === 'ar' ? 'دج' : 'DZ'}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between pt-6 border-t border-black/5 relative z-10">
                                            <div className="flex flex-col">
                                                <span className="text-[9px] text-black uppercase tracking-widest mb-1">{t('pos.flash_deals.product')}</span>
                                                <span className="text-sm text-black/60 truncate max-w-[140px]">{product.name}</span>
                                            </div>
                                            <div className="flex flex-col items-end text-right">
                                                <span className="text-[9px] text-black uppercase tracking-widest mb-1">{t('pos.flash_deals.stock')}</span>
                                                <span className="text-sm text-black/60">{product.stock_quantity} {product.unit}</span>
                                            </div>
                                        </div>

                                    </div>

                                    {/* Background Decorative Icon */}
                                    <div className="absolute top-1/2 -translate-y-1/2 ltr:-right-0 rtl:-left-0 opacity-10 pointer-events-none group-hover:scale-110 group-hover:blur-[8px] group-hover:opacity-5 transition-all duration-500 z-0">
                                        <BadgePercent size={120} className="text-black" strokeWidth={2} />
                                    </div>

                                    {/* Floating Feedback */}
                                    <AnimatePresence>
                                        {isAdded && (
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

                                    {/* Hover Overlay */}
                                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-500 z-20">
                                        <AnimatePresence mode="wait">
                                            {isAdded || inCart ? (
                                                <motion.div
                                                    key="added"
                                                    initial={{ scale: 0.5, opacity: 0 }}
                                                    animate={{ scale: 1, opacity: 1 }}
                                                    exit={{ scale: 0.5, opacity: 0 }}
                                                    className="flex flex-col items-center gap-3"
                                                >
                                                    <div className={cn(
                                                        "p-4 rounded-full shadow-2xl",
                                                        inCart ? "bg-black text-yellow-400" : "bg-yellow-400 text-blue-600"
                                                    )}>
                                                        <Check size={32} strokeWidth={3} />
                                                    </div>
                                                    <span className={cn(
                                                        "text-[10px] font-black uppercase tracking-[0.4em]",
                                                        inCart ? "text-black" : "text-blue-600"
                                                    )}>
                                                        {inCart ? t('pos.flash_deals.in_cart') : t('pos.flash_deals.added')}
                                                    </span>
                                                </motion.div>
                                            ) : (
                                                <motion.div
                                                    key="add"
                                                    initial={{ scale: 0.5, opacity: 0 }}
                                                    animate={{ scale: 1, opacity: 1 }}
                                                    exit={{ scale: 0.5, opacity: 0 }}
                                                    className="flex flex-col items-center gap-3"
                                                >
                                                    <div className="p-4 bg-black text-white rounded-full scale-75 group-hover:scale-100 transition-transform duration-500 ease-out shadow-2xl">
                                                        <ShoppingCart size={24} />
                                                    </div>
                                                    <span className="text-[10px] font-black uppercase tracking-[0.4em] text-black animate-pulse">{t('pos.flash_deals.add_to_cart')}</span>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                </motion.button>
                            );
                        })}
                    </motion.div>
                </div>

                {/* Elegant Edge Fade */}
                <div className="absolute end-0 top-0 bottom-0 w-32 bg-gradient-to-l rtl:bg-gradient-to-r from-white to-transparent z-10 pointer-events-none" />
            </div>
        </div>
    );
}
