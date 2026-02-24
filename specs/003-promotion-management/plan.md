# Implementation Plan: Promotion Management System

**Branch**: `003-promotion-management` | **Date**: 2026-02-24 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/003-promotion-management/spec.md`

## Summary

Build a complete Promotion Management System with three promotion types (price discount, quantity discount, pack/bundle discount), an admin CRUD page matching the existing UI design system, and automatic checkout integration. Uses a single `promotions` table with JSON config + a `promotion_products` junction table. A client-side promotion engine computes discounts in real-time for the POS cart.

## Technical Context

**Language/Version**: TypeScript (React 19.x frontend, Vite 7.x bundler)  
**Primary Dependencies**: React, Zustand (state), sql.js (SQLite in WASM), Framer Motion (animations), Radix UI (primitives), lucide-react (icons), sonner (toasts), react-i18next (i18n), react-router-dom (routing)  
**Storage**: SQLite (client-side via sql.js; Electron persistence via IPC)  
**Testing**: Vitest + React Testing Library  
**Target Platform**: Electron desktop app (Windows/macOS/Linux) + browser dev mode  
**Project Type**: Desktop app (Electron + Vite + React)  
**Performance Goals**: Promotions page loads ≤2s with 100 promotions; checkout discount computation <100ms  
**Constraints**: Offline-capable (all data local in SQLite); no backend server  
**Scale/Scope**: ~20 admin pages, single-user/single-store POS system

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Gate | Requirement | Status | Notes |
|------|-------------|--------|-------|
| I. Code Quality | Lint-free, small functions, clear interfaces | PASS | New repo/store/components follow existing patterns |
| II. Testing Standards | TDD, 80% coverage, unit + integration | PASS | Tests planned for repo, engine, and integration |
| III. UX Consistency | Follow established design patterns | PASS | Exact copies of Inventory/Expenses page patterns |
| IV. Performance | <100ms interactions, indexed queries | PASS | Indexed promotion tables, computed status via SQL |
| V. Observability | Structured logging, audit trail | PASS | AuditLogRepo.log() on all mutations |
| Security | Input validation, no secrets in code | PASS | Client-side validation + SQL parameterized queries |
| Quality Gates | Tests pass, lint pass, 80% coverage | PASS | All quality gates will be met |

**Post-Phase 1 Re-check**: PASS — No violations introduced. Design uses existing patterns (repo → store → component), no new dependencies.

## Project Structure

### Documentation (this feature)

```text
specs/003-promotion-management/
├── plan.md              # This file
├── spec.md              # Feature specification
├── research.md          # Phase 0 research findings
├── data-model.md        # Phase 1 data model
├── quickstart.md        # Phase 1 quickstart guide
├── contracts/           # Phase 1 interface contracts
│   ├── promotion-repo.md
│   ├── promotion-store.md
│   ├── promotion-engine.md
│   └── ui-components.md
├── checklists/
│   └── requirements.md
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (repository root)

```text
database/
├── schema.ts                               # MODIFY — add promotions + promotion_products tables
├── index.ts                                # MODIFY — export PromotionRepo
└── repositories/
    ├── promotion.repo.ts                   # NEW — promotions CRUD
    └── sale.repo.ts                        # MODIFY — persist promotion on sale_items

src/
├── App.tsx                                 # MODIFY — add /promotions route
├── lib/
│   └── types.ts                            # MODIFY — add promotion types
├── services/
│   └── promotionEngine.ts                  # NEW — cart discount calculation engine
├── stores/
│   ├── usePromotionStore.ts                # NEW — promotion state management
│   ├── useAuthStore.ts                     # MODIFY — add permissions
│   └── useSaleStore.ts                     # MODIFY — integrate promotion engine
├── pages/
│   └── Promotions.tsx                      # NEW — admin promotions page
├── components/
│   ├── layout/
│   │   └── Sidebar.tsx                     # MODIFY — add nav item
│   └── promotions/                         # NEW — all promotion UI components
│       ├── PromotionList.tsx
│       ├── PromotionFormModal.tsx
│       ├── PromotionDetailsModal.tsx
│       ├── PromotionDeleteConfirm.tsx
│       ├── form-sections/
│       │   ├── GeneralInfoSection.tsx
│       │   ├── PriceDiscountSection.tsx
│       │   ├── QuantityDiscountSection.tsx
│       │   └── PackDiscountSection.tsx
│       └── detail-sections/
│           ├── PriceDiscountDetails.tsx
│           ├── QuantityDiscountDetails.tsx
│           └── PackDiscountDetails.tsx
├── i18n/locales/
│   ├── en.json                             # MODIFY — add promotions keys
│   ├── fr.json                             # MODIFY — add promotions keys
│   └── ar.json                             # MODIFY — add promotions keys
└── __tests__/
    ├── promotionEngine.test.ts             # NEW — engine unit tests
    └── promotionRepo.test.ts               # NEW — repository tests

database/__tests__/
    └── promotion.repo.test.ts              # NEW — repository integration tests
```

**Structure Decision**: Follows the existing single-project structure. All database code in `database/`, all UI code in `src/`. New files follow exact naming conventions of existing code (e.g., `promotion.repo.ts` matches `product.repo.ts`, `usePromotionStore.ts` matches `useProductStore.ts`).

## Complexity Tracking

> No constitution violations — all gates pass. No complexity justifications needed.
