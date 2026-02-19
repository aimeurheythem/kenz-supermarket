import { ShoppingBag } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import type { Product, CartItem } from '@/lib/types';
import type { ProductStyle } from '@/lib/product-styles';

interface ProductGridProps {
    products: Product[];
    cart: CartItem[];
    handleAddProduct: (product: Product) => void;
    getProductStyle: (id: string | number) => ProductStyle;
    formatCurrency: (value: number) => string;
    searchQuery: string;
}

export default function ProductGrid({
    products,
    cart,
    handleAddProduct,
    getProductStyle,
    formatCurrency,
    searchQuery,
}: ProductGridProps) {
    const { t } = useTranslation();

    if (!searchQuery) return null;

    return (
        <>
            <div className="flex items-center justify-between">
                <span className="text-[12px] text-emerald-500 uppercase tracking-[0.3em] font-bold">
                    {t('pos.search_results')}
                </span>
                <div className="h-[1px] flex-1 bg-zinc-100 mx-6" />
                <span className="text-[10px] font-bold text-zinc-400 uppercase">
                    {t('pos.items_found', { count: products.length })}
                </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6 pb-12">
                {products.map((product) => {
                    const inCart = cart.find((c) => c.product.id === product.id);
                    const isOutOfStock = product.stock_quantity <= 0;
                    const style = getProductStyle(product.id);
                    const isAtLimit = inCart && inCart.quantity >= product.stock_quantity;

                    return (
                        <motion.button
                            key={product.id}
                            onClick={() => handleAddProduct(product)}
                            disabled={isOutOfStock}
                            whileHover={{ scale: isOutOfStock ? 1 : 0.98 }}
                            whileTap={{ scale: isOutOfStock ? 1 : 0.95 }}
                            className={cn(
                                'group relative flex flex-col p-8 rounded-[3rem] text-left transition-all duration-300 border-0 shadow-none overflow-hidden',
                                style.bg,
                                isOutOfStock ? 'opacity-30 grayscale cursor-not-allowed' : 'cursor-pointer',
                                !isOutOfStock && isAtLimit && 'opacity-60',
                            )}
                        >
                            {inCart && (
                                <div className="absolute top-6 right-6 w-9 h-9 bg-black text-white rounded-full flex items-center justify-center text-[12px] font-black shadow-none z-20">
                                    {inCart.quantity}
                                </div>
                            )}
                            <div className="mb-10 relative">
                                <div className="w-16 h-16 rounded-[1.5rem] bg-white flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                                    <ShoppingBag size={28} className={style.iconColor} />
                                </div>
                            </div>
                            <div className="mt-auto space-y-2">
                                <h3 className="text-[17px] font-black text-black leading-tight uppercase tracking-tight">
                                    {product.name}
                                </h3>
                                <div className="flex items-center justify-between pt-2">
                                    <span className="text-xl font-black text-black tracking-tighter">
                                        {formatCurrency(product.selling_price)}
                                    </span>
                                    <div className="flex items-center gap-2">
                                        <div
                                            className={cn(
                                                'w-1.5 h-1.5 rounded-full',
                                                product.stock_quantity > 10 ? 'bg-emerald-500' : 'bg-red-500',
                                            )}
                                        />
                                        <span className="text-[10px] font-bold text-black/40 uppercase tracking-widest">
                                            {product.stock_quantity}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </motion.button>
                    );
                })}
            </div>
        </>
    );
}
