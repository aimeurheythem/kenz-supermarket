import { create, type StateCreator, type StoreApi, type UseBoundStore } from 'zustand';

/**
 * Shared CRUD store factory — reduces boilerplate for stores that follow
 * the load-all / create / update / delete + reload pattern.
 *
 * Usage:
 *   const useCategoryStore = createCrudStore({
 *       name: 'categories',
 *       repo: { getAll, create, update, delete },
 *   });
 *
 * The factory provides: items[], isLoading, error, clearError,
 * loadAll(), add(), update(), remove().
 *
 * Stores with extra actions can extend via the `extend` parameter
 * which merges additional state/actions into the base store.
 */

interface CrudRepo<T, TInput> {
    getAll: () => Promise<T[]>;
    create: (input: TInput) => Promise<T>;
    update: (id: number, input: Partial<TInput>) => Promise<T>;
    delete: (id: number) => Promise<void>;
}

interface CrudStoreState<T, TInput> {
    items: T[];
    isLoading: boolean;
    error: string | null;
    clearError: () => void;
    loadAll: () => Promise<void>;
    add: (input: TInput) => Promise<T>;
    update: (id: number, input: Partial<TInput>) => Promise<T>;
    remove: (id: number) => Promise<void>;
}

interface CreateCrudStoreOptions<T, TInput, TExtra extends object = object> {
    repo: CrudRepo<T, TInput>;
    extend?: StateCreator<CrudStoreState<T, TInput> & TExtra, [], [], TExtra>;
}

export function createCrudStore<T, TInput, TExtra extends object = object>(
    options: CreateCrudStoreOptions<T, TInput, TExtra>,
): UseBoundStore<StoreApi<CrudStoreState<T, TInput> & TExtra>> {
    const { repo, extend } = options;

    return create<CrudStoreState<T, TInput> & TExtra>((set, get, store) => {
        const base: CrudStoreState<T, TInput> = {
            items: [],
            isLoading: false,
            error: null,

            clearError: () => set({ error: null } as Partial<CrudStoreState<T, TInput> & TExtra>),

            loadAll: async () => {
                try {
                    set({ isLoading: true, error: null } as Partial<CrudStoreState<T, TInput> & TExtra>);
                    const items = await repo.getAll();
                    set({ items } as Partial<CrudStoreState<T, TInput> & TExtra>);
                } catch (e) {
                    set({ error: (e as Error).message } as Partial<CrudStoreState<T, TInput> & TExtra>);
                    throw e;
                } finally {
                    set({ isLoading: false } as Partial<CrudStoreState<T, TInput> & TExtra>);
                }
            },

            add: async (input: TInput) => {
                try {
                    set({ error: null } as Partial<CrudStoreState<T, TInput> & TExtra>);
                    const item = await repo.create(input);
                    await (get() as CrudStoreState<T, TInput>).loadAll();
                    return item;
                } catch (e) {
                    set({ error: (e as Error).message } as Partial<CrudStoreState<T, TInput> & TExtra>);
                    throw e;
                }
            },

            update: async (id: number, input: Partial<TInput>) => {
                try {
                    set({ error: null } as Partial<CrudStoreState<T, TInput> & TExtra>);
                    const item = await repo.update(id, input);
                    await (get() as CrudStoreState<T, TInput>).loadAll();
                    return item;
                } catch (e) {
                    set({ error: (e as Error).message } as Partial<CrudStoreState<T, TInput> & TExtra>);
                    throw e;
                }
            },

            remove: async (id: number) => {
                try {
                    set({ error: null } as Partial<CrudStoreState<T, TInput> & TExtra>);
                    await repo.delete(id);
                    await (get() as CrudStoreState<T, TInput>).loadAll();
                } catch (e) {
                    set({ error: (e as Error).message } as Partial<CrudStoreState<T, TInput> & TExtra>);
                    throw e;
                }
            },
        };

        const extra = extend ? extend(set, get, store) : ({} as TExtra);

        // ⚠️  DO NOT use JavaScript getters (get prop()) in the extend object.
        //    Zustand's set() uses Object.assign({}, state, partial) which invokes
        //    getters once and replaces them with stale plain values.
        //    Use destructuring aliases in components instead:
        //      const { items: categories } = useCategoryStore();
        return { ...base, ...extra } as CrudStoreState<T, TInput> & TExtra;
    });
}
