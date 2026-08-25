function initToggles(root = document) {
  root.querySelectorAll('.aero-toggle > input[type="checkbox"]').forEach(input => {
    input.setAttribute('switch', '');
    input.addEventListener('change', () => {
      if ('vibrate' in navigator && window.matchMedia('(pointer: coarse)').matches) {
        navigator.vibrate(10);
      }
    });
  });
}

document.addEventListener('DOMContentLoaded', () => initToggles());

export { initToggles };
