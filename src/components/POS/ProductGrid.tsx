import { memo } from 'react';
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

function ProductGridComponent({
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

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 sm:gap-4 lg:gap-6 pb-8 sm:pb-12">
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
                                'group relative flex flex-col p-4 sm:p-6 lg:p-8 rounded-2xl sm:rounded-[3rem] text-left transition-all duration-300 border-0 shadow-none overflow-hidden',
                                style.bg,
                                isOutOfStock ? 'opacity-30 grayscale cursor-not-allowed' : 'cursor-pointer',
                                !isOutOfStock && isAtLimit && 'opacity-60',
                            )}
                        >
                            {inCart && (
                                <div className="absolute top-3 sm:top-6 right-3 sm:right-6 w-7 sm:w-9 h-7 sm:h-9 bg-black text-white rounded-full flex items-center justify-center text-[10px] sm:text-[12px] font-black shadow-none z-20">
                                    {inCart.quantity}
                                </div>
                            )}
                            <div className="mb-6 sm:mb-10 relative">
                                <div className="w-10 h-10 sm:w-14 sm:h-14 lg:w-16 lg:h-16 rounded-xl sm:rounded-[1.5rem] bg-white flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                                    <ShoppingBag size={24} className={style.iconColor} />
                                </div>
                            </div>
                            <div className="mt-auto space-y-1 sm:space-y-2">
                                <h3 className="text-sm sm:text-[15px] lg:text-[17px] font-black text-black leading-tight uppercase tracking-tight">
                                    {product.name}
                                </h3>
                                <div className="flex items-center justify-between pt-1 sm:pt-2">
                                    <span className="text-base sm:text-lg lg:text-xl font-black text-black tracking-tighter">
                                        {formatCurrency(product.selling_price)}
                                    </span>
                                    <div className="flex items-center gap-1 sm:gap-2">
                                        <div
                                            className={cn(
                                                'w-1.5 h-1.5 rounded-full',
                                                product.stock_quantity > 10 ? 'bg-emerald-500' : 'bg-red-500',
                                            )}
                                        />
                                        <span className="text-[9px] sm:text-[10px] font-bold text-black/40 uppercase tracking-widest">
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

export default memo(ProductGridComponent);
