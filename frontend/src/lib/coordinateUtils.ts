/**
 * Utility functions for coordinate transformations between PyMuPDF, Browser, and pdf-lib
 */

/**
 * PDF.js renders at scale = zoom.
 * Backend span coordinates are normalized to **display space**: same origin and axes as
 * ``page.getViewport({ scale: 1 })`` (top-left, y down), including page ``/Rotate``.
 * They are not raw dict bboxes before rotation correction — see ``extractor._span_bbox_to_display_rect``.
 *
 * pdf-lib uses bottom-left origin (y up); ``pyMuPDFToPdfLibCoords`` converts for that API.
 */

export function pyMuPDFToBrowserCoords(
  pdfX: number,
  pdfY: number,
  pdfWidth: number,
  pdfHeight: number,
  renderScale: number
) {
  // PyMuPDF provides bounding box in points from the top-left corner
  // To display it in the browser, we just multiply by the scale!
  return {
    x: pdfX * renderScale,
    y: pdfY * renderScale,
    width: pdfWidth * renderScale,
    height: pdfHeight * renderScale,
  };
}

export function browserToPyMuPDFCoords(
  browserX: number,
  browserY: number,
  browserWidth: number,
  browserHeight: number,
  renderScale: number
) {
  // Inverse of the above
  return {
    x: browserX / renderScale,
    y: browserY / renderScale,
    width: browserWidth / renderScale,
    height: browserHeight / renderScale,
  };
}

export function pyMuPDFToPdfLibCoords(
  pdfX: number,
  pdfY: number,
  pdfWidth: number,
  pdfHeight: number,
  pageHeightPts: number
) {
  // Convert PyMuPDF's top-left origin to pdf-lib's bottom-left origin
  // In pdf-lib, y=0 is the bottom of the page, so the new Y is from the bottom.
  // We want the Y coordinate of the bottom-left corner of the bounding box.
  
  // y0_top_left = pdfY (top of the rectangle from top edge)
  // y1_top_left = pdfY + pdfHeight (bottom of the rectangle from top edge)
  
  // distance from bottom = pageHeight - y1_top_left
  const pdfLibY = pageHeightPts - (pdfY + pdfHeight);
  
  return {
    x: pdfX,
    y: pdfLibY,
    width: pdfWidth,
    height: pdfHeight,
  };
}

/**
 * Calculate suitable font size to fit text within a box
 */
export function calculateFitFontSize(
  text: string, 
  originalBoxWidth: number, 
  originalFontSize: number,
  ctx?: CanvasRenderingContext2D
): number {
  if (!text) return originalFontSize;
  if (!ctx) {
    // If no context available, do a very rough character count heuristic
    // Assume average char width is 0.5 * font size
    const estimatedWidth = text.length * (originalFontSize * 0.5);
    if (estimatedWidth > originalBoxWidth && originalBoxWidth > 0) {
      return Math.floor(originalFontSize * (originalBoxWidth / estimatedWidth) * 0.95);
    }
    return originalFontSize;
  }
  
  // If we have a canvas context, we can measure accurately
  let currentSize = originalFontSize;
  ctx.font = `${currentSize}px sans-serif`;
  let textWidth = ctx.measureText(text).width;
  
  // Reduce font size until it fits, but don't go below 6pt
  while (textWidth > originalBoxWidth && currentSize > 6) {
    currentSize -= 0.5;
    ctx.font = `${currentSize}px sans-serif`;
    textWidth = ctx.measureText(text).width;
  }
  
  return currentSize;
}

/**
 * Returns a hex color string from PyMuPDF color int
 */
export function unpackColorInt(color: number): string {
  const r = (color >> 16) & 0xFF;
  const g = (color >> 8) & 0xFF;
  const b = color & 0xFF;
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}
