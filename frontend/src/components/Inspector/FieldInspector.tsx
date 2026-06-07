import React, { useMemo, useState, useEffect, useRef } from 'react';
import { usePdfStore } from '@/store/usePdfStore';

export const FieldInspector: React.FC = () => {
  const spans = usePdfStore(state => state.spans);
  const groups = usePdfStore(state => state.groups);
  const editsMap = usePdfStore(state => state.editsMap);
  const groupEditsMap = usePdfStore(state => state.groupEditsMap);
  const selectedSpanId = usePdfStore(state => state.selectedSpanId);
  const selectedGroupId = usePdfStore(state => state.selectedGroupId);
  const selectedCustomBoxId = usePdfStore(state => state.selectedCustomBoxId);
  const updateSpanEdit = usePdfStore(state => state.updateSpanEdit);
  const updateGroupEdit = usePdfStore(state => state.updateGroupEdit);
  const linkedEditMode = usePdfStore(state => state.linkedEditMode);
  const setLinkedEditMode = usePdfStore(state => state.setLinkedEditMode);
  const customBoxes = usePdfStore(state => state.customBoxes);
  const updateCustomBox = usePdfStore(state => state.updateCustomBox);
  const removeCustomBox = usePdfStore(state => state.removeCustomBox);
  const isDarkMode = usePdfStore(state => state.isDarkMode);

  const activeSpan = useMemo(() => spans.find(s => s.id === selectedSpanId), [spans, selectedSpanId]);
  const activeGroup = useMemo(() => groups.find(g => g.group_id === selectedGroupId), [groups, selectedGroupId]);
  const activeCustomBox = useMemo(() => customBoxes.find(b => b.id === selectedCustomBoxId), [customBoxes, selectedCustomBoxId]);

  // Compute the current store value for the selected element
  const activeValue = useMemo(() => {
    if (activeCustomBox) {
      return activeCustomBox.text || '';
    }
    if (activeSpan) {
      if (activeGroup && linkedEditMode) {
        if (groupEditsMap[activeGroup.group_id] !== undefined) {
          return groupEditsMap[activeGroup.group_id];
        }
        return activeGroup.normalized_text || activeSpan.text;
      } else {
        if (editsMap[activeSpan.id] !== undefined) {
          return editsMap[activeSpan.id];
        }
        return activeSpan.text;
      }
    }
    return '';
  }, [activeSpan, activeGroup, activeCustomBox, editsMap, groupEditsMap, linkedEditMode]);

  // Compute if the selected element has active edits
  const hasEdit = useMemo(() => {
    if (activeCustomBox) return false;
    if (activeSpan) {
      if (activeGroup && linkedEditMode) {
        return groupEditsMap[activeGroup.group_id] !== undefined;
      }
      return editsMap[activeSpan.id] !== undefined;
    }
    return false;
  }, [activeSpan, activeGroup, activeCustomBox, editsMap, groupEditsMap, linkedEditMode]);

  // Local state for smooth typing
  const [localText, setLocalText] = useState(activeValue);
  const [prevActiveValue, setPrevActiveValue] = useState(activeValue);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Sync state if activeValue changes (due to selection change or history undo/redo)
  if (activeValue !== prevActiveValue) {
    setPrevActiveValue(activeValue);
    setLocalText(activeValue);
  }

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []);

  const handleTextChange = (val: string) => {
    setLocalText(val);

    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    debounceTimeoutRef.current = setTimeout(() => {
      if (activeCustomBox) {
        updateCustomBox(activeCustomBox.id, { text: val });
      } else if (activeSpan) {
        if (linkedEditMode && activeGroup) {
          updateGroupEdit(activeGroup.group_id, val);
        } else {
          updateSpanEdit(activeSpan.id, val);
        }
      }
    }, 150);
  };

  const handleBlur = () => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
    if (activeCustomBox) {
      updateCustomBox(activeCustomBox.id, { text: localText });
    } else if (activeSpan) {
      if (linkedEditMode && activeGroup) {
        updateGroupEdit(activeGroup.group_id, localText);
      } else {
        updateSpanEdit(activeSpan.id, localText);
      }
    }
  };

  const handleClearEdit = () => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
    
    if (activeSpan) {
      if (linkedEditMode && activeGroup) {
        updateGroupEdit(activeGroup.group_id, activeGroup.normalized_text);
        setLocalText(activeGroup.normalized_text);
      } else {
        updateSpanEdit(activeSpan.id, activeSpan.text);
        setLocalText(activeSpan.text);
      }
    }
  };

  if (!activeSpan && !activeCustomBox) {
    return (
      <div className="w-80 border-l border-hairline h-full p-6 flex flex-col pt-12 items-center text-center bg-surface-1 text-ink-muted">
        <div className="w-12 h-12 rounded-lg flex items-center justify-center mb-4 bg-surface-2 border border-hairline text-ink-subtle">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
          </svg>
        </div>
        <p className="text-xs font-semibold text-ink tracking-tight uppercase">No Element Selected</p>
        <p className="text-[11px] text-ink-subtle mt-2 w-48 leading-relaxed">Click on a highlighted field in the PDF to edit it.</p>
      </div>
    );
  }

  // --- Render Custom Box Inspector ---
  if (activeCustomBox) {
    return (
      <div className="w-80 border-l border-hairline h-full flex flex-col overflow-y-auto bg-surface-1">
        <div className="p-4 border-b border-hairline flex justify-between items-center bg-surface-1">
          <h3 className="text-xs font-semibold tracking-eyebrow uppercase flex items-center text-ink">
            <span className="w-2 h-2 rounded-full bg-semantic-success mr-2"></span> Custom Text
          </h3>
          <button 
             onClick={() => removeCustomBox(activeCustomBox.id)}
             className="text-red-400 text-xs font-semibold hover:underline cursor-pointer"
          >
            Delete
          </button>
        </div>
        
        <div className="p-5 space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-semibold uppercase tracking-wider text-ink-subtle">Text Content</label>
            <textarea
              className="w-full text-xs rounded-md shadow-sm focus:ring-1 focus:ring-primary-focus focus:border-primary focus:outline-none p-2 border border-hairline bg-surface-2 text-ink"
              rows={4}
              value={localText}
              onChange={(e) => handleTextChange(e.target.value)}
              onBlur={handleBlur}
              placeholder="Enter text..."
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-[10px] font-semibold uppercase tracking-wider text-ink-subtle">Font Size</label>
            <input 
              type="number" 
              className="w-full text-xs rounded-md shadow-sm p-2 border border-hairline bg-surface-2 text-ink focus:ring-1 focus:ring-primary-focus focus:border-primary focus:outline-none"
              value={activeCustomBox.fontSize}
              onChange={(e) => updateCustomBox(activeCustomBox.id, { fontSize: Number(e.target.value) || 12 })}
            />
          </div>

          <div className="space-y-2">
            <label className="flex items-center space-x-2 text-xs font-medium cursor-pointer text-ink-muted select-none">
              <div className="relative flex items-center shrink-0">
                <input 
                  type="checkbox" 
                  checked={activeCustomBox.bgPatch}
                  onChange={(e) => updateCustomBox(activeCustomBox.id, { bgPatch: e.target.checked })}
                  className="peer appearance-none w-4.5 h-4.5 border rounded border-hairline bg-surface-2 checked:bg-primary checked:border-primary transition-all cursor-pointer"
                />
                <svg className="absolute w-4.5 h-4.5 p-1 text-white pointer-events-none opacity-0 peer-checked:opacity-100 transition-opacity" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              </div>
              <span>Solid white background</span>
            </label>
            <p className="text-[10px] text-ink-subtle ml-6">Helps cover underlying PDF text</p>
          </div>
        </div>
      </div>
    );
  }

  // --- Render Span Inspector ---
  return (
    <div className="w-80 border-l border-hairline h-full flex flex-col overflow-y-auto bg-surface-1 text-ink">
      <div className="p-4 border-b border-hairline bg-surface-1">
        <h3 className="text-xs font-semibold tracking-eyebrow uppercase flex items-center text-ink">
          <span className="w-2 h-2 rounded-full bg-primary mr-2"></span> PDF Field
        </h3>
        <p className="text-[10px] mt-1.5 uppercase font-semibold text-ink-subtle">
          {activeSpan!.field_type.replace('probable_', '').replace('_', ' ')}
        </p>
      </div>

      <div className="p-5 flex-1 space-y-6">
        {/* Value Edit */}
        <div className="space-y-2">
          <div className="flex justify-between items-end">
            <label className="text-[10px] font-semibold uppercase tracking-wider text-ink-subtle">Field Value</label>
            {hasEdit && (
              <button 
                onClick={handleClearEdit}
                className="text-[10px] text-red-400 hover:text-red-300 hover:underline animate-in fade-in duration-200 cursor-pointer"
              >
                Reset to Original
              </button>
            )}
          </div>
          <textarea
            className={`w-full text-xs rounded-md shadow-sm focus:ring-1 focus:ring-primary-focus focus:border-primary focus:outline-none p-2 border ${
              hasEdit ? 'border-primary bg-surface-2 text-ink' : 'border-hairline bg-surface-2 text-ink-muted'
            }`}
            rows={3}
            value={localText}
            onChange={(e) => handleTextChange(e.target.value)}
            onBlur={handleBlur}
          />
        </div>

        {/* Linking / Grouping */}
        {activeGroup && (
          <div className="p-4 rounded-md border border-hairline bg-surface-2 space-y-3">
            <div className="flex items-center space-x-2">
              <svg className="w-4 h-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
              <h4 className="text-xs font-semibold text-ink uppercase tracking-tight">Linked Field</h4>
            </div>
            <p className="text-[11px] text-ink-muted leading-relaxed">
              This field appears <strong>{activeGroup.span_ids.length} times</strong> in the document.
            </p>
            
            <label className="flex items-center space-x-2 text-xs font-medium cursor-pointer pt-1 text-ink-muted select-none">
              <div className="relative flex items-center shrink-0">
                <input 
                  type="checkbox" 
                  checked={linkedEditMode}
                  onChange={(e) => setLinkedEditMode(e.target.checked)}
                  className="peer appearance-none w-4.5 h-4.5 border rounded border-hairline bg-surface-2 checked:bg-primary checked:border-primary transition-all cursor-pointer"
                />
                <svg className="absolute w-4.5 h-4.5 p-1 text-white pointer-events-none opacity-0 peer-checked:opacity-100 transition-opacity" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              </div>
              <span>Update all {activeGroup.span_ids.length} copies</span>
            </label>
          </div>
        )}

        <hr className="border-hairline" />

        {/* Read-only metadata */}
        <div className="space-y-3">
           <h4 className="text-[10px] font-semibold uppercase tracking-wider text-ink-subtle">Metadata</h4>
           
           <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="block text-[10px] mb-1 text-ink-subtle">Font</span>
                <span className="block text-xs truncate text-ink font-medium" title={activeSpan!.font}>{activeSpan!.font}</span>
              </div>
              <div>
                <span className="block text-[10px] mb-1 text-ink-subtle">Size</span>
                <span className="block text-xs text-ink font-medium">{activeSpan!.size.toFixed(1)} pt</span>
              </div>
              <div>
                <span className="block text-[10px] mb-1 text-ink-subtle">Box Width</span>
                <span className="block text-xs text-ink font-medium">{activeSpan!.width.toFixed(1)} pt</span>
              </div>
           </div>
        </div>

      </div>
    </div>
  );
};

