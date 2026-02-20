import { Edit2, Trash2, ShoppingBag, MoreVertical, Barcode } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn, formatDate, formatCurrency, getStockStatus } from '@/lib/utils';
import type { Product } from '@/lib/types';
import { useTranslation } from 'react-i18next';

interface InventoryListProps {
    products: Product[];
    handleEdit: (product: Product) => void;
    handleDelete: (id: number) => void;
}

export default function InventoryList({ products, handleEdit, handleDelete }: InventoryListProps) {
    const { t, i18n } = useTranslation();

    return (
        <>
            {/* Table Header */}
            {products.length > 0 && (
                <div className="grid grid-cols-[60px_1.5fr_120px_60px_90px_90px_140px_1fr_1.2fr_60px] items-center gap-4 px-8 py-4 mb-2">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">
                        {t('inventory.table.id')}
                    </span>
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">
                        {t('inventory.table.product')}
                    </span>
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">
                        {t('inventory.table.barcode')}
                    </span>
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 text-center">
                        {t('inventory.table.unit')}
                    </span>
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 text-right">
                        {t('inventory.table.cost')}
                    </span>
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 text-right">
                        {t('inventory.table.selling')}
                    </span>
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 text-center">
                        {t('inventory.table.created_at')}
                    </span>
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 text-center">
                        {t('inventory.table.category')}
                    </span>
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 text-center">
                        {t('inventory.table.stock_level')}
                    </span>
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 text-right pr-2">
                        {t('inventory.table.actions')}
                    </span>
                </div>
            )}

            {/* Table Rows */}
            {products.map((product) => {
                const { isOutStock, isLowStock, isInStock } = getStockStatus(product.stock_quantity, product.reorder_level);

                return (
                    <div
                        key={product.id}
                        className="group grid grid-cols-[60px_1.5fr_120px_60px_90px_90px_140px_1fr_1.2fr_60px] items-center gap-4 p-4 rounded-3xl bg-white border border-zinc-100 hover:border-zinc-200 transition-all"
                    >
                        {/* ID */}
                        <div className="text-[11px] font-black text-blue-900 px-2 py-1 bg-yellow-400 rounded-lg w-fit">
                            #{product.id}
                        </div>

                        {/* Product Info */}
                        <div className="flex items-center gap-4 min-w-0">
                            <div className="w-10 h-10 flex items-center justify-center shrink-0">
                                <ShoppingBag size={18} className="text-black" />
                            </div>
                            <div className="flex flex-col min-w-0 pr-4">
                                <h3 className="text-sm font-black text-black uppercase tracking-tight truncate">
                                    {product.name}
                                </h3>
                            </div>
                        </div>

                        {/* Barcode */}
                        <div className="flex items-center gap-2 font-mono text-[11px] text-zinc-400 font-bold truncate">
                            <Barcode size={14} className="shrink-0" />
                            <span>{product.barcode || '---'}</span>
                        </div>

                        {/* Unit */}
                        <div className="text-[10px] font-black uppercase text-zinc-500 tracking-widest text-center">
                            {product.unit}
                        </div>

                        {/* Cost Price */}
                        <div className="text-right">
                            <p className="text-sm font-black text-zinc-500">{formatCurrency(product.cost_price)}</p>
                        </div>

                        {/* Selling Price */}
                        <div className="text-right">
                            <p className="text-sm font-black text-black">{formatCurrency(product.selling_price)}</p>
                        </div>

                        {/* Created At */}
                        <div className="text-center">
                            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-tighter">
                                {formatDate(product.created_at)}
                            </p>
                        </div>

                        {/* Category */}
                        <div className="text-center">
                            <span className="px-3 py-1.5 rounded-xl bg-zinc-50 border border-zinc-100 text-[10px] font-black uppercase text-zinc-500 tracking-widest">
                                {product.category_name
                                    ? t(`categories.${product.category_name}`, {
                                          defaultValue: product.category_name,
                                      })
                                    : t('categories.Uncategorized')}
                            </span>
                        </div>

                        {/* Stock Status Badge */}
                        <div className="flex justify-center">
                            <div
                                className={cn(
                                    'px-4 py-2 rounded-2xl font-black text-[10px] uppercase tracking-[0.15em] flex items-center justify-center min-w-[100px] text-white',
                                    isInStock && 'bg-emerald-500',
                                    isLowStock && 'bg-orange-400',
                                    isOutStock && 'bg-red-600',
                                )}
                            >
                                <span>
                                    {Math.max(0, product.stock_quantity)} ·{' '}
                                    {isInStock
                                        ? t('inventory.status.in_stock')
                                        : isLowStock
                                          ? t('inventory.status.low_stock')
                                          : t('inventory.status.out_of_stock')}
                                </span>
                            </div>
                        </div>

                        {/* Actions Dropdown */}
                        <div className="flex justify-end pr-2">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <button className="p-2 rounded-xl hover:bg-black/5 text-zinc-400 hover:text-black transition-colors focus:outline-none">
                                        <MoreVertical size={18} />
                                    </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent
                                    align={i18n.dir() === 'rtl' ? 'start' : 'end'}
                                    className="w-40 rounded-xl border-black/10 bg-white"
                                >
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
                    </div>
                );
            })}
        </>
    );
}
