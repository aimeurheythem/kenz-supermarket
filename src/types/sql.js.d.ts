declare module 'sql.js' {
    export interface SqlJsStatic {
        Database: typeof Database;
    }

    export class Database {
        constructor(data?: ArrayLike<number>);
        run(sql: string, params?: unknown[]): Database;
        exec(sql: string): QueryExecResult[];
        prepare(sql: string): Statement;
        export(): Uint8Array;
        close(): void;
    }

    export interface Statement {
        bind(params?: unknown[]): boolean;
        step(): boolean;
        getAsObject(): Record<string, unknown>;
        get(): unknown[];
        free(): boolean;
        reset(): void;
    }

    export interface QueryExecResult {
        columns: string[];
        values: unknown[][];
    }

    export interface SqlJsConfig {
        locateFile?: (file: string) => string;
    }

    export default function initSqlJs(config?: SqlJsConfig): Promise<SqlJsStatic>;
}

// ============================================
// Electron API — Single Source of Truth
// ============================================
declare global {
    interface Window {
        electronAPI?: {
            // Window controls
            minimizeWindow: () => void;
            maximizeWindow: () => void;
            closeWindow: () => void;
            isMaximized: () => Promise<boolean>;
            onMaximizedChange: (callback: (isMaximized: boolean) => void) => void;

            // Database persistence (file system)
            loadDatabase: () => Promise<ArrayBuffer | null>;
            saveDatabase: (data: Uint8Array) => Promise<{ success: boolean; size?: number; error?: string }>;
            getDatabasePath: () => Promise<string>;
            exportDatabase: () => Promise<ArrayBuffer | null>;
            importDatabase: (data: Uint8Array) => Promise<{ success: boolean; error?: string }>;
        };
    }
}

export {};
