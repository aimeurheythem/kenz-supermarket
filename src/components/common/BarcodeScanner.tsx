import { useEffect, useRef, useState, useCallback } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { Camera, RefreshCw, Zap, ChevronDown, ScanLine, CheckCircle2, AlertCircle } from 'lucide-react';
import Button from '@/components/common/Button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface BarcodeScannerProps {
    onScan: (code: string) => void;
    onClose: () => void;
    title?: string;
}

interface CameraOption {
    id: number | string; // number for Python/OpenCV, string for browser mediaDeviceId
    label: string;
}

const LAST_CAMERA_KEY = 'pos_barcode_last_camera';

// ─── Audio beep ───────────────────────────────────────────────────────────────
let audioCtx: AudioContext | null = null;
function playBeep() {
    try {
        if (!audioCtx) audioCtx = new AudioContext();
        const osc  = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.frequency.value = 1800;
        gain.gain.value = 0.08;
        osc.start();
        osc.stop(audioCtx.currentTime + 0.08);
    } catch { /* silent */ }
}

// ─── Fallback JS formats (used when Python is unavailable) ───────────────────
const JS_FORMATS = [
    Html5QrcodeSupportedFormats.EAN_13,
    Html5QrcodeSupportedFormats.EAN_8,
    Html5QrcodeSupportedFormats.UPC_A,
    Html5QrcodeSupportedFormats.UPC_E,
    Html5QrcodeSupportedFormats.CODE_128,
    Html5QrcodeSupportedFormats.CODE_39,
    Html5QrcodeSupportedFormats.QR_CODE,
];

function labelCamera(cam: CameraOption, index: number): string {
    return cam.label?.trim() || `Camera ${index + 1}`;
}

// ─── Check if Python scanner is available via Electron IPC ───────────────────
function hasPythonScanner(): boolean {
    return typeof window !== 'undefined' &&
        typeof window.electronAPI?.scannerStart === 'function';
}

