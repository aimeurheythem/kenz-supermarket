import type { QuantityDiscountConfig, PromotionProduct } from '@/lib/types';

interface QuantityDiscountDetailsProps {
    config: QuantityDiscountConfig;
    products: PromotionProduct[];
}

export default function QuantityDiscountDetails({ config, products }: QuantityDiscountDetailsProps) {
    const product = products[0];
    const totalRequired = config.buy_quantity + config.free_quantity;

    return (
        <div className="space-y-4">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
                Buy X Get Y Free Config
            </h4>

            <div className="grid grid-cols-2 gap-3">
                <div className="bg-zinc-50 rounded-xl p-3">
                    <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-400 mb-1">Product</p>
                    <p className="text-sm font-black text-black">
                        {product?.product_name ?? <span className="text-zinc-400 italic">—</span>}
                    </p>
                </div>

                <div className="bg-zinc-50 rounded-xl p-3">
                    <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-400 mb-1">
                        Total Required
                    </p>
                    <p className="text-sm font-black text-black">{totalRequired} units</p>
                    <p className="text-[9px] font-bold text-zinc-400 mt-0.5">to trigger discount</p>
                </div>

                <div className="bg-zinc-50 rounded-xl p-3">
                    <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-400 mb-1">Buy Qty</p>
                    <p className="text-2xl font-black text-black">{config.buy_quantity}</p>
                </div>

                <div className="bg-zinc-50 rounded-xl p-3">
                    <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-400 mb-1">Free Qty</p>
                    <p className="text-2xl font-black text-yellow-600">{config.free_quantity}</p>
                </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                <p className="text-xs font-black text-yellow-700 text-center">
                    Buy {config.buy_quantity} → Get {config.free_quantity} FREE
                </p>
                <p className="text-[9px] font-bold text-yellow-500 text-center mt-1 uppercase tracking-wider">
                    Every {totalRequired} units purchased, {config.free_quantity} unit
                    {config.free_quantity > 1 ? 's' : ''} added at no cost
                </p>
            </div>
        </div>
    );
}
