// The driver: ONE variable, the status week, fans out to every chart on the page and the balance strip.
// Source: scroll position mapped through the [data-week] anchors in the markup. A page can pin it
// with <body data-state="0"> (the 404). Idle input: the status hairline breathes a fraction of a week
// while a chart is on screen; the pointer drives a lagged crosshair readout.
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { onPage, onScroll, scrollState, ease, isTouch, prefersReducedMotion } from '../engine';
import { WEEKS, TOTAL, actualPath, gapPath, plan, actual, rag, status, pad2 } from './lob';

type Anchor = { y: number; w: number; sec: string };
type ChartRefs = {
  root: HTMLElement; plot: HTMLElement; actual: SVGPathElement; gap: SVGPathElement; plan: SVGGElement;
  now: HTMLElement; readout: HTMLElement; wk: HTMLElement; state: HTMLElement;
  cross: HTMLElement; crossLabel: HTMLElement; width: number; visible: boolean;
};

let anchors: Anchor[] = [];
let charts: ChartRefs[] = [];
let strip: { root: HTMLElement; wk: HTMLElement; actual: HTMLElement; plan: HTMLElement; state: HTMLElement; sec: HTMLElement } | null = null;
let current = 10;
let lastKey = '';
let lastSec = '';
let intro: { w: number } | null = null;

const pinned = () => {
  const v = document.body.dataset.state;
  return v !== undefined && v !== '' ? +v : null;
};

function measure() {
  anchors = [...document.querySelectorAll<HTMLElement>('[data-week]')]
    .map((el) => ({ y: el.getBoundingClientRect().top + scrollY, w: +(el.dataset.week || 0), sec: el.dataset.sec || '' }))
    .sort((a, b) => a.y - b.y);
  charts.forEach((c) => (c.width = c.plot.clientWidth));
}

/** Probe runs from the top of the document (progress 0) to the bottom (progress 1). */
function weekAt(y: number): { w: number; sec: string } {
  const p = pinned();
  if (p !== null) return { w: p, sec: anchors[0]?.sec || '' };
  if (!anchors.length) return { w: current, sec: '' };
  const max = document.documentElement.scrollHeight - innerHeight;
  const progress = max > 0 ? Math.min(1, Math.max(0, y / max)) : 0;
  const probe = y + innerHeight * progress;
  let a = anchors[0];
  let b = anchors[anchors.length - 1];
  for (let i = 0; i < anchors.length; i++) {
    if (anchors[i].y <= probe) a = anchors[i];
    if (anchors[i].y > probe) { b = anchors[i]; break; }
  }
  if (a === b || probe >= b.y) return { w: a.w, sec: a.sec };
  const t = (probe - a.y) / Math.max(1, b.y - a.y);
  return { w: a.w + (b.w - a.w) * t, sec: a.sec };
}

function apply(w: number, drift = 0, sec = lastSec) {
  w = Math.min(WEEKS, Math.max(0, w));
  const key = (Math.round(w * 4) / 4).toFixed(2);
  const r = rag(w);
  const label = status(w);
  for (const c of charts) {
    const x = ((w + drift) / WEEKS) * c.width;
    c.now.style.transform = `translateX(${x.toFixed(1)}px)`;
    if (key !== lastKey) {
      c.actual.setAttribute('d', actualPath(w));
      c.gap.setAttribute('d', gapPath(w));
      c.wk.textContent = pad2(w);
      if (c.state.textContent !== label) c.state.textContent = label;
      if (c.root.dataset.rag !== r) c.root.dataset.rag = r;
      c.readout.classList.toggle('is-flip', w > 40);
    }
  }
  if (strip && key !== lastKey) {
    strip.wk.textContent = pad2(w);
    strip.actual.style.scale = `${actual(w) / TOTAL} 1`;
    strip.plan.style.left = `${(plan(w) / TOTAL) * 100}%`;
    if (strip.state.textContent !== label) strip.state.textContent = label;
    if (strip.root.dataset.rag !== r) strip.root.dataset.rag = r;
  }
  if (strip && sec !== lastSec) { strip.sec.textContent = sec; lastSec = sec; }
  lastKey = key;
}

