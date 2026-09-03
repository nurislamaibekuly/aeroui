/* Marquee text — HTML port of SwiftUI MarqueeText (AppleMusicStylePlayer).
 *
 * Swift semantics:
 *   - the text is measured through a hidden overlay; when the measured width
 *     (text + leftFade + rightFade) exceeds the view width, two copies loop
 *     seamlessly with a `spacing` gap, otherwise one static copy shows.
 *   - the loop scrolls 0 → -(text + spacing), linear, with
 *     duration = measuredWidth / 30, startDelay applied once, repeatForever,
 *     no autoreverse.
 *   - the scrolling copies sit under an edge-fade mask (leftFade/rightFade
 *     gradients with a 6pt transparent inset at both edges); static text
 *     has no mask and follows `alignment`.
 *
 * Markup (text as content; config via data-* attributes or CSS vars):
 *
 *   <div class="aero-marquee" data-start-delay="1" data-align="left"
 *        data-left-fade="40" data-right-fade="40" data-spacing="100"
 *        data-speed="30">A text that is way too long, but it scrolls</div>
 *
 * Attributes (each wins over its --marquee-* CSS var, which wins by default):
 *   data-start-delay  seconds (or "500ms") before the first loop (default 1)
 *   data-align        static-mode alignment: left|center|right
 *                     (leading/trailing aliases; default left)
 *   data-left-fade / data-right-fade   edge fade widths in px (default 40/40)
 *   data-spacing      gap between the loop copies in px (default 100)
 *   data-speed        scroll speed in px/s (default 30; Swift's /30 divisor)
 *
 * Helpers: initMarquees(root?), initMarquee(el), setMarqueeText(el, text).
 * The element gets an aria-label with the full text (animated copies are
 * aria-hidden). prefers-reduced-motion forces the static copy.
 */

function reducedMotion() {
  return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
}

function parseSeconds(v, fallback) {
  if (v == null) return fallback;
  const s = String(v).trim().toLowerCase();
  if (!s) return fallback;
  if (s.endsWith('ms')) {
    const n = Number(s.slice(0, -2));
    return Number.isNaN(n) || n < 0 ? fallback : n / 1000;
  }
  const n = Number(s.replace(/s$/, ''));
  return Number.isNaN(n) || n < 0 ? fallback : n;
}

function parsePx(v, fallback) {
  const n = Number(String(v ?? '').replace(/px$/, ''));
  return Number.isNaN(n) || n < 0 ? fallback : n;
}

function parseSpeed(v, fallback) {
  const n = Number(v);
  return Number.isNaN(n) || n <= 0 ? fallback : n;
}

const ALIGN_ALIASES = { leading: 'left', trailing: 'right', left: 'left', center: 'center', right: 'right' };

function readConfig(el) {
  const cs = getComputedStyle(el);
  const css = (name) => cs.getPropertyValue(name).trim();
  const num = (attr, varName, fallback, parse) =>
    parse(el.dataset[attr] ?? (css(varName) || undefined), fallback);
  const alignRaw = (el.dataset.align ?? css('--marquee-align') ?? 'left').trim().toLowerCase();
  return {
    startDelay: num('startDelay', '--marquee-start-delay', 1, parseSeconds),
    align: ALIGN_ALIASES[alignRaw] ?? 'left',
    leftFade: num('leftFade', '--marquee-left-fade', 40, parsePx),
    rightFade: num('rightFade', '--marquee-right-fade', 40, parsePx),
    spacing: num('spacing', '--marquee-spacing', 100, parsePx),
    speed: num('speed', '--marquee-speed', 30, parseSpeed),
  };
}

function applyConfig(el, cfg) {
  const st = el.style;
  st.setProperty('--marquee-left-fade', `${cfg.leftFade}px`);
  st.setProperty('--marquee-right-fade', `${cfg.rightFade}px`);
  st.setProperty('--marquee-spacing', `${cfg.spacing}px`);
  st.setProperty('--marquee-align', cfg.align);
}

