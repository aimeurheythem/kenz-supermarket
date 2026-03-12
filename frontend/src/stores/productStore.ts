import { createApiStore } from "./createApiStore";
import type { Product } from "@/types/entities";

export const useProductStore = createApiStore<Product>("/products/");
