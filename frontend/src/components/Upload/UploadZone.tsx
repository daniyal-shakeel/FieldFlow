'use client';

import React, { useCallback, useState } from 'react';
import { 
  UploadCloud, 
  Infinity, 
  Shield, 
  Receipt, 
  Zap, 
  Download, 
  CheckCircle2, 
  ChevronRight, 
  X,
  Eye
} from 'lucide-react';
import { usePdfStore } from '@/store/usePdfStore';
import { extractPdf, groupFields } from '@/lib/api';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';

import * as pdfjsLib from 'pdfjs-dist';

// Initialize PDF.js worker
if (typeof window !== 'undefined' && !pdfjsLib.GlobalWorkerOptions.workerSrc) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
}

// Sub-component for visual page previews
const PageThumbnail: React.FC<{ pdf: any; index: number; isDarkMode: boolean }> = ({ pdf, index, isDarkMode }) => {
  const [thumb, setThumb] = useState<string | null>(null);

  React.useEffect(() => {
    let active = true;
    const render = async () => {
      try {
        const page = await pdf.getPage(index + 1);
        const viewport = page.getViewport({ scale: 0.25 });
        const canvas = document.createElement('canvas');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const context = canvas.getContext('2d');
        if (context && active) {
          await page.render({ canvasContext: context, viewport }).promise;
          setThumb(canvas.toDataURL());
        }
      } catch (err) {
        console.error('Thumbnail failed:', err);
      }
    };
    render();
    return () => { active = false; };
  }, [pdf, index]);

  return (
    <div className={`w-full aspect-[2/3] rounded-md overflow-hidden border transition-all ${
      thumb ? 'opacity-100' : 'opacity-40 bg-surface-2'
    } border-hairline`}>
      {thumb ? (
        <img src={thumb} alt={`Page ${index + 1}`} className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full flex items-center justify-center">
            <div className="w-4 h-4 border-2 border-primary/20 border-t-primary rounded-full animate-spin"></div>
        </div>
      )}
    </div>
  );
};

