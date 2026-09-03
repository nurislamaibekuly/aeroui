/* Aeroelastic slider — HTML port of SwiftUI ElasticSlider.
 *
 * Faithful to the Swift math:
 *   progress  = dx / activeTrackWidth * dist + lastStored
 *   value     = clamp(progress, min, max)
 *   stretchingValue = overshoot fraction (progress - bound) / dist, else 0
 *   normalizedStretching = clamp(stretching, ±max) / max,
 *     where max = maxStretch / activeTrackWidth / pushRatio
 *   leadingStretch  = |n| * maxStretch      (dragging past min)
 *                   | -|n| * maxStretch * pullRatio (opposite side)
 *   trailingStretch = mirror for the right edge
 *   fillWidth = norm(value) * activeTrackWidth - leading + trailing
 *   height    = activeH - |n| * narrowing
 *
 * Markup (labels optional, any content):
 *
 *   <div class="aero-elastic" data-min="0" data-max="100" data-value="55">
 *     <span class="aero-elastic-label">0:12</span>
 *     <div class="aero-elastic-track"><div class="aero-elastic-fill"></div></div>
 *     <span class="aero-elastic-label">-1:48</span>
 *   </div>
 *
 * Attributes:
 *   data-min / data-max / data-value / data-step (numbers; default 0/100/0/ auto)
 *   data-labels="side|bottom" (default side)
 *   data-stretch="9"          maxStretch override (px, default 9, 0 disables elastic)
 *   data-sync-labels          labels adopt fill color (syncLabelsStyle)
 *   data-haptics="off"        disable extreme tick (default on)
 *   data-disabled             non-interactive
 *
 * Events: `input` (every move) + `change` (release / keyboard), both bubble
 * with `event.detail.value`. Helpers: getElasticValue / setElasticValue.
 */

const clamp = (v, min, max) => Math.min(max, Math.max(min, v));

function readState(el) {
  const min = Number(el.dataset.min ?? 0) || 0;
  const maxRaw = Number(el.dataset.max);
  const max = Number.isNaN(maxRaw) ? 100 : maxRaw;
  const lo = Math.min(min, max);
  const hi = Math.max(min, max);
  const dist = Math.max(hi - lo, 1e-9);
  const stepRaw = Number(el.dataset.step);
  const step = Number.isNaN(stepRaw) || stepRaw <= 0 ? dist / 100 : stepRaw;
  return { lo, hi, dist, step };
}

function readConfig(el) {
  const cs = getComputedStyle(el);
  const num = (varName, fallback) => {
    const v = parseFloat(cs.getPropertyValue(varName).trim());
    return Number.isNaN(v) ? fallback : v;
  };
  const stretchAttr = Number(el.dataset.stretch);
  return {
    activeH: num('--elastic-active-h', 17),
    inactiveH: num('--elastic-inactive-h', 7),
    growth: num('--elastic-growth', 9),
    maxStretch: !Number.isNaN(stretchAttr) && stretchAttr >= 0 ? stretchAttr : num('--elastic-stretch', 9),
    narrow: num('--elastic-narrow', 4),
    push: num('--elastic-push', 0.2) || 0.2,
    pull: num('--elastic-pull', 0.5),
  };
}

function ensureStructure(el) {
  let hit = el.querySelector(':scope > .aero-elastic-hit');
  let track = el.querySelector('.aero-elastic-track');
  if (!track) {
    track = document.createElement('div');
    track.className = 'aero-elastic-track';
    track.innerHTML = '<div class="aero-elastic-fill"></div>';
  }
  let fill = track.querySelector(':scope > .aero-elastic-fill');
  if (!fill) {
    fill = document.createElement('div');
    fill.className = 'aero-elastic-fill';
    track.append(fill);
  }
  if (!hit) {
    hit = document.createElement('div');
    hit.className = 'aero-elastic-hit';
    track.replaceWith(hit);
    hit.append(track);
  } else if (!hit.contains(track)) {
    hit.append(track);
  }

  // Bottom layout: labels live in a row under the track.
  const labels = [...el.querySelectorAll(':scope > .aero-elastic-label')];
  let labelsRow = el.querySelector(':scope > .aero-elastic-labels');
  if (el.dataset.labels === 'bottom') {
    if (!labelsRow) {
      labelsRow = document.createElement('div');
      labelsRow.className = 'aero-elastic-labels';
      el.append(labelsRow);
    }
    labels.forEach(l => labelsRow.append(l));
  } else if (labelsRow) {
    // side layout: unwrap back to direct children (leading, trailing)
    [...labelsRow.children].forEach(child => {
      if (child.classList.contains('aero-elastic-label')) {
        el.insertBefore(child, hit);
      }
    });
    if (!labelsRow.children.length) labelsRow.remove();
    else el.insertBefore(hit, labelsRow);
  }

  track.setAttribute('role', 'slider');
  track.setAttribute('tabindex', el.hasAttribute('data-disabled') ? '-1' : '0');
  track.setAttribute('aria-orientation', 'horizontal');

  return { hit, track, fill };
}

