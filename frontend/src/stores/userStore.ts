import { createApiStore } from "./createApiStore";
import type { User } from "@/types/entities";

export const useUserStore = createApiStore<User>("/users/");
