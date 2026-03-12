import { useEffect } from "react";
import wsClient from "@/services/wsClient";
import { useProductStore } from "@/stores/productStore";
import { useCategoryStore } from "@/stores/categoryStore";
import { useSupplierStore } from "@/stores/supplierStore";
import { usePurchaseStore } from "@/stores/purchaseStore";
import { useCustomerStore } from "@/stores/customerStore";
import { useSaleStore } from "@/stores/saleStore";
import { useStockStore } from "@/stores/stockStore";
import { useExpenseStore } from "@/stores/expenseStore";
import { usePromotionStore } from "@/stores/promotionStore";
import { useAuditStore } from "@/stores/auditStore";

/* eslint-disable @typescript-eslint/no-explicit-any */
const storeRegistry: Record<string, any> = {
  product: useProductStore,
  category: useCategoryStore,
  supplier: useSupplierStore,
  purchaseorder: usePurchaseStore,
  customer: useCustomerStore,
  sale: useSaleStore,
  stockmovement: useStockStore,
  expense: useExpenseStore,
  promotion: usePromotionStore,
  auditlog: useAuditStore,
};

/**
 * Hook that listens to WebSocket entity_change messages and
 * updates the corresponding Zustand stores in real-time.
 */
export function useRealtimeSync() {
  useEffect(() => {
    const unsub = wsClient.on("entity_change", async (msg) => {
      const entity = msg.entity as string;
      const action = msg.action as string;
      const data = msg.data as { id: string };
      if (!entity || !data?.id) return;

      const zustandStore = storeRegistry[entity];
      if (!zustandStore) return;

      const store = zustandStore.getState();

      if (action === "deleted") {
        store.removeLocalItem(data.id);
      } else if (action === "created" || action === "updated") {
        try {
          const item = await store.fetchOne(data.id);
          if (action === "created") {
            const current = store.items || [];
            if (!current.find((i: any) => i.id === data.id)) {
              zustandStore.setState((s: any) => ({
                items: [item, ...s.items],
                total: s.total + 1,
              }));
            }
          } else {
            store.updateLocalItem(data.id, item);
          }
        } catch {
          // Entity may have been deleted or inaccessible
        }
      }
    });

    return () => { unsub(); };
  }, []);
}
