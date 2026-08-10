#!/usr/bin/env python3
"""Create Figure 3: session-level paired estimation plots.

Chart contract
--------------
Question:
    How did session-level ratings change from Random to Vibe, and how
    uncertain is the mean paired change?
Takeaway:
    Mood fit moves in a positive but heterogeneous direction; liking remains
    near zero. Both reported 95% confidence intervals cross zero.
Form:
    Native single-column 2x2 display with four physically square panels. Each
    outcome combines a connected-pairs panel with a separate estimation panel
    containing individual differences, a deterministic bootstrap distribution
    of the mean, and the reported t-based 95% confidence interval.
Data:
    Fifteen published session-level means plus the supplied inferential
    summary. No trial-level values are reconstructed.
Surface:
    Compact ACM single-column figure, exported as vector PDF and 300 dpi PNG.
"""

from __future__ import annotations

import csv
from dataclasses import dataclass
from pathlib import Path

import matplotlib as mpl

mpl.use("Agg")

import matplotlib.pyplot as plt
import numpy as np
from matplotlib.gridspec import GridSpec

from paper_palette import (
    AXIS_LABEL_SIZE,
    CONNECTOR,
    GOLD,
    GOLD_DARK,
    GRID,
    INK,
    MID,
    MUTED,
    PANEL_LABEL_SIZE,
    SECONDARY_TEXT_SIZE,
    TEAL,
    TICK_LABEL_SIZE,
)


NEUTRAL = MID
MOOD = TEAL
LIKING = GOLD

OUTPUT_DIR = Path(__file__).resolve().parent
RESULTS_DIR = OUTPUT_DIR.parent / "results"
PARTICIPANT_PATH = RESULTS_DIR / "participant_means.csv"
SUMMARY_PATH = RESULTS_DIR / "pilot_summary.csv"
PDF_PATH = OUTPUT_DIR / "fig3_pilot_evidence.pdf"
PNG_PATH = OUTPUT_DIR / "fig3_pilot_evidence.png"


@dataclass(frozen=True)
class OutcomeSpec:
    label: str
    random_field: str
    vibe_field: str
    color: str
    stroke_color: str
    seed: int


@dataclass(frozen=True)
class Summary:
    outcome: str
    n: int
    vibe_mean: float
    random_mean: float
    difference: float
    ci_low: float
    ci_high: float
    p_t: float
    p_w: float


OUTCOMES = (
    OutcomeSpec(
        label="Mood fit",
        random_field="mood_fit_random",
        vibe_field="mood_fit_vibe",
        color=MOOD,
        stroke_color=MOOD,
        seed=20260713,
    ),
    OutcomeSpec(
        label="Liking",
        random_field="liking_random",
        vibe_field="liking_vibe",
        color=LIKING,
        stroke_color=GOLD_DARK,
        seed=20260714,
    ),
)


def _configure_style() -> None:
    mpl.rcParams.update(
        {
            "font.family": "DejaVu Sans",
            "font.size": SECONDARY_TEXT_SIZE,
            "axes.labelsize": AXIS_LABEL_SIZE,
            "axes.titlesize": PANEL_LABEL_SIZE,
            "xtick.labelsize": TICK_LABEL_SIZE,
            "ytick.labelsize": TICK_LABEL_SIZE,
            "axes.unicode_minus": False,
            "pdf.fonttype": 42,
            "ps.fonttype": 42,
            "savefig.facecolor": "white",
            "figure.facecolor": "white",
        }
    )


def _load_participants() -> list[dict[str, str]]:
    with PARTICIPANT_PATH.open(newline="", encoding="utf-8") as source_file:
        rows = list(csv.DictReader(source_file))
    if len(rows) != 15:
        raise ValueError(f"Expected 15 session rows, found {len(rows)}.")
    identifiers = [row["participant"] for row in rows]
    if len(set(identifiers)) != len(identifiers):
        raise ValueError("Session analysis identifiers must be unique.")
    for row in rows:
        for outcome in OUTCOMES:
            for field in (outcome.random_field, outcome.vibe_field):
                value = float(row[field])
                if not 1.0 <= value <= 7.0:
                    raise ValueError(f"{field} for {row['participant']} is outside 1-7.")
    return rows


