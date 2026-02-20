/**
 * Vitest Global Test Setup
 *
 * - Extends expect with DOM matchers (@testing-library/jest-dom)
 * - Mocks sql.js so tests never need a real WASM binary
 * - Mocks window.electronAPI so Electron-only code paths are safe
 * - Provides helper to reset all mocks between tests
 */

import '@testing-library/jest-dom/vitest';
import { vi, beforeEach, afterEach } from 'vitest';

// ============================================
// MOCK — sql.js
// ============================================

const mockStatement = {
    bind: vi.fn().mockReturnValue(true),
    step: vi.fn().mockReturnValue(false),
    getAsObject: vi.fn().mockReturnValue({}),
    get: vi.fn().mockReturnValue([]),
    free: vi.fn().mockReturnValue(true),
    reset: vi.fn(),
};

const mockDatabase = {
    run: vi.fn().mockReturnThis(),
    exec: vi.fn().mockReturnValue([]),
    prepare: vi.fn().mockReturnValue(mockStatement),
    export: vi.fn().mockReturnValue(new Uint8Array()),
    close: vi.fn(),
};

vi.mock('sql.js', () => {
    // Must use `function` (not arrow) so it can be called with `new`
    function MockDatabase(this: { Database: () => void; }) {
        Object.assign(this, {
            run: mockDatabase.run,
            exec: mockDatabase.exec,
            prepare: mockDatabase.prepare,
            export: mockDatabase.export,
            close: mockDatabase.close,
        });
    }
    return {
        default: vi.fn().mockResolvedValue({ Database: MockDatabase }),
        __mockDatabase: mockDatabase,
        __mockStatement: mockStatement,
    };
});

// ============================================
// MOCK — window.electronAPI
// ============================================

const mockElectronAPI: Window['electronAPI'] = {
    // Window controls
    minimizeWindow: vi.fn(),
    maximizeWindow: vi.fn(),
    closeWindow: vi.fn(),
    isMaximized: vi.fn().mockResolvedValue(false),
    onMaximizedChange: vi.fn(),

    // Database persistence
    loadDatabase: vi.fn().mockResolvedValue(null),
    saveDatabase: vi.fn().mockResolvedValue({ success: true, size: 0 }),
    getDatabasePath: vi.fn().mockResolvedValue('/mock/path/database.sqlite'),
    exportDatabase: vi.fn().mockResolvedValue(null),
    importDatabase: vi.fn().mockResolvedValue({ success: true }),

    // Printing
    printReceipt: vi.fn().mockResolvedValue({ success: true, failureReason: '' }),
    getPrinters: vi.fn().mockResolvedValue([]),

    // App lifecycle
    onBeforeQuit: vi.fn(),
};

Object.defineProperty(window, 'electronAPI', {
    value: mockElectronAPI,
    writable: true,
    configurable: true,
});

// ============================================
// MOCK — Browser APIs not in jsdom
// ============================================

// matchMedia (used by responsive hooks, Tailwind, etc.)
Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
    })),
});

// ResizeObserver (used by many UI components)
global.ResizeObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
}));

// IntersectionObserver (used by lazy loading, virtual lists)
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
    root: null,
    rootMargin: '',
    thresholds: [],
    takeRecords: vi.fn().mockReturnValue([]),
}));

// URL.createObjectURL / revokeObjectURL (used by file downloads, blobs)
if (typeof URL.createObjectURL !== 'function') {
    URL.createObjectURL = vi.fn().mockReturnValue('blob:mock-url');
}
if (typeof URL.revokeObjectURL !== 'function') {
    URL.revokeObjectURL = vi.fn();
}

// ============================================
// RESET MOCKS BETWEEN TESTS
// ============================================

beforeEach(() => {
    vi.clearAllMocks();
});

afterEach(() => {
    // Clean up any DOM changes from render calls
    document.body.innerHTML = '';
});

// ============================================
// EXPORTS — for test files that need direct access
// ============================================

export { mockElectronAPI, mockDatabase, mockStatement };