function sideLabels(el, hit) {
  const labels = [...el.querySelectorAll(':scope > .aero-elastic-label')];
  if (labels.length === 0) return { leading: null, trailing: null };
  if (labels.length === 1) {
    // Single label: side is decided by DOM position relative to the track.
    const kids = [...el.children];
    return kids.indexOf(labels[0]) < kids.indexOf(hit)
      ? { leading: labels[0], trailing: null }
      : { leading: null, trailing: labels[0] };
  }
  return { leading: labels[0], trailing: labels[labels.length - 1] };
}

/* Core render — direct port of track/body math in ElasticSlider.swift. */
function render(inst) {
  const { el, hit, track, fill } = inst;
  const { lo, hi, dist } = readState(el);
  const cfg = readConfig(el);
  const viewW = hit.offsetWidth;
  const baseActive = Math.max(0, viewW - cfg.maxStretch * 2);
  // Swift sizes the fill against the *current* track width: the resting
  // pill is narrower by growth*2, so using baseActive at rest overflows it.
  const base = inst.active ? baseActive : Math.max(0, baseActive - cfg.growth * 2);

  let normStretch = 0;
  if (cfg.maxStretch !== 0 && baseActive !== 0 && viewW > cfg.maxStretch * 2) {
    const max = cfg.maxStretch / baseActive / cfg.push;
    normStretch = max === 0 ? 0 : clamp(inst.stretching / max, -1, 1);
  }
  const stretchPx = Math.abs(normStretch) * cfg.maxStretch;
  // Swift quirk: trailing edge keys off raw stretchingValue sign; same as norm sign.
  const leadingStretch = normStretch < 0 ? stretchPx : -stretchPx * cfg.pull;
  const trailingStretch = inst.stretching > 0 ? stretchPx : -stretchPx * cfg.pull;

  const h = inst.active ? cfg.activeH - Math.abs(normStretch) * cfg.narrow : cfg.inactiveH;
  const inset = inst.active ? 0 : cfg.growth;
  track.style.height = `${Math.max(0, h)}px`;
  track.style.marginLeft = `${cfg.maxStretch - leadingStretch + inset}px`;
  track.style.marginRight = `${cfg.maxStretch - trailingStretch + inset}px`;

  const normValue = clamp((inst.value - lo) / dist, 0, 1);
  const fillW = Math.max(0, normValue * base - leadingStretch + trailingStretch);
  fill.style.width = `${fillW}px`;

  const padding = (inst.active ? 0 : cfg.growth) + cfg.maxStretch;
  if (el.dataset.labels === 'bottom') {
    const row = el.querySelector(':scope > .aero-elastic-labels');
    if (row) {
      row.style.paddingLeft = `${padding - leadingStretch}px`;
      row.style.paddingRight = `${padding - trailingStretch}px`;
    }
  } else {
    const { leading, trailing } = sideLabels(el, hit);
    if (leading) leading.style.transform = `translateX(${(padding - leadingStretch).toFixed(2)}px)`;
    if (trailing) trailing.style.transform = `translateX(${(trailingStretch - padding).toFixed(2)}px)`;
  }

  track.setAttribute('aria-valuemin', String(lo));
  track.setAttribute('aria-valuemax', String(hi));
  track.setAttribute('aria-valuenow', String(inst.value));
}

function emit(el, track, type) {
  track.dispatchEvent(new CustomEvent(type, { bubbles: true, detail: { value: getElasticValue(el) } }));
}

function buzz(el) {
  if (el.dataset.haptics === 'off') return;
  if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
  if ('vibrate' in navigator) {
    try { navigator.vibrate(10); } catch { /* noop */ }
  }
}

function getElasticValue(el) {
  if (el._aeroElastic) return el._aeroElastic.value;
  const v = Number(el.dataset.value ?? 0);
  return Number.isNaN(v) ? 0 : v;
}

function setElasticValue(el, v, { emitEvents = false } = {}) {
  const inst = el._aeroElastic;
  if (!inst) {
    el.dataset.value = String(v);
    return;
  }
  const { lo, hi } = readState(el);
  inst.value = clamp(Number(v) || 0, lo, hi);
  inst.lastStored = inst.value;
  inst.stretching = 0;
  el.dataset.value = String(inst.value);
  render(inst);
  if (emitEvents) {
    emit(el, inst.track, 'input');
    emit(el, inst.track, 'change');
  }
}

