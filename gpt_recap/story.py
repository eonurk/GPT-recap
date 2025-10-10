from __future__ import annotations

from pathlib import Path
from typing import Dict, List, Tuple

import numpy as np
import pandas as pd
from jinja2 import Template

from .analysis import AnalysisResult


def _fmt_int(value: float | int | None) -> str:
    if value is None or (isinstance(value, float) and np.isnan(value)):
        return "—"
    return f"{int(round(value)):,}"


def _fmt_float(value: float | None, decimals: int = 1) -> str:
    if value is None or np.isnan(value):
        return "—"
    formatted = f"{value:.{decimals}f}"
    return formatted.rstrip("0").rstrip(".")


def _fmt_percent(value: float | None) -> str:
    if value is None or np.isnan(value):
        return "—"
    return f"{value * 100:.1f}%"


def _format_date(value: pd.Timestamp | None) -> str:
    if value is None or pd.isna(value):
        return "—"
    ts = pd.Timestamp(value)
    if ts.tzinfo is not None:
        ts = ts.tz_convert("UTC").tz_localize(None)
    ts = ts.floor("D")
    return ts.strftime("%b %d, %Y")


def _longest_streak(dates: List[pd.Timestamp]) -> Tuple[int, str, str]:
    if not dates:
        return 0, "—", "—"
    sorted_dates = sorted(dates)
    best_start = sorted_dates[0]
    best_end = sorted_dates[0]
    current_start = sorted_dates[0]
    current_len = 1
    best_len = 1
    for prev, curr in zip(sorted_dates, sorted_dates[1:]):
        if curr == prev + pd.Timedelta(days=1):
            current_len += 1
        else:
            if current_len > best_len:
                best_len = current_len
                best_start, best_end = current_start, prev
            current_start = curr
            current_len = 1
    if current_len > best_len:
        best_len = current_len
        best_start, best_end = current_start, sorted_dates[-1]
    return best_len, _format_date(best_start), _format_date(best_end)


def _longest_gap(dates: List[pd.Timestamp]) -> Tuple[int, str, str]:
    if len(dates) < 2:
        return 0, "—", "—"
    sorted_dates = sorted(dates)
    gaps: List[Tuple[int, date, date]] = []
    for prev, curr in zip(sorted_dates, sorted_dates[1:]):
        delta = (curr - prev).days - 1
        if delta > 0:
            gaps.append((delta, prev + pd.Timedelta(days=1), curr - pd.Timedelta(days=1)))
    if not gaps:
        return 0, "—", "—"
    length, start, end = max(gaps, key=lambda item: item[0])
    return length, _format_date(start), _format_date(end)


