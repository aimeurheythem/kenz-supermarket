import type {
    CartItem,
    Promotion,
    PromotionResult,
    BundleResult,
    PromotionApplicationResult,
    PriceDiscountConfig,
    QuantityDiscountConfig,
    PackDiscountConfig,
} from '@/lib/types';

/**
 * Parse the JSON config field on a promotion.
 */
function parseConfig<T>(promotion: Promotion): T {
    if (typeof promotion.config === 'string') {
        return JSON.parse(promotion.config) as T;
    }
    return promotion.config as unknown as T;
}

/**
 * Compute the best applicable price-discount for a single cart item.
 */
function computePriceDiscount(
    item: CartItem,
    promotion: Promotion
): PromotionResult | null {
    const cfg = parseConfig<PriceDiscountConfig>(promotion);
    let discountAmount: number;
    let description: string;

    if (cfg.discount_type === 'percentage') {
        const rawPerUnit = item.product.selling_price * (cfg.discount_value / 100);
        const cappedPerUnit =
            cfg.max_discount != null
                ? Math.min(rawPerUnit, cfg.max_discount)
                : rawPerUnit;
        discountAmount = cappedPerUnit * item.quantity;
        description = `${cfg.discount_value}% off`;
        if (cfg.max_discount != null) {
            description += ` (max ${cfg.max_discount})`;
        }
    } else {
        // fixed
        discountAmount = cfg.discount_value * item.quantity;
        description = `${cfg.discount_value} off`;
    }

    // Clamp to total item cost
    discountAmount = Math.min(discountAmount, item.product.selling_price * item.quantity);

    if (discountAmount <= 0) return null;

    return {
        productId: item.product.id,
        promotionId: promotion.id,
        promotionName: promotion.name,
        promotionType: promotion.type,
        discountAmount,
        description,
    };
}

/**
 * Compute a quantity (buy-X-get-Y-free) discount for a single cart item.
 */
function computeQuantityDiscount(
    item: CartItem,
    promotion: Promotion
): PromotionResult | null {
    const cfg = parseConfig<QuantityDiscountConfig>(promotion);
    const totalRequired = cfg.buy_quantity + cfg.free_quantity;
    const fullCycles = Math.floor(item.quantity / totalRequired);
    const freeUnits = fullCycles * cfg.free_quantity;
    const discountAmount = freeUnits * item.product.selling_price;

    if (discountAmount <= 0) return null;

    return {
        productId: item.product.id,
        promotionId: promotion.id,
        promotionName: promotion.name,
        promotionType: promotion.type,
        discountAmount,
        freeQuantity: freeUnits,
        description: `Buy ${cfg.buy_quantity} Get ${cfg.free_quantity} Free`,
    };
}

/**
 * Compute a pack/bundle discount given all matching cart items.
 */
function computePackDiscount(
    cart: CartItem[],
    promotion: Promotion
): BundleResult | null {
    if (!promotion.products || promotion.products.length === 0) return null;

    const cfg = parseConfig<PackDiscountConfig>(promotion);
    const productIds = promotion.products.map((p) => p.product_id);

    // Gather cart items that participate in this bundle
    const participatingItems = cart.filter((item) =>
        productIds.includes(item.product.id)
    );

    if (participatingItems.length !== productIds.length) {
        // Not all bundle products are in cart
        return null;
    }

    const minSets = Math.min(...participatingItems.map((i) => i.quantity));
    if (minSets < 1) return null;

    const originalPricePerSet = participatingItems.reduce(
        (sum, i) => sum + i.product.selling_price,
        0
    );
    const savingsPerSet = originalPricePerSet - cfg.bundle_price;

    if (savingsPerSet <= 0) return null;

    const totalSavings = minSets * savingsPerSet;
    const originalTotal = minSets * originalPricePerSet;

    return {
        promotionId: promotion.id,
        promotionName: promotion.name,
        productIds,
        bundlePrice: cfg.bundle_price * minSets,
        originalTotal,
        savings: totalSavings,
        description: `Bundle ${minSets}× ${promotion.name} @ ${cfg.bundle_price}`,
    };
}

