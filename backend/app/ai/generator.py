from app.ai.client import generate_json
from app.ai.prompts import ANALYSIS_SYSTEM, build_analysis_prompt
from app.ai.schemas import ContentAnalysis

MAX_ANALYSIS_CHARS = 20_000  # ~5-6k tokens; lower this if your provider's free tier is tight
SLICES = 8


def condense_text(text: str, limit: int = MAX_ANALYSIS_CHARS) -> str:
    """Deterministic truncation: if too long, keep an equal slice from SLICES evenly
    spaced places so the whole document is still represented."""
    if len(text) <= limit:
        return text
    per = limit // SLICES
    step = len(text) // SLICES
    parts = []
    for i in range(SLICES):
        start = i * step
        if i:  # start on a line boundary when one is close
            nl = text.find("\n", start, start + 300)
            if nl != -1:
                start = nl + 1
        parts.append(text[start : start + per].strip())
    return "\n\n[...]\n\n".join(parts)


def analyze_content(text: str, subject: str, level: str) -> ContentAnalysis:
    prompt = build_analysis_prompt(condense_text(text), subject, level)
    return generate_json(prompt, ContentAnalysis, system=ANALYSIS_SYSTEM)