// Line of Balance model. ILLUSTRATIVE ONLY: a smooth plan curve and a delivery staircase that lags
// behind it and closes by week 52. Used by the SSR chart markup and by the client driver.
export const WEEKS = 52;
export const TOTAL = 48; // shipsets
export const VB = { w: 1200, h: 600 }; // SVG viewBox

const smooth = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

/** Cumulative planned shipsets at week w. */
export const plan = (w: number) => TOTAL * smooth(0, WEEKS, w);
/** Schedule lag in weeks: about five weeks behind mid-program, recovered by week 52. */
const lag = (w: number) => 5 * (1 - smooth(WEEKS * 0.55, WEEKS * 0.95, w));
/** Cumulative delivered shipsets at week w (posts every two weeks). */
export const actual = (w: number) => {
  const k = Math.floor(w / 2) * 2;
  return Math.max(0, Math.min(TOTAL, Math.round(plan(k - lag(k)))));
};
export const gap = (w: number) => Math.max(0, plan(w) - actual(w));

export type Rag = 'green' | 'amber' | 'red';
export const rag = (w: number): Rag => {
  if (w <= 0.01) return 'red';
  const g = Math.round(gap(w));
  return g >= 5 ? 'red' : g >= 1 ? 'amber' : 'green';
};
export const status = (w: number) => {
  if (w <= 0.01) return 'No line item';
  const g = Math.round(gap(w));
  return g <= 0 ? 'In balance' : `Behind ${g} shipset${g === 1 ? '' : 's'}`;
};

const X = (w: number) => (w / WEEKS) * VB.w;
const Y = (v: number) => VB.h - (v / TOTAL) * VB.h;
const f = (n: number) => n.toFixed(1);

export function planPath() {
  let d = '';
  for (let w = 0; w <= WEEKS; w += 0.5) d += `${w ? 'L' : 'M'}${f(X(w))} ${f(Y(plan(w)))}`;
  return d;
}

/** Staircase up to the status week s. */
export function actualPath(s: number) {
  let d = `M0 ${VB.h}`;
  let prev = 0;
  for (let k = 2; k <= s; k += 2) {
    const v = actual(k);
    d += `H${f(X(k))}`;
    if (v !== prev) d += `V${f(Y(v))}`;
    prev = v;
  }
  return d + `H${f(X(s))}`;
}

/** Filled gap between plan and actual up to s (the shortage you chase). */
export function gapPath(s: number) {
  if (s <= 0) return '';
  let top = '';
  for (let w = 0; w <= s; w += 0.5) top += `${w ? 'L' : 'M'}${f(X(w))} ${f(Y(plan(w)))}`;
  top += `L${f(X(s))} ${f(Y(plan(s)))}`;
  let bottom = `L${f(X(s))} ${f(Y(actual(s)))}`;
  for (let k = Math.floor(s / 2) * 2; k >= 2; k -= 2) {
    bottom += `H${f(X(k))}V${f(Y(actual(k - 0.001)))}`;
  }
  return top + bottom + `H0Z`;
}

export const pct = { x: (w: number) => (w / WEEKS) * 100, y: (v: number) => 100 - (v / TOTAL) * 100 };
export const pad2 = (n: number) => String(Math.round(n)).padStart(2, '0');
