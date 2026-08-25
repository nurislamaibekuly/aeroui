const PATTERNS = {
  selection: 8,
  light: 10,
  medium: 20,
  heavy: 35,
  soft: 15,
  rigid: [20, 30, 20],
  success: [15, 60, 20],
  warning: [25, 60, 25],
  error: [30, 45, 30, 45, 30],
};

function resolve(pattern) {
  return typeof pattern === 'string' ? (PATTERNS[pattern] ?? PATTERNS.light) : pattern;
}

function isIos() {
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  );
}

function isTouchDevice() {
  return window.matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window;
}

function createSwitchOverlay() {
  const el = document.createElement('input');
  el.type = 'checkbox';
  el.setAttribute('switch', '');
  el.setAttribute('aria-hidden', 'true');
  el.tabIndex = -1;

  Object.assign(el.style, {
    position: 'absolute',
    inset: '0',
    width: '100%',
    height: '100%',
    margin: '0',
    opacity: '0',
    clipPath: 'inset(0 round 999px)',
    touchAction: 'manipulation',
    WebkitTapHighlightColor: 'transparent',
  });

  return el;
}

function attach(element) {
  if (!element || !isIos()) return;

  if (getComputedStyle(element).position === 'static') {
    element.style.position = 'relative';
  }

  if (element.querySelector(':scope > input[switch]')) return;

  element.appendChild(createSwitchOverlay());
}

function bind(element, pattern = 'light') {
  if (!element || !isTouchDevice()) return;

  if (isIos()) {
    attach(element);
    return;
  }

  element.addEventListener('click', () => {
    if ('vibrate' in navigator) navigator.vibrate(resolve(pattern));
  });
}

function stop() {
  if ('vibrate' in navigator) navigator.vibrate(0);
}

export { PATTERNS, attach, bind, stop };
