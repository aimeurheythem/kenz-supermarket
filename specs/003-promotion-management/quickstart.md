# Quickstart: Promotion Management System

**Feature**: 003-promotion-management  
**Date**: 2026-02-24

## Prerequisites

- Node.js 20.x installed
- Project dependencies installed (`npm install`)
- Existing database initialized (run the app once or `npm run dev`)

## Development Setup

```bash
# 1. Switch to the feature branch
git checkout 003-promotion-management

# 2. Install dependencies (if new packages added)
npm install

# 3. Start dev server
npm run dev

# 4. Run tests
npm test

# 5. Run linting
npm run lint
```

## Implementation Order

### Layer 1: Data Foundation
1. Add promotion types to `src/lib/types.ts`
2. Add schema (CREATE TABLE) to `database/schema.ts`
3. Create `database/repositories/promotion.repo.ts`
4. Export from `database/index.ts`
5. Write unit tests for repository

### Layer 2: State Management
6. Create `src/stores/usePromotionStore.ts`
7. Add permissions (`view_promotions`, `edit_promotions`) to `useAuthStore.ts`

### Layer 3: Promotion Engine
8. Create `src/services/promotionEngine.ts`
9. Write unit tests for promotion calculations
10. Integrate engine with `useSaleStore` (modify `addToCart` / selectors)

### Layer 4: UI — Admin Page
11. Create `src/pages/Promotions.tsx` (page shell + table)
12. Create `src/components/promotions/PromotionList.tsx`
13. Create `src/components/promotions/PromotionFormModal.tsx` + form sections
14. Create `src/components/promotions/PromotionDetailsModal.tsx` + detail sections
15. Create `src/components/promotions/PromotionDeleteConfirm.tsx`

### Layer 5: Integration
16. Add route to `src/App.tsx`
17. Add sidebar nav item to `src/components/layout/Sidebar.tsx`
18. Add nav item to `src/lib/navigation.ts`
19. Add i18n keys to all 3 locale files

### Layer 6: Checkout Integration
20. Modify POS cart panel to show promotion badges/annotations
21. Modify `SaleRepo.createFromCart` to persist promotion_id + promotion_name on sale_items

## Key Files to Modify

| File | Change |
|------|--------|
| `database/schema.ts` | Add `promotions`, `promotion_products` tables; ALTER `sale_items` |
| `database/index.ts` | Export `PromotionRepo` |
| `src/lib/types.ts` | Add promotion types/interfaces |
| `src/stores/useAuthStore.ts` | Add `view_promotions`, `edit_promotions` permissions |
| `src/stores/useSaleStore.ts` | Integrate promotion engine in cart calculations |
| `src/App.tsx` | Add `/promotions` route |
| `src/components/layout/Sidebar.tsx` | Add "Promotions" nav item |
| `src/lib/navigation.ts` | Add promotions nav item |
| `src/i18n/locales/en.json` | Add `promotions` namespace |
| `src/i18n/locales/fr.json` | Add `promotions` namespace |
| `src/i18n/locales/ar.json` | Add `promotions` namespace |
| `database/repositories/sale.repo.ts` | Save promotion_id/name on sale_items |

## New Files to Create

| File | Purpose |
|------|---------|
| `database/repositories/promotion.repo.ts` | Database CRUD for promotions |
| `src/stores/usePromotionStore.ts` | Zustand state management |
| `src/services/promotionEngine.ts` | Cart promotion calculation engine |
| `src/pages/Promotions.tsx` | Admin promotions list page |
| `src/components/promotions/PromotionList.tsx` | Table component |
| `src/components/promotions/PromotionFormModal.tsx` | Add/Edit form modal |
| `src/components/promotions/PromotionDetailsModal.tsx` | View details modal |
| `src/components/promotions/PromotionDeleteConfirm.tsx` | Delete confirmation |
| `src/components/promotions/form-sections/GeneralInfoSection.tsx` | Form: general fields |
| `src/components/promotions/form-sections/PriceDiscountSection.tsx` | Form: price discount fields |
| `src/components/promotions/form-sections/QuantityDiscountSection.tsx` | Form: quantity discount fields |
| `src/components/promotions/form-sections/PackDiscountSection.tsx` | Form: pack discount fields |
| `src/components/promotions/detail-sections/PriceDiscountDetails.tsx` | Details: price discount |
| `src/components/promotions/detail-sections/QuantityDiscountDetails.tsx` | Details: quantity discount |
| `src/components/promotions/detail-sections/PackDiscountDetails.tsx` | Details: pack discount |

## Testing Strategy

- **Unit tests**: Promotion engine calculations (all 3 types, edge cases, multi-cycle)
- **Repository tests**: CRUD operations, soft delete, active-for-checkout queries
- **Integration tests**: Full flow — create promotion → add products to cart → verify discount
- Target: 80%+ coverage on new code (constitution requirement)
