import { createApiStore } from "./createApiStore";
import type { Promotion } from "@/types/entities";

export const usePromotionStore = createApiStore<Promotion>("/promotions/");
