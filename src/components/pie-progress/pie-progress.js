const NS = 'http://www.w3.org/2000/svg';
const C = 2 * Math.PI * 50;

function svgEl(tag, attrs) {
  const el = document.createElementNS(NS, tag);
  for (const k in attrs) el.setAttribute(k, attrs[k]);
  return el;
}

function makeRing(fill, el) {
  const svg = svgEl('svg', { viewBox: '0 0 100 100' });
  const sw = parseFloat(getComputedStyle(el).getPropertyValue('--aero-pie-ring')) || 3;
  svg.appendChild(svgEl('circle', { cx: 50, cy: 50, r: 50, fill: 'none', stroke: 'rgba(120,120,128,0.24)', 'stroke-width': sw }));
  const val = svgEl('circle', { cx: 50, cy: 50, r: 50, fill: 'none', stroke: '#fff', 'stroke-width': sw, 'stroke-dasharray': C, 'stroke-dashoffset': C });
  svg.appendChild(val);
  fill.appendChild(svg);
  return val;
}

function setPieProgress(el, value) {
  const v = Math.max(0, Math.min(100, Number(value) || 0));
  el.setAttribute('aria-valuenow', String(Math.round(v)));
  if (el._ring) {
    el._ring.style.strokeDashoffset = C * (1 - v / 100);
  } else {
    el.style.setProperty('--aero-pie-pct', v + '%');
  }
}

function createPieProgress(value = 0) {
  const el = document.createElement('div');
  el.className = 'aero-pie';
  el.setAttribute('role', 'progressbar');
  el.setAttribute('aria-valuemin', '0');
  el.setAttribute('aria-valuemax', '100');
  const fill = document.createElement('div');
  fill.className = 'aero-pie-fill';
  el.appendChild(fill);
  setPieProgress(el, value);
  return el;
}

function initPie(root = document) {
  root.querySelectorAll('.aero-pie').forEach(el => {
    el.setAttribute('role', 'progressbar');
    el.setAttribute('aria-valuemin', '0');
    el.setAttribute('aria-valuemax', '100');
    const fill = document.createElement('div');
    fill.className = 'aero-pie-fill';
    el.appendChild(fill);
    if (el.classList.contains('aero-pie--ring')) {
      el._ring = makeRing(fill, el);
    }
    const v = parseFloat(el.dataset.aeroPieProgress);
    setPieProgress(el, Number.isNaN(v) ? 0 : v);
  });
}

document.addEventListener('DOMContentLoaded', () => initPie());

export { initPie, setPieProgress, createPieProgress };
