import React, { useState, useEffect } from 'react';
import { usePdfStore } from '@/store/usePdfStore';
import { draftsDb, Draft } from '@/lib/draftsDb';
import { X, Trash2, FolderOpen, FileText, Clock } from 'lucide-react';

export const DraftsModal: React.FC = () => {
  const isDraftsModalOpen = usePdfStore(state => state.isDraftsModalOpen);
  const setDraftsModalOpen = usePdfStore(state => state.setDraftsModalOpen);
  const loadDraft = usePdfStore(state => state.loadDraft);
  const isDarkMode = usePdfStore(state => state.isDarkMode);

  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isDraftsModalOpen) {
      fetchDrafts();
    }
  }, [isDraftsModalOpen]);

  const fetchDrafts = async () => {
    setLoading(true);
    try {
      const list = await draftsDb.getDrafts();
      setDrafts(list);
    } catch (err) {
      console.error('Failed to fetch drafts:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleResume = (draft: Draft) => {
    loadDraft(draft);
    setDraftsModalOpen(false);
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this draft?')) return;
    try {
      await draftsDb.deleteDraft(id);
      fetchDrafts();
    } catch (err) {
      console.error('Failed to delete draft:', err);
    }
  };

  if (!isDraftsModalOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-black/85"
        onClick={() => setDraftsModalOpen(false)}
      />

      <div className="relative w-full max-w-2xl rounded-lg border border-hairline bg-surface-1 text-ink flex flex-col max-h-[85vh]">
        <div className="flex items-center justify-between p-6 border-b border-hairline">
          <div className="flex items-center space-x-3">
            <FolderOpen className="w-4 h-4 text-primary" />
            <h2 className="text-xs font-semibold tracking-eyebrow uppercase">Saved Drafts</h2>
          </div>
          <button 
            onClick={() => setDraftsModalOpen(false)}
            className="p-1.5 rounded hover:bg-surface-2 text-ink-subtle hover:text-ink transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-3">
              <div className="w-6 h-6 border-2 border-primary/20 border-t-primary rounded-full animate-spin"></div>
              <span className="text-[11px] text-ink-muted">Loading your drafts...</span>
            </div>
          ) : drafts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center space-y-4">
              <div className="p-4 rounded-md border border-hairline bg-surface-2">
                <FileText className="w-6 h-6 text-ink-subtle" />
              </div>
              <div>
                <p className="text-xs font-semibold text-ink">No Drafts Found</p>
                <p className="text-[11px] text-ink-subtle mt-1">Click &quot;Save to Draft&quot; in the editor toolbar to save your progress.</p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {drafts.map((draft) => {
                const fileSize = draft.rawFile ? (draft.rawFile.byteLength / 1024).toFixed(1) + ' KB' : 'Unknown size';
                return (
                  <div
                    key={draft.id}
                    onClick={() => handleResume(draft)}
                    className="group flex items-center justify-between p-4 rounded-md border border-hairline-tertiary bg-surface-2 cursor-pointer hover:bg-surface-3 hover:border-hairline transition-all"
                  >
                    <div className="flex items-center space-x-4 min-w-0">
                      <div className="p-2 rounded bg-surface-3 border border-hairline text-primary shrink-0">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-xs font-semibold text-ink truncate pr-4">{draft.filename}</h4>
                        <div className="flex items-center space-x-3 mt-1.5 text-[10px] text-ink-muted font-medium">
                          <span className="flex items-center space-x-1 shrink-0">
                            <Clock className="w-3.5 h-3.5" />
                            <span>{new Date(draft.updatedAt).toLocaleString()}</span>
                          </span>
                          <span className="shrink-0">•</span>
                          <span className="shrink-0">{fileSize}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 shrink-0">
                      <button
                        onClick={(e) => handleDelete(draft.id, e)}
                        className="p-2 rounded hover:bg-surface-4 text-ink-subtle hover:text-red-400 transition-colors cursor-pointer"
                        title="Delete draft"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
