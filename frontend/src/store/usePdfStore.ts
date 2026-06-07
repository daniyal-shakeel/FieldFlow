import { create } from 'zustand';
import { PdfSpan, FieldGroup, CustomTextBox, EditsMap, GroupEditsMap } from '../types/pdf';
import { Draft } from '../lib/draftsDb';

export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
}

interface PdfStore {
  // File and metadata
  file: File | null;
  rawFile: ArrayBuffer | null;
  filename: string | null;
  pageCount: number;
  selectedPages: number[];
  
  // Extracted data
  spans: PdfSpan[];
  groups: FieldGroup[];
  
  // State maps
  editsMap: EditsMap;
  groupEditsMap: GroupEditsMap;
  customBoxes: CustomTextBox[];
  spanPositions: Record<string, { x: number; y: number }>; // Track moved existing spans
  spanSizes: Record<string, { width: number; height: number }>; // Track resized spans
  spanAlignments: Record<string, 'left' | 'center' | 'right'>; // Track alignments
  isDraftsModalOpen: boolean; // Track drafts modal open state
  
  // Viewer state
  zoom: number;
  currentPage: number;
  showAllFields: boolean;
  showGroupHighlight: boolean;
  linkedEditMode: boolean;
  
  // Selection
  selectedSpanId: string | null;
  selectedGroupId: string | null;
  selectedCustomBoxId: string | null;
  
  // Page dimensions natively evaluated
  pageDimensions: Record<number, { width: number; height: number }>;

  // Actions
  setFile: (file: File | null, raw: ArrayBuffer | null) => void;
  setExtractedData: (spans: PdfSpan[], groups: FieldGroup[], filename: string, pageCount: number, selectedPages?: number[]) => void;
  
  updateSpanEdit: (spanId: string, text: string) => void;
  updateGroupEdit: (groupId: string, text: string) => void;
  
  updateSpanPosition: (spanId: string, x: number, y: number) => void;
  moveSelectedElement: (dx: number, dy: number) => void;
  resizeSelectedElement: (dw: number, dh: number) => void;
  
  addCustomBox: (box: CustomTextBox) => void;
  updateCustomBox: (id: string, updates: Partial<CustomTextBox>) => void;
  removeCustomBox: (id: string) => void;
  
  setZoom: (zoom: number) => void;
  setCurrentPage: (page: number) => void;
  
  setShowAllFields: (show: boolean) => void;
  setShowGroupHighlight: (show: boolean) => void;
  setLinkedEditMode: (linked: boolean) => void;
  
  setSelectedSpan: (spanId: string | null, groupId?: string | null) => void;
  setSelectedCustomBox: (boxId: string | null) => void;
  
  setPageDimensions: (page: number, width: number, height: number) => void;
  setFilename: (filename: string) => void;
  resetStore: () => void;
  setSpanAlignment: (spanId: string, align: 'left' | 'center' | 'right') => void;
  setDraftsModalOpen: (open: boolean) => void;
  loadDraft: (draft: Draft) => void;
  
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  showRatingToast: boolean;
  setShowRatingToast: (show: boolean) => void;


  toasts: Toast[];
  addToast: (message: string, type?: 'success' | 'error' | 'warning' | 'info', duration?: number) => void;
  removeToast: (id: string) => void;

  // History / Undo-Redo
  past: StateSnapshot[];
  future: StateSnapshot[];
  undo: () => void;
  redo: () => void;
  takeSnapshot: () => void;
}

interface StateSnapshot {
  editsMap: EditsMap;
  groupEditsMap: GroupEditsMap;
  customBoxes: CustomTextBox[];
  spanPositions: Record<string, { x: number; y: number }>;
  spanSizes: Record<string, { width: number; height: number }>;
  spanAlignments: Record<string, 'left' | 'center' | 'right'>;
}

