import React, { useMemo } from 'react';
import { Stage, Layer, Rect, Text, Group, Line } from 'react-konva';
import { usePdfStore } from '@/store/usePdfStore';
import { pyMuPDFToBrowserCoords } from '@/lib/coordinateUtils';
import { AlignLeft, AlignCenter, AlignRight } from 'lucide-react';

interface KonvaOverlayProps {
  pageNumber: number; // 0-indexed
  zoom: number;
}

const colorCache = new Map<string, string>();

export const KonvaOverlay: React.FC<KonvaOverlayProps> = ({ pageNumber, zoom }) => {
  const { 
    spans, 
    groups, 
    customBoxes,
    editsMap,
    groupEditsMap,
    spanPositions,
    spanSizes,
    spanAlignments,
    showAllFields,
    showGroupHighlight,
    selectedSpanId,
    selectedGroupId,
    selectedCustomBoxId,
    setSelectedSpan,
    updateCustomBox,
    updateSpanEdit,
    updateGroupEdit,
    updateSpanPosition,
    setSelectedCustomBox,
    pageDimensions,
    linkedEditMode,
    takeSnapshot,
    setSpanAlignment
  } = usePdfStore();

  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [editingValue, setEditingValue] = React.useState('');
  const [hoveredId, setHoveredId] = React.useState<string | null>(null);

  const dims = pageDimensions[pageNumber];
  const canvasWidth = dims ? dims.width * zoom : 0;
  const canvasHeight = dims ? dims.height * zoom : 0;
  


  // Helper to convert PyMuPDF int color to hex
  const intToHex = (colorInt: number) => {
    const r = (colorInt >> 16) & 0xFF;
    const g = (colorInt >> 8) & 0xFF;
    const b = colorInt & 0xFF;
    return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
  };

  // Helper to get Konva fontStyle from PyMuPDF flags and fontName
  const getFontStyle = (flags: number, fontName: string) => {
    const lf = fontName.toLowerCase();
    const isBold = !!(flags & 16) || lf.includes('bold') || lf.includes('black') || lf.includes('heavy');
    const isItalic = !!(flags & 2) || lf.includes('italic') || lf.includes('oblique');
    if (isBold && isItalic) return 'italic bold';
    if (isBold) return 'bold';
    if (isItalic) return 'italic';
    return 'normal';
  };

  // Helper to get rigorous font family matching the backend
  const getFontFamily = (fontName: string) => {
    const lf = fontName.toLowerCase();
    if (lf.includes('courier') || lf.includes('mono')) return '"Courier New", Courier, monospace';
    // Match strict backend Serif rules
    if (lf.includes('times') || lf.includes('georgia') || lf.includes('garamond') || (lf.includes('serif') && !lf.includes('sans'))) {
      return '"Times New Roman", Times, serif';
    }
    // Default fallback is Sans-Serif
    return 'Arial, Helvetica, sans-serif';
  };

  // Filter items for this page
  const pageSpans = useMemo(() => spans.filter(s => s.page === pageNumber), [spans, pageNumber]);
  const pageCustomBoxes = useMemo(() => customBoxes.filter(b => b.page === pageNumber), [customBoxes, pageNumber]);

  const selectedSpan = useMemo(() => {
    if (!selectedSpanId) return null;
    return pageSpans.find(s => s.id === selectedSpanId);
  }, [pageSpans, selectedSpanId]);

  const selectedSpanCoords = useMemo(() => {
    if (!selectedSpan) return null;
    const pos = spanPositions[selectedSpan.id] || { x: selectedSpan.x, y: selectedSpan.y };
    const size = spanSizes[selectedSpan.id] || { width: selectedSpan.width, height: selectedSpan.height };
    return pyMuPDFToBrowserCoords(pos.x, pos.y, size.width, size.height, zoom);
  }, [selectedSpan, spanPositions, spanSizes, zoom]);

  const selectedElement = useMemo(() => {
    if (selectedSpanId) {
      const span = pageSpans.find(s => s.id === selectedSpanId);
      if (span) {
        const pos = spanPositions[span.id] || { x: span.x, y: span.y };
        const size = spanSizes[span.id] || { width: span.width, height: span.height };
        return {
          x: pos.x,
          y: pos.y,
          width: size.width,
          height: size.height,
          id: span.id,
          type: 'span'
        };
      }
    }
    if (selectedCustomBoxId) {
      const box = pageCustomBoxes.find(b => b.id === selectedCustomBoxId);
      if (box) {
        return {
          x: box.x,
          y: box.y,
          width: box.width,
          height: box.height,
          id: box.id,
          type: 'box'
        };
      }
    }
    return null;
  }, [selectedSpanId, selectedCustomBoxId, pageSpans, pageCustomBoxes, spanPositions, spanSizes]);

  const guides = useMemo(() => {
    if (!selectedElement || !dims) return null;

    const x = selectedElement.x * zoom;
    const y = selectedElement.y * zoom;
    const w = selectedElement.width * zoom;
    const h = selectedElement.height * zoom;
    const centerY = y + h / 2;

    const leftDistPoints = selectedElement.x;
    const rightDistPoints = dims.width - (selectedElement.x + selectedElement.width);

    return {
      centerY,
      leftLine: {
        points: [0, centerY, x, centerY],
        distLabel: `${leftDistPoints.toFixed(1)} pt`,
        labelX: x / 2,
        labelY: centerY - 15,
      },
      rightLine: {
        points: [x + w, centerY, canvasWidth, centerY],
        distLabel: `${rightDistPoints.toFixed(1)} pt`,
        labelX: x + w + (canvasWidth - (x + w)) / 2,
        labelY: centerY - 15,
      }
    };
  }, [selectedElement, dims, zoom, canvasWidth]);



  // Create a lookup for groups by span id to easily color-code linked spans
  const spanGroupMap = useMemo(() => {
    const map = new Map<string, string>();
    groups.forEach(group => {
      group.span_ids.forEach(sid => map.set(sid, group.group_id));
    });
    return map;
  }, [groups]);

  if (!dims) return null;

  const handleSpanClick = (spanId: string) => {
    const groupId = spanGroupMap.get(spanId) || null;
    setSelectedSpan(spanId, groupId);
  };

  const startEditing = (id: string, initialValue: string) => {
    takeSnapshot();
    setEditingId(id);
    setEditingValue(initialValue);
  };

  const finishEditing = () => {
    if (!editingId) return;
    
    const span = spans.find(s => s.id === editingId);
    if (span) {
      if (linkedEditMode) {
        const groupId = spanGroupMap.get(span.id);
        if (groupId) {
          updateGroupEdit(groupId, editingValue);
        } else {
          updateSpanEdit(span.id, editingValue);
        }
      } else {
        updateSpanEdit(span.id, editingValue);
      }
    } else {
      updateCustomBox(editingId, { text: editingValue });
    }
    
    setEditingId(null);
  };

  // Fetch precise background color from PDF.js canvas to make seamless patches
  const getCanvasBg = (spanId: string, x: number, y: number) => {
    if (colorCache.has(spanId)) return colorCache.get(spanId)!;
    try {
      const canvas = document.getElementById(`pdf-page-canvas-${pageNumber}`) as HTMLCanvasElement;
      if (!canvas) return '#ffffff';
      
      // Use willReadFrequently to prevent warnings on high-frequency sampling
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) return '#ffffff';
      
      const dpr = window.devicePixelRatio || 1;
      // Sample slightly above & left to avoid hitting the text itself
      const sampleX = Math.max(0, (x - 2) * dpr);
      const sampleY = Math.max(0, (y - 2) * dpr);
      
      const pixel = ctx.getImageData(sampleX, sampleY, 1, 1).data;
      if (pixel[3] === 0) return '#ffffff'; // Fallback to white if alpha is 0
      
      const color = `rgb(${pixel[0]}, ${pixel[1]}, ${pixel[2]})`;
      colorCache.set(spanId, color);
      return color;
    } catch {
      return '#ffffff';
    }
  };

  return (
    <div className="relative w-full h-full" style={{ width: canvasWidth, height: canvasHeight }}>
      <Stage width={canvasWidth} height={canvasHeight}>
        <Layer>
          {/* KONVA STAGE IS NOW TRANSPARENT TO SHOW PDF CANVAS BEHIND IT */}
          
          {/* Render Spans */}
          {showAllFields && pageSpans.map(span => {
            const groupId = spanGroupMap.get(span.id);
            const isSelected = selectedSpanId === span.id;
            const isGroupHighlighted = showGroupHighlight && groupId && groupId === selectedGroupId && !isSelected;
            
            // Determine the text to show
            let displayValue = span.text;
            if (editsMap[span.id] !== undefined) {
              displayValue = editsMap[span.id];
            } else if (linkedEditMode && groupId && groupEditsMap[groupId] !== undefined) {
              displayValue = groupEditsMap[groupId];
            }
            
            const hasEdit = displayValue !== span.text;
            const pos = spanPositions[span.id] || { x: span.x, y: span.y };
            const size = spanSizes[span.id] || { width: span.width, height: span.height };

            // Convert coordinates using potentially resized dimensions
            const coords = pyMuPDFToBrowserCoords(pos.x, pos.y, size.width, size.height, zoom);
            
            const isHovered = hoveredId === span.id;
            
            // Colors (default border strong enough to read at rest; hover/selected go heavier)
            let strokeColor = 'rgba(138, 143, 152, 0.4)';
            let fillColor = 'transparent';
            
            if (isSelected) {
              strokeColor = '#5e6ad2'; // Neon Blue
              fillColor = 'rgba(94, 106, 210, 0.08)';
            } else if (isHovered) {
              strokeColor = 'rgba(130, 143, 255, 0.8)'; // Semi-neon Blue
            } else if (isGroupHighlighted) {
              strokeColor = '#7a7fad'; // Indigo for linked
              fillColor = 'rgba(122, 127, 173, 0.05)';
            } else if (hasEdit) {
               strokeColor = '#27a644'; // Emerald for edited
            }

            const fontColor = intToHex(span.color);
            const fontWeight = getFontStyle(span.flags, span.font);

            // Fetch adaptive background patch color only when edited or moved
            const patchBg = (hasEdit || spanPositions[span.id])
              ? getCanvasBg(span.id, coords.x, coords.y)
              : 'transparent';

            return (
              <Group 
                key={span.id} 
                x={coords.x} 
                y={coords.y}
                draggable={!editingId}
                onClick={() => handleSpanClick(span.id)}
                onDblClick={() => startEditing(span.id, displayValue)}
                onDragStart={() => takeSnapshot()}
                onDragEnd={(e) => {
                  updateSpanPosition(span.id, e.target.x() / zoom, e.target.y() / zoom);
                }}
                onMouseEnter={() => setHoveredId(span.id)}
                onMouseLeave={() => setHoveredId(null)}
              >
                {/* Adaptive patch to cover original text seamlessly */}
                {(hasEdit || spanPositions[span.id]) && (
                  <Rect
                    width={coords.width}
                    height={coords.height}
                    fill={patchBg}
                    opacity={1}
                  />
                )}
                
                <Rect
                  width={coords.width}
                  height={coords.height}
                  stroke={strokeColor}
                  strokeWidth={isHovered || isSelected ? 3 : 2}
                  dash={isSelected || isHovered ? [] : [4, 3]} // Solid when active
                  fill={fillColor}
                  cornerRadius={3}
                  shadowBlur={isSelected ? 10 : 0}
                  shadowColor="rgba(94, 106, 210, 0.3)"
                  onMouseEnter={(e) => { 
                    const stage = e.target.getStage();
                    if (stage) stage.container().style.cursor = isSelected ? 'move' : 'text'; 
                  }}
                  onMouseLeave={(e) => { 
                    const stage = e.target.getStage();
                    if (stage) stage.container().style.cursor = 'default'; 
                  }}
                />
                
                {/* Overlay the new text */}
                {(hasEdit || spanPositions[span.id]) && (
                  <Text
                    text={editingId === span.id ? '' : displayValue}
                    fontSize={Math.max(span.size * zoom, 8)}
                    fill={fontColor}
                    fontStyle={fontWeight}
                    width={coords.width}
                    height={coords.height}
                    verticalAlign="middle"
                    align={spanAlignments[span.id] || 'left'}
                    fontFamily={getFontFamily(span.font)}
                    padding={2}
                    letterSpacing={(span.letter_spacing || 0) * zoom}
                  />
                )}
              </Group>
            );
          })}

          {/* Render Custom Text Boxes */}
          {pageCustomBoxes.map(box => {
            const isSelected = selectedCustomBoxId === box.id;
            return (
              <Group
                key={box.id}
                x={box.x * zoom}
                y={box.y * zoom}
                draggable={!editingId}
                onClick={() => setSelectedCustomBox(box.id)}
                onDblClick={() => startEditing(box.id, box.text || '')}
                onDragStart={() => takeSnapshot()}
                onDragEnd={(e) => {
                  updateCustomBox(box.id, {
                    x: e.target.x() / zoom,
                    y: e.target.y() / zoom
                  });
                }}
              >
                {box.bgPatch && (
                  <Rect
                    width={box.width * zoom}
                    height={box.height * zoom}
                    fill="white"
                  />
                )}
                <Rect
                  width={box.width * zoom}
                  height={box.height * zoom}
                  stroke={isSelected ? "#5e6ad2" : "#27a644"}
                  strokeWidth={1}
                  dash={[4, 2]}
                />
                <Text
                  text={editingId === box.id ? '' : (box.text || 'Dbl-Click to edit')}
                  fontSize={box.fontSize * zoom}
                  fontFamily={box.fontFamily}
                  fill={box.color}
                  width={box.width * zoom}
                  height={box.height * zoom}
                  padding={2}
                />
              </Group>
            );
          })}

          {guides && (
            <Group>
              <Line
                points={guides.leftLine.points}
                stroke="#5e6ad2"
                strokeWidth={1.5}
                dash={[4, 4]}
              />
              <Text
                text={guides.leftLine.distLabel}
                x={guides.leftLine.labelX - 40}
                y={guides.leftLine.labelY}
                width={80}
                align="center"
                fontSize={10}
                fill="#5e6ad2"
                fontStyle="bold"
              />

              <Line
                points={guides.rightLine.points}
                stroke="#5e6ad2"
                strokeWidth={1.5}
                dash={[4, 4]}
              />
              <Text
                text={guides.rightLine.distLabel}
                x={guides.rightLine.labelX - 40}
                y={guides.rightLine.labelY}
                width={80}
                align="center"
                fontSize={10}
                fill="#5e6ad2"
                fontStyle="bold"
              />
            </Group>
          )}
        </Layer>
      </Stage>

      {/* Inline Editor Overlay */}
      {editingId && (() => {
        const span = spans.find(s => s.id === editingId);
        const box = customBoxes.find(b => b.id === editingId);
        
        if (!span && !box) return null;
        
        const rect = span 
          ? pyMuPDFToBrowserCoords(
              spanPositions[span.id]?.x ?? span.x, 
              spanPositions[span.id]?.y ?? span.y, 
              spanSizes[span.id]?.width ?? span.width, 
              spanSizes[span.id]?.height ?? span.height, 
              zoom
            )
          : { x: box!.x * zoom, y: box!.y * zoom, width: box!.width * zoom, height: box!.height * zoom };

        // Determine best contrast for textarea so text doesn't vanish
        const fontColor = span ? intToHex(span.color) : (box?.color || '#000000');
        let bgStyle = span ? getCanvasBg(span.id, rect.x, rect.y) : 'white';
        const colorStyle = fontColor;
        
        // If the font is pure white but background sampled as white (maybe edge collision), force dark mode editor
        if (fontColor === '#ffffff' && (bgStyle === '#ffffff' || bgStyle === 'rgb(255, 255, 255)')) {
            bgStyle = '#1e293b'; // Slate background for contrast
        }

        return (
          <textarea
            autoFocus
            value={editingValue}
            onChange={(e) => setEditingValue(e.target.value)}
            onBlur={finishEditing}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                finishEditing();
              }
              if (e.key === 'Escape') setEditingId(null);
            }}
            style={{
              position: 'absolute',
              top: rect.y,
              left: rect.x,
              width: rect.width,
              height: Math.max(rect.height, 40),
              fontSize: (span?.size || box?.fontSize || 12) * zoom,
              fontFamily: span ? getFontFamily(span.font) : (box?.fontFamily || 'inherit'),
              fontWeight: span ? getFontStyle(span.flags, span.font) : 'normal',
              color: colorStyle,
              background: bgStyle,
              letterSpacing: span ? `${(span.letter_spacing || 0) * zoom}px` : 'normal',
              padding: '2px',
              border: '1px solid #5e6ad2',
              borderRadius: '6px',
              outline: 'none',
              resize: 'none',
              zIndex: 100,
              boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
            }}
          />
        );
      })()}

      {selectedSpanCoords && editingId !== selectedSpanId && (
        <div
          style={{
            position: 'absolute',
            top: Math.max(4, selectedSpanCoords.y - 44),
            left: Math.max(4, selectedSpanCoords.x + (selectedSpanCoords.width - 120) / 2),
            width: '120px',
            height: '34px',
            zIndex: 100,
          }}
          className="flex items-center justify-around px-1 py-1 rounded-full border border-hairline bg-surface-3/95 backdrop-blur-md shadow-lg"
        >
          <button
            onClick={() => {
              takeSnapshot();
              setSpanAlignment(selectedSpanId!, 'left');
            }}
            className={`p-1.5 rounded-md transition-colors ${
              (spanAlignments[selectedSpanId!] || 'left') === 'left'
                ? 'bg-primary text-ink'
                : 'text-ink-subtle hover:text-ink hover:bg-surface-4'
            }`}
            title="Align Left"
          >
            <AlignLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              takeSnapshot();
              setSpanAlignment(selectedSpanId!, 'center');
            }}
            className={`p-1.5 rounded-md transition-colors ${
              spanAlignments[selectedSpanId!] === 'center'
                ? 'bg-primary text-ink'
                : 'text-ink-subtle hover:text-ink hover:bg-surface-4'
            }`}
            title="Align Center"
          >
            <AlignCenter className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              takeSnapshot();
              setSpanAlignment(selectedSpanId!, 'right');
            }}
            className={`p-1.5 rounded-md transition-colors ${
              spanAlignments[selectedSpanId!] === 'right'
                ? 'bg-primary text-ink'
                : 'text-ink-subtle hover:text-ink hover:bg-surface-4'
            }`}
            title="Align Right"
          >
            <AlignRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};
