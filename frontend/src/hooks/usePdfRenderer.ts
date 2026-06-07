import { useEffect, useState } from 'react';

// Common type subset for what we use from pdfjs
type PDFDocumentProxy = any;

export function usePdfRenderer({ pdfBuffer }: { pdfBuffer: ArrayBuffer | null }) {
  const [pdfDocument, setPdfDocument] = useState<PDFDocumentProxy | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!pdfBuffer) {
      setPdfDocument(null);
      return;
    }

    let isMounted = true;
    setIsLoading(true);
    setError(null);

    const loadPdf = async () => {
      try {
        // 1. Ensure DOMMatrix polyfill is applied before importing the library
        if (typeof window !== 'undefined' && !window.DOMMatrix) {
          (window as any).DOMMatrix = (window as any).WebKitCSSMatrix || (window as any).MSCSSMatrix;
        }

        // 2. Dynamically import pdfjs-dist to avoid top-level evaluation errors during SSR/hydration
        const pdfjsLib = await import('pdfjs-dist');
        
        // 3. Configure worker
        if (typeof window !== 'undefined' && !pdfjsLib.GlobalWorkerOptions.workerSrc) {
          // Use unpkg for version 5.6.205+ consistency
          const pkgVersion = pdfjsLib.version;
          pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pkgVersion}/build/pdf.worker.min.mjs`;
        }

        const bufferCopy = pdfBuffer.slice(0);
        const loadingTask = pdfjsLib.getDocument({
          data: new Uint8Array(bufferCopy),
          useSystemFonts: true,
        });

        const doc = await loadingTask.promise;
        
        if (isMounted) {
          setPdfDocument(doc);
          setIsLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          console.error('Error loading PDF:', err);
          setError(err instanceof Error ? err : new Error(String(err)));
          setIsLoading(false);
        }
      }
    };

    loadPdf();

    return () => {
      isMounted = false;
    };
  }, [pdfBuffer]);

  return { pdfDocument, isLoading, error };
}

