import { useEffect, useState, memo } from 'react';
import { Tag, Layers, Package, X, Percent, Plus, Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { PromotionRepo } from '../../../database/repositories/promotion.repo';
import { useFormatCurrency } from '@/hooks/useFormatCurrency';
import { useProductStore } from '@/stores/useProductStore';
import { useSaleStore } from '@/stores/useSaleStore';
import { toast } from 'sonner';
import type {
    Promotion,
    PriceDiscountConfig,
    QuantityDiscountConfig,
    PackDiscountConfig,
} from '@/lib/types';

// ─── Config parsing (config is stored as raw JSON string in the DB model) ─────

function parseConfig<T>(promo: Promotion): T {
    if (typeof promo.config === 'string') return JSON.parse(promo.config) as T;
    return promo.config as unknown as T;
}

// ─── Type meta ────────────────────────────────────────────────────────────────

const TYPE_META = {
    price_discount: {
        icon: Tag,
        cardBg: 'bg-yellow-50',
        accentBg: 'bg-yellow-400',
        accentText: 'text-yellow-600',
        decorIcon: Percent,
        valueSuffix: 'text-emerald-500',
    },
    quantity_discount: {
        icon: Layers,
        cardBg: 'bg-purple-50',
        accentBg: 'bg-purple-500',
        accentText: 'text-purple-600',
        decorIcon: Layers,
        valueSuffix: 'text-purple-500',
    },
    pack_discount: {
        icon: Package,
        cardBg: 'bg-orange-50',
        accentBg: 'bg-orange-400',
        accentText: 'text-orange-600',
        decorIcon: Package,
        valueSuffix: 'text-orange-500',
    },
} as const;

// ─── Value line (large number display like SaleCard) ──────────────────────────

function PromoValueLine({ promo }: { promo: Promotion }) {
    const { t } = useTranslation();
    const { formatCurrency } = useFormatCurrency();
    const meta = TYPE_META[promo.type];

    if (promo.type === 'price_discount') {
        const c = parseConfig<PriceDiscountConfig>(promo);
        return (
            <div className="flex items-baseline gap-2 mb-5">
                <span className="text-4xl text-black/90 tracking-tighter">
                    {c.discount_type === 'percentage' ? `${c.discount_value}%` : formatCurrency(c.discount_value)}
                </span>
                <span className={`text-xs uppercase tracking-widest ${meta.valueSuffix}`}>
                    {t('pos.promo_banner.off', 'off')}
                </span>
            </div>
        );
    }
    if (promo.type === 'quantity_discount') {
        const c = parseConfig<QuantityDiscountConfig>(promo);
        return (
            <div className="flex items-baseline gap-2 mb-5">
                <span className="text-3xl text-black/90 tracking-tighter">
                    {c.buy_quantity}+{c.free_quantity}
                </span>
                <span className={`text-xs uppercase tracking-widest ${meta.valueSuffix}`}>
                    {t('pos.promo_banner.free_label', 'free')}
                </span>
            </div>
        );
    }
    // pack
    const c = parseConfig<PackDiscountConfig>(promo);
    return (
        <div className="flex items-baseline gap-2 mb-5">
            <span className="text-3xl text-black/90 tracking-tighter">{formatCurrency(c.bundle_price)}</span>
            <span className={`text-xs uppercase tracking-widest ${meta.valueSuffix}`}>
                {t('pos.promo_banner.type_pack', 'bundle')}
            </span>
        </div>
    );
}

// ─── Detail sheet rows ────────────────────────────────────────────────────────

function DetailRow({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex items-center justify-between py-2.5 border-b border-black/[0.06] last:border-0">
            <span className="text-[10px] font-black uppercase tracking-widest text-black/40">{label}</span>
            <span className="text-sm font-black text-black/80">{value}</span>
        </div>
    );
}

function DetailConfigRows({ promo }: { promo: Promotion }) {
    const { t } = useTranslation();
    const { formatCurrency } = useFormatCurrency();

    if (promo.type === 'price_discount') {
        const c = parseConfig<PriceDiscountConfig>(promo);
        return (
            <>
                <DetailRow
                    label={t('promotions.details.discount')}
                    value={c.discount_type === 'percentage' ? `${c.discount_value}%` : formatCurrency(c.discount_value)}
                />
                <DetailRow
                    label={t('promotions.details.label_discount_type')}
                    value={c.discount_type === 'percentage' ? t('promotions.details.percentage') : t('promotions.details.fixed_amount')}
                />
                {c.max_discount != null && (
                    <DetailRow label={t('promotions.details.label_max_discount')} value={formatCurrency(c.max_discount)} />
                )}
            </>
        );
    }
    if (promo.type === 'quantity_discount') {
        const c = parseConfig<QuantityDiscountConfig>(promo);
        return (
            <>
                <DetailRow label={t('promotions.details.label_buy_quantity')} value={String(c.buy_quantity)} />
                <DetailRow label={t('promotions.details.label_free_quantity')} value={String(c.free_quantity)} />
                <DetailRow
                    label={t('promotions.details.label_total_required')}
                    value={String(c.buy_quantity + c.free_quantity)}
                />
            </>
        );
    }
    const c = parseConfig<PackDiscountConfig>(promo);
    return <DetailRow label={t('promotions.details.label_bundle_price')} value={formatCurrency(c.bundle_price)} />;
}

// ─── Detail modal ─────────────────────────────────────────────────────────────

function DetailModal({ promo, onClose }: { promo: Promotion; onClose: () => void }) {
    const { t } = useTranslation();
    const { products } = useProductStore();
    const { addToCart } = useSaleStore();
    const [addedIds, setAddedIds] = useState<Set<number>>(new Set());
    const meta = TYPE_META[promo.type];
    const Icon = meta.icon;
    const DecorIcon = meta.decorIcon;
    const productCount = promo.products?.length ?? 0;

    const handleAdd = async (productId: number, productName: string) => {
        const product = products.find((p) => p.id === productId);
        if (!product) return;
        await addToCart({ product, quantity: 1, discount: 0 });
        setAddedIds((prev) => new Set(prev).add(productId));
        toast.success(productName, { description: t('pos.scan.added', 'Added to cart'), duration: 1500 });
        setTimeout(() => {
            setAddedIds((prev) => { const s = new Set(prev); s.delete(productId); return s; });
        }, 2000);
    };

    const typeLabel =
        promo.type === 'price_discount'
            ? t('pos.promo_banner.type_price', 'Price Off')
            : promo.type === 'quantity_discount'
              ? t('pos.promo_banner.type_quantity', 'Buy & Get')
              : t('pos.promo_banner.type_pack', 'Bundle');

    return (
        <motion.div
            className="fixed inset-0 z-[200] flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
        >
            {/* Backdrop */}
            <motion.div
                className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                onClick={onClose}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
            />

            <motion.div
                className={`relative z-10 w-full max-w-sm rounded-[3rem] ${meta.cardBg} overflow-hidden shadow-2xl`}
                initial={{ scale: 0.88, opacity: 0, y: 24 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.88, opacity: 0, y: 24 }}
                transition={{ type: 'spring', stiffness: 320, damping: 26 }}
            >
                {/* Decorative bg icon */}
                <div className="absolute top-1/2 -translate-y-1/2 ltr:-right-4 rtl:-left-4 opacity-[0.07] pointer-events-none">
                    <DecorIcon size={130} className="text-black" />
                </div>
                <div className="absolute -bottom-12 -right-12 w-36 h-36 bg-black/20 blur-[60px] pointer-events-none" />

                <div className="relative p-8">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div className={`w-9 h-9 rounded-2xl ${meta.accentBg} flex items-center justify-center`}>
                                <Icon size={16} strokeWidth={2.5} className="text-white" />
                            </div>
                            <span className="text-[11px] uppercase tracking-widest text-black/50">{typeLabel}</span>
                        </div>
                        <button
                            onClick={onClose}
                            className="w-8 h-8 flex items-center justify-center rounded-full bg-black/10 hover:bg-black/20 transition-colors cursor-pointer"
                        >
                            <X size={14} strokeWidth={3} />
                        </button>
                    </div>

                    {/* Name + large value */}
                    <p className="text-[10px] text-black/40 uppercase tracking-[0.2em] mb-1">
                        {t('pos.promo_banner.title', 'Promotion')}
                    </p>
                    <h2 className="text-2xl font-black text-black tracking-tighter mb-4">{promo.name}</h2>
                    <PromoValueLine promo={promo} />

                    {/* Config details */}
                    <div className="bg-white/60 rounded-2xl px-4 py-1 mb-3">
                        <DetailConfigRows promo={promo} />
                    </div>

                    {/* Dates */}
                    <div className="bg-white/60 rounded-2xl px-4 py-1 mb-3">
                        <DetailRow label={t('promotions.table.start_date')} value={promo.start_date} />
                        <DetailRow label={t('promotions.table.end_date')} value={promo.end_date} />
                    </div>

                    {/* Products */}
                    {productCount > 0 && (
                        <div className="bg-white/60 rounded-2xl px-4 py-3">
                            <p className="text-[9px] font-black uppercase tracking-widest text-black/40 mb-3">
                                {t('promotions.details.label_products')} · {productCount}
                            </p>
                            <div className="flex flex-col gap-2">
                                {promo.products!.map((p) => {
                                    const isAdded = addedIds.has(p.product_id);
                                    const inStore = products.some((pr) => pr.id === p.product_id);
                                    return (
                                        <div
                                            key={p.product_id}
                                            className="flex items-center gap-3 px-3 py-2.5 rounded-2xl bg-black/[0.06]"
                                        >
                                            <div className="w-8 h-8 rounded-xl bg-black/10 flex items-center justify-center shrink-0">
                                                <Package size={13} strokeWidth={2.5} className="text-black/40" />
                                            </div>
                                            <span className="text-sm font-black text-black/80 tracking-tight flex-1">
                                                {p.product_name || `#${p.product_id}`}
                                            </span>
                                            {inStore && (
                                                <motion.button
                                                    onClick={() => handleAdd(p.product_id, p.product_name || `#${p.product_id}`)}
                                                    disabled={isAdded}
                                                    whileTap={{ scale: 0.88 }}
                                                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                                                        isAdded
                                                            ? `${meta.accentBg} text-white`
                                                            : 'bg-black/10 text-black/50 hover:bg-black hover:text-white'
                                                    }`}
                                                >
                                                    <AnimatePresence mode="wait" initial={false}>
                                                        {isAdded ? (
                                                            <motion.span
                                                                key="check"
                                                                initial={{ scale: 0 }}
                                                                animate={{ scale: 1 }}
                                                                exit={{ scale: 0 }}
                                                            >
                                                                <Check size={14} strokeWidth={3} />
                                                            </motion.span>
                                                        ) : (
                                                            <motion.span
                                                                key="plus"
                                                                initial={{ scale: 0 }}
                                                                animate={{ scale: 1 }}
                                                                exit={{ scale: 0 }}
                                                            >
                                                                <Plus size={14} strokeWidth={3} />
                                                            </motion.span>
                                                        )}
                                                    </AnimatePresence>
                                                </motion.button>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            </motion.div>
        </motion.div>
    );
}

// ─── Promo Card — matches SaleCard style ──────────────────────────────────────

function PromoCard({ promo, onClick }: { promo: Promotion; onClick: () => void }) {
    const { t } = useTranslation();
    const { products } = useProductStore();
    const { addToCart } = useSaleStore();
    const { formatCurrency } = useFormatCurrency();
    const [added, setAdded] = useState(false);

    const meta = TYPE_META[promo.type];
    const Icon = meta.icon;
    const DecorIcon = meta.decorIcon;

    // Resolve linked products from the store (need full Product object for addToCart)
    const linkedProducts = (promo.products ?? [])
        .map((pp) => ({ pp, product: products.find((p) => p.id === pp.product_id) }))
        .filter((x): x is { pp: typeof x.pp; product: NonNullable<typeof x.product> } => x.product != null);

    const canAdd = linkedProducts.length > 0;

    // Compute old / new price for pack and quantity discounts
    let originalPrice: number | null = null;
    let newPrice: number | null = null;

    if (promo.type === 'pack_discount' && linkedProducts.length > 0) {
        const c = parseConfig<PackDiscountConfig>(promo);
        originalPrice = linkedProducts.reduce((sum, { product }) => sum + product.selling_price, 0);
        newPrice = c.bundle_price;
    } else if (promo.type === 'quantity_discount' && linkedProducts.length > 0) {
        const c = parseConfig<QuantityDiscountConfig>(promo);
        const unitPrice = linkedProducts[0].product.selling_price;
        originalPrice = unitPrice * (c.buy_quantity + c.free_quantity);
        newPrice = unitPrice * c.buy_quantity;
    } else if (promo.type === 'price_discount' && linkedProducts.length > 0) {
        const c = parseConfig<PriceDiscountConfig>(promo);
        originalPrice = linkedProducts[0].product.selling_price;
        newPrice =
            c.discount_type === 'percentage'
                ? originalPrice * (1 - c.discount_value / 100)
                : Math.max(0, originalPrice - c.discount_value);
    }

    const handleAdd = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (added) return;

        if (promo.type === 'pack_discount') {
            for (const { product } of linkedProducts) {
                await addToCart({ product, quantity: 1, discount: 0 });
            }
        } else if (promo.type === 'quantity_discount') {
            const c = parseConfig<QuantityDiscountConfig>(promo);
            const { product } = linkedProducts[0];
            await addToCart({ product, quantity: c.buy_quantity, discount: 0 });
        } else {
            const { product } = linkedProducts[0];
            await addToCart({ product, quantity: 1, discount: 0 });
        }

        setAdded(true);
        setTimeout(() => setAdded(false), 2000);
    };

    const typeLabel =
        promo.type === 'price_discount'
            ? t('pos.promo_banner.type_price', 'Price Off')
            : promo.type === 'quantity_discount'
              ? t('pos.promo_banner.type_quantity', 'Buy & Get')
              : t('pos.promo_banner.type_pack', 'Bundle');

    return (
        <motion.div
            onClick={onClick}
            className={`flex-none w-[270px] p-6 rounded-[2.5rem] ${meta.cardBg} relative overflow-hidden group cursor-pointer select-none`}
            whileHover={{ scale: 1.02 }}
            transition={{ type: 'spring', stiffness: 300, damping: 22 }}
        >
            {/* Decorative bg icon */}
            <div className="absolute top-1/2 -translate-y-1/2 ltr:-right-2 rtl:-left-2 opacity-[0.08] pointer-events-none transition-transform duration-500 group-hover:scale-110">
                <DecorIcon size={88} className="text-black" />
            </div>
            <div className="absolute -bottom-8 ltr:-right-8 rtl:-left-8 w-28 h-28 bg-black/20 blur-[50px] pointer-events-none" />

            {/* Top row */}
            <div className="flex items-center justify-between mb-5 relative">
                <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-xl ${meta.accentBg} flex items-center justify-center`}>
                        <Icon size={14} strokeWidth={2.5} className="text-white" />
                    </div>
                    <span className="text-[10px] uppercase tracking-widest text-black/50">{typeLabel}</span>
                </div>
                <span className="text-[9px] text-black/30 uppercase tracking-wider">{promo.end_date}</span>
            </div>

            {/* Price block — old/new for pack & qty, big value for price off */}
            {originalPrice != null && newPrice != null ? (
                <div className="mb-5 relative">
                    <p className="text-sm font-bold text-black/40 line-through mb-0.5">{formatCurrency(originalPrice)}</p>
                    <div className="flex items-baseline gap-2">
                        <span className="text-4xl text-black/90 tracking-tighter">{formatCurrency(newPrice)}</span>
                        <span className={`text-xs uppercase tracking-widest ${meta.valueSuffix}`}>
                            -{formatCurrency(originalPrice - newPrice)}
                        </span>
                    </div>
                </div>
            ) : (
                <PromoValueLine promo={promo} />
            )}

            {/* Bottom row: name + big + button */}
            <div className="flex items-end justify-between pt-4 border-t border-black/10 relative">
                <div className="min-w-0 flex-1 pe-3">
                    <p className="text-[9px] text-black/40 uppercase tracking-widest mb-0.5">
                        {t('pos.promo_banner.title', 'Promo')}
                    </p>
                    <p className="text-sm font-black text-black/70 truncate">{promo.name}</p>
                </div>

                {canAdd && (
                    <motion.button
                        onClick={handleAdd}
                        whileTap={{ scale: 0.85 }}
                        className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 transition-colors shadow-lg ${
                            added
                                ? `${meta.accentBg} text-white`
                                : 'bg-black text-white hover:opacity-80'
                        }`}
                    >
                        <AnimatePresence mode="wait" initial={false}>
                            {added ? (
                                <motion.span key="check" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                                    <Check size={20} strokeWidth={3} />
                                </motion.span>
                            ) : (
                                <motion.span key="plus" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                                    <Plus size={20} strokeWidth={3} />
                                </motion.span>
                            )}
                        </AnimatePresence>
                    </motion.button>
                )}
            </div>
        </motion.div>
    );
}

// ─── Banner ───────────────────────────────────────────────────────────────────

function ActivePromotionsBannerComponent() {
    const { t } = useTranslation();
    const [promotions, setPromotions] = useState<Promotion[]>([]);
    const [selected, setSelected] = useState<Promotion | null>(null);

    useEffect(() => {
        PromotionRepo.getActiveForCheckout()
            .then(setPromotions)
            .catch(() => setPromotions([]));
    }, []);

    if (promotions.length === 0) return null;

    return (
        <>
            <div className="mb-4">
                <div className="flex items-center gap-2 mb-3">
                    <Tag size={11} strokeWidth={3} className="text-zinc-400" />
                    <span className="text-[9px] font-black uppercase tracking-[0.25em] text-zinc-400">
                        {t('pos.promo_banner.title', 'Active Promotions')} · {promotions.length}
                    </span>
                </div>

                <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
                    {promotions.map((promo) => (
                        <PromoCard key={promo.id} promo={promo} onClick={() => setSelected(promo)} />
                    ))}
                </div>
            </div>

            <AnimatePresence>
                {selected && <DetailModal promo={selected} onClose={() => setSelected(null)} />}
            </AnimatePresence>
        </>
    );
}

export default memo(ActivePromotionsBannerComponent);
