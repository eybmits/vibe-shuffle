#!/usr/bin/env python3
"""Build Figure 1: independently drawn conceptual foundations.

Figure contract
---------------
Question
    Which literature concepts motivate Vibe Shuffle's readable two-axis
    interface, and how should the cited HRV-frequency evidence be interpreted?
Takeaway
    Russell and Thayer provide continuous and categorical affect vocabularies.
    Balaji et al. provide group-level frequency context, not an individual
    emotion classifier. The third panel is deliberately synthetic and data-free.
Renderer
    Reproducible Matplotlib PDF (vector) plus a 300 dpi PNG preview.
Palette
    Muted, colorblind-safe affect colors with direct labels and restrained
    keylines so the figure remains readable without a legend.
"""

from __future__ import annotations

import json
import os
from pathlib import Path
import re
import tempfile

os.environ.setdefault(
    "MPLCONFIGDIR", str(Path(tempfile.gettempdir()) / "vibe_shuffle_mpl_cache")
)
os.environ.setdefault("MPLBACKEND", "Agg")

import matplotlib as mpl
import matplotlib.pyplot as plt
from matplotlib.patches import Circle, FancyBboxPatch, Rectangle
import numpy as np

from paper_palette import (
    BLUE,
    BLUE_DARK,
    BLUE_LIGHT,
    BLUE_MID,
    CORAL,
    CORAL_DARK,
    CORAL_LIGHT,
    CORAL_MID,
    GOLD_MID,
    GRID,
    INK,
    MUTED,
    PURPLE,
    PURPLE_DARK,
    PURPLE_LIGHT,
    PURPLE_MID,
    REFERENCE,
    TEAL,
    TEAL_DARK,
    TEAL_LIGHT,
    TEAL_MID,
)

HERE = Path(__file__).resolve().parent
REPO_ROOT = HERE.parents[1]
CATALOG_PATH = REPO_ROOT / "src" / "studyCatalog.js"

QUADRANTS = {
    "happy": {
        "label": "ENERGETIC",
        "color": TEAL,
        "dark": TEAL_DARK,
        "fill": TEAL_LIGHT,
    },
    "relaxed": {
        "label": "CALM",
        "color": BLUE,
        "dark": BLUE_DARK,
        "fill": BLUE_LIGHT,
    },
    "tense": {
        "label": "TENSE",
        "color": CORAL,
        "dark": CORAL_DARK,
        "fill": CORAL_LIGHT,
    },
    "sad_low": {
        "label": "MELANCHOLIC",
        "color": PURPLE,
        "dark": PURPLE_DARK,
        "fill": PURPLE_LIGHT,
    },
}


def set_style() -> None:
    """Set stable research-figure defaults."""
    mpl.rcParams.update(
        {
            "font.family": "DejaVu Sans",
            "font.size": 8.5,
            "axes.titlesize": 9.6,
            "axes.titleweight": "bold",
            "axes.labelsize": 8.5,
            "axes.labelcolor": INK,
            "axes.edgecolor": REFERENCE,
            "axes.linewidth": 0.75,
            "xtick.labelsize": 8.5,
            "ytick.labelsize": 8.5,
            "xtick.color": MUTED,
            "ytick.color": MUTED,
            "xtick.major.size": 3,
            "ytick.major.size": 3,
            "xtick.major.width": 0.65,
            "ytick.major.width": 0.65,
            "pdf.fonttype": 42,
            "ps.fonttype": 42,
            "savefig.facecolor": "white",
            "figure.facecolor": "white",
        }
    )


def quadrant_from_axes(valence: float, energy: float) -> str:
    """Mirror src/spotifyLibrary.js exactly."""
    if valence >= 0.5 and energy >= 0.5:
        return "happy"
    if valence >= 0.5 and energy < 0.5:
        return "relaxed"
    if valence < 0.5 and energy >= 0.5:
        return "tense"
    return "sad_low"


def _decode_js_string(value: str) -> str:
    """Decode the JSON-compatible escape sequences used by the catalog."""
    return json.loads(f'"{value}"')


