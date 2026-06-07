import React, { useEffect, useRef, useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { usePdfStore } from '@/store/usePdfStore';

interface PageCanvasProps {
  pdfDocument: pdfjsLib.PDFDocumentProxy;
  pageNumber: number; // 0-indexed passed here
  zoom: number;
}

export const PageCanvas: React.FC<PageCanvasProps> = React.memo(({ pdfDocument, pageNumber, zoom }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { setPageDimensions } = usePdfStore();
  const [isRendering, setIsRendering] = useState(false);
  
  // Real PDF page number is 1-indexed
  const actualPageNumber = pageNumber + 1;

  useEffect(() => {
    let renderTask: pdfjsLib.RenderTask | null = null;
    let isMounted = true;

    const renderPage = async () => {
      if (!canvasRef.current || !pdfDocument) return;

      try {
        setIsRendering(true);
        const page = await pdfDocument.getPage(actualPageNumber);
        
        if (!isMounted) return;
        
        // Calculate scale based on device pixel ratio for sharper rendering
        const dpr = window.devicePixelRatio || 1;
        const viewport = page.getViewport({ scale: zoom * dpr });
        const cssViewport = page.getViewport({ scale: zoom });

        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');
        if (!context || !canvas) return;

        // Set actual size in memory (scaled to account for retina displays)
        canvas.width = viewport.width;
        canvas.height = viewport.height;

        // Set CSS size to match the desired zoom level
        canvas.style.width = `${cssViewport.width}px`;
        canvas.style.height = `${cssViewport.height}px`;

        // Store the original PDF points dimensions natively in Zustand
        // The original PDF points (scale=1) are what we map our extracting bounding boxes over
        const baseViewport = page.getViewport({ scale: 1 });
        setPageDimensions(pageNumber, baseViewport.width, baseViewport.height);

        const renderContext = {
          canvasContext: context,
          viewport: viewport,
          canvas: canvas
        };

        if (!isMounted) return;

        renderTask = page.render(renderContext);
        await renderTask.promise;
        
        if (isMounted) {
          setIsRendering(false);
        }
      } catch (err) {
        // Ignore "Render cancelled" errors which are normal when zooming quickly
        if (err instanceof Error && err.name === 'RenderingCancelledException') {
          return;
        }
        console.error(`Error rendering page ${actualPageNumber}:`, err);
        if (isMounted) setIsRendering(false);
      }
    };

    renderPage();

    return () => {
      isMounted = false;
      if (renderTask) {
        renderTask.cancel();
      }
    };
  }, [pdfDocument, actualPageNumber, zoom, setPageDimensions, pageNumber]);

  return (
    <canvas 
      ref={canvasRef} 
      className="block bg-transparent"
      id={`pdf-page-canvas-${pageNumber}`}
      style={{
        opacity: isRendering ? 0.7 : 1,
        transition: 'opacity 0.2s',
      }}
    />
  );
});
PageCanvas.displayName = 'PageCanvas';
