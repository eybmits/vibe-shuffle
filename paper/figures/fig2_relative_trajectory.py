#!/usr/bin/env python3
"""Build Figure 2: relative inputs, trajectory, and eligible-song ranking.

Figure contract
---------------
Question
    How do personal references become a trajectory summary and one eligible
    next-song match?
Takeaway
    Vibe Shuffle uses changes from a listener's own references, summarizes a
    window as a trajectory mean, and selects the nearest unplayed catalog track
    in the corresponding region.
Evidence
    The relative changes and trajectory are illustrative. Candidate tracks,
    distances, played-track exclusion, and the selected song are derived from
    the repository's frozen 100-track catalog. Selection mirrors
    src/songSelection.js.
Form
    Three equal square editorial plots with direct labeling and no legend box.
Renderer
    Reproducible Matplotlib PDF (vector) plus a 300 dpi PNG preview.
"""

from __future__ import annotations

import os
from pathlib import Path
import tempfile

os.environ.setdefault(
    "MPLCONFIGDIR", str(Path(tempfile.gettempdir()) / "vibe_shuffle_mpl_cache")
)
os.environ.setdefault("MPLBACKEND", "Agg")

import matplotlib.pyplot as plt
from matplotlib.collections import LineCollection
from matplotlib.colors import to_rgba
from matplotlib.patches import FancyArrowPatch, Rectangle
import numpy as np

from fig1_affect_space import (
    HERE,
    QUADRANTS,
    add_quadrant_fields,
    load_catalog,
    quadrant_from_axes,
    set_style,
    style_affect_axes,
)
from paper_palette import (
    AXIS_LABEL_SIZE,
    BLUE,
    CORAL_DARK,
    GOLD,
    GRID,
    INK,
    MICRO_TEXT_SIZE,
    MID,
    MUTED,
    PANEL_LABEL_SIZE,
    PRIMARY_TEXT_SIZE,
    REFERENCE,
    ROW_RULE,
    TEAL,
    TEAL_LIGHT,
    SECONDARY_TEXT_SIZE,
    TICK_LABEL_SIZE,
)


CAMERA = TEAL
CARDIAC = BLUE
PLAYED = CORAL_DARK
ALTERNATIVE = MID
SELECTED_FILL = TEAL_LIGHT


def select_nearest_unplayed(
    tracks: list[dict[str, object]],
    target: tuple[float, float],
    played_titles: set[str],
) -> dict[str, object]:
    """Mirror the relevant Vibe ranking semantics from src/songSelection.js."""
    target_quadrant = quadrant_from_axes(*target)
    available = [track for track in tracks if str(track["title"]) not in played_titles]
    quadrant_pool = [
        track for track in available if track["quadrant"] == target_quadrant
    ]
    pool = quadrant_pool if quadrant_pool else available
    ranked = sorted(
        pool,
        key=lambda track: (
            np.hypot(
                float(track["valence"]) - target[0],
                float(track["energy"]) - target[1],
            ),
            str(track["id"]),
        ),
    )
    return ranked[0]


def _catmull_rom_path(
    x_values: np.ndarray,
    y_values: np.ndarray,
    *,
    samples_per_segment: int = 18,
) -> tuple[np.ndarray, np.ndarray]:
    """Return a smooth curve through every event point without SciPy."""
    points = np.column_stack((x_values, y_values))
    padded = np.vstack((points[0], points, points[-1]))
    samples: list[np.ndarray] = []
    for index in range(len(points) - 1):
        p0, p1, p2, p3 = padded[index : index + 4]
        t = np.linspace(0, 1, samples_per_segment, endpoint=False)[:, None]
        segment = 0.5 * (
            2 * p1
            + (-p0 + p2) * t
            + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t**2
            + (-p0 + 3 * p1 - 3 * p2 + p3) * t**3
        )
        samples.append(segment)
    samples.append(points[-1][None, :])
    curve = np.vstack(samples)
    return curve[:, 0], curve[:, 1]


def _set_panel_label(axis: plt.Axes, label: str) -> None:
    """Apply one consistent, title-free panel marker."""
    axis.set_title(
        label,
        loc="left",
        color=INK,
        fontsize=PANEL_LABEL_SIZE,
        fontweight="bold",
        pad=5,
    )
    axis.set_box_aspect(1)