def load_catalog(path: Path = CATALOG_PATH) -> list[dict[str, object]]:
    """Read the frozen JS catalog without duplicating its 100 records."""
    text = path.read_text(encoding="utf-8")
    pattern = re.compile(
        r'\{\s*spotifyId:\s*"(?P<id>(?:\\.|[^"])*)",\s*'
        r'title:\s*"(?P<title>(?:\\.|[^"])*)",\s*'
        r'artist:\s*"(?P<artist>(?:\\.|[^"])*)",\s*'
        r"valence:\s*(?P<valence>[0-9.]+),\s*"
        r"energy:\s*(?P<energy>[0-9.]+),"
    )
    tracks: list[dict[str, object]] = []
    for match in pattern.finditer(text):
        valence = float(match.group("valence"))
        energy = float(match.group("energy"))
        tracks.append(
            {
                "id": _decode_js_string(match.group("id")),
                "title": _decode_js_string(match.group("title")),
                "artist": _decode_js_string(match.group("artist")),
                "valence": valence,
                "energy": energy,
                "quadrant": quadrant_from_axes(valence, energy),
            }
        )

    if len(tracks) != 100:
        raise ValueError(f"Expected 100 study tracks in {path}, found {len(tracks)}")
    counts = {
        key: sum(track["quadrant"] == key for track in tracks) for key in QUADRANTS
    }
    if any(count != 25 for count in counts.values()):
        raise ValueError(f"Expected 25 tracks per quadrant, found {counts}")
    return tracks


def add_quadrant_fields(ax: plt.Axes) -> None:
    """Draw the same quiet four-quadrant field on an axis."""
    fields = [
        (0.0, 0.5, "tense"),
        (0.5, 0.5, "happy"),
        (0.0, 0.0, "sad_low"),
        (0.5, 0.0, "relaxed"),
    ]
    for x, y, key in fields:
        ax.add_patch(
            Rectangle(
                (x, y),
                0.5,
                0.5,
                facecolor=QUADRANTS[key]["fill"],
                edgecolor="none",
                zorder=0,
            )
        )
    ax.axvline(0.5, color=REFERENCE, lw=0.8, ls=(0, (2.2, 2.2)), zorder=1)
    ax.axhline(0.5, color=REFERENCE, lw=0.8, ls=(0, (2.2, 2.2)), zorder=1)
    ax.grid(True, color=GRID, lw=0.55, alpha=0.72, zorder=0)


def style_affect_axes(ax: plt.Axes, x_label: str, y_label: str) -> None:
    """Apply shared scales and restrained axis styling."""
    ax.set_xlim(0, 1)
    ax.set_ylim(0, 1)
    ax.set_aspect("equal", adjustable="box")
    ax.set_xticks([0, 0.5, 1])
    ax.set_yticks([0, 0.5, 1])
    ax.set_xticklabels(["0", "0.5", "1"])
    ax.set_yticklabels(["0", "0.5", "1"])
    ax.set_xlabel(x_label, labelpad=5)
    ax.set_ylabel(y_label, labelpad=5)
    for spine in ax.spines.values():
        spine.set_color(REFERENCE)
        spine.set_linewidth(0.75)


def add_quadrant_labels(ax: plt.Axes) -> None:
    """Directly label the field; no legend lookup is needed."""
    anchors = {
        "tense": (0.035, 0.965, "left", "top"),
        "happy": (0.965, 0.965, "right", "top"),
        "sad_low": (0.035, 0.035, "left", "bottom"),
        "relaxed": (0.965, 0.035, "right", "bottom"),
    }
    for key, (x, y, ha, va) in anchors.items():
        label = QUADRANTS[key]["label"]
        ax.text(
            x,
            y,
            label,
            transform=ax.transAxes,
            ha=ha,
            va=va,
            color=QUADRANTS[key]["color"],
            fontsize=8.5,
            fontweight="bold",
            zorder=5,
        )


def find_track(tracks: list[dict[str, object]], title: str) -> dict[str, object]:
    matches = [track for track in tracks if track["title"] == title]
    if len(matches) != 1:
        raise ValueError(f"Expected one catalog track named {title!r}, found {len(matches)}")
    return matches[0]


