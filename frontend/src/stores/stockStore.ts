import { createApiStore } from "./createApiStore";
import type { StockMovement } from "@/types/entities";

export const useStockStore = createApiStore<StockMovement>("/stock-movements/");
