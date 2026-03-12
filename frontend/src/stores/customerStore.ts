import { createApiStore } from "./createApiStore";
import type { Customer } from "@/types/entities";

export const useCustomerStore = createApiStore<Customer>("/customers/");
