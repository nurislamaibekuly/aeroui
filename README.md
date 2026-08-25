# aeroui

Black & white, dependency-free UI components for the web. Vanilla CSS + ES modules, no build step, no framework.

```
aeroui/
├── index.html                        demo page
└── src/
    ├── aeroui.css                    entry point — imports all components + design tokens
    ├── components/
    │   ├── badge/badge.css
    │   ├── button/button.css · button.js
    │   ├── card/card.css
    │   ├── input/input.css
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
<link rel="stylesheet" href="./src/aeroui.css">
<script type="module" src="./src/components/button/button.js"></script>
```

ES modules require serving over HTTP (any static server works):

```bash
python3 -m http.server
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
import { setLoading } from './src/components/button/button.js';

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
import { createSpinner } from './src/components/spinner/spinner.js';

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

### Segmented control

```html
<div class="aero-segmented">
  <label><input type="radio" name="tabs" checked>Day</label>
  <label><input type="radio" name="tabs">Week</label>
  <label><input type="radio" name="tabs">Month</label>
</div>
```

Radio-based (arrow keys work). The white thumb slides with spring physics from the [motion](#motion) engine and repositions on resize.

### Toast

```js
import { showToast } from './src/components/toast/toast.js';

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

Spring entrance, quick exit, backdrop click closes.

---

## Core

### Motion

Frame-rate independent springs. Each spring is solved analytically as a function of time, sampled once into a CSS `linear()` easing, and run through the Web Animations API — a 60 Hz and a 240 Hz screen render the identical trajectory, off the main thread.

```js
import { animate, swap, PRESETS, springToEasing } from './src/core/motion.js';

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
import { bind, PATTERNS, stop } from './src/core/haptics.js';

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
import { ProgressiveBlur } from './src/core/progressive-blur.js';

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
