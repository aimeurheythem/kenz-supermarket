import { create, type StateCreator, type StoreApi, type UseBoundStore } from 'zustand';
import { enqueueOperation, type QueuedOperation } from '../services/offlineQueue';
import { isOnline } from '../services/connectivityMonitor';
import { pushSync } from '../services/syncEngine';

/**
 * Shared CRUD store factory — reduces boilerplate for stores that follow
 * the load-all / create / update / delete + reload pattern.
 *
 * Usage:
 *   const useCategoryStore = createCrudStore({
 *       repo: { getAll, create, update, delete },
 *       entityName: 'category',   // for sync queue
 *   });
 *
 * The factory provides: items[], isLoading, error, clearError,
 * loadAll(), add(), update(), remove().
 *
 * When `entityName` is supplied, local CRUD operations are also enqueued
 * to the offline sync queue. If the POS is online, an immediate push
 * is attempted after each enqueue.
 *
 * Stores with extra actions can extend via the `extend` parameter
 * which merges additional state/actions into the base store.
 */

type EntityId = number | string;

interface CrudRepo<T, TInput> {
    getAll: () => Promise<T[]>;
    create: (input: TInput) => Promise<T>;
    update: (id: EntityId, input: Partial<TInput>) => Promise<T>;
    delete: (id: EntityId) => Promise<void>;
}

interface CrudStoreState<T, TInput> {
    items: T[];
    isLoading: boolean;
    error: string | null;
    clearError: () => void;
    loadAll: () => Promise<void>;
    add: (input: TInput) => Promise<T>;
    update: (id: EntityId, input: Partial<TInput>) => Promise<T>;
    remove: (id: EntityId) => Promise<void>;
}

/** A stable client_id for this POS installation, stored in localStorage. */
function getClientId(): string {
    const key = '_pos_client_id';
    let id = localStorage.getItem(key);
    if (!id) {
        id = crypto.randomUUID();
        localStorage.setItem(key, id);
    }
    return id;
}

interface CreateCrudStoreOptions<T, TInput, TExtra extends object = object> {
    repo: CrudRepo<T, TInput>;
    /** Sync entity name (e.g. 'category'). When set, CRUD ops are enqueued for sync. */
    entityName?: string;
    extend?: StateCreator<CrudStoreState<T, TInput> & TExtra, [], [], TExtra>;
}

/** Enqueue a sync operation and attempt immediate push if online. */
async function syncEnqueue(
    entity: string,
    action: QueuedOperation['action'],
    payload: Record<string, unknown>,
): Promise<void> {
    await enqueueOperation(entity, action, payload, getClientId());
    if (isOnline()) {
        pushSync().catch(() => {/* background — errors surfaced via status listeners */});
    }
}

export function createCrudStore<T, TInput, TExtra extends object = object>(
    options: CreateCrudStoreOptions<T, TInput, TExtra>,
): UseBoundStore<StoreApi<CrudStoreState<T, TInput> & TExtra>> {
    const { repo, entityName, extend } = options;

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

                    // Enqueue sync operation
                    if (entityName) {
                        await syncEnqueue(entityName, 'create', item as Record<string, unknown>);
                    }

                    await (get() as CrudStoreState<T, TInput>).loadAll();
                    return item;
                } catch (e) {
                    set({ error: (e as Error).message } as Partial<CrudStoreState<T, TInput> & TExtra>);
                    throw e;
                }
            },

            update: async (id: EntityId, input: Partial<TInput>) => {
                try {
                    set({ error: null } as Partial<CrudStoreState<T, TInput> & TExtra>);
                    const item = await repo.update(id, input);

                    // Enqueue sync operation
                    if (entityName) {
                        await syncEnqueue(entityName, 'update', { id, ...item as Record<string, unknown> });
                    }

                    await (get() as CrudStoreState<T, TInput>).loadAll();
                    return item;
                } catch (e) {
                    set({ error: (e as Error).message } as Partial<CrudStoreState<T, TInput> & TExtra>);
                    throw e;
                }
            },

            remove: async (id: EntityId) => {
                try {
                    set({ error: null } as Partial<CrudStoreState<T, TInput> & TExtra>);
                    await repo.delete(id);

                    // Enqueue sync operation
                    if (entityName) {
                        await syncEnqueue(entityName, 'delete', { id });
                    }

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
