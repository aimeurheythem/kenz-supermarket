"""
barcode_scanner.py — pyzbar decoder that reads JPEG frames from stdin.

Architecture
------------
The browser (Electron renderer) opens the camera via getUserMedia, displays
live video, grabs frames from a <canvas>, base64-encodes them as JPEG, and
sends them to Electron main via IPC.  Electron main writes each frame as a
single base64 line to this process's stdin.  This process decodes with pyzbar
and prints results to stdout.

This avoids any camera conflict: ONLY the browser opens the camera device.

STDIN  (one base64-JPEG string per line) → frames to decode
STDOUT (JSON lines):
  {"status": "ready"}
  {"barcode": "12345", "format": "EAN13"}
  {"error": "..."}

Run with --list to enumerate cameras instead.
"""

import sys
import json
import base64
import time

def emit(obj: dict):
    sys.stdout.write(json.dumps(obj) + "\n")
    sys.stdout.flush()

# ── Dependency checks ─────────────────────────────────────────────────────────
try:
    import cv2
    try:
        cv2.utils.logging.setLogLevel(cv2.utils.logging.LOG_LEVEL_SILENT)
    except AttributeError:
        pass
except ImportError:
    emit({"error": "OpenCV not installed. Run: pip install opencv-python"})
    sys.exit(1)

try:
    from pyzbar import pyzbar
except ImportError:
    emit({"error": "pyzbar not installed. Run: pip install pyzbar"})
    sys.exit(1)

import numpy as np

# ── Camera listing (for --list flag) ──────────────────────────────────────────
def try_open(index: int):
    backends = (
        [cv2.CAP_DSHOW, cv2.CAP_MSMF, cv2.CAP_ANY]
        if sys.platform == "win32"
        else [cv2.CAP_ANY]
    )
    for backend in backends:
        try:
            cap = cv2.VideoCapture(index, backend)
            if cap and cap.isOpened():
                return cap
            if cap:
                cap.release()
        except Exception:
            pass
    return None

def get_camera_names_windows() -> list:
    try:
        import subprocess
        result = subprocess.run(
            ["powershell", "-NoProfile", "-Command",
             "Get-PnpDevice -Class Camera -Status OK | Select-Object -ExpandProperty FriendlyName"],
            capture_output=True, text=True, timeout=3
        )
        return [n.strip() for n in result.stdout.strip().splitlines() if n.strip()]
    except Exception:
        return []

def list_cameras():
    names = get_camera_names_windows() if sys.platform == "win32" else []
    cameras = []
    for i in range(10):
        cap = try_open(i)
        if cap:
            cap.release()
            label = names[i] if i < len(names) else f"Camera {i}"
            cameras.append({"id": i, "label": label})
    sys.stdout.write(json.dumps(cameras) + "\n")
    sys.stdout.flush()

# ── Frame-decode loop (default mode) ─────────────────────────────────────────
def decode_loop():
    """
    Read base64-JPEG frames from stdin, decode with pyzbar, emit barcodes.
    The browser owns the camera — we only do image processing here.
    """
    emit({"status": "ready"})

    last_barcode   = None
    last_scan_time = 0.0
    DEBOUNCE_SEC   = 1.5

    for raw_line in sys.stdin:
        line = raw_line.strip()
        if not line:
            continue
        try:
            img_bytes = base64.b64decode(line)
            nparr     = np.frombuffer(img_bytes, np.uint8)
            frame     = cv2.imdecode(nparr, cv2.IMREAD_GRAYSCALE)
            if frame is None:
                continue
        except Exception:
            continue

        barcodes = pyzbar.decode(frame)
        for barcode in barcodes:
            data = barcode.data.decode("utf-8", errors="replace").strip()
            fmt  = barcode.type
            if not data:
                continue
            now = time.monotonic()
            if data == last_barcode and (now - last_scan_time) < DEBOUNCE_SEC:
                continue
            last_barcode   = data
            last_scan_time = now
            emit({"barcode": data, "format": fmt})
            break

# ── Entry point ───────────────────────────────────────────────────────────────
if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "--list":
        list_cameras()
    else:
        decode_loop()
