"""
PDF export service using PyMuPDF True Redaction.

Strategy:
  1. For each edited/moved field: add redaction annotation with fill=False
     (preserves background graphics like colored bars).
  2. Burn in all redactions per page (removes ONLY text objects).
  3. Insert replacement text with EXACT font weight, style, and color.

PyMuPDF Base-14 font short names:
  helv = Helvetica           heit = Helvetica-Oblique
  hebo = Helvetica-Bold      hebi = Helvetica-BoldOblique
  tiro = Times-Roman         tiit = Times-Italic
  tibo = Times-Bold          tibi = Times-BoldItalic
  cour = Courier             coit = Courier-Oblique
  cobo = Courier-Bold        cobi = Courier-BoldOblique
"""
from __future__ import annotations

import fitz
from schemas.pdf import ExportRequest, PdfSpan, CustomTextBox


# Ignore sub-point noise: treating tiny spanPositions deltas as "moved" redacted the
# real cell but inserted at near-garbage coords (especially on multi-copy PDFs).
_MOVE_EPSILON_PT = 0.5


def _effective_move(span: PdfSpan, pos_update: dict | None) -> bool:
    if not pos_update:
        return False
    try:
        nx = float(pos_update["x"])
        ny = float(pos_update["y"])
    except (KeyError, TypeError, ValueError):
        return False
    return abs(nx - span.x) > _MOVE_EPSILON_PT or abs(ny - span.y) > _MOVE_EPSILON_PT


def _eff_metrics(span: PdfSpan, size_update: dict | None) -> tuple[float, float]:
    if not size_update:
        return span.width, span.height
    w = float(size_update.get("width", span.width))
    h = float(size_update.get("height", span.height))
    return w, h


def _baseline_from_box_top(target_y: float, eff_height: float, font_name: str, fontsize: float) -> float:
    """Fallback baseline when textbox fit fails (insert_text anchor)."""
    try:
        fz = fitz.Font(fontname=font_name)
        return target_y + eff_height + fz.descender * fontsize
    except Exception:
        return target_y + fontsize * 0.85


def _calculate_fallback_origin(rect: fitz.Rect, font_name: str, fontsize: float, rotate: int) -> fitz.Point:
    try:
        fz = fitz.Font(fontname=font_name)
        asc = fz.ascender
        desc = fz.descender
    except Exception:
        asc = 0.8
        desc = -0.2
        
    rotate = int(rotate) % 360
    if rotate == 90:
        return fitz.Point(rect.x0 + asc * fontsize, rect.y1)
    elif rotate == 180:
        return fitz.Point(rect.x1, rect.y1 + desc * fontsize)
    elif rotate == 270:
        return fitz.Point(rect.x1 + desc * fontsize, rect.y0)
    else: # 0
        return fitz.Point(rect.x0, rect.y0 + asc * fontsize)


def _span_insert_rect(
    span: PdfSpan,
    prect: fitz.Rect,
    is_moved: bool,
    pos_update: dict | None,
    eff_w: float,
    eff_h: float,
) -> fitz.Rect:
    """
    Absolute page rect for replacement text — same origin as redaction (bbox + page.rect),
    optionally shifted/resized when the user moved/resized the span in the editor.
    """
    if is_moved and pos_update:
        try:
            x0 = float(pos_update["x"]) + prect.x0
            y0 = float(pos_update["y"]) + prect.y0
        except (KeyError, TypeError, ValueError):
            x0 = span.bbox.x0 + prect.x0
            y0 = span.bbox.y0 + prect.y0
    else:
        x0 = span.bbox.x0 + prect.x0
        y0 = span.bbox.y0 + prect.y0
    return fitz.Rect(x0, y0, x0 + max(eff_w, 0.5), y0 + max(eff_h, 0.5))