def build_context(result: AnalysisResult) -> Dict[str, str]:
    metrics = result.metrics
    date_range = metrics.get("date_range", {})
    first_date = _format_date(date_range.get("first_conversation"))
    last_date = _format_date(date_range.get("last_conversation"))
    conversation_count = _fmt_int(metrics.get("conversation_count"))
    message_count = _fmt_int(metrics.get("message_count_total"))

    daily_messages = result.daily_message_counts
    active_days = _fmt_int(date_range.get("active_days"))
    avg_messages = daily_messages["messages"].mean() if not daily_messages.empty else np.nan
    avg_messages_fmt = _fmt_float(avg_messages)

    if daily_messages.empty:
        busiest_day_label = "—"
        busiest_day_value = "—"
        latest_date_label = last_date
        dates: List[pd.Timestamp] = []
    else:
        busiest_row = daily_messages.loc[daily_messages["messages"].idxmax()]
        busiest_ts = pd.Timestamp(busiest_row["date"])
        busiest_day_label = busiest_ts.strftime("%b %d, %Y")
        busiest_day_value = _fmt_int(busiest_row["messages"])
        latest_ts = pd.to_datetime(daily_messages["date"].max())
        latest_date_label = latest_ts.strftime("%b %d, %Y")
        dates = [pd.Timestamp(d) for d in daily_messages["date"]]

    streak_len, streak_start, streak_end = _longest_streak(dates)
    gap_len, gap_start, gap_end = _longest_gap(dates)

    monthly_counts = result.monthly_message_counts
    if monthly_counts.empty:
        peak_month_label = "—"
        peak_month_value = "—"
        quiet_month_label = "—"
        quiet_month_value = "—"
    else:
        peak_row = monthly_counts.loc[monthly_counts["messages"].idxmax()]
        quiet_row = monthly_counts.loc[monthly_counts["messages"].idxmin()]
        peak_month_label = _format_date(peak_row["month"])
        peak_month_value = _fmt_int(peak_row["messages"])
        quiet_month_label = _format_date(quiet_row["month"])
        quiet_month_value = _fmt_int(quiet_row["messages"])

    role_totals = metrics.get("messages_by_role", {})
    total_messages = sum(role_totals.values()) or np.nan
    assistant_share = _fmt_percent(role_totals.get("assistant", np.nan) / total_messages if total_messages else np.nan)
    user_share = _fmt_percent(role_totals.get("user", np.nan) / total_messages if total_messages else np.nan)

    depth_mix = result.conversation_categories.set_index("category")["conversations"]
    total_conversations = depth_mix.sum() or np.nan
    deep_share = _fmt_percent(depth_mix.get("deep_multi_turn", np.nan) / total_conversations if total_conversations else np.nan)
    short_share = _fmt_percent(depth_mix.get("short_multi_turn", np.nan) / total_conversations if total_conversations else np.nan)
    one_share = _fmt_percent(depth_mix.get("one_and_done", np.nan) / total_conversations if total_conversations else np.nan)

    tool_share = _fmt_percent(result.conversation_summary["has_tool"].mean() if not result.conversation_summary.empty else np.nan)
    code_share = _fmt_percent(result.conversation_summary["has_code"].mean() if not result.conversation_summary.empty else np.nan)

    top_conversation = result.conversation_summary.sort_values("messages", ascending=False).head(1)
    if top_conversation.empty:
        top_title = "—"
        top_messages = "—"
    else:
        top_title = top_conversation["conversation_title"].iloc[0] or "Untitled"
        top_messages = _fmt_int(top_conversation["messages"].iloc[0])

    assistant_monthly = result.assistant_monthly_lengths
    if assistant_monthly.empty:
        assistant_peak_label = "—"
        assistant_peak_words = "—"
        assistant_low_label = "—"
        assistant_low_words = "—"
    else:
        peak_idx = assistant_monthly["mean_word_count"].idxmax()
        low_idx = assistant_monthly["mean_word_count"].idxmin()
        assistant_peak_label = _format_date(assistant_monthly.loc[peak_idx, "month"])
        assistant_peak_words = _fmt_float(assistant_monthly.loc[peak_idx, "mean_word_count"])
        assistant_low_label = _format_date(assistant_monthly.loc[low_idx, "month"])
        assistant_low_words = _fmt_float(assistant_monthly.loc[low_idx, "mean_word_count"])

    if result.assistant_daily_lengths.empty:
        latest_word_avg = "—"
        latest_char_avg = "—"
    else:
        rolling_words = result.assistant_daily_lengths["mean_word_count_roll_30"].dropna()
        rolling_chars = result.assistant_daily_lengths["mean_char_count_roll_30"].dropna()
        latest_word_avg = _fmt_float(rolling_words.iloc[-1]) if not rolling_words.empty else "—"
        latest_char_avg = _fmt_int(rolling_chars.iloc[-1]) if not rolling_chars.empty else "—"

    return {
        "first_date": first_date,
        "last_date": last_date,
        "conversation_count": conversation_count,
        "message_count": message_count,
        "active_days": active_days,
        "avg_messages_per_active_day": avg_messages_fmt,
        "peak_month_label": peak_month_label,
        "peak_month_value": peak_month_value,
        "quiet_month_label": quiet_month_label,
        "quiet_month_value": quiet_month_value,
        "busiest_day_label": busiest_day_label,
        "busiest_day_value": busiest_day_value,
        "longest_streak_length": _fmt_int(streak_len),
        "longest_streak_range": f"{streak_start} — {streak_end}",
        "longest_gap_length": _fmt_int(gap_len),
        "longest_gap_range": f"{gap_start} — {gap_end}",
        "assistant_share": assistant_share,
        "user_share": user_share,
        "deep_share": deep_share,
        "short_share": short_share,
        "one_share": one_share,
        "tool_share": tool_share,
        "code_share": code_share,
        "top_conversation_title": top_title,
        "top_conversation_messages": top_messages,
        "assistant_peak_label": assistant_peak_label,
        "assistant_peak_words": assistant_peak_words,
        "assistant_low_label": assistant_low_label,
        "assistant_low_words": assistant_low_words,
        "latest_word_avg": latest_word_avg,
        "latest_char_avg": latest_char_avg,
        "latest_date_label": latest_date_label,
    }