// =============================================================================
// PYTHON MODE — Browser owns camera (getUserMedia video), sends frames to
//              Python subprocess via IPC for pyzbar decoding
// =============================================================================
function BarcodeScannerPython({ onScan, onClose, title }: BarcodeScannerProps) {
    const [isOpen,      setIsOpen]      = useState(true);
    const [cameras,     setCameras]     = useState<CameraOption[]>([]);
    const [selectedId,  setSelectedId]  = useState<string>('');
    const [showMenu,    setShowMenu]    = useState(false);
    const [status,      setStatus]      = useState<'loading' | 'scanning' | 'success' | 'error'>('loading');
    const [errorMsg,    setErrorMsg]    = useState('');
    const [lastBarcode, setLastBarcode] = useState('');

    const videoRef    = useRef<HTMLVideoElement>(null);
    const canvasRef   = useRef<HTMLCanvasElement>(null);
    const streamRef   = useRef<MediaStream | null>(null);
    const frameTimer  = useRef<ReturnType<typeof setTimeout> | null>(null);
    const unsubRef    = useRef<(() => void) | null>(null);
    const handledRef  = useRef(false);
    const isSendingRef = useRef(false);

    // ── Stop everything ──────────────────────────────────────────────────────
    const stopAll = useCallback(() => {
        // Stop frame loop
        if (frameTimer.current) { clearTimeout(frameTimer.current); frameTimer.current = null; }
        isSendingRef.current = false;
        // Unsubscribe from IPC events
        unsubRef.current?.(); unsubRef.current = null;
        // Kill Python process
        window.electronAPI?.scannerStop();
        // Release camera stream
        streamRef.current?.getTracks().forEach(t => t.stop());
        streamRef.current = null;
    }, []);

    // ── Send one frame to Python stdin every ~100 ms (≈10 fps) ──────────────
    const scheduleFrame = useCallback(() => {
        if (!isSendingRef.current) return;
        const video  = videoRef.current;
        const canvas = canvasRef.current;
        if (!video || !canvas || video.readyState < 2) {
            frameTimer.current = setTimeout(scheduleFrame, 50);
            return;
        }
        const W = 640, H = Math.round(640 * (video.videoHeight / (video.videoWidth || 1)));
        canvas.width  = W;
        canvas.height = H || 360;
        const ctx = canvas.getContext('2d');
        if (ctx) {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            const b64 = canvas.toDataURL('image/jpeg', 0.7).split(',')[1];
            if (b64) window.electronAPI?.scannerFrame(b64);
        }
        frameTimer.current = setTimeout(scheduleFrame, 100);
    }, []);

    // ── Open camera + start Python + subscribe to events ─────────────────────
    const startScanner = useCallback(async (deviceId: string) => {
        handledRef.current = false;
        setStatus('loading');
        setErrorMsg('');
        setShowMenu(false);
        stopAll();

        // 1. Open camera in browser (getUserMedia)
        try {
            const constraints: MediaStreamConstraints = {
                video: deviceId
                    ? { deviceId: { exact: deviceId }, width: { ideal: 1280 }, height: { ideal: 720 } }
                    : { width: { ideal: 1280 }, height: { ideal: 720 } },
            };
            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            streamRef.current = stream;
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                await videoRef.current.play().catch(() => {});
            }
        } catch (err) {
            setStatus('error');
            setErrorMsg('Camera access denied or unavailable.');
            return;
        }

        // 2. Subscribe to Python barcode events
        unsubRef.current = window.electronAPI!.onScannerEvent((event, ...args) => {
            if (event === 'status' && args[0] === 'ready') {
                setStatus('scanning');
                isSendingRef.current = true;
                scheduleFrame();
            }
            if (event === 'barcode' && !handledRef.current) {
                handledRef.current = true;
                playBeep();
                const code = args[0];
                setLastBarcode(code);
                setStatus('success');
                setTimeout(() => { stopAll(); onScan(code); }, 600);
            }
            if (event === 'error') {
                setStatus('error');
                setErrorMsg(args[0] || 'Python scanner error');
            }
        });

        // 3. Start Python decoder process (no camera arg — it reads stdin frames)
        localStorage.setItem(LAST_CAMERA_KEY, deviceId);
        await window.electronAPI!.scannerStart();
    }, [stopAll, scheduleFrame, onScan]);

    // ── Enumerate browser cameras on mount, then auto-start ──────────────────
    useEffect(() => {
        let cancelled = false;
        navigator.mediaDevices.enumerateDevices().then(devices => {
            if (cancelled) return;
            const videoInputs = devices.filter(d => d.kind === 'videoinput');
            const cams: CameraOption[] = videoInputs.length > 0
                ? videoInputs.map(d => ({ id: d.deviceId, label: d.label || '' }))
                : [{ id: '', label: 'Default Camera' }];
            setCameras(cams);
            const last    = localStorage.getItem(LAST_CAMERA_KEY) ?? '';
            const initial = cams.find(c => c.id === last)?.id ?? cams[0].id as string;
            setSelectedId(String(initial));
            startScanner(String(initial));
        }).catch(() => {
            if (!cancelled) startScanner('');
        });
        return () => { cancelled = true; stopAll(); };
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const handleSelectCamera = useCallback((cam: CameraOption) => {
        const id = String(cam.id);
        setSelectedId(id);
        startScanner(id);
    }, [startScanner]);

    const handleClose = useCallback(() => {
        stopAll();
        setIsOpen(false);
        setTimeout(onClose, 150);
    }, [stopAll, onClose]);

    const selectedCam = cameras.find(c => String(c.id) === selectedId);

    return (
        <Dialog open={isOpen} onOpenChange={open => { if (!open) handleClose(); }}>
            <DialogContent className="max-w-lg p-0 overflow-hidden">
                <DialogHeader className="p-4 pb-2">
                    <DialogTitle className="flex items-center gap-2">
                        <Camera size={20} className="text-blue-500" />
                        {title}
                    </DialogTitle>
                </DialogHeader>

                {/* Camera selector */}
                {cameras.length > 0 && (
                    <div className="px-4 pb-3 relative">
                        <button
                            type="button"
                            onClick={() => setShowMenu(v => !v)}
                            className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-sm text-[var(--color-text)] hover:bg-[var(--color-surface-hover)] transition-colors"
                        >
                            <span className="flex items-center gap-2 truncate">
                                <Camera size={14} className="shrink-0 text-blue-500" />
                                <span className="truncate">
                                    {selectedCam ? labelCamera(selectedCam, cameras.indexOf(selectedCam)) : 'Select camera…'}
                                </span>
                            </span>
                            <ChevronDown size={14} className={`shrink-0 transition-transform ${showMenu ? 'rotate-180' : ''}`} />
                        </button>
                        {showMenu && (
                            <div className="absolute left-4 right-4 z-50 mt-1 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] shadow-xl overflow-hidden">
                                {cameras.map((cam, i) => (
                                    <button key={String(cam.id)} type="button"
                                        onClick={() => handleSelectCamera(cam)}
                                        className={`w-full text-left px-3 py-2.5 text-sm hover:bg-[var(--color-surface-hover)] transition-colors flex items-center gap-2 ${String(cam.id) === selectedId ? 'text-blue-500 font-medium' : 'text-[var(--color-text)]'}`}
                                    >
                                        <Camera size={13} className="shrink-0" />
                                        <span className="truncate">{labelCamera(cam, i)}</span>
                                        {String(cam.id) === selectedId && <span className="ml-auto text-xs bg-blue-500/15 text-blue-500 px-1.5 py-0.5 rounded">active</span>}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Video viewport — always rendered so videoRef is mounted */}
                <div className="relative mx-4 mb-4 rounded-xl bg-black overflow-hidden" style={{ minHeight: 260 }}>
                    <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-full rounded-xl"
                        style={{ display: status === 'error' ? 'none' : 'block', objectFit: 'cover', maxHeight: 320 }}
                    />
                    {/* Hidden canvas for frame capture */}
                    <canvas ref={canvasRef} style={{ display: 'none' }} />

                    {/* Scanning overlay */}
                    {status === 'scanning' && (
                        <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center gap-3">
                            <div className="relative w-[280px] h-[160px] border-2 border-emerald-400/50 rounded-lg">
                                <div className="absolute -top-px -left-px w-6 h-6 border-t-2 border-l-2 border-emerald-400 rounded-tl-lg" />
                                <div className="absolute -top-px -right-px w-6 h-6 border-t-2 border-r-2 border-emerald-400 rounded-tr-lg" />
                                <div className="absolute -bottom-px -left-px w-6 h-6 border-b-2 border-l-2 border-emerald-400 rounded-bl-lg" />
                                <div className="absolute -bottom-px -right-px w-6 h-6 border-b-2 border-r-2 border-emerald-400 rounded-br-lg" />
                                <div className="absolute left-2 right-2 h-0.5 bg-emerald-400/80 animate-scan-line" />
                            </div>
                            <div className="flex items-center gap-1.5 bg-black/60 text-emerald-400 text-xs font-bold px-2.5 py-1 rounded-full">
                                <Zap size={12} className="animate-pulse" />HOLD BARCODE INSIDE THE BOX
                            </div>
                        </div>
                    )}

                    {/* Loading overlay */}
                    {status === 'loading' && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/80">
                            <div className="flex flex-col items-center gap-3">
                                <div className="w-8 h-8 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
                                <span className="text-white/70 text-sm">Starting camera…</span>
                            </div>
                        </div>
                    )}

                    {/* Success overlay */}
                    {status === 'success' && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/70 animate-in fade-in duration-200">
                            <div className="flex flex-col items-center gap-3">
                                <CheckCircle2 size={48} className="text-emerald-400" />
                                <span className="text-emerald-300 font-bold text-sm">{lastBarcode}</span>
                            </div>
                        </div>
                    )}

                    {/* Error overlay */}
                    {status === 'error' && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black p-6 text-center">
                            <div className="flex flex-col items-center gap-3">
                                <AlertCircle size={36} className="text-red-400" />
                                <p className="text-red-300 text-sm">{errorMsg}</p>
                                {errorMsg.includes('pip') && (
                                    <code className="text-xs text-white/50 bg-white/10 px-2 py-1 rounded">
                                        pip install opencv-python pyzbar
                                    </code>
                                )}
                                <Button variant="secondary" size="sm" onClick={() => startScanner(selectedId)}>
                                    Retry
                                </Button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-4 pb-4 flex justify-between items-center">
                    <span className="text-xs text-[var(--color-text-muted)]">EAN · UPC · Code 128 · QR · and more</span>
                    <Button variant="secondary" size="sm"
                        onClick={() => startScanner(selectedId)}
                        icon={<RefreshCw size={14} />}
                    >
                        Reset
                    </Button>
                </div>

                <style>{`
                    @keyframes scan-line { 0%,100% { top:10%; } 50% { top:88%; } }
                    .animate-scan-line { position:absolute; animation: scan-line 1.6s ease-in-out infinite; }
                `}</style>
            </DialogContent>
        </Dialog>
    );
}

// =============================================================================
// JS FALLBACK MODE — html5-qrcode (browser / no Python)
// =============================================================================
function BarcodeScannerJS({ onScan, onClose, title }: BarcodeScannerProps) {
    const html5Qrcode  = useRef<Html5Qrcode | null>(null);
    const [isOpen,     setIsOpen]     = useState(true);
    const [isStarting, setIsStarting] = useState(true);
    const [error,      setError]      = useState<string | null>(null);
    const [cameras,    setCameras]    = useState<CameraOption[]>([]);
    const [selectedId, setSelectedId] = useState<string>('');
    const [showMenu,   setShowMenu]   = useState(false);
    const scanHandled  = useRef(false);
    const mounted      = useRef(true);

    const stopScanner = useCallback(async () => {
        const s = html5Qrcode.current;
        if (s) { html5Qrcode.current = null; try { await s.stop(); } catch { /**/ } }
    }, []);

    const startScanner = useCallback(async (cameraId: string) => {
        scanHandled.current = false;
        setIsStarting(true);
        setError(null);
        setShowMenu(false);
        await stopScanner();
        if (!mounted.current) return;
        try {
            const el = document.getElementById('barcode-reader-js');
            if (!el) return;
            const scanner = new Html5Qrcode('barcode-reader-js', {
                formatsToSupport: JS_FORMATS,
                useBarCodeDetectorIfSupported: false,
                verbose: false,
            });
            html5Qrcode.current = scanner;
            await scanner.start(
                cameraId,
                { fps: 20, qrbox: { width: 300, height: 180 }, disableFlip: false },
                (text) => {
                    if (scanHandled.current) return;
                    scanHandled.current = true;
                    playBeep();
                    scanner.stop().catch(() => {});
                    onScan(text);
                },
                () => {},
            );
            if (mounted.current) setIsStarting(false);
        } catch {
            if (mounted.current) { setError('Camera access denied or unavailable'); setIsStarting(false); }
        }
    }, [onScan, stopScanner]);

    useEffect(() => {
        mounted.current = true;
        Html5Qrcode.getCameras().then(devices => {
            if (!mounted.current) return;
            const cams = devices.map(d => ({ id: d.id, label: d.label }));
            setCameras(cams);
            if (!cams.length) { setError('No cameras found'); setIsStarting(false); return; }
            const last    = localStorage.getItem(LAST_CAMERA_KEY) || '';
            const initial = cams.find(c => c.id === last)?.id ?? cams[0].id;
            setSelectedId(String(initial));
            setTimeout(() => startScanner(String(initial)), 100);
        }).catch(() => { if (mounted.current) { setError('Camera permission denied'); setIsStarting(false); } });
        return () => { mounted.current = false; stopScanner(); };
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const handleClose = useCallback(async () => {
        await stopScanner(); setIsOpen(false); setTimeout(onClose, 150);
    }, [stopScanner, onClose]);

    const selectedCam = cameras.find(c => String(c.id) === selectedId);

    return (
        <Dialog open={isOpen} onOpenChange={open => { if (!open) handleClose(); }}>
            <DialogContent className="max-w-lg p-0 overflow-hidden">
                <DialogHeader className="p-4 pb-2">
                    <DialogTitle className="flex items-center gap-2">
                        <Camera size={20} className="text-blue-500" />{title}
                    </DialogTitle>
                </DialogHeader>

                {cameras.length > 0 && (
                    <div className="px-4 pb-2 relative">
                        <button type="button" onClick={() => setShowMenu(v => !v)}
                            className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-sm text-[var(--color-text)] hover:bg-[var(--color-surface-hover)] transition-colors"
                        >
                            <span className="flex items-center gap-2 truncate">
                                <Camera size={14} className="shrink-0 text-blue-500" />
                                <span className="truncate">{selectedCam ? labelCamera(selectedCam, cameras.indexOf(selectedCam)) : 'Select camera…'}</span>
                            </span>
                            <ChevronDown size={14} className={`shrink-0 transition-transform ${showMenu ? 'rotate-180' : ''}`} />
                        </button>
                        {showMenu && (
                            <div className="absolute left-4 right-4 z-50 mt-1 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] shadow-xl overflow-hidden">
                                {cameras.map((cam, i) => (
                                    <button key={String(cam.id)} type="button"
                                        onClick={() => { setSelectedId(String(cam.id)); localStorage.setItem(LAST_CAMERA_KEY, String(cam.id)); startScanner(String(cam.id)); }}
                                        className={`w-full text-left px-3 py-2.5 text-sm hover:bg-[var(--color-surface-hover)] transition-colors flex items-center gap-2 ${String(cam.id) === selectedId ? 'text-blue-500 font-medium' : 'text-[var(--color-text)]'}`}
                                    >
                                        <Camera size={13} /><span className="truncate">{labelCamera(cam, i)}</span>
                                        {String(cam.id) === selectedId && <span className="ml-auto text-xs bg-blue-500/15 text-blue-500 px-1.5 py-0.5 rounded">active</span>}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                <div className="relative mx-4 rounded-lg overflow-hidden bg-black" style={{ minHeight: 300 }}>
                    <div id="barcode-reader-js" className="w-full" />
                    {!isStarting && !error && (
                        <>
                            <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-black/60 text-emerald-400 text-xs font-bold px-2.5 py-1 rounded-full">
                                <Zap size={12} className="animate-pulse" />SCANNING
                            </div>
                            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                                <div className="w-[280px] h-[160px] border-2 border-emerald-400/50 rounded-lg relative">
                                    <div className="absolute -top-px -left-px w-6 h-6 border-t-2 border-l-2 border-emerald-400 rounded-tl-lg" />
                                    <div className="absolute -top-px -right-px w-6 h-6 border-t-2 border-r-2 border-emerald-400 rounded-tr-lg" />
                                    <div className="absolute -bottom-px -left-px w-6 h-6 border-b-2 border-l-2 border-emerald-400 rounded-bl-lg" />
                                    <div className="absolute -bottom-px -right-px w-6 h-6 border-b-2 border-r-2 border-emerald-400 rounded-br-lg" />
                                    <div className="absolute left-2 right-2 h-0.5 bg-emerald-400/80 animate-scan-line" />
                                </div>
                            </div>
                        </>
                    )}
                    {isStarting && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/80">
                            <div className="flex flex-col items-center gap-3">
                                <div className="w-8 h-8 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
                                <span className="text-white/80 text-sm">Starting camera…</span>
                            </div>
                        </div>
                    )}
                    {error && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/80 p-6">
                            <div className="text-center">
                                <p className="text-red-400 text-sm mb-3">{error}</p>
                                <Button variant="secondary" size="sm" onClick={() => selectedId && startScanner(selectedId)}>Retry</Button>
                            </div>
                        </div>
                    )}
                </div>

                <div className="p-4 flex justify-between items-center">
                    <span className="text-xs text-[var(--color-text-muted)]">EAN · UPC · Code 128 · QR</span>
                    <Button variant="secondary" size="sm" onClick={() => selectedId && startScanner(selectedId)} icon={<RefreshCw size={14} />}>Reset</Button>
                </div>

                <style>{`
                    #barcode-reader-js video { object-fit: cover; border-radius: 8px; width: 100%; }
                    @keyframes scan-line { 0%,100% { top:10%; } 50% { top:88%; } }
                    .animate-scan-line { animation: scan-line 2s ease-in-out infinite; }
                `}</style>
            </DialogContent>
        </Dialog>
    );
}

// =============================================================================
// PUBLIC EXPORT — auto-selects Python or JS mode
// =============================================================================
export default function BarcodeScanner(props: BarcodeScannerProps) {
    const title = props.title ?? 'Scan Barcode';
    if (hasPythonScanner()) {
        return <BarcodeScannerPython {...props} title={title} />;
    }
    return <BarcodeScannerJS {...props} title={title} />;
}
