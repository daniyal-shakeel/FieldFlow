"""
Span grouping service.
Groups repeated text values across the PDF into FieldGroup objects.
"""
from __future__ import annotations
import re
import uuid
from collections import defaultdict

from schemas.pdf import FieldGroup, GroupResult, PdfSpan
from services.classifier import majority_field_type


# Minimum number of occurrences to form a group
_MIN_GROUP_SIZE = 2

# Minimum text length to be groupable (avoids grouping ":" or "1" etc.)
_MIN_GROUPABLE_LENGTH = 3

# Font-size similarity tolerance in pts
_FONT_SIZE_TOLERANCE = 1.0

# Spans must share roughly the same vertical band (baseline row) to link.
# Without this, the same token (e.g. "Fee") in a table header and elsewhere on
# the page — or OCR junk with the same text — ends up in one group; a linked
# edit then paints replacement text at every span, including wrong columns/rows.
_Y_BAND_TOLERANCE_PT = 5.0


def _normalize_for_grouping(text: str) -> str:
    """Produce a key for grouping: lowercase, collapse whitespace, strip."""
    return re.sub(r"\s+", " ", text).strip().lower()


def _is_groupable(normalized_key: str) -> bool:
    """Decide whether a text value is worth grouping."""
    return len(normalized_key) >= _MIN_GROUPABLE_LENGTH


def _center_y(span: PdfSpan) -> float:
    return 0.5 * (span.bbox.y0 + span.bbox.y1)


def _cluster_spans_by_row(spans: list[PdfSpan], tol: float = _Y_BAND_TOLERANCE_PT) -> list[list[PdfSpan]]:
    """Split spans that share text+size into same-row clusters (sorted by vertical center)."""
    if not spans:
        return []
    ordered = sorted(spans, key=_center_y)
    clusters: list[list[PdfSpan]] = []
    current: list[PdfSpan] = [ordered[0]]
    row_anchor = _center_y(ordered[0])
    for s in ordered[1:]:
        cy = _center_y(s)
        if abs(cy - row_anchor) <= tol:
            current.append(s)
        else:
            clusters.append(current)
            current = [s]
            row_anchor = cy
    clusters.append(current)
    return clusters


def group_spans(spans: list[PdfSpan]) -> GroupResult:
    """
    Group spans that share identical normalized text AND similar font size.
    Returns GroupResult with FieldGroup list and ungrouped span IDs.
    """
    # Step 1: Build buckets by (normalized_text, font_size_bucket)
    # font_size_bucket: round to nearest 0.5 to allow slight variation
    BucketKey = tuple  # (normalized_text, rounded_size)

    buckets: dict[BucketKey, list[PdfSpan]] = defaultdict(list)

    for span in spans:
        key = _normalize_for_grouping(span.text)
        if not _is_groupable(key):
            continue
        # Round font size to nearest integer for bucketing
        size_bucket = round(span.size)
        buckets[(key, size_bucket)].append(span)

    # Step 2: Build groups from buckets with ≥ MIN_GROUP_SIZE spans
    groups: list[FieldGroup] = []
    grouped_span_ids: set[str] = set()

    for (norm_text, _size_bucket), bucket_spans in buckets.items():
        if len(bucket_spans) < _MIN_GROUP_SIZE:
            continue

        for row_spans in _cluster_spans_by_row(bucket_spans):
            if len(row_spans) < _MIN_GROUP_SIZE:
                continue

            ft = majority_field_type([s.field_type for s in row_spans])

            group = FieldGroup(
                group_id=str(uuid.uuid4()),
                normalized_text=norm_text,
                field_type=ft,
                span_ids=[s.id for s in row_spans],
            )
            groups.append(group)
            for s in row_spans:
                grouped_span_ids.add(s.id)

    # Step 3: Collect ungrouped span IDs
    ungrouped = [s.id for s in spans if s.id not in grouped_span_ids]

    return GroupResult(
        groups=groups,
        ungrouped_span_ids=ungrouped,
    )
