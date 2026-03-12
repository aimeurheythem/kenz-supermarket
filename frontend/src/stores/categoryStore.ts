import { createApiStore } from "./createApiStore";
import type { Category } from "@/types/entities";

export const useCategoryStore = createApiStore<Category>("/categories/");
