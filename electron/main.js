const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

const isDev = process.env.NODE_ENV === 'development';

// ============================================
// DATABASE FILE PATHS
// ============================================
const DB_DIR = path.join(app.getPath('userData'), 'data');
const DB_PATH = path.join(DB_DIR, 'database.sqlite');
const DB_BACKUP_PATH = path.join(DB_DIR, 'database.backup.sqlite');

// Ensure data directory exists
function ensureDbDir() {
    if (!fs.existsSync(DB_DIR)) {
        fs.mkdirSync(DB_DIR, { recursive: true });
    }
}

// ============================================
// DATABASE IPC HANDLERS
// Register BEFORE window creation so they're
// ready when the renderer process loads.
// ============================================

/**
 * db:load — Read the SQLite binary from disk.
 * Returns a Uint8Array buffer, or null if no database file exists yet.
 */
ipcMain.handle('db:load', async () => {
    ensureDbDir();
    try {
        if (fs.existsSync(DB_PATH)) {
            const buffer = fs.readFileSync(DB_PATH);
            console.log(`✅ Database loaded from disk (${(buffer.length / 1024).toFixed(1)} KB)`);
            return buffer;
        }
        console.log('ℹ️  No database file found — will create on first save.');
        return null;
    } catch (err) {
        console.error('❌ Failed to load database from disk:', err);
        return null;
    }
});

/**
 * db:save — Write the SQLite binary to disk.
 * Creates a backup of the previous file before overwriting.
 * Accepts a Uint8Array from the renderer.
 */
ipcMain.handle('db:save', async (_event, data) => {
    ensureDbDir();
    try {
        const buffer = Buffer.from(data);

        // Create backup of previous database before overwriting
        if (fs.existsSync(DB_PATH)) {
            fs.copyFileSync(DB_PATH, DB_BACKUP_PATH);
        }

        // Atomic write: write to temp file first, then rename
        const tmpPath = DB_PATH + '.tmp';
        fs.writeFileSync(tmpPath, buffer);
        fs.renameSync(tmpPath, DB_PATH);

        return { success: true, size: buffer.length };
    } catch (err) {
        console.error('❌ Failed to save database to disk:', err);
        return { success: false, error: err.message };
    }
});

/**
 * db:get-path — Return the full path to the database file (for debugging/UI).
 */
ipcMain.handle('db:get-path', async () => {
    return DB_PATH;
});

/**
 * db:export — Export the database as a downloadable .db file.
 */
ipcMain.handle('db:export', async () => {
    ensureDbDir();
    try {
        if (fs.existsSync(DB_PATH)) {
            const buffer = fs.readFileSync(DB_PATH);
            return buffer;
        }
        return null;
    } catch (err) {
        console.error('❌ Failed to export database:', err);
        return null;
    }
});

/**
 * db:import — Import a database file (restore from backup).
 * Accepts a Uint8Array from the renderer.
 */
ipcMain.handle('db:import', async (_event, data) => {
    ensureDbDir();
    try {
        const buffer = Buffer.from(data);

        // Backup current database before replacing
        if (fs.existsSync(DB_PATH)) {
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const archivePath = path.join(DB_DIR, `database.pre-import.${timestamp}.sqlite`);
            fs.copyFileSync(DB_PATH, archivePath);
        }

        fs.writeFileSync(DB_PATH, buffer);
        return { success: true };
    } catch (err) {
        console.error('❌ Failed to import database:', err);
        return { success: false, error: err.message };
    }
});

// ============================================
// WINDOW CREATION
// ============================================
function createWindow() {
    const mainWindow = new BrowserWindow({
        width: 1400,
        height: 900,
        minWidth: 1100,
        minHeight: 700,
        title: 'SuperMarket Pro',
        icon: path.join(__dirname, '../public/icon.png'),
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false,
        },
        frame: false,
        backgroundColor: '#0a0a0f',
        show: false,
    });

    mainWindow.once('ready-to-show', () => {
        mainWindow.show();
    });

    if (isDev) {
        mainWindow.loadURL('http://localhost:5173');
        mainWindow.webContents.openDevTools({ mode: 'detach' });
    } else {
        mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
    }

    // ============================================
    // WINDOW CONTROL IPC
    // ============================================
    ipcMain.on('window:minimize', () => mainWindow.minimize());
    ipcMain.on('window:maximize', () => {
        if (mainWindow.isMaximized()) {
            mainWindow.unmaximize();
        } else {
            mainWindow.maximize();
        }
    });
    ipcMain.on('window:close', () => mainWindow.close());
    ipcMain.handle('window:isMaximized', () => mainWindow.isMaximized());

    mainWindow.on('maximize', () => {
        mainWindow.webContents.send('window:maximized-change', true);
    });
    mainWindow.on('unmaximize', () => {
        mainWindow.webContents.send('window:maximized-change', false);
    });

    // ============================================
    // PRINT IPC HANDLERS
    // ============================================

    /**
     * print:receipt — Print using Electron's native webContents.print().
     * Returns { success, failureReason } so the renderer can show feedback.
     */
    ipcMain.handle('print:receipt', async (_event, options = {}) => {
        try {
            return await new Promise((resolve) => {
                mainWindow.webContents.print(
                    {
                        silent: options.silent || false,
                        printBackground: true,
                        deviceName: options.deviceName || '',
                        margins: { marginType: 'none' },
                        ...(options.pageSize ? { pageSize: options.pageSize } : {}),
                    },
                    (success, failureReason) => {
                        resolve({
                            success,
                            failureReason: failureReason || '',
                        });
                    },
                );
            });
        } catch (err) {
            console.error('❌ Print failed:', err);
            return { success: false, failureReason: err.message };
        }
    });

    /**
     * print:get-printers — List available printers for thermal printer selection.
     */
    ipcMain.handle('print:get-printers', async () => {
        try {
            return await mainWindow.webContents.getPrintersAsync();
        } catch (err) {
            console.error('❌ Failed to get printers:', err);
            return [];
        }
    });
}

// ============================================
// APP LIFECYCLE
// ============================================
app.whenReady().then(() => {
    console.log('✅ Electron app ready — file-based database persistence enabled');
    console.log(`📂 Database path: ${DB_PATH}`);
    createWindow();
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});
