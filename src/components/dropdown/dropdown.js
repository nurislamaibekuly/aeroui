import { animate } from '../../core/motion.js';
import { bind } from '../../core/haptics.js';

const ENTER = {
  hidden: { opacity: 0, transform: 'scale(0.95) translateY(-8px)' },
  shown: { opacity: 1, transform: 'scale(1) translateY(0)' },
};

function isOpen(menu) {
  return menu.classList.contains('aero-menu--open');
}

function triggerOf(menu) {
  return menu.closest('.aero-dropdown')?.querySelector('[data-aero-dropdown]');
}

function enabledItems(menu) {
  return [...menu.querySelectorAll('.aero-menu-item:not(:disabled)')];
}

function stopAnimations(menu) {
  menu.getAnimations().forEach(a => a.cancel());
}

function closeAllMenus(except = null) {
  document.querySelectorAll('.aero-menu.aero-menu--open').forEach(menu => {
    if (menu !== except) closeMenu(menu);
  });
}

function openMenu(triggerOrMenu) {
  const menu = triggerOrMenu.classList?.contains('aero-menu')
    ? triggerOrMenu
    : triggerOrMenu.closest('.aero-dropdown')?.querySelector(':scope > .aero-menu');
  const trigger = menu && triggerOf(menu);
  if (!menu || !trigger || isOpen(menu)) return;

  closeAllMenus(menu);
  stopAnimations(menu);
  delete menu._aeroClosing;
  menu.setAttribute('role', 'menu');
  menu.querySelectorAll('.aero-menu-item').forEach(item => {
    item.setAttribute('role', 'menuitem');
    if (!item.hasAttribute('tabindex')) item.tabIndex = -1;
  });
  menu.classList.add('aero-menu--open');
  animate(menu, [ENTER.hidden, ENTER.shown], { spring: { duration: 0.3, bounce: 0.15 } });
  trigger.setAttribute('aria-expanded', 'true');
}

function closeMenu(triggerOrMenu) {
  const menu = triggerOrMenu.classList?.contains('aero-menu')
    ? triggerOrMenu
    : triggerOrMenu.closest('.aero-dropdown')?.querySelector(':scope > .aero-menu');
  if (!menu || !isOpen(menu) || menu._aeroClosing) return;
  menu._aeroClosing = true;

  animate(menu, [ENTER.shown, ENTER.hidden], { spring: { duration: 0.18, bounce: 0 } })
    .finished.then(() => {
      menu._aeroClosing = false;
      menu.classList.remove('aero-menu--open');
    });
  triggerOf(menu)?.setAttribute('aria-expanded', 'false');
}

function initDropdowns(root = document) {
  root.querySelectorAll('.aero-dropdown').forEach(dropdown => {
    const trigger = dropdown.querySelector('[data-aero-dropdown]');
    const menu = dropdown.querySelector(':scope > .aero-menu');
    if (!trigger || !menu || trigger._aeroDropdownBound) return;
    trigger._aeroDropdownBound = true;

    trigger.setAttribute('aria-haspopup', 'menu');
    trigger.setAttribute('aria-expanded', 'false');
    bind(trigger, 'light');
    menu.querySelectorAll('.aero-menu-item').forEach(item => bind(item, 'selection'));

    trigger.addEventListener('click', () => (isOpen(menu) ? closeMenu(menu) : openMenu(menu)));

    trigger.addEventListener('keydown', e => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (!isOpen(menu)) openMenu(menu);
        enabledItems(menu)[0]?.focus();
      }
    });

    menu.addEventListener('keydown', e => {
      const items = enabledItems(menu);
      const index = items.indexOf(document.activeElement);
      let next = -1;

      if (e.key === 'ArrowDown') next = (index + 1) % items.length;
      else if (e.key === 'ArrowUp') next = index <= 0 ? items.length - 1 : index - 1;
      else if (e.key === 'Home') next = 0;
      else if (e.key === 'End') next = items.length - 1;

      if (next >= 0) {
        e.preventDefault();
        items[next]?.focus();
      }
    });

    menu.addEventListener('click', e => {
      const item = e.target.closest('.aero-menu-item');
      if (!item || item.disabled) return;
      closeMenu(menu);
      trigger.focus();
    });
  });
}

document.addEventListener('click', e => {
  document.querySelectorAll('.aero-menu.aero-menu--open').forEach(menu => {
    if (!menu.closest('.aero-dropdown').contains(e.target)) closeMenu(menu);
  });
});

document.addEventListener('keydown', e => {
  if (e.key !== 'Escape') return;
  document.querySelectorAll('.aero-menu.aero-menu--open').forEach(menu => {
    closeMenu(menu);
    triggerOf(menu)?.focus();
  });
});

document.addEventListener('DOMContentLoaded', () => initDropdowns());

export { initDropdowns, openMenu, closeMenu };