def draw_relative_inputs(axis: plt.Axes, target: tuple[float, float]) -> None:
    """Show signed changes from personal references as a compact dot plot."""
    _set_panel_label(axis, "(a)")
    axis.set_xlim(-0.29, 0.29)
    axis.set_ylim(-0.58, 1.58)
    axis.set_yticks([])
    axis.set_xticks((-0.24, 0.0, 0.24))
    axis.set_xticklabels(
        ("below", "reference", "above"), fontsize=TICK_LABEL_SIZE
    )
    axis.set_xlabel(
        "Change from reference",
        fontsize=AXIS_LABEL_SIZE,
        color=MUTED,
        labelpad=3,
    )
    axis.tick_params(axis="x", colors=MUTED, length=2.5, width=0.6, pad=2)
    axis.axvline(0, color=REFERENCE, linewidth=0.8, linestyle=(0, (2, 2)), zorder=1)

    for y_value in (0.0, 1.0):
        axis.axhline(y_value, color=ROW_RULE, linewidth=0.65, zorder=0)

    rows = (
        {
            "y": 1.0,
            "delta": target[0] - 0.5,
            "color": CAMERA,
            "name": "Camera cues",
            "reference": "14 s reference",
            "symbol": "ΔV",
        },
        {
            "y": 0.0,
            "delta": target[1] - 0.5,
            "color": CARDIAC,
            "name": "Heart + RR",
            "reference": "120 s reference",
            "symbol": "ΔA",
        },
    )
    for row in rows:
        y_value = float(row["y"])
        delta = float(row["delta"])
        color = str(row["color"])
        axis.plot(
            [0, delta],
            [y_value, y_value],
            color=color,
            linewidth=2.2,
            solid_capstyle="round",
            zorder=3,
        )
        axis.scatter(
            [0],
            [y_value],
            s=23,
            facecolor="white",
            edgecolor=REFERENCE,
            linewidth=0.8,
            zorder=4,
        )
        axis.scatter(
            [delta],
            [y_value],
            s=38,
            facecolor=color,
            edgecolor="white",
            linewidth=0.7,
            zorder=5,
        )
        axis.text(
            -0.275,
            y_value + 0.16,
            str(row["name"]),
            ha="left",
            va="center",
            fontsize=PRIMARY_TEXT_SIZE,
            fontweight="bold",
            color=INK,
        )
        axis.text(
            -0.018,
            y_value - 0.16,
            str(row["reference"]),
            ha="right",
            va="center",
            fontsize=SECONDARY_TEXT_SIZE,
            color=MUTED,
        )
        axis.text(
            delta,
            y_value + 0.08,
            str(row["symbol"]),
            ha="center",
            va="bottom",
            fontsize=AXIS_LABEL_SIZE,
            fontweight="bold",
            color=color,
        )

    for location, spine in axis.spines.items():
        spine.set_visible(location == "bottom")
        spine.set_color(REFERENCE)
        spine.set_linewidth(0.7)