def _insert_replacement_text(
    page: fitz.Page,
    insert_rect: fitz.Rect,
    final_text: str,
    span: PdfSpan,
    font_name: str,
    color: tuple,
    text_rotation: int,
) -> None:
    """
    Prefer ``insert_textbox`` so PyMuPDF places the first line using the same rect geometry
    as extraction/redaction (ascender-aware). Manual ``insert_text`` baseline math was
    easy to misalign vs. the original font metrics on real PDFs.
    """
    if not (final_text or "").strip():
        return
    rotate = int(text_rotation) % 360
    if rotate not in (0, 90, 180, 270):
        rotate = 0
    rc = page.insert_textbox(
        insert_rect,
        final_text,
        fontname=font_name,
        fontsize=span.size,
        color=color,
        align=0,
        rotate=int(rotate),
    )
    if rc < 0:
        target_x, target_y = insert_rect.x0, insert_rect.y0
        baseline_y = _baseline_from_box_top(target_y, insert_rect.height, font_name, span.size)
        page.insert_text(
            fitz.Point(target_x, baseline_y),
            final_text,
            fontsize=span.size,
            fontname=font_name,
            color=color,
            rotate=int(rotate),
        )


def _get_font_name(font: str, flags: int) -> str:
    """
    Map PyMuPDF font name + flags → correct Base-14 short name.

    PyMuPDF span flags:
      bit 0 (1)  = superscript
      bit 1 (2)  = italic
      bit 2 (4)  = serif (often inaccurate for embedded fonts)
      bit 3 (8)  = monospaced
      bit 4 (16) = bold
    """
    lf = font.lower()

    is_bold = bool(flags & 16) or "bold" in lf or "black" in lf or "heavy" in lf
    is_italic = bool(flags & 2) or "italic" in lf or "oblique" in lf

    # --- Courier / Monospaced ---
    if "courier" in lf or "mono" in lf or bool(flags & 8):
        if is_bold and is_italic:
            return "cobi"
        if is_bold:
            return "cobo"
        if is_italic:
            return "coit"
        return "cour"

    # --- Times / Serif ---
    if "times" in lf or "georgia" in lf or "garamond" in lf or ("serif" in lf and "sans" not in lf):
        if is_bold and is_italic:
            return "tibi"
        if is_bold:
            return "tibo"
        if is_italic:
            return "tiit"
        return "tiro"

    # --- Helvetica / Sans-serif (default) ---
    if is_bold and is_italic:
        return "hebi"
    if is_bold:
        return "hebo"
    if is_italic:
        return "heit"
    return "helv"


def _unpack_color(color_int: int) -> tuple:
    """Unpack packed sRGB int → (r, g, b) floats 0.0–1.0."""
    r = ((color_int >> 16) & 0xFF) / 255.0
    g = ((color_int >> 8) & 0xFF) / 255.0
    b = (color_int & 0xFF) / 255.0
    return (r, g, b)


