import { animate } from '../../core/motion.js';

function initAccordions(root = document) {
  root.querySelectorAll('details.aero-accordion').forEach(details => {
    const summary = details.querySelector('summary');
    const content = details.querySelector('.aero-accordion-content');
    if (!summary || !content || summary.dataset.aeroBound) return;
    summary.dataset.aeroBound = '1';

    let current;

    summary.addEventListener('click', (e) => {
      if (!details.open) return;
      e.preventDefault();
      details.classList.remove('aero-accordion--open');
      if (current) current.cancel();
      content.style.overflow = 'hidden';
      const from = content.scrollHeight + 'px';
      current = animate(content, [{ height: from }, { height: '0px' }], {
        spring: { duration: 0.22, bounce: 0 },
      });
      current.finished.then(() => {
        details.open = false;
        content.style.height = '';
        content.style.overflow = '';
        current = null;
      });
    });

    details.addEventListener('toggle', () => {
      if (!details.open) return;
      details.classList.add('aero-accordion--open');
      if (current) current.cancel();
      content.style.height = '0px';
      content.style.overflow = 'hidden';
      const to = content.scrollHeight + 'px';
      current = animate(content, [{ height: '0px' }, { height: to }], {
        spring: { duration: 0.35, bounce: 0.08 },
      });
      current.finished.then(() => {
        content.style.height = '';
        content.style.overflow = '';
        current = null;
      });
    });
  });
}

document.addEventListener('DOMContentLoaded', () => initAccordions());

export { initAccordions };
