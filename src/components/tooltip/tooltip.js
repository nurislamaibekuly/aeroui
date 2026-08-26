function initTooltips(root = document) {
  root.querySelectorAll('[data-aero-tooltip]').forEach(el => {
    if (!el.hasAttribute('aria-label')) {
      el.setAttribute('aria-label', el.dataset.aeroTooltip);
    }
  });
}

document.addEventListener('DOMContentLoaded', () => initTooltips());

export { initTooltips };
