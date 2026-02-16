import { useEffect, useRef, useState } from 'react';
import { Html5QrcodeScanner, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { X, Camera, RefreshCw } from 'lucide-react';
import Button from '@/components/common/Button';

interface BarcodeScannerProps {
    onScan: (code: string) => void;
    onClose: () => void;
    title?: string;
}

export default function BarcodeScanner({ onScan, onClose, title = 'Scan Barcode' }: BarcodeScannerProps) {
    const scannerRef = useRef<Html5QrcodeScanner | null>(null);
    const [scannedResult, setScannedResult] = useState<string | null>(null);
    const [scanError, setScanError] = useState<string | null>(null);

    useEffect(() => {
        // Initialize scanner
        const scanner = new Html5QrcodeScanner(
            "reader",
            {
                fps: 30,
                qrbox: { width: 300, height: 300 },
                aspectRatio: 1.0,
                showTorchButtonIfSupported: true,
                useBarCodeDetectorIfSupported: true,
                formatsToSupport: [
                    Html5QrcodeSupportedFormats.EAN_13,
                    Html5QrcodeSupportedFormats.EAN_8,
                    Html5QrcodeSupportedFormats.UPC_A,
                    Html5QrcodeSupportedFormats.UPC_E,
                    Html5QrcodeSupportedFormats.CODE_128,
                    Html5QrcodeSupportedFormats.CODE_39,
                    Html5QrcodeSupportedFormats.CODE_93,
                    Html5QrcodeSupportedFormats.CODABAR,
                    Html5QrcodeSupportedFormats.QR_CODE,
                ]
            },
            /* verbose= */ false
        );

        scanner.render(
            (decodedText) => {
                // Play beep sound
                const audio = new Audio('/sounds/beep.mp3'); // We'll need to check if this exists or use a synth
                // Fallback synth beep if file doesn't exist
                try {
                    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
                    const osc = ctx.createOscillator();
                    const gain = ctx.createGain();
                    osc.connect(gain);
                    gain.connect(ctx.destination);
                    osc.frequency.value = 1500;
                    gain.gain.value = 0.1;
                    osc.start();
                    setTimeout(() => osc.stop(), 100);
                } catch (e) { /* ignore audio error */ }

                setScannedResult(decodedText);
                scanner.clear().then(() => {
                    onScan(decodedText);
                });
            },
            (errorMessage) => {
                // ignore scanning errors, they happen every frame no code is detected
            }
        );

        scannerRef.current = scanner;

        // Cleanup
        return () => {
            if (scannerRef.current) {
                scannerRef.current.clear().catch(console.error);
            }
        };
    }, [onScan]);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fadeIn">
            <div className="bg-[var(--color-bg-card)] w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden border border-[var(--color-border)] mx-4">

                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-[var(--color-border)]">
                    <h3 className="text-lg font-bold flex items-center gap-2">
                        <Camera size={20} className="text-blue-500" />
                        {title}
                    </h3>
                    <button
                        onClick={() => {
                            if (scannerRef.current) scannerRef.current.clear();
                            onClose();
                        }}
                        className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Scanner Area */}
                <div className="p-6 bg-black relative min-h-[400px] flex flex-col items-center justify-center">
                    <div id="reader" className="w-full h-full" />

                    {/* Instructions Overlay */}
                    <div className="absolute bottom-4 left-0 right-0 text-center text-white/70 text-sm pointer-events-none">
                        Point camera at a barcode
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 bg-[var(--color-bg-subtle)] flex justify-between items-center text-sm text-[var(--color-text-muted)]">
                    <span>Supports EAN, UPC, Code 128</span>
                    <Button variant="secondary" size="sm" onClick={() => window.location.reload()} icon={<RefreshCw size={14} />}>
                        Reset Camera
                    </Button>
                </div>
            </div>

            <style>{`
                #reader__scan_region {
                    background: rgba(0,0,0,0.5);
                }
                #reader__dashboard_section_csr button {
                    background: white;
                    color: black;
                    padding: 8px 16px;
                    border-radius: 6px;
                    border: none;
                    font-weight: 600;
                    margin-top: 10px;
                    cursor: pointer;
                }
                #reader video {
                    object-fit: cover;
                    border-radius: 8px;
                }
            `}</style>
        </div>
    );
}