def _load_summaries() -> dict[str, Summary]:
    with SUMMARY_PATH.open(newline="", encoding="utf-8") as source_file:
        rows = list(csv.DictReader(source_file))
    summaries = {
        row["outcome"]: Summary(
            outcome=row["outcome"],
            n=int(row["n"]),
            vibe_mean=float(row["vibe_mean"]),
            random_mean=float(row["random_mean"]),
            difference=float(row["difference"]),
            ci_low=float(row["ci_low"]),
            ci_high=float(row["ci_high"]),
            p_t=float(row["p_t_one_sided"]),
            p_w=float(row["p_w_one_sided"]),
        )
        for row in rows
    }
    if set(summaries) != {outcome.label for outcome in OUTCOMES}:
        raise ValueError("Pilot summary outcomes do not match the figure specification.")
    return summaries


def _values(
    rows: list[dict[str, str]], outcome: OutcomeSpec
) -> tuple[np.ndarray, np.ndarray, np.ndarray]:
    random_values = np.array(
        [float(row[outcome.random_field]) for row in rows], dtype=float
    )
    vibe_values = np.array(
        [float(row[outcome.vibe_field]) for row in rows], dtype=float
    )
    differences = np.round(vibe_values - random_values, decimals=10)
    return random_values, vibe_values, differences


def _validate_summary(
    random_values: np.ndarray,
    vibe_values: np.ndarray,
    differences: np.ndarray,
    summary: Summary,
) -> None:
    checks = (
        (len(differences), summary.n, 0.0, "sample size"),
        (float(vibe_values.mean()), summary.vibe_mean, 0.006, "Vibe mean"),
        (float(random_values.mean()), summary.random_mean, 0.006, "Random mean"),
        (float(differences.mean()), summary.difference, 0.006, "paired mean"),
    )
    for observed, reported, tolerance, label in checks:
        if abs(observed - reported) > tolerance:
            raise ValueError(
                f"{summary.outcome} {label} does not match: "
                f"{observed:.4f} versus {reported:.4f}."
            )
    if not summary.ci_low <= summary.difference <= summary.ci_high:
        raise ValueError(f"Invalid reported interval for {summary.outcome}.")


def _bootstrap_means(differences: np.ndarray, seed: int) -> np.ndarray:
    rng = np.random.default_rng(seed)
    draws = rng.choice(
        differences,
        size=(20_000, differences.size),
        replace=True,
    )
    return draws.mean(axis=1)


def _kde(values: np.ndarray, grid: np.ndarray) -> np.ndarray:
    standard_deviation = float(values.std(ddof=1))
    bandwidth = max(
        1.06 * standard_deviation * values.size ** (-1.0 / 5.0),
        0.035,
    )
    offsets = (grid[:, None] - values[None, :]) / bandwidth
    density = np.exp(-0.5 * offsets**2).mean(axis=1)
    density /= bandwidth * np.sqrt(2.0 * np.pi)
    return density


def _mean_ci(values: np.ndarray) -> tuple[float, float, float]:
    # Two-sided 95% t critical value for df=14.
    critical = 2.1447866879178
    mean = float(values.mean())
    half_width = critical * float(values.std(ddof=1)) / np.sqrt(values.size)
    return mean, mean - half_width, mean + half_width


def _style_rating_axis(axis: mpl.axes.Axes) -> None:
    axis.set_xlim(-0.22, 1.22)
    axis.set_ylim(0.8, 7.2)
    axis.set_yticks((1, 3, 5, 7))
    axis.set_box_aspect(1)
    axis.grid(axis="y", color=GRID, linewidth=0.48, zorder=0)
    for spine in ("right", "top"):
        axis.spines[spine].set_visible(False)
    axis.spines["left"].set_color(NEUTRAL)
    axis.spines["bottom"].set_color(NEUTRAL)
    axis.spines["left"].set_linewidth(0.65)
    axis.spines["bottom"].set_linewidth(0.65)
    axis.tick_params(colors=MUTED, length=2.4, width=0.6)