export const UploadZone: React.FC = () => {
  const { user } = useUser();
  const router = useRouter();
  const { setFile, setExtractedData, isDarkMode, setDraftsModalOpen } = usePdfStore();

  const [isDragActive, setIsDragActive] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Page selection state
  const [tempFile, setTempFile] = useState<{ file: File; buffer: ArrayBuffer; pdf: any } | null>(null);
  const [totalPages, setTotalPages] = useState(0);
  const [selectedIndices, setSelectedIndices] = useState<number[]>([]);
  const [showSelector, setShowSelector] = useState(false);

  const handleFile = async (file: File) => {
    if (file.type !== 'application/pdf') {
      setError('Only PDF files are supported.');
      return;
    }

    // 10MB Limit
    if (file.size > 10 * 1024 * 1024) {
      setError('File is too large. Maximum 10MB allowed (10MB = 10,485,760 bytes).');
      return;
    }
    
    setError(null);
    setIsProcessing(true);
    
    try {
      const arrayBuffer = await file.arrayBuffer();
      
      // CRITICAL: Clone buffer using slice(0) before passing to getDocument.
      // Modern PDF.js worker transfers the buffer, which detaches it from the main thread.
      const bufferForCheck = arrayBuffer.slice(0);
      const loadingTask = pdfjsLib.getDocument({ data: bufferForCheck });
      const pdf = await loadingTask.promise;
      
      if (pdf.numPages > 1) {
        setTempFile({ file, buffer: arrayBuffer, pdf });
        setTotalPages(pdf.numPages);
        // Default to selecting all pages
        const allIndices = Array.from({ length: pdf.numPages }, (_, i) => i);
        setSelectedIndices(allIndices);
        setShowSelector(true);
        setIsProcessing(false);
      } else {
        const indices = Array.from({ length: pdf.numPages }, (_, i) => i);
        await processExtraction(file, arrayBuffer, indices);
      }

    } catch (err) {
      console.error('Upload failed:', err);
      setError(err instanceof Error ? err.message : String(err));
      setIsProcessing(false);
    }
  };

  const processExtraction = async (file: File, buffer: ArrayBuffer, indices: number[]) => {
    setIsProcessing(true);
    setError(null);
    try {
      setFile(file, buffer);
      const extraction = await extractPdf(file, indices, user?.id);
      const grouping = await groupFields({ spans: extraction.spans });
      setExtractedData(extraction.spans, grouping.groups, extraction.filename, extraction.page_count, indices);
      router.push('/editor');

    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setIsProcessing(false);
    }
  };

  const togglePageSelection = (idx: number) => {
    if (selectedIndices.includes(idx)) {
      setSelectedIndices(selectedIndices.filter(i => i !== idx));
    } else {
      setSelectedIndices([...selectedIndices, idx].sort((a, b) => a - b));
    }
  };

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(true);
  }, []);

  const onDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(false);
  }, []);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const onFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFile(e.target.files[0]);
    }
  };

  if (showSelector && tempFile) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-screen w-full px-6 overflow-y-auto pt-24 pb-12 bg-canvas">
        <div className="max-w-5xl w-full p-12 rounded-lg border border-hairline bg-surface-1">
          <div className="flex flex-col items-center text-center mb-8">
            <h2 className="text-4xl font-semibold tracking-display-md text-ink uppercase">
              VISUAL <span className="text-primary">PICKER</span>
            </h2>
            <p className="text-sm font-medium text-ink-muted mt-2">
              Document has {totalPages} pages. Select the pages you want to load to the editor canvas.
            </p>
          </div>

          {/* Marketing Highlight Note */}
          <div className="mb-6 p-4 rounded-md border border-primary/20 bg-primary/5 text-xs text-ink-muted flex items-start space-x-3">
            <Zap className="w-4 h-4 text-primary shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-ink uppercase tracking-wide text-[10px] mb-1">Visual Selector & Cost Summary</p>
              <p className="leading-relaxed">
                Each page loaded costs <strong className="text-primary font-semibold">0.5 tokens</strong> upon export. 
                Single-page PDFs are always <strong className="text-primary font-semibold">100% FREE</strong> and require no tokens or account login!
              </p>
            </div>
          </div>

          <div className="flex justify-end space-x-3 mb-4">
            <button
              onClick={() => setSelectedIndices(Array.from({ length: totalPages }, (_, i) => i))}
              className="px-3.5 py-1.5 rounded-md border border-hairline bg-surface-2 hover:bg-surface-3 text-ink-muted hover:text-ink transition-colors font-medium text-[11px] uppercase tracking-wider cursor-pointer"
            >
              Select All
            </button>
            <button
              onClick={() => setSelectedIndices([])}
              className="px-3.5 py-1.5 rounded-md border border-hairline bg-surface-2 hover:bg-surface-3 text-ink-muted hover:text-ink transition-colors font-medium text-[11px] uppercase tracking-wider cursor-pointer"
            >
              Clear Selection
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6 mb-12 max-h-[50vh] overflow-y-auto p-4 border border-hairline bg-canvas rounded-md">
            {Array.from({ length: totalPages }, (_, i) => {
              const isSelected = selectedIndices.includes(i);
              return (
                <button
                  key={i}
                  onClick={() => togglePageSelection(i)}
                  className="group relative flex flex-col space-y-3 transition-all transform active:scale-95 items-center"
                >
                  <PageThumbnail pdf={tempFile.pdf} index={i} isDarkMode={isDarkMode} />
                  
                  <div className={`
                    absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center border transition-all shadow-md
                    ${isSelected 
                      ? 'bg-primary border-white scale-110 shadow-primary/20' 
                      : 'bg-surface-1 border-hairline-strong'
                    }
                  `}>
                    {isSelected ? (
                      <CheckCircle2 className="w-4.5 h-4.5 text-white" />
                    ) : (
                      <span className="text-[10px] font-semibold text-ink-muted">{i + 1}</span>
                    )}
                  </div>

                  <div className={`
                    text-[10px] font-semibold tracking-wider uppercase py-1 px-3 rounded-md self-center transition-colors
                    ${isSelected ? 'bg-primary text-white' : 'bg-surface-2 text-ink-muted'}
                  `}>
                    {isSelected ? 'Selected' : `Page ${i+1}`}
                  </div>
                </button>
              );
            })}
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-6 border-t border-hairline pt-10">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="flex items-center space-x-4 px-5 py-2.5 rounded-md border border-hairline bg-surface-2 text-ink-muted">
                <Eye className="w-4 h-4 text-primary" />
                <span className="text-xs font-semibold uppercase tracking-wider">
                  Selected: <span className="text-primary font-bold">{selectedIndices.length} Page{selectedIndices.length !== 1 ? 's' : ''}</span>
                </span>
              </div>
              <div className="text-xs font-medium text-ink-muted">
                Estimated Cost: <span className="text-primary font-bold">{(selectedIndices.length * 0.5).toFixed(1)}</span> Token{selectedIndices.length * 0.5 !== 1 ? 's' : ''} <span className="text-ink-subtle text-[11px] font-normal">(0.5 tokens/page)</span>
              </div>
            </div>

            <div className="flex space-x-4">
              <button 
                onClick={() => { setShowSelector(false); setTempFile(null); setSelectedIndices([]); }}
                className="px-6 py-2.5 rounded-md font-medium text-xs uppercase tracking-wider text-ink-subtle hover:text-ink transition-colors cursor-pointer"
              >
                Back to Upload
              </button>
              <button 
                disabled={selectedIndices.length === 0 || isProcessing}
                onClick={() => processExtraction(tempFile.file, tempFile.buffer, selectedIndices)}
                className="flex items-center space-x-2 px-8 py-2.5 bg-primary hover:bg-primary-hover active:bg-primary-focus text-white font-medium rounded-md shadow-lg shadow-primary/10 transform active:scale-95 disabled:opacity-50 disabled:pointer-events-none transition-all cursor-pointer"
              >
                {isProcessing ? (
                  <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <>
                    <span className="text-xs uppercase tracking-tight font-semibold">Process Selection</span>
                    <ChevronRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center min-h-screen w-full px-6 overflow-y-auto pt-24 pb-12 bg-canvas">
      <div 
        className={`max-w-3xl w-full p-12 rounded-lg border flex flex-col items-center text-center transition-all ${
          isDragActive 
          ? 'border-primary bg-primary/5' 
          : 'border-hairline bg-surface-1'
        }`}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
      >
        <div className="w-20 h-20 rounded-lg flex items-center justify-center mb-8 border border-hairline bg-surface-2">
          <UploadCloud className="w-10 h-10 text-primary" />
        </div>
        
        <h1 className="text-5xl font-semibold mb-4 tracking-display-md text-ink uppercase">
          FIELDFLOW <span className="text-primary">PDF</span>
        </h1>
        
        <p className="text-lg mb-8 max-w-xl mx-auto leading-relaxed font-medium text-ink-muted">
          High-fidelity structured editing for professionals. <br/>
          <span className="text-xs font-normal text-ink-subtle block mt-2">
            Single-page PDFs are <span className="text-primary font-semibold">100% FREE & Unlimited</span>. No account required!
          </span>
          <span className="text-[11px] font-normal text-ink-subtle block mt-1 opacity-85">
            Multi-page PDFs cost 0.5 tokens per page. Max 10MB file limit.
          </span>
        </p>
        
        {error && (
          <div className="mb-8 p-4 bg-red-950/20 border border-red-900/30 text-red-400 rounded-md text-xs font-semibold animate-in fade-in slide-in-from-top-4 duration-300 flex items-center space-x-2">
            <X className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="w-full flex flex-col items-center justify-center mb-12 space-y-4">
          <label className={`
            group relative inline-flex items-center justify-center px-10 py-4
            bg-primary text-white font-semibold rounded-md shadow-lg shadow-primary/10
            hover:bg-primary-hover cursor-pointer overflow-hidden
            transition-all transform active:scale-95 ${isProcessing ? 'opacity-50 pointer-events-none' : ''}
          `}>
             <span className="relative z-10 flex items-center space-x-3">
               {isProcessing ? (
                 <>
                   <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                   <span className="text-xs uppercase tracking-wider font-semibold">Analyzing...</span>
                 </>
               ) : (
                 <>
                   <Zap className="h-4 w-4 fill-current text-white" />
                   <span className="text-xs tracking-wider uppercase font-semibold">Upload PDF Document</span>
                 </>
               )}
             </span>
            
            <input 
              type="file" 
              className="hidden" 
              accept="application/pdf"
              onChange={onFileInput}
              disabled={isProcessing}
            />
          </label>

          <button
            type="button"
            onClick={() => setDraftsModalOpen(true)}
            className="text-xs font-semibold text-primary hover:underline cursor-pointer flex items-center space-x-1.5"
            disabled={isProcessing}
          >
            <span>Or resume from a saved draft</span>
          </button>
        </div>

        {/* Benefits Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 w-full border-t border-hairline pt-10">
          <div className="flex flex-col items-center">
            <div className="p-2.5 rounded-md mb-2 bg-surface-2 border border-hairline text-primary">
              <Infinity className="w-4.5 h-4.5" />
            </div>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-ink-muted">Unlimited Edits</span>
          </div>
          <div className="flex flex-col items-center">
            <div className="p-2.5 rounded-md mb-2 bg-surface-2 border border-hairline text-primary">
              <Receipt className="w-4.5 h-4.5" />
            </div>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-ink-muted">Invoice Ready</span>
          </div>
          <div className="flex flex-col items-center">
            <div className="p-2.5 rounded-md mb-2 bg-surface-2 border border-hairline text-primary">
              <Shield className="w-4.5 h-4.5" />
            </div>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-ink-muted">100% Private</span>
          </div>
          <div className="flex flex-col items-center">
            <div className="p-2.5 rounded-md mb-2 bg-surface-2 border border-hairline text-primary">
              <Download className="w-4.5 h-4.5" />
            </div>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-ink-muted">Instant Export</span>
          </div>
        </div>
      </div>
    </div>
  );

};
