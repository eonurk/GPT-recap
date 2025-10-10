from __future__ import annotations

import json
import re
from pathlib import Path
from typing import Any, Dict, Iterable, List, Mapping, MutableMapping, Sequence

import numpy as np
import pandas as pd


TEXTUAL_CONTENT_TYPES = {
    "text",
    "code",
    "reasoning_recap",
    "thoughts",
    "execution_output",
    "tether_browsing_display",
    "system_error",
    "computer_output",
    "sonic_webpage",
    "tether_quote",
}


def load_conversations(path: str | Path) -> List[MutableMapping[str, Any]]:
    """Load the exported conversations JSON."""
    with Path(path).open("r", encoding="utf-8") as fh:
        return json.load(fh)


def extract_text(content: Mapping[str, Any] | None) -> str:
    if not content:
        return ""

    ctype = content.get("content_type")
    parts = content.get("parts") or []
    lines: List[str] = []

    if ctype in TEXTUAL_CONTENT_TYPES:
        lines.extend(_parse_parts(parts))
    elif ctype == "multimodal_text":
        for part in parts:
            if isinstance(part, str):
                lines.append(part)
            elif isinstance(part, Mapping):
                ptype = part.get("content_type")
                if ptype == "text" and isinstance(part.get("text"), str):
                    lines.append(part["text"])
                elif ptype == "audio_transcription":
                    transcript = part.get("transcript")
                    if transcript:
                        lines.append(transcript)
                elif ptype == "image_asset_pointer":
                    lines.append("[image]")
                elif ptype == "audio_asset_pointer":
                    lines.append("[audio]")
                elif ptype == "real_time_user_audio_video_asset_pointer":
                    lines.append("[realtime av]")
    elif ctype == "user_editable_context":
        instructions = content.get("user_instructions") or ""
        lines.append(instructions)

    return "\n".join(line for line in lines if line)


def _parse_parts(parts: Sequence[Any]) -> List[str]:
    collected: List[str] = []
    for part in parts:
        if isinstance(part, str):
            collected.append(part)
        elif isinstance(part, Mapping):
            if isinstance(part.get("text"), str):
                collected.append(part["text"])
            elif isinstance(part.get("title"), str):
                collected.append(part["title"])
    return collected


WORD_RE = re.compile(r"[A-Za-z']+")


def flatten_messages(conversations: Iterable[MutableMapping[str, Any]]) -> pd.DataFrame:
    """Explode the nested conversation format into a flat message DataFrame."""
    rows: List[Dict[str, Any]] = []

    for idx, conversation in enumerate(conversations):
        mapping = conversation.get("mapping") or {}
        conv_id = conversation.get("id") or f"conversation_{idx:05d}"
        title = conversation.get("title") or "Untitled"

        for node in mapping.values():
            message = node.get("message")
            if not message:
                continue

            content = message.get("content") or {}
            text = extract_text(content)
            create_time = message.get("create_time")

            rows.append(
                {
                    "conversation_index": idx,
                    "conversation_id": conv_id,
                    "conversation_title": title,
                    "message_id": message.get("id"),
                    "message_index": message.get("id"),
                    "role": (message.get("author") or {}).get("role", "unknown"),
                    "create_time": pd.to_datetime(create_time, unit="s", utc=True)
                    if isinstance(create_time, (int, float))
                    else pd.NaT,
                    "content_type": content.get("content_type"),
                    "text": text,
                    "word_count": len(WORD_RE.findall(text.lower())),
                    "char_count": len(text),
                    "has_code": content.get("content_type") == "code",
                    "is_multimodal": content.get("content_type") == "multimodal_text",
                }
            )

    if not rows:
        return pd.DataFrame(
            columns=[
                "conversation_index",
                "conversation_id",
                "conversation_title",
                "message_id",
                "message_index",
                "role",
                "create_time",
                "content_type",
                "text",
                "word_count",
                "char_count",
                "has_code",
                "is_multimodal",
            ]
        )

    df = pd.DataFrame(rows)
    df["role"] = df["role"].fillna("unknown")
    df["date"] = df["create_time"].dt.tz_convert("UTC").dt.tz_localize(None).dt.date
    df["month"] = (
        df["create_time"]
        .dt.tz_convert("UTC")
        .dt.tz_localize(None)
        .dt.to_period("M")
        .dt.to_timestamp()
    )
    df["hour"] = df["create_time"].dt.hour
    df["weekday"] = df["create_time"].dt.day_name()
    return df


__all__ = ["load_conversations", "flatten_messages"]
