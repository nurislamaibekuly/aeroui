# aeroui

Black & white, dependency-free UI components for the web. Vanilla CSS + ES modules, no build step, no framework.

```
aeroui/
├── index.html                        demo page
├── scripts/
│   └── switch-env.sh                 toggle imports: relative ./ ↔ GitHub Pages CDN
└── src/
    ├── aeroui.css                    entry point — imports all components + design tokens
    ├── components/
    │   ├── accordion/accordion.css · accordion.js
    │   ├── badge/badge.css
    │   ├── button/button.css · button.js
    │   ├── card/card.css
    │   ├── dropdown/dropdown.css · dropdown.js
    │   ├── input/input.css
│   ├── progress/progress.css · progress.js
│   ├── slider/slider.css · slider.js
│   ├── elastic-slider/elastic-slider.css · elastic-slider.js
 │   ├── player-button/player-button.css · player-button.js
 │   ├── marquee/marquee.css · marquee.js
 │   ├── skip-label/skip-label.css · skip-label.js
│   ├── tooltip/tooltip.css · tooltip.js
    │   ├── modal/modal.css · modal.js
    │   ├── segmented/segmented.css · segmented.js
    │   ├── spinner/spinner.css · spinner.js
    │   ├── toast/toast.css · toast.js
    │   └── toggle/toggle.css · toggle.js
    └── core/
        ├── haptics.js                cross-platform haptic feedback engine
        ├── motion.js                 frame-rate independent spring physics engine
        └── progressive-blur.js       Apple-style gradient backdrop blur
```

## Getting started

```html
<link rel="stylesheet" href="https://nurislamaibekuly.github.io/aeroui/src/aeroui.css">
<script type="module" src="https://nurislamaibekuly.github.io/aeroui/src/components/button/button.js"></script>
```

ES modules require serving over HTTP (any static server works):

```bash
python3 -m http.server
```

### Debug vs release

Imports in `index.html` and `src/aeroui.css` carry a full base URL. Switch between local debugging (relative `./` paths) and the GitHub Pages CDN:

```bash
scripts/switch-env.sh dev       # point imports at relative ./
python3 -m http.server          # serve the repo root
scripts/switch-env.sh release   # restore CDN URLs (commit/deploy in this state)
scripts/switch-env.sh status    # show the active environment
```

Components with a `.js` file auto-initialize on `DOMContentLoaded`. CSS-only components (badge, card, input) need nothing but the stylesheet.

## Design tokens

```css
:root {
  --aero-primary: #ffffff;
  --aero-bg: #000000;
  --aero-fg: #ffffff;
}
```

Override these on `:root` to re-theme. Components reference `var(--aero-primary)` for checked/focus states.

---

## Components

### Button

```html
<button class="aero-btn">default</button>
<button class="aero-btn aero-btn--black">black</button>
<button class="aero-btn aero-btn--sm">Small</button>
<button class="aero-btn aero-btn--lg">Large</button>
<button class="aero-btn" disabled>disabled</button>
<button class="aero-btn" data-haptic="heavy">heavy haptic</button>
```

| Class | Description |
|---|---|
| `aero-btn--black` | Dark variant with hairline border |
| `aero-btn--sm` / `aero-btn--lg` | Size modifiers |
| `aero-btn--loading` | Spinner state (set via JS, see below) |

