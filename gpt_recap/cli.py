from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Any, Dict

import numpy as np
import pandas as pd

from .analysis import AnalysisResult, summarise
from .data import flatten_messages, load_conversations
from .plots import PlotBuilder
from .story import render_story


def parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Generate a ChatGPT usage recap from conversations.json")
    parser.add_argument("input", help="Path to conversations.json export")
    parser.add_argument(
        "--output",
        "-o",
        help="Directory to write CSVs, plots, and recap HTML",
        default="outputs",
    )
    return parser.parse_args(argv)


def main(argv: list[str] | None = None) -> None:
    args = parse_args(argv)
    input_path = Path(args.input)
    output_dir = Path(args.output)
    output_dir.mkdir(parents=True, exist_ok=True)

    conversations = load_conversations(input_path)
    messages = flatten_messages(conversations)
    result = summarise(messages)

    _write_csv_outputs(result, output_dir)

    plot_builder = PlotBuilder(output_dir)
    plot_paths = plot_builder.create_all(result)

    story_path = render_story(result, plot_paths, output_dir)

    metrics_path = output_dir / "metrics_summary.json"
    with metrics_path.open("w", encoding="utf-8") as fh:
        json.dump(_serialise(result.metrics), fh, indent=2)

    print("Wrote analysis to", output_dir)
    print("Story recap available at", story_path)


def _write_csv_outputs(result: AnalysisResult, output_dir: Path) -> None:
    def save(df: pd.DataFrame, name: str) -> None:
        path = output_dir / name
        if df.empty:
            df.to_csv(path, index=False)
            return
        frame = df.copy()
        for col in frame.columns:
            if pd.api.types.is_datetime64_any_dtype(frame[col]):
                if pd.api.types.is_datetime64tz_dtype(frame[col]):
                    frame[col] = frame[col].dt.tz_convert("UTC").dt.strftime("%Y-%m-%dT%H:%M:%SZ")
                else:
                    frame[col] = frame[col].dt.strftime("%Y-%m-%dT%H:%M:%S")
        frame.to_csv(path, index=False)

    save(result.messages, "messages_flat.csv")
    save(result.conversation_summary, "conversation_summary.csv")
    save(result.messages_by_role, "messages_by_role.csv")
    save(result.conversation_categories, "conversation_categories.csv")
    save(result.monthly_message_counts, "messages_per_month.csv")
    save(result.monthly_message_counts_by_role, "messages_per_month_by_role_long.csv")
    save(
        result.monthly_message_counts_by_role.pivot_table(
            index="month", columns="role", values="messages", fill_value=0
        ).reset_index(),
        "messages_per_month_by_role.csv",
    )
    save(result.monthly_conversation_counts, "conversations_per_month.csv")
    save(result.messages_by_hour, "messages_by_hour.csv")
    save(result.messages_by_hour_by_role, "messages_by_hour_by_role_long.csv")
    save(
        result.messages_by_hour_by_role.pivot_table(
            index="hour", columns="role", values="messages", fill_value=0
        ).reset_index(),
        "messages_by_hour_by_role.csv",
    )
    save(result.messages_by_weekday, "messages_by_weekday.csv")
    save(result.messages_by_weekday_by_role, "messages_by_weekday_by_role_long.csv")
    save(
        result.messages_by_weekday_by_role.pivot_table(
            index="weekday", columns="role", values="messages", fill_value=0
        ).reset_index(),
        "messages_by_weekday_by_role.csv",
    )
    save(result.daily_message_counts, "messages_by_day.csv")
    save(result.weekday_hour_counts, "messages_by_weekday_hour.csv")
    save(result.cumulative_message_counts, "messages_cumulative.csv")
    save(result.assistant_responses, "assistant_responses_with_lengths.csv")
    save(result.assistant_daily_lengths, "assistant_daily_lengths.csv")
    save(result.assistant_monthly_lengths, "assistant_monthly_lengths.csv")


def _serialise(obj: Any) -> Any:
    if isinstance(obj, dict):
        return {k: _serialise(v) for k, v in obj.items()}
    if isinstance(obj, list):
        return [_serialise(v) for v in obj]
    if isinstance(obj, tuple):
        return tuple(_serialise(v) for v in obj)
    if isinstance(obj, pd.Timestamp):
        if pd.isna(obj):
            return None
        return obj.isoformat()
    if isinstance(obj, np.generic):
        return obj.item()
    return obj


if __name__ == "__main__":  # pragma: no cover
    main()
