import React, { useMemo, useEffect } from 'react';
import { usePdfStore } from '@/store/usePdfStore';
import { usePdfRenderer } from '@/hooks/usePdfRenderer';
import dynamic from 'next/dynamic';
const PageCanvas = dynamic(() => import('./PageCanvas').then(mod => mod.PageCanvas), { ssr: false });

import { KonvaOverlay } from './KonvaOverlay';

export const PdfViewer: React.FC = () => {
  const rawFile = usePdfStore(state => state.rawFile);
  const zoom = usePdfStore(state => state.zoom);
  const pageCount = usePdfStore(state => state.pageCount);
  const selectedPages = usePdfStore(state => state.selectedPages);
  const undo = usePdfStore(state => state.undo);
  const redo = usePdfStore(state => state.redo);
  const takeSnapshot = usePdfStore(state => state.takeSnapshot);
  const moveSelectedElement = usePdfStore(state => state.moveSelectedElement);
  const resizeSelectedElement = usePdfStore(state => state.resizeSelectedElement);
  const { pdfDocument, isLoading, error } = usePdfRenderer({ pdfBuffer: rawFile });

  const pages = useMemo(() => {
    if (selectedPages && selectedPages.length > 0) {
      return selectedPages;
    }
    return Array.from({ length: pageCount }, (_, i) => i);
  }, [pageCount, selectedPages]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept shortcut keys if user is typing in any text inputs or textareas
      const activeEl = document.activeElement;
      const isTyping = activeEl && (
        activeEl.tagName === 'INPUT' || 
        activeEl.tagName === 'TEXTAREA' || 
        (activeEl as HTMLElement).isContentEditable
      );
      if (isTyping) return;

      const isCtrl = e.ctrlKey || e.metaKey;
      const isShift = e.shiftKey;
      const isAlt = e.altKey;

      // 1. History keyboard shortcuts: Undo/Redo
      if (isCtrl && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        undo();
        return;
      }
      if ((isCtrl && e.key.toLowerCase() === 'y') || (isCtrl && isShift && e.key.toLowerCase() === 'z')) {
        e.preventDefault();
        redo();
        return;
      }

      // 2. Element manipulation keyboard shortcuts
      const arrows = ['ArrowRight', 'ArrowLeft', 'ArrowDown', 'ArrowUp'];
      if (!arrows.includes(e.key)) return;

      if (isAlt) {
        e.preventDefault();
        const step = 2;
        if (!e.repeat) takeSnapshot();
        if (e.key === 'ArrowRight') resizeSelectedElement(step, 0);
        else if (e.key === 'ArrowLeft') resizeSelectedElement(-step, 0);
        else if (e.key === 'ArrowDown') resizeSelectedElement(0, step);
        else if (e.key === 'ArrowUp') resizeSelectedElement(0, -step);
        return;
      }

      let moveStep: number | null = null;
      if (isShift && !isCtrl) moveStep = 10;
      else if (isCtrl && !isShift) moveStep = 1;
      else if (isCtrl && isShift) moveStep = 10;

      if (moveStep !== null) {
        e.preventDefault();
        if (!e.repeat) takeSnapshot();
        if (e.key === 'ArrowUp') moveSelectedElement(0, -moveStep);
        else if (e.key === 'ArrowDown') moveSelectedElement(0, moveStep);
        else if (e.key === 'ArrowLeft') moveSelectedElement(-moveStep, 0);
        else if (e.key === 'ArrowRight') moveSelectedElement(moveStep, 0);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo, takeSnapshot, moveSelectedElement, resizeSelectedElement]);

  if (!rawFile) {
    return (
      <div className="flex-1 flex items-center justify-center bg-canvas h-full">
        <p className="text-xs text-ink-subtle">Please upload a PDF to begin</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-canvas h-full">
        <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary/20 border-t-primary"></div>
        <span className="ml-3 text-xs text-ink-muted">Loading PDF...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center bg-canvas h-full">
        <p className="text-xs text-red-400">Error loading PDF: {error.message}</p>
      </div>
    );
  }

  return (
    <div className="flex-1 min-h-0 bg-canvas overflow-auto p-8">
      <div className="mx-auto flex w-max flex-col items-center">
        {pdfDocument && pages.map((pageIdx) => (
          <div 
            key={pageIdx} 
            className="relative mb-12 bg-white border border-hairline-strong transition-all scale-[1]" 
            id={`page-${pageIdx}`}
          >
            <PageCanvas
              pdfDocument={pdfDocument}
              pageNumber={pageIdx}
              zoom={zoom}
            />
            <div className="absolute top-0 left-0 pointer-events-none">
              <div className="pointer-events-auto">
                <KonvaOverlay pageNumber={pageIdx} zoom={zoom} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
