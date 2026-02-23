const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');

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
// PYTHON BARCODE SCANNER IPC
// Spawns python/barcode_scanner.py as a child
// process and forwards its JSON stdout lines
// to the renderer via webContents.send().
// ============================================

let scannerProc = null;       // active scanner child process
let scannerSender = null;     // webContents that started the scanner

/** Resolve the python executable — tries 'python', then 'python3'. */
function pythonExe() {
    // On Windows 'python' is the standard install name.
    // On macOS/Linux it may be 'python3'.
    return process.platform === 'win32' ? 'python' : 'python3';
}

/** Full path to the Python scanner script. */
function scannerScript() {
    return isDev
        ? path.join(__dirname, '..', 'python', 'barcode_scanner.py')
        : path.join(process.resourcesPath, 'python', 'barcode_scanner.py');
}

/** Kill any running scanner process cleanly. */
function killScanner() {
    if (scannerProc) {
        try { scannerProc.kill('SIGTERM'); } catch (_) {}
        scannerProc = null;
    }
    scannerSender = null;
}

/**
 * scanner:list-cameras
 * Runs `python barcode_scanner.py --list` and returns the JSON array.
 * Returns [] on any error so the UI can degrade gracefully.
 */
ipcMain.handle('scanner:list-cameras', () => {
    return new Promise((resolve) => {
        let out = '';
        const proc = spawn(pythonExe(), [scannerScript(), '--list'], {
            windowsHide: true,
            env: { ...process.env, OPENCV_VIDEOIO_DEBUG: '0', OPENCV_LOG_LEVEL: 'SILENT' },
        });
        proc.stdout.on('data', (d) => { out += d.toString(); });
        proc.stderr.on('data', (d) => { console.warn('[scanner list stderr]', d.toString()); });
        proc.on('close', () => {
            try { resolve(JSON.parse(out.trim())); }
            catch { resolve([]); }
        });
        proc.on('error', (err) => {
            console.error('[scanner list error]', err.message);
            resolve([]);
        });
        // Safety timeout — don't hang the UI
        setTimeout(() => { try { proc.kill(); } catch (_) {} resolve([]); }, 8000);
    });
});

/**
 * scanner:start
 * Spawns the Python decoder process.
 * The renderer owns the camera — it sends frames via scanner:frame.
 * Detected barcodes are forwarded back as 'scanner:barcode' events.
 */
ipcMain.handle('scanner:start', (event) => {
    killScanner(); // stop any previous instance

    scannerSender = event.sender;

    scannerProc = spawn(
        pythonExe(),
        [scannerScript()],   // no --camera flag: Python reads frames from stdin
        {
            windowsHide: true,
            env: { ...process.env, OPENCV_VIDEOIO_DEBUG: '0', OPENCV_LOG_LEVEL: 'SILENT' },
        }
    );

    let stdoutReady = false; // track if Python sent at least one message
    let stderrBuf   = '';

    // Parse JSON lines from Python stdout
    let buffer = '';
    scannerProc.stdout.on('data', (chunk) => {
        buffer += chunk.toString();
        const lines = buffer.split('\n');
        buffer = lines.pop(); // keep incomplete last line
        for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed) continue;
            try {
                const msg = JSON.parse(trimmed);
                if (!scannerSender || scannerSender.isDestroyed()) continue;
                stdoutReady = true;
                if (msg.status  ) scannerSender.send('scanner:status',  msg.status);
                if (msg.barcode ) scannerSender.send('scanner:barcode', msg.barcode, msg.format || '');
                if (msg.error   ) scannerSender.send('scanner:error',   msg.error);
            } catch (_) { /* bad line — ignore */ }
        }
    });

    scannerProc.stderr.on('data', (d) => {
        stderrBuf += d.toString();
        console.warn('[scanner stderr]', d.toString());
    });

    scannerProc.on('error', (err) => {
        console.error('[scanner error]', err.message);
        if (scannerSender && !scannerSender.isDestroyed()) {
            scannerSender.send('scanner:error',
                'Python not found or dependency missing. ' +
                'Run: pip install opencv-python pyzbar');
        }
        scannerProc = null;
    });

    scannerProc.on('close', (code) => {
        console.log(`[scanner] process exited (code ${code})`);
        // If Python exited without ever sending a message, report the error
        if (!stdoutReady && scannerSender && !scannerSender.isDestroyed()) {
            const hint = stderrBuf.includes('pyzbar')
                ? 'pyzbar not installed. Run: pip install pyzbar'
                : stderrBuf.includes('cv2') || stderrBuf.includes('opencv')
                ? 'OpenCV error. Run: pip install opencv-python'
                : `Camera process exited (code ${code}). Check that the camera is connected.`;
            scannerSender.send('scanner:error', hint);
        }
        scannerProc = null;
    });

    return { started: true };
});

