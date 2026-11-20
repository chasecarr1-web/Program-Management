/* Core utilities: dates, formatting, DOM helpers, deterministic RNG */
window.ECM = window.ECM || {};
(function (E) {
  // Single-file (SharePoint) build: keep an untouched copy of the page so it can re-save itself with new data.
  document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('ecm-data')) E.PRISTINE_HTML = '<!doctype html>\n' + document.documentElement.outerHTML;
  });
  const U = (E.U = {});

  U.pad = (n) => String(n).padStart(2, '0');
  U.iso = (d) => `${d.getFullYear()}-${U.pad(d.getMonth() + 1)}-${U.pad(d.getDate())}`;
  U.parse = (s) => {
    if (!s) return null;
    const [y, m, d] = String(s).slice(0, 10).split('-').map(Number);
    return new Date(y, m - 1, d);
  };
  U.today = () => U.iso(new Date());
  U.addDays = (s, n) => {
    const d = U.parse(s);
    d.setDate(d.getDate() + n);
    return U.iso(d);
  };
  /** a - b in whole days */
  U.diff = (a, b) => Math.round((U.parse(a) - U.parse(b)) / 86400000);
  U.fmt = (s) =>
    s ? U.parse(s).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: '2-digit' }) : '—';
  U.fmtShort = (s) => (s ? U.parse(s).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—');
  U.fmtTs = (ts) => {
    if (!ts) return '—';
    if (/^\d{4}-\d{2}-\d{2}$/.test(ts)) return U.fmt(ts);
    const d = new Date(ts);
    if (isNaN(d)) return String(ts);
    return d.toLocaleString('en-US', { year: 'numeric', month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' });
  };
  U.monthKey = (s) => String(s).slice(0, 7);
  U.monthLabel = (k) => {
    const [y, m] = k.split('-').map(Number);
    return new Date(y, m - 1, 1).toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
  };
  U.lastMonths = (n, ref) => {
    const d = U.parse(ref || U.today());
    const out = [];
    for (let i = n - 1; i >= 0; i--) {
      const x = new Date(d.getFullYear(), d.getMonth() - i, 1);
      out.push(`${x.getFullYear()}-${U.pad(x.getMonth() + 1)}`);
    }
    return out;
  };
  U.monthEnd = (k) => {
    const [y, m] = k.split('-').map(Number);
    return U.iso(new Date(y, m, 0));
  };

  U.num = (n, d = 0) =>
    n == null || isNaN(n) ? '—' : Number(n).toLocaleString('en-US', { maximumFractionDigits: d, minimumFractionDigits: d });
  U.money = (n, compact) => {
    if (n == null || isNaN(n)) return '—';
    const v = Number(n);
    if (compact) {
      const a = Math.abs(v);
      const s = v < 0 ? '-' : '';
      if (a >= 1e6) return `${s}$${(a / 1e6).toFixed(2)}M`;
      if (a >= 1e3) return `${s}$${(a / 1e3).toFixed(1)}K`;
      return `${s}$${a.toFixed(0)}`;
    }
    return v.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
  };
  U.pct = (n, d = 0) => (n == null || isNaN(n) ? '—' : `${Number(n).toFixed(d)}%`);

  U.esc = (s) =>
    s == null
      ? ''
      : String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  U.attr = U.esc;

  U.uid = (p = 'id') => `${p}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;

  /** Deterministic PRNG (mulberry32) */
  U.rng = (seed) => {
    let a = seed >>> 0;
    const f = () => {
      a |= 0;
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    f.int = (lo, hi) => Math.floor(f() * (hi - lo + 1)) + lo;
    f.pick = (arr) => arr[Math.floor(f() * arr.length)];
    f.chance = (p) => f() < p;
    return f;
  };

  U.groupBy = (arr, fn) =>
    arr.reduce((m, x) => {
      const k = fn(x);
      (m[k] = m[k] || []).push(x);
      return m;
    }, {});
  U.countBy = (arr, fn) =>
    arr.reduce((m, x) => {
      const k = fn(x);
      m[k] = (m[k] || 0) + 1;
      return m;
    }, {});
  U.sum = (arr, fn = (x) => x) => arr.reduce((s, x) => s + (Number(fn(x)) || 0), 0);
  U.avg = (arr, fn = (x) => x) => (arr.length ? U.sum(arr, fn) / arr.length : null);
  U.uniq = (arr) => [...new Set(arr.filter((x) => x != null && x !== ''))];
  U.clone = (o) => JSON.parse(JSON.stringify(o));
  U.initials = (name) =>
    String(name || '?')
      .replace(/[^A-Za-z .]/g, '')
      .split(/[ .]+/)
      .filter(Boolean)
      .map((p) => p[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();

  U.$ = (sel, root = document) => root.querySelector(sel);
  U.$$ = (sel, root = document) => [...root.querySelectorAll(sel)];

  U.options = (list, selected, opts = {}) =>
    (opts.blank !== undefined ? `<option value="">${U.esc(opts.blank)}</option>` : '') +
    list
      .map((o) => {
        const v = typeof o === 'object' ? o.value : o;
        const l = typeof o === 'object' ? o.label : o;
        return `<option value="${U.attr(v)}"${String(v) === String(selected ?? '') ? ' selected' : ''}>${U.esc(l)}</option>`;
      })
      .join('');

  U.download = (filename, content, mime) => {
    const blob = new Blob([content], { type: mime || 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      URL.revokeObjectURL(url);
      a.remove();
    }, 100);
  };

  U.debounce = (fn, ms = 200) => {
    let t;
    return (...a) => {
      clearTimeout(t);
      t = setTimeout(() => fn(...a), ms);
    };
  };
})(window.ECM);