def build_figure() -> plt.Figure:
    """Draw three original, square conceptual panels.

    Panels A and B redraw literature concepts with new geometry. Panel C is a
    synthetic teaching schematic: it intentionally contains neither the eight
    emotion-specific ridgelines nor any numerical observations from Balaji et
    al. (2025).
    """
    set_style()

    fig = plt.figure(figsize=(7.16, 2.72))
    grid = fig.add_gridspec(
        1,
        3,
        left=0.035,
        right=0.985,
        bottom=0.155,
        top=0.855,
        wspace=0.28,
    )
    circumplex_ax = fig.add_subplot(grid[0, 0])
    vocabulary_ax = fig.add_subplot(grid[0, 1])
    frequency_ax = fig.add_subplot(grid[0, 2])

    # Panel A: an original continuous rendering of Russell's affect coordinate.
    circumplex_ax.set_xlim(-1.0, 1.0)
    circumplex_ax.set_ylim(-1.0, 1.0)
    circumplex_ax.set_aspect("equal", adjustable="box")
    circumplex_ax.set_box_aspect(1)
    circumplex_ax.set_title("(a)", loc="left", color=INK, pad=7, fontsize=8.2)

    affect_fields = [
        (-1.0, 0.0, CORAL_LIGHT),
        (0.0, 0.0, TEAL_LIGHT),
        (-1.0, -1.0, PURPLE_LIGHT),
        (0.0, -1.0, BLUE_LIGHT),
    ]
    for x0, y0, color in affect_fields:
        circumplex_ax.add_patch(
            Rectangle((x0, y0), 1.0, 1.0, facecolor=color, edgecolor="none")
        )
    for radius in (0.36, 0.72):
        circumplex_ax.add_patch(
            Circle(
                (0, 0),
                radius,
                facecolor="white",
                edgecolor=REFERENCE,
                linewidth=0.50,
                alpha=0.30,
                zorder=2,
            )
        )

    circumplex_ax.annotate(
        "",
        xy=(0.985, 0),
        xytext=(-0.985, 0),
        arrowprops={
            "arrowstyle": "<|-|>",
            "color": REFERENCE,
            "lw": 0.80,
            "mutation_scale": 6,
        },
        zorder=5,
    )
    circumplex_ax.annotate(
        "",
        xy=(0, 0.985),
        xytext=(0, -0.985),
        arrowprops={
            "arrowstyle": "<|-|>",
            "color": REFERENCE,
            "lw": 0.80,
            "mutation_scale": 6,
        },
        zorder=5,
    )
    circumplex_ax.text(
        0.94,
        0.055,
        "Valence",
        ha="right",
        va="bottom",
        fontsize=6.5,
        fontweight="normal",
        color=INK,
        zorder=7,
    )
    circumplex_ax.text(
        0.055,
        0.94,
        "Arousal",
        ha="left",
        va="top",
        rotation=90,
        fontsize=6.5,
        fontweight="normal",
        color=INK,
        zorder=7,
    )
    circumplex_ax.text(
        -0.95, -0.055, "unpleasant", ha="left", va="top", fontsize=5.8, color=MUTED
    )
    circumplex_ax.text(
        0.95, -0.055, "pleasant", ha="right", va="top", fontsize=5.8, color=MUTED
    )
    circumplex_ax.text(
        -0.055,
        0.95,
        "high",
        ha="right",
        va="top",
        fontsize=5.8,
        color=MUTED,
    )
    circumplex_ax.text(
        -0.055,
        -0.95,
        "low",
        ha="right",
        va="bottom",
        fontsize=5.8,
        color=MUTED,
    )

    affect_labels = [
        (-0.68, 0.69, "ANGRY", CORAL),
        (0.68, 0.69, "HAPPY", TEAL),
        (-0.68, -0.69, "SAD", PURPLE),
        (0.68, -0.69, "RELAXED", BLUE),
    ]
    for x, y, label, color in affect_labels:
        circumplex_ax.text(
            x,
            y,
            label,
            ha="center",
            va="center",
            fontsize=6.35,
            fontweight="normal",
            color=color,
            clip_on=True,
            zorder=8,
        )
    circumplex_ax.scatter(
        [0],
        [0],
        s=19,
        facecolor="white",
        edgecolor=REFERENCE,
        linewidth=0.75,
        zorder=9,
    )
    circumplex_ax.set_xticks([])
    circumplex_ax.set_yticks([])
    for spine in circumplex_ax.spines.values():
        spine.set_visible(False)

    # Panel B: a newly composed card interface for Thayer's affect vocabulary.
    vocabulary_ax.set_xlim(0, 3)
    vocabulary_ax.set_ylim(0, 4)
    vocabulary_ax.set_box_aspect(1)
    vocabulary_ax.set_title("(b)", loc="left", color=INK, pad=7, fontsize=8.2)
    vocabulary_ax.set_facecolor("white")

    card_specs = [
        (0, 3, 1, 1, "ANGRY", CORAL, INK),
        (1, 3, 1, 1, "EXCITED", GOLD_MID, INK),
        (2, 3, 1, 1, "HAPPY", TEAL_MID, INK),
        (0, 2, 1, 1, "NERVOUS", CORAL_MID, INK),
        (2, 2, 1, 1, "PLEASED", TEAL_MID, INK),
        (0, 1, 1, 1, "BORED", PURPLE_MID, INK),
        (2, 1, 1, 1, "RELAXED", BLUE_MID, INK),
        (0, 0, 1, 1, "SAD", PURPLE_MID, INK),
        (1, 0, 1, 1, "SLEEPY", BLUE_MID, INK),
        (2, 0, 1, 1, "PEACEFUL", BLUE_MID, INK),
        (1, 1, 1, 2, "CALM", TEAL_LIGHT, TEAL_DARK),
    ]
    for x, y, width, height, label, face, text_color in card_specs:
        pad = 0.032
        vocabulary_ax.add_patch(
            FancyBboxPatch(
                (x + pad, y + pad),
                width - 2 * pad,
                height - 2 * pad,
                boxstyle="round,pad=0.008,rounding_size=0.035",
                facecolor=face,
                edgecolor="white",
                linewidth=0.55,
                zorder=2,
            )
        )
        vocabulary_ax.text(
            x + width / 2,
            y + height / 2,
            label,
            ha="center",
            va="center",
            fontsize=6.15,
            fontweight="normal",
            color=text_color,
            zorder=3,
        )
    vocabulary_ax.set_xticks([])
    vocabulary_ax.set_yticks([])
    for spine in vocabulary_ax.spines.values():
        spine.set_visible(False)

    # Panel C: synthetic profiles, deliberately unlike the published ridgeline.
    frequency_ax.set_xlim(0.03, 0.15)
    frequency_ax.set_ylim(0.0, 2.0)
    frequency_ax.set_box_aspect(1)
    frequency_ax.set_title("(c)", loc="left", color=INK, pad=7, fontsize=8.2)
    frequency_ax.set_facecolor("white")

    x = np.linspace(0.03, 0.15, 500)
    broad = (
        0.25 * np.exp(-0.5 * ((x - 0.070) / 0.020) ** 2)
        + 0.34 * np.exp(-0.5 * ((x - 0.108) / 0.015) ** 2)
    )
    focused = 0.56 * np.exp(-0.5 * ((x - 0.100) / 0.0075) ** 2)
    broad_base = 1.06
    focused_base = 0.34

    frequency_ax.fill_between(
        x,
        broad_base,
        broad_base + broad,
        facecolor=CORAL_MID,
        alpha=0.64,
        linewidth=0,
        zorder=2,
    )
    frequency_ax.plot(
        x, broad_base + broad, color=CORAL_DARK, lw=1.0, zorder=3
    )
    frequency_ax.fill_between(
        x,
        focused_base,
        focused_base + focused,
        facecolor=TEAL_MID,
        alpha=0.68,
        linewidth=0,
        zorder=2,
    )
    frequency_ax.plot(
        x, focused_base + focused, color=TEAL_DARK, lw=1.0, zorder=3
    )
    frequency_ax.hlines(
        [broad_base, focused_base],
        xmin=0.03,
        xmax=0.15,
        colors=[GRID, GRID],
        linewidth=0.55,
        zorder=1,
    )
    frequency_ax.axvline(
        0.10, color=REFERENCE, lw=0.8, ls=(0, (2.2, 2.2)), alpha=0.72, zorder=1
    )
    frequency_ax.text(
        0.10,
        1.58,
        "0.10 Hz",
        ha="center",
        va="bottom",
        fontsize=5.8,
        fontweight="normal",
        color=REFERENCE,
        zorder=5,
    )
    frequency_ax.text(
        0.034,
        1.38,
        "more dispersed",
        ha="left",
        va="bottom",
        fontsize=6.0,
        fontweight="normal",
        color=CORAL_DARK,
    )
    frequency_ax.text(
        0.034,
        0.80,
        "more concentrated",
        ha="left",
        va="bottom",
        fontsize=6.0,
        fontweight="normal",
        color=TEAL_DARK,
    )
    frequency_ax.text(
        0.146,
        1.92,
        "schematic · not data",
        ha="right",
        va="top",
        fontsize=5.35,
        fontweight="normal",
        color=MUTED,
        zorder=6,
    )
    frequency_ax.text(
        0.09,
        0.08,
        "association ≠ individual emotion label",
        ha="center",
        va="bottom",
        fontsize=5.45,
        color=MUTED,
        bbox={
            "boxstyle": "square,pad=0.06",
            "facecolor": "white",
            "edgecolor": "none",
            "alpha": 0.98,
        },
        zorder=5,
    )
    frequency_ax.set_xlabel("Frequency (Hz)", labelpad=1.5, fontsize=6.5)
    frequency_ax.set_xticks([0.04, 0.10, 0.14])
    frequency_ax.set_xticklabels(["0.04", "0.10", "0.14"], fontsize=5.9)
    frequency_ax.set_yticks([])
    frequency_ax.tick_params(axis="x", pad=1, length=2.4, width=0.6)
    frequency_ax.spines["left"].set_visible(False)
    frequency_ax.spines["right"].set_visible(False)
    frequency_ax.spines["top"].set_visible(False)
    frequency_ax.spines["bottom"].set_color(REFERENCE)
    frequency_ax.spines["bottom"].set_linewidth(0.7)

    return fig


def main() -> None:
    figure = build_figure()
    pdf_path = HERE / "fig1_affect_space.pdf"
    png_path = HERE / "fig1_affect_space.png"
    figure.savefig(pdf_path)
    figure.savefig(png_path, dpi=300)
    plt.close(figure)
    print(pdf_path)
    print(png_path)


if __name__ == "__main__":
    main()
