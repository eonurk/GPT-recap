from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Dict, Tuple

import numpy as np
import pandas as pd


@dataclass
class AnalysisResult:
    messages: pd.DataFrame
    conversation_summary: pd.DataFrame
    messages_by_role: pd.DataFrame
    conversation_categories: pd.DataFrame
    monthly_message_counts: pd.DataFrame
    monthly_message_counts_by_role: pd.DataFrame
    monthly_conversation_counts: pd.DataFrame
    messages_by_hour: pd.DataFrame
    messages_by_hour_by_role: pd.DataFrame
    messages_by_weekday: pd.DataFrame
    messages_by_weekday_by_role: pd.DataFrame
    daily_message_counts: pd.DataFrame
    weekday_hour_counts: pd.DataFrame
    cumulative_message_counts: pd.DataFrame
    assistant_responses: pd.DataFrame
    assistant_daily_lengths: pd.DataFrame
    assistant_monthly_lengths: pd.DataFrame
    metrics: Dict[str, Any]


def describe_series(series: pd.Series) -> Dict[str, float]:
    clean = series.dropna()
    if clean.empty:
        return {"count": 0, "min": np.nan, "mean": np.nan, "median": np.nan, "p90": np.nan, "max": np.nan}
    return {
        "count": int(clean.count()),
        "min": float(clean.min()),
        "mean": float(clean.mean()),
        "median": float(clean.median()),
        "p90": float(clean.quantile(0.9)),
        "max": float(clean.max()),
    }


