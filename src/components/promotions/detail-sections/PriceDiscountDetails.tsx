import { useFormatCurrency } from '@/hooks/useFormatCurrency';
import type { PriceDiscountConfig, PromotionProduct } from '@/lib/types';

interface PriceDiscountDetailsProps {
    config: PriceDiscountConfig;
    products: PromotionProduct[];
}

export default function PriceDiscountDetails({ config, products }: PriceDiscountDetailsProps) {
    const { formatCurrency: format } = useFormatCurrency();
    const product = products[0];
    const price = product?.selling_price ?? 0;

    const discountAmount =
        config.discount_type === 'percentage'
            ? (price * config.discount_value) / 100
            : config.discount_value;

    const cappedDiscount =
        config.discount_type === 'percentage' && config.max_discount
            ? Math.min(discountAmount, config.max_discount)
            : discountAmount;

    const finalPrice = Math.max(0, price - cappedDiscount);

    return (
        <div className="space-y-4">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
                Price Discount Config
            </h4>

            <div className="grid grid-cols-2 gap-3">
                <div className="bg-zinc-50 rounded-xl p-3">
                    <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-400 mb-1">Product</p>
                    <p className="text-sm font-black text-black">
                        {product?.product_name ?? <span className="text-zinc-400 italic">—</span>}
                    </p>
                    {price > 0 && (
                        <p className="text-xs font-bold text-zinc-500 mt-0.5">
                            Base price: {format(price)}
                        </p>
                    )}
                </div>

                <div className="bg-zinc-50 rounded-xl p-3">
                    <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-400 mb-1">
                        Discount
                    </p>
                    <p className="text-sm font-black text-black">
                        {config.discount_type === 'percentage'
                            ? `${config.discount_value}%`
                            : format(config.discount_value)}
                    </p>
                    <p className="text-[9px] font-bold text-zinc-400 uppercase mt-0.5">
                        {config.discount_type === 'percentage' ? 'Percentage' : 'Fixed Amount'}
                    </p>
                </div>

                {config.discount_type === 'percentage' && config.max_discount && (
                    <div className="bg-zinc-50 rounded-xl p-3">
                        <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-400 mb-1">Max Cap</p>
                        <p className="text-sm font-black text-black">{format(config.max_discount)}</p>
                    </div>
                )}

                {price > 0 && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3">
                        <p className="text-[9px] font-bold uppercase tracking-widest text-yellow-600 mb-1">
                            Final Price
                        </p>
                        <p className="text-sm font-black text-yellow-700">{format(finalPrice)}</p>
                        <p className="text-[9px] font-bold text-yellow-500 mt-0.5">
                            Save {format(cappedDiscount)}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
