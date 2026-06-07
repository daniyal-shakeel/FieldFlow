import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { 
  PdfSpan, 
  FieldGroup, 
  EditsMap, 
  GroupEditsMap, 
  CustomTextBox 
} from '../types/pdf';
import { pyMuPDFToPdfLibCoords, calculateFitFontSize, unpackColorInt } from './coordinateUtils';

/**
 * Export the modified PDF using pdf-lib
 * This uses an overlay approach: we draw a white bounding box over the original text,
 * then draw the new text on top using standard fonts.
 */
export async function exportModifiedPdf(
  originalPdfBytes: ArrayBuffer,
  spans: PdfSpan[],
  groups: FieldGroup[],
  editsMap: EditsMap,
  groupEditsMap: GroupEditsMap,
  customBoxes: CustomTextBox[],
  pageDimensions: Record<number, { width: number; height: number }>,
  spanPositions: Record<string, { x: number; y: number }>
): Promise<Uint8Array> {
  
  // 1. Load the original document
  const pdfDoc = await PDFDocument.load(originalPdfBytes);
  
  // 2. Map spans to groups for easy lookup
  const spanToGroupMap = new Map<string, string>();
  groups.forEach(g => {
    g.span_ids.forEach(sid => spanToGroupMap.set(sid, g.group_id));
  });

  // Embed standard fonts we might use
  const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const timesRoman = await pdfDoc.embedFont(StandardFonts.TimesRoman);
  const courier = await pdfDoc.embedFont(StandardFonts.Courier);

  // 3. Apply edits and movements
  for (const span of spans) {
    const groupId = spanToGroupMap.get(span.id);
    const hasPositionChange = spanPositions[span.id] !== undefined;
    
    let newText = span.text;
    let hasTextChange = false;

    if (editsMap[span.id] !== undefined && editsMap[span.id] !== span.text) {
      newText = editsMap[span.id];
      hasTextChange = true;
    } else if (groupId && groupEditsMap[groupId] !== undefined && groupEditsMap[groupId] !== span.text) {
      newText = groupEditsMap[groupId];
      hasTextChange = true;
    }

    if (!hasPositionChange && !hasTextChange) continue;

    const page = pdfDoc.getPage(span.page);
    const pageHeightPts = pageDimensions[span.page]?.height || page.getHeight();
    const pos = spanPositions[span.id] || { x: span.x, y: span.y };

    // 1. Blank out ORIGINAL position
    const oldCoords = pyMuPDFToPdfLibCoords(span.x, span.y, span.width, span.height, pageHeightPts);
    page.drawRectangle({
      x: oldCoords.x - 1,
      y: oldCoords.y - 1,
      width: oldCoords.width + 2,
      height: oldCoords.height + 2,
      color: rgb(1, 1, 1),
    });

    // 2. Convert new coordinates
    const { x, y, width, height } = pyMuPDFToPdfLibCoords(
      pos.x, pos.y, span.width, span.height, pageHeightPts
    );

    // Determine font
    let fontToUse = helveticaFont;
    const lowerFont = span.font.toLowerCase();
    if (lowerFont.includes('times')) fontToUse = timesRoman;
    else if (lowerFont.includes('courier')) fontToUse = courier;
    else if (lowerFont.includes('bold')) fontToUse = helveticaBold;

    // Calculate font size that fits
    const fitSize = calculateFitFontSize(newText, width, span.size);

    // Extract color
    const colorInt = span.color;
    const r = ((colorInt >> 16) & 0xFF) / 255;
    const g = ((colorInt >> 8) & 0xFF) / 255;
    const b = (colorInt & 0xFF) / 255;

    // Draw the new text at the new position
    page.drawText(newText, {
      x: x,
      y: y + height * 0.12, 
      size: fitSize,
      font: fontToUse,
      color: rgb(r, g, b),
    });
  }

  // 4. Apply Custom Boxes
  for (const box of customBoxes) {
    const page = pdfDoc.getPage(box.page);
    const pageHeightPts = pageDimensions[box.page]?.height || page.getHeight();

    // Box coords are stored in PyMuPDF-like pts (top-left) 
    const { x, y, width, height } = pyMuPDFToPdfLibCoords(
      box.x, box.y, box.width, box.height, pageHeightPts
    );

    if (box.bgPatch) {
      page.drawRectangle({
        x: x,
        y: y,
        width: width,
        height: height,
        color: rgb(1, 1, 1),
      });
    }

    // Default black for custom boxes
    page.drawText(box.text || '', {
      x: x + 2,
      y: y + height * 0.12, // baseline
      size: box.fontSize,
      font: helveticaFont,
      color: rgb(0, 0, 0),
    });
  }

  // 5. Serialize and return
  const pdfBytes = await pdfDoc.save();
  return pdfBytes;
}
