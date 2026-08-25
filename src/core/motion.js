const SETTLE_EPSILON = 0.001;

function clamp(v, min, max) {
  return Math.min(max, Math.max(min, v));
}

function resolveSpring({ stiffness = 170, damping = 26, mass = 1, bounce, duration } = {}) {
  if (duration !== undefined && bounce !== undefined) {
    const zeta = clamp(1 - bounce, 0.0001, 1);
    const omega = Math.log(1 / SETTLE_EPSILON) / (zeta * duration);
    return { zeta, omega };
  }
  const omega = Math.sqrt(stiffness / mass);
  const zeta = damping / (2 * Math.sqrt(stiffness * mass));
  return { zeta, omega };
}

function displacement(t, zeta, omega) {
  if (zeta < 1) {
    const wd = omega * Math.sqrt(1 - zeta * zeta);
    return Math.exp(-zeta * omega * t) * (Math.cos(wd * t) + ((zeta * omega) / wd) * Math.sin(wd * t));
  }
  if (zeta === 1) {
    return Math.exp(-omega * t) * (1 + omega * t);
  }
  const s = Math.sqrt(zeta * zeta - 1);
  const r1 = -omega * (zeta - s);
  const r2 = -omega * (zeta + s);
  return (r2 * Math.exp(r1 * t) - r1 * Math.exp(r2 * t)) / (r2 - r1);
}

function settleTime(zeta, omega) {
  let t = 0.016;
  while (t < 10 && Math.abs(displacement(t, zeta, omega)) > SETTLE_EPSILON) {
    t *= 1.25;
  }
  return t;
}

function springToEasing(config = {}) {
  const { zeta, omega } = resolveSpring(config);
  const durationSec = config.duration !== undefined ? config.duration : settleTime(zeta, omega);

  const steps = clamp(Math.round((durationSec * 1000) / 8), 24, 480);
  const points = [];
  for (let i = 0; i <= steps; i++) {
    const t = (i / steps) * durationSec;
    points.push(Number((1 - displacement(t, zeta, omega)).toFixed(5)));
  }
  points[0] = 0;
  points[points.length - 1] = 1;

  return {
    easing: `linear(${points.join(', ')})`,
    durationMs: Math.round(durationSec * 1000),
  };
}

function animate(el, keyframes, options = {}) {
  const { easing, durationMs } = springToEasing(options.spring ?? {});
  const anim = el.animate(keyframes, {
    duration: options.durationMs ?? durationMs,
    delay: options.delay ?? 0,
    easing,
    fill: 'both',
  });
  anim.finished.catch(() => {});
  return anim;
}

function swap(el, preset) {
  let shown = false;
  let current;

  return () => {
    shown = !shown;
    current?.cancel();
    current = shown
      ? animate(el, [preset.hidden, preset.shown], { spring: preset.spring })
      : animate(el, [preset.shown, preset.hidden], { spring: preset.spring });
  };
}

const PRESETS = {
  pop: {
    hidden: { opacity: 0, transform: 'scale(0.25)', filter: 'blur(4px)' },
    shown: { opacity: 1, transform: 'scale(1)', filter: 'blur(0px)' },
    spring: { duration: 0.3, bounce: 0 },
  },
  bounceIn: {
    hidden: { opacity: 0, transform: 'scale(0.6) translateY(12px)' },
    shown: { opacity: 1, transform: 'scale(1) translateY(0)' },
    spring: { duration: 0.55, bounce: 0.4 },
  },
};

export { PRESETS, animate, swap, springToEasing };
