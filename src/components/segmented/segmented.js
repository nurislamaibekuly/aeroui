import { animate } from '../../core/motion.js';

function place(thumb, label, withSpring) {
  const target = [
    { left: `${thumb.offsetLeft}px`, width: `${thumb.offsetWidth}px` },
    { left: `${label.offsetLeft}px`, width: `${label.offsetWidth}px` },
  ];

  if (!withSpring) {
    Object.assign(thumb.style, target[1]);
    return;
  }

  thumb._aeroAnim?.cancel();
  thumb._aeroAnim = animate(thumb, target, { spring: { duration: 0.35, bounce: 0.25 } });
}

function thumbFor(seg) {
  let thumb = seg.querySelector(':scope > .aero-segmented-thumb');
  if (!thumb) {
    thumb = document.createElement('span');
    thumb.className = 'aero-segmented-thumb';
    seg.appendChild(thumb);
  }
  return thumb;
}

function activeLabel(seg) {
  const input =
    seg.querySelector('input[type="radio"]:checked') ?? seg.querySelector('input[type="radio"]');
  return input?.closest('label');
}

function initSegmented(root = document) {
  root.querySelectorAll('.aero-segmented').forEach(seg => {
    const thumb = thumbFor(seg);
    const label = activeLabel(seg);
    if (label) place(thumb, label, false);

    seg.addEventListener('change', e => {
      const target = e.target.closest('label');
      if (target) place(thumb, target, true);
    });

    document.fonts?.ready.then(() => {
      const current = activeLabel(seg);
      if (current) place(thumb, current, false);
    });
  });
}

window.addEventListener('resize', () => {
  document.querySelectorAll('.aero-segmented').forEach(seg => {
    const thumb = seg.querySelector(':scope > .aero-segmented-thumb');
    const label = activeLabel(seg);
    if (thumb && label) place(thumb, label, false);
  });
});

document.addEventListener('DOMContentLoaded', () => initSegmented());

export { initSegmented };
