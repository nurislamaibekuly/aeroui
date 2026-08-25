import { animate } from '../../core/motion.js';

const ENTER = {
  hidden: { opacity: 0, transform: 'translateY(24px) scale(0.9)', filter: 'blur(4px)' },
  shown: { opacity: 1, transform: 'translateY(0) scale(1)', filter: 'blur(0px)' },
};

const EXIT = {
  opacity: 0,
  transform: 'translateY(10px) scale(0.95)',
  filter: 'blur(4px)',
};

const SHIFT = { duration: 0.35, bounce: 0.2 };
const STAGGER = 45;

let container;

function getContainer() {
  if (container && document.body.contains(container)) return container;
  container = document.createElement('div');
  container.className = 'aero-toast-container';
  document.body.appendChild(container);
  return container;
}

function shiftStack(box, mutate, newestFirst) {
  const others = [...box.children];
  others.forEach(t => t._aeroShift?.cancel());
  const before = others.map(t => t.getBoundingClientRect().top);

  mutate();

  const order = newestFirst ? [...others].reverse() : others;
  const delays = new Map(order.map((t, i) => [t, i * STAGGER]));

  let total = 0;
  others.forEach((t, i) => {
    if (!t.isConnected) return;
    const delta = t.getBoundingClientRect().top - before[i];
    if (!delta) return;
    const delay = delays.get(t) ?? 0;
    t._aeroShift = animate(
      t,
      [{ transform: `translateY(${-delta}px)` }, { transform: 'translateY(0px)' }],
      { spring: SHIFT, delay }
    );
    total = Math.max(total, delay + STAGGER + SHIFT.duration);
  });
  return total;
}

function dismiss(toast) {
  if (toast._aeroDone) return;
  toast._aeroDone = true;
  animate(toast, [{ ...ENTER.shown }, EXIT], { spring: { duration: 0.22, bounce: 0 } })
    .finished.then(() => {
      const box = toast.parentElement;
      if (box) shiftStack(box, () => toast.remove(), true);
      else toast.remove();
    });
}

function showToast({ message = '', duration = 3000 } = {}) {
  const box = getContainer();

  while (box.children.length >= 4) box.firstElementChild.remove();

  const toast = document.createElement('div');
  toast.className = 'aero-toast';
  toast.textContent = message;
  toast.addEventListener('click', () => dismiss(toast));

  const shiftMs = shiftStack(box, () => box.append(toast), false);
  animate(toast, [ENTER.hidden, ENTER.shown], { spring: { duration: 0.5, bounce: 0.3 }, delay: shiftMs });

  if (duration > 0) setTimeout(() => dismiss(toast), shiftMs + duration);
  return toast;
}

export { showToast };