def draw_trajectory(
    axis: plt.Axes,
    valence: np.ndarray,
    arousal: np.ndarray,
    target: tuple[float, float],
) -> None:
    """Draw a directional phase path with an isolated arithmetic mean."""
    add_quadrant_fields(axis)
    style_affect_axes(axis, "Relative valence", "Relative arousal")
    _set_panel_label(axis, "(b)")
    axis.tick_params(axis="both", labelsize=TICK_LABEL_SIZE, pad=2)
    axis.xaxis.label.set_size(AXIS_LABEL_SIZE)
    axis.yaxis.label.set_size(AXIS_LABEL_SIZE)
    axis.xaxis.labelpad = 3
    axis.yaxis.labelpad = 3
    axis.yaxis.set_label_coords(-0.12, 0.5)

    quadrant_labels = {
        "tense": (0.035, 0.965, "left", "top"),
        "happy": (0.965, 0.965, "right", "top"),
        "sad_low": (0.035, 0.035, "left", "bottom"),
        "relaxed": (0.965, 0.035, "right", "bottom"),
    }
    for key, (x_value, y_value, horizontal, vertical) in quadrant_labels.items():
        axis.text(
            x_value,
            y_value,
            str(QUADRANTS[key]["label"]),
            transform=axis.transAxes,
            ha=horizontal,
            va=vertical,
            fontsize=MICRO_TEXT_SIZE,
            fontweight="bold",
            color=str(QUADRANTS[key]["dark"]),
            zorder=2,
        )

    smooth_x, smooth_y = _catmull_rom_path(valence, arousal)
    smooth_points = np.column_stack((smooth_x, smooth_y))
    segments = np.stack((smooth_points[:-1], smooth_points[1:]), axis=1)
    segment_progress = np.linspace(0.0, 1.0, len(segments))
    trajectory_line = LineCollection(
        segments,
        colors=[to_rgba(CAMERA, 0.32 + 0.68 * value) for value in segment_progress],
        linewidths=1.55,
        capstyle="round",
        joinstyle="round",
        zorder=4,
    )
    axis.add_collection(trajectory_line)

    point_progress = np.linspace(0.0, 1.0, len(valence))
    axis.scatter(
        valence[1:-1],
        arousal[1:-1],
        s=12 + 16 * point_progress[1:-1],
        facecolor=[
            to_rgba(CAMERA, 0.38 + 0.60 * value) for value in point_progress[1:-1]
        ],
        edgecolor="white",
        linewidth=0.45,
        zorder=5,
    )
    axis.scatter(
        [valence[0]],
        [arousal[0]],
        s=31,
        facecolor="white",
        edgecolor=REFERENCE,
        linewidth=1.0,
        zorder=7,
    )
    axis.scatter(
        [valence[-1]],
        [arousal[-1]],
        s=35,
        facecolor=CAMERA,
        edgecolor="white",
        linewidth=0.75,
        zorder=7,
    )
    axis.scatter(
        [target[0]],
        [target[1]],
        s=52,
        marker="D",
        facecolor=GOLD,
        edgecolor="white",
        linewidth=0.9,
        zorder=8,
    )

    direction = FancyArrowPatch(
        (valence[-2], arousal[-2]),
        (valence[-1], arousal[-1]),
        arrowstyle="-|>",
        mutation_scale=8,
        color=CAMERA,
        linewidth=1.1,
        shrinkA=8,
        shrinkB=5,
        zorder=6,
    )
    axis.add_patch(direction)

    axis.annotate(
        "mean",
        xy=target,
        xytext=(0, -13),
        textcoords="offset points",
        ha="center",
        va="top",
        fontsize=MICRO_TEXT_SIZE,
        fontweight="bold",
        color=INK,
        zorder=9,
    )
    axis.annotate(
        "start",
        xy=(valence[0], arousal[0]),
        xytext=(0.37, 0.43),
        ha="center",
        va="center",
        fontsize=MICRO_TEXT_SIZE,
        fontweight="bold",
        color=MUTED,
        arrowprops={
            "arrowstyle": "-",
            "color": MUTED,
            "linewidth": 0.5,
            "shrinkA": 2,
            "shrinkB": 6,
        },
        zorder=8,
    )
    axis.text(
        0.92,
        0.62,
        "end",
        ha="right",
        va="center",
        fontsize=MICRO_TEXT_SIZE,
        fontweight="bold",
        color=CAMERA,
        zorder=8,
    )


def _ranked_candidates(
    tracks: list[dict[str, object]],
    target: tuple[float, float],
    *,
    count: int,
) -> list[tuple[float, dict[str, object]]]:
    """Return nearest candidates in the target region, including played tracks."""
    target_quadrant = quadrant_from_axes(*target)
    ranked = [
        (
            float(
                np.hypot(
                    float(track["valence"]) - target[0],
                    float(track["energy"]) - target[1],
                )
            ),
            track,
        )
        for track in tracks
        if track["quadrant"] == target_quadrant
    ]
    return sorted(ranked, key=lambda item: (item[0], str(item[1]["id"])))[:count]


