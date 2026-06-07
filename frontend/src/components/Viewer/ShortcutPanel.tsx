import React, { useState } from 'react';
import { usePdfStore } from '@/store/usePdfStore';
import { Keyboard, MousePointer2, Move, Maximize2, Undo2, Redo2, ZoomIn, ZoomOut, ChevronRight, LayoutPanelLeft } from 'lucide-react';

export const ShortcutPanel: React.FC = () => {
  const { undo, redo, zoom, setZoom } = usePdfStore();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const shortcuts = [
    { icon: <Undo2 className="w-3.5 h-3.5" />, label: 'Undo', key: 'Ctrl + Z', action: undo },
    { icon: <Redo2 className="w-3.5 h-3.5" />, label: 'Redo', key: 'Ctrl + Y', action: redo },
    { icon: <ZoomIn className="w-3.5 h-3.5" />, label: 'Zoom In', key: 'Ctrl + +', action: () => setZoom(Math.min(3, zoom + 0.25)) },
    { icon: <ZoomOut className="w-3.5 h-3.5" />, label: 'Zoom Out', key: 'Ctrl + -', action: () => setZoom(Math.max(0.5, zoom - 0.25)) },
    { icon: <Move className="w-3.5 h-3.5" />, label: 'Move (1pt)', key: 'Ctrl + Arrows', action: null },
    { icon: <Move className="w-3.5 h-3.5" />, label: 'Move (10pt)', key: 'Shift + Arrows', action: null },
    { icon: <Maximize2 className="w-3.5 h-3.5" />, label: 'Resize', key: 'Alt + Arrows', action: null },
    { icon: <MousePointer2 className="w-3.5 h-3.5" />, label: 'Select', key: 'Click', action: null },
  ];

  if (isCollapsed) {
    return (
      <div className="w-12 flex flex-col items-center py-6 transition-all duration-300 border-l bg-surface-1 border-hairline">
        <button 
          onClick={() => setIsCollapsed(false)}
          className="p-2 rounded-md mb-6 hover:bg-surface-2 hover:text-primary text-ink-subtle transition-colors"
        >
          <LayoutPanelLeft className="w-5 h-5" />
        </button>
        <div className="flex flex-col space-y-6">
          {shortcuts.map((s, i) => (
             <button 
                key={i} 
                onClick={s.action || undefined}
                className={`p-2 rounded-md transition-colors ${
                  s.action ? 'text-ink-muted hover:bg-surface-2 hover:text-primary cursor-pointer' : 'text-ink-tertiary cursor-default'
                }`}
                title={s.label}
             >
                {s.icon}
             </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="w-64 flex flex-col p-6 transition-all duration-300 border-l relative bg-surface-1 text-ink border-hairline">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 bg-primary/10 rounded-md">
            <Keyboard className="w-4 h-4 text-primary" />
          </div>
          <h3 className="text-[10px] font-bold tracking-eyebrow text-primary uppercase">
            PRO EDITOR KEYS
          </h3>
        </div>
        <button 
          onClick={() => setIsCollapsed(true)}
          className="p-1 hover:bg-surface-2 rounded text-ink-subtle hover:text-ink transition-colors"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      <div className="space-y-6 overflow-y-auto custom-scrollbar pr-1">
        {shortcuts.map((s, i) => (
          <div key={i} className="flex flex-col space-y-2">
            <div className="flex items-center justify-between">
              <button 
                onClick={s.action || undefined}
                className={`flex items-center space-x-2 group focus:outline-none ${s.action ? 'cursor-pointer' : 'cursor-default pointer-events-none'}`}
              >
                <div className={`p-1 rounded transition-colors ${
                  s.action ? 'group-hover:bg-surface-2 group-hover:text-primary text-ink-muted' : 'opacity-50 text-ink-tertiary'
                }`}>
                  {s.icon}
                </div>
                <span className={`text-[11px] font-medium tracking-body transition-colors ${
                  s.action ? 'text-ink-muted group-hover:text-primary' : 'text-ink-tertiary'
                }`}>
                  {s.label}
                </span>
              </button>
            </div>
            <div className="px-3 py-1.5 rounded-md border border-hairline-strong text-[10px] font-mono tracking-normal self-start bg-surface-2 text-ink">
              {s.key}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-auto pt-8 border-t border-hairline text-[9px] font-mono text-ink-tertiary leading-relaxed uppercase">
        FIELDFLOW PDF v1.4 <br/> 
        Precision Field Editing Engine
      </div>
    </div>
  );
};