def render_story(result: AnalysisResult, plot_paths: Dict[str, Path], output_dir: Path) -> Path:
    context = build_context(result)
    plot_names = {name: path.name for name, path in plot_paths.items()}
    template = Template(_HTML_TEMPLATE, autoescape=True)
    html = template.render(context=context, plots=plot_names)
    output_dir = Path(output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)
    html_path = output_dir / "gpt_recap.html"
    html_path.write_text(html, encoding="utf-8")
    return html_path


_HTML_TEMPLATE = """
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>GPT Recap Stories</title>
    <style>
      :root {
        color-scheme: dark;
        font-family: "Helvetica Neue", "SF Pro Display", Arial, sans-serif;
      }
      body {
        margin: 0;
        background: #05030a;
        display: flex;
        justify-content: center;
      }
      .slides {
        width: min(520px, 92vw);
        padding: 48px 0 80px;
        display: flex;
        flex-direction: column;
        gap: 48px;
        align-items: center;
      }
      .story {
        width: 100%;
        display: flex;
        justify-content: center;
      }
      .frame {
        position: relative;
        width: 100%;
        aspect-ratio: 9 / 16;
        border-radius: 40px;
        padding: 36px 28px;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        overflow: hidden;
        background: linear-gradient(165deg, #100225, #1a0b38 55%, #04020c 100%);
        color: #f8fafc;
        box-shadow: 0 32px 90px rgba(5, 2, 12, 0.85);
        border: 1px solid rgba(148, 163, 184, 0.2);
      }
      .frame::before {
        content: "";
        position: absolute;
        inset: -25% -20%;
        background: radial-gradient(circle at 20% 20%, rgba(99, 102, 241, 0.55), transparent 60%);
        z-index: 0;
      }
      .story.tone-2 .frame {
        background: linear-gradient(165deg, #06121f, #012a37 60%, #03121f 100%);
      }
      .story.tone-2 .frame::before {
        background: radial-gradient(circle at 75% 15%, rgba(45, 212, 191, 0.45), transparent 60%);
      }
      .story.tone-3 .frame {
        background: linear-gradient(170deg, #17061b, #2a0f3d 58%, #04020c 100%);
      }
      .story.tone-3 .frame::before {
        background: radial-gradient(circle at 18% 18%, rgba(236, 72, 153, 0.45), transparent 65%);
      }
      .story.tone-4 .frame {
        background: linear-gradient(170deg, #05182c, #07355c 60%, #030b18 100%);
      }
      .story.tone-4 .frame::before {
        background: radial-gradient(circle at 70% 20%, rgba(96, 165, 250, 0.5), transparent 65%);
      }
      .story.tone-5 .frame {
        background: linear-gradient(170deg, #16062b, #2d0b4f 60%, #04020c 100%);
      }
      .story.tone-5 .frame::before {
        background: radial-gradient(circle at 80% 15%, rgba(244, 114, 182, 0.55), transparent 65%);
      }
      .layer {
        position: relative;
        z-index: 1;
        display: flex;
        flex-direction: column;
        gap: 16px;
        height: 100%;
      }
      header {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }
      .badge {
        align-self: flex-start;
        padding: 6px 14px;
        border-radius: 999px;
        background: rgba(255, 255, 255, 0.12);
        border: 1px solid rgba(255, 255, 255, 0.18);
        font-size: 0.75rem;
        letter-spacing: 0.18em;
        text-transform: uppercase;
        color: rgba(248, 250, 252, 0.75);
      }
      h1 {
        margin: 0;
        font-size: clamp(2.2rem, 6vw, 2.9rem);
        line-height: 1.1;
        font-weight: 800;
      }
      h2 {
        margin: 0;
        font-size: clamp(1.9rem, 5.5vw, 2.6rem);
        line-height: 1.12;
        font-weight: 800;
      }
      p {
        margin: 0;
        font-size: 1rem;
        line-height: 1.55;
        color: rgba(248, 250, 252, 0.9);
      }
      .stat-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 16px;
        margin-top: 8px;
      }
      .stat {
        background: rgba(15, 23, 42, 0.45);
        border-radius: 18px;
        padding: 14px;
        border: 1px solid rgba(148, 163, 184, 0.22);
        backdrop-filter: blur(8px);
      }
      .stat .value {
        display: block;
        font-size: 1.6rem;
        font-weight: 700;
        margin-bottom: 4px;
      }
      .stat .label {
        display: block;
        font-size: 0.75rem;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        color: rgba(241, 245, 249, 0.7);
      }
      .media {
        margin-top: auto;
      }
      .media img {
        width: 100%;
        border-radius: 18px;
        border: 1px solid rgba(148, 163, 184, 0.35);
        box-shadow: 0 18px 48px rgba(8, 7, 13, 0.55);
      }
      footer {
        font-size: 0.8rem;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        color: rgba(241, 245, 249, 0.6);
        text-align: center;
        margin-top: 12px;
      }
      @media (max-width: 640px) {
        .slides {
          width: min(92vw, 420px);
          gap: 36px;
        }
        .stat-grid {
          grid-template-columns: repeat(1, minmax(0, 1fr));
        }
        .frame {
          padding: 30px 22px;
        }
      }
    </style>
  </head>
  <body>
    <div class="ui">
      <header class="toolbar">
        <div class="brand">GPT Recap</div>
        <div class="actions">
          <button class="action" onclick="shareCurrent()">Share</button>
          <button class="action" onclick="window.print()">Save</button>
        </div>
      </header>
      <div class="slides">
        <section class="story tone-1">
          <div class="frame" data-index="0">
            <div class="layer">
            <header>
              <span class="badge">Recap</span>
              <h1>{{ context.first_date }} → {{ context.last_date }}</h1>
              <p>
                {{ context.conversation_count }} conversations • {{ context.message_count }} messages • {{ context.active_days }} active days.
                Avg {{ context.avg_messages_per_active_day }} messages each day you showed up.
              </p>
            </header>
            <div class="stat-grid">
              <div class="stat">
                <span class="value">{{ context.peak_month_value }}</span>
                <span class="label">Peak month — {{ context.peak_month_label }}</span>
              </div>
              <div class="stat">
                <span class="value">{{ context.quiet_month_value }}</span>
                <span class="label">Quiet month — {{ context.quiet_month_label }}</span>
              </div>
              <div class="stat">
                <span class="value">{{ context.busiest_day_value }}</span>
                <span class="label">Busiest day — {{ context.busiest_day_label }}</span>
              </div>
              <div class="stat">
                <span class="value">{{ context.longest_streak_length }}</span>
                <span class="label">Longest streak — {{ context.longest_streak_range }}</span>
              </div>
            </div>
            <div class="media">
              <img src="{{ plots['assistant_reply_length_words_hist.png'] }}" alt="Reply length distribution" />
            </div>
            <footer>Swipe or tap → to keep the vibe</footer>
          </div>
        </div>
        </section>

        <section class="story tone-2">
          <div class="frame" data-index="1">
            <div class="layer">
            <header>
              <span class="badge">Collab energy</span>
              <h2>Who drives the chat?</h2>
              <p>
                Assistant: {{ context.assistant_share }} • You: {{ context.user_share }} • Tools joined {{ context.tool_share }} of sessions and code appeared in {{ context.code_share }}.
              </p>
            </header>
            <div class="stat-grid">
              <div class="stat">
                <span class="value">{{ context.deep_share }}</span>
                <span class="label">Deep dives</span>
              </div>
              <div class="stat">
                <span class="value">{{ context.short_share }}</span>
                <span class="label">Quick loops</span>
              </div>
              <div class="stat">
                <span class="value">{{ context.one_share }}</span>
                <span class="label">One & done</span>
              </div>
              <div class="stat">
                <span class="value">{{ context.top_conversation_messages }}</span>
                <span class="label">Biggest convo: “{{ context.top_conversation_title }}”</span>
              </div>
            </div>
            <div class="media">
              <img src="{{ plots['messages_per_month_by_role.png'] }}" alt="Messages per month by role" />
            </div>
            <footer>Tag the teammate who owes the next prompt</footer>
          </div>
        </div>
        </section>

        <section class="story tone-3">
          <div class="frame" data-index="2">
            <div class="layer">
            <header>
              <span class="badge">Momentum</span>
              <h2>Streaks + pauses</h2>
              <p>
                Longest streak: {{ context.longest_streak_length }} days ({{ context.longest_streak_range }}). Longest pause: {{ context.longest_gap_length }} days ({{ context.longest_gap_range }}).
              </p>
            </header>
            <div class="stat-grid">
              <div class="stat">
                <span class="value">{{ context.busiest_day_value }}</span>
                <span class="label">Messages on {{ context.busiest_day_label }}</span>
              </div>
              <div class="stat">
                <span class="value">{{ context.assistant_peak_words }}</span>
                <span class="label">Wordiest month — {{ context.assistant_peak_label }}</span>
              </div>
            </div>
            <div class="media">
              <img src="{{ plots['messages_cumulative.png'] }}" alt="Cumulative messages" />
            </div>
            <footer>Proof you stayed building.</footer>
          </div>
        </div>
        </section>

        <section class="story tone-4">
          <div class="frame" data-index="3">
            <div class="layer">
            <header>
              <span class="badge">Reply craft</span>
              <h2>How long is the assist?</h2>
              <p>
                Peaks hit {{ context.assistant_peak_words }} words ({{ context.assistant_peak_label }}). Low tide: {{ context.assistant_low_words }} in {{ context.assistant_low_label }}.
                Last 30-day average sits at {{ context.latest_word_avg }} words / {{ context.latest_char_avg }} characters.
              </p>
            </header>
            <div class="media">
              <img src="{{ plots['assistant_reply_length_trend_words.png'] }}" alt="Assistant reply length trend" />
            </div>
            <footer>Keep the bars flowing.</footer>
          </div>
        </div>
        </section>

        <section class="story tone-5">
          <div class="frame" data-index="4">
            <div class="layer">
            <header>
              <span class="badge">When it happens</span>
              <h2>Your prime hours</h2>
              <p>
                Most action hits weekday mornings → afternoons, with late-night check-ins sprinkled after dark.
                Screenshot + share to show your grind.
              </p>
            </header>
            <div class="media">
              <img src="{{ plots['messages_weekday_hour_heatmap.png'] }}" alt="Weekday-hour heatmap" />
            </div>
            <footer>Last update: {{ context.latest_date_label }}</footer>
          </div>
        </div>
        </section>
      </div>
      <div class="share-panel" id="share-panel">
        <button onclick="shareCurrent('instagram')">Share to Instagram</button>
        <button onclick="shareCurrent('tiktok')">Share to TikTok</button>
        <button onclick="navigator.clipboard.writeText(window.location.href)">Copy link</button>
        <button onclick="toggleShare(false)">Close</button>
      </div>
    </div>
    <script>
      const slides = Array.from(document.querySelectorAll('.frame'));
      let current = 0;
      const sharePanel = document.getElementById('share-panel');

      function showSlide(index) {
        current = (index + slides.length) % slides.length;
        slides[current].scrollIntoView({ behavior: 'smooth', block: 'center' });
      }

      function shareCurrent(target) {
        if (target) {
          const message = `GPT Recap • Slide ${current + 1}`;
          if (navigator.share) {
            navigator.share({ title: 'GPT Recap', text: message, url: window.location.href });
          } else {
            alert('Link copied. Share manually in your ' + target + ' story.');
            navigator.clipboard.writeText(window.location.href);
          }
        } else {
          toggleShare(true);
        }
      }

      function toggleShare(open) {
        sharePanel.style.display = open ? 'flex' : 'none';
      }

      document.addEventListener('keydown', (evt) => {
        if (evt.key === 'ArrowRight') showSlide(current + 1);
        if (evt.key === 'ArrowLeft') showSlide(current - 1);
      });

      slides.forEach((frame, idx) => {
        frame.addEventListener('click', () => showSlide(idx + 1));
      });
    </script>
  </body>
</html>
"""

__all__ = ["render_story", "build_context"]
