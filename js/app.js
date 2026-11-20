/* App shell: navigation, routing, global search, user & workspace selection */
(function (E) {
  const { U, C, UI } = E;
  const K = E.calc;
  const S = E.store;

  const NAV = [
    ['Overview', [
      ['dashboard', 'Executive Dashboard', 'dashboard'],
      ['pm', 'PM Command Center', 'target'],
    ]],
    ['Change Control', [
      ['register', 'Change Register', 'register'],
      ['lifecycle', 'Lifecycle Workflow', 'flow'],
      ['approvals', 'Approval Tracking', 'approvals'],
    ]],
    ['Impact & Risk', [
      ['technical', 'Technical Impact', 'wrench'],
      ['financial', 'Financial Impact', 'dollar'],
      ['risk', 'Risk & Escalation', 'alert'],
    ]],
    ['Insight & Control', [
      ['analytics', 'Analytics', 'chart'],
      ['config', 'Configuration Mgmt', 'layers'],
    ]],
  ];

  const App = (E.App = { view: 'dashboard' });

  App.go = function (view) {
    if (!E.views[view]) view = 'dashboard';
    if (location.hash !== '#/' + view) location.hash = '#/' + view;
    else App.render();
    window.scrollTo(0, 0);
  };

  function navCounts() {
    const open = S.changes.filter(K.isOpen);
    return {
      register: open.filter((c) => K.flags(c).includes('pastDue')).length,
      approvals: open.reduce((s, c) => s + c.approvals.filter(K.approvalOverdue).length, 0),
      risk: open.filter((c) => K.needsLeadership(c)).length,
    };
  }

  App.shell = function () {
    const counts = navCounts();
    const users = S.people();
    const role = C.ROLE_NAMES[C.ROLE_OF[S.user()]] || 'User';
    const ws = S.workspaces();
    return `<aside class="sidebar">
        <div class="brand"><div class="brand-mark">${UI.icon('plane')}</div><div class="brand-text"><div class="brand-title">ECM Command Center</div><div class="brand-sub">Engineering Change Mgmt</div></div></div>
        <nav class="nav">${NAV.map(([sec, items]) => `<div class="nav-sec">${sec}</div>${items.map(([k, l, ic]) => `<a href="#/${k}" class="${App.view === k ? 'active' : ''}" title="${l}">${UI.icon(ic)}<span>${l}</span>${counts[k] ? `<span class="count" title="${k === 'register' ? 'past due' : k === 'approvals' ? 'overdue approvals' : 'need leadership'}">${counts[k]}</span>` : ''}</a>`).join('')}`).join('')}</nav>
        <div class="sidebar-foot">
          <div><span class="dot" style="${S.storageOk ? '' : 'background:var(--red)'}"></span>${S.storageOk ? 'Saved locally' : 'Storage unavailable — changes not persisted'}</div>
          <div style="margin-top:6px">${S.changes.length} records · v${C.APP_VERSION}</div>
          ${E.PRISTINE_HTML ? `<button class="btn sm primary" style="margin-top:8px;width:100%;justify-content:center" data-action="publishHtml" title="Download this page with current data, then Replace the file on SharePoint">${UI.icon('upload')} Save HTML for SharePoint</button>` : ''}
          <div style="margin-top:8px;display:flex;gap:4px;flex-wrap:wrap">
            <button class="btn xs" data-action="backup" title="Download JSON backup">${UI.icon('download')} Backup</button>
            <button class="btn xs" data-action="restore" title="Restore from JSON backup">${UI.icon('upload')} Restore</button>
            <button class="btn xs ghost" data-action="resetDemo" title="Reset this workspace to its original records">${UI.icon('refresh')} Reset</button>
          </div>
        </div>
      </aside>
      <div class="main">
        <header class="topbar">
          <button class="icon-btn menu-btn" data-action="toggleNav" aria-label="Menu">${UI.icon('menu')}</button>
          <div class="gsearch">${UI.icon('search')}<input id="gsearch" placeholder="Search changes, part numbers, owners…  ( / )" autocomplete="off" aria-label="Global search"/><div class="results" id="gresults"></div></div>
          <div class="top-right">
            ${ws.length > 1 ? `<select class="inp sm" style="width:auto" data-change="workspace" aria-label="Workspace" title="Workspace">${U.options(ws.map((w) => ({ value: w.key, label: w.name })), S.workspace)}</select>` : ''}
            <button class="btn sm" data-action="report">${UI.icon('printer')}<span class="lbl"> Report</span></button>
            <button class="btn sm primary" data-action="newChange">${UI.icon('plus')}<span class="lbl"> New Change</span></button>
            <div class="user-chip" title="Acting user — recorded on every audit entry"><span class="avatar">${U.initials(S.user())}</span>
              <select data-change="user" aria-label="Acting user">${U.options(users.map((u) => ({ value: u, label: u })), S.user())}<option value="__new">+ Enter a name…</option></select></div>
          </div>
        </header>
        <datalist id="dl-people">${S.people().map((p) => `<option value="${U.attr(p)}"></option>`).join('')}</datalist>
        <main class="content" id="content"></main>
      </div>`;
  };

  App.render = function () {
    const app = U.$('#app');
    const navOpen = app.classList.contains('nav-open');
    const gs = U.$('#gsearch');
    const focusSearch = gs && document.activeElement === gs;
    const q = gs ? gs.value : '';
    E.Charts.clear();
    app.innerHTML = App.shell();
    if (navOpen) app.classList.add('nav-open');
    const v = E.views[App.view] || E.views.dashboard;
    U.$('#content').innerHTML = v.render();
    document.title = `${v.title} · ECM Command Center`;
    requestAnimationFrame(() => E.Charts.drawAll());
    bindSearch();
    if (focusSearch) {
      const g = U.$('#gsearch');
      g.value = q;
      g.focus();
    }
  };

  function bindSearch() {
    const inp = U.$('#gsearch');
    const res = U.$('#gresults');
    const run = () => {
      const q = inp.value.trim().toLowerCase();
      if (!q) {
        res.classList.remove('open');
        return;
      }
      const hits = S.changes
        .filter((c) => [c.number, c.title, c.partNumber, c.partName, c.engineer, c.program, c.customer].join(' ').toLowerCase().includes(q))
        .slice(0, 10);
      res.innerHTML = hits.length
        ? hits.map((c) => `<div class="res" data-action="openSearch" data-id="${c.id}"><div style="display:flex;gap:8px;align-items:center"><span class="mono b">${U.esc(c.number)}</span>${UI.type(c.type)}${UI.status(c.status)}</div><div class="muted" style="font-size:12px;margin-top:2px">${U.esc(c.title)} · <span class="mono">${U.esc(c.partNumber)}</span></div></div>`).join('') +
          `<div class="res" data-action="searchAll" style="color:var(--blue)">View all matches in register ${UI.icon('right')}</div>`
        : '<div class="res muted">No matches</div>';
      res.classList.add('open');
    };
    inp.addEventListener('input', U.debounce(run, 120));
    inp.addEventListener('focus', run);
    inp.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        E.act.searchAll();
      }
    });
    document.addEventListener('mousedown', (e) => {
      if (!e.target.closest('.gsearch')) res.classList.remove('open');
    });
  }
  E.act.openSearch = (el) => {
    U.$('#gresults').classList.remove('open');
    E.Record.open(el.dataset.id);
  };
  E.act.searchAll = () => {
    const q = U.$('#gsearch').value.trim();
    ['status', 'priority', 'risk', 'schedule', 'flag', 'stage', 'openOnly'].forEach((k) => (E.filters[k] = ''));
    E.filters.search = q;
    U.$('#gsearch').value = '';
    App.go('register');
  };
  E.act.toggleNav = () => U.$('#app').classList.toggle('nav-open');

  E.chg.user = (el) => {
    if (el.value === '__new') {
      UI.dialog({
        title: 'Acting user',
        body: '<label class="fld"><span>Your name (recorded on every audit entry)</span><input class="inp" id="new-user" placeholder="e.g. J. Smith"/></label>',
        foot: '<button class="btn" data-action="closeDialog">Cancel</button><button class="btn primary" data-action="setUser">Set</button>',
      });
      el.value = S.user();
      return;
    }
    S.meta.user = el.value;
    S.save();
    App.render();
    UI.toast(`Acting as <b>${U.esc(el.value)}</b> — actions are recorded under this name`);
  };
  E.act.setUser = () => {
    const v = U.$('#new-user').value.trim();
    if (!v) return;
    UI.closeDialog();
    S.meta.user = v;
    S.save();
    App.render();
    UI.toast(`Acting as <b>${U.esc(v)}</b>`);
  };
  E.chg.workspace = (el) => {
    E.Record.close();
    E.resetFilters();
    S.switchWorkspace(el.value);
    UI.toast(`Switched to <b>${U.esc(S.workspaces().find((w) => w.key === el.value).name)}</b>`);
  };

  function route() {
    const h = location.hash.replace(/^#\/?/, '');
    const [view, query] = h.split('?');
    App.view = E.views[view] ? view : 'dashboard';
    if (window.innerWidth <= 860) U.$('#app').classList.remove('nav-open');
    App.render();
    if (query) {
      const p = new URLSearchParams(query);
      if (p.get('id')) E.Record.open(p.get('id'), p.get('tab'));
    }
  }

  App.init = function () {
    S.load();
    UI.bind();
    E.Charts.initTooltip();
    S.onChange(() => App.render());
    window.addEventListener('hashchange', route);
    route();
    if (S.workspace === 'local' && /^(Local User|)$/.test(S.meta.user || '')) {
      UI.dialog({
        title: 'Who is using the command center?',
        body: '<p class="muted" style="margin-top:0">Your name is recorded on every change you make (approvals, status updates, comments) for the audit trail. It is stored only in this browser.</p><label class="fld"><span>Your name</span><input class="inp" id="new-user" placeholder="e.g. J. Smith"/></label>',
        foot: '<button class="btn primary" data-action="setUser">Continue</button>',
        onMount: (ov) => ov.querySelector('#new-user').addEventListener('keydown', (e) => e.key === 'Enter' && E.act.setUser()),
      });
    }
    if (S.fileUpdated) UI.toast('Loaded the latest published data from this file. Your previous browser copy was kept as a backup.');
  };

  document.addEventListener('DOMContentLoaded', App.init);
})(window.ECM);
