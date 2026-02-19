import React, { useEffect, useRef } from 'react';
import JsBarcode from 'jsbarcode';

interface BarcodeCanvasProps {
    value: string;
    format?:
        | 'CODE128'
        | 'EAN13'
        | 'UPC'
        | 'EAN8'
        | 'EAN5'
        | 'EAN2'
        | 'ITF14'
        | 'MSI'
        | 'MSI10'
        | 'MSI11'
        | 'MSI1010'
        | 'MSI1110'
        | 'pharmacode'
        | 'codabar';
    width?: number;
    height?: number;
    marginTop?: number;
    marginBottom?: number;
    marginLeft?: number;
    marginRight?: number;
    displayValue?: boolean;
    fontSize?: number;
    textMargin?: number;
    background?: string;
    lineColor?: string;
    className?: string;
}

export const BarcodeCanvas: React.FC<BarcodeCanvasProps> = ({
    value,
    format = 'CODE128',
    width = 2,
    height = 50,
    marginTop = 10,
    marginBottom = 10,
    marginLeft = 10,
    marginRight = 10,
    displayValue = true,
    fontSize = 14,
    textMargin = 2,
    background = '#ffffff',
    lineColor = '#000000',
    className,
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        if (canvasRef.current && value) {
            try {
                JsBarcode(canvasRef.current, value, {
                    format,
                    width,
                    height,
                    marginTop,
                    marginBottom,
                    marginLeft,
                    marginRight,
                    displayValue,
                    fontSize,
                    textMargin: textMargin,
                    background,
                    lineColor,
                });
            } catch (error) {
                console.error('Failed to generate barcode:', error);
            }
        }
    }, [
        value,
        format,
        width,
        height,
        marginTop,
        marginBottom,
        marginLeft,
        marginRight,
        displayValue,
        fontSize,
        textMargin,
        background,
        lineColor,
    ]);

    return <canvas ref={canvasRef} className={className} />;
};
