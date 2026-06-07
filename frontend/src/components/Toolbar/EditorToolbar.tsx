import React from 'react';
import { usePdfStore } from '@/store/usePdfStore';
import { draftsDb } from '@/lib/draftsDb';
import { 
  ZoomIn, 
  ZoomOut, 
  Type, 
  Download, 
  Eye, 
  EyeOff, 
  Link, 
  Unlink,
  X,
  Sun,
  Moon,
  FolderOpen
} from 'lucide-react';
import { SignInButton, UserButton, Show, useUser } from '@clerk/nextjs';
import { API_BASE_URL } from '@/constants';
import { fetchUserProfile } from '@/lib/api';

export const EditorToolbar: React.FC = () => {
  const { user, isSignedIn } = useUser();
  const filename = usePdfStore(state => state.filename);
  const setFilename = usePdfStore(state => state.setFilename);
  const zoom = usePdfStore(state => state.zoom);
  const setZoom = usePdfStore(state => state.setZoom);
  const showAllFields = usePdfStore(state => state.showAllFields);
  const setShowAllFields = usePdfStore(state => state.setShowAllFields);
  const showGroupHighlight = usePdfStore(state => state.showGroupHighlight);
  const setShowGroupHighlight = usePdfStore(state => state.setShowGroupHighlight);
  const addCustomBox = usePdfStore(state => state.addCustomBox);
  const currentPage = usePdfStore(state => state.currentPage);
  const resetStore = usePdfStore(state => state.resetStore);
  const isDarkMode = usePdfStore(state => state.isDarkMode);
  const toggleDarkMode = usePdfStore(state => state.toggleDarkMode);
  const setDraftsModalOpen = usePdfStore(state => state.setDraftsModalOpen);
  const addToast = usePdfStore(state => state.addToast);
  const setShowRatingToast = usePdfStore(state => state.setShowRatingToast);


  const [isExporting, setIsExporting] = React.useState(false);
  const [tokens, setTokens] = React.useState<number | null>(null);

  React.useEffect(() => {
    if (isSignedIn && user) {
      fetchUserProfile(user.id)
        .then(profile => {
          setTokens(profile.tokens_balance);
        })
        .catch(console.error);
    } else {
      setTokens(null);
    }
  }, [user, isSignedIn]);

  const handleExport = async () => {
    const { 
      rawFile, 
      spans, 
      groups, 
      editsMap, 
      groupEditsMap, 
      customBoxes, 
      spanPositions, 
      spanSizes, 
      linkedEditMode 
    } = usePdfStore.getState();

    if (!rawFile) return;

    const pageCount = usePdfStore.getState().pageCount;
    const selectedPages = usePdfStore.getState().selectedPages;
    const requiredTokens = pageCount > 1 ? selectedPages.length * 0.5 : 0.0;

    if (requiredTokens > 0) {
      if (!isSignedIn) {
        addToast('Please sign in to export multi-page documents.', 'error');
        return;
      }

      if (tokens !== null && tokens < requiredTokens) {
        addToast(`Insufficient tokens. This export costs ${requiredTokens} tokens, but you only have ${tokens} tokens.`, 'error');
        setTimeout(() => {
          window.location.href = '/pricing';
        }, 1500);
        return;
      }
    }

    setIsExporting(true);

    try {
      const exportData = {
        spans,
        groups,
        editsMap,
        groupEditsMap,
        customBoxes,
        spanPositions,
        spanSizes,
        linked_edit_mode: linkedEditMode,
        selectedPages,
      };

      const formData = new FormData();
      const originalFileBlob = new Blob([rawFile], { type: 'application/pdf' });
      formData.append('file', originalFileBlob, filename || 'document.pdf');
      formData.append('editsData', JSON.stringify(exportData));
      if (user) {
        formData.append('clerkId', user.id);
      }

      const response = await fetch(`${API_BASE_URL}/api/pdf/export`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Export failed: ${errorText}`);
      }

      const resultBlob = await response.blob();
      const url = URL.createObjectURL(resultBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `edited_${filename || 'document.pdf'}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      addToast('PDF exported successfully!', 'success');
      setShowRatingToast(true);
      setTokens(prev => (prev !== null ? Math.max(0, prev - requiredTokens) : null));


    } catch (error) {
      console.error('Export error:', error);
      const msg = error instanceof Error ? error.message : String(error);
      addToast(`Export failed: ${msg}`, 'error');
    } finally {
      setIsExporting(false);
    }
  };


  const handleSaveDraft = async () => {
    const { 
      rawFile, 
      spans, 
      groups, 
      editsMap, 
      groupEditsMap, 
      customBoxes, 
      spanPositions, 
      spanSizes, 
      spanAlignments,
      zoom,
      currentPage,
      pageCount,
      pageDimensions,
      selectedPages
    } = usePdfStore.getState();

    if (!rawFile || !filename) return;

    try {
      const draft = {
        id: filename,
        filename,
        updatedAt: new Date().toISOString(),
        rawFile,
        spans,
        groups,
        editsMap,
        groupEditsMap,
        customBoxes,
        spanPositions,
        spanSizes,
        spanAlignments,
        zoom,
        currentPage,
        pageCount,
        pageDimensions,
        selectedPages
      };

      await draftsDb.saveDraft(draft);
      addToast('Draft saved successfully!', 'success');
    } catch (error) {
      console.error(error);
      addToast('Failed to save draft.', 'error');
    }
  };

  const handleAddBox = () => {
    addCustomBox({
      id: `custom_${Date.now()}`,
      page: currentPage,
      x: 100,
      y: 100,
      width: 150,
      height: 30,
      text: '',
      fontSize: 12,
      fontFamily: 'Helvetica',
      color: '#000000',
      bgPatch: true,
    });
  };

  return (
    <div className="h-14 px-6 flex items-center justify-between shrink-0 z-50 fixed top-0 left-0 right-0 bg-canvas border-b border-hairline">
      {/* Left Section: Logo, Navigation & File Info */}
      <div className="flex items-center space-x-6 min-w-0">
        <a 
          href="/" 
          className="text-sm font-semibold tracking-eyebrow text-ink shrink-0 uppercase flex items-center space-x-2 hover:opacity-95 transition-opacity"
        >
          <span className="w-2.5 h-2.5 rounded-sm bg-primary"></span>
          <span>FIELDFLOW <span className="text-ink-subtle ml-0.5 font-normal uppercase">PDF</span></span>
        </a>

        {/* Navigation Links */}
        {!filename && (
          <nav className="hidden sm:flex items-center space-x-4 shrink-0">
            <a 
              href="/editor" 
              className="text-[11px] font-bold uppercase tracking-wider text-primary"
            >
              Editor
            </a>
            <button 
              onClick={() => setDraftsModalOpen(true)}
              className="text-[11px] font-medium uppercase tracking-wider text-ink-subtle hover:text-ink transition-colors cursor-pointer"
            >
              Drafts
            </button>
            <a 
              href="/pricing" 
              className="text-[11px] font-medium uppercase tracking-wider text-ink-subtle hover:text-ink transition-colors"
            >
              Pricing
            </a>
            <a 
              href="/referrals" 
              className="text-[11px] font-medium uppercase tracking-wider text-ink-subtle hover:text-ink transition-colors"
            >
              Refer & Earn
            </a>
            {isSignedIn && (
              <a 
                href="/token-usage" 
                className="text-[11px] font-medium uppercase tracking-wider text-ink-subtle hover:text-ink transition-colors"
              >
                Token Usage
              </a>
            )}
            <a 
              href="/guide" 
              className="text-[11px] font-medium uppercase tracking-wider text-ink-subtle hover:text-ink transition-colors"
            >
              Guide & Limits
            </a>
            <a 
              href="/privacy" 
              className="text-[11px] font-medium uppercase tracking-wider text-ink-subtle hover:text-ink transition-colors"
            >
              Privacy Policy
            </a>
          </nav>
        )}


        
        {filename !== null && (
          <div className="flex items-center rounded-md pl-3 pr-1 py-1 border border-hairline bg-surface-1 text-ink-muted focus-within:border-hairline-strong focus-within:bg-surface-2 transition-colors">
            <input
              type="text"
              value={filename || ''}
              onChange={(e) => setFilename(e.target.value)}
              className="text-xs font-medium truncate max-w-[120px] lg:max-w-[200px] mr-2 bg-transparent border-none outline-none focus:ring-0 w-full"
              title="Edit Filename"
            />
            <button 
              onClick={() => resetStore()}
              className="p-1 hover:bg-surface-3 hover:text-ink rounded transition-all shrink-0 cursor-pointer"
              title="Close and discard changes"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Middle actions: Zoom & Tools */}
      {filename && (
        <div className="flex items-center space-x-2 md:space-x-4">
          <div className="flex items-center space-x-1 rounded-md p-1 border border-hairline bg-surface-1">
            <button 
              onClick={() => setZoom(Math.max(0.5, zoom - 0.25))}
              className="p-1 rounded hover:bg-surface-2 text-ink-muted hover:text-ink transition-all cursor-pointer"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="px-2 text-[10px] font-medium w-12 text-center text-ink-muted">
              {Math.round(zoom * 100)}%
            </span>
            <button 
              onClick={() => setZoom(Math.min(3, zoom + 0.25))}
              className="p-1 rounded hover:bg-surface-2 text-ink-muted hover:text-ink transition-all cursor-pointer"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="w-px h-5 mx-1 bg-hairline"></div>

          <div className="flex items-center space-x-1">
            <button 
              onClick={() => setShowAllFields(!showAllFields)}
              className={`p-2 rounded-md border transition-all cursor-pointer ${
                showAllFields 
                ? 'bg-surface-2 text-primary border-hairline-strong' 
                : 'border-transparent text-ink-subtle hover:text-ink hover:bg-surface-1'
              }`}
            >
              {showAllFields ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            </button>
            <button 
              onClick={() => setShowGroupHighlight(!showGroupHighlight)}
              className={`p-2 rounded-md border transition-all cursor-pointer ${
                showGroupHighlight 
                ? 'bg-surface-2 text-primary border-hairline-strong' 
                : 'border-transparent text-ink-subtle hover:text-ink hover:bg-surface-1'
              }`}
            >
              {showGroupHighlight ? <Link className="w-4 h-4" /> : <Unlink className="w-4 h-4" />}
            </button>
          </div>

          <button 
            onClick={handleAddBox}
            className="hidden sm:flex items-center space-x-2 px-4 py-1.5 border border-hairline bg-surface-1 text-ink hover:bg-surface-2 rounded-md transition-all font-medium text-xs tracking-wide cursor-pointer"
            disabled={isExporting}
          >
            <Type className="w-3.5 h-3.5" />
            <span>Add Field</span>
          </button>
        </div>
      )}

      {/* Right Section: Theme & Export */}
      <div className="flex items-center space-x-3 shrink-0">
        <button 
          onClick={toggleDarkMode}
          className="p-2 rounded-md border border-hairline bg-surface-1 text-ink-muted hover:bg-surface-2 hover:text-ink transition-all cursor-pointer"
          title="Toggle Theme"
        >
          {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        <Show when="signed-out">
          <SignInButton mode="modal">
            <button className="px-3.5 py-1.5 border border-hairline bg-surface-1 text-ink hover:bg-surface-2 rounded-md transition-all font-medium tracking-wide text-xs uppercase cursor-pointer">
              Sign In
            </button>
          </SignInButton>
        </Show>

        <Show when="signed-in">
          <div className="flex items-center space-x-3">
            {tokens !== null && (
              <a 
                href="/token-usage" 
                className="px-2.5 py-1.5 rounded-md bg-surface-1 border border-hairline hover:border-hairline-strong transition-all flex items-center space-x-1.5 text-[10px] font-semibold text-ink-muted shrink-0"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-semantic-success animate-pulse"></span>
                <span>{tokens} Tokens</span>
              </a>
            )}
            <UserButton />
          </div>
        </Show>


        {filename && (
          <div className="flex items-center space-x-2">
            <button 
              onClick={handleSaveDraft}
              className="flex items-center space-x-2 px-4 py-1.5 border border-hairline bg-surface-1 text-ink hover:bg-surface-2 rounded-md transition-all font-medium text-xs tracking-wide cursor-pointer"
            >
              <FolderOpen className="w-3.5 h-3.5 text-primary" />
              <span>Save to Draft</span>
            </button>

            <button 
              onClick={handleExport}
              disabled={isExporting}
              className="flex items-center space-x-2 px-5 py-1.5 bg-primary text-white hover:bg-primary-hover active:bg-primary-focus rounded-md transition-all font-semibold text-xs tracking-wide cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
            >
              {isExporting ? (
                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <Download className="w-3.5 h-3.5 text-white" />
              )}
              <span className="font-semibold text-white">{isExporting ? 'Wait' : 'Export'}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
