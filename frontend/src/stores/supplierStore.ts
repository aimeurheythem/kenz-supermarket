import { createApiStore } from "./createApiStore";
import type { Supplier } from "@/types/entities";

export const useSupplierStore = createApiStore<Supplier>("/suppliers/");
