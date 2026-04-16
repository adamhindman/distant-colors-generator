# Max Color Distance Generator

A tool for generating perceptually distinct color palettes. Colors are selected using farthest-point sampling in [OKLab space](https://bottosson.github.io/posts/oklab/) — a perceptually uniform color model — so the resulting palettes maximize visual distance between every color.

**[Try it →](https://adamhindman.github.io/distant-colors-generator)**

## How it works

1. Build a large pool of candidate colors using one of five strategies
2. Filter out any that fail the minimum WCAG contrast ratio against the chosen text color
3. Greedily pick colors one at a time, always choosing the candidate with the greatest minimum distance to the already-selected colors

## Controls

| Control | Description |
|---|---|
| Count | Number of colors to generate |
| Text | Black or white text overlaid on swatches |
| Min contrast | WCAG contrast ratio threshold (4.5 = AA) |
| Strategy | How the candidate pool is built (see below) |

### Strategies

| Strategy | Approach |
|---|---|
| Naive distance | Full RGB grid, contrast filter only |
| OKLab chroma filter | RGB grid, filters out low-chroma (gray/brown) colors |
| HSL sampling | Samples colors with saturation 55–100% and lightness 30–65% |
| OKLCH sampling | Uniform hue sweep at high chroma with gamut clamping |
| Chroma-biased selection | RGB grid, greedy sampler biased toward vivid colors |

## Features

- **Shareable palettes** — each palette gets a unique name (e.g. `happy-blazing-lobster`) in the URL hash. Paste the URL to recreate it exactly.
- **Sort by similarity** — reorders swatches so the most perceptually similar colors are adjacent, making it easy to spot pairs that are too close.
- **Grid and bars layouts** — switch between square swatches and compact color bars.
- **Export** — copy hex codes (one per line) or an SVG of the current swatches to the clipboard.
- **History** — the last 10 generated palettes are saved and can be restored with one click.

## Development

```bash
npm install
npm run dev      # start dev server with HMR
npm run build    # production bundle
npm run preview  # preview production build
```

Built with vanilla JS and [Vite](https://vitejs.dev/). No frameworks or color libraries — all color math is implemented from scratch.
