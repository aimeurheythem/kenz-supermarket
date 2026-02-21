'use client';

import { Canvas } from '@react-three/fiber';
import { ShaderPlane } from './shader-background';

export function ShaderBackground() {
    return (
        <div className="absolute inset-0 z-0 w-full h-full">
            <Canvas camera={{ position: [0, 0, 1], far: 1000 }} style={{ background: '#f8fafc' }}>
                <ShaderPlane position={[0, 0, 0]} color1="#f8fafc" color2="#e2e8f0" />
            </Canvas>
            <div className="absolute inset-0 bg-white/40" />
            <div
                className="absolute top-1/4 left-1/4 w-96 h-96 bg-amber-400/10 rounded-full blur-3xl"
                style={{ animation: 'pulse 8s ease-in-out infinite' }}
            />
            <div
                className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-amber-500/8 rounded-full blur-2xl"
                style={{ animation: 'pulse 6s ease-in-out infinite 2s' }}
            />
            <style>{`
                @keyframes pulse {
                    0%, 100% { opacity: 0.5; transform: scale(1); }
                    50% { opacity: 0.8; transform: scale(1.1); }
                }
            `}</style>
        </div>
    );
}
