const STYLE_ID = 'aero-progressive-blur-style';

const DEFAULTS = {
  position: 'bottom',
  strength: 26,
  steps: 10,
  size: '32vh',
  falloff: 'perceptual',
  saturate: 1.6,
  tint: 'rgba(10, 10, 16, 0.28)',
  hairline: true,
};

const AXES = {
  bottom: { dir: 'to bottom', flip: false, vertical: true },
  top: { dir: 'to top', flip: false, vertical: true },
  right: { dir: 'to right', flip: false, vertical: false },
  left: { dir: 'to left', flip: false, vertical: false },
};

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function pct(v) {
  return (v * 100).toFixed(3) + '%';
}

function radiusFor(falloff, s, maxR) {
  if (falloff === 'linear') return 1 + (maxR - 1) * s;
  if (falloff === 'quadratic') return 1 + (maxR - 1) * s * s;
  return Math.pow(Math.max(1.6, maxR), s);
}

function maskFor(i, n, dir) {
  let stops;
  if (i === 0) {
    stops = ['rgba(0,0,0,0) 0%', 'rgba(0,0,0,1) ' + pct(1 / n)];
  } else {
    stops = [
      'rgba(0,0,0,0) ' + pct(Math.max(0, (i - 1) / n)),
      'rgba(0,0,0,1) ' + pct(i / n),
    ];
  }
  if (i === n - 1) {
    stops.push('rgba(0,0,0,1) 100%');
  } else {
    stops.push(
      'rgba(0,0,0,1) ' + pct((i + 1) / n),
      'rgba(0,0,0,0) ' + pct(Math.min(1, (i + 2) / n))
    );
  }
  return 'linear-gradient(' + dir + ', ' + stops.join(', ') + ')';
}

function ensureStyles(doc) {
  if (doc.getElementById(STYLE_ID)) return;
  const style = doc.createElement('style');
  style.id = STYLE_ID;
  style.textContent =
    '.aero-pblur{pointer-events:none}' +
    '.aero-pblur-node{position:absolute}' +
    '.aero-pblur-layer{inset:0}';
  doc.head.appendChild(style);
}

function resolveTarget(target, doc) {
  return typeof target === 'string' ? doc.querySelector(target) : target;
}

function ProgressiveBlur(target, options = {}) {
  return new _ProgressiveBlur(target, options);
}

class _ProgressiveBlur {
  constructor(target, options = {}) {
    const doc = target?.ownerDocument ?? document;
    ensureStyles(doc);
    this.el = resolveTarget(target, doc);
    if (!this.el) throw new Error('aero progressive-blur: target element not found');
    this.options = { ...DEFAULTS, ...options };
    this._owned = [];
    this._inline = {};
    this._render();
  }

  _render() {
    const opts = this.options;
    const host = this.el;
    const doc = host.ownerDocument;

    this._teardown();

    if (!this._inline.position) {
      const computed = doc.defaultView.getComputedStyle(host).position;
      if (computed === 'static') {
        host.style.position = 'absolute';
        this._inline.position = true;
      }
    }
    host.classList.add('aero-pblur');

    const axis = AXES[opts.position] || AXES.bottom;
    if (axis.vertical) {
      host.style.height = opts.size;
      this._inline.height = true;
    } else {
      host.style.width = opts.size;
      this._inline.width = true;
    }

    const n = clamp(Math.round(opts.steps) || DEFAULTS.steps, 2, 64);
    const maxR = Math.max(1, +opts.strength || DEFAULTS.strength);
    const saturate = Math.max(1, +opts.saturate || 1);
    const dir = axis.dir;

    for (let i = 0; i < n; i++) {
      const t = (i + 0.5) / n;
      const s = axis.flip ? 1 - t : t;
      const r = radiusFor(opts.falloff, s, maxR);
      const sat = Math.round(100 + (saturate - 1) * 100 * Math.pow(s, 1.4));

      const layer = doc.createElement('div');
      layer.className = 'aero-pblur-node aero-pblur-layer';
      let filter = 'blur(' + r.toFixed(2) + 'px)';
      if (sat > 100) filter += ' saturate(' + sat + '%)';
      layer.style.backdropFilter = filter;
      layer.style.webkitBackdropFilter = filter;
      const mask = maskFor(i, n, dir);
      layer.style.maskImage = mask;
      layer.style.webkitMaskImage = mask;
      host.appendChild(layer);
      this._owned.push(layer);
    }

    if (opts.tint) {
      const tint = doc.createElement('div');
      tint.className = 'aero-pblur-node';
      tint.style.inset = '0';
      tint.style.background = 'linear-gradient(' + dir + ', rgba(0,0,0,0) 45%, ' + opts.tint + ' 96%)';
      host.appendChild(tint);
      this._owned.push(tint);
    }

    if (opts.hairline) {
      const line = doc.createElement('div');
      line.className = 'aero-pblur-node';
      if (opts.position === 'top') {
        line.style.bottom = '0';
      } else if (opts.position === 'left') {
        line.style.right = '0';
      } else if (opts.position === 'right') {
        line.style.left = '0';
      } else {
        line.style.top = '0';
      }
      if (axis.vertical) {
        line.style.left = '0';
        line.style.right = '0';
        line.style.height = '1px';
      } else {
        line.style.top = '0';
        line.style.bottom = '0';
        line.style.width = '1px';
      }
      line.style.background =
        'linear-gradient(' +
        (axis.vertical ? 'to right' : 'to bottom') +
        ', rgba(0,0,0,0), rgba(255,255,255,0.28) 50%, rgba(0,0,0,0))';
      host.appendChild(line);
      this._owned.push(line);
    }
  }

  _teardown() {
    this._owned.forEach(node => node.parentNode?.removeChild(node));
    this._owned.length = 0;
  }

  set(options) {
    Object.assign(this.options, options);
    this._render();
    return this;
  }

  destroy() {
    this._teardown();
    this.el.classList.remove('aero-pblur');
    if (this._inline.position) this.el.style.removeProperty('position');
    if (this._inline.height) this.el.style.removeProperty('height');
    if (this._inline.width) this.el.style.removeProperty('width');
    this._inline = {};
    return this;
  }
}

function initProgressiveBlur(root = document) {
  root.querySelectorAll('[data-aero-blur]').forEach(el => {
    if (el._aeroBlur) return;
    el._aeroBlur = new ProgressiveBlur(el, {
      position: el.dataset.aeroBlur || 'bottom',
      ...(el.dataset.aeroBlurSize ? { size: el.dataset.aeroBlurSize } : {}),
      ...(el.dataset.aeroBlurStrength ? { strength: +el.dataset.aeroBlurStrength } : {}),
    });
  });
}

document.addEventListener('DOMContentLoaded', () => initProgressiveBlur());

export { ProgressiveBlur, initProgressiveBlur };
