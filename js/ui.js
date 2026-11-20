/* Shared UI helpers: icons, badges, filter bar, toast, modal, event delegation */
(function (E) {
  const { U, C } = E;
  const UI = (E.UI = {});
  E.act = {}; // click actions:   data-action="name"
  E.chg = {}; // change handlers: data-change="name"
  E.inp = {}; // input handlers:  data-input="name"

  const P = {
    dashboard: '<rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/>',
    register: '<path d="M8 6h13M8 12h13M8 18h13"/><circle cx="3.5" cy="6" r="1"/><circle cx="3.5" cy="12" r="1"/><circle cx="3.5" cy="18" r="1"/>',
    flow: '<circle cx="5" cy="6" r="2.5"/><circle cx="19" cy="6" r="2.5"/><circle cx="12" cy="18" r="2.5"/><path d="M7.5 6h9M6.5 8.2l4.2 7.6M17.5 8.2l-4.2 7.6"/>',
    check: '<path d="M20 6 9 17l-5-5"/>',
    approvals: '<path d="M9 11l3 3 8-8"/><path d="M20 12v6a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h9"/>',
    wrench: '<path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-2.6 2.6-2.4-.6-.6-2.4z"/>',
    dollar: '<path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>',
    alert: '<path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/><path d="M12 9v4M12 17h.01"/>',
    target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',
    chart: '<path d="M3 3v18h18"/><path d="M7 15l4-4 3 3 5-6"/>',
    layers: '<path d="m12 2 10 5-10 5L2 7z"/><path d="m2 17 10 5 10-5M2 12l10 5 10-5"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>',
    upload: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/>',
    file: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M8 13h8M8 17h5"/>',
    x: '<path d="M18 6 6 18M6 6l12 12"/>',
    edit: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>',
    trash: '<path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/>',
    up: '<path d="m18 15-6-6-6 6"/>',
    down: '<path d="m6 9 6 6 6-6"/>',
    right: '<path d="m9 18 6-6-6-6"/>',
    left: '<path d="m15 18-6-6 6-6"/>',
    filter: '<path d="M22 3H2l8 9.5V19l4 2v-8.5z"/>',
    flag: '<path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1zM4 22v-7"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    menu: '<path d="M3 6h18M3 12h18M3 18h18"/>',
    refresh: '<path d="M21 12a9 9 0 1 1-3-6.7L21 8"/><path d="M21 3v5h-5"/>',
    printer: '<path d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/>',
    columns: '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 3v18M15 3v18"/>',
    zap: '<path d="M13 2 3 14h9l-1 8 10-12h-9z"/>',
    arrowR: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    msg: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',
    plane: '<path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"/>',
    database: '<ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v14c0 1.7 4 3 9 3s9-1.3 9-3V5"/><path d="M3 12c0 1.7 4 3 9 3s9-1.3 9-3"/>',
    cmd: '<path d="M12 2 3 7v10l9 5 9-5V7z"/><path d="M12 12 3 7M12 12l9-5M12 12v10"/>',
  };
  UI.icon = (n, cls = '') =>
    `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${P[n] || ''}</svg>`;

  /* ---------- badges ---------- */
  const STATUS_CLS = {
    Identified: 'gray',
    'ECR Submitted': 'blue',
    'In Review': 'blue',
    'Pending Approval': 'violet',
    'Awaiting Customer': 'orange',
    'Awaiting Supplier': 'orange',
    'In Work': 'blue',
    'On Hold': 'yellow',
    Implemented: 'green',
    Closed: 'green',
    Rejected: 'gray',
  };
  UI.status = (s) => `<span class="pill ${STATUS_CLS[s] || 'gray'}">${U.esc(s)}</span>`;
  const PRIO = { Critical: '#ec4a4a', High: '#ec835a', Medium: '#f4b425', Low: '#5b6b85' };
  UI.prio = (p) => `<span class="prio"><i style="background:${PRIO[p] || '#5b6b85'}"></i>${U.esc(p)}</span>`;
  const RISK = { Critical: 'red', High: 'orange', Medium: 'yellow', Low: 'green' };
  UI.risk = (r) => `<span class="pill ${RISK[r] || 'gray'}">${U.esc(r)}</span>`;
  UI.sched = (c) => {
    const s = E.calc.schedule(c);
    return `<span class="pill ${E.calc.schedClass(s)}">${s}</span>`;
  };
  const CA = { 'Not Required': 'gray', 'Not Submitted': 'yellow', Submitted: 'blue', Approved: 'green', Rejected: 'red' };
  UI.custAppr = (s) => `<span class="pill ${CA[s] || 'gray'}">${U.esc(s)}</span>`;
  const IS = { 'Not Started': 'gray', Planning: 'blue', 'In Progress': 'blue', Complete: 'green' };
  UI.impl = (s) => `<span class="pill ${IS[s] || 'gray'}">${U.esc(s)}</span>`;
  UI.type = (t) => `<span class="tag ${t}">${U.esc(t)}</span>`;
  UI.flags = (c, max = 9) => {
    const fl = E.calc.flags(c);
    return fl
      .slice(0, max)
      .map((k) => {
        const d = E.calc.FLAG_DEFS.find((f) => f.key === k);
        return `<span class="flag ${d.sev}" title="${U.attr(d.desc)}">${U.esc(d.label)}</span>`;
      })
      .join('') + (fl.length > max ? `<span class="flag yellow">+${fl.length - max}</span>` : '');
  };
  UI.person = (n, empty = 'Unassigned') =>
    n
      ? `<span class="nowrap" style="display:inline-flex;gap:6px;align-items:center"><span class="avatar sm">${U.initials(n)}</span>${U.esc(n)}</span>`
      : `<span class="red-t b">${empty}</span>`;
  UI.num = (c) => `<a class="mono b" data-action="open" data-id="${c.id}">${U.esc(c.number)}</a>`;
  UI.daysRem = (d) => {
    if (d == null) return '<span class="muted">—</span>';
    const cls = d < 0 ? 'red-t' : d <= 5 ? 'yellow-t' : 'green-t';
    return `<span class="days ${cls}">${d < 0 ? `${-d}d over` : `${d}d`}</span>`;
  };
  UI.dateCell = (d, c) => {
    if (!d) return '<span class="muted">—</span>';
    if (!c || !E.calc.isOpen(c)) return U.fmt(d);
    const left = U.diff(d, U.today());
    const cls = left < 0 ? 'red-t' : left <= 14 ? 'yellow-t' : '';
    return `<span class="${cls}">${U.fmt(d)}</span>`;
  };
  UI.stageName = (c) => `${c.stage + 1}. ${C.STAGES[c.stage].short}`;
  UI.track = (c) => {
    const rem = E.calc.stageDaysRemaining(c);
    const open = E.calc.isOpen(c);
    return `<div class="track" title="Stage ${c.stage + 1} of 13: ${U.attr(C.STAGES[c.stage].name)}">${C.STAGES.map((s, i) => {
      let cls = '';
      if (i < c.stage || (!open && c.status === 'Closed')) cls = 'done';
      else if (i === c.stage && open) cls = c.status === 'On Hold' ? 'hold' : 'cur' + (rem != null && rem < 0 ? ' late' : rem != null && rem <= 3 ? ' soon' : '');
      return `<i class="${cls}"></i>`;
    }).join('')}</div>`;
  };
  UI.trend = (cur, prev, goodWhenDown, fmt = (v) => U.num(v)) => {
    if (prev == null || cur == null || isNaN(prev) || isNaN(cur)) return '<span class="trend flat">—</span>';
    const d = cur - prev;
    if (Math.abs(d) < 0.05) return `<span class="trend flat">${UI.icon('right')} flat</span>`;
    const improving = goodWhenDown ? d < 0 : d > 0;
    return `<span class="trend ${improving ? 'good' : 'bad'}" title="${improving ? 'Improving' : 'Declining'} vs prior period">${UI.icon(d > 0 ? 'up' : 'down')}${fmt(Math.abs(d))}</span>`;
  };

  /* ---------- Filter bar (global dimension filters) ---------- */
  UI.filterBar = function (opts = {}) {
    const f = E.filters;
    const all = E.store.changes;
    const customers = U.uniq(all.map((c) => c.customer)).sort();
    const programs = U.uniq(all.filter((c) => !f.customer || c.customer === f.customer).map((c) => c.program)).sort();
    const owners = U.uniq(all.flatMap((c) => [c.engineer, c.programManager])).sort();
    const active = ['customer', 'program', 'part', 'owner', 'type', 'from', 'to'].filter((k) => f[k]).length;
    return `<div class="filterbar">
      <span class="fb-label">${UI.icon('filter')} Filters</span>
      <select class="inp" data-change="filter" data-key="customer" aria-label="Customer">${U.options(customers, f.customer, { blank: 'All customers' })}</select>
      <select class="inp" data-change="filter" data-key="program" aria-label="Program">${U.options(programs, f.program, { blank: 'All programs' })}</select>
      <input class="inp" data-change="filter" data-key="part" placeholder="Component / P/N" value="${U.attr(f.part)}" aria-label="Component or part number"/>
      <select class="inp" data-change="filter" data-key="owner" aria-label="Owner">${U.options(owners, f.owner, { blank: 'All owners' })}</select>
      <select class="inp" data-change="filter" data-key="type" aria-label="Change type">${U.options(C.TYPES, f.type, { blank: 'All types' })}</select>
      <input class="inp" type="date" data-change="filter" data-key="from" value="${U.attr(f.from)}" title="Submitted from" aria-label="Submitted from"/>
      <span class="muted">to</span>
      <input class="inp" type="date" data-change="filter" data-key="to" value="${U.attr(f.to)}" title="Submitted to" aria-label="Submitted to"/>
      ${opts.extra || ''}
      ${active ? `<span class="active-count">${active} active</span><button class="btn xs ghost" data-action="clearFilters">Clear</button>` : ''}
    </div>`;
  };

  /* ---------- Toast ---------- */
  UI.toast = function (msg, err) {
    let box = U.$('.toasts');
    if (!box) {
      box = document.createElement('div');
      box.className = 'toasts';
      document.body.appendChild(box);
    }
    const t = document.createElement('div');
    t.className = 'toast' + (err ? ' err' : '');
    t.innerHTML = msg;
    box.appendChild(t);
    setTimeout(() => t.remove(), 3200);
  };

  /* ---------- Generic dialog ---------- */
  UI.dialog = function ({ title, body, foot, size = 'xnarrow', onMount }) {
    UI.closeDialog();
    const ov = document.createElement('div');
    ov.className = 'overlay dialog-ov';
    ov.innerHTML = `<div class="modal ${size}" role="dialog" aria-modal="true" aria-label="${U.attr(title)}">
      <div class="modal-h" style="padding-bottom:14px"><div class="top"><h2 style="flex:1">${title}</h2><button class="icon-btn" data-action="closeDialog" aria-label="Close">${UI.icon('x')}</button></div></div>
      <div class="modal-b">${body}</div>
      ${foot ? `<div class="modal-f">${foot}</div>` : ''}
    </div>`;
    ov.addEventListener('mousedown', (e) => {
      if (e.target === ov) UI.closeDialog();
    });
    document.body.appendChild(ov);
    const first = ov.querySelector('input,select,textarea');
    if (first) first.focus();
    if (onMount) onMount(ov);
    return ov;
  };
  UI.closeDialog = () => U.$$('.dialog-ov').forEach((d) => d.remove());
  E.act.closeDialog = () => UI.closeDialog();

  UI.confirm = (msg, onYes, label = 'Confirm', danger) => {
    UI.dialog({
      title: 'Please confirm',
      body: `<p style="margin:0">${msg}</p>`,
      foot: `<button class="btn" data-action="closeDialog">Cancel</button><button class="btn ${danger ? 'danger' : 'primary'}" id="dlg-yes">${label}</button>`,
      onMount: (ov) =>
        ov.querySelector('#dlg-yes').addEventListener('click', () => {
          UI.closeDialog();
          onYes();
        }),
    });
  };

  /** Reads named form fields within a root into an object */
  UI.readForm = (root) => {
    const o = {};
    U.$$('[name]', root).forEach((el) => {
      const k = el.getAttribute('name');
      if (el.type === 'checkbox') o[k] = el.checked;
      else if (el.type === 'number') o[k] = el.value === '' ? 0 : Number(el.value);
      else o[k] = el.value;
    });
    return o;
  };

  /* ---------- Event delegation ---------- */
  UI.bind = function () {
    document.addEventListener('click', (e) => {
      const el = e.target.closest('[data-action]');
      // close dropdowns when clicking outside
      U.$$('.dropdown.open').forEach((d) => {
        if (!d.contains(e.target)) d.classList.remove('open');
      });
      if (!el) return;
      const fn = E.act[el.dataset.action];
      if (fn) {
        if (el.tagName === 'A' || el.tagName === 'BUTTON') e.preventDefault();
        e.stopPropagation();
        fn(el, e);
      }
    });
    document.addEventListener('change', (e) => {
      const el = e.target.closest('[data-change]');
      if (el && E.chg[el.dataset.change]) E.chg[el.dataset.change](el, e);
    });
    document.addEventListener('input', (e) => {
      const el = e.target.closest('[data-input]');
      if (el && E.inp[el.dataset.input]) E.inp[el.dataset.input](el, e);
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        if (U.$('.dialog-ov')) UI.closeDialog();
        else if (E.Record && E.Record.isOpen()) E.Record.close();
      }
      if (e.key === '/' && !/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)) {
        e.preventDefault();
        const g = U.$('#gsearch');
        if (g) g.focus();
      }
    });
  };

  E.chg.filter = (el) => {
    E.filters[el.dataset.key] = el.value;
    if (el.dataset.key === 'customer') E.filters.program = '';
    E.App.render();
  };
  E.act.clearFilters = () => {
    ['customer', 'program', 'part', 'owner', 'type', 'from', 'to'].forEach((k) => (E.filters[k] = ''));
    E.App.render();
  };
  E.act.toggleDropdown = (el) => el.closest('.dropdown').classList.toggle('open');
  E.act.open = (el) => E.Record.open(el.dataset.id, el.dataset.tab);
  /** Navigate to register with a preset filter */
  E.act.goRegister = (el) => {
    const key = el.dataset.key;
    const val = el.dataset.val;
    ['status', 'priority', 'risk', 'schedule', 'flag', 'stage', 'openOnly', 'search'].forEach((k) => (E.filters[k] = ''));
    if (key === 'preset') applyPreset(val);
    else if (key) E.filters[key] = val;
    E.App.go('register');
  };
  function applyPreset(p) {
    const presets = {
      open: { openOnly: 'open' },
      closed: { status: 'Closed' },
      implemented: { status: 'Implemented' },
      pending: { status: 'Pending Approval' },
      inwork: { status: 'In Work' },
      customer: { status: 'Awaiting Customer' },
      supplier: { status: 'Awaiting Supplier' },
      pastdue: { flag: 'pastDue' },
      ontrack: { openOnly: 'open', schedule: 'On Track' },
      newecr: { type: 'ECR' },
    };
    Object.assign(E.filters, presets[p] || {});
  }
})(window.ECM);
