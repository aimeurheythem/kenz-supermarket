import { useEffect, useRef, useState, useCallback } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { Camera, RefreshCw, Zap } from 'lucide-react';
import Button from '@/components/common/Button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface BarcodeScannerProps {
    onScan: (code: string) => void;
    onClose: () => void;
    title?: string;
}

// Reuse a single AudioContext across the app lifetime — much faster beep
let audioCtx: AudioContext | null = null;
function playBeep() {
    try {
        if (!audioCtx) audioCtx = new AudioContext();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.frequency.value = 1800;
        gain.gain.value = 0.08;
        osc.start();
        osc.stop(audioCtx.currentTime + 0.08);
    } catch {
        /* audio not available */
    }
}

const SUPPORTED_FORMATS = [
    Html5QrcodeSupportedFormats.EAN_13,
    Html5QrcodeSupportedFormats.EAN_8,
    Html5QrcodeSupportedFormats.UPC_A,
    Html5QrcodeSupportedFormats.UPC_E,
    Html5QrcodeSupportedFormats.CODE_128,
    Html5QrcodeSupportedFormats.CODE_39,
    Html5QrcodeSupportedFormats.CODE_93,
    Html5QrcodeSupportedFormats.CODABAR,
    Html5QrcodeSupportedFormats.QR_CODE,
];

export default function BarcodeScanner({ onScan, onClose, title = 'Scan Barcode' }: BarcodeScannerProps) {
    const html5Qrcode = useRef<Html5Qrcode | null>(null);
    const [isStarting, setIsStarting] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const scanHandled = useRef(false);
    const mounted = useRef(true);
    const [isOpen, setIsOpen] = useState(true);

    const startScanner = useCallback(async () => {
        scanHandled.current = false;
        setIsStarting(true);
        setError(null);

        // Clean up previous instance
        if (html5Qrcode.current) {
            try {
                await html5Qrcode.current.stop();
            } catch {
                /* ok */
            }
            html5Qrcode.current = null;
        }

        if (!mounted.current) return;

        try {
            const elementId = 'barcode-reader';
            const el = document.getElementById(elementId);
            if (!el) return;

            const scanner = new Html5Qrcode(elementId, {
                formatsToSupport: SUPPORTED_FORMATS,
                useBarCodeDetectorIfSupported: true,
                verbose: false,
            });
            html5Qrcode.current = scanner;

            await scanner.start(
                { facingMode: 'environment' },
                {
                    fps: 60,
                    qrbox: { width: 280, height: 160 },
                    aspectRatio: 1.5,
                    disableFlip: false,
                },
                (decodedText) => {
                    if (scanHandled.current) return;
                    scanHandled.current = true;
                    playBeep();
                    scanner.stop().catch(() => {});
                    onScan(decodedText);
                },
                () => {
                    // No code detected — expected, ignore
                },
            );

            if (mounted.current) setIsStarting(false);
        } catch (err) {
            console.error('Scanner start failed:', err);
            if (mounted.current) {
                setError('Camera access denied or unavailable');
                setIsStarting(false);
            }
        }
    }, [onScan]);

    useEffect(() => {
        mounted.current = true;
        // Small delay to ensure DOM element is mounted
        const t = setTimeout(startScanner, 100);
        return () => {
            mounted.current = false;
            clearTimeout(t);
            const scanner = html5Qrcode.current;
            if (scanner) {
                html5Qrcode.current = null;
                scanner.stop().catch(() => {});
            }
        };
    }, [startScanner]);

    const handleClose = useCallback(async () => {
        // Stop scanner FIRST before unmounting the DOM
        const scanner = html5Qrcode.current;
        if (scanner) {
            html5Qrcode.current = null;
            try {
                await scanner.stop();
            } catch {
                /* already stopped or DOM gone */
            }
        }
        // Now close the dialog (which unmounts the video element)
        setIsOpen(false);
        // Let the dialog animation finish before notifying parent
        setTimeout(() => onClose(), 150);
    }, [onClose]);

    return (
        <Dialog
            open={isOpen}
            onOpenChange={(open) => {
                if (!open) handleClose();
            }}
        >
            <DialogContent className="max-w-lg p-0 overflow-hidden">
                <DialogHeader className="p-4 pb-2">
                    <DialogTitle className="flex items-center gap-2">
                        <Camera size={20} className="text-blue-500" />
                        {title}
                    </DialogTitle>
                </DialogHeader>

                {/* Scanner Area */}
                <div className="relative mx-4 rounded-lg overflow-hidden bg-black" style={{ minHeight: 300 }}>
                    <div id="barcode-reader" className="w-full" />

                    {/* Scanning indicator */}
                    {!isStarting && !error && (
                        <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-black/60 text-emerald-400 text-xs font-bold px-2.5 py-1 rounded-full backdrop-blur-sm">
                            <Zap size={12} className="animate-pulse" />
                            SCANNING
                        </div>
                    )}

                    {/* Scan crosshair overlay */}
                    {!isStarting && !error && (
                        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                            <div className="w-[280px] h-[160px] border-2 border-emerald-400/50 rounded-lg relative">
                                <div className="absolute -top-px -left-px w-6 h-6 border-t-2 border-l-2 border-emerald-400 rounded-tl-lg" />
                                <div className="absolute -top-px -right-px w-6 h-6 border-t-2 border-r-2 border-emerald-400 rounded-tr-lg" />
                                <div className="absolute -bottom-px -left-px w-6 h-6 border-b-2 border-l-2 border-emerald-400 rounded-bl-lg" />
                                <div className="absolute -bottom-px -right-px w-6 h-6 border-b-2 border-r-2 border-emerald-400 rounded-br-lg" />
                                {/* Animated scan line */}
                                <div className="absolute left-2 right-2 h-0.5 bg-emerald-400/80 animate-scan-line" />
                            </div>
                        </div>
                    )}

                    {isStarting && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/80">
                            <div className="flex flex-col items-center gap-3">
                                <div className="w-8 h-8 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
                                <span className="text-white/80 text-sm font-medium">Starting camera…</span>
                            </div>
                        </div>
                    )}

                    {error && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/80">
                            <div className="text-center px-6">
                                <p className="text-red-400 text-sm font-medium mb-3">{error}</p>
                                <Button variant="secondary" size="sm" onClick={startScanner}>
                                    Retry
                                </Button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 flex justify-between items-center text-sm text-[var(--color-text-muted)]">
                    <span className="text-xs">EAN · UPC · Code 128 · QR</span>
                    <Button variant="secondary" size="sm" onClick={startScanner} icon={<RefreshCw size={14} />}>
                        Reset
                    </Button>
                </div>

                <style>{`
                    #barcode-reader video {
                        object-fit: cover;
                        border-radius: 8px;
                        width: 100%;
                    }
                    @keyframes scan-line {
                        0%, 100% { top: 10%; }
                        50% { top: 88%; }
                    }
                    .animate-scan-line {
                        animation: scan-line 2s ease-in-out infinite;
                    }
                `}</style>
            </DialogContent>
        </Dialog>
    );
}
