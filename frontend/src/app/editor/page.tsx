'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { EditorToolbar } from '@/components/Toolbar/EditorToolbar';
import { FieldInspector } from '@/components/Inspector/FieldInspector';
import { ShortcutPanel } from '@/components/Viewer/ShortcutPanel';
import { usePdfStore } from '@/store/usePdfStore';
import { draftsDb } from '@/lib/draftsDb';
import { RatingToast } from '@/components/Viewer/RatingToast';


const PdfViewer = dynamic(() => import('@/components/Viewer/PdfViewer').then(m => m.PdfViewer), { ssr: false });
const DraftsModal = dynamic(() => import('@/components/Toolbar/DraftsModal').then(m => m.DraftsModal), { ssr: false });

export default function EditorPage() {
  const router = useRouter();
  const rawFile = usePdfStore(state => state.rawFile);
  const loadDraft = usePdfStore(state => state.loadDraft);
  const [isSessionLoaded, setIsSessionLoaded] = useState(false);

  useEffect(() => {
    if (isSessionLoaded && !rawFile) {
      router.replace('/upload');
    }
  }, [isSessionLoaded, rawFile, router]);

  useEffect(() => {
    const initSession = async () => {
      if (usePdfStore.getState().rawFile) {
        setIsSessionLoaded(true);
        return;
      }

      try {
        const session = await draftsDb.getDraft('active-session');
        if (session) {
          loadDraft(session);
        }
      } catch (err) {
        console.error('Failed to load active session:', err);
      } finally {
        setIsSessionLoaded(true);
      }
    };
    initSession();
  }, [loadDraft]);

  useEffect(() => {
    if (!isSessionLoaded) return;

    let timeoutId: NodeJS.Timeout;

    const unsubscribe = usePdfStore.subscribe((state) => {
      clearTimeout(timeoutId);

      timeoutId = setTimeout(async () => {
        if (!state.rawFile) {
          await draftsDb.deleteDraft('active-session');
          return;
        }

        try {
          const session = {
            id: 'active-session',
            filename: state.filename || 'document.pdf',
            updatedAt: new Date().toISOString(),
            rawFile: state.rawFile,
            spans: state.spans,
            groups: state.groups,
            editsMap: state.editsMap,
            groupEditsMap: state.groupEditsMap,
            customBoxes: state.customBoxes,
            spanPositions: state.spanPositions,
            spanSizes: state.spanSizes,
            spanAlignments: state.spanAlignments,
            zoom: state.zoom,
            currentPage: state.currentPage,
            pageCount: state.pageCount,
            pageDimensions: state.pageDimensions,
            selectedPages: state.selectedPages
          };
          await draftsDb.saveDraft(session);
        } catch (err) {
          console.error('Auto-save active session failed:', err);
        }
      }, 1000); // 1-second debounce
    });

    return () => {
      unsubscribe();
      clearTimeout(timeoutId);
    };
  }, [isSessionLoaded]);

  return (
    <div className="flex flex-col h-screen overflow-hidden font-sans bg-canvas text-ink">
      <EditorToolbar />
      <DraftsModal />
      <RatingToast />

      
      <div className="flex flex-1 overflow-hidden relative mt-16">
        <div className="flex-1 overflow-auto bg-surface-2 shadow-inner">
          {!isSessionLoaded ? (
            <div className="h-full flex items-center justify-center">
              <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : rawFile ? (
              <PdfViewer />
          ) : (
            <div className="h-full flex items-center justify-center">
              <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}
        </div>
        
        {isSessionLoaded && rawFile && (
          <div className="flex shrink-0 h-full z-20">
            <FieldInspector />
            <div className="w-px h-full bg-hairline"></div>
            <ShortcutPanel />
          </div>
        )}
      </div>
    </div>
  );
}

