const SPINNER_SVG = `<svg viewBox="0 0 1080 1080" xmlns="http://www.w3.org/2000/svg">
  <rect x="487.50" y="176.00" width="105" height="230" rx="52.50" fill="currentColor" transform="rotate(0.0 540 540)" />
  <rect x="487.50" y="176.00" width="105" height="230" rx="52.50" fill="currentColor" transform="rotate(45.0 540 540)" />
  <rect x="487.50" y="176.00" width="105" height="230" rx="52.50" fill="currentColor" transform="rotate(90.0 540 540)" />
  <rect x="487.50" y="176.00" width="105" height="230" rx="52.50" fill="currentColor" transform="rotate(135.0 540 540)" />
  <rect x="487.50" y="176.00" width="105" height="230" rx="52.50" fill="currentColor" transform="rotate(180.0 540 540)" />
  <rect x="487.50" y="176.00" width="105" height="230" rx="52.50" fill="currentColor" transform="rotate(225.0 540 540)" />
  <rect x="487.50" y="176.00" width="105" height="230" rx="52.50" fill="currentColor" transform="rotate(270.0 540 540)" />
  <rect x="487.50" y="176.00" width="105" height="230" rx="52.50" fill="currentColor" transform="rotate(315.0 540 540)" />
</svg>`;

function createSpinner() {
  const el = document.createElement('div');
  el.className = 'aero-spinner';
  el.innerHTML = SPINNER_SVG;
  return el;
}

function initSpinners() {
  document.querySelectorAll('.aero-spinner:not(svg)').forEach(el => {
    el.innerHTML = SPINNER_SVG;
  });
}

document.addEventListener('DOMContentLoaded', initSpinners);

export { createSpinner, initSpinners };
