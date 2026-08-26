import { animate } from '../../core/motion.js';

const ENTER = {
  hidden: { opacity: 0, transform: 'scale(1.2)' },
  shown: { opacity: 1, transform: 'scale(1)' },
};

const BACKDROP = {
  hidden: { opacity: 0 },
  shown: { opacity: 1 },
};

function openModal(dialog) {
  if (dialog.open) return;
  dialog.showModal();
  animate(dialog, [ENTER.hidden, ENTER.shown], { spring: { duration: 0.4, bounce: 0.18 } });
  animate(dialog, [BACKDROP.hidden, BACKDROP.shown], {
    spring: { duration: 0.3, bounce: 0 },
    pseudoElement: '::backdrop',
  });
}

function closeModal(dialog) {
  if (!dialog.open || dialog._aeroClosing) return;
  dialog._aeroClosing = true;

  const panel = animate(dialog, [ENTER.shown, ENTER.hidden], { spring: { duration: 0.18, bounce: 0 } });
  const backdrop = animate(dialog, [BACKDROP.shown, BACKDROP.hidden], {
    spring: { duration: 0.18, bounce: 0 },
    pseudoElement: '::backdrop',
  });

  Promise.all([panel.finished, backdrop.finished]).then(() => {
    dialog._aeroClosing = false;
    dialog.close();
  });
}

function initModals(root = document) {
  root.querySelectorAll('dialog.aero-modal').forEach(dialog => {
    dialog.addEventListener('cancel', e => {
      e.preventDefault();
      closeModal(dialog);
    });
    dialog.addEventListener('click', e => {
      if (e.target === dialog) closeModal(dialog);
    });
    dialog.querySelectorAll('[data-aero-close]').forEach(btn => {
      btn.addEventListener('click', () => closeModal(dialog));
    });
  });

  root.querySelectorAll('[data-aero-modal]').forEach(btn => {
    btn.addEventListener('click', () => {
      const dialog = document.getElementById(btn.dataset.aeroModal);
      if (dialog) openModal(dialog);
    });
  });
}

document.addEventListener('DOMContentLoaded', () => initModals());

export { initModals, openModal, closeModal };