function collect() {
  charts = [...document.querySelectorAll<HTMLElement>('[data-lob]')].map((root) => {
    const q = <T extends Element>(s: string) => root.querySelector(s) as T;
    const plot = q<HTMLElement>('.lob__plot');
    return {
      root, plot, actual: q('[data-lob-actual]'), gap: q('[data-lob-gap]'), plan: q('[data-lob-plan]'),
      now: (() => { const n = q<HTMLElement>('[data-lob-now]'); n.style.left = '0'; return n; })(), readout: q('[data-lob-readout]'), wk: q('[data-lob-wk]'), state: q('[data-lob-state]'),
      cross: q('[data-lob-cross]'), crossLabel: q('[data-lob-cross-label]'), width: plot.clientWidth, visible: false,
    };
  });
  const s = document.querySelector<HTMLElement>('[data-strip]');
  strip = s ? {
    root: s, wk: s.querySelector('[data-strip-wk]')!, actual: s.querySelector('[data-strip-actual]')!,
    plan: s.querySelector('[data-strip-plan]')!, state: s.querySelector('[data-strip-state]')!, sec: s.querySelector('[data-strip-sec]')!,
  } : null;
}

export function startBalance() {
  onScroll(({ y }) => {
    if (intro) return;
    const s = weekAt(y);
    current = s.w;
    apply(current, 0, s.sec);
  });

  onPage(({ intro: tl }) => {
    collect();
    lastKey = '';
    lastSec = '';
    measure();
    const s = weekAt(scrollState().y || scrollY);
    current = s.w;
    const off: (() => void)[] = [];
    const onRefresh = () => { measure(); lastKey = ''; apply(current, 0, lastSec); };
    ScrollTrigger.addEventListener('refresh', onRefresh);
    off.push(() => ScrollTrigger.removeEventListener('refresh', onRefresh));

    const motion = !prefersReducedMotion();
    if (motion && charts.length) {
      // Intro: the plan draws, then deliveries post up to the status date.
      charts.forEach((c) => gsap.set(c.plan, { clipPath: 'inset(0% 100% 0% 0%)' }));
      intro = { w: 0 };
      apply(0, 0, s.sec);
      const proxy = intro;
      tl.add(gsap.to(charts.map((c) => c.plan), { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.6, ease: ease.out }), 0.05);
      tl.add(gsap.to(proxy, {
        w: current, duration: 1.3, ease: ease.out,
        onUpdate: () => apply(proxy.w, 0, s.sec),
        onComplete: () => { intro = null; const n = weekAt(scrollState().y || scrollY); current = n.w; apply(current, 0, n.sec); },
      }), 0.35);
    } else {
      intro = null;
      apply(current, 0, s.sec);
    }

    if (!motion) return () => off.forEach((f) => f());

    // Idle + pointer: on the one clock, only while a chart is on screen.
    const aim = { x: -1 };
    const lag = { x: -1 };
    const tick = (t: number) => {
      if (intro) return;
      const drift = Math.sin(t * 0.9) * 0.22;
      for (const c of charts) {
        if (!c.visible) continue;
        c.now.style.transform = `translateX(${(((current + drift) / WEEKS) * c.width).toFixed(1)}px)`;
        if (aim.x >= 0) {
          lag.x += (aim.x - lag.x) * (1 - Math.pow(0.82, gsap.ticker.deltaRatio()));
          const wk = Math.max(0, Math.min(WEEKS, (lag.x / c.width) * WEEKS));
          c.cross.style.transform = `translateX(${lag.x.toFixed(1)}px)`;
          const txt = `Wk ${pad2(wk)}  plan ${Math.round(plan(wk))}` + (wk <= current ? `  delivered ${actual(wk)}` : '');
          if (c.crossLabel.textContent !== txt) c.crossLabel.textContent = txt;
          c.cross.querySelector('span')!.style.translate = wk > 40 ? 'calc(-100% - 1rem) 0' : '0 0';
        }
      }
    };
    charts.forEach((c) => {
      const st = ScrollTrigger.create({
        trigger: c.root, start: 'top bottom', end: 'bottom top',
        onToggle: (self) => { c.visible = self.isActive; },
      });
      c.visible = st.isActive;
      if (!isTouch()) {
        const move = (e: PointerEvent) => {
          const r = c.plot.getBoundingClientRect();
          aim.x = Math.max(0, Math.min(r.width, e.clientX - r.left));
          if (lag.x < 0) lag.x = aim.x;
          c.root.classList.add('is-hover');
        };
        const leave = () => { c.root.classList.remove('is-hover'); };
        c.root.addEventListener('pointermove', move);
        c.root.addEventListener('pointerleave', leave);
        off.push(() => { c.root.removeEventListener('pointermove', move); c.root.removeEventListener('pointerleave', leave); });
      }
    });
    gsap.ticker.add(tick);
    off.push(() => gsap.ticker.remove(tick));
    return () => { off.forEach((f) => f()); charts = []; intro = null; };
  });
}
