"""
Heuristic field-type classifier for PDF spans.
Returns one of the defined FieldType literals.
"""
from __future__ import annotations
import re

# ---------------------------------------------------------------------------
# Patterns
# ---------------------------------------------------------------------------

# Registration numbers like 2023-CS-001, FA22-BCS-023, L1F21BSCS0123
_REG_NO_PATTERNS = [
    re.compile(r"^\d{4}-[A-Z]{2,6}-\d{1,4}$"),           # 2023-CS-001
    re.compile(r"^[A-Z]{2}\d{2}-[A-Z]{2,6}-\d{3,4}$"),   # FA22-BCS-023
    re.compile(r"^[A-Z]\d[A-Z]\d{2}[A-Z]{2,6}\d{3,5}$"), # L1F21BSCS0036
    re.compile(r"^\d{4}-[A-Z]{2,4}-\d{2,4}-\d{1,3}$"),   # extended format
]

# CGPA: a float between 0.00 and 4.00
_CGPA_PATTERN = re.compile(r"^([0-3]\.\d{1,2}|4\.00?)$")

# Amount: numeric string possibly with commas and optional decimal
_AMOUNT_PATTERN = re.compile(r"^[\d,]+(\.\d{1,2})?$")

# Date patterns
_DATE_PATTERNS = [
    re.compile(r"^\d{1,2}[/-]\d{1,2}[/-]\d{2,4}$"),         # DD/MM/YYYY
    re.compile(r"^\d{1,2}-[A-Za-z]{3}-\d{2,4}$"),            # 01-Jan-2024
    re.compile(r"^[A-Za-z]{3,9}\s+\d{1,2},?\s+\d{4}$"),     # January 1, 2024
    re.compile(r"^\d{4}-\d{2}-\d{2}$"),                       # YYYY-MM-DD
]

# Known program abbreviations
_PROGRAM_KEYWORDS = {
    "bs", "ms", "phd", "bscs", "mscs", "bse", "bsee", "bba", "mba",
    "bsit", "msit", "bsme", "bsce", "bsai", "msai", "msse",
    "bachelor", "master", "doctorate",
}

# Name heuristic: 2+ words, all alphabetic tokens (allow dots/hyphens)
_NAME_TOKEN_PATTERN = re.compile(r"^[A-Za-z][A-Za-z\.\-']*$")


def classify_span(text: str) -> str:
    """
    Given a normalized text value, return a field_type string.
    """
    t = text.strip()
    if not t:
        return "unknown"

    # Registration number
    for pat in _REG_NO_PATTERNS:
        if pat.match(t):
            return "probable_reg_no"

    # CGPA
    if _CGPA_PATTERN.match(t):
        try:
            val = float(t)
            if 0.0 <= val <= 4.0:
                return "probable_cgpa"
        except ValueError:
            pass

    # Date
    for pat in _DATE_PATTERNS:
        if pat.match(t):
            return "probable_date"

    # Amount (pure numeric / comma-separated)
    t_no_comma = t.replace(",", "")
    if _AMOUNT_PATTERN.match(t_no_comma) and len(t_no_comma) >= 2:
        return "probable_amount"

    # Program
    lower = t.lower()
    if lower in _PROGRAM_KEYWORDS:
        return "probable_program"
    # e.g. "BS Computer Science" or "BSCS"
    first_word = lower.split()[0] if " " in lower else lower
    if first_word in _PROGRAM_KEYWORDS:
        return "probable_program"

    # Name: 2+ words, all tokens are alphabetic
    tokens = t.split()
    if len(tokens) >= 2 and all(_NAME_TOKEN_PATTERN.match(tok) for tok in tokens):
        return "probable_name"

    return "unknown"


def majority_field_type(field_types: list[str]) -> str:
    """Return the most common field_type from a list."""
    if not field_types:
        return "unknown"
    from collections import Counter
    counts = Counter(field_types)
    return counts.most_common(1)[0][0]
