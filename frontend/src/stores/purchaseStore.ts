import { createApiStore } from "./createApiStore";
import type { PurchaseOrder } from "@/types/entities";

export const usePurchaseStore = createApiStore<PurchaseOrder>("/purchase-orders/");
