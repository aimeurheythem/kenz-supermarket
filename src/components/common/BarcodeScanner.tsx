import { useEffect, useRef, useState } from 'react';
import { Html5QrcodeScanner, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { Camera, RefreshCw } from 'lucide-react';
import Button from '@/components/common/Button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

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

    const handleClose = () => {
        if (scannerRef.current) scannerRef.current.clear();
        onClose();
    };

    return (
        <Dialog open={true} onOpenChange={(open) => { if (!open) handleClose(); }}>
            <DialogContent className="max-w-lg p-0 overflow-hidden">
                {/* Header */}
                <DialogHeader className="p-4 pb-2">
                    <DialogTitle className="flex items-center gap-2">
                        <Camera size={20} className="text-blue-500" />
                        {title}
                    </DialogTitle>
                </DialogHeader>

                {/* Scanner Area */}
                <div className="px-4 bg-black relative min-h-[400px] flex flex-col items-center justify-center rounded-lg mx-4">
                    <div id="reader" className="w-full h-full" />

                    {/* Instructions Overlay */}
                    <div className="absolute bottom-4 left-0 right-0 text-center text-white/70 text-sm pointer-events-none">
                        Point camera at a barcode
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 flex justify-between items-center text-sm text-[var(--color-text-muted)]">
                    <span>Supports EAN, UPC, Code 128</span>
                    <Button variant="secondary" size="sm" onClick={() => window.location.reload()} icon={<RefreshCw size={14} />}>
                        Reset Camera
                    </Button>
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
            </DialogContent>
        </Dialog>
    );
}