def draw_candidate_ranking(
    axis: plt.Axes,
    candidates: list[tuple[float, dict[str, object]]],
    *,
    played_titles: set[str],
    chosen_title: str,
) -> None:
    """Show the selection rule as a direct, collision-free ranked dot plot."""
    _set_panel_label(axis, "(c)")
    axis.set_xlim(0, 0.10)
    axis.set_ylim(-0.75, len(candidates) - 0.25)
    axis.set_xticks((0.0, 0.05, 0.10))
    axis.set_xticklabels(("0", "0.05", "0.10"), fontsize=TICK_LABEL_SIZE)
    for tick_label, alignment in zip(
        axis.get_xticklabels(), ("left", "center", "right")
    ):
        tick_label.set_horizontalalignment(alignment)
    axis.set_yticks([])
    axis.set_xlabel("Distance from mean", fontsize=AXIS_LABEL_SIZE, labelpad=3)
    axis.tick_params(axis="x", colors=MUTED, length=2.5, width=0.6, pad=2)
    axis.grid(axis="x", color=GRID, linewidth=0.6, zorder=0)

    row_y = np.arange(len(candidates) - 1, -1, -1, dtype=float)
    selected_index = next(
        index
        for index, (_, track) in enumerate(candidates)
        if str(track["title"]) == chosen_title
    )
    selected_y = row_y[selected_index]
    axis.add_patch(
        Rectangle(
            (0, selected_y - 0.42),
            0.10,
            0.84,
            facecolor=SELECTED_FILL,
            edgecolor="none",
            zorder=0,
        )
    )

    for y_value in row_y:
        axis.axhline(y_value - 0.50, color=ROW_RULE, linewidth=0.55, zorder=1)

    for y_value, (distance, track) in zip(row_y, candidates):
        title = str(track["title"])
        is_played = title in played_titles
        is_selected = title == chosen_title
        marker_y = y_value + 0.15
        axis.text(
            0.002,
            marker_y,
            title,
            ha="left",
            va="center",
            fontsize=AXIS_LABEL_SIZE,
            fontweight="bold" if is_selected else "normal",
            color=INK,
            zorder=5,
        )
        axis.text(
            0.002,
            y_value - 0.15,
            str(track["artist"]),
            ha="left",
            va="center",
            fontsize=MICRO_TEXT_SIZE,
            color=MUTED,
            zorder=5,
        )

        if is_played:
            axis.scatter(
                [distance],
                [marker_y],
                s=29,
                marker="x",
                color=PLAYED,
                linewidth=1.45,
                zorder=6,
            )
            status = "PLAYED"
            status_color = PLAYED
        elif is_selected:
            axis.scatter(
                [distance],
                [marker_y],
                s=34,
                marker="D",
                facecolor=CAMERA,
                edgecolor="white",
                linewidth=0.65,
                zorder=6,
            )
            status = "SELECTED"
            status_color = CAMERA
        else:
            axis.scatter(
                [distance],
                [marker_y],
                s=23,
                facecolor="white",
                edgecolor=ALTERNATIVE,
                linewidth=0.85,
                zorder=6,
            )
            status = "eligible"
            status_color = MUTED

        axis.text(
            0.097,
            marker_y,
            status,
            ha="right",
            va="center",
            fontsize=MICRO_TEXT_SIZE,
            fontweight="bold" if is_selected else "normal",
            color=status_color,
            zorder=5,
        )

    for location, spine in axis.spines.items():
        spine.set_visible(location == "bottom")
        spine.set_color(REFERENCE)
        spine.set_linewidth(0.7)


def build_figure() -> plt.Figure:
    """Build the three-panel editorial figure."""
    set_style()
    tracks = load_catalog()

    # Illustrative, event-driven samples from one listening window. The path
    # rises from near neutral, arcs through a high-activation peak, and settles
    # at a more positive endpoint. Its exact arithmetic mean is (0.62, 0.73).
    valence = np.array(
        [0.44, 0.47, 0.50, 0.54, 0.58, 0.62, 0.66, 0.69, 0.72, 0.75, 0.85]
    )
    arousal = np.array(
        [0.50, 0.56, 0.64, 0.72, 0.79, 0.84, 0.86, 0.84, 0.80, 0.76, 0.72]
    )
    target = (float(valence.mean()), float(arousal.mean()))
    if not np.allclose(target, (0.62, 0.73)):
        raise ValueError(f"Illustrative target drifted: {target}")

    played_titles = {"As It Was"}
    chosen = select_nearest_unplayed(tracks, target, played_titles)
    if chosen["title"] != "CUFF IT":
        raise ValueError(
            f"Expected CUFF IT as nearest eligible example, found {chosen['title']}"
        )
    candidates = _ranked_candidates(tracks, target, count=5)
    if [track["title"] for _, track in candidates[:2]] != ["As It Was", "CUFF IT"]:
        raise ValueError("Nearest-candidate ordering drifted")

    figure = plt.figure(figsize=(7.16, 2.68))
    grid = figure.add_gridspec(
        1,
        3,
        left=0.030,
        right=0.990,
        bottom=0.135,
        top=0.895,
        wspace=0.22,
    )
    input_axis = figure.add_subplot(grid[0, 0])
    trajectory_axis = figure.add_subplot(grid[0, 1])
    ranking_axis = figure.add_subplot(grid[0, 2])

    draw_relative_inputs(input_axis, target)
    draw_trajectory(trajectory_axis, valence, arousal, target)
    draw_candidate_ranking(
        ranking_axis,
        candidates,
        played_titles=played_titles,
        chosen_title=str(chosen["title"]),
    )
    return figure


def main() -> None:
    figure = build_figure()
    pdf_path = HERE / "fig2_relative_trajectory.pdf"
    png_path = HERE / "fig2_relative_trajectory.png"
    figure.savefig(pdf_path)
    figure.savefig(png_path, dpi=300)
    plt.close(figure)
    print(pdf_path)
    print(png_path)


if __name__ == "__main__":
    main()
