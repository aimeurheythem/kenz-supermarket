# UI Component Contracts: Promotion Management

**Feature**: 003-promotion-management  
**Design Consistency**: All components follow exact patterns from Inventory.tsx and Expenses.tsx

## Component Tree

```
src/pages/Promotions.tsx                      ← Page (route entry point)
src/components/promotions/
├── PromotionList.tsx                         ← Table with filters/pagination
├── PromotionFormModal.tsx                    ← Add/Edit modal (shared)
├── PromotionDetailsModal.tsx                 ← View Details modal (read-only)
├── PromotionDeleteConfirm.tsx                ← Delete confirmation dialog
├── form-sections/
│   ├── GeneralInfoSection.tsx                ← Name, type, dates, status
│   ├── PriceDiscountSection.tsx              ← Product, discount type/value
│   ├── QuantityDiscountSection.tsx           ← Product, buy/free quantities
│   └── PackDiscountSection.tsx               ← Multi-product, bundle price
└── detail-sections/
    ├── PriceDiscountDetails.tsx              ← Read-only price discount view
    ├── QuantityDiscountDetails.tsx           ← Read-only quantity discount view
    └── PackDiscountDetails.tsx               ← Read-only pack discount view
```

## Page Contract: `Promotions.tsx`

**Route**: `/promotions`  
**Permission**: `view_promotions`

**Layout** (identical to Inventory.tsx):
1. Grid background overlay
2. Header: subtitle "Manage Promotions" + title "PROMOTIONS" + "Add Promotion" CTA button (yellow)
3. Stats cards (3-column grid): Total Promotions, Active Now, Expired
4. Search bar + type filter dropdown + status filter dropdown
5. Table with pagination
6. Modals: PromotionFormModal, PromotionDetailsModal, PromotionDeleteConfirm

**Styling classes** (must match exactly):
- Page wrapper: `relative flex flex-col h-full gap-8 p-6 lg:p-8 animate-fadeIn mt-4 min-h-[85vh]`
- Header subtitle: `text-[12px] text-zinc-400 tracking-[0.3em] font-bold uppercase`
- Header title: `text-4xl font-black text-black tracking-tighter uppercase`
- CTA button: `px-5 py-3 bg-yellow-400 hover:bg-yellow-300 text-black rounded-[3rem] font-black uppercase tracking-widest text-xs`
- Stats cards: `bg-gray-100 rounded-[3rem] p-6` (light) or `bg-black text-white rounded-[3rem]` (dark)
- Table container: `rounded-[3rem] bg-white border-2 border-black/5 overflow-hidden`
- Table header cells: `text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400`

## Component Contract: `PromotionFormModal.tsx`

**Props**:
```typescript
interface PromotionFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    promotion?: Promotion;  // If provided → edit mode, else → create mode
}
```

**Behavior**:
- Uses `Dialog` from `@radix-ui/react-dialog`
- General info section always visible
- Type-specific section renders conditionally based on selected `type`
- Product selection: searchable dropdown using existing products from `useProductStore`
- Validation before submit (client-side)
- On submit: calls `addPromotion()` or `updatePromotion()` from `usePromotionStore`
- Toast feedback on success/error

**Form State**:
```typescript
{
    name: string;
    type: PromotionType;
    status: PromotionStatus;
    start_date: string;
    end_date: string;
    // Type-specific
    product_ids: number[];
    config: PromotionConfig;
}
```

## Component Contract: `PromotionDetailsModal.tsx`

**Props**:
```typescript
interface PromotionDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    promotion: Promotion;   // Full promotion with products
}
```

**Behavior**:
- Read-only display
- Shows general info at top
- Renders type-specific detail section based on `promotion.type`
- Computes derived values (e.g., final price, total savings) from config + product data

## Promotion Type Badges

| Type | Badge Color | Label |
|------|-------------|-------|
| `price_discount` | Blue (`bg-blue-100 text-blue-700`) | "Price Discount" |
| `quantity_discount` | Purple (`bg-purple-100 text-purple-700`) | "Qty Discount" |
| `pack_discount` | Amber (`bg-amber-100 text-amber-700`) | "Bundle" |

## Status Badges

| Status | Badge Color | Label |
|--------|-------------|-------|
| `active` | Green (`bg-emerald-100 text-emerald-700`) | "Active" |
| `inactive` | Gray (`bg-zinc-100 text-zinc-500`) | "Inactive" |
| `expired` (computed) | Red (`bg-rose-100 text-rose-600`) | "Expired" |
| `scheduled` (computed) | Blue (`bg-sky-100 text-sky-600`) | "Scheduled" |
