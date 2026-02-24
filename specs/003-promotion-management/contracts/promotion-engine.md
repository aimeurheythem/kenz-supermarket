# Service Contract: Promotion Engine

**Module**: `src/services/promotionEngine.ts`  
**Purpose**: Compute applicable promotions for cart items during checkout

## Exported Functions

### `computeCartPromotions(cart: CartItem[], promotions: Promotion[]): PromotionResult[]`

**Input**:
- `cart`: Current cart items (from `useSaleStore.cart`)
- `promotions`: Active promotions (from `PromotionRepo.getActiveForCheckout()`)

**Output**: Array of `PromotionResult` — one per cart item that has an applicable promotion.

```typescript
interface PromotionResult {
    productId: number;
    promotionId: number;
    promotionName: string;
    promotionType: PromotionType;
    discountAmount: number;        // Absolute discount in currency
    freeQuantity?: number;         // For quantity discounts
    description: string;           // Human-readable explanation (e.g., "20% off", "Buy 2 Get 1 Free")
}

interface BundleResult {
    promotionId: number;
    promotionName: string;
    productIds: number[];
    bundlePrice: number;
    originalTotal: number;
    savings: number;
    description: string;
}

type PromotionApplicationResult = {
    itemDiscounts: PromotionResult[];
    bundleDiscounts: BundleResult[];
    totalSavings: number;
};
```

### Algorithm

1. **Fetch active promotions** filtered by date range
2. **Group by type**: separate price, quantity, and pack promotions
3. **For each cart item**:
   a. Find all applicable price discount promotions for this product
   b. Find all applicable quantity discount promotions for this product
   c. Compute discount amount for each
   d. Select the one with the highest `discountAmount` (most beneficial)
4. **For pack/bundle promotions**:
   a. Check if all required products are in the cart
   b. Determine how many complete sets exist (repeating bundles)
   c. Compute savings per set
5. **Compare**: If a product appears in both a per-item promotion and a bundle, choose the one with higher total savings
6. **Return**: Final discount allocations

### Price Discount Calculation

```
if discount_type == 'percentage':
    raw_discount = selling_price * (discount_value / 100)
    discount = min(raw_discount, max_discount ?? Infinity)
    discount = discount * quantity    // per-unit discount × quantity
else:  // fixed
    discount = discount_value * quantity
discount = min(discount, selling_price * quantity)  // clamp to item total
```

### Quantity Discount Calculation

```
total_required = buy_quantity + free_quantity
full_cycles = floor(cart_quantity / total_required)
free_units = full_cycles * free_quantity
discount = free_units * selling_price
```

### Pack Discount Calculation

```
min_sets = min(cart_quantity_of_product for each product in bundle)
savings_per_set = sum(individual_selling_prices) - bundle_price
total_savings = min_sets * savings_per_set
```
