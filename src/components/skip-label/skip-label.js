/* Skip label — HTML port of SwiftUI AnimatedForwardLabel + ForwardLabel
 * (AppleMusicStylePlayer).
 *
 * Swift semantics:
 *   - resting frame = two play triangles (middle glyph at size/2 plus the
 *     right ghost at full width), i.e. the forward.fill look, centered in a
 *     (size + 2*side) frame where side = 0.3*size. The leading ghost is a
 *     flexible resizable image with no frame: it collapses to zero width at
 *     rest, so the row always exactly fills the frame and centers itself.
 *   - on trigger, progress animates 0 → 1 linearly over duration*0.9, then
 *     snaps back to 0 in the completion (no reverse sweep). The leading
 *     ghost grows 0 → size/2 while fading in as the trailing ghost
 *     shrinks size/2 → 0 while fading out — ink stays centered at both ends
 *     and bulges sideways mid-sweep.
 *   - triggers are throttled to one stride (duration) with latest-wins, so
 *     rapid taps coalesce instead of stacking.
 *   - bouncing (PlayerButtons passes true) eases the side phases with sqrt /
 *     quadratic curves plus a protrusion overshoot; linear runs every phase
 *     straight. Backward mirrors the whole frame (scaleEffect(x: -1)).
 *
 * Markup (JS injects the three glyphs; direction + config via data-*):
 *
 *   <span class="aero-skip" data-direction="forward"></span>
 *   <span class="aero-skip" data-direction="backward" data-duration="0.3" data-size="34"></span>
 *
 * Usually nested in an .aero-player button; wire the button's `pressend`
 * (Swift PlayerButtons onEnded) to playSkip, like the demo page does.
 *
 * Attributes:
 *   data-direction  forward|backward (default forward)
 *   data-duration   full trigger stride, seconds (default 0.3)
 *   data-size       glyph frame in px, overrides --skip-size (default 34)
 *
 * Helpers: initSkipLabels(root?), initSkipLabel(el),
 *          playSkip(el, { bouncing = true, duration } = {}).
 */

/* Play-triangle ink, cropped viewBox so the glyph fills its box exactly
 * (same traced path as PLAYER_ICONS.play in player-button.js). */
const SKIP_GLYPH =
  '<svg viewBox="4 3 16 18" fill="currentColor" aria-hidden="true"><path d="M4 6.8 4 17.2Q4 21 7.31 19.14L18.26 12.98Q20 12 18.26 11.02L7.31 4.86Q4 3 4 6.8Z"/></svg>';

const SIDE_FRACTION = 0.3; // Swift ForwardLabel.sideFraction (let)
const DEFAULT_DURATION = 0.3; // Swift AnimatedForwardLabel.animationDuration
const DEFAULT_SIZE = 34; // Swift PlayerButtons.imageSize

const lerp = (v0, v1, t) => v0 + t * (v1 - v0); // Palette.swift lerp

function reducedMotion() {
  return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
}

function readSize(el) {
  const attr = Number(el.dataset.size);
  if (!Number.isNaN(attr) && attr > 0) return attr;
  const v = parseFloat(getComputedStyle(el).getPropertyValue('--skip-size').trim());
  return Number.isNaN(v) || v <= 0 ? DEFAULT_SIZE : v;
}

function readDuration(el) {
  const v = Number(el.dataset.duration);
  return Number.isNaN(v) || v <= 0 ? DEFAULT_DURATION : v;
}

/* Exact port of ForwardLabel's computed vars (progress clamped 0...1 like
 * AnimationWrapper's .clamped(to: 0...1)). All offsets/widths in px.
 * leftWidth is the flexible ghost image absorbing the HStack remainder
 * (Swift resizable image with no frame): frameW - paddings - fixed boxes,
 * growing 0 → size/2 across the sweep. */
function skipFrame(size, progress, linear) {
  const side = size * SIDE_FRACTION;
  const frameW = size + side * 2; // Swift .frame(width: size + side*2)
  const p = Math.min(1, Math.max(0, progress));
  const scaleProgress = Math.max(0, (p - SIDE_FRACTION) / (1 - SIDE_FRACTION));
  const growth = Math.min(1, p / SIDE_FRACTION);
  const leftGrowth = linear ? growth : Math.sqrt(growth);
  const linearRight = Math.max(0, scaleProgress - (1 - SIDE_FRACTION * 2)) / SIDE_FRACTION / 2;
  const shrink = linear ? linearRight : linearRight * linearRight;
  const protrusion = linearRight - shrink;
  const leftOffset = Math.min(SIDE_FRACTION, p) * size + (1 - leftGrowth) * side + protrusion * side;
  const rightOffset = Math.max(0, SIDE_FRACTION - p) * size + shrink * side;
  const rightWidth = lerp(0, size / 2, 1 - scaleProgress);
  return {
    leftOffset,
    leftWidth: Math.max(0, frameW - leftOffset - size / 2 - rightWidth - rightOffset),
    rightOffset,
    rightWidth,
    leftOpacity: p,
    rightOpacity: 1 - p,
  };
}

