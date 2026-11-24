// Global motion: runs once on the client before the first page initializes.
import { gsap } from 'gsap';
import { setTransition, onScroll, onPage, ease, isTouch, prefersReducedMotion } from '../engine';
import { startBalance } from './balance';

const cols = (root: Element | null) => (root ? [...root.querySelectorAll<HTMLElement>('.curtain__cols span')] : []);

export function setupMotion() {
  // Page transition: six columns post up like deliveries, then lift off the new page.
  setTransition({
    leave: (c) => gsap.timeline()
      .set(c, { autoAlpha: 1 })
      .fromTo(cols(c), { yPercent: 100 }, { yPercent: 0, duration: 0.65, ease: ease.inOut, stagger: 0.06 }),
    enter: (c) => gsap.timeline()
      .to(cols(c), { yPercent: -100, duration: 0.7, ease: ease.inOut, stagger: 0.06 })
      .set(c, { autoAlpha: 0 }),
  });

  // Frame steps aside on scroll down, returns on scroll up.
  let last = 0;
  onScroll(({ y }) => {
    if (Math.abs(y - last) < 4) return;
    document.documentElement.classList.toggle('frame-away', y > 160 && y > last);
    document.documentElement.classList.toggle('frame-solid', y > 160);
    last = y;
  });

  buttonFill();
  startBalance();
}

function buttonFill() {
  onPage(() => {
    document.documentElement.classList.remove('frame-away', 'frame-solid');
    if (isTouch() || prefersReducedMotion()) return;
    const off: (() => void)[] = [];
    document.querySelectorAll<HTMLElement>('[data-fill]').forEach((btn) => {
      const fill = btn.querySelector<HTMLElement>('.btn__fill');
      if (!fill) return;
      const from = (e: PointerEvent) => { const r = btn.getBoundingClientRect(); return `${e.clientX - r.left}px ${e.clientY - r.top}px`; };
      let closed = true;
      const open = (at: string) => {
        if (closed) gsap.set(fill, { clipPath: `circle(0% at ${at})` });
        closed = false;
        btn.classList.add('is-filled');
        gsap.to(fill, { clipPath: `circle(150% at ${at})`, duration: 0.6, ease: ease.soft, overwrite: true });
      };
      const close = (at: string) => {
        btn.classList.remove('is-filled');
        gsap.to(fill, { clipPath: `circle(0% at ${at})`, duration: 0.5, ease: ease.soft, overwrite: true, onComplete: () => { closed = true; } });
      };
      const enter = (e: PointerEvent) => open(from(e));
      const leave = (e: PointerEvent) => close(from(e));
      const focus = () => btn.matches(':focus-visible') && open('50% 50%');
      const blur = () => close('50% 50%');
      btn.addEventListener('pointerenter', enter); btn.addEventListener('pointerleave', leave);
      btn.addEventListener('focus', focus); btn.addEventListener('blur', blur);
      off.push(() => {
        btn.removeEventListener('pointerenter', enter); btn.removeEventListener('pointerleave', leave);
        btn.removeEventListener('focus', focus); btn.removeEventListener('blur', blur);
      });
    });
    return () => off.forEach((f) => f());
  });
}