def export_redacted_pdf(file_bytes: bytes, edits: ExportRequest) -> bytes:
    """
    True Redaction export:
    1. Collect all edits per page.
    2. Add redaction annotations with fill=False (preserves background colors).
    3. Apply all redactions at once per page (removes text objects only).
    4. Insert replacement text with correct font, weight, and color.
    """
    doc = fitz.open(stream=file_bytes, filetype="pdf")

    # Build span → group lookup
    span_to_group: dict[str, str] = {}
    for group in edits.groups:
        for sid in group.span_ids:
            span_to_group[sid] = group.group_id

    # ── Phase 1: Collect edits grouped by page (dedupe by span.id — last wins) ──
    page_edits: dict[int, dict[str, dict]] = {}

    apply_group = edits.linked_edit_mode

    for span in edits.spans:
        group_id = span_to_group.get(span.id)

        # Per-span first; group map only when "link / update all copies" is enabled client-side
        new_text = edits.editsMap.get(span.id)
        if new_text is None and group_id and apply_group:
            new_text = edits.groupEditsMap.get(group_id)

        pos_update = edits.spanPositions.get(span.id)
        size_update = edits.spanSizes.get(span.id)
        eff_w, eff_h = _eff_metrics(span, size_update)
        is_moved = _effective_move(span, pos_update)
        has_text_change = new_text is not None and new_text != span.text
        is_resized = size_update is not None and (
            abs(eff_w - span.width) > 0.05 or abs(eff_h - span.height) > 0.05
        )

        if not has_text_change and not is_moved and not is_resized:
            continue

        final_text = new_text if new_text is not None else span.text

        page_idx = span.page
        if page_idx not in page_edits:
            page_edits[page_idx] = {}
        page_edits[page_idx][span.id] = {
            "span": span,
            "final_text": final_text,
            "is_moved": is_moved,
            "pos_update": pos_update,
        }

    # ── Phase 2: Process each page ──
    for page_idx, edit_map in page_edits.items():
        edit_list = list(edit_map.values())
        page = doc[page_idx]
        prect = page.rect

        # 2a. Add redaction annotations for ALL edited spans on this page.
        #     fill=False ← CRITICAL: preserves background graphics (colored bars, etc.)
        for edit_info in edit_list:
            span = edit_info["span"]
            redact_rect = fitz.Rect(
                span.bbox.x0 + prect.x0,
                span.bbox.y0 + prect.y0,
                span.bbox.x1 + prect.x0,
                span.bbox.y1 + prect.y0,
            )
            # Use a tight redaction box (0.2 pt padding) to prevent bleeding into adjacent text/lines
            redact_rect = redact_rect + (-0.2, -0.2, 0.2, 0.2)
            
            # Map visual coordinates to unrotated PDF coordinates for redaction
            unrotated_redact_rect = (redact_rect * page.derotation_matrix).normalize()
            page.add_redact_annot(unrotated_redact_rect, fill=False)

        # 2b. Apply all redactions at once.
        #     images=0 → keep images intact
        #     graphics=0 → keep vector graphics intact (background bars, borders)
        #     This only removes text objects under the redacted areas.
        page.apply_redactions(images=fitz.PDF_REDACT_IMAGE_NONE, graphics=0)

        # 2c. Insert replacement text with precise font, weight, and color.
        for edit_info in edit_list:
            span = edit_info["span"]
            final_text = edit_info["final_text"]
            is_moved = edit_info["is_moved"]
            pos_update = edit_info["pos_update"]
            
            font_name = _get_font_name(span.font, span.flags)
            color = _unpack_color(span.color)
            text_rotation = int(span.text_rotation) if span.text_rotation in (0, 90, 180, 270) else 0

            # Determine unrotated baseline starting point for pixel-perfect alignment
            if span.origin_x is not None and span.origin_y is not None:
                ox = span.origin_x
                oy = span.origin_y
                if is_moved and pos_update:
                    ox += float(pos_update["x"]) - span.x
                    oy += float(pos_update["y"]) - span.y
                visual_origin = fitz.Point(ox + prect.x0, oy + prect.y0)
                unrotated_origin = visual_origin * page.derotation_matrix
            else:
                # Fallback baseline calculation using visual bbox (accounting for text rotation)
                size_update = edits.spanSizes.get(span.id)
                eff_w, eff_h = _eff_metrics(span, size_update)
                insert_rect = _span_insert_rect(span, prect, is_moved, pos_update, eff_w, eff_h)
                unrotated_insert_rect = (insert_rect * page.derotation_matrix).normalize()
                unrotated_origin = _calculate_fallback_origin(unrotated_insert_rect, font_name, span.size, text_rotation)

            # Get align code from edits: 0=left, 1=center, 2=right
            align_val = 0
            align_str = edits.spanAlignments.get(span.id, "left")
            if align_str == "center":
                align_val = 1
            elif align_str == "right":
                align_val = 2

            if align_val != 0:
                # Calculate rect for textbox fit if we need alignment (center/right)
                size_update = edits.spanSizes.get(span.id)
                eff_w, eff_h = _eff_metrics(span, size_update)
                insert_rect = _span_insert_rect(span, prect, is_moved, pos_update, eff_w, eff_h)
                unrotated_insert_rect = (insert_rect * page.derotation_matrix).normalize()
                
                try:
                    page.insert_textbox(
                        unrotated_insert_rect,
                        final_text,
                        fontname=font_name,
                        fontsize=span.size,
                        color=color,
                        align=align_val,
                        rotate=text_rotation,
                    )
                except Exception:
                    page.insert_textbox(
                        unrotated_insert_rect,
                        final_text,
                        fontname="helv",
                        fontsize=span.size,
                        color=color,
                        align=align_val,
                        rotate=text_rotation,
                    )
            else:
                # Default left alignment: use insert_text for pixel-perfect position
                try:
                    page.insert_text(
                        unrotated_origin,
                        final_text,
                        fontsize=span.size,
                        fontname=font_name,
                        color=color,
                        rotate=text_rotation,
                    )
                except Exception:
                    page.insert_text(
                        unrotated_origin,
                        final_text,
                        fontsize=span.size,
                        fontname="helv",
                        color=color,
                        rotate=text_rotation,
                    )

    # ── Phase 3: Custom Text Boxes ──
    custom_by_page: dict[int, list[CustomTextBox]] = {}
    for box in edits.customBoxes:
        if box.page not in custom_by_page:
            custom_by_page[box.page] = []
        custom_by_page[box.page].append(box)

    for page_idx, boxes in custom_by_page.items():
        page = doc[page_idx]
        prect = page.rect

        has_redactions = False
        for box in boxes:
            if box.bgPatch:
                abs_x = box.x + prect.x0
                abs_y = box.y + prect.y0
                rect = fitz.Rect(abs_x, abs_y, abs_x + box.width, abs_y + box.height)
                # Map visual coordinates to unrotated PDF coordinates
                unrotated_rect = (rect * page.derotation_matrix).normalize()
                page.add_redact_annot(unrotated_rect, fill=(1, 1, 1))  # Custom boxes DO use white fill
                has_redactions = True

        if has_redactions:
            page.apply_redactions(images=fitz.PDF_REDACT_IMAGE_NONE, graphics=0)

        for box in boxes:
            if not box.text:
                continue
            abs_x = box.x + prect.x0
            abs_y = box.y + prect.y0
            rect = fitz.Rect(abs_x, abs_y, abs_x + box.width, abs_y + box.height)
            # Map visual coordinates to unrotated PDF coordinates
            unrotated_rect = (rect * page.derotation_matrix).normalize()

            f_name = "helv"
            fl = box.fontFamily.lower()
            if "serif" in fl and "sans" not in fl:
                f_name = "tiro"
            elif "mono" in fl or "courier" in fl:
                f_name = "cour"

            color = (0.0, 0.0, 0.0)
            color_hex = box.color.lstrip("#")
            if len(color_hex) == 6:
                color = (
                    int(color_hex[0:2], 16) / 255.0,
                    int(color_hex[2:4], 16) / 255.0,
                    int(color_hex[4:6], 16) / 255.0,
                )

            # Insert textbox with proper rotation to appear horizontal in viewer
            rot_val = (360 - page.rotation) % 360
            rc = page.insert_textbox(
                unrotated_rect,
                box.text,
                fontname=f_name,
                fontsize=box.fontSize,
                color=color,
                align=0,
                rotate=rot_val,
            )
            if rc < 0:
                # Fallback to insert_text if textbox fit fails
                baseline_y = unrotated_rect.y0 + box.fontSize * 0.85
                page.insert_text(
                    fitz.Point(unrotated_rect.x0 + 2, baseline_y),
                    box.text,
                    fontsize=box.fontSize,
                    fontname=f_name,
                    color=color,
                    rotate=rot_val,
                )

    # ── Save flattened PDF (appearance streams, full garbage collection) ──
    result = doc.write(
        garbage=4,
        clean=True,
        deflate=True,
        incremental=False,
        appearance=True,
    )
    doc.close()
    return result