export const usePdfStore = create<PdfStore>((set, get) => ({
  file: null,
  rawFile: null,
  filename: null,
  pageCount: 0,
  selectedPages: [],
  
  spans: [],
  groups: [],
  
  editsMap: {},
  groupEditsMap: {},
  customBoxes: [],
  spanPositions: {},
  spanSizes: {},
  spanAlignments: {},
  isDraftsModalOpen: false,
  
  zoom: 1.5, // Default zoom level
  currentPage: 0,
  showAllFields: true,
  showGroupHighlight: true,
  linkedEditMode: true,
  
  selectedSpanId: null,
  selectedGroupId: null,
  selectedCustomBoxId: null,
  
  pageDimensions: {},

  isDarkMode: true, // Default to Cinematic Dark
  toggleDarkMode: () => set((state) => ({ isDarkMode: !state.isDarkMode })),
  showRatingToast: false,
  setShowRatingToast: (showRatingToast) => set({ showRatingToast }),


  // History State
  past: [],
  future: [],

  takeSnapshot: () => {
    const { editsMap, groupEditsMap, customBoxes, spanPositions, spanSizes, spanAlignments, past } = get();
    const snapshot: StateSnapshot = JSON.parse(JSON.stringify({
      editsMap, groupEditsMap, customBoxes, spanPositions, spanSizes, spanAlignments
    }));
    
    set({
      past: [...past.slice(-49), snapshot], // Keep last 50
      future: [] // Clear redo stack on new action
    });
  },

  undo: () => {
    const { past, future, editsMap, groupEditsMap, customBoxes, spanPositions, spanSizes, spanAlignments } = get();
    if (past.length === 0) return;

    const previous = past[past.length - 1];
    const currentSnapshot: StateSnapshot = JSON.parse(JSON.stringify({
      editsMap, groupEditsMap, customBoxes, spanPositions, spanSizes, spanAlignments
    }));

    set({
      ...previous,
      past: past.slice(0, past.length - 1),
      future: [currentSnapshot, ...future.slice(0, 49)]
    });
  },

  redo: () => {
    const { past, future, editsMap, groupEditsMap, customBoxes, spanPositions, spanSizes, spanAlignments } = get();
    if (future.length === 0) return;

    const next = future[0];
    const currentSnapshot: StateSnapshot = JSON.parse(JSON.stringify({
      editsMap, groupEditsMap, customBoxes, spanPositions, spanSizes, spanAlignments
    }));

    set({
      ...next,
      future: future.slice(1),
      past: [...past.slice(-49), currentSnapshot]
    });
  },

  setFile: (file, rawFile) => set({ 
    file, 
    rawFile, 
    filename: file ? file.name : null,
    pageCount: 0,
    selectedPages: [],
    pageDimensions: {}, // Reset dimensions on new file
    spans: [],
    groups: [],
    customBoxes: [],
    spanPositions: {},
    spanSizes: {},
    spanAlignments: {},
    selectedSpanId: null,
    selectedGroupId: null,
    selectedCustomBoxId: null,
    past: [],
    future: []
  }),
  
  setExtractedData: (spans, groups, filename, pageCount, selectedPages = []) => set({
    spans,
    groups,
    filename,
    pageCount,
    selectedPages,
    editsMap: {},
    groupEditsMap: {},
    spanPositions: {},
    spanSizes: {},
    spanAlignments: {},
    pageDimensions: {}, // Ensure dimensions are fresh for the new data
    selectedSpanId: null,
    selectedGroupId: null,
    selectedCustomBoxId: null,
  }),
  
  resetStore: () => set({
    file: null,
    rawFile: null,
    filename: null,
    pageCount: 0,
    selectedPages: [],
    spans: [],
    groups: [],
    editsMap: {},
    groupEditsMap: {},
    customBoxes: [],
    spanPositions: {},
    spanSizes: {},
    spanAlignments: {},
    selectedSpanId: null,
    selectedGroupId: null,
    selectedCustomBoxId: null,
    pageDimensions: {},
    isDraftsModalOpen: false
  }),
  
  updateSpanEdit: (spanId, text) => set((state) => ({
    editsMap: { ...state.editsMap, [spanId]: text }
  })),
  
  updateGroupEdit: (groupId, text) => set((state) => ({
    groupEditsMap: { ...state.groupEditsMap, [groupId]: text }
  })),

  updateSpanPosition: (spanId, x, y) => set((state) => {
    const span = state.spans.find((s) => s.id === spanId);
    if (!span) return state;
    const next = { ...state.spanPositions };
    const dx = Math.abs(x - span.x);
    const dy = Math.abs(y - span.y);
    // Sub-point jitter from Konva dragEnd must not trigger export "moved" path
    // (redact original bbox but insert at noise coords → wrong cell).
    if (dx < 0.5 && dy < 0.5) {
      delete next[spanId];
    } else {
      next[spanId] = { x, y };
    }
    return { spanPositions: next };
  }),

  moveSelectedElement: (dx, dy) => set((state) => {
    if (state.selectedSpanId) {
      const spanId = state.selectedSpanId;
      const span = state.spans.find(s => s.id === spanId);
      if (!span) return state;

      let targetIds = [spanId];
      if (state.linkedEditMode && state.selectedGroupId) {
        const grp = state.groups.find(g => g.group_id === state.selectedGroupId);
        if (grp?.span_ids?.length) {
          targetIds = [...grp.span_ids];
        }
      }

      const next = { ...state.spanPositions };
      for (const id of targetIds) {
        const s = state.spans.find(x => x.id === id);
        if (!s) continue;
        const cur = next[id] ?? { x: s.x, y: s.y };
        const nx = cur.x + dx;
        const ny = cur.y + dy;
        if (Math.abs(nx - s.x) < 0.5 && Math.abs(ny - s.y) < 0.5) {
          delete next[id];
        } else {
          next[id] = { x: nx, y: ny };
        }
      }
      return { spanPositions: next };
    }
    if (state.selectedCustomBoxId) {
      const boxId = state.selectedCustomBoxId;
      return {
        customBoxes: state.customBoxes.map(b => 
          b.id === boxId ? { ...b, x: b.x + dx, y: b.y + dy } : b
        )
      };
    }
    return state;
  }),

  resizeSelectedElement: (dw, dh) => set((state) => {
    if (state.selectedSpanId) {
      const spanId = state.selectedSpanId;
      const span = state.spans.find(s => s.id === spanId);
      if (!span) return state;

      let targetIds = [spanId];
      if (state.linkedEditMode && state.selectedGroupId) {
        const grp = state.groups.find(g => g.group_id === state.selectedGroupId);
        if (grp?.span_ids?.length) {
          targetIds = [...grp.span_ids];
        }
      }

      const next = { ...state.spanSizes };
      for (const id of targetIds) {
        const s = state.spans.find(x => x.id === id);
        if (!s) continue;
        const cur = next[id] ?? { width: s.width, height: s.height };
        next[id] = {
          width: Math.max(10, cur.width + dw),
          height: Math.max(5, cur.height + dh),
        };
      }
      return { spanSizes: next };
    }
    if (state.selectedCustomBoxId) {
      const boxId = state.selectedCustomBoxId;
      return {
        customBoxes: state.customBoxes.map(b =>
          b.id === boxId
            ? { ...b, width: Math.max(10, b.width + dw), height: Math.max(5, b.height + dh) }
            : b
        )
      };
    }
    return state;
  }),
  
  addCustomBox: (box) => set((state) => ({
    customBoxes: [...state.customBoxes, box],
    selectedCustomBoxId: box.id,
    selectedSpanId: null,
    selectedGroupId: null
  })),
  
  updateCustomBox: (id, updates) => set((state) => ({
    customBoxes: state.customBoxes.map(b => b.id === id ? { ...b, ...updates } : b)
  })),
  
  removeCustomBox: (id) => set((state) => ({
    customBoxes: state.customBoxes.filter(b => b.id !== id),
    selectedCustomBoxId: state.selectedCustomBoxId === id ? null : state.selectedCustomBoxId
  })),
  
  setZoom: (zoom) => set({ zoom }),
  setCurrentPage: (currentPage) => set({ currentPage }),
  
  setShowAllFields: (showAllFields) => set({ showAllFields }),
  setShowGroupHighlight: (showGroupHighlight) => set({ showGroupHighlight }),
  setLinkedEditMode: (linkedEditMode) => set({ linkedEditMode }),
  
  setSelectedSpan: (selectedSpanId, selectedGroupId = null) => set({ 
    selectedSpanId, 
    selectedGroupId,
    selectedCustomBoxId: null 
  }),
  
  setSelectedCustomBox: (selectedCustomBoxId) => set({
    selectedCustomBoxId,
    selectedSpanId: null,
    selectedGroupId: null
  }),
  
  setPageDimensions: (page, width, height) => set((state) => ({
    pageDimensions: {
      ...state.pageDimensions,
      [page]: { width, height }
    }
  })),
  
  setFilename: (filename) => set({ filename }),
  
  setSpanAlignment: (spanId, align) => set((state) => ({
    spanAlignments: { ...state.spanAlignments, [spanId]: align }
  })),
  
  setDraftsModalOpen: (isDraftsModalOpen) => set({ isDraftsModalOpen }),
  
  loadDraft: (draft) => set({
    file: new File([draft.rawFile], draft.filename, { type: 'application/pdf' }),
    rawFile: draft.rawFile,
    filename: draft.filename,
    pageCount: draft.pageCount ?? (draft.spans.length > 0 ? Math.max(...draft.spans.map((s) => s.page)) + 1 : 0),
    selectedPages: draft.selectedPages || [],
    pageDimensions: draft.pageDimensions || {},
    spans: draft.spans,
    groups: draft.groups,
    editsMap: draft.editsMap,
    groupEditsMap: draft.groupEditsMap,
    customBoxes: draft.customBoxes,
    spanPositions: draft.spanPositions,
    spanSizes: draft.spanSizes,
    spanAlignments: draft.spanAlignments || {},
    zoom: draft.zoom,
    currentPage: draft.currentPage,
    selectedSpanId: null,
    selectedGroupId: null,
    selectedCustomBoxId: null,
    past: [],
    future: []
  }),
  
  toasts: [],
  addToast: (message, type = 'info', duration = 3000) => {
    const id = Math.random().toString(36).substring(2, 9);
    set((state) => ({
      toasts: [...state.toasts, { id, message, type, duration }]
    }));
    setTimeout(() => {
      get().removeToast(id);
    }, duration);
  },
  removeToast: (id) => set((state) => ({
    toasts: state.toasts.filter((t) => t.id !== id)
  })),
}));
