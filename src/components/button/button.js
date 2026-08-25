import { bind } from '../../core/haptics.js';
import { createSpinner } from '../spinner/spinner.js';

function setLoading(btn, loading) {
  let spinner = btn.querySelector(':scope > .aero-spinner');

  if (loading) {
    btn.setAttribute('aria-busy', 'true');
    btn.classList.add('aero-btn--loading');
    if (!spinner) {
      spinner = createSpinner();
      spinner.classList.add('aero-spinner--sm');
      btn.prepend(spinner);
    }
  } else {
    btn.removeAttribute('aria-busy');
    btn.classList.remove('aero-btn--loading');
    spinner?.remove();
  }
}

function initButtons(root = document) {
  root.querySelectorAll('.aero-btn').forEach(btn => {
    bind(btn, btn.dataset.haptic || 'light');
  });
}

document.addEventListener('DOMContentLoaded', () => initButtons());

export { initButtons, setLoading };