function ensureStructure(el) {
  let stat = el.querySelector(':scope > .aero-marquee-static');
  let track = el.querySelector(':scope > .aero-marquee-track');
  let sizer = el.querySelector(':scope > .aero-marquee-sizer');
  if (!stat || !track || !sizer) {
    const text = el.dataset.text ?? el.textContent;
    el.textContent = '';
    stat = document.createElement('span');
    stat.className = 'aero-marquee-static';
    stat.textContent = text;
    track = document.createElement('div');
    track.className = 'aero-marquee-track';
    track.setAttribute('aria-hidden', 'true');
    track.append(
      Object.assign(document.createElement('span'), { className: 'aero-marquee-copy', textContent: text }),
      Object.assign(document.createElement('span'), { className: 'aero-marquee-copy', textContent: text }),
    );
    sizer = document.createElement('span');
    sizer.className = 'aero-marquee-sizer';
    sizer.setAttribute('aria-hidden', 'true');
    sizer.textContent = text;
    el.append(stat, track, sizer);
  }
  return {
    stat,
    track,
    copies: [...track.querySelectorAll(':scope > .aero-marquee-copy')],
    sizer,
  };
}

/* Re-measure and toggle scrolling vs static, (re)starting the WAAPI loop. */
function layout(inst) {
  const { el } = inst;
  const cfg = readConfig(el);
  applyConfig(el, cfg);
  const parts = ensureStructure(el);
  inst.parts = parts;
  const { stat, track, copies, sizer } = parts;

  const raw = sizer.offsetWidth; // single-line text width (hidden overlay parity)
  const viewWidth = el.clientWidth;
  const measured = raw + cfg.leftFade + cfg.rightFade; // Swift textSize.width
  const shouldAnimate = !reducedMotion() && viewWidth > 0 && measured > viewWidth;

  inst.anim?.cancel();
  inst.anim = null;
  el.classList.toggle('aero-marquee--animated', shouldAnimate);
  if (!shouldAnimate) return;

  // Loop distance: one full copy + the spacing gap, so copy 2 lands exactly
  // where copy 1 started (Swift lineWidth = text + spacing).
  const loop = copies[0].offsetWidth + cfg.spacing;
  if (loop <= 0) return;
  try {
    inst.anim = track.animate(
      [{ transform: 'translateX(0)' }, { transform: `translateX(${-loop}px)` }],
      {
        duration: (measured / cfg.speed) * 1000, // Swift .linear(width/30)
        delay: cfg.startDelay * 1000,            // Swift startDelay, once
        iterations: Infinity,                    // Swift repeatForever
        easing: 'linear',                        // no autoreverse
      },
    );
  } catch {
    // Pre-WAAPI browsers: static copy stays visible.
    el.classList.remove('aero-marquee--animated');
  }
}

function syncText(inst, text) {
  inst.text = text;
  const { stat, copies, sizer } = inst.parts ?? ensureStructure(inst.el);
  stat.textContent = text;
  copies.forEach((c) => { c.textContent = text; });
  sizer.textContent = text;
  inst.el.setAttribute('aria-label', text);
  layout(inst);
}

function initMarquee(el) {
  if (el._aeroMarquee) return el._aeroMarquee;
  const inst = { el, parts: null, anim: null, text: '', _ro: null, _mo: null };
  el._aeroMarquee = inst;
  inst.parts = ensureStructure(el);
  syncText(inst, el.dataset.text ?? inst.parts.stat.textContent);

  inst._ro = new ResizeObserver(() => layout(inst));
  inst._ro.observe(el);
  inst._mo = new MutationObserver((muts) => {
    const textMut = muts.find((m) => m.attributeName === 'data-text');
    if (textMut && el.dataset.text !== undefined) syncText(inst, el.dataset.text);
    else layout(inst);
  });
  inst._mo.observe(el, { attributes: true, attributeFilter: ['data-start-delay', 'data-align', 'data-left-fade', 'data-right-fade', 'data-spacing', 'data-speed', 'data-text'] });
  return inst;
}

function setMarqueeText(el, text) {
  const inst = el._aeroMarquee ?? initMarquee(el);
  syncText(inst, String(text));
}

function initMarquees(root = document) {
  root.querySelectorAll('.aero-marquee').forEach(initMarquee);
}

document.addEventListener('DOMContentLoaded', () => initMarquees());
if (document.fonts?.ready) document.fonts.ready.then(() => initMarquees());

export { initMarquees, initMarquee, setMarqueeText };