def _plot_pairs(
    axis: mpl.axes.Axes,
    panel_letter: str,
    outcome: OutcomeSpec,
    random_values: np.ndarray,
    vibe_values: np.ndarray,
    summary: Summary,
    *,
    show_xlabel: bool,
) -> None:
    _style_rating_axis(axis)
    order = np.argsort(random_values + vibe_values)
    offsets = np.zeros(random_values.size)
    offsets[order] = np.linspace(-0.028, 0.028, random_values.size)

    for index, offset in enumerate(offsets):
        axis.plot(
            (0.0 + offset, 1.0 + offset),
            (random_values[index], vibe_values[index]),
            color=CONNECTOR,
            linewidth=0.72,
            alpha=0.72,
            zorder=1,
        )
    axis.scatter(
        offsets,
        random_values,
        s=19,
        facecolor="white",
        edgecolor=NEUTRAL,
        linewidth=0.8,
        zorder=2,
    )
    axis.scatter(
        1.0 + offsets,
        vibe_values,
        s=20,
        facecolor=outcome.color,
        edgecolor="white",
        linewidth=0.55,
        zorder=3,
    )

    random_mean, random_low, random_high = _mean_ci(random_values)
    vibe_mean, vibe_low, vibe_high = _mean_ci(vibe_values)
    for x_value, mean, low, high, facecolor, edgecolor in (
        (-0.10, random_mean, random_low, random_high, "white", NEUTRAL),
        (
            1.10,
            vibe_mean,
            vibe_low,
            vibe_high,
            outcome.color,
            outcome.stroke_color,
        ),
    ):
        axis.vlines(
            x_value,
            low,
            high,
            color=edgecolor,
            linewidth=1.25,
            zorder=4,
        )
        axis.hlines(
            (low, high),
            x_value - 0.055,
            x_value + 0.055,
            color=edgecolor,
            linewidth=0.95,
            zorder=4,
        )
        axis.scatter(
            x_value,
            mean,
            s=42,
            marker="D",
            facecolor=facecolor,
            edgecolor=edgecolor,
            linewidth=1.05,
            zorder=5,
        )

    axis.set_title(
        panel_letter,
        loc="left",
        pad=2,
        color=INK,
        fontweight="bold",
    )
    axis.set_xticks(
        (0.0, 1.0),
        (
            "Random",
            "Vibe",
        ),
    )
    axis.tick_params(axis="x", labelbottom=show_xlabel)


def _stacked_y(values: np.ndarray) -> np.ndarray:
    rounded = np.round(values, decimals=8)
    y_values = np.full(values.size, 0.82)
    for unique_value in np.unique(rounded):
        indices = np.flatnonzero(rounded == unique_value)
        if indices.size == 1:
            continue
        offsets = (np.arange(indices.size) - (indices.size - 1) / 2.0) * 0.035
        y_values[indices] += offsets
    return y_values


def _style_difference_axis(
    axis: mpl.axes.Axes,
    *,
    show_xlabel: bool,
) -> None:
    axis.set_xlim(-3.25, 3.25)
    axis.set_ylim(0.0, 1.0)
    axis.set_xticks((-3, -1, 0, 1, 3))
    axis.set_yticks([])
    if show_xlabel:
        axis.set_xlabel("Vibe - Random", color=INK, labelpad=2)
    axis.set_box_aspect(1)
    axis.grid(axis="x", color=GRID, linewidth=0.48, zorder=0)
    axis.axvline(
        0.0,
        color=MUTED,
        linewidth=0.8,
        linestyle=(0, (3, 3)),
        zorder=1,
    )
    for spine in ("left", "right", "top"):
        axis.spines[spine].set_visible(False)
    axis.spines["bottom"].set_color(NEUTRAL)
    axis.spines["bottom"].set_linewidth(0.65)
    axis.tick_params(
        axis="x",
        colors=MUTED,
        length=2.4,
        width=0.6,
        labelbottom=show_xlabel,
    )


