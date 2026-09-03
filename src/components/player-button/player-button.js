/* Player button — HTML port of SwiftUI PlayerButton + PressGesture.
 *
 * Swift semantics (PressGesture.swift):
 *   - zero-distance drag: onPressed fires once on touch-down,
 *   - a free-running `interval` timer calls onPressing(elapsed) while held,
 *   - onEnded fires on release (not on cancel).
 * PlayerButton adds: tint circle + dual scale (0.85 whole / 0.9 label) while
 * held; on release the scale snaps back at once, the circle fades 0.2s later;
 * label swaps animate with a symbol-replace transition. Disabled = no-op.
 *
 * Markup (native <button> recommended — keyboard + disabled come free):
 *
 *   <button class="aero-player" aria-label="Play">
 *     <svg …>…</svg>
 *   </button>
 *
 * Attributes:
 *   data-interval="0.1"   onPressing repeat seconds (updateUnterval)
 *   data-haptics="light"  opt-in tick on press (off by default; any pattern
 *                         name from core/haptics.js, or "off")
 *   disabled / data-disabled (latter for non-<button> elements)
 *
 * Events (all bubble):
 *   pressstart            onPressed — once per touch-down / key-down
 *   pressing              onPressing — detail.elapsed (seconds held, float)
 *   pressend              onEnded — detail.elapsed at release
 *
 * Replace the label content (e.g. play ⇄ pause) and the swap animates.
 */

import { animate } from '../../core/motion.js';
import { PATTERNS } from '../../core/haptics.js';

const HIDE_DELAY_MS = 200; // Swift delay(0.2) before the circle fades
const ECHO_GUARD_MS = 600; // ignore synthetic clicks right after our gesture
// Swift withAnimation default: soft, ~half-second, (near-)critically damped.
// This is what makes the press feel like the original instead of a snap.
const PRESS_IN_SPRING = { duration: 0.15, bounce: 0.1 };
const PRESS_SPRING = { duration: 0.9, bounce: 0.6 };
// Press-down stays near-instant (like UIButton highlight): even a 60ms light
// tap lands visibly. Only the release gets the soft spring above.

function isDisabled(el) {
  return el.disabled === true || el.hasAttribute('data-disabled');
}

function intervalSec(el) {
  const v = Number(el.dataset.interval);
  return Number.isNaN(v) || v <= 0 ? 0.1 : v;
}

function ensureLabel(el) {
  let label = el.querySelector(':scope > .aero-player-label');
  if (!label) {
    label = document.createElement('span');
    label.className = 'aero-player-label';
    while (el.firstChild) label.append(el.firstChild);
    el.append(label);
  }
  return label;
}

function emit(el, type, detail) {
  el.dispatchEvent(new CustomEvent(type, { bubbles: true, detail }));
}

function tap(el) {
  const p = el.dataset.haptics;
  if (!p || p === 'off') return;
  if ('vibrate' in navigator) {
    try { navigator.vibrate(PATTERNS[p] ?? PATTERNS.light); } catch { /* noop */ }
  }
}

function reducedMotion() {
  return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
}

/* Current uniform scale (1 when idle). Reads the live composited value so a
 * release mid-press reverses from exactly where the eye sees it — no snap. */
function currentScale(el) {
  try {
    return new DOMMatrix(getComputedStyle(el).transform).a || 1;
  } catch {
    return 1;
  }
}

/* Dual scaleEffect parity: 0.85 whole button, 0.9 label. WAAPI owns transform
 * (CSS must not transition it), so every move starts from the live value and
 * quick taps still travel through visible motion instead of snapping. */
function scaleTo(inst, pressed) {
  const fromBtn = currentScale(inst.el);
  const fromLabel = currentScale(inst.label);
  const toBtn = pressed ? 0.85 : 1;
  const toLabel = pressed ? 0.9 : 1;
  const spring = pressed ? PRESS_IN_SPRING : PRESS_SPRING;
  inst._btnAnim?.cancel();
  inst._labelAnim?.cancel();
  if (reducedMotion()) return;
  try {
    inst._btnAnim = animate(inst.el,
      [{ transform: `scale(${fromBtn})` }, { transform: `scale(${toBtn})` }],
      { spring });
    inst._labelAnim = animate(inst.label,
      [{ transform: `scale(${fromLabel})` }, { transform: `scale(${toLabel})` }],
      { spring });
  } catch {
    inst.el.style.transform = `scale(${toBtn})`;
    inst.label.style.transform = `scale(${toLabel})`;
  }
}

/* contentTransition(.symbolEffect(.replace)) for label swaps. */
function watchLabel(inst, label) {
  const mo = new MutationObserver(() => {
    if (reducedMotion()) return;
    inst._swap?.cancel();
    const a = animate(label, [
      { opacity: 0, transform: 'scale(0.6)', filter: 'blur(4px)' },
      { opacity: 1, transform: 'scale(1)', filter: 'blur(0px)' },
    ], { spring: { duration: 0.3, bounce: 0.3 } });
    // Don't let the finished fill pin transform and fight the press scale.
    a.finished.then(() => a.cancel()).catch(() => {});
    inst._swap = a;
  });
  mo.observe(label, { childList: true, characterData: true, subtree: true });
  inst._mo = mo;
}