function renderFrame(inst, progress, linear) {
  const f = skipFrame(inst.size, progress, linear);
  const px = (v) => `${Math.abs(v) < 1e-9 ? 0 : Math.round(v * 1000) / 1000}px`;
  const { ghostL, ghostR } = inst.parts;
  ghostL.style.marginLeft = px(f.leftOffset);
  ghostL.style.width = px(f.leftWidth);
  ghostL.style.opacity = f.leftOpacity;
  ghostR.style.width = px(f.rightWidth);
  ghostR.style.marginRight = px(f.rightOffset);
  ghostR.style.opacity = f.rightOpacity;
}

function ensureStructure(el) {
  let ghostL = el.querySelector('[data-ghost="left"]');
  let mid = el.querySelector('.aero-skip-mid');
  let ghostR = el.querySelector('[data-ghost="right"]');
  if (!ghostL || !mid || !ghostR) {
    ghostL = document.createElement('span');
    ghostL.className = 'aero-skip-ghost';
    ghostL.dataset.ghost = 'left';
    ghostL.innerHTML = SKIP_GLYPH;
    mid = document.createElement('span');
    mid.className = 'aero-skip-mid';
    mid.innerHTML = SKIP_GLYPH;
    ghostR = document.createElement('span');
    ghostR.className = 'aero-skip-ghost';
    ghostR.dataset.ghost = 'right';
    ghostR.innerHTML = SKIP_GLYPH;
  }
  // Flatten any legacy .aero-skip-shift wrapper (removed: the row self-centers).
  const shift = el.querySelector(':scope > .aero-skip-shift');
  el.textContent = '';
  el.append(ghostL, mid, ghostR);
  shift?.remove();
  return { ghostL, mid, ghostR };
}

function initSkipLabel(el) {
  if (el._aeroSkip) return el._aeroSkip;
  const inst = {
    el, parts: null, size: DEFAULT_SIZE, duration: DEFAULT_DURATION,
    raf: 0, lastStart: -Infinity, pending: null, pendingT: null,
  };
  el._aeroSkip = inst;
  if ((el.dataset.direction ?? 'forward').toLowerCase() === 'backward') {
    el.classList.add('aero-skip--backward');
  }
  inst.size = readSize(el);
  inst.duration = readDuration(el);
  if (el.dataset.size) el.style.setProperty('--skip-size', `${inst.size}px`);
  inst.parts = ensureStructure(el);
  renderFrame(inst, 0, true); // resting frame
  return inst;
}

/* Swift AnimatedForwardLabel trigger: linear 0 → 1 sweep over duration*0.9,
 * then the completion snaps back to 0 (no reverse). */
function runPlay(inst, { bouncing = true, duration = inst.duration } = {}) {
  cancelAnimationFrame(inst.raf);
  clearTimeout(inst.pendingT);
  inst.pendingT = null;
  inst.lastStart = performance.now();
  const linear = !bouncing; // Swift AnimationWrapper(linear: !bouncing)
  if (reducedMotion()) {
    renderFrame(inst, 0, true);
    return;
  }
  const total = Math.max(duration, 1e-3) * 0.9 * 1000;
  const t0 = performance.now();
  const tick = (now) => {
    const p = Math.min(1, (now - t0) / total);
    renderFrame(inst, p, linear);
    if (p < 1) {
      inst.raf = requestAnimationFrame(tick);
    } else {
      inst.raf = 0;
      renderFrame(inst, 0, linear); // completion snap-back
    }
  };
  inst.raf = requestAnimationFrame(tick);
}

/* Throttle to one stride with latest-wins (Swift throttle(stride, latest: true)). */
function playSkip(el, opts = {}) {
  const inst = el._aeroSkip ?? initSkipLabel(el);
  const stride = (opts.duration ?? inst.duration) * 1000;
  const now = performance.now();
  if (inst.raf || now - inst.lastStart < stride) {
    inst.pending = opts;
    if (!inst.pendingT) {
      inst.pendingT = setTimeout(() => {
        inst.pendingT = null;
        const next = inst.pending;
        inst.pending = null;
        if (next) runPlay(inst, next);
      }, Math.max(0, stride - (now - inst.lastStart)));
    }
    return;
  }
  runPlay(inst, opts);
}

function initSkipLabels(root = document) {
  root.querySelectorAll('.aero-skip').forEach(initSkipLabel);
}

document.addEventListener('DOMContentLoaded', () => initSkipLabels());

export { initSkipLabels, initSkipLabel, playSkip, skipFrame };
