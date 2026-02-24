# Research: Promotion Management System

**Feature**: 003-promotion-management  
**Date**: 2026-02-24  
**Status**: Complete

## Research Questions & Findings

### R1: Database schema design for polymorphic promotion types

**Decision**: Single `promotions` table with a `type` discriminator column + JSON `config` column for type-specific fields.

**Rationale**: The existing schema uses plain SQL tables with `TEXT` columns for flexible data. A single table with a JSON config column keeps the schema simple, avoids excessive joins, and makes adding new promotion types trivial (no schema migration needed). The `type` column (`price_discount`, `quantity_discount`, `pack_discount`) drives which fields in `config` are relevant.

**Alternatives considered**:
- **Separate tables per type** (promotions + price_discount_rules + quantity_discount_rules + pack_discount_rules): More normalized but adds 3 extra tables and complex joins. Rejected because the existing codebase favors simplicity (no ORM) and the config data is small/fixed per type.
- **EAV (Entity-Attribute-Value)**: Too complex for 3 promotion types. Rejected.

### R2: Junction table for pack discount product lists

**Decision**: Dedicated `promotion_products` junction table linking promotions to products.

**Rationale**: Pack discounts reference multiple products. Price and quantity discounts reference one product. A junction table (`promotion_id`, `product_id`) handles both cases uniformly. For single-product promotions, there's exactly 1 row. For bundles, there are N rows. This avoids storing product IDs in JSON (which would prevent foreign key integrity and indexed lookups).

**Alternatives considered**:
- **JSON array of product IDs in config**: No referential integrity, can't JOIN efficiently. Rejected.
- **Comma-separated IDs**: Even worse. Rejected.

### R3: Checkout promotion engine — where to inject discount logic

**Decision**: New `PromotionEngine` service module that computes applicable promotions for a cart. Called from `useSaleStore.addToCart` and a new `selectCartWithPromotions` selector. Final discount amounts written into existing `CartItem.discount` field and `Sale.discount_amount`.

**Rationale**: The existing cart system already has `CartItem.discount: number` per item and `Sale.discount_amount` for whole-sale discounts. Promotion logic should compute these values rather than creating a parallel pricing system. The engine runs client-side (querying promotions from SQLite via sql.js) for instant responsiveness.

**Alternatives considered**:
- **Modify `SaleRepo.createFromCart` only**: Too late — user wouldn't see promotions until checkout completes. Need real-time display. Rejected as sole approach — still need to apply final amounts in the repo for persistence.
- **Separate promotion line items in `sale_items`**: Would break existing receipt/reporting logic. Rejected in favor of using the existing `discount` column.

### R4: "Most beneficial promotion" selection algorithm

**Decision**: For each product in cart, compute effective discount amount for each applicable promotion. Select the one with the highest absolute discount value. For pack/bundle, compute savings vs. individual prices and compare against sum of per-product discounts.

**Rationale**: Simple, deterministic, always favors the customer. Consistent with the non-stackable clarification.

**Alternatives considered**:
- **Percentage-based comparison**: Can be misleading for different price points. Rejected.
- **Admin-defined priority**: Adds configuration complexity. Can be added later as an extension. Rejected for MVP.

### R5: Auto-deactivation of expired promotions

**Decision**: Compute status dynamically at query time using SQL `CASE WHEN end_date < datetime('now') THEN 'inactive'`. The `status` column stores the admin's intent; the effective status is computed. This avoids needing a background job/cron.

**Rationale**: Client-side SQLite (sql.js) has no cron/scheduler. Computing status at query time is simpler and always accurate. The promotions list query and checkout engine both use the computed status.

**Alternatives considered**:
- **Background timer with `setInterval`**: Unreliable in Electron (app may be closed). Rejected.
- **Check-on-access pattern**: Updating the `status` column on every read is a side-effect during read operations. Rejected.

### R6: Soft delete implementation

**Decision**: Use `deleted_at TEXT DEFAULT NULL` column (matches the clarification). Queries filter with `WHERE deleted_at IS NULL`. No `is_active` flag needed — promotion status (Active/Inactive) is separate from deletion.

**Rationale**: Consistent with the soft-delete clarification. Using `deleted_at` (timestamp) rather than a boolean flag provides audit trail of when deletion occurred. Existing codebase uses `is_active INTEGER` for soft deletes on products — but for promotions, `deleted_at` is more appropriate because we also have a separate `status` field for Active/Inactive that serves a different purpose.

**Alternatives considered**:
- **Reuse `is_active` pattern**: Conflicts with the promotion status field (Active/Inactive means operational state, not deletion state). Rejected.

### R7: Existing UI design patterns for page consistency

**Decision**: Follow exact patterns from Inventory.tsx and Expenses.tsx pages:
- Page wrapper: `div.relative.flex.flex-col.h-full.gap-8.p-6.lg:p-8.animate-fadeIn.mt-4.min-h-[85vh]`
- Grid background overlay at top
- Header: subtitle (`text-[12px] text-zinc-400 tracking-[0.3em] font-bold uppercase`) + title (`text-4xl font-black text-black tracking-tighter uppercase`)
- CTA button: `bg-yellow-400 hover:bg-yellow-300 text-black rounded-[3rem] font-black uppercase tracking-widest text-xs`
- Table container: `rounded-[3rem] bg-white border-2 border-black/5 overflow-hidden`
- Table headers: `text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400`
- Modals: Use existing `Dialog` component from `@radix-ui/react-dialog` with `rounded-[2rem]`
- Form inputs: `h-14 px-5 rounded-3xl bg-zinc-100/70 border-2 border-zinc-300 font-bold`
- Status badges: Use colored badges (green for Active, gray for Inactive, with promotion type badges)
- Animations: framer-motion `motion.div`
- Toasts: `sonner` for success/error/warning feedback
- Icons: lucide-react

**Rationale**: FR-018 and SC-008 require visual consistency. Copying exact class patterns ensures pixel-perfect alignment.

### R8: i18n key structure for promotions

**Decision**: Add `promotions` namespace to all 3 locale files (en.json, fr.json, ar.json) following the flat-with-groups pattern:
```json
{
  "promotions": {
    "title": "Promotions",
    "subtitle": "Manage Promotions",
    "add_promotion": "Add Promotion",
    "type": { "price_discount": "Price Discount", "quantity_discount": "Quantity Discount", "pack_discount": "Pack Discount" },
    "status": { "active": "Active", "inactive": "Inactive" },
    "form": { "labels": { ... }, "validation": { ... } },
    "details": { ... },
    "table": { "name": "Name", "type": "Type", "status": "Status", ... }
  }
}
```

**Rationale**: Matches existing key structure (e.g., `inventory.title`, `expenses.title`).

### R9: Permission model for promotions

**Decision**: Add two new permissions: `view_promotions` and `edit_promotions`. Granted to `admin` and `manager` roles. Not granted to `cashier` (cashiers only see promotion effects at POS, not the management page).

**Rationale**: Follows existing permission granularity (view/edit pairs for inventory, suppliers, etc.).

### R10: Store pattern for promotions

**Decision**: Use manual Zustand store (`usePromotionStore`) rather than `createCrudStore`, because:
1. Promotions need type-specific logic (validation, config parsing)
2. The checkout promotion engine needs to be a separate exportable service
3. Need computed selectors for active-only promotions

**Rationale**: Complex stores in the codebase (useSaleStore, useProductStore) use manual pattern. The CRUD factory is used for simple entities (categories, suppliers).
