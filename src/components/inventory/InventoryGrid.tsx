import { motion } from 'framer-motion';
import { Edit2, Trash2, ShoppingBag, MoreVertical } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn, formatCurrency } from '@/lib/utils';
import type { Product, Category } from '@/lib/types';
import type { ProductStyle } from '@/lib/product-styles';
import { useTranslation } from 'react-i18next';

interface InventoryGridProps {
    products: Product[];
    getProductStyle: (id: number) => ProductStyle;
    handleEdit: (product: Product) => void;
    handleDelete: (id: number) => void;
    categories: Category[];
}

export default function InventoryGrid({
    products,
    getProductStyle: _getProductStyle,
    handleEdit,
    handleDelete,
}: InventoryGridProps) {
    const { t } = useTranslation();

    return (
        <>
            {products.map((product) => {
                const _style = _getProductStyle(product.id);
                const isLowStock = product.stock_quantity > 0 && product.stock_quantity < (product.reorder_level || 10);
                const isOutStock = product.stock_quantity <= 0;
                const displayStock = Math.max(0, product.stock_quantity);

                return (
                    <motion.div
                        key={product.id}
                        layout
                        className={cn(
                            'group relative flex flex-col p-5 rounded-[3rem] bg-white transition-all overflow-visible',
                            isOutStock
                                ? 'border-2 border-red-400/50'
                                : isLowStock
                                  ? 'border-2 border-orange-400/50'
                                  : 'border-2 border-black/10',
                        )}
                    >
                        {/* Header Row: Icon + Title + Actions */}
                        <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-4 overflow-hidden">
                                {/* Icon - No Background */}
                                <div className="w-14 h-14 rounded-[1.2rem] bg-gray-50 flex items-center justify-center shrink-0">
                                    <ShoppingBag size={24} className="text-black" />
                                </div>

                                {/* Title & Category */}
                                <div className="min-w-0">
                                    <h3 className="text-base font-bold text-black uppercase tracking-tight truncate pr-2 leading-tight">
                                        {product.name}
                                    </h3>
                                    <p className="text-xs font-medium text-zinc-400 truncate">
                                        {product.category_name
                                            ? t(`categories.${product.category_name}`, {
                                                  defaultValue: product.category_name,
                                              })
                                            : t('categories.Uncategorized')}
                                    </p>
                                </div>
                            </div>

                            {/* Actions Dropdown */}
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <button className="p-2 -mr-2 rounded-full hover:bg-black/5 text-zinc-400 hover:text-black transition-colors focus:outline-none">
                                        <MoreVertical size={18} />
                                    </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-40 rounded-xl border-black/10 bg-white">
                                    <DropdownMenuLabel>{t('inventory.table.actions')}</DropdownMenuLabel>
                                    <DropdownMenuSeparator className="bg-zinc-100" />
                                    <DropdownMenuItem
                                        onClick={() => handleEdit(product)}
                                        className="gap-2 cursor-pointer focus:bg-zinc-50"
                                    >
                                        <Edit2 size={14} />
                                        <span>{t('inventory.actions.edit')}</span>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                        onClick={() => handleDelete(product.id)}
                                        className="gap-2 text-red-600 focus:text-red-700 focus:bg-red-50 cursor-pointer"
                                    >
                                        <Trash2 size={14} />
                                        <span>{t('inventory.actions.delete')}</span>
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>

                        {/* Stats Grid */}
                        <div className="grid grid-cols-2 gap-4 mt-auto">
                            {/* Price */}
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                                    {t('inventory.table.price')}
                                </p>
                                <p className="text-lg font-black text-black">{formatCurrency(product.selling_price)}</p>
                            </div>

                            {/* Stock with Color Code */}
                            <div className="text-right rtl:text-left">
                                <p
                                    className={cn(
                                        'text-[10px] font-bold uppercase tracking-widest mb-1',
                                        isOutStock ? 'text-red-400' : isLowStock ? 'text-orange-400' : 'text-blue-400',
                                    )}
                                >
                                    {isOutStock
                                        ? t('inventory.status.out_of_stock')
                                        : isLowStock
                                          ? t('inventory.status.low_stock')
                                          : t('inventory.status.in_stock')}
                                </p>
                                <div className="flex items-center justify-end gap-2 leading-none">
                                    <span
                                        className={cn(
                                            'text-xl font-black',
                                            isOutStock
                                                ? 'text-red-500'
                                                : isLowStock
                                                  ? 'text-orange-500'
                                                  : 'text-blue-500',
                                        )}
                                    >
                                        {displayStock}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                );
            })}
        </>
    );
}
