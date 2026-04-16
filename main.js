import './style.css';

let rawHexCodes = [];
let lastHexCodes = [];
let lastTextColor = 'black';
let layoutMode = 'grid';
let sortMode = 'similarity';
let textColorMode = 'white';
let seedHistory = [];
let currentSeed = null;

const STORAGE_KEY = 'distant-colors-state';

// 80 × 80 × 80 = 512,000 combinations — one name per seed, one seed per name
const ADJECTIVES = [
  'ancient', 'angry', 'anxious', 'absent', 'bouncy', 'brave', 'broken', 'busy',
  'calm', 'careful', 'cheerful', 'chilly', 'clumsy', 'clever', 'curious', 'damp',
  'dizzy', 'dusty', 'eager', 'endless', 'enormous', 'famous', 'fancy', 'fierce',
  'fluffy', 'foolish', 'frantic', 'frozen', 'gentle', 'giant', 'gloomy', 'grumpy',
  'happy', 'hasty', 'hollow', 'hungry', 'idle', 'itchy', 'jealous', 'jolly',
  'jumpy', 'kind', 'lazy', 'lonely', 'loud', 'lucky', 'merry', 'mighty',
  'muddy', 'narrow', 'nervous', 'noisy', 'odd', 'plain', 'polite', 'proud',
  'quick', 'quiet', 'restless', 'round', 'rusty', 'shameful', 'sharp', 'shy',
  'silly', 'slimy', 'sneaky', 'strange', 'stubborn', 'tired', 'tiny', 'twisted',
  'vast', 'wild', 'wise', 'wobbly', 'faint', 'zealous',
]; // 80

const ADJECTIVES2 = [
  'blazing', 'bleary', 'bloated', 'boiling', 'brittle', 'bumbling', 'clammy', 'clashing',
  'colossal', 'craggy', 'creaking', 'crumbling', 'crusty', 'dazzling', 'desolate', 'dripping',
  'drooping', 'dwindling', 'echoing', 'erupting', 'fizzing', 'flailing', 'flickering', 'flimsy',
  'floundering', 'fumbling', 'galloping', 'glittering', 'grinding', 'gushing', 'hammering', 'howling',
  'hulking', 'lumbering', 'lurching', 'meandering', 'melting', 'mumbling', 'orbiting', 'plodding',
  'plummeting', 'rattling', 'rickety', 'roaming', 'roaring', 'rumbling', 'rusting', 'sagging',
  'shambling', 'shivering', 'shuffling', 'sinking', 'sizzling', 'sloshing', 'slumbering', 'smoldering',
  'snoring', 'soaring', 'sputtering', 'staggering', 'stomping', 'stumbling', 'swirling', 'teetering',
  'thundering', 'tottering', 'tumbling', 'wandering', 'abandoned', 'bitter', 'cackling', 'cloudless',
  'gnawing', 'napping', 'crashing', 'baffled', 'drifting', 'scattered', 'tangled', 'grim',
]; // 80

const NOUNS = [
  'accordion', 'almanac', 'arcade', 'astronaut', 'badger', 'bagpipe', 'balloon', 'bandit',
  'behemoth', 'biscuit', 'blizzard', 'blimp', 'cactus', 'caribou', 'carnival', 'castle',
  'chandelier', 'chimney', 'compass', 'coyote', 'dirigible', 'diorama', 'dungeon', 'elevator',
  'falcon', 'fjord', 'fortress', 'galleon', 'geyser', 'glacier', 'goblin', 'hammock',
  'hamster', 'harmonica', 'harpoon', 'igloo', 'island', 'jukebox', 'kettle', 'kraken',
  'labyrinth', 'lantern', 'lobster', 'mammoth', 'marmalade', 'marimba', 'monocle', 'mongoose',
  'noodle', 'obelisk', 'oracle', 'pamphlet', 'parliament', 'penguin', 'phantom', 'pickle',
  'pirate', 'pretzel', 'quasar', 'rocket', 'satellite', 'scarecrow', 'sextant', 'stallion',
  'tornado', 'trebuchet', 'trumpet', 'tugboat', 'tundra', 'umbrella', 'urchin', 'velodrome',
  'volcano', 'vortex', 'walrus', 'windmill', 'wizard', 'xylophone', 'yeti', 'zeppelin',
]; // 80

