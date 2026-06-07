export interface BoundingBox {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

export interface PdfSpan {
  id: string;
  page: number; // 0-indexed
  text: string;
  raw_text: string;
  bbox: BoundingBox;
  x: number;
  y: number;
  width: number;
  height: number;
  origin_x?: number;
  origin_y?: number;
  font: string;
  size: number;
  color: number;
  flags: number;
  field_type: string;
  letter_spacing: number;
  /** 0 | 90 | 180 | 270 — from extraction; export uses for insert_text rotation */
  text_rotation?: number;
}

export interface FieldGroup {
  group_id: string;
  normalized_text: string;
  field_type: string;
  span_ids: string[];
}

export interface PageSize {
  page: number;
  width: number;
  height: number;
}

export interface ExtractionResult {
  filename: string;
  page_count: number;
  page_sizes: PageSize[];
  spans: PdfSpan[];
}

export interface GroupRequest {
  spans: PdfSpan[];
}

export interface GroupResult {
  groups: FieldGroup[];
  ungrouped_span_ids: string[];
}

export interface CustomTextBox {
  id: string;
  page: number;
  x: number;
  y: number;
  width: number;
  height: number;
  text: string;
  fontSize: number;
  fontFamily: string;
  color: string;
  bgPatch: boolean;
}

export interface PageRenderInfo {
  page: number;
  scale: number;
  width: number;
  height: number;
}

// Map from Span ID to its new text value
export type EditsMap = Record<string, string>;

// Map from Group ID to its new text value
export type GroupEditsMap = Record<string, string>;

export interface GroupSummary {
  group_id: string;
  field_type: string;
  normalized_text: string;
  count: number;
}

export interface PreviewMetadata {
  page_count: number;
  page_sizes: PageSize[];
  candidate_count: number;
  group_summary: GroupSummary[];
}
