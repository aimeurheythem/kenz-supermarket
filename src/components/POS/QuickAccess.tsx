import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, ArrowRight, Zap, Plus, Check } from 'lucide-react';
import { cn, formatCurrency } from '@/lib/utils';
import Button from '@/components/common/Button';
import type { Product, QuickAccessItem } from '@/lib/types';
import { useTranslation } from 'react-i18next';
import { useState } from 'react';

interface QuickAccessProps {
    user: any;
    items: QuickAccessItem[];
    products: Product[];
    cart: any[];
    addToCart: (item: any) => void;
    setIsManagerOpen: (open: boolean) => void;
}

export default function QuickAccess({ user, items, products, cart, addToCart, setIsManagerOpen }: QuickAccessProps) {
    const { t, i18n } = useTranslation();
    const [addedItems, setAddedItems] = useState<Record<string, boolean>>({});

    const handleAdd = async (item: QuickAccessItem, opt: any, optIdx: number) => {
        if (!item.product_id) return;
        const prod = products.find((p) => p.id === item.product_id);
        if (prod) {
            await addToCart({
                product: { ...prod, selling_price: opt.price / opt.qty },
                quantity: opt.qty,
                discount: 0,
            });

            const key = `${item.id}-${optIdx}`;
            setAddedItems((prev) => ({ ...prev, [key]: true }));
            setTimeout(() => {
                setAddedItems((prev) => {
                    const newState = { ...prev };
                    delete newState[key];
                    return newState;
                });
            }, 1000);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <span className="text-[12px] text-black uppercase tracking-[0.3em] font-bold">
                    {t('pos.quick_access.title')}
                </span>
                {user?.role === 'admin' && (
                    <button
                        onClick={() => setIsManagerOpen(true)}
                        className="group flex items-center gap-0 hover:gap-2 p-2 bg-black hover:bg-yellow-400 cursor-pointer rounded-xl transition-all duration-300 ease-in-out text-white hover:text-black overflow-hidden"
                    >
                        <Plus size={20} className="shrink-0" />
                        <span className="max-w-0 group-hover:max-w-[200px] whitespace-nowrap overflow-hidden transition-all duration-500 ease-in-out text-[10px] font-bold uppercase tracking-widest opacity-0 group-hover:opacity-100">
                            {t('pos.quick_access.add_customized')}
                        </span>
                    </button>
                )}
            </div>

            {items.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 pb-4">
                    {items.filter(Boolean).map((item) =>
                        (Array.isArray(item.options) ? item.options : []).map((opt, optIdx) => {
                            const key = `${item.id}-${optIdx}`;
                            const isAdded = addedItems[key];
                            const _prod = products.find((p) => p.id === item.product_id);
                            const inCart = cart.find(
                                (c) =>
                                    c.product.id === item.product_id &&
                                    Math.abs(c.product.selling_price - opt.price / opt.qty) < 0.01,
                            );

                            return (
                                <motion.button
                                    key={key}
                                    onClick={() => handleAdd(item, opt, optIdx)}
                                    whileHover={{ scale: 0.98 }}
                                    whileTap={{ scale: 0.95 }}
                                    className={cn(
                                        'group relative p-6 rounded-[3rem] transition-all duration-500 ease-out text-left flex flex-col justify-between h-30',
                                        'bg-white',
                                        inCart && 'border-yellow-400',
                                    )}
                                >
                                    {/* Background Layer */}
                                    <div
                                        className={cn(
                                            'absolute inset-0 rounded-[3rem] overflow-hidden pointer-events-none transition-all duration-500',
                                            'bg-[linear-gradient(to_bottom,black_50%,#ffee00_50%)] bg-[length:100%_300%] bg-no-repeat bg-[0%_0%] group-hover:bg-[0%_100%]',
                                            inCart && 'bg-[0%_100%]',
                                        )}
                                    />

                                    {/* Top Row: Price + Quantity */}
                                    <div className="relative z-10 flex items-center justify-between">
                                        <span
                                            className={cn(
                                                'text-[9px] font-black uppercase tracking-widest',
                                                inCart ? 'text-black/30' : 'text-white/30 group-hover:text-black/30',
                                            )}
                                        >
                                            {opt.qty > 1
                                                ? t('pos.quick_access.units', { count: opt.qty })
                                                : t('pos.quick_access.single_unit')}
                                        </span>
                                        <div className="flex items-center gap-2">
                                            <AnimatePresence>
                                                {isAdded && (
                                                    <motion.span
                                                        initial={{ x: 10, opacity: 0 }}
                                                        animate={{ x: 0, opacity: 1 }}
                                                        exit={{ x: -10, opacity: 0 }}
                                                        className="text-[10px] font-black text-white group-hover:text-black uppercase"
                                                    >
                                                        {t('pos.flash_deals.added')}
                                                    </motion.span>
                                                )}
                                            </AnimatePresence>
                                            <span
                                                className={cn(
                                                    'text-xl font-black transition-colors duration-300 tracking-tighter',
                                                    inCart ? 'text-black' : 'text-white group-hover:text-black',
                                                )}
                                            >
                                                {formatCurrency(opt.price)}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Bottom Row: Icon + Name */}
                                    <div className="relative z-10 flex items-center gap-3">
                                        <div
                                            className={cn(
                                                'w-10 h-10 rounded-[1rem] flex items-center justify-center transition-colors duration-300 shrink-0 relative overflow-hidden',
                                                inCart ? 'bg-black/10' : 'bg-white/10 group-hover:bg-black/10',
                                            )}
                                        >
                                            <AnimatePresence mode="wait">
                                                {isAdded || inCart ? (
                                                    <motion.div
                                                        key="check"
                                                        initial={{ scale: 0, rotate: -45 }}
                                                        animate={{ scale: 1, rotate: 0 }}
                                                        exit={{ scale: 0, rotate: 45 }}
                                                    >
                                                        <Check
                                                            className={
                                                                inCart
                                                                    ? 'text-black'
                                                                    : 'text-white group-hover:text-black'
                                                            }
                                                            size={20}
                                                            strokeWidth={3}
                                                        />
                                                    </motion.div>
                                                ) : (
                                                    <motion.div
                                                        key="bag"
                                                        initial={{ scale: 0 }}
                                                        animate={{ scale: 1 }}
                                                        exit={{ scale: 0 }}
                                                    >
                                                        <ShoppingBag
                                                            className="text-white group-hover:text-black"
                                                            size={20}
                                                        />
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                        <div className="space-y-0.5">
                                            <h3
                                                className={cn(
                                                    'text-[9px] font-black uppercase tracking-[0.15em] transition-colors duration-300 truncate max-w-[120px]',
                                                    inCart
                                                        ? 'text-black/40'
                                                        : 'text-white/40 group-hover:text-black/40',
                                                )}
                                            >
                                                {item.product_name || item.display_name}
                                            </h3>
                                            <p
                                                className={cn(
                                                    'text-sm font-black uppercase tracking-tight leading-tight transition-colors duration-300',
                                                    inCart ? 'text-black' : 'text-white group-hover:text-black',
                                                )}
                                            >
                                                {opt.label}
                                            </p>
                                        </div>
                                        <ArrowRight
                                            size={14}
                                            className={cn(
                                                'ltr:ml-auto rtl:mr-auto transition-all duration-300 group-hover:-rotate-45',
                                                inCart ? 'text-black/60' : 'text-white/20 group-hover:text-black/60',
                                                i18n.dir() === 'rtl' && 'rotate-180 group-hover:rotate-[225deg]',
                                            )}
                                        />
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
                                                +{opt.qty}
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </motion.button>
                            );
                        }),
                    )}
                </div>
            ) : (
                // Fallback to instructions if no items configured
                <div className="col-span-full py-12 border-2 border-dashed border-zinc-100 rounded-[3rem] flex flex-col items-center justify-center text-center space-y-4">
                    <div className="p-4 bg-zinc-50 rounded-full text-zinc-300">
                        <Zap size={32} />
                    </div>
                    <div>
                        <h3 className="font-black text-zinc-400 uppercase tracking-tight">
                            {t('pos.quick_access.no_items')}
                        </h3>
                        <p className="text-sm text-zinc-300 font-bold uppercase tracking-wider">
                            {t('pos.quick_access.no_items_hint')}
                        </p>
                    </div>
                    {user?.role === 'admin' && (
                        <Button
                            onClick={() => setIsManagerOpen(true)}
                            className="px-8 h-12"
                        >
                            {t('pos.quick_access.add_first')}
                        </Button>
                    )}
                </div>
            )}
        </div>
    );
}