/**
 * Check if a promotion is currently effective (within date range and active).
 */
function isEffective(promotion: Promotion): boolean {
    if (promotion.status !== 'active') return false;
    const now = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    return promotion.start_date <= now && promotion.end_date >= now;
}

/**
 * Compute all applicable promotions for a cart.
 *
 * @param cart     - Current cart items
 * @param promotions - Active/candidate promotions (already pre-filtered by caller or fetched via PromotionRepo.getActiveForCheckout)
 * @returns PromotionApplicationResult with itemDiscounts, bundleDiscounts, totalSavings
 */
export function computeCartPromotions(
    cart: CartItem[],
    promotions: Promotion[]
): PromotionApplicationResult {
    const effectivePromotions = promotions.filter(isEffective);

    const pricePromotions = effectivePromotions.filter(
        (p) => p.type === 'price_discount'
    );
    const quantityPromotions = effectivePromotions.filter(
        (p) => p.type === 'quantity_discount'
    );
    const packPromotions = effectivePromotions.filter(
        (p) => p.type === 'pack_discount'
    );

    // --- Bundle discounts (pack promotions) ---
    const bundleDiscounts: BundleResult[] = [];
    // Track which products are claimed by a bundle (productId → savings)
    const bundleSavingsPerProduct = new Map<number, number>();

    for (const promotion of packPromotions) {
        const result = computePackDiscount(cart, promotion);
        if (!result) continue;

        bundleDiscounts.push(result);

        // Distribute savings evenly across bundle products for comparison
        const savingsPerProduct = result.savings / result.productIds.length;
        for (const pid of result.productIds) {
            bundleSavingsPerProduct.set(
                pid,
                (bundleSavingsPerProduct.get(pid) ?? 0) + savingsPerProduct
            );
        }
    }

    // --- Per-item discounts (price + quantity) ---
    const itemDiscounts: PromotionResult[] = [];

    for (const item of cart) {
        const candidates: PromotionResult[] = [];

        // Price discounts applicable to this product
        for (const promo of pricePromotions) {
            if (
                !promo.products ||
                promo.products.some((p) => p.product_id === item.product.id)
            ) {
                const result = computePriceDiscount(item, promo);
                if (result) candidates.push(result);
            }
        }

        // Quantity discounts applicable to this product
        for (const promo of quantityPromotions) {
            if (
                !promo.products ||
                promo.products.some((p) => p.product_id === item.product.id)
            ) {
                const result = computeQuantityDiscount(item, promo);
                if (result) candidates.push(result);
            }
        }

        if (candidates.length === 0) continue;

        // Pick the most beneficial per-item promotion
        const best = candidates.reduce((prev, curr) =>
            curr.discountAmount > prev.discountAmount ? curr : prev
        );

        // Compare against bundle savings for this product (choose higher)
        const bundleSavings = bundleSavingsPerProduct.get(item.product.id) ?? 0;
        if (best.discountAmount >= bundleSavings) {
            itemDiscounts.push(best);
        }
        // If bundle is better, let the bundle result stand (no item discount added)
    }

    const totalItemSavings = itemDiscounts.reduce(
        (sum, d) => sum + d.discountAmount,
        0
    );
    const totalBundleSavings = bundleDiscounts.reduce(
        (sum, b) => sum + b.savings,
        0
    );

    return {
        itemDiscounts,
        bundleDiscounts,
        totalSavings: totalItemSavings + totalBundleSavings,
    };
}

/**
 * Convenience: compute total discount amount for a specific product in a cart.
 */
export function getProductDiscount(
    productId: number,
    cart: CartItem[],
    promotions: Promotion[]
): number {
    const result = computeCartPromotions(cart, promotions);
    const itemDiscount = result.itemDiscounts.find(
        (d) => d.productId === productId
    );
    if (itemDiscount) return itemDiscount.discountAmount;

    // Check bundle discounts
    const bundleDiscount = result.bundleDiscounts.find((b) =>
        b.productIds.includes(productId)
    );
    return bundleDiscount ? bundleDiscount.savings / bundleDiscount.productIds.length : 0;
}