function seedToName(seed) {
  const A = ADJECTIVES.length, A2 = ADJECTIVES2.length;
  return [
    ADJECTIVES[seed % A],
    ADJECTIVES2[Math.floor(seed / A) % A2],
    NOUNS[Math.floor(seed / (A * A2)) % NOUNS.length],
  ].join('-');
}

function nameToSeed(name) {
  const parts = name.toLowerCase().split('-');
  if (parts.length !== 3) return null;
  const i1 = ADJECTIVES.indexOf(parts[0]);
  const i2 = ADJECTIVES2.indexOf(parts[1]);
  const i3 = NOUNS.indexOf(parts[2]);
  if (i1 === -1 || i2 === -1 || i3 === -1) return null;
  return i1 + i2 * ADJECTIVES.length + i3 * ADJECTIVES.length * ADJECTIVES2.length;
}

function seedFromHash() {
  const hash = window.location.hash.slice(1);
  if (!hash) return null;
  if (hash.includes('-')) return nameToSeed(hash);
  if (/^[0-9a-f]+$/i.test(hash)) {
    const n = parseInt(hash, 16);
    if (n < ADJECTIVES.length * ADJECTIVES2.length * NOUNS.length) return n;
  }
  return null;
}

function setTextColorMode(value) {
  textColorMode = value;
  document.getElementById('text-black-btn').classList.toggle('active', value === 'black');
  document.getElementById('text-white-btn').classList.toggle('active', value === 'white');
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    count:       document.getElementById('count').value,
    textColor:   textColorMode,
    minContrast: document.getElementById('min-contrast').value,
    strategy:    document.getElementById('strategy').value,
    layoutMode,
    sortMode,
    seedHistory,
  }));
}

function restoreState() {
  let state;
  try { state = JSON.parse(localStorage.getItem(STORAGE_KEY)); } catch (_) {}
  if (!state) return;

  if (state.count != null)       document.getElementById('count').value = state.count;
  if (state.minContrast != null) document.getElementById('min-contrast').value = state.minContrast;
  if (state.strategy != null)    document.getElementById('strategy').value = state.strategy;
  if (state.textColor) setTextColorMode(state.textColor);
  if (state.layoutMode) {
    layoutMode = state.layoutMode;
    document.getElementById('layout-grid-btn').classList.toggle('active', layoutMode === 'grid');
    document.getElementById('layout-bar-btn').classList.toggle('active', layoutMode === 'bar');
  }
  if (state.sortMode) {
    sortMode = state.sortMode;
    document.getElementById('sort-mode').value = sortMode;
  }
  if (Array.isArray(state.seedHistory)) {
    seedHistory = state.seedHistory.filter(e => e && typeof e === 'object');
    renderSeedHistory();
  }
  return seedHistory[0]?.seed ?? null;
}