def summarise(messages: pd.DataFrame) -> AnalysisResult:
    if messages.empty:
        raise ValueError("No messages to analyse.")

    def _summarise_conversation(df: pd.DataFrame) -> pd.Series:
        df = df.sort_values("create_time")
        first_time = df["create_time"].min()
        last_time = df["create_time"].max()
        if pd.isna(first_time) or pd.isna(last_time):
            duration_minutes = np.nan
        else:
            duration_minutes = (last_time - first_time).total_seconds() / 60.0

        return pd.Series(
            {
                "first_time": first_time,
                "last_time": last_time,
                "duration_minutes": duration_minutes,
                "messages": int(df.shape[0]),
                "user_messages": int((df["role"] == "user").sum()),
                "assistant_messages": int((df["role"] == "assistant").sum()),
                "tool_messages": int((df["role"] == "tool").sum()),
                "system_messages": int((df["role"] == "system").sum()),
                "words_user": int(df.loc[df["role"] == "user", "word_count"].sum()),
                "words_assistant": int(df.loc[df["role"] == "assistant", "word_count"].sum()),
                "has_code": bool(df["has_code"].any()),
                "has_multimodal": bool(df["is_multimodal"].any()),
            }
        )

    conversation_summary = (
        messages.groupby(["conversation_index", "conversation_id", "conversation_title"], dropna=False)
        .apply(_summarise_conversation)
        .reset_index()
    )

    conversation_summary["has_tool"] = conversation_summary["tool_messages"] > 0

    messages_by_role = (
        messages.groupby("role", dropna=False).size().reset_index(name="messages").sort_values("messages", ascending=False)
    )

    monthly_message_counts = (
        messages.dropna(subset=["month"])
        .groupby("month")
        .size()
        .reset_index(name="messages")
        .sort_values("month")
    )

    monthly_message_counts_by_role = (
        messages.dropna(subset=["month"])
        .groupby(["month", "role"])
        .size()
        .reset_index(name="messages")
        .sort_values(["month", "role"])
    )

    monthly_conversation_counts = (
        conversation_summary.dropna(subset=["first_time"])
        .assign(month=lambda df: df["first_time"].dt.to_period("M").dt.to_timestamp())
        .groupby("month")
        .size()
        .reset_index(name="conversations")
        .sort_values("month")
    )

    messages_by_hour = (
        messages.dropna(subset=["hour"])
        .groupby("hour")
        .size()
        .reset_index(name="messages")
        .sort_values("hour")
    )

    messages_by_hour_by_role = (
        messages.dropna(subset=["hour"])
        .groupby(["hour", "role"])
        .size()
        .reset_index(name="messages")
        .sort_values(["hour", "role"])
    )

    messages_by_weekday = (
        messages.dropna(subset=["weekday"])
        .groupby("weekday")
        .size()
        .reindex(
            index=["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
        )
        .reset_index(name="messages")
        .sort_values("messages", ascending=False)
    )

    messages_by_weekday_by_role = (
        messages.dropna(subset=["weekday"])
        .groupby(["weekday", "role"])
        .size()
        .reset_index(name="messages")
    )

    daily_message_counts = (
        messages.dropna(subset=["date"])
        .groupby("date")
        .size()
        .reset_index(name="messages")
        .sort_values("date")
    )

    weekday_order = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
    weekday_hour_counts = (
        messages.dropna(subset=["weekday", "hour"])
        .assign(
            weekday=lambda df: pd.Categorical(df["weekday"], categories=weekday_order, ordered=True)
        )
        .groupby(["weekday", "hour"])
        .size()
        .reset_index(name="messages")
        .sort_values(["weekday", "hour"])
    )

    cumulative_message_counts = (
        daily_message_counts.assign(cumulative_messages=lambda df: df["messages"].cumsum())
    )

    assistant_responses = (
        messages[messages["role"] == "assistant"]
        .dropna(subset=["create_time"])
        .copy()
        .sort_values("create_time")
    )

    assistant_daily_lengths = (
        assistant_responses.assign(date=lambda df: df["create_time"].dt.date)
        .groupby("date")
        .agg(
            responses=("message_id", "count"),
            mean_word_count=("word_count", "mean"),
            median_word_count=("word_count", "median"),
            mean_char_count=("char_count", "mean"),
            median_char_count=("char_count", "median"),
        )
        .reset_index()
        .sort_values("date")
    )

    if not assistant_daily_lengths.empty:
        assistant_daily_lengths["mean_word_count_roll_7"] = (
            assistant_daily_lengths["mean_word_count"].rolling(window=7, min_periods=1).mean()
        )
        assistant_daily_lengths["mean_word_count_roll_30"] = (
            assistant_daily_lengths["mean_word_count"].rolling(window=30, min_periods=1).mean()
        )
        assistant_daily_lengths["mean_char_count_roll_7"] = (
            assistant_daily_lengths["mean_char_count"].rolling(window=7, min_periods=1).mean()
        )
        assistant_daily_lengths["mean_char_count_roll_30"] = (
            assistant_daily_lengths["mean_char_count"].rolling(window=30, min_periods=1).mean()
        )

    assistant_monthly_lengths = (
        assistant_responses.assign(month=lambda df: df["create_time"].dt.to_period("M").dt.to_timestamp())
        .groupby("month")
        .agg(
            responses=("message_id", "count"),
            mean_word_count=("word_count", "mean"),
            median_word_count=("word_count", "median"),
            mean_char_count=("char_count", "mean"),
            median_char_count=("char_count", "median"),
        )
        .reset_index()
        .sort_values("month")
    )

    conversation_summary = conversation_summary.assign(
        first_time_local=lambda df: df["first_time"].dt.tz_convert("UTC").dt.tz_localize(None),
        last_time_local=lambda df: df["last_time"].dt.tz_convert("UTC").dt.tz_localize(None),
    )

    conversation_categories = (
        conversation_summary.assign(
            category=lambda df: np.select(
                [
                    (df["user_messages"] == 1) & (df["assistant_messages"] == 1),
                    df["user_messages"] <= 3,
                ],
                ["one_and_done", "short_multi_turn"],
                default="deep_multi_turn",
            )
        )
        .groupby("category")
        .size()
        .reset_index(name="conversations")
        .sort_values("conversations", ascending=False)
    )

    metrics = {
        "conversation_count": int(conversation_summary.shape[0]),
        "message_count_total": int(messages.shape[0]),
        "messages_by_role": dict(zip(messages_by_role["role"], messages_by_role["messages"])),
        "conversation_length_stats": describe_series(conversation_summary["messages"]),
        "conversation_duration_minutes_stats": describe_series(conversation_summary["duration_minutes"]),
        "user_turn_stats": describe_series(conversation_summary["user_messages"]),
        "assistant_turn_stats": describe_series(conversation_summary["assistant_messages"]),
        "user_word_count_stats": describe_series(
            messages.loc[messages["role"] == "user", "word_count"]
        ),
        "assistant_word_count_stats": describe_series(
            messages.loc[messages["role"] == "assistant", "word_count"]
        ),
        "assistant_character_count_stats": describe_series(
            messages.loc[messages["role"] == "assistant", "char_count"]
        ),
        "date_range": {
            "first_conversation": conversation_summary["first_time_local"].min(),
            "last_conversation": conversation_summary["last_time_local"].max(),
            "active_days": int(daily_message_counts["date"].nunique()),
        },
    }

    return AnalysisResult(
        messages=messages,
        conversation_summary=conversation_summary,
        messages_by_role=messages_by_role,
        conversation_categories=conversation_categories,
        monthly_message_counts=monthly_message_counts,
        monthly_message_counts_by_role=monthly_message_counts_by_role,
        monthly_conversation_counts=monthly_conversation_counts,
        messages_by_hour=messages_by_hour,
        messages_by_hour_by_role=messages_by_hour_by_role,
        messages_by_weekday=messages_by_weekday,
        messages_by_weekday_by_role=messages_by_weekday_by_role,
        daily_message_counts=daily_message_counts,
        weekday_hour_counts=weekday_hour_counts,
        cumulative_message_counts=cumulative_message_counts,
        assistant_responses=assistant_responses,
        assistant_daily_lengths=assistant_daily_lengths,
        assistant_monthly_lengths=assistant_monthly_lengths,
        metrics=metrics,
    )


__all__ = ["AnalysisResult", "summarise"]
