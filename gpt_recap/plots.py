from __future__ import annotations

from pathlib import Path
from typing import Dict

import matplotlib.pyplot as plt
import pandas as pd
import seaborn as sns

from .analysis import AnalysisResult


ROLE_COLORS = {
    "user": "#64ffda",
    "assistant": "#ff61ef",
    "tool": "#ffd479",
    "system": "#9bb5ff",
    "unknown": "#d2d2d2",
}

GRADIENT_BG = ["#1b1b3a", "#0f172a"]


def configure_visuals() -> None:
    sns.set_theme(style="whitegrid")
    plt.rcParams.update(
        {
            "figure.facecolor": "#080812",
            "axes.facecolor": "#12122a",
            "axes.edgecolor": "#ffffff",
            "axes.labelcolor": "#f4f4ff",
            "axes.titleweight": "semibold",
            "text.color": "#f4f4ff",
            "xtick.color": "#e0e0f0",
            "ytick.color": "#e0e0f0",
            "axes.grid": True,
            "grid.color": "#2a2a45",
            "grid.linestyle": "--",
            "grid.alpha": 0.35,
            "font.family": "Inter, DejaVu Sans, Arial",
        }
    )


class PlotBuilder:
    def __init__(self, output_dir: Path) -> None:
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(parents=True, exist_ok=True)
        configure_visuals()

    def create_all(self, result: AnalysisResult) -> Dict[str, Path]:
        paths: Dict[str, Path] = {}
        paths["messages_per_month_by_role.png"] = self.messages_per_month_by_role(
            result.monthly_message_counts_by_role
        )
        paths["conversation_depth_mix.png"] = self.conversation_depth_mix(result.conversation_categories)
        paths["assistant_reply_length_trend_words.png"] = self.assistant_reply_length_trend(
            result.assistant_daily_lengths, unit="words"
        )
        paths["assistant_reply_length_trend_characters.png"] = self.assistant_reply_length_trend(
            result.assistant_daily_lengths, unit="characters"
        )
        paths["messages_weekday_hour_heatmap.png"] = self.weekday_hour_heatmap(result.weekday_hour_counts)
        paths["messages_cumulative.png"] = self.cumulative_messages(result.cumulative_message_counts)
        paths["assistant_reply_length_words_hist.png"] = self.assistant_reply_length_distribution(
            result.assistant_responses, unit="words"
        )
        paths["assistant_reply_length_characters_hist.png"] = self.assistant_reply_length_distribution(
            result.assistant_responses, unit="characters"
        )
        return paths

    def messages_per_month_by_role(self, df: pd.DataFrame) -> Path:
        fig, ax = plt.subplots(figsize=(12, 7))
        if df.empty:
            ax.text(0.5, 0.5, "No data", ha="center", va="center", fontsize=14)
        else:
            pivot = df.pivot(index="month", columns="role", values="messages").fillna(0)
            pivot.index = pd.to_datetime(pivot.index)
            pivot = pivot.sort_index()
            for role, series in pivot.items():
                color = ROLE_COLORS.get(role, "#9bb5ff")
                ax.plot(series.index, series.values, label=role.title(), color=color, linewidth=2.6)
                ax.fill_between(series.index, series.values, alpha=0.08, color=color)

            ax.set_title("Messages per Month by Role", fontsize=20, pad=18)
            ax.set_xlabel("Month")
            ax.set_ylabel("Messages")
            ax.legend(frameon=False)
        self._beautify_time_axis(ax)
        path = self.output_dir / "messages_per_month_by_role.png"
        fig.savefig(path, dpi=220, bbox_inches="tight")
        plt.close(fig)
        return path

    def conversation_depth_mix(self, df: pd.DataFrame) -> Path:
        fig, ax = plt.subplots(figsize=(10, 6))
        if df.empty:
            ax.text(0.5, 0.5, "No data", ha="center", va="center")
        else:
            order = ["deep_multi_turn", "short_multi_turn", "one_and_done"]
            df = df.set_index("category").reindex(order).fillna(0).reset_index()
            colors = ["#ff61ef", "#64ffda", "#ffe066"]
            sns.barplot(data=df, x="category", y="conversations", ax=ax, palette=colors)
            ax.set_xticklabels(["Deep dives", "Quick loops", "One & done"], rotation=0)
            ax.set_ylabel("Conversations")
            ax.set_title("Conversation Depth Mix", fontsize=20, pad=16)
        path = self.output_dir / "conversation_depth_mix.png"
        fig.savefig(path, dpi=220, bbox_inches="tight")
        plt.close(fig)
        return path

    def assistant_reply_length_trend(self, df: pd.DataFrame, unit: str = "words") -> Path:
        fig, ax = plt.subplots(figsize=(12, 7))
        if df.empty:
            ax.text(0.5, 0.5, "No data", ha="center", va="center")
        else:
            x = pd.to_datetime(df["date"])
            if unit == "words":
                ax.plot(x, df["mean_word_count"], color="#64ffda", alpha=0.4, linewidth=1, label="Daily mean")
                ax.plot(x, df["mean_word_count_roll_7"], color="#2dd4bf", linewidth=2, label="7-day mean")
                ax.plot(x, df["mean_word_count_roll_30"], color="#0ea5e9", linewidth=2.5, label="30-day mean")
                ylabel = "Words per reply"
                title = "Assistant Reply Length (Words)"
                filename = "assistant_reply_length_trend_words.png"
            else:
                ax.plot(x, df["mean_char_count"], color="#ff9f1c", alpha=0.4, linewidth=1, label="Daily mean")
                ax.plot(x, df["mean_char_count_roll_7"], color="#f3722c", linewidth=2, label="7-day mean")
                ax.plot(x, df["mean_char_count_roll_30"], color="#f94144", linewidth=2.5, label="30-day mean")
                ylabel = "Characters per reply"
                title = "Assistant Reply Length (Characters)"
                filename = "assistant_reply_length_trend_characters.png"

            ax.set_title(title, fontsize=20, pad=16)
            ax.set_ylabel(ylabel)
            ax.set_xlabel("Date")
            ax.legend(frameon=False)
            self._beautify_time_axis(ax)

        path = self.output_dir / filename
        fig.savefig(path, dpi=220, bbox_inches="tight")
        plt.close(fig)
        return path

    def weekday_hour_heatmap(self, df: pd.DataFrame) -> Path:
        fig, ax = plt.subplots(figsize=(12, 6))
        if df.empty:
            ax.text(0.5, 0.5, "No data", ha="center", va="center")
        else:
            pivot = df.pivot(index="weekday", columns="hour", values="messages").fillna(0)
            sns.heatmap(
                pivot,
                ax=ax,
                cmap="viridis",
                cbar_kws={"label": "Messages"},
                linewidths=0.5,
                linecolor="#1f1f3a",
            )
            ax.set_title("Messages by Weekday & Hour", fontsize=20, pad=16)
            ax.set_xlabel("Hour")
            ax.set_ylabel("")
        path = self.output_dir / "messages_weekday_hour_heatmap.png"
        fig.savefig(path, dpi=220, bbox_inches="tight")
        plt.close(fig)
        return path

    def cumulative_messages(self, df: pd.DataFrame) -> Path:
        fig, ax = plt.subplots(figsize=(12, 6))
        if df.empty:
            ax.text(0.5, 0.5, "No data", ha="center", va="center")
        else:
            ax.plot(pd.to_datetime(df["date"]), df["cumulative_messages"], color="#7c3aed", linewidth=2.5)
            ax.fill_between(
                pd.to_datetime(df["date"]),
                df["cumulative_messages"],
                alpha=0.2,
                color="#7c3aed",
            )
            ax.set_title("Cumulative Messages", fontsize=20, pad=16)
            ax.set_ylabel("Messages")
            ax.set_xlabel("Date")
            self._beautify_time_axis(ax)
        path = self.output_dir / "messages_cumulative.png"
        fig.savefig(path, dpi=220, bbox_inches="tight")
        plt.close(fig)
        return path

    def assistant_reply_length_distribution(self, df: pd.DataFrame, unit: str = "words") -> Path:
        fig, ax = plt.subplots(figsize=(10, 6))
        if df.empty:
            ax.text(0.5, 0.5, "No data", ha="center", va="center")
            filename = "assistant_reply_length_words_hist.png"
        else:
            if unit == "words":
                values = df["word_count"].clip(upper=2000)
                color = "#64ffda"
                xlabel = "Words"
                filename = "assistant_reply_length_words_hist.png"
            else:
                values = df["char_count"].clip(upper=12000)
                color = "#f94144"
                xlabel = "Characters"
                filename = "assistant_reply_length_characters_hist.png"

            sns.histplot(values, bins=60, ax=ax, color=color, kde=False)
            ax.set_title(f"Assistant Reply Length Distribution ({unit.title()})", fontsize=18, pad=14)
            ax.set_xlabel(xlabel)
            ax.set_ylabel("Responses")

        path = self.output_dir / filename
        fig.savefig(path, dpi=220, bbox_inches="tight")
        plt.close(fig)
        return path

    @staticmethod
    def _beautify_time_axis(ax: plt.Axes) -> None:
        fig = ax.get_figure()
        fig.autofmt_xdate()


__all__ = ["PlotBuilder", "configure_visuals"]
