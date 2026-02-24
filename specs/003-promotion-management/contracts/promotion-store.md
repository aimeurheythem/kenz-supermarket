# Store Contract: usePromotionStore

**Module**: `src/stores/usePromotionStore.ts`  
**Pattern**: Manual Zustand store (like `useSaleStore`, `useProductStore`)

## State Shape

```typescript
interface PromotionStore {
    // Data
    promotions: Promotion[];
    isLoading: boolean;
    error: string | null;

    // Actions — CRUD
    clearError: () => void;
    loadPromotions: (filters?: PromotionFilters) => Promise<void>;
    addPromotion: (input: PromotionInput) => Promise<Promotion>;
    updatePromotion: (id: number, input: Partial<PromotionInput>) => Promise<Promotion>;
    deletePromotion: (id: number) => Promise<void>;
    getPromotionById: (id: number) => Promise<Promotion | undefined>;
}

interface PromotionFilters {
    type?: PromotionType;
    status?: PromotionStatus;
    search?: string;
}
```

## Method Contracts

### `loadPromotions(filters?)`
- Calls `PromotionRepo.getAll(filters)`
- Sets `promotions`, `isLoading`, `error`

### `addPromotion(input)`
- Calls `PromotionRepo.create(input)`
- Reloads list via `loadPromotions()`
- Shows `toast.success()`
- Returns created promotion

### `updatePromotion(id, input)`
- Calls `PromotionRepo.update(id, input)`
- Reloads list
- Shows `toast.success()`

### `deletePromotion(id)`
- Calls `PromotionRepo.delete(id)` (soft delete)
- Reloads list
- Shows `toast.success()`

### Error handling
- All methods: try/catch → `set({ error: message })` → re-throw
