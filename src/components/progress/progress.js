function ensureFill(el) {
  let fill = el.querySelector(':scope > .aero-progress-fill');
  if (!fill) {
    fill = document.createElement('div');
    fill.className = 'aero-progress-fill';
    el.append(fill);
  }
  return fill;
}

function setProgress(el, value) {
  const v = Math.max(0, Math.min(100, Number(value) || 0));
  el.classList.remove('aero-progress--indeterminate');
  el.setAttribute('role', 'progressbar');
  el.setAttribute('aria-valuemin', '0');
  el.setAttribute('aria-valuemax', '100');
  el.setAttribute('aria-valuenow', String(Math.round(v)));
  ensureFill(el).style.width = v + '%';
}

function createProgress(value = 0) {
  const el = document.createElement('div');
  el.className = 'aero-progress';
  setProgress(el, value);
  return el;
}

function initProgress(root = document) {
  root.querySelectorAll('.aero-progress').forEach(el => {
    el.setAttribute('role', 'progressbar');
    ensureFill(el);
    if (el.classList.contains('aero-progress--indeterminate')) return;
    const v = parseFloat(el.dataset.aeroProgress);
    setProgress(el, Number.isNaN(v) ? 0 : v);
  });
}

document.addEventListener('DOMContentLoaded', () => initProgress());

export { initProgress, setProgress, createProgress };
