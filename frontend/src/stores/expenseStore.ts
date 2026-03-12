import { createApiStore } from "./createApiStore";
import type { Expense } from "@/types/entities";

export const useExpenseStore = createApiStore<Expense>("/expenses/");
