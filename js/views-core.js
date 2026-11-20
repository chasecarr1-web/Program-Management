/* Views: Executive Dashboard, Change Register, Lifecycle Workflow, Approval Tracking */
(function (E) {
  const { U, C, UI, Charts: CH } = E;
  const K = E.calc;
  const S = E.store;
  const V = (E.views = E.views || {});
  const ST = CH.STATUS;

  const ls = {
    get: (k, d) => {
      try {
        const v = localStorage.getItem('ecm.ui.' + k);
        return v == null ? d : JSON.parse(v);
      } catch (e) {
        return d;
      }
    },
    set: (k, v) => {
      try {
        localStorage.setItem('ecm.ui.' + k, JSON.stringify(v));
      } catch (e) {}
    },
  };
  E.ls = ls;

  /* ======================= KPI engine ======================= */
  E.kpis = function (list) {
    const today = U.today();
    const ago = U.addDays(today, -30);
    const ago2 = U.addDays(today, -60);
    const ago90 = U.addDays(today, -90);
    const ago180 = U.addDays(today, -180);
    const open = list.filter(K.isOpen);
    const openThen = list.filter((c) => K.openAt(c, ago));
    const statusNow = (s) => list.filter((c) => c.status === s).length;
    const statusThen = (s) => list.filter((c) => K.statusAt(c, ago) === s).length;
    const closedIn = (a, b) => list.filter((c) => c.status === 'Closed' && c.actualDate && c.actualDate > a && c.actualDate <= b);
    const cl90 = closedIn(ago90, today);
    const clPrev = closedIn(ago180, ago90);
    const pdNow = open.filter((c) => c.requiredDate < today && c.status !== 'Implemented').length;
    const pdThen = list.filter((c) => K.pastDueAt(c, ago)).length;
    const onSchedNow = open.length ? ((open.length - pdNow) / open.length) * 100 : null;
    const onSchedThen = openThen.length ? ((openThen.length - pdThen) / openThen.length) * 100 : null;
    return {
      open: [open.length, openThen.length],
      newSub: [list.filter((c) => c.dateSubmitted > ago).length, list.filter((c) => c.dateSubmitted > ago2 && c.dateSubmitted <= ago).length],
      pending: [statusNow('Pending Approval'), statusThen('Pending Approval')],
      inWork: [statusNow('In Work'), statusThen('In Work')],
      customer: [statusNow('Awaiting Customer'), statusThen('Awaiting Customer')],
      supplier: [statusNow('Awaiting Supplier'), statusThen('Awaiting Supplier')],
      pastDue: [pdNow, pdThen],
      implemented: [statusNow('Implemented'), statusThen('Implemented')],
      closed: [cl90.length, clPrev.length],
      cycle: [U.avg(cl90, K.cycleTime), U.avg(clPrev, K.cycleTime)],
      onSched: [onSchedNow, onSchedThen],
    };
  };

  function kpiCard(label, val, prev, opts = {}) {
    const fmt = opts.fmt || ((v) => U.num(v));
    return `<div class="kpi" style="--kc:${opts.color || 'var(--blue)'}" data-action="${opts.action || 'goRegister'}" data-key="preset" data-val="${opts.preset || ''}" title="${U.attr(opts.tip || 'Open in register')}">
      <div class="k-label">${label}</div>
      <div class="k-row"><div class="k-val">${val == null ? '—' : fmt(val)}${opts.unit ? `<small>${opts.unit}</small>` : ''}</div>${opts.spark || ''}</div>
      <div class="k-trend">${UI.trend(val, prev, opts.down, opts.dfmt || fmt)}<span>vs ${opts.period || '30 days ago'}</span></div>
    </div>`;
  }

  /* ======================= Executive Dashboard ======================= */
  V.dashboard = {
    title: 'Executive Dashboard',
    render() {
      const list = E.scoped();
      const k = E.kpis(list);
      const open = list.filter(K.isOpen);
      const today = U.today();
      const months = U.lastMonths(12);
      const subByMonth = months.map((m) => list.filter((c) => U.monthKey(c.dateSubmitted) === m).length);
      const pdTrend = months.map((m) => {
        const d = m === U.monthKey(today) ? today : U.monthEnd(m);
        return list.filter((c) => K.pastDueAt(c, d)).length;
      });

      const cards = [
        kpiCard('Total Open Engineering Changes', k.open[0], k.open[1], { preset: 'open', color: 'var(--blue)', down: true, spark: CH.spark(months.map((m) => list.filter((c) => K.openAt(c, m === U.monthKey(today) ? today : U.monthEnd(m))).length), CH.SERIES[0]) }),
        kpiCard('New Changes Submitted (30d)', k.newSub[0], k.newSub[1], { preset: '', color: 'var(--blue)', period: 'prior 30 days', down: true, spark: CH.spark(subByMonth, CH.SERIES[0]) }),
        kpiCard('ECOs Pending Approval', k.pending[0], k.pending[1], { preset: 'pending', color: 'var(--violet)', down: true }),
        kpiCard('Changes In Work', k.inWork[0], k.inWork[1], { preset: 'inwork', color: 'var(--blue)' }),
        kpiCard('Awaiting Customer Approval', k.customer[0], k.customer[1], { preset: 'customer', color: 'var(--orange)', down: true }),
        kpiCard('Awaiting Supplier Input', k.supplier[0], k.supplier[1], { preset: 'supplier', color: 'var(--orange)', down: true }),
        kpiCard('Changes Past Due', k.pastDue[0], k.pastDue[1], { preset: 'pastdue', color: 'var(--red)', down: true, spark: CH.spark(pdTrend, ST.critical) }),
        kpiCard('Changes Implemented', k.implemented[0], k.implemented[1], { preset: 'implemented', color: 'var(--green)' }),
        kpiCard('Changes Closed (90d)', k.closed[0], k.closed[1], { preset: 'closed', color: 'var(--green)', period: 'prior 90 days' }),
        kpiCard('Avg. Change Cycle Time', k.cycle[0] == null ? null : Math.round(k.cycle[0]), k.cycle[1] == null ? null : Math.round(k.cycle[1]), { preset: 'closed', unit: 'days', color: 'var(--yellow)', down: true, period: 'prior 90 days', tip: 'Submitted → closed, changes closed in the last 90 days' }),
        kpiCard('Changes On Schedule', k.onSched[0], k.onSched[1], { preset: 'ontrack', fmt: (v) => U.num(v, 0), unit: '%', dfmt: (v) => U.num(v, 1) + 'pt', color: 'var(--green)', tip: 'Open changes not past their required date' }),
      ].join('');

      // pipeline counts
      const stageCounts = C.STAGES.map((s, i) => open.filter((c) => c.stage === i));
      const pipeline = `<div class="pipeline">${C.STAGES.map((s, i) => {
        const cs = stageCounts[i];
        const late = cs.filter((c) => K.schedule(c) === 'Overdue').length;
        const risk = cs.filter((c) => K.schedule(c) === 'At Risk').length;
        const ok = cs.length - late - risk;
        const tot = cs.length || 1;
        return `<div class="pipe-stage" data-action="goLifecycle" data-stage="${i}" data-tip="<b>${U.attr(s.name)}</b><br>${cs.length} open · ${late} overdue · ${risk} at risk">
          <div class="n">${String(i + 1).padStart(2, '0')}</div><div class="nm">${U.esc(s.short)}</div><div class="ct">${i === 12 ? list.filter((c) => c.status === 'Closed').length : cs.length}</div>
          <div class="bar">${i === 12 ? `<i style="width:100%;background:${ST.good}"></i>` : `<i style="width:${(ok / tot) * 100}%;background:${ST.info}"></i><i style="width:${(risk / tot) * 100}%;background:${ST.warning}"></i><i style="width:${(late / tot) * 100}%;background:${ST.critical}"></i>`}</div></div>`;
      }).join('')}</div>`;

      const sched = { 'On Track': 0, 'At Risk': 0, Overdue: 0 };
      open.forEach((c) => {
        const s = K.schedule(c);
        if (s in sched) sched[s]++;
      });
      const implCount = open.filter((c) => c.status === 'Implemented').length;

      const progs = U.uniq(open.map((c) => c.program)).sort();
      const byProg = CH.slot({
        type: 'hbar',
        height: Math.max(160, progs.length * 34 + 30),
        labels: progs,
        series: ['On Track', 'At Risk', 'Overdue'].map((s) => ({ name: s, color: { 'On Track': ST.info, 'At Risk': ST.warning, Overdue: ST.critical }[s], values: progs.map((p) => open.filter((c) => c.program === p && K.schedule(c) === s).length) })),
        click: { action: 'goRegister', key: 'program' },
      });

      const attention = open
        .filter((c) => K.flags(c).length)
        .sort((a, b) => K.score(b) - K.score(a))
        .slice(0, 7);

      const upcoming = open
        .filter((c) => c.status !== 'Implemented' && U.diff(c.requiredDate, today) >= 0 && U.diff(c.requiredDate, today) <= 30)
        .sort((a, b) => (a.requiredDate < b.requiredDate ? -1 : 1));

      const deptLoad = C.DEPTS.map((d) => {
        const ap = open.flatMap((c) => c.approvals.filter((a) => a.dept === d.key && a.status === 'Pending'));
        return { d, pending: ap.filter((a) => !K.approvalOverdue(a)).length, overdue: ap.filter(K.approvalOverdue).length };
      }).filter((x) => x.pending + x.overdue > 0).sort((a, b) => b.overdue - a.overdue || b.pending - a.pending);

      return `<div class="page-head"><div><div class="eyebrow">Command Center</div><h1>Executive Dashboard</h1><div class="sub">Engineering change portfolio across ${U.uniq(list.map((c) => c.program)).length} programs · ${list.length} records · as of ${U.fmt(today)}</div></div>
        <div class="actions"><button class="btn" data-action="report">${UI.icon('file')} Status Report</button><button class="btn primary" data-action="newChange">${UI.icon('plus')} New Change</button></div></div>
        ${UI.filterBar()}
        <div class="kpis">${cards}</div>
        <div class="grid g-2-1">
          <div class="panel"><div class="panel-h"><h3>Lifecycle Pipeline</h3><span class="hint">Open changes by stage · bar shows on-track / at-risk / overdue</span><div class="right"><button class="btn xs ghost" data-action="nav" data-view="lifecycle">View workflow ${UI.icon('right')}</button></div></div>
            <div class="panel-b">${pipeline}</div></div>
          <div class="panel"><div class="panel-h"><h3>Schedule Health</h3><span class="hint">Open changes</span></div><div class="panel-b">
            ${CH.slot({ type: 'donut', height: 190, items: [{ label: 'On Track', value: sched['On Track'], color: ST.good }, { label: 'At Risk', value: sched['At Risk'], color: ST.warning }, { label: 'Overdue', value: sched.Overdue, color: ST.critical }], center: open.length - implCount, centerSub: 'active', click: { action: 'goRegister', key: 'schedule' } })}
          </div></div>
        </div>
        <div class="grid g3 mt">
          <div class="panel"><div class="panel-h"><h3>Open Changes by Program</h3></div><div class="panel-b">${byProg}</div></div>
          <div class="panel"><div class="panel-h"><h3>Submissions vs. Past-Due Trend</h3><span class="hint">12 months</span></div><div class="panel-b">
            ${CH.slot({ type: 'line', height: 220, labels: months.map(U.monthLabel), series: [{ name: 'Submitted', values: subByMonth, color: CH.SERIES[0] }, { name: 'Past due (month-end)', values: pdTrend, color: ST.critical }], directLabels: false })}</div></div>
          <div class="panel accent-red"><div class="panel-h"><h3>Attention Required</h3><span class="hint">Highest risk score</span><div class="right"><button class="btn xs ghost" data-action="nav" data-view="risk">All flags ${UI.icon('right')}</button></div></div>
            <div class="list">${attention.map((c) => `<div class="li" data-action="open" data-id="${c.id}"><span class="score ${K.score(c) > 90 ? 'red-t' : 'yellow-t'}">${K.score(c)}</span><div class="li-main"><div class="li-title"><span class="mono">${U.esc(c.number)}</span> ${U.esc(c.title)}</div><div class="li-meta">${UI.flags(c, 3)}</div></div></div>`).join('') || '<div class="empty">No flagged changes.</div>'}</div></div>
        </div>
        <div class="grid g2 mt">
          <div class="panel accent-yellow"><div class="panel-h"><h3>Required Completions — Next 30 Days</h3><span class="hint">${upcoming.length} changes</span></div>
            <div class="tbl-wrap" style="max-height:330px"><table class="tbl compact"><thead><tr><th>Change</th><th>Title</th><th>Stage</th><th>Owner</th><th>Required</th><th>Schedule</th></tr></thead>
            <tbody>${upcoming.map((c) => `<tr class="row" data-action="open" data-id="${c.id}"><td class="mono b nowrap">${U.esc(c.number)}</td><td style="min-width:200px;max-width:280px">${U.esc(c.title)}</td><td class="nowrap">${UI.stageName(c)}</td><td>${UI.person(c.engineer)}</td><td class="nowrap">${UI.dateCell(c.requiredDate, c)} <span class="muted">(${U.diff(c.requiredDate, today)}d)</span></td><td>${UI.sched(c)}</td></tr>`).join('') || '<tr><td colspan="6" class="empty">Nothing due in the next 30 days.</td></tr>'}</tbody></table></div></div>
          <div class="panel"><div class="panel-h"><h3>Approval Bottlenecks</h3><span class="hint">Pending reviews by function</span><div class="right"><button class="btn xs ghost" data-action="nav" data-view="approvals">Approval matrix ${UI.icon('right')}</button></div></div><div class="panel-b">
            ${deptLoad.length ? CH.slot({ type: 'hbar', height: Math.max(150, deptLoad.length * 30 + 34), labels: deptLoad.map((x) => x.d.name), series: [{ name: 'Pending (within target)', values: deptLoad.map((x) => x.pending), color: ST.info }, { name: 'Overdue', values: deptLoad.map((x) => x.overdue), color: ST.critical }] }) : '<div class="empty">No pending approvals.</div>'}
          </div></div>
        </div>`;
    },
  };
  E.act.goLifecycle = (el) => {
    V.lifecycle.stage = el.dataset.stage;
    E.App.go('lifecycle');
  };

  /* ======================= Change Register ======================= */
  const COLS = [
    { k: 'number', l: 'Change No.', r: (c) => `<span class="mono b blue-t nowrap">${U.esc(c.number)}</span>`, s: (c) => c.number, sticky: true, on: true },
    { k: 'title', l: 'Change Title', r: (c) => `<div class="t">${U.esc(c.title)}</div>`, s: (c) => c.title, cls: 'title-cell', on: true },
    { k: 'description', l: 'Description', r: (c) => `<div>${U.esc(c.description)}</div>`, s: (c) => c.description, cls: 'desc-cell', on: false },
    { k: 'type', l: 'Type', r: (c) => UI.type(c.type), s: (c) => c.type, on: true },
    { k: 'program', l: 'Program / Platform', r: (c) => `<span class="nowrap">${U.esc(c.program)}</span>`, s: (c) => c.program, on: true },
    { k: 'customer', l: 'Customer (OEM)', r: (c) => `<span class="nowrap">${U.esc(c.customer)}</span>`, s: (c) => c.customer, on: false },
    { k: 'partNumber', l: 'Part Number', r: (c) => `<span class="mono nowrap">${U.esc(c.partNumber)}</span><div class="muted" style="font-size:11.5px">${U.esc(c.partName)}</div>`, s: (c) => c.partNumber, on: true },
    { k: 'currentRev', l: 'Cur Rev', r: (c) => `<span class="mono">${U.esc(c.currentRev)}</span>`, s: (c) => c.currentRev, on: true },
    { k: 'proposedRev', l: 'Prop Rev', r: (c) => `<span class="mono blue-t">${U.esc(c.proposedRev)}</span>`, s: (c) => c.proposedRev, on: true },
    { k: 'originator', l: 'Originator', r: (c) => `<span class="nowrap">${U.esc(c.originator)}</span>`, s: (c) => c.originator, on: false },
    { k: 'engineer', l: 'Responsible Eng.', r: (c) => UI.person(c.engineer), s: (c) => c.engineer || '~', on: true },
    { k: 'programManager', l: 'Program Mgr', r: (c) => `<span class="nowrap">${U.esc(c.programManager)}</span>`, s: (c) => c.programManager, on: false },
    { k: 'priority', l: 'Priority', r: (c) => UI.prio(c.priority), s: (c) => C.PRIORITIES.indexOf(c.priority), on: true },
    { k: 'risk', l: 'Risk', r: (c) => UI.risk(c.risk), s: (c) => C.RISK_LEVELS.indexOf(c.risk), on: true },
    { k: 'status', l: 'Status', r: (c) => UI.status(c.status), s: (c) => c.status, on: true },
    { k: 'stage', l: 'Stage', r: (c) => `<span class="nowrap">${UI.stageName(c)}</span>`, s: (c) => c.stage, on: true },
    { k: 'dateSubmitted', l: 'Submitted', r: (c) => `<span class="nowrap">${U.fmt(c.dateSubmitted)}</span>`, s: (c) => c.dateSubmitted, on: true },
    { k: 'requiredDate', l: 'Required', r: (c) => `<span class="nowrap">${UI.dateCell(c.requiredDate, c)}</span>`, s: (c) => c.requiredDate, on: true },
    { k: 'forecastDate', l: 'Forecast', r: (c) => `<span class="nowrap">${UI.dateCell(c.forecastDate, c)}</span>`, s: (c) => c.forecastDate, on: true },
    { k: 'actualDate', l: 'Actual', r: (c) => `<span class="nowrap">${U.fmt(c.actualDate)}</span>`, s: (c) => c.actualDate || '9999', on: false },
    { k: 'daysOpen', l: 'Days Open', r: (c) => `<b>${K.daysOpen(c)}</b>`, s: (c) => K.daysOpen(c), num: true, on: true },
    { k: 'schedule', l: 'Schedule', r: (c) => UI.sched(c), s: (c) => ['Overdue', 'At Risk', 'On Track', 'Closed Late', 'Closed On Time', 'Rejected'].indexOf(K.schedule(c)), on: true },
    { k: 'customerApproval', l: 'Customer Approval', r: (c) => UI.custAppr(c.customerApproval), s: (c) => c.customerApproval, on: true },
    { k: 'implementationStatus', l: 'Implementation', r: (c) => UI.impl(c.implementationStatus), s: (c) => c.implementationStatus, on: true },
    { k: 'flags', l: 'Flags', r: (c) => UI.flags(c, 2), s: (c) => K.flags(c).length, on: false },
    { k: 'cost', l: 'Est. NRE', r: (c) => U.money(K.costs(c).est, true), s: (c) => K.costs(c).est, num: true, on: false },
  ];
  E.REG_COLS = COLS;

  const RG = (V.register = {
    title: 'Change Register',
    sort: ls.get('reg.sort', { k: 'requiredDate', d: 1 }),
    hidden: ls.get('reg.hidden', COLS.filter((c) => !c.on).map((c) => c.k)),
    expanded: new Set(),
    list() {
      const list = E.applyFilters(S.changes);
      const col = COLS.find((c) => c.k === RG.sort.k) || COLS[0];
      return list.sort((a, b) => {
        const x = col.s(a);
        const y = col.s(b);
        return (x < y ? -1 : x > y ? 1 : 0) * RG.sort.d;
      });
    },
    render() {
      const f = E.filters;
      const list = RG.list();
      const base = E.scoped();
      const cnt = (fn) => base.filter(fn).length;
      const chips = [
        ['All', {}, base.length],
        ['Open', { openOnly: 'open' }, cnt(K.isOpen)],
        ['Overdue', { schedule: 'Overdue' }, cnt((c) => K.schedule(c) === 'Overdue')],
        ['At Risk', { schedule: 'At Risk' }, cnt((c) => K.schedule(c) === 'At Risk')],
        ['Pending Approval', { status: 'Pending Approval' }, cnt((c) => c.status === 'Pending Approval')],
        ['Awaiting Customer', { status: 'Awaiting Customer' }, cnt((c) => c.status === 'Awaiting Customer')],
        ['Awaiting Supplier', { status: 'Awaiting Supplier' }, cnt((c) => c.status === 'Awaiting Supplier')],
        ['In Work', { status: 'In Work' }, cnt((c) => c.status === 'In Work')],
        ['Escalated', { flag: '_esc' }, cnt((c) => c.escalated && K.isOpen(c))],
        ['Closed', { status: 'Closed' }, cnt((c) => c.status === 'Closed')],
      ];
      const localKeys = ['status', 'priority', 'risk', 'schedule', 'flag', 'stage', 'openOnly'];
      const chipOn = (preset) => localKeys.every((k) => String(f[k] || '') === String(preset[k] || '')) && (preset.flag !== '_esc' || RG.esc);
      const visible = COLS.filter((c) => !RG.hidden.includes(c.k));
      const rows = list
        .filter((c) => !RG.esc || (c.escalated && K.isOpen(c)))
        .map((c) => {
          const ex = RG.expanded.has(c.id);
          return `<tr class="row ${ex ? 'sel' : ''}" data-action="open" data-id="${c.id}">
            <td style="width:26px;padding-right:0"><button class="icon-btn" data-action="regExpand" data-id="${c.id}" aria-label="Expand"><span class="chev ${ex ? 'open' : ''}">${UI.icon('right')}</span></button></td>
            ${visible.map((col) => `<td class="${col.cls || ''} ${col.num ? 'num' : ''} ${col.sticky ? 'sticky-col' : ''}">${col.r(c)}</td>`).join('')}</tr>
            ${ex ? `<tr class="expand-row"><td colspan="${visible.length + 1}">${RG.expand(c)}</td></tr>` : ''}`;
        });
      const shown = rows.length;
      return `<div class="page-head"><div><div class="eyebrow">Single Source of Truth</div><h1>Engineering Change Register</h1><div class="sub">Searchable master register of ECRs, ECOs, ECNs, deviations and waivers</div></div>
        <div class="actions">
          <div class="dropdown"><button class="btn" data-action="toggleDropdown">${UI.icon('columns')} Columns</button>
            <div class="dd-menu">${COLS.map((c) => `<label class="dd-item check"><input type="checkbox" data-change="regCol" data-k="${c.k}" ${RG.hidden.includes(c.k) ? '' : 'checked'}/> ${c.l}</label>`).join('')}
            <div class="dd-sep"></div><div class="dd-item" data-action="regColsAll">Show all columns</div><div class="dd-item" data-action="regColsDefault">Reset to default</div></div></div>
          <div class="dropdown"><button class="btn" data-action="toggleDropdown">${UI.icon('download')} Export</button>
            <div class="dd-menu"><div class="dd-item" data-action="exportCSV">${UI.icon('file')} CSV — filtered register (${shown})</div><div class="dd-item" data-action="exportXLS">${UI.icon('file')} Excel — register + approvals, financial, actions, risks, config</div><div class="dd-sep"></div><div class="dd-item" data-action="report">${UI.icon('printer')} Program status report</div></div></div>
          <button class="btn primary" data-action="newChange">${UI.icon('plus')} New Change</button></div></div>
        ${UI.filterBar({ extra: `<input class="inp" style="min-width:220px" data-input="regSearch" placeholder="Search number, title, P/N, owner…" value="${U.attr(f.search)}" aria-label="Search register"/>` })}
        <div class="chips" style="margin-bottom:12px">${chips.map(([l, p, n]) => `<span class="chip ${chipOn(p) ? 'on' : ''}" data-action="regChip" data-p='${JSON.stringify(p)}'>${l}<span class="n">${n}</span></span>`).join('')}</div>
        <div class="panel">
          <div class="panel-h" style="flex-wrap:wrap;gap:8px">
            <select class="inp sm" style="width:auto" data-change="regLocal" data-key="status" aria-label="Status">${U.options(C.STATUSES, f.status, { blank: 'Any status' })}</select>
            <select class="inp sm" style="width:auto" data-change="regLocal" data-key="stage" aria-label="Stage">${U.options(C.STAGES.map((s, i) => ({ value: i, label: `${i + 1}. ${s.name}` })), f.stage, { blank: 'Any stage' })}</select>
            <select class="inp sm" style="width:auto" data-change="regLocal" data-key="priority" aria-label="Priority">${U.options(C.PRIORITIES, f.priority, { blank: 'Any priority' })}</select>
            <select class="inp sm" style="width:auto" data-change="regLocal" data-key="risk" aria-label="Risk">${U.options(C.RISK_LEVELS, f.risk, { blank: 'Any risk' })}</select>
            <select class="inp sm" style="width:auto" data-change="regLocal" data-key="schedule" aria-label="Schedule">${U.options(['On Track', 'At Risk', 'Overdue', 'Closed On Time', 'Closed Late', 'Rejected'], f.schedule, { blank: 'Any schedule' })}</select>
            <select class="inp sm" style="width:auto" data-change="regLocal" data-key="flag" aria-label="Flag">${U.options(K.FLAG_DEFS.map((d) => ({ value: d.key, label: d.label })), f.flag === '_esc' ? '' : f.flag, { blank: 'Any flag' })}</select>
            <span class="hint" style="margin-left:auto">${shown} of ${S.changes.length} records · click a row to open, ▸ to expand</span>
          </div>
          <div class="tbl-wrap tall"><table class="tbl">
            <thead><tr><th></th>${visible.map((col) => `<th class="sortable ${col.num ? 'num' : ''} ${col.sticky ? 'sticky-col' : ''}" data-action="regSort" data-k="${col.k}">${col.l} ${RG.sort.k === col.k ? `<span class="arrow">${RG.sort.d > 0 ? '▲' : '▼'}</span>` : ''}</th>`).join('')}</tr></thead>
            <tbody>${rows.join('') || `<tr><td colspan="${visible.length + 1}" class="empty">No changes match the current filters.</td></tr>`}</tbody></table></div>
        </div>`;
    },
    expand(c) {
      const req = c.approvals.filter((a) => a.required);
      return `<div class="expand-inner">
        <div><div class="section-title">Description</div><div style="color:var(--text-2)">${U.esc(c.description)}</div>
          <div class="section-title">Preventing Closure</div><div class="yellow-t">${U.esc(K.blocker(c) || '—')}</div>
          <div style="margin-top:8px">${UI.flags(c)}</div></div>
        <div><div class="section-title">Lifecycle</div>${UI.track(c)}<div style="margin-top:6px">${UI.stageName(c)} · Owner ${UI.person(c.stageOwner)}</div>
          <div class="muted" style="margin-top:4px">Stage due ${U.fmt(c.stageDue)} · ${UI.daysRem(K.stageDaysRemaining(c))}</div>
          <div class="section-title">Approvals</div><div style="display:flex;gap:4px;flex-wrap:wrap">${req.map((a) => `<span class="mx ${K.approvalState(a)}" title="${U.attr(C.DEPTS.find((d) => d.key === a.dept).name + ': ' + a.status)}" style="width:auto;padding:0 6px;font-size:10.5px">${C.DEPTS.find((d) => d.key === a.dept).short}</span>`).join('')}</div></div>
        <div><div class="section-title">Impact</div><dl class="kv tight"><dt>Est. NRE</dt><dd>${U.money(K.costs(c).est)}</dd><dt>Actual</dt><dd>${U.money(K.costs(c).act)}</dd><dt>Recurring Δ</dt><dd>${U.money(c.financial.recurringDelta)}</dd><dt>Open actions</dt><dd>${c.actions.filter((a) => a.status === 'Open').length}</dd></dl>
          <div style="margin-top:10px;display:flex;gap:6px"><button class="btn sm primary" data-action="open" data-id="${c.id}">Open record</button><button class="btn sm" data-action="open" data-id="${c.id}" data-tab="approvals">Approvals</button></div></div>
      </div>`;
    },
  });
  E.act.regSort = (el) => {
    const k = el.dataset.k;
    RG.sort = RG.sort.k === k ? { k, d: -RG.sort.d } : { k, d: 1 };
    ls.set('reg.sort', RG.sort);
    E.App.render();
  };
  E.act.regExpand = (el) => {
    const id = el.dataset.id;
    RG.expanded.has(id) ? RG.expanded.delete(id) : RG.expanded.add(id);
    E.App.render();
  };
  E.act.regChip = (el) => {
    const p = JSON.parse(el.dataset.p);
    ['status', 'priority', 'risk', 'schedule', 'flag', 'stage', 'openOnly'].forEach((k) => (E.filters[k] = ''));
    RG.esc = p.flag === '_esc';
    if (!RG.esc) Object.assign(E.filters, p);
    E.App.render();
  };
  E.chg.regLocal = (el) => {
    E.filters[el.dataset.key] = el.value;
    RG.esc = false;
    E.App.render();
  };
  E.inp.regSearch = U.debounce((el) => {
    E.filters.search = el.value;
    E.App.render();
    const inp = U.$('[data-input=regSearch]');
    if (inp) {
      inp.focus();
      inp.setSelectionRange(inp.value.length, inp.value.length);
    }
  }, 220);
  E.chg.regCol = (el) => {
    const k = el.dataset.k;
    RG.hidden = el.checked ? RG.hidden.filter((x) => x !== k) : [...RG.hidden, k];
    ls.set('reg.hidden', RG.hidden);
    E.App.render();
    const dd = U.$$('.dropdown')[0];
    if (dd) dd.classList.add('open');
  };
  E.act.regColsAll = () => {
    RG.hidden = [];
    ls.set('reg.hidden', RG.hidden);
    E.App.render();
  };
  E.act.regColsDefault = () => {
    RG.hidden = COLS.filter((c) => !c.on).map((c) => c.k);
    ls.set('reg.hidden', RG.hidden);
    E.App.render();
  };
  E.act.exportCSV = () => E.Export.registerCSV(RG.list().filter((c) => !RG.esc || (c.escalated && K.isOpen(c))));
  E.act.exportXLS = () => E.Export.registerExcel(RG.list().filter((c) => !RG.esc || (c.escalated && K.isOpen(c))));

  /* ======================= Lifecycle ======================= */
  const LC = (V.lifecycle = {
    title: 'Change Lifecycle',
    stage: '',
    render() {
      const open = E.scoped().filter(K.isOpen);
      const all = E.scoped();
      let list = LC.stage === '' ? open : open.filter((c) => String(c.stage) === String(LC.stage));
      if (String(LC.stage) === '12') list = all.filter((c) => c.status === 'Closed');
      list = list.slice().sort((a, b) => (K.stageDaysRemaining(a) ?? 999) - (K.stageDaysRemaining(b) ?? 999));
      const pipeline = `<div class="pipeline">${C.STAGES.map((s, i) => {
        const cs = i === 12 ? all.filter((c) => c.status === 'Closed') : open.filter((c) => c.stage === i);
        const late = cs.filter((c) => (K.stageDaysRemaining(c) ?? 1) < 0).length;
        return `<div class="pipe-stage ${String(LC.stage) === String(i) ? 'sel' : ''}" data-action="lcStage" data-stage="${i}" data-tip="<b>${U.attr(s.name)}</b><br>${U.attr(C.STAGE_ACTIONS[i])}">
          <div class="n">STAGE ${i + 1}</div><div class="nm">${U.esc(s.name)}</div><div class="ct">${cs.length}</div>
          <div class="muted" style="font-size:10.5px;margin-top:2px">${i === 12 ? 'closed' : late ? `<span class="red-t">${late} overdue</span>` : 'on time'}</div></div>`;
      }).join('')}</div>`;
      const dwell = C.STAGES.slice(0, 12).map((s, i) => {
        const durs = [];
        all.forEach((c) => {
          const a = c.stageLog.find((x) => x.stage === i);
          const b = c.stageLog.find((x) => x.stage === i + 1);
          if (a && b) durs.push(U.diff(b.entered, a.entered));
        });
        return { s, avg: U.avg(durs), target: s.days };
      });
      return `<div class="page-head"><div><div class="eyebrow">Workflow</div><h1>Engineering Change Lifecycle</h1><div class="sub">13-stage change process from identification through closure · current stage, owner, pending actions and days remaining</div></div></div>
        ${UI.filterBar()}
        <div class="panel"><div class="panel-b">${pipeline}
          <div style="display:flex;gap:16px;margin-top:12px;align-items:center;flex-wrap:wrap" class="muted">
            <span>${LC.stage === '' ? `Showing all <b style="color:var(--text)">${list.length}</b> open changes` : `Filtered to stage ${Number(LC.stage) + 1}: <b style="color:var(--text)">${U.esc(C.STAGES[LC.stage].name)}</b> (${list.length})`}</span>
            ${LC.stage !== '' ? '<button class="btn xs" data-action="lcStage" data-stage="">Show all stages</button>' : ''}
            <span style="margin-left:auto" class="mx-legend"><span><i style="width:14px;height:8px;border-radius:2px;background:var(--green);display:inline-block"></i>Complete</span><span><i style="width:14px;height:8px;border-radius:2px;background:var(--blue);display:inline-block"></i>Current</span><span><i style="width:14px;height:8px;border-radius:2px;background:var(--yellow);display:inline-block"></i>Due ≤3d</span><span><i style="width:14px;height:8px;border-radius:2px;background:var(--red);display:inline-block"></i>Stage overdue</span><span><i style="width:14px;height:8px;border-radius:2px;background:var(--violet);display:inline-block"></i>On hold</span></span>
          </div></div></div>
        <div class="panel mt"><div class="tbl-wrap tall"><table class="tbl">
          <thead><tr><th>Change</th><th>Title</th><th>Program</th><th style="min-width:270px">Lifecycle Progress</th><th>Current Stage</th><th>Responsible Owner</th><th>Pending Action / Blocker</th><th>Stage Due</th><th class="num">Days Remaining</th><th>Status</th><th></th></tr></thead>
          <tbody>${list.map((c) => `<tr class="row" data-action="open" data-id="${c.id}" data-tab="lifecycle">
            <td class="mono b nowrap blue-t">${U.esc(c.number)}</td><td style="max-width:240px">${U.esc(c.title)}</td><td class="nowrap muted">${U.esc(c.program)}</td>
            <td>${UI.track(c)}</td><td class="nowrap">${UI.stageName(c)}</td><td>${UI.person(c.stageOwner)}</td>
            <td style="max-width:260px;font-size:12.5px">${U.esc(K.blocker(c))}</td><td class="nowrap">${U.fmt(c.stageDue)}</td>
            <td class="num">${UI.daysRem(K.stageDaysRemaining(c))}</td><td>${UI.status(c.status)}</td>
            <td>${K.isOpen(c) && c.stage < 12 && c.status !== 'Rejected' ? `<button class="btn xs primary" data-action="recStage" data-id="${c.id}" data-dir="1" title="Advance to ${U.attr(C.STAGES[c.stage + 1].name)}">Advance</button>` : ''}</td></tr>`).join('') || '<tr><td colspan="11" class="empty">No changes in this stage.</td></tr>'}</tbody></table></div></div>
        <div class="panel mt"><div class="panel-h"><h3>Average Stage Dwell Time vs. Target</h3><span class="hint">Days, completed stage transitions</span></div><div class="panel-b">
          ${CH.slot({ type: 'bar', height: 240, labels: dwell.map((d) => d.s.short), series: [{ name: 'Actual avg', values: dwell.map((d) => Math.round(d.avg || 0)), color: CH.SERIES[0] }, { name: 'Target', values: dwell.map((d) => d.target), color: '#5b6b85' }], rotate: true })}
        </div></div>`;
    },
  });
  E.act.lcStage = (el) => {
    LC.stage = el.dataset.stage === '' || String(LC.stage) === el.dataset.stage ? '' : el.dataset.stage;
    E.App.render();
  };

  /* ======================= Approvals ======================= */
  const AP = (V.approvals = {
    title: 'Approval Tracking',
    scope: 'review',
    render() {
      const scoped = E.scoped();
      const open = scoped.filter(K.isOpen);
      const today = U.today();
      let rows = open.filter((c) => c.approvals.some((a) => a.required));
      if (AP.scope === 'review') rows = rows.filter((c) => c.approvals.some((a) => a.status === 'Pending' || a.status === 'Rejected'));
      if (AP.scope === 'overdue') rows = rows.filter((c) => c.approvals.some(K.approvalOverdue));
      rows.sort((a, b) => b.approvals.filter(K.approvalOverdue).length - a.approvals.filter(K.approvalOverdue).length || a.stage - b.stage);
      const allA = open.flatMap((c) => c.approvals.filter((a) => a.required).map((a) => ({ a, c })));
      const pending = allA.filter((x) => x.a.status === 'Pending');
      const overdue = pending.filter((x) => K.approvalOverdue(x.a));
      const completed = scoped.flatMap((c) => c.approvals.filter((a) => a.completed && a.assigned)).map((a) => U.diff(a.completed, a.assigned));
      const deptStats = C.DEPTS.map((d) => {
        const p = pending.filter((x) => x.a.dept === d.key);
        const od = p.filter((x) => K.approvalOverdue(x.a));
        const comp = scoped.flatMap((c) => c.approvals.filter((a) => a.dept === d.key && a.completed && a.assigned)).map((a) => U.diff(a.completed, a.assigned));
        const ages = p.map((x) => U.diff(today, x.a.assigned));
        return { d, pending: p.length, overdue: od.length, avg: U.avg(comp), oldest: ages.length ? Math.max(...ages) : null };
      });
      const worst = deptStats.slice().sort((a, b) => b.overdue - a.overdue || b.pending - a.pending)[0];
      const cell = (c, a) => {
        const st = K.approvalState(a);
        const d = C.DEPTS.find((x) => x.key === a.dept);
        const age = K.approvalAge(a);
        const tip = st === 'na' ? 'Not required' : `<b>${U.attr(d.name)}</b><br>${U.attr(a.reviewer || 'Unassigned')}<br>${U.attr(a.status)}${age != null ? ` · ${age}d / ${a.target}d target` : ''}${a.actions && st !== 'approved' ? '<br>Action: ' + U.attr(a.actions) : ''}`;
        const icon = st === 'approved' ? UI.icon('check') : st === 'rejected' ? UI.icon('x') : st === 'overdue' ? `${age}d` : st === 'pending' ? `${age}d` : st === 'na' ? '–' : '○';
        return `<td class="cell"><span class="mx ${st}" ${st !== 'na' ? `data-action="apprEdit" data-id="${c.id}" data-dept="${a.dept}"` : ''} data-tip="${tip}">${icon}</span></td>`;
      };
      return `<div class="page-head"><div><div class="eyebrow">Accountability</div><h1>Cross-Functional Approval Tracking</h1><div class="sub">Approval matrix across 10 functions · overdue reviews and bottlenecks highlighted</div></div></div>
        ${UI.filterBar()}
        <div class="stat-row" style="margin-bottom:16px">
          <div class="stat"><div class="s-l">Pending reviews</div><div class="s-v blue-t">${pending.length}</div><div class="s-s">across ${U.uniq(pending.map((x) => x.c.id)).length} changes</div></div>
          <div class="stat"><div class="s-l">Overdue reviews</div><div class="s-v red-t">${overdue.length}</div><div class="s-s">beyond target turnaround</div></div>
          <div class="stat"><div class="s-l">Avg. approval turnaround</div><div class="s-v">${U.num(U.avg(completed), 1)} <small class="muted">days</small></div><div class="s-s">${completed.length} completed reviews</div></div>
          <div class="stat"><div class="s-l">Rejected (open changes)</div><div class="s-v">${allA.filter((x) => x.a.status === 'Rejected').length}</div></div>
          <div class="stat"><div class="s-l">Primary bottleneck</div><div class="s-v" style="font-size:15px">${worst && worst.pending ? U.esc(worst.d.name) : '—'}</div><div class="s-s">${worst && worst.pending ? `${worst.overdue} overdue · ${worst.pending} pending` : ''}</div></div>
        </div>
        <div class="panel"><div class="panel-h" style="flex-wrap:wrap"><h3>Approval Matrix</h3>
          <div class="chips" style="margin-left:12px">${[['review', 'Changes in review'], ['overdue', 'With overdue reviews'], ['all', 'All open changes']].map(([k, l]) => `<span class="chip ${AP.scope === k ? 'on' : ''}" data-action="apScope" data-s="${k}">${l}</span>`).join('')}</div>
          <div class="right mx-legend"><span><span class="mx approved">${UI.icon('check')}</span>Approved</span><span><span class="mx pending">4d</span>Pending (age)</span><span><span class="mx overdue">9d</span>Overdue</span><span><span class="mx rejected">${UI.icon('x')}</span>Rejected</span><span><span class="mx notstarted">○</span>Not started</span></div></div>
          <div class="tbl-wrap tall"><table class="tbl matrix compact">
            <thead><tr><th class="sticky-col">Change</th><th>Stage</th>${C.DEPTS.map((d) => `<th class="dept">${d.short}<div class="faint" style="font-weight:500;text-transform:none;letter-spacing:0">${d.target}d</div></th>`).join('')}<th>Progress</th></tr></thead>
            <tbody>${rows.map((c) => {
              const req = c.approvals.filter((a) => a.required);
              const done = req.filter((a) => K.approvalState(a) === 'approved').length;
              return `<tr><td class="sticky-col" style="min-width:230px"><a class="mono b" data-action="open" data-id="${c.id}" data-tab="approvals">${U.esc(c.number)}</a><div class="muted" style="font-size:11.5px;max-width:240px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${U.esc(c.title)}</div></td>
                <td class="nowrap muted">${UI.stageName(c)}</td>${c.approvals.map((a) => cell(c, a)).join('')}
                <td style="min-width:110px"><div class="bar-meter"><i style="width:${req.length ? (done / req.length) * 100 : 0}%;background:var(--green)"></i></div><div class="muted" style="font-size:11px;margin-top:3px">${done}/${req.length} approved</div></td></tr>`;
            }).join('') || `<tr><td colspan="${C.DEPTS.length + 3}" class="empty">No changes match.</td></tr>`}</tbody></table></div></div>
        <div class="grid g2 mt">
          <div class="panel accent-red"><div class="panel-h"><h3>Overdue Approvals</h3><span class="hint">${overdue.length} reviews beyond target</span></div>
            <div class="tbl-wrap" style="max-height:380px"><table class="tbl compact"><thead><tr><th>Change</th><th>Function</th><th>Reviewer</th><th>Assigned</th><th class="num">Age</th><th>Outstanding Action</th><th></th></tr></thead>
            <tbody>${overdue.sort((x, y) => U.diff(today, y.a.assigned) - y.a.target - (U.diff(today, x.a.assigned) - x.a.target)).map(({ a, c }) => `<tr>
              <td><a class="mono b" data-action="open" data-id="${c.id}" data-tab="approvals">${U.esc(c.number)}</a></td><td class="nowrap">${C.DEPTS.find((d) => d.key === a.dept).name}</td><td>${UI.person(a.reviewer)}</td><td class="nowrap">${U.fmt(a.assigned)}</td>
              <td class="num"><span class="red-t b">${U.diff(today, a.assigned)}d</span> <span class="muted">/${a.target}</span></td><td style="max-width:220px;font-size:12px" class="yellow-t">${U.esc(a.actions)}</td>
              <td class="nowrap"><button class="btn xs success" data-action="apprQuick" data-id="${c.id}" data-dept="${a.dept}" data-st="Approved">Approve</button> <button class="btn xs" data-action="apprEdit" data-id="${c.id}" data-dept="${a.dept}">Edit</button></td></tr>`).join('') || '<tr><td colspan="7" class="empty">No overdue approvals.</td></tr>'}</tbody></table></div></div>
          <div class="panel"><div class="panel-h"><h3>Bottlenecks by Function</h3><span class="hint">Pending reviews · avg turnaround vs target</span></div>
            <div class="panel-b">${CH.slot({ type: 'hbar', height: 300, labels: deptStats.map((x) => x.d.name), series: [{ name: 'Pending (within target)', values: deptStats.map((x) => x.pending - x.overdue), color: ST.info }, { name: 'Overdue', values: deptStats.map((x) => x.overdue), color: ST.critical }] })}</div>
            <div class="tbl-wrap"><table class="tbl compact"><thead><tr><th>Function</th><th class="num">Avg turnaround</th><th class="num">Target</th><th class="num">Oldest pending</th></tr></thead>
            <tbody>${deptStats.map((x) => `<tr><td>${x.d.name}</td><td class="num ${x.avg > x.d.target ? 'red-t' : ''}">${x.avg == null ? '—' : U.num(x.avg, 1) + 'd'}</td><td class="num muted">${x.d.target}d</td><td class="num ${x.oldest > x.d.target ? 'red-t b' : ''}">${x.oldest == null ? '—' : x.oldest + 'd'}</td></tr>`).join('')}</tbody></table></div></div>
        </div>`;
    },
  });
  E.act.apScope = (el) => {
    AP.scope = el.dataset.s;
    E.App.render();
  };
})(window.ECM);