function beginPress(inst) {
  const { el } = inst;
  if (isDisabled(el) || inst.held) return false;
  clearTimeout(inst.hideT); // cancel a stale circle-hide from a quick re-tap
  inst.held = true;
  inst.downT = performance.now();
  el.classList.add('aero-player--pressed', 'aero-player--circle');
  scaleTo(inst, true);
  tap(el);
  emit(el, 'pressstart', {});
  const ms = intervalSec(el) * 1000;
  clearInterval(inst.timer);
  inst.timer = setInterval(() => {
    if (!inst.held) return;
    emit(el, 'pressing', { elapsed: (performance.now() - inst.downT) / 1000 });
  }, ms);
  return true;
}

function endPress(inst, { cancelled = false } = {}) {
  const { el } = inst;
  if (!inst.held) return false;
  inst.held = false;
  clearInterval(inst.timer);
  inst.lastEnd = Date.now();
  el.classList.remove('aero-player--pressed'); // scale back now …
  scaleTo(inst, false);
  clearTimeout(inst.hideT);
  inst.hideT = setTimeout(() => el.classList.remove('aero-player--circle'), HIDE_DELAY_MS); // … circle fades later
  if (!cancelled) emit(el, 'pressend', { elapsed: (performance.now() - inst.downT) / 1000 });
  return true;
}

function initPlayerButton(el) {
  if (el._aeroPlayer) return el._aeroPlayer;
  if (!/^(BUTTON|A)$/.test(el.tagName)) {
    el.setAttribute('role', el.getAttribute('role') || 'button');
    if (!el.hasAttribute('tabindex')) el.tabIndex = isDisabled(el) ? -1 : 0;
  }
  const label = ensureLabel(el);
  const inst = {
    el, label,
    held: false, downT: 0, timer: null, hideT: null,
    lastEnd: 0, _swap: null, _mo: null,
  };
  el._aeroPlayer = inst;
  watchLabel(inst, label);

  el.addEventListener('pointerdown', e => {
    if (isDisabled(el)) return;
    if (e.button !== undefined && e.button !== 0) return;
    e.preventDefault();
    try { el.focus({ preventScroll: true, focusVisible: false }); }
    catch { try { el.focus(); } catch { /* noop */ } }
    try { el.setPointerCapture(e.pointerId); } catch { /* noop */ }
    inst._pointerId = e.pointerId;
    beginPress(inst);
  });

  el.addEventListener('pointerup', e => {
    if (inst._pointerId !== undefined && e.pointerId !== inst._pointerId) return;
    inst._pointerId = undefined;
    endPress(inst);
  });
  // Cancelled gesture (Swift: onEnded NOT called) — reset visuals silently.
  el.addEventListener('pointercancel', () => {
    inst._pointerId = undefined;
    endPress(inst, { cancelled: true });
  });
  el.addEventListener('lostpointercapture', () => {
    inst._pointerId = undefined;
    endPress(inst, { cancelled: true });
  });
  el.addEventListener('contextmenu', e => {
    if (inst.held) e.preventDefault(); // mobile long-press menu
  });

  el.addEventListener('keydown', e => {
    if (isDisabled(el) || e.repeat) return;
    if (e.key !== ' ' && e.key !== 'Enter') return;
    e.preventDefault();
    beginPress(inst);
  });
  el.addEventListener('keyup', e => {
    if (e.key !== ' ' && e.key !== 'Enter') return;
    e.preventDefault();
    endPress(inst);
  });

  // Assistive-tech activation fires click with no pointer/keyboard gesture.
  // Our own gestures suppress compat clicks via preventDefault; anything
  // arriving here (outside the echo window) is a genuine synthetic tap.
  el.addEventListener('click', () => {
    if (isDisabled(el) || inst.held) return;
    if (Date.now() - inst.lastEnd < ECHO_GUARD_MS) return;
    if (beginPress(inst)) setTimeout(() => endPress(inst), 140);
  });

  return inst;
}

function initPlayerButtons(root = document) {
  root.querySelectorAll('.aero-player').forEach(initPlayerButton);
}

document.addEventListener('DOMContentLoaded', () => initPlayerButtons());

/* SF Symbols-style transport glyphs (play.fill / pause.fill parity).
 * Clean-room rounded triangle + rounded bars measured against the native
 * medium-weight symbols (play IoU 0.978, pause IoU 0.999 after bbox
 * normalization) — blunt tip, full-round left corners, modest bar radius. */
const PLAYER_ICONS = {
  play: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M4 6.8 4 17.2Q4 21 7.31 19.14L18.26 12.98Q20 12 18.26 11.02L7.31 4.86Q4 3 4 6.8Z"/></svg>',
  pause: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><rect x="5.27" y="3" width="5.45" height="18" rx="1.3"/><rect x="13.28" y="3" width="5.45" height="18" rx="1.3"/></svg>',
};

/* Swap the label icon with the symbol-replace animation (via watchLabel).
 * name: "play" | "pause". Also keeps aria-label in sync. */
function setPlayerIcon(el, name) {
  const inst = el._aeroPlayer ?? initPlayerButton(el);
  inst.label.innerHTML = PLAYER_ICONS[name] ?? PLAYER_ICONS.play;
  el.setAttribute('aria-label', name === 'pause' ? 'Pause' : 'Play');
}

export { initPlayerButtons, initPlayerButton, PLAYER_ICONS, setPlayerIcon };