function initElasticSlider(el) {
  if (el._aeroElastic) {
    render(el._aeroElastic);
    return el._aeroElastic;
  }
  // Keep the CSS gutter (hit padding) in sync with the JS math when
  // maxStretch is overridden declaratively via data-stretch.
  const stretchAttr = Number(el.dataset.stretch);
  if (!Number.isNaN(stretchAttr) && stretchAttr >= 0) {
    el.style.setProperty('--elastic-stretch', `${stretchAttr}px`);
  }
  const { hit, track, fill } = ensureStructure(el);
  const { lo, hi } = readState(el);
  const seed = Number(el.dataset.value);
  const inst = {
    el, hit, track, fill,
    value: clamp(Number.isNaN(seed) ? lo : seed, lo, hi),
    lastStored: clamp(Number.isNaN(seed) ? lo : seed, lo, hi),
    stretching: 0,
    active: false,
    extreme: false, // latch for haptic tick
    gesture: null,
  };
  el._aeroElastic = inst;
  el.dataset.value = String(inst.value);
  render(inst);

  const setActive = on => {
    inst.active = on;
    el.classList.toggle('aero-elastic--active', on);
  };

  const updateFromProgress = progress => {
    const { lo: l, hi: h, dist: d } = readState(el);
    const next = clamp(progress, l, h);
    const hitExtreme = next === l || next === h;
    if (hitExtreme && !inst.extreme) buzz(el);
    inst.extreme = hitExtreme;
    inst.value = next;
    inst.stretching = progress < l ? (progress - l) / d : progress > h ? (progress - h) / d : 0;
    el.dataset.value = String(inst.value);
    render(inst);
    emit(el, track, 'input');
  };

  track.addEventListener('keydown', e => {
    if (el.hasAttribute('data-disabled')) return;
    const { lo: l, hi: h, dist: d, step } = readState(el);
    let target = null;
    if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') target = inst.value - step;
    else if (e.key === 'ArrowRight' || e.key === 'ArrowUp') target = inst.value + step;
    else if (e.key === 'Home') target = l;
    else if (e.key === 'End') target = h;
    else if (e.key === 'PageDown') target = inst.value - d / 10;
    else if (e.key === 'PageUp') target = inst.value + d / 10;
    if (target === null) return;
    e.preventDefault();
    // Briefly grow like a touch would (Swift isActive flash).
    setActive(true);
    clearTimeout(inst._keyT);
    inst._keyT = setTimeout(() => { if (!inst.gesture) setActive(false); render(inst); }, 160);
    updateFromProgress(target);
    inst.lastStored = inst.value;
    inst.stretching = 0;
    render(inst);
    emit(el, track, 'change');
  });

  hit.addEventListener('pointerdown', e => {
    if (el.hasAttribute('data-disabled')) return;
    if (e.button !== undefined && e.button !== 0) return;
    e.preventDefault();
    // Keyboard continuity without stealing the visible focus ring on pointer.
    // (focusVisible is ignored where unsupported — harmless.)
    try { track.focus({ preventScroll: true, focusVisible: false }); }
    catch { try { track.focus(); } catch { /* noop */ } }
    try { hit.setPointerCapture(e.pointerId); } catch { /* noop */ }

    const { dist } = readState(el);
    const cfg = readConfig(el);
    const baseActive = Math.max(1, hit.offsetWidth - cfg.maxStretch * 2);
    inst.gesture = {
      id: e.pointerId,
      startX: e.clientX,
      startValue: inst.value,
      baseActive,
      dist,
      moved: false,
      downT: performance.now(),
    };
    inst.lastStored = inst.value;
    inst.extreme = inst.value === readState(el).lo || inst.value === readState(el).hi;
    setActive(true);
    render(inst); // grow springs in (no --dragging yet: direct manipulation starts on move)
  });

  hit.addEventListener('pointermove', e => {
    const g = inst.gesture;
    if (!g || e.pointerId !== g.id) return;
    const dx = e.clientX - g.startX;
    if (Math.abs(dx) > 2) {
      g.moved = true;
      // Geometry now follows the pointer 1:1 — disable easing.
      el.classList.add('aero-elastic--dragging');
    }
    // Relative-translation model, exactly like Swift's DragGesture.
    updateFromProgress(g.startValue + (dx / g.baseActive) * g.dist);
  });

  const endGesture = e => {
    const g = inst.gesture;
    if (!g || (e && e.pointerId !== g.id)) return;

    // Tap-to-seek: a clean tap (no drag) jumps to the tapped point,
    // since Swift's relative model alone would do nothing on tap.
    if (!g.moved && e && performance.now() - g.downT < 400) {
      const rect = hit.getBoundingClientRect();
      const cfg = readConfig(el);
      const { lo: l, dist: d } = readState(el);
      const base = Math.max(1, rect.width - cfg.maxStretch * 2);
      const x = clamp(e.clientX - rect.left - cfg.maxStretch, 0, base);
      updateFromProgress(l + (x / base) * d);
    }

    inst.gesture = null;
    inst.lastStored = inst.value;
    inst.stretching = 0;
    inst.extreme = false;
    el.classList.remove('aero-elastic--dragging');
    setActive(false);
    render(inst); // snap-back springs via CSS transition
    emit(el, track, 'change');
  };

  hit.addEventListener('pointerup', endGesture);
  hit.addEventListener('pointercancel', endGesture);

  // Keep fill/stretch math correct across layout changes.
  if ('ResizeObserver' in window) {
    inst._ro = new ResizeObserver(() => render(inst));
    inst._ro.observe(hit);
  }

  return inst;
}

function initElasticSliders(root = document) {
  root.querySelectorAll('.aero-elastic').forEach(initElasticSlider);
}

document.addEventListener('DOMContentLoaded', () => initElasticSliders());

export { initElasticSliders, initElasticSlider, getElasticValue, setElasticValue };