Haptics fire on click automatically (`light` by default). Per-button intensity via `data-haptic` — any pattern name from the [haptics](#haptics) engine.

**Loading state (JS):**

```js
import { setLoading } from 'https://nurislamaibekuly.github.io/aeroui/src/components/button/button.js';

setLoading(button, true);   // spinner in, label hidden, clicks blocked, aria-busy
setLoading(button, false);  // restored
```

Zero layout shift — the label is hidden with `color: transparent`, not removed.

### Spinner

```html
<div class="aero-spinner"></div>
<div class="aero-spinner aero-spinner--sm"></div>
<div class="aero-spinner aero-spinner--lg"></div>
```

Auto-filled with an 8-spoke SVG on page load. For dynamically inserted spinners:

```js
import { createSpinner } from 'https://nurislamaibekuly.github.io/aeroui/src/components/spinner/spinner.js';

const el = createSpinner();       // pre-filled element
el.classList.add('aero-spinner--sm');
container.append(el);
```

### Toggle

```html
<label class="aero-toggle">
  <input type="checkbox" checked>
  <span class="aero-toggle-track"></span>
</label>

<label class="aero-toggle aero-toggle--sm"> ... </label>
```

A real checkbox underneath — keyboard and screen reader accessible. `toggle.js` adds the `switch` attribute automatically, so iOS Safari plays its native haptic tick on toggle; Android vibrates via the Vibration API.

### Card

```html
<div class="aero-card">
  <div class="aero-card-title">Title</div>
  <div class="aero-card-subtitle">Subtitle</div>
  <!-- any content -->
</div>
```

Glassmorphism: translucent fill, `backdrop-filter: blur(24px) saturate(150%)`, hairline border.

### Input

```html
<label class="aero-field">
  <input class="aero-input" type="email" placeholder=" ">
  <span class="aero-field-label">Email</span>
</label>
```

The label floats up on focus/fill (requires `placeholder=" "`). Focus ring uses `--aero-primary`.

### Badge

```html
<span class="aero-badge">default</span>
<span class="aero-badge aero-badge--solid">new</span>
<span class="aero-badge aero-badge--outline">beta</span>
<span class="aero-badge aero-badge--dot">live</span>
```

### Progress bar

```html
<div class="aero-progress" data-aero-progress="55"></div>
<div class="aero-progress aero-progress--sm" data-aero-progress="25"></div>
<div class="aero-progress aero-progress--lg" data-aero-progress="80"></div>
<div class="aero-progress aero-progress--indeterminate"></div>
```

Width is `100%` by default — constrain with a container or inline style. `data-aero-progress` seeds the value on page load; the fill uses `--aero-primary`. CSS-only usage (no script tag): add the fill yourself —

```html
<div class="aero-progress"><div class="aero-progress-fill" style="width: 55%"></div></div>
```

For dynamic updates:

```js
import { setProgress, createProgress } from 'https://nurislamaibekuly.github.io/aeroui/src/components/progress/progress.js';

setProgress(el, 70);        // clamps 0–100, updates fill + aria-valuenow
const el = createProgress(40);  // pre-filled element
container.append(el);
```

| Class | Description |
|---|---|
| `aero-progress--sm` / `aero-progress--lg` | Size modifiers (2px / 8px tall) |
| `aero-progress--indeterminate` | Looping sweep; no `aria-valuenow`, respects reduced motion |

ARIA (`role="progressbar"`, min/max/now) is managed for you.

### Tooltip

```html
<button data-aero-tooltip="Saves your changes">save</button>
<button data-aero-tooltip="Right side" data-aero-tooltip-pos="right">right</button>
<button data-aero-tooltip="Bottom side" data-aero-tooltip-pos="bottom">bottom</button>
<button data-aero-tooltip="Left side" data-aero-tooltip-pos="left">left</button>
```

Attribute-driven and CSS-only (the script just mirrors the text into `aria-label`). Shows on hover and keyboard focus after a short delay, with a 0.1s fade-out. Glassmorphism bubble matching the dropdown menu. Position defaults to `top`; override with `data-aero-tooltip-pos="top|bottom|left|right"`. Long text wraps at `240px`.

Note: absolutely positioned, so `overflow: hidden` ancestors will clip it.

### Slider

```html
<input class="aero-slider" type="range" min="0" max="100" value="55">
<input class="aero-slider aero-slider--sm" type="range" min="0" max="100" value="25">
<input class="aero-slider aero-slider--lg" type="range" min="0" max="100" value="80">
```

A native `<input type="range">` — keyboard arrows, `Home`/`End`, and screen readers come free. The white fill up to the thumb is kept in sync by JS (`--aero-fill`); min/max/value are the native attributes. Thumb scales up on hover/drag, focus ring on the thumb.

For dynamically inserted sliders:

```js
import { updateSlider } from 'https://nurislamaibekuly.github.io/aeroui/src/components/slider/slider.js';

updateSlider(el);   // re-sync fill after changing value programmatically
```

| Class | Description |
|---|---|
| `aero-slider--sm` / `aero-slider--lg` | Size modifiers (17px / 27px thumb) |

### Elastic slider

HTML port of SwiftUI `ElasticSlider` — the track thickens and grows while dragging, and stretches elastically past the ends (opposite edge resists via `pull` ratio, height narrows at full stretch). Snaps back with a spring on release, ticks haptically at the extremes.

```html
<div class="aero-elastic" data-min="0" data-max="100" data-value="55">
  <span class="aero-elastic-label">0:12</span>
  <div class="aero-elastic-track"><div class="aero-elastic-fill"></div></div>
  <span class="aero-elastic-label">-1:48</span>
</div>

<!-- bottom labels, no overshoot (matches the Swift preview) -->
<div class="aero-elastic" data-min="0" data-max="2" data-value="0.5" data-labels="bottom" data-stretch="0">
  ...
</div>
```

| Attribute | Default | Description |
|---|---|---|
| `data-min` / `data-max` / `data-value` | `0` / `100` / `0` | Range and seed value |
| `data-step` | `range / 100` | Keyboard step |
| `data-labels` | `side` | `side` (labels flank the track) or `bottom` (labels row below) |
| `data-stretch` | `9` | `maxStretch` gutter in px — overshoot distance; `0` disables elastic |
| `data-sync-labels` | off | Labels adopt the fill color (gray at rest, tint while active) |
| `data-haptics` | on | Set `"off"` to disable the extreme tick |
| `data-disabled` | off | Non-interactive |

Styling mirrors `ElasticSliderConfig` via CSS vars: `--elastic-active-h` (17px), `--elastic-inactive-h` (7px), `--elastic-growth` (9px), `--elastic-stretch` (9px), `--elastic-narrow` (4px), `--elastic-push` (0.2), `--elastic-pull` (0.5), `--elastic-track`, `--elastic-fill-idle`, `--elastic-fill-active`.

```js
import { getElasticValue, setElasticValue } from 'https://nurislamaibekuly.github.io/aeroui/src/components/elastic-slider/elastic-slider.js';

el.addEventListener('input', e => console.log(e.detail.value));  // live drag
el.addEventListener('change', e => console.log(e.detail.value)); // release / keyboard
setElasticValue(el, 70, { emitEvents: true });
getElasticValue(el);
```

Keyboard (`←/→`, `Home`/`End`, `PgUp`/`PgDn`), `role="slider"` + `aria-valuenow`, tap-to-seek, and `prefers-reduced-motion` are handled.

### Player button

HTML port of SwiftUI `PlayerButton` + its `PressGesture` — a fixed-size circular button for transport controls. Touch-down shrinks it (0.85 whole, 0.9 label) and fades in the tint circle; release snaps the scale back at once while the circle lingers 0.2s. Holding fires a repeat callback with hold time (for scrubbing); swapping the label (play ⇄ pause) plays a symbol-replace animation.

```html
<button class="aero-player" aria-label="Play">
  <svg viewBox="0 0 24 24" fill="currentColor"><path d="M4 6.8 4 17.2Q4 21 7.31 19.14L18.26 12.98Q20 12 18.26 11.02L7.31 4.86Q4 3 4 6.8Z"/></svg>
</button>

<button class="aero-player" disabled aria-label="Play">…</button>
```

| Attribute | Default | Description |
|---|---|---|
| `data-interval` | `0.1` | `pressing` repeat seconds (`updateUnterval`) |
| `data-haptics` | off | Tick on press — any pattern from [haptics](#haptics), or `"off"` |
| `disabled` | off | Native disabled: gray, gestures ignored |

Styling mirrors `PlayerButtonConfig` via CSS vars: `--player-size` (68px), `--player-icon` (34px), `--player-label`, `--player-tint`, `--player-pressed`, `--player-disabled`.

```js
import { initPlayerButtons, PLAYER_ICONS, setPlayerIcon } from 'https://nurislamaibekuly.github.io/aeroui/src/components/player-button/player-button.js';

el.addEventListener('pressstart', () => console.log('down'));                    // onPressed
el.addEventListener('pressing', e => console.log(e.detail.elapsed));             // onPressing(hold seconds)
el.addEventListener('pressend', e => console.log('up after', e.detail.elapsed)); // onEnded

setPlayerIcon(el, 'pause');  // SF-style play ⇄ pause swap (aria-label synced)
// or manual: el.querySelector('.aero-player-label').innerHTML = PLAYER_ICONS.pause;
```

Notes: cancel (system interruption) resets visuals without `pressend`, matching Swift where a cancelled drag skips `onEnded`. A rapid re-tap cancels the pending circle fade. Keyboard (`Space`/`Enter`, AT click included) drives the same three events. Icon buttons need an `aria-label`.

### Marquee

HTML port of SwiftUI `MarqueeText` — single-line text that scrolls only when it overflows. Short text renders one static copy (no mask, configurable alignment); overflowing text loops two copies with a `spacing` gap under edge-fade masks.

```html
<div class="aero-marquee" data-start-delay="1" data-align="left" data-left-fade="40" data-right-fade="40" data-spacing="100" data-speed="30">A text that is way too long, but it scrolls</div>
```

| Attribute | Default | Description |
|---|---|---|
| `data-start-delay` | `1` | Seconds (`"500ms"` accepted) before the first loop |
| `data-align` | `left` | Static-mode alignment: `left`/`center`/`right` (`leading`/`trailing` aliases) |
| `data-left-fade` / `data-right-fade` | `40` | Edge fade widths, px |
| `data-spacing` | `100` | Gap between the loop copies, px |
| `data-speed` | `30` | Scroll speed, px/s (`duration = measured / speed`) |

Styling mirrors `MarqueeText.Config` via CSS vars: `--marquee-left-fade` (40px), `--marquee-right-fade` (40px), `--marquee-spacing` (100px), `--marquee-speed` (30), `--marquee-start-delay` (`1s`), `--marquee-edge` (6px transparent mask inset at both edges). `data-*` attributes win over vars.

```js
import { setMarqueeText } from 'https://nurislamaibekuly.github.io/aeroui/src/components/marquee/marquee.js';

setMarqueeText(el, 'New now-playing title');  // re-measures, toggles scroll/static
```

Notes: the loop scrolls `0 → -(text + spacing)` linear with no autoreverse, matching Swift's `.linear(duration: width/30).delay(startDelay).repeatForever`. Scroll vs static re-evaluates on resize and font load; `prefers-reduced-motion` forces static. The element gets an `aria-label` with the full text (loop copies are `aria-hidden`).

### Skip label

HTML port of SwiftUI `AnimatedForwardLabel` + `ForwardLabel` — the forward/backward transport glyphs. At rest it looks like `forward.fill` (two play triangles); on trigger a ghost triangle slides in from the left while the trailing one squeezes out to the right, then the frame snaps back. `backward` is the same view mirrored.

```html
<button class="aero-player" aria-label="Next">
  <span class="aero-skip" data-direction="forward"></span>
</button>
```

| Attribute | Default | Description |
|---|---|---|
| `data-direction` | `forward` | `forward` or `backward` (mirrored) |
| `data-duration` | `0.3` | Full trigger stride, seconds (sweep runs `duration × 0.9`) |
| `data-size` | `34` | Glyph frame in px (overrides `--skip-size`) |

Styling via CSS var: `--skip-size` (34px). Glyph color is `currentColor`, so it follows the player button (white, with the same disabled grey).

```js
import { playSkip } from 'https://nurislamaibekuly.github.io/aeroui/src/components/skip-label/skip-label.js';

button.addEventListener('pressend', () => {
  playSkip(button.querySelector('.aero-skip'), { bouncing: true });  // Swift onEnded → trigger.toggle(bouncing:)
});
```

Notes: `bouncing: true` (the app's choice) eases the side phases with sqrt/quadratic curves plus a protrusion overshoot; `bouncing: false` runs every phase linear. Triggers are throttled to one stride with latest-wins, so rapid taps coalesce instead of stacking — matching Swift's `throttle(stride, latest: true)`. Frame math (`side = 0.3 × size`, offsets, `lerp`) is a line-for-line port of `ForwardLabel`, including the frameless leading ghost: it absorbs the row remainder (growing `0 → size/2` across the sweep), so the row always fills its frame and the ink rests optically centered — just like Swift. `prefers-reduced-motion` renders the resting frame only.

### Accordion

Native `<details>/<summary>` — keyboard and screen reader support comes free. Springs handle the height animation via the [motion](#motion) engine.

```html
<details class="aero-accordion">
  <summary>Section title</summary>
  <div class="aero-accordion-content">
    <div class="aero-accordion-inner">Content here</div>
  </div>
</details>
```

Multiple accordions stack automatically. Open/close animations use different spring configs (slow in, quick out) — matching the modal pattern.

### Segmented control

```html
<div class="aero-segmented">
  <label><input type="radio" name="tabs" checked>Day</label>
  <label><input type="radio" name="tabs">Week</label>
  <label><input type="radio" name="tabs">Month</label>
</div>
```

Radio-based (arrow keys work). The white thumb slides with spring physics from the [motion](#motion) engine and repositions on resize.

### Dropdown

```html
<div class="aero-dropdown">
  <button class="aero-btn" data-aero-dropdown>options</button>
  <div class="aero-menu">
    <button class="aero-menu-item">Duplicate</button>
    <button class="aero-menu-item" disabled>Move to Trash</button>
    <div class="aero-menu-separator"></div>
    <button class="aero-menu-item">Archive</button>
  </div>
</div>

<div class="aero-dropdown aero-dropdown--right"> ... </div>  <!-- align menu right -->
```

Glassmorphism menu anchored below the trigger. Closes on outside click, `Esc`, or item click; arrow keys navigate items (`Home`/`End` jump). Spring entrance, quick exit, haptics on trigger and items. Roles (`menu`/`menuitem`) are added automatically.

### Toast

```js
import { showToast } from 'https://nurislamaibekuly.github.io/aeroui/src/components/toast/toast.js';

showToast({ message: 'Changes saved' });
showToast({ message: 'Sending…', duration: 1500 });
```

| Option | Default | Description |
|---|---|---|
| `message` | `''` | Text content |
| `duration` | `3000` | Auto-dismiss ms (`0` = sticky) |

New toasts append at the bottom. On appear, the older toasts stagger-shift first (top leads, 45 ms cascade) and the new toast enters after they settle; on dismiss the stagger order reverses (newest first). Click a toast to dismiss it. Stack is capped at 4.

### Modal

Native `<dialog>` — Esc and focus trapping come free.

```html
<button data-aero-modal="my-modal">open</button>

<dialog class="aero-modal" id="my-modal">
  <div class="aero-card-title">Delete workspace?</div>
  <button class="aero-btn aero-btn--sm" data-aero-close>Cancel</button>
</dialog>
```

| Attribute | On | Effect |
|---|---|---|
| `data-aero-modal="id"` | button | Opens the modal with that id |
| `data-aero-close` | button inside | Closes it |

Spring entrance, quick exit, backdrop fades in and out with them. Backdrop click closes.

---

## Core

### Motion

Frame-rate independent springs. Each spring is solved analytically as a function of time, sampled once into a CSS `linear()` easing, and run through the Web Animations API — a 60 Hz and a 240 Hz screen render the identical trajectory, off the main thread.

```js
import { animate, swap, PRESETS, springToEasing } from 'https://nurislamaibekuly.github.io/aeroui/src/core/motion.js';

animate(el, keyframes, { spring: { stiffness: 170, damping: 26 } });
animate(el, keyframes, { spring: { duration: 0.3, bounce: 0 } });

const toggle = swap(el, PRESETS.pop);   // returns a function that toggles in/out
togglePop();

springToEasing({ duration: 0.3, bounce: 0 }).easing;  // raw 'linear(...)' string for CSS
```

Spring configs accept either `stiffness`/`damping`/`mass` or `duration` (seconds)/`bounce` (0–1), like Framer Motion.

Presets: `PRESETS.pop` (opacity + scale + blur), `PRESETS.bounceIn`.

Requires `linear()` easing support: Chrome 113+, Safari 17.2+, Firefox 112+.

### Haptics

```js
import { bind, PATTERNS, stop } from 'https://nurislamaibekuly.github.io/aeroui/src/core/haptics.js';

bind(element, 'medium');   // Android: vibrate on click · iOS: invisible switch overlay
bind(element, [30, 40, 30]);
stop();                    // cancel running pattern (Android)
```

| Platform | Mechanism |
|---|---|
| Android | `navigator.vibrate(pattern)` |
| iOS Safari | Invisible `<input type="checkbox" switch>` rendered over the element — the real tap toggles it and Safari fires its native tick |
| Desktop | No-op |

Patterns: `selection` `light` `soft` `medium` `heavy` `rigid` `success` `warning` `error`, or a custom ms array. iOS intensity is fixed by the system — patterns only vary on Android. Must be called within a user gesture.

### Progressive blur

Apple-style gradient backdrop blur: stacks `backdrop-filter` layers with overlapping gradient masks (alphas sum ≥ 1, no bleed-through), perceptual/geometric falloff, saturation ramp, edge tint, optional hairline.

```html
<div id="scrim" style="position: fixed; inset-inline: 0; top: -1px;"></div>
```

```js
import { ProgressiveBlur } from 'https://nurislamaibekuly.github.io/aeroui/src/core/progressive-blur.js';

const scrim = new ProgressiveBlur('#scrim', {
  position: 'top',              // 'bottom' | 'top' | 'left' | 'right' — strong edge
  strength: 26,                 // max blur radius (px)
  steps: 10,                    // layer count (2–64)
  size: '32vh',                 // extent along the axis
  falloff: 'perceptual',        // 'perceptual' | 'linear' | 'quadratic'
  saturate: 1.6,                // max saturation boost (1 = off)
  tint: 'rgba(10,10,16,0.28)',  // edge tint (null = off)
  hairline: true,               // 1px highlight at the weak edge
});

scrim.set({ strength: 40 });    // live update
scrim.destroy();
```

Declarative alternative: `data-aero-blur="top"` (+ optional `data-aero-blur-size`, `data-aero-blur-strength`) auto-initializes on page load.

**Tip:** overscan the strong edge by 1px (`top: -1px` / `bottom: -1px`) so fractional-height rounding never leaves a sharp row at the viewport edge.

---

## Browser support

- `linear()` easing: Chrome 113+, Safari 17.2+, Firefox 112+
- iOS switch haptic: Safari 17.4+
- Everything else (components, Vibration API): evergreen browsers

## License

MIT