/**
 * scanner:stop
 * Kills the scanner process.
 */
ipcMain.handle('scanner:stop', () => {
    killScanner();
    return { stopped: true };
});

/**
 * scanner:frame
 * Receives a base64-encoded JPEG frame from the renderer and writes it to
 * Python's stdin as a single line.  Python decodes it with pyzbar and emits
 * any detected barcode back via stdout → 'scanner:barcode' IPC event.
 */
ipcMain.on('scanner:frame', (_event, base64Jpeg) => {
    if (scannerProc && scannerProc.stdin && !scannerProc.stdin.destroyed) {
        try {
            scannerProc.stdin.write(base64Jpeg + '\n');
        } catch (_) { /* process may be closing */ }
    }
});

// Kill scanner when the window closes
app.on('before-quit', () => killScanner());

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

    mainWindow.on('maximize', () => {
        mainWindow.webContents.send('window:maximized-change', true);
    });
    mainWindow.on('unmaximize', () => {
        mainWindow.webContents.send('window:maximized-change', false);
    });

    return mainWindow;
}

// ============================================
// APP LIFECYCLE
// ============================================

// ============================================
// WINDOW-DEPENDENT IPC HANDLERS
// Registered once, outside createWindow(), to
// avoid duplicate registrations on macOS activate.
// ============================================
let mainWindow = null;

ipcMain.on('window:minimize', () => mainWindow?.minimize());
ipcMain.on('window:maximize', () => {
    if (mainWindow?.isMaximized()) {
        mainWindow.unmaximize();
    } else {
        mainWindow?.maximize();
    }
});
ipcMain.on('window:close', () => mainWindow?.close());
ipcMain.handle('window:isMaximized', () => mainWindow?.isMaximized() ?? false);

ipcMain.handle('print:receipt', async (_event, options = {}) => {
    if (!mainWindow) return { success: false, failureReason: 'No window' };
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
                    resolve({ success, failureReason: failureReason || '' });
                },
            );
        });
    } catch (err) {
        console.error('❌ Print failed:', err);
        return { success: false, failureReason: err.message };
    }
});

ipcMain.handle('print:get-printers', async () => {
    if (!mainWindow) return [];
    try {
        return await mainWindow.webContents.getPrintersAsync();
    } catch (err) {
        console.error('❌ Failed to get printers:', err);
        return [];
    }
});

// ============================================
// FLUSH DATABASE ON QUIT
// Ask the renderer to saveDatabaseImmediate()
// before the app fully exits.
// ============================================
app.on('before-quit', async (e) => {
    if (!mainWindow || mainWindow.isDestroyed()) return;
    e.preventDefault();
    try {
        mainWindow.webContents.send('app:before-quit');
        // Give renderer 2 seconds to flush
        await new Promise((resolve) => setTimeout(resolve, 2000));
    } catch (err) {
        console.error('❌ before-quit flush failed:', err);
    }
    mainWindow = null;
    app.exit(0);
});

app.whenReady().then(() => {
    console.log('✅ Electron app ready — file-based database persistence enabled');
    console.log(`📂 Database path: ${DB_PATH}`);
    mainWindow = createWindow();
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        mainWindow = createWindow();
    }
});