function mulberry32(seed) {
  return function() {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

// ── Color math ────────────────────────────────────────────────────────────────

function linearize(c) {
  c /= 255;
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

function luminance(r, g, b) {
  return 0.2126 * linearize(r) + 0.7152 * linearize(g) + 0.0722 * linearize(b);
}

function contrastRatio(l1, l2) {
  const hi = Math.max(l1, l2), lo = Math.min(l1, l2);
  return (hi + 0.05) / (lo + 0.05);
}

function toOklab(r, g, b) {
  const rl = linearize(r), gl = linearize(g), bl = linearize(b);
  const l = Math.cbrt(0.4122214708 * rl + 0.5363325363 * gl + 0.0514459929 * bl);
  const m = Math.cbrt(0.2119034982 * rl + 0.6806995451 * gl + 0.1073969566 * bl);
  const s = Math.cbrt(0.0883024619 * rl + 0.2817188376 * gl + 0.6299787005 * bl);
  return [
    0.2104542553 * l + 0.7936177850 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.4285922050 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.8086757660 * s,
  ];
}

function oklabDist([L1, a1, b1], [L2, a2, b2]) {
  return Math.sqrt((L1 - L2) ** 2 + (a1 - a2) ** 2 + (b1 - b2) ** 2);
}

function hexToLab(hex) {
  return toOklab(parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16));
}

function sortByLightness(hexCodes) {
  return [...hexCodes].sort((a, b) => hexToLab(a)[0] - hexToLab(b)[0]);
}

function sortByHue(hexCodes) {
  const hue = hex => { const [, a, b] = hexToLab(hex); return (Math.atan2(b, a) * 180 / Math.PI + 360) % 360; };
  return [...hexCodes].sort((a, b) => hue(a) - hue(b));
}

function sortByChroma(hexCodes) {
  const chroma = hex => { const [, a, b] = hexToLab(hex); return Math.sqrt(a ** 2 + b ** 2); };
  return [...hexCodes].sort((a, b) => chroma(b) - chroma(a));
}

function shuffleCodes(hexCodes) {
  const arr = [...hexCodes];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function applySortMode() {
  switch (sortMode) {
    case 'similarity': lastHexCodes = nearestNeighborOrder(rawHexCodes); break;
    case 'lightness':  lastHexCodes = sortByLightness(rawHexCodes); break;
    case 'hue':        lastHexCodes = sortByHue(rawHexCodes); break;
    case 'chroma':     lastHexCodes = sortByChroma(rawHexCodes); break;
    case 'shuffle':    lastHexCodes = shuffleCodes(rawHexCodes); break;
    default:           lastHexCodes = [...rawHexCodes];
  }
}

function nearestNeighborOrder(hexCodes) {
  const labs = hexCodes.map(hex => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return toOklab(r, g, b);
  });

  const visited = new Uint8Array(hexCodes.length);
  const order = [0];
  visited[0] = 1;

  while (order.length < hexCodes.length) {
    const current = order[order.length - 1];
    let nearest = -1, nearestDist = Infinity;
    for (let i = 0; i < hexCodes.length; i++) {
      if (visited[i]) continue;
      const d = oklabDist(labs[current], labs[i]);
      if (d < nearestDist) { nearestDist = d; nearest = i; }
    }
    visited[nearest] = 1;
    order.push(nearest);
  }

  return order.map(i => hexCodes[i]);
}

function bestTextColor(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const lum = luminance(r, g, b);
  return contrastRatio(lum, 1) >= contrastRatio(lum, 0) ? 'white' : 'black';
}

function toHex(r, g, b) {
  return '#' + [r, g, b].map(v => v.toString(16).padStart(2, '0')).join('');
}

// HSL (h: 0–360, s/l: 0–100) → RGB (0–255)
function hslToRgb(h, s, l) {
  s /= 100; l /= 100;
  const k = n => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = n => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return [Math.round(f(0) * 255), Math.round(f(8) * 255), Math.round(f(4) * 255)];
}

// OKLCH → sRGB (returns values in [0,1]; may be outside range if out of gamut)
function oklchToRgb01(L, C, H) {
  const hr = H * Math.PI / 180;
  const a = C * Math.cos(hr), b = C * Math.sin(hr);
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.2914855480 * b;
  const l = l_ ** 3, m = m_ ** 3, s = s_ ** 3;
  const enc = c => c <= 0.0031308 ? c * 12.92 : 1.055 * Math.pow(c, 1 / 2.4) - 0.055;
  return [
    enc(+4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s),
    enc(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s),
    enc(-0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s),
  ];
}

// ── Candidate builders ────────────────────────────────────────────────────────

// Option 1: RGB grid filtered by minimum OKLab chroma (≥ 0.08 cuts grays/browns)
function buildCandidates1(textLum, minContrast) {
  const out = [];
  for (let r = 0; r < 256; r += 8) {
    for (let g = 0; g < 256; g += 8) {
      for (let b = 0; b < 256; b += 8) {
        if (contrastRatio(luminance(r, g, b), textLum) >= minContrast) {
          const lab = toOklab(r, g, b);
          if (Math.sqrt(lab[1] ** 2 + lab[2] ** 2) >= 0.08)
            out.push([r, g, b, lab]);
        }
      }
    }
  }
  return out;
}

// Option 2: HSL sampling restricted to S ∈ [55%, 100%], L ∈ [30%, 65%]
function buildCandidates2(textLum, minContrast) {
  const out = [], seen = new Set();
  for (let h = 0; h < 360; h += 5) {
    for (let s = 55; s <= 100; s += 5) {
      for (let l = 30; l <= 65; l += 2) {
        const [r, g, b] = hslToRgb(h, s, l);
        const key = (r << 16) | (g << 8) | b;
        if (seen.has(key)) continue;
        seen.add(key);
        if (contrastRatio(luminance(r, g, b), textLum) >= minContrast)
          out.push([r, g, b, toOklab(r, g, b)]);
      }
    }
  }
  return out;
}

// Option 3: OKLCH sampling — uniform hue sweep at high chroma, sRGB-gamut clamped
function buildCandidates3(textLum, minContrast) {
  const out = [], seen = new Set();
  for (let H = 0; H < 360; H += 4) {
    for (let C = 0.08; C <= 0.22; C += 0.01) {
      for (let Lc = 0.25; Lc <= 0.92; Lc += 0.02) {
        const rgb01 = oklchToRgb01(Lc, C, H);
        if (rgb01.some(v => v < -0.01 || v > 1.01)) continue;
        const r = Math.round(Math.min(1, Math.max(0, rgb01[0])) * 255);
        const g = Math.round(Math.min(1, Math.max(0, rgb01[1])) * 255);
        const b = Math.round(Math.min(1, Math.max(0, rgb01[2])) * 255);
        const key = (r << 16) | (g << 8) | b;
        if (seen.has(key)) continue;
        seen.add(key);
        if (contrastRatio(luminance(r, g, b), textLum) >= minContrast)
          out.push([r, g, b, toOklab(r, g, b)]);
      }
    }
  }
  return out;
}

// Option 0 / Option 4 shared base: full RGB grid, contrast filter only
function buildCandidatesRgbGrid(textLum, minContrast) {
  const out = [];
  for (let r = 0; r < 256; r += 8) {
    for (let g = 0; g < 256; g += 8) {
      for (let b = 0; b < 256; b += 8) {
        if (contrastRatio(luminance(r, g, b), textLum) >= minContrast)
          out.push([r, g, b, toOklab(r, g, b)]);
      }
    }
  }
  return out;
}

// ── Sampling ──────────────────────────────────────────────────────────────────

// Greedy farthest-point sampling in OKLab space.
// chromaBias > 0 multiplies each candidate's min-distance score by (1 + bias × chroma),
// nudging selection toward vivid colors when distance is otherwise equal (option 4).
function greedySample(k, candidates, chromaBias = 0, rng = Math.random) {
  const minD = new Float64Array(candidates.length).fill(Infinity);
  const chosen = [];

  function addPick(idx) {
    chosen.push(idx);
    minD[idx] = -1;
    const lab = candidates[idx][3];
    for (let i = 0; i < candidates.length; i++) {
      if (minD[i] < 0) continue;
      const d = oklabDist(candidates[i][3], lab);
      if (d < minD[i]) minD[i] = d;
    }
  }

  addPick(Math.floor(rng() * candidates.length));
  while (chosen.length < k) {
    let best = -1, bestScore = -1;
    for (let i = 0; i < minD.length; i++) {
      if (minD[i] < 0) continue;
      const chroma = chromaBias > 0
        ? Math.sqrt(candidates[i][3][1] ** 2 + candidates[i][3][2] ** 2)
        : 0;
      const score = minD[i] * (1 + chromaBias * chroma);
      if (score > bestScore) { bestScore = score; best = i; }
    }
    addPick(best);
  }

  return chosen;
}

// ── Render ────────────────────────────────────────────────────────────────────

function renderSwatches() {
  const output = document.getElementById('output');
  output.innerHTML = '';
  output.className = 'swatches' + (layoutMode === 'bar' ? ' layout-bar' : '');

  for (const hex of lastHexCodes) {
    if (layoutMode === 'bar') {
      const swatch = document.createElement('div');
      swatch.className = 'swatch-bar';
      swatch.style.cssText = `background:${hex};color:${lastTextColor}`;
      swatch.title = 'Click to copy';
      swatch.textContent = hex;
      swatch.addEventListener('click', () => copyHex(hex, swatch));
      output.appendChild(swatch);
    } else {
      const swatch = document.createElement('div');
      swatch.className = 'swatch';
      swatch.style.cssText = `background:${hex};color:${lastTextColor};cursor:pointer;font-size:0.7rem;font-family:'SF Mono','Fira Code',monospace;font-weight:600;letter-spacing:0.05em`;
      swatch.title = 'Click to copy';
      swatch.textContent = hex;
      swatch.addEventListener('click', () => copyHex(hex, swatch));

      const card = document.createElement('div');
      card.className = 'swatch-card';
      card.appendChild(swatch);
      output.appendChild(card);
    }
  }
}

// ── Generate ──────────────────────────────────────────────────────────────────

function renderSeedHistory() {
  const container = document.getElementById('seed-history');
  container.innerHTML = '';
  seedHistory.forEach(({ seed, colors, color }) => {
    const a = document.createElement('a');
    a.className = 'seed-link';
    a.title = seedToName(seed);
    const swatchColors = colors || (color ? [color] : []);
    for (let i = 0; i < 10; i++) {
      const div = document.createElement('div');
      div.className = 'mini-swatch';
      div.style.background = swatchColors[i] || '#181818';
      a.appendChild(div);
    }
    a.addEventListener('click', () => generate(seed));
    container.appendChild(a);
  });
}

function generate(forceSeed = null) {
  const n           = Math.max(1, +document.getElementById('count').value || 8);
  const minContrast = Math.max(1, Math.min(21, +document.getElementById('min-contrast').value || 4.5));
  const textColor   = textColorMode;
  const textLum     = textColor === 'white' ? 1 : 0;
  const strategy    = +document.getElementById('strategy').value;

  const builders = [
    buildCandidatesRgbGrid,  // 0: naive
    buildCandidates1,        // 1: OKLab chroma filter
    buildCandidates2,        // 2: HSL sampling
    buildCandidates3,        // 3: OKLCH sampling
    buildCandidatesRgbGrid,  // 4: chroma-biased (same pool, different scoring)
  ];
  const candidates = builders[strategy](textLum, minContrast)
    .filter(([r, g, b]) => !(r === 0 && g === 0 && b === 0) && !(r === 255 && g === 255 && b === 255));

  const k = Math.min(n, candidates.length);
  const copyAllBtn = document.getElementById('copy-all-btn');
  if (!k) {
    const output = document.getElementById('output');
    output.className = 'swatches';
    output.innerHTML = '<p class="empty-state">No valid colors found.</p>';
    copyAllBtn.disabled = true;
    document.getElementById('copy-svg-btn').disabled = true;
    return;
  }

  const seed = forceSeed ?? Math.floor(Math.random() * (ADJECTIVES.length * ADJECTIVES2.length * NOUNS.length));
  const rng = mulberry32(seed);

  const chromaBias = strategy === 4 ? 5 : 0;
  const chosen = greedySample(k, candidates, chromaBias, rng);

  rawHexCodes = [];
  for (const idx of chosen) {
    const [r, g, b] = candidates[idx];
    rawHexCodes.push(toHex(r, g, b));
  }
  applySortMode();

  // When recalling a palette by seed, auto-pick the text color that
  // has better contrast against the first swatch, and update the UI.
  if (forceSeed !== null && lastHexCodes.length > 0) {
    const auto = bestTextColor(lastHexCodes[0]);
    lastTextColor = auto;
    setTextColorMode(auto);
  } else {
    lastTextColor = textColor;
  }

  const entry = { seed, colors: nearestNeighborOrder(rawHexCodes).slice(0, 10), textColor: lastTextColor };
  seedHistory = [entry, ...seedHistory.filter(e => e.seed !== seed)].slice(0, 10);
  renderSeedHistory();

  currentSeed = seed;
  window.location.hash = seedToName(seed);

  renderSwatches();
  saveState();

  copyAllBtn.disabled = false;
  document.getElementById('copy-svg-btn').disabled = false;
}

function copyHex(hex, el) {
  navigator.clipboard.writeText(hex).then(() => {
    const orig = el.textContent;
    el.textContent = 'copied!';
    setTimeout(() => el.textContent = orig, 1000);
  });
}

function buildSvg(hexCodes, textColor, layout) {
  if (layout === 'bar') {
    const SW = 140, SH = 40;
    const cols = Math.min(hexCodes.length, 8);
    const rows = Math.ceil(hexCodes.length / cols);
    const w = cols * SW, h = rows * SH;

    const groups = hexCodes.map((hex, i) => {
      const col = i % cols, row = Math.floor(i / cols);
      const x = col * SW, y = row * SH;
      return `<g>\n    <rect x="${x}" y="${y}" width="${SW}" height="${SH}" fill="${hex}"/>` +
        `\n    <text x="${x + SW / 2}" y="${y + SH / 2}" text-anchor="middle" dy="0.35em"` +
        `fill="${textColor}" font-family="'SF Mono',Menlo,Consolas,monospace" font-size="12" font-weight="600" letter-spacing="0.5">${hex}</text>` +
        `\n  </g>`;
    }).join('\n  ');

    return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">\n  ${groups}\n</svg>`;
  }

  const size = 110, gap = 12, padding = 16, radius = 8;
  const cols = Math.min(hexCodes.length, 8);
  const rows = Math.ceil(hexCodes.length / cols);
  const w = padding * 2 + cols * size + (cols - 1) * gap;
  const h = padding * 2 + rows * size + (rows - 1) * gap;

  const groups = hexCodes.map((hex, i) => {
    const col = i % cols, row = Math.floor(i / cols);
    const x = padding + col * (size + gap);
    const y = padding + row * (size + gap);
    return `<g>\n    <rect x="${x}" y="${y}" width="${size}" height="${size}" rx="${radius}" fill="${hex}"/>` +
      `\n    <text x="${x + size / 2}" y="${y + size / 2}" text-anchor="middle" dy="0.35em"` +
      `fill="${textColor}" font-family="'SF Mono',Menlo,Consolas,monospace" font-size="11" font-weight="600" letter-spacing="0.5">${hex}</text>` +
      `\n  </g>`;
  }).join('\n  ');

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">\n  ${groups}\n</svg>`;
}

const helpOverlay = document.getElementById('help-overlay');
document.getElementById('help-btn').addEventListener('click', () => helpOverlay.hidden = false);
document.getElementById('help-close').addEventListener('click', () => helpOverlay.hidden = true);
helpOverlay.addEventListener('click', e => { if (e.target === helpOverlay) helpOverlay.hidden = true; });
document.addEventListener('keydown', e => { if (e.key === 'Escape') helpOverlay.hidden = true; });

document.getElementById('text-black-btn').addEventListener('click', () => { setTextColorMode('black'); saveState(); });
document.getElementById('text-white-btn').addEventListener('click', () => { setTextColorMode('white'); saveState(); });

document.getElementById('generate-btn').addEventListener('click', () => generate());

document.getElementById('copy-url-btn').addEventListener('click', e => {
  const btn = e.currentTarget;
  navigator.clipboard.writeText(window.location.href).then(() => {
    btn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg> Copied!';
    setTimeout(() => {
      btn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg> Share';
    }, 1500);
  });
});

document.addEventListener('keydown', e => {
  if ((e.key === 'Enter' || e.key === ' ') && e.target.tagName !== 'BUTTON') {
    e.preventDefault();
    generate();
  }
});

document.getElementById('copy-all-btn').addEventListener('click', e => {
  const btn = e.currentTarget;
  navigator.clipboard.writeText(lastHexCodes.join('\n')).then(() => {
    const orig = btn.textContent;
    btn.textContent = 'Copied!';
    setTimeout(() => btn.textContent = orig, 1500);
  });
});

document.getElementById('copy-svg-btn').addEventListener('click', e => {
  const btn = e.currentTarget;
  navigator.clipboard.writeText(buildSvg(lastHexCodes, lastTextColor, layoutMode)).then(() => {
    const orig = btn.textContent;
    btn.textContent = 'Copied!';
    setTimeout(() => btn.textContent = orig, 1500);
  });
});

document.getElementById('layout-grid-btn').addEventListener('click', () => {
  layoutMode = 'grid';
  document.getElementById('layout-grid-btn').classList.add('active');
  document.getElementById('layout-bar-btn').classList.remove('active');
  if (lastHexCodes.length) renderSwatches();
  saveState();
});

document.getElementById('layout-bar-btn').addEventListener('click', () => {
  layoutMode = 'bar';
  document.getElementById('layout-bar-btn').classList.add('active');
  document.getElementById('layout-grid-btn').classList.remove('active');
  if (lastHexCodes.length) renderSwatches();
  saveState();
});

document.getElementById('sort-mode').addEventListener('change', e => {
  sortMode = e.target.value;
  if (rawHexCodes.length) {
    applySortMode();
    renderSwatches();
  }
  saveState();
});

window.addEventListener('hashchange', () => {
  const seed = seedFromHash();
  if (seed !== null && seed !== currentSeed) generate(seed);
});

const restoredSeed = restoreState();
generate(seedFromHash() ?? restoredSeed);
