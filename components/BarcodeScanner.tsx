import React, { useEffect, useRef, useState } from 'react';
import { XIcon, LoadingSpinnerIcon } from './icons';

interface BarcodeScannerProps {
  onScan: (isbn: string) => void;
  onClose: () => void;
}

const BarcodeScanner: React.FC<BarcodeScannerProps> = ({ onScan, onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    let stream: MediaStream | null = null;
    let barcodeDetector: any; // BarcodeDetector is not in default TS libs yet

    const startScan = async () => {
      if (!('BarcodeDetector' in window)) {
        setError('Barcode Detector API is not supported in this browser.');
        setIsInitializing(false);
        return;
      }

      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }

        barcodeDetector = new (window as any).BarcodeDetector({ formats: ['ean_13'] });
        setIsInitializing(false);

        const intervalId = setInterval(async () => {
          if (videoRef.current && !videoRef.current.paused && barcodeDetector) {
            try {
              const barcodes = await barcodeDetector.detect(videoRef.current);
              if (barcodes.length > 0) {
                const isbn = barcodes[0].rawValue;
                clearInterval(intervalId);
                onScan(isbn);
              }
            } catch (e) {
              console.error('Barcode detection failed:', e);
            }
          }
        }, 500); // Scan every 500ms

        return () => {
          clearInterval(intervalId);
          if (stream) {
            stream.getTracks().forEach(track => track.stop());
          }
        };
      } catch (err) {
        console.error('Error accessing camera:', err);
        if (err.name === 'NotAllowedError') {
          setError('Camera permission denied. Please enable camera access in your browser settings.');
        } else {
          setError('Could not access camera. Please ensure it is not being used by another application.');
        }
        setIsInitializing(false);
      }
    };

    const cleanupPromise = startScan();

    return () => {
      cleanupPromise.then(cleanupFn => {
        if (cleanupFn) cleanupFn();
      });
    };
  }, [onScan]);

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" aria-modal="true">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-2xl w-full max-w-md relative overflow-hidden">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h2 className="text-lg font-bold text-gray-800 dark:text-gray-200">Scan ISBN Barcode</h2>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-slate-700" aria-label="Close scanner">
            <XIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
        </div>
        <div className="aspect-video bg-black flex items-center justify-center relative">
          <video ref={videoRef} className="w-full h-full object-cover" muted playsInline />
          {isInitializing && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 text-white">
              <LoadingSpinnerIcon className="w-10 h-10" />
              <p className="mt-2">Starting camera...</p>
            </div>
          )}
          {error && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/80 text-white p-4">
              <p className="text-center text-red-400">{error}</p>
            </div>
          )}
          {!error && !isInitializing && (
             <div className="absolute inset-0 flex items-center justify-center p-4 pointer-events-none">
                <div className="w-full max-w-xs h-24 border-4 border-dashed border-white/50 rounded-lg"></div>
             </div>
          )}
        </div>
        <div className="p-4 text-center text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-slate-800/50">
          Position the book's barcode within the frame.
        </div>
      </div>
    </div>
  );
};

export default BarcodeScanner;