def _plot_differences(
    axis: mpl.axes.Axes,
    panel_letter: str,
    outcome: OutcomeSpec,
    differences: np.ndarray,
    summary: Summary,
    *,
    show_xlabel: bool,
) -> None:
    _style_difference_axis(axis, show_xlabel=show_xlabel)
    bootstrap_means = _bootstrap_means(differences, outcome.seed)
    grid = np.linspace(-3.25, 3.25, 500)
    density = _kde(bootstrap_means, grid)
    density /= density.max()

    density_base = 0.44
    density_height = 0.18
    axis.fill_between(
        grid,
        density_base,
        density_base + density_height * density,
        facecolor=outcome.color,
        alpha=0.17,
        edgecolor="none",
        zorder=2,
    )
    axis.plot(
        grid,
        density_base + density_height * density,
        color=outcome.stroke_color,
        linewidth=1.05,
        zorder=3,
    )

    axis.scatter(
        differences,
        _stacked_y(differences),
        s=20,
        facecolor=outcome.color,
        edgecolor="white",
        linewidth=0.45,
        zorder=4,
    )

    effect_y = 0.13
    axis.hlines(
        effect_y,
        summary.ci_low,
        summary.ci_high,
        color=INK,
        linewidth=1.30,
        zorder=5,
    )
    axis.vlines(
        (summary.ci_low, summary.ci_high),
        effect_y - 0.035,
        effect_y + 0.035,
        color=INK,
        linewidth=0.90,
        zorder=5,
    )
    axis.scatter(
        summary.difference,
        effect_y,
        s=42,
        marker="D",
        facecolor=outcome.color,
        edgecolor="white",
        linewidth=0.65,
        zorder=6,
    )

    axis.set_title(
        panel_letter,
        loc="left",
        pad=2,
        color=INK,
        fontweight="bold",
    )
    axis.text(
        0.50,
        0.285,
        f"Mean {summary.difference:+.2f}\n"
        f"95% CI [{summary.ci_low:.2f}, {summary.ci_high:.2f}]",
        transform=axis.transAxes,
        ha="center",
        va="center",
        fontsize=SECONDARY_TEXT_SIZE,
        linespacing=1.14,
        color=INK,
        bbox={
            "boxstyle": "square,pad=0.02",
            "facecolor": "white",
            "edgecolor": "none",
            "alpha": 0.94,
        },
    )


def build_figure() -> mpl.figure.Figure:
    _configure_style()
    participants = _load_participants()
    summaries = _load_summaries()

    # Build at the final ACM column width so typography is never downscaled.
    figure = plt.figure(figsize=(3.34, 3.36))
    grid = GridSpec(
        2,
        2,
        figure=figure,
        width_ratios=(1.0, 1.0),
        left=0.17,
        right=0.990,
        bottom=0.110,
        top=0.950,
        hspace=0.21,
        wspace=0.14,
    )
    figure.supylabel(
        "Rating (1-7)",
        x=0.035,
        y=0.53,
        fontsize=AXIS_LABEL_SIZE,
        color=INK,
    )

    for row_index, (outcome, letters) in enumerate(
        zip(OUTCOMES, (("(a)", "(b)"), ("(c)", "(d)")))
    ):
        random_values, vibe_values, differences = _values(participants, outcome)
        summary = summaries[outcome.label]
        _validate_summary(random_values, vibe_values, differences, summary)

        pair_axis = figure.add_subplot(grid[row_index, 0])
        difference_axis = figure.add_subplot(grid[row_index, 1])
        _plot_pairs(
            pair_axis,
            letters[0],
            outcome,
            random_values,
            vibe_values,
            summary,
            show_xlabel=row_index == 1,
        )
        _plot_differences(
            difference_axis,
            letters[1],
            outcome,
            differences,
            summary,
            show_xlabel=row_index == 1,
        )

    return figure


def main() -> None:
    figure = build_figure()
    metadata = {
        "Title": "Session-level paired outcomes in the Vibe Shuffle pilot",
        "Subject": (
            "Random-to-Vibe session-level means, paired differences, "
            "bootstrap mean distributions, and reported confidence intervals"
        ),
        "Creator": "Vibe Shuffle reproducible figure script",
    }
    figure.savefig(PDF_PATH, format="pdf", metadata=metadata)
    figure.savefig(PNG_PATH, format="png", dpi=300)
    plt.close(figure)
    print(PDF_PATH)
    print(PNG_PATH)


if __name__ == "__main__":
    main()
