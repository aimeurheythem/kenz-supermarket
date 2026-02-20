/**
 * useElectron — centralises all window.electronAPI access
 * so components never touch the global directly.
 */

export function useElectron() {
    const api = window.electronAPI;
    const isElectron = !!api;

    return {
        isElectron,

        // Window controls
        minimize: () => api?.minimizeWindow(),
        maximize: () => api?.maximizeWindow(),
        close: () => api?.closeWindow(),
        isMaximized: () => api?.isMaximized() ?? Promise.resolve(false),
        onMaximizedChange: (cb: (maximized: boolean) => void) => api?.onMaximizedChange(cb),

        // Database persistence
        loadDatabase: () => api?.loadDatabase() ?? Promise.resolve(null),
        saveDatabase: (data: Uint8Array) => api?.saveDatabase(data) ?? Promise.resolve({ success: false, size: 0 }),
        getDatabasePath: () => api?.getDatabasePath() ?? Promise.resolve(''),
        exportDatabase: () => api?.exportDatabase() ?? Promise.resolve(null),
        importDatabase: (data: Uint8Array) => api?.importDatabase(data) ?? Promise.resolve({ success: false }),

        // Printing
        printReceipt: (opts?: Record<string, unknown>) =>
            api?.printReceipt(opts) ?? Promise.resolve({ success: false, failureReason: 'Not in Electron' }),
        getPrinters: () => api?.getPrinters() ?? Promise.resolve([]),
    };
}
