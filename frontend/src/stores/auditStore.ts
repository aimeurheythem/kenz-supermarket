import { createApiStore } from "./createApiStore";
import type { AuditLog } from "@/types/entities";

export const useAuditStore = createApiStore<AuditLog>("/audit-logs/");
