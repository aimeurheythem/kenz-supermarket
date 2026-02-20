const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    // ========================
    // Window Controls
    // ========================
    minimizeWindow: () => ipcRenderer.send('window:minimize'),
    maximizeWindow: () => ipcRenderer.send('window:maximize'),
    closeWindow: () => ipcRenderer.send('window:close'),
    isMaximized: () => ipcRenderer.invoke('window:isMaximized'),
    onMaximizedChange: (callback) => {
        ipcRenderer.on('window:maximized-change', (_event, isMaximized) => callback(isMaximized));
    },

    // ========================
    // Database Persistence
    // ========================

    /**
     * Load the database binary from the file system.
     * Returns Uint8Array or null if no database exists yet.
     */
    loadDatabase: () => ipcRenderer.invoke('db:load'),

    /**
     * Save the database binary to the file system.
     * @param {Uint8Array} data - The raw SQLite binary to persist.
     * @returns {{ success: boolean, size?: number, error?: string }}
     */
    saveDatabase: (data) => ipcRenderer.invoke('db:save', data),

    /**
     * Get the full file path where the database is stored (for UI display).
     * @returns {string}
     */
    getDatabasePath: () => ipcRenderer.invoke('db:get-path'),

    /**
     * Export the current database as a raw buffer for download.
     * @returns {Uint8Array | null}
     */
    exportDatabase: () => ipcRenderer.invoke('db:export'),

    /**
     * Import a database file (restore from backup).
     * @param {Uint8Array} data - The raw SQLite binary to import.
     * @returns {{ success: boolean, error?: string }}
     */
    importDatabase: (data) => ipcRenderer.invoke('db:import', data),

    // ========================
    // Printing
    // ========================

    /**
     * Print the current page using Electron's native print API.
     * @param {{ silent?: boolean, deviceName?: string, pageSize?: { width: number, height: number } }} options
     * @returns {{ success: boolean, failureReason: string }}
     */
    printReceipt: (options) => ipcRenderer.invoke('print:receipt', options),

    /**
     * List available system printers (for thermal printer selection).
     * @returns {Array<{ name: string, displayName: string, description: string, status: number, isDefault: boolean }>}
     */
    getPrinters: () => ipcRenderer.invoke('print:get-printers'),

    // ========================
    // App Lifecycle
    // ========================

    /**
     * Register a callback for when the app is about to quit.
     * The callback should flush any pending database writes.
     */
    onBeforeQuit: (callback) => {
        ipcRenderer.on('app:before-quit', () => callback());
    },
});
