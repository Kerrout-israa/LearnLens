import json
import logging
import re
import time
from typing import TypeVar

import httpx
from pydantic import BaseModel, ValidationError

from app.core.config import settings

logger = logging.getLogger("learnlens")

T = TypeVar("T", bound=BaseModel)

MAX_OUTPUT_TOKENS = 8192
RETRYABLE_STATUS = {429, 500, 502, 503, 504}
GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"
# provider -> (url, supports response_format=json_object)
OPENAI_COMPATIBLE = {
    "groq": ("https://api.groq.com/openai/v1/chat/completions", True),
    "openrouter": ("https://openrouter.ai/api/v1/chat/completions", False),
}


class AIError(Exception):
    """Controlled AI failure. `message` is safe to show to API clients."""

    def __init__(self, message: str, status_code: int = 502):
        super().__init__(message)
        self.message = message
        self.status_code = status_code


def _post(url: str, headers: dict, body: dict) -> dict:
    for attempt in (1, 2):
        try:
            resp = httpx.post(
                url, headers=headers, json=body, timeout=settings.ai_timeout_seconds
            )
        except httpx.TimeoutException:
            logger.warning("AI request timed out (attempt %s)", attempt)
            if attempt == 2:
                raise AIError("AI provider timed out", 504)
            continue
        except httpx.HTTPError as exc:
            logger.error("AI request failed: %s", type(exc).__name__)
            raise AIError("Could not reach the AI provider", 502)

        if resp.status_code in RETRYABLE_STATUS and attempt == 1:
            logger.warning("AI provider returned %s, retrying once", resp.status_code)
            time.sleep(2)
            continue
        if resp.status_code != 200:
            logger.error("AI provider error %s: %s", resp.status_code, resp.text[:300])
            raise AIError("AI provider returned an error", 502)
        try:
            return resp.json()
        except ValueError:
            raise AIError("AI provider returned an unreadable response", 502)
    raise AIError("AI provider request failed", 502)


def _complete_gemini(prompt: str, system: str | None) -> str:
    body: dict = {
        "contents": [{"role": "user", "parts": [{"text": prompt}]}],
        "generationConfig": {
            "responseMimeType": "application/json",
            "temperature": 0.2,
            "maxOutputTokens": MAX_OUTPUT_TOKENS,
        },
    }
    if system:
        body["systemInstruction"] = {"parts": [{"text": system}]}
    data = _post(
        GEMINI_URL.format(model=settings.ai_model),
        {"x-goog-api-key": settings.ai_api_key},  # header, so the key never appears in URLs/logs
        body,
    )
    try:
        parts = data["candidates"][0]["content"]["parts"]
        text = "".join(p.get("text", "") for p in parts if not p.get("thought"))
    except (KeyError, IndexError, TypeError):
        raise AIError("AI returned an empty response", 502)
    return text


def _complete_openai_compatible(provider: str, prompt: str, system: str | None) -> str:
    url, json_mode = OPENAI_COMPATIBLE[provider]
    messages = []
    if system:
        messages.append({"role": "system", "content": system})
    messages.append({"role": "user", "content": prompt})
    body: dict = {
        "model": settings.ai_model,
        "messages": messages,
        "temperature": 0.2,
        "max_tokens": MAX_OUTPUT_TOKENS,
    }
    if json_mode:
        body["response_format"] = {"type": "json_object"}
    data = _post(url, {"Authorization": f"Bearer {settings.ai_api_key}"}, body)
    try:
        return data["choices"][0]["message"]["content"] or ""
    except (KeyError, IndexError, TypeError):
        raise AIError("AI returned an empty response", 502)


def _complete(prompt: str, system: str | None = None) -> str:
    if settings.ai_api_key.strip() in ("", "your_key_here"):
        raise AIError("AI is not configured: set AI_API_KEY in .env", 503)
    provider = settings.ai_provider.lower().strip()
    if provider == "gemini":
        return _complete_gemini(prompt, system)
    if provider in OPENAI_COMPATIBLE:
        return _complete_openai_compatible(provider, prompt, system)
    raise AIError("Unsupported AI_PROVIDER in configuration", 503)


def _extract_json(raw: str):
    text = raw.strip()
    if text.startswith("```"):
        text = re.sub(r"^```(?:json)?\s*|\s*```$", "", text).strip()
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        start, end = text.find("{"), text.rfind("}")
        if start != -1 and end > start:
            return json.loads(text[start : end + 1])
        raise


def _parse(raw: str, schema: type[T]) -> tuple[T | None, str]:
    try:
        return schema.model_validate(_extract_json(raw)), ""
    except (ValueError, ValidationError) as exc:
        return None, str(exc)[:500]


def generate_json(prompt: str, schema: type[T], system: str | None = None) -> T:
    """Call the LLM and return a validated `schema` instance.
    Invalid output gets exactly one correction retry, then a controlled AIError."""
    result, error = _parse(_complete(prompt, system), schema)
    if result is not None:
        return result

    logger.warning("AI output invalid, retrying once: %s", error)
    retry_prompt = (
        f"{prompt}\n\nYour previous reply was rejected: {error}\n"
        "Reply again with ONLY a valid JSON object that follows the required structure exactly."
    )
    result, error = _parse(_complete(retry_prompt, system), schema)
    if result is not None:
        return result

    logger.error("AI output still invalid after retry: %s", error)
    raise AIError("AI returned invalid output, please try again", 502)