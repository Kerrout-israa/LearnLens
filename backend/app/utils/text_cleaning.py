import re
from collections import Counter
from math import ceil

LIGATURES = {
    "\ufb00": "ff", "\ufb01": "fi", "\ufb02": "fl", "\ufb03": "ffi", "\ufb04": "ffl",
}
CONTROL_CHARS = re.compile(r"[\x00-\x08\x0b\x0e-\x1f\x7f]")
PAGE_NUMBER = re.compile(
    r"^(?:(?:page|p\.|صفحة)\s*)?\d{1,4}(?:\s*(?:/|of|sur)\s*\d{1,4})?$"
    r"|^[-–—]\s*\d{1,4}\s*[-–—]$",
    re.IGNORECASE,
)

EDGE_LINES = 2          # only first/last N non-empty lines of a page are candidates
MAX_HEADER_LEN = 120    # longer lines are body text, never headers/footers
MIN_REPEAT_PAGES = 3
REPEAT_RATIO = 0.5


def _normalize_page(text: str) -> list[str]:
    for src, dst in LIGATURES.items():
        text = text.replace(src, dst)
    text = (
        text.replace("\r\n", "\n").replace("\r", "\n").replace("\x0c", "\n")
        .replace("\u00a0", " ").replace("\u200b", "")
    )
    text = CONTROL_CHARS.sub("", text)
    return [re.sub(r"[ \t]+", " ", line).strip() for line in text.split("\n")]


def _edge_indices(lines: list[str]) -> set[int]:
    filled = [i for i, line in enumerate(lines) if line]
    return set(filled[:EDGE_LINES] + filled[-EDGE_LINES:])


def _key(line: str) -> str:
    # digits -> '#' so "Page 3" and "Page 4" count as the same footer
    return re.sub(r"\d+", "#", line.lower())


def clean_pages(pages: list[str]) -> str:
    page_lines = [_normalize_page(p) for p in pages]

    # 1. standalone page numbers at page edges
    for lines in page_lines:
        for i in _edge_indices(lines):
            if PAGE_NUMBER.match(lines[i]):
                lines[i] = ""

    # 2. headers/footers repeated across many pages
    if len(page_lines) >= MIN_REPEAT_PAGES:
        counts: Counter[str] = Counter()
        for lines in page_lines:
            keys = {
                _key(lines[i]) for i in _edge_indices(lines)
                if len(lines[i]) <= MAX_HEADER_LEN
            }
            counts.update(keys)
        threshold = max(MIN_REPEAT_PAGES, ceil(len(page_lines) * REPEAT_RATIO))
        repeated = {k for k, c in counts.items() if c >= threshold}
        if repeated:
            for lines in page_lines:
                for i in _edge_indices(lines):
                    if len(lines[i]) <= MAX_HEADER_LEN and _key(lines[i]) in repeated:
                        lines[i] = ""

    # 3. rejoin pages, collapse blank-line runs
    text = "\n\n".join("\n".join(lines) for lines in page_lines)
    return re.sub(r"\n{3,}", "\n\n", text).strip()