import { createApiStore } from "./createApiStore";
import type { Sale } from "@/types/entities";

export const useSaleStore = createApiStore<Sale>("/sales/");
