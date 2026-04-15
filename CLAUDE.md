# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # Start Vite dev server with HMR
npm run build     # Production bundle
npm run preview   # Preview production build
```

There is no test runner, linter, or type checker configured.

## Architecture

Single-page vanilla JS app with no framework. All logic lives in three files:

- **`main.js`** — All color math and UI logic (~240 lines)
- **`style.css`** — UI styling
- **`index.html`** — Single page with controls and swatch container

### Color Pipeline

The app generates perceptually distinct color palettes using **farthest-point sampling in OKLab space**.

1. **Build candidates** — Generate a large pool of candidate colors using one of five strategies (controlled by the Strategy selector)
2. **Filter by contrast** — Remove candidates that fail WCAG contrast ratio against the chosen text color
3. **Greedy sample** — Iteratively pick the color with the maximum minimum distance to already-selected colors (`greedySample()`)

### Color Space Conversions

The math chain: sRGB → linearized sRGB → OKLab (for distance) / OKLCH (for gamut-mapped generation)

- `toOklab()` — Used for all distance calculations (`oklabDist()`)
- `oklchToRgb01()` — Used in Strategy 3 to generate colors at uniform hue intervals with gamut clamping
- `luminance()` / `contrastRatio()` — WCAG relative luminance for accessibility filtering

### Candidate Building Strategies

| Strategy | Function | Approach |
|----------|----------|----------|
| 0 | `buildCandidatesRgbGrid()` | Full RGB grid, contrast-filtered only |
| 1 | `buildCandidates1()` | RGB grid, OKLab chroma ≥ 0.08 filter |
| 2 | `buildCandidates2()` | HSL sampling, S ∈ [55–100%], L ∈ [30–65%] |
| 3 | `buildCandidates3()` | OKLCH hue sweep at high chroma with gamut clamping |
| 4 | `buildCandidatesRgbGrid()` + `chromaBias` | RGB grid, greedy selection biased toward vivid colors |

### Key Parameters

- **`chromaBias`** (Strategy 4 only) — Multiplies greedy selection score by `(1 + bias × chroma)` to prefer vivid colors
- **`minContrast`** — WCAG contrast ratio threshold applied before candidate selection
- **`textColor`** — `[0,0,0]` or `[255,255,255]`; contrast is computed against this value
