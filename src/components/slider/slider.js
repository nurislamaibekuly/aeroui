const THUMB = { base: 22, sm: 17, lg: 27 };

function thumbSize(el) {
  if (el.classList.contains('aero-slider--sm')) return THUMB.sm;
  if (el.classList.contains('aero-slider--lg')) return THUMB.lg;
  return THUMB.base;
}

function updateSlider(el) {
  const min = Number(el.min) || 0;
  const max = Number(el.max);
  const v = Number(el.value);
  const pct = max > min ? ((v - min) / (max - min)) * 100 : 0;
  el.style.setProperty('--aero-fill', pct + '%');
}

function valueFromX(el, clientX) {
  const rect = el.getBoundingClientRect();
  const min = Number(el.min) || 0;
  const max = Number(el.max) || 100;
  const t = thumbSize(el);
  const pct = Math.max(0, Math.min(1, (clientX - rect.left - t / 2) / (rect.width - t)));
  return min + pct * (max - min);
}

function thumbCenterX(el, value) {
  const rect = el.getBoundingClientRect();
  const min = Number(el.min) || 0;
  const max = Number(el.max) || 100;
  const t = thumbSize(el);
  return rect.left + t / 2 + ((value - min) / (max - min)) * (rect.width - t);
}

function setStretch(el, s) {
  el._aeroStretch = s;
  el.style.setProperty('--aero-sx', (1 + s * 0.4).toFixed(3));
  el.style.setProperty('--aero-sy', (1 - s * 0.22).toFixed(3));
}

function decayStretch(el) {
  cancelAnimationFrame(el._aeroStretchFrame);
  function step() {
    const s = (el._aeroStretch || 0) * 0.82;
    if (s < 0.01) {
      setStretch(el, 0);
      return;
    }
    setStretch(el, s);
    el._aeroStretchFrame = requestAnimationFrame(step);
  }
  el._aeroStretchFrame = requestAnimationFrame(step);
}

function trackVelocity(el, clientX) {
  const now = performance.now();
  if (el._aeroLastX != null) {
    const v = Math.abs(clientX - el._aeroLastX) / Math.max(1, now - el._aeroLastT);
    const s = Math.min(1, (el._aeroStretch || 0) + v * 1.4);
    setStretch(el, s);
    decayStretch(el);
  }
  el._aeroLastX = clientX;
  el._aeroLastT = now;
}

function animateValue(el, from, to, duration = 340) {
  const start = performance.now();
  const c1 = 1.2;
  const c3 = c1 + 1;

  function step(now) {
    const t = Math.min((now - start) / duration, 1);
    const eased = 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
    el.value = from + (to - from) * eased;
    updateSlider(el);
    if (t < 1) el._aeroFrame = requestAnimationFrame(step);
  }

  el._aeroFrame = requestAnimationFrame(step);
}

function initSliders(root = document) {
  root.querySelectorAll('input[type="range"].aero-slider').forEach(el => {
    updateSlider(el);
    if (el.dataset.aeroBound) return;
    el.dataset.aeroBound = '1';

    el.addEventListener('input', () => updateSlider(el));

    el.addEventListener('pointerdown', (e) => {
      if (el.disabled) return;
      cancelAnimationFrame(el._aeroFrame);
      el._aeroLastX = null;
      el._aeroLastT = 0;

      const onThumb = Math.abs(e.clientX - thumbCenterX(el, Number(el.value))) <= thumbSize(el) / 2 + 2;

      if (!onThumb) {
        e.preventDefault();
        animateValue(el, Number(el.value), valueFromX(el, e.clientX));

        const move = (ev) => {
          cancelAnimationFrame(el._aeroFrame);
          el.value = valueFromX(el, ev.clientX);
          updateSlider(el);
          trackVelocity(el, ev.clientX);
        };
        const up = () => {
          window.removeEventListener('pointermove', move);
          window.removeEventListener('pointerup', up);
          window.removeEventListener('pointercancel', up);
          el.classList.remove('aero-slider--dragging');
          decayStretch(el);
        };
        window.addEventListener('pointermove', move);
        window.addEventListener('pointerup', up);
        window.addEventListener('pointercancel', up);
      }

      el.classList.add('aero-slider--dragging');
    });

    el.addEventListener('pointermove', (e) => {
      if (el.classList.contains('aero-slider--dragging') && e.buttons) {
        trackVelocity(el, e.clientX);
      }
    });

    const release = () => {
      el.classList.remove('aero-slider--dragging');
      decayStretch(el);
    };
    el.addEventListener('pointerup', release);
    el.addEventListener('pointercancel', release);
  });
}

document.addEventListener('DOMContentLoaded', () => initSliders());

export { initSliders, updateSlider };
