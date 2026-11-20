/* Views: Technical Impact, Financial, Risk & Escalation, PM Command Center, Analytics, Configuration */
(function (E) {
  const { U, C, UI, Charts: CH } = E;
  const K = E.calc;
  const S = E.store;
  const V = E.views;
  const ST = CH.STATUS;

  /* ---------- recommendations engine ---------- */
  E.recommend = function (c) {
    const out = [];
    const today = U.today();
    const supplyRev = (c.approvals.find((a) => a.dept === 'supply') || {}).reviewer || C.PEOPLE.supply[0];
    if (!c.engineer) out.push({ text: 'Assign a responsible engineer within 2 working days; change cannot progress without an accountable owner.', owner: C.PEOPLE.leadership[0], due: U.addDays(today, 2) });
    if (c.status === 'On Hold') out.push({ text: 'Leadership decision required to release hold or cancel the change; confirm funding source.', owner: C.PEOPLE.leadership[1], due: U.addDays(today, 5) });
    c.approvals.filter(K.approvalOverdue).forEach((a) => {
      const d = C.DEPTS.find((x) => x.key === a.dept);
      out.push({ text: `${d.name}: complete review (${U.diff(today, a.assigned)}d vs ${a.target}d target)${a.actions ? ' — ' + a.actions : ''}.`, owner: a.reviewer || d.name, due: U.addDays(today, 3) });
    });
    if (c.customerApprovalRequired && c.stage >= 6 && c.customerApproval !== 'Approved')
      out.push({ text: `Escalate with ${c.customer} engineering; request decision by ${U.fmt(U.addDays(today, 7))} to protect release date.`, owner: c.programManager || 'Program Manager', due: U.addDays(today, 7) });
    if (c.status === 'Awaiting Supplier' || (c.supplierDependency && K.daysLate(c) > 0))
      out.push({ text: 'Obtain committed recovery date from supplier; evaluate alternate source or expedite.', owner: supplyRev, due: U.addDays(today, 5) });
    if (K.daysLate(c) > 0) out.push({ text: `Approve recovery plan and revised forecast (${K.daysLate(c)}d past required date) at program review.`, owner: c.programManager || 'Program Manager', due: U.addDays(today, 5) });
    if (c.productionImpact && ['Overdue', 'At Risk'].includes(K.schedule(c)) && c.stage < 11)
      out.push({ text: 'Define interim build plan / deviation to protect production deliveries until cut-in.', owner: C.PEOPLE.leadership[2], due: U.addDays(today, 5) });
    if (c.milestone && U.diff(c.milestone.date, today) <= 30 && c.stage < 11)
      out.push({ text: `Protect contractual milestone "${c.milestone.name}" (${U.fmt(c.milestone.date)}): daily tracking until resolved.`, owner: c.programManager || 'Program Manager', due: c.milestone.date });
    if (c.stage >= 4 && !c.technical.assessmentComplete) out.push({ text: 'Complete technical impact assessment before further approvals.', owner: c.engineer || 'Engineering', due: U.addDays(today, 5) });
    return out;
  };

  /* ---------- shared change picker ---------- */
  function picker(list, selId, action, sub) {
    return `<div class="panel"><div class="panel-h"><input class="inp sm" data-input="pickSearch" placeholder="Filter changes…" value="${U.attr(V._pickQ || '')}" aria-label="Filter changes"/></div>
      <div class="picker">${list
        .filter((c) => !V._pickQ || (c.number + ' ' + c.title + ' ' + c.partNumber).toLowerCase().includes(V._pickQ.toLowerCase()))
        .map((c) => `<div class="pk ${c.id === selId ? 'sel' : ''}" data-action="${action}" data-id="${c.id}"><div style="display:flex;gap:6px;align-items:center"><span class="mono b" style="font-size:12px">${U.esc(c.number)}</span>${UI.type(c.type)}<span style="margin-left:auto">${sub(c)}</span></div><div class="pk-t muted">${U.esc(c.title)}</div></div>`)
        .join('') || '<div class="empty">No changes.</div>'}</div></div>`;
  }
  E.inp.pickSearch = U.debounce((el) => {
    V._pickQ = el.value;
    E.App.render();
    const i = U.$('[data-input=pickSearch]');
    if (i) {
      i.focus();
      i.setSelectionRange(i.value.length, i.value.length);
    }
  }, 200);

  /* ======================= Technical Impact ======================= */
  const TI = (V.technical = {
    title: 'Technical Impact',
    sel: null,
    render() {
      const list = E.scoped().filter(K.isOpen).sort((a, b) => a.stage - b.stage);
      if (!TI.sel || !list.find((c) => c.id === TI.sel)) TI.sel = (list.find((c) => c.stage >= 3) || list[0] || {}).id;
      const c = S.get(TI.sel);
      const incomplete = list.filter((x) => x.stage >= 4 && !x.technical.assessmentComplete);
      const short = { design: 'DES', drawing: 'DWG', material: 'MAT', weight: 'WT', structural: 'STR', performance: 'PRF', integration: 'INT', testing: 'TST', qualification: 'QUAL', certification: 'CERT', mfgProcess: 'MFG', supplier: 'SUP', tooling: 'TOOL', inspection: 'INSP', maintenanceDocs: 'MX', airworthiness: 'AW' };
      const heat = `<div class="tbl-wrap" style="max-height:320px"><table class="tbl heat compact"><thead><tr><th class="sticky-col">Change</th>${C.IMPACTS.map((i) => `<th class="num" style="text-align:center" title="${U.attr(i.name)}">${short[i.key]}</th>`).join('')}<th>TIA</th></tr></thead>
        <tbody>${list.map((x) => `<tr class="row ${x.id === TI.sel ? 'sel' : ''}" data-action="tiSel" data-id="${x.id}"><td class="sticky-col mono b nowrap" style="font-size:12px">${U.esc(x.number)}</td>${C.IMPACTS.map((i) => {
          const l = x.impact[i.key].level;
          return `<td class="hc"><span class="lv-${l}" data-tip="<b>${U.attr(i.name)}</b><br>${U.attr(l)}${x.impact[i.key].notes ? '<br>' + U.attr(x.impact[i.key].notes) : ''}">${l === 'None' ? '·' : l === 'TBD' ? '?' : l[0] + (l === 'Moderate' ? 'd' : l === 'Major' ? 'j' : 'n')}</span></td>`;
        }).join('')}<td>${x.technical.assessmentComplete ? '<span class="pill green">Done</span>' : x.stage >= 4 ? '<span class="pill red">Missing</span>' : '<span class="pill gray">Open</span>'}</td></tr>`).join('')}</tbody></table></div>`;
      return `<div class="page-head"><div><div class="eyebrow">Engineering</div><h1>Technical Impact Assessment</h1><div class="sub">Evaluate design, structural, certification, manufacturing and supplier impacts · document justification, evidence and validation</div></div></div>
        ${UI.filterBar()}
        <div class="panel"><div class="panel-h"><h3>Impact Heat Map — Open Changes</h3><span class="hint">${incomplete.length ? `<span class="red-t">${incomplete.length} changes past assessment stage without a completed TIA</span>` : 'All assessments current'}</span>
          <div class="right mx-legend"><span><span class="hc"><span class="lv-Minor">Mn</span></span>Minor</span><span><span class="hc"><span class="lv-Moderate">Md</span></span>Moderate</span><span><span class="hc"><span class="lv-Major">Mj</span></span>Major</span><span><span class="hc"><span class="lv-TBD">?</span></span>TBD</span></div></div>${heat}</div>
        <div class="split mt">
          ${picker(list, TI.sel, 'tiSel', (x) => (x.technical.assessmentComplete ? '<span class="pill green nodot">TIA ✓</span>' : x.stage >= 4 ? '<span class="pill red nodot">TIA missing</span>' : `<span class="muted" style="font-size:11px">${UI.stageName(x)}</span>`))}
          <div class="panel"><div class="panel-h"><h3>${c ? `<span class="mono">${U.esc(c.number)}</span> — ${U.esc(c.title)}` : 'Select a change'}</h3>${c ? `<div class="right"><button class="btn xs" data-action="open" data-id="${c.id}" data-tab="technical">Open record</button></div>` : ''}</div>
            <div class="panel-b">${c ? E.Record.tabs.technical(c) : '<div class="empty">No open changes.</div>'}</div></div>
        </div>`;
    },
  });
  E.act.tiSel = (el) => {
    TI.sel = el.dataset.id;
    E.App.render();
  };

  /* ======================= Financial ======================= */
  const FI = (V.financial = {
    title: 'Financial Impact',
    scope: 'open',
    sort: 'est',
    render() {
      const base = E.scoped();
      const list = FI.scope === 'open' ? base.filter(K.isOpen) : base;
      const rows = list.map((c) => ({ c, k: K.costs(c) }));
      const tot = (fn) => U.sum(rows, fn);
      const est = tot((r) => r.k.est);
      const act = tot((r) => r.k.act);
      const rec = tot((r) => r.k.recurringAnnual);
      const recov = tot((r) => r.c.financial.costRecovery);
      const hrsE = tot((r) => r.c.financial.laborHoursEst);
      const hrsA = tot((r) => r.c.financial.laborHoursAct);
      const fundSum = (f) => tot((r) => (r.c.financial.funding === f ? r.k.est : 0));
      const progs = U.uniq(list.map((c) => c.program)).sort();
      const sortFn = { est: (r) => -r.k.est, variance: (r) => -r.k.variance, recurring: (r) => -r.k.recurringAnnual, exposure: (r) => -r.k.exposure };
      rows.sort((a, b) => sortFn[FI.sort](a) - sortFn[FI.sort](b));
      const els = ['material', 'tooling', 'supplier', 'testing'];
      return `<div class="page-head"><div><div class="eyebrow">Business Impact</div><h1>Program & Financial Impact</h1><div class="sub">Non-recurring and recurring cost, funding, schedule and contractual impact · estimate vs. actual</div></div>
        <div class="actions"><div class="chips">${[['open', 'Open changes'], ['all', 'All changes']].map(([k, l]) => `<span class="chip ${FI.scope === k ? 'on' : ''}" data-action="fiScope" data-s="${k}">${l}</span>`).join('')}</div></div></div>
        ${UI.filterBar()}
        <div class="stat-row" style="margin-bottom:16px">
          <div class="stat"><div class="s-l">Estimated NRE</div><div class="s-v">${U.money(est, true)}</div><div class="s-s">${list.length} changes</div></div>
          <div class="stat"><div class="s-l">Actual to date</div><div class="s-v">${U.money(act, true)}</div><div class="s-s">${est ? U.pct((act / est) * 100) : '—'} of estimate</div></div>
          <div class="stat"><div class="s-l">Cost variance (on actuals)</div><div class="s-v ${tot((r) => r.k.variance) > 0 ? 'red-t' : 'green-t'}">${U.money(tot((r) => (r.k.act > 0 ? r.k.act - r.k.est * Math.min(1, r.c.stage / 11) : 0)), true)}</div><div class="s-s">vs. progress-weighted estimate</div></div>
          <div class="stat"><div class="s-l">Engineering labor</div><div class="s-v">${U.num(hrsA)} <small class="muted">/ ${U.num(hrsE)} hrs</small></div></div>
          <div class="stat"><div class="s-l">Annual recurring impact</div><div class="s-v ${rec > 0 ? 'red-t' : 'green-t'}">${U.money(rec, true)}</div><div class="s-s">${rec < 0 ? 'net savings' : 'net cost increase'}</div></div>
          <div class="stat"><div class="s-l">Potential cost recovery</div><div class="s-v green-t">${U.money(recov, true)}</div><div class="s-s">Customer-funded ${U.money(fundSum('Customer-Funded'), true)}</div></div>
        </div>
        <div class="grid g3">
          <div class="panel"><div class="panel-h"><h3>Estimated vs. Actual by Program</h3></div><div class="panel-b">
            ${CH.slot({ type: 'bar', height: 250, labels: progs, rotate: true, fmt: (v) => U.money(v, true), series: [{ name: 'Estimate', values: progs.map((p) => U.sum(rows.filter((r) => r.c.program === p), (r) => r.k.est)), color: CH.SERIES[0] }, { name: 'Actual', values: progs.map((p) => U.sum(rows.filter((r) => r.c.program === p), (r) => r.k.act)), color: CH.SERIES[1] }], click: { action: 'goRegister', key: 'program' } })}</div></div>
          <div class="panel"><div class="panel-h"><h3>Funding Source</h3><span class="hint">Estimated NRE</span></div><div class="panel-b">
            ${CH.slot({ type: 'donut', height: 250, fmt: (v) => U.money(v, true), items: C.FUNDING.map((f, i) => ({ label: f, value: fundSum(f), color: CH.SERIES[i] })), center: U.money(est, true), centerSub: 'total NRE' })}</div></div>
          <div class="panel"><div class="panel-h"><h3>Cost Elements</h3><span class="hint">Estimate vs actual</span></div><div class="panel-b">
            ${CH.slot({ type: 'hbar', height: 250, fmt: (v) => U.money(v, true), labels: ['Labor', 'Material', 'Tooling', 'Supplier', 'Testing'], series: [{ name: 'Estimate', values: [tot((r) => r.k.laborEst), ...els.map((e) => tot((r) => r.c.financial[e + 'Est']))], color: CH.SERIES[0] }] })}</div></div>
        </div>
        <div class="panel mt"><div class="panel-h"><h3>Change-Level Financial Impact</h3>
          <div class="right"><span class="muted">Sort</span><select class="inp sm" style="width:auto" data-change="fiSort">${U.options([{ value: 'est', label: 'Estimated NRE' }, { value: 'variance', label: 'Variance' }, { value: 'recurring', label: 'Recurring impact' }, { value: 'exposure', label: 'Cost exposure' }], FI.sort)}</select></div></div>
          <div class="tbl-wrap tall"><table class="tbl compact"><thead><tr><th>Change</th><th>Title</th><th>Program</th><th>Funding</th><th class="num">Labor hrs (E/A)</th><th class="num">Est. NRE</th><th class="num">Actual</th><th class="num">Variance</th><th style="width:110px">Burn</th><th class="num">Recurring Δ</th><th class="num">Annual</th><th class="num">Sched Δ</th><th class="num">Recovery</th></tr></thead>
          <tbody>${rows.map(({ c, k }) => `<tr class="row" data-action="open" data-id="${c.id}" data-tab="financial"><td class="mono b nowrap blue-t">${U.esc(c.number)}</td><td style="max-width:240px">${U.esc(c.title)}</td><td class="nowrap muted">${U.esc(c.program)}</td><td class="nowrap">${U.esc(c.financial.funding)}</td>
            <td class="num">${U.num(c.financial.laborHoursEst)} / ${U.num(c.financial.laborHoursAct)}</td><td class="num b">${U.money(k.est)}</td><td class="num">${U.money(k.act)}</td><td class="num ${k.variance > 0 ? 'red-t' : 'green-t'}">${k.variance > 0 ? '+' : ''}${U.money(k.variance, true)}</td>
            <td><div class="bar-meter"><i style="width:${Math.min(100, k.est ? (k.act / k.est) * 100 : 0)}%;background:${k.act > k.est ? 'var(--red)' : 'var(--blue)'}"></i></div></td>
            <td class="num ${c.financial.recurringDelta > 0 ? 'red-t' : c.financial.recurringDelta < 0 ? 'green-t' : ''}">${U.money(c.financial.recurringDelta)}</td><td class="num">${U.money(k.recurringAnnual, true)}</td><td class="num ${c.financial.scheduleImpactDays > 0 ? 'yellow-t' : ''}">${c.financial.scheduleImpactDays}d</td><td class="num green-t">${U.money(c.financial.costRecovery, true)}</td></tr>`).join('')}</tbody>
          <tfoot><tr><td colspan="4">Total (${rows.length})</td><td class="num">${U.num(hrsE)} / ${U.num(hrsA)}</td><td class="num">${U.money(est)}</td><td class="num">${U.money(act)}</td><td class="num">${U.money(act - est, true)}</td><td></td><td></td><td class="num">${U.money(rec, true)}</td><td></td><td class="num">${U.money(recov, true)}</td></tr></tfoot></table></div></div>`;
    },
  });
  E.act.fiScope = (el) => {
    FI.scope = el.dataset.s;
    E.App.render();
  };
  E.chg.fiSort = (el) => {
    FI.sort = el.value;
    E.App.render();
  };

  /* ======================= Risk & Escalation ======================= */
  const RK = (V.risk = {
    title: 'Risk & Escalation',
    flag: 'pastDue',
    cell: null,
    render() {
      const open = E.scoped().filter(K.isOpen);
      const counts = Object.fromEntries(K.FLAG_DEFS.map((d) => [d.key, open.filter((c) => K.flags(c).includes(d.key))]));
      const flagged = counts[RK.flag] || [];
      const risks = open.flatMap((c) => c.risks.filter((r) => r.status !== 'Closed').map((r) => ({ r, c })));
      let rlist = risks;
      if (RK.cell) rlist = risks.filter((x) => x.r.category === RK.cell[0] && x.r.rating === RK.cell[1]);
      rlist.sort((a, b) => C.RISK_LEVELS.indexOf(a.r.rating) - C.RISK_LEVELS.indexOf(b.r.rating));
      const levels = ['Low', 'Medium', 'High', 'Critical'];
      return `<div class="page-head"><div><div class="eyebrow">Proactive Risk Management</div><h1>Risk & Escalation Management</h1><div class="sub">Automatic flags across all open changes · risk register by category and rating</div></div></div>
        ${UI.filterBar()}
        <div class="flag-cards">${K.FLAG_DEFS.map((d) => `<div class="flag-card ${counts[d.key].length ? d.sev : 'zero'} ${RK.flag === d.key ? 'sel' : ''}" data-action="rkFlag" data-f="${d.key}"><div class="fc-n">${counts[d.key].length}</div><div class="fc-l">${d.label}</div><div class="fc-d">${d.desc}</div></div>`).join('')}</div>
        <div class="panel mt ${(K.FLAG_DEFS.find((d) => d.key === RK.flag) || {}).sev === 'red' ? 'accent-red' : 'accent-yellow'}"><div class="panel-h"><h3>${U.esc((K.FLAG_DEFS.find((d) => d.key === RK.flag) || {}).label || '')}</h3><span class="hint">${flagged.length} changes</span></div>
          <div class="tbl-wrap" style="max-height:360px"><table class="tbl compact"><thead><tr><th>Change</th><th>Title</th><th>Program</th><th>Priority</th><th>Owner</th><th>Stage</th><th>Required</th><th>Schedule</th><th>Preventing Closure</th><th>All Flags</th></tr></thead>
          <tbody>${flagged.sort((a, b) => K.score(b) - K.score(a)).map((c) => `<tr class="row" data-action="open" data-id="${c.id}" data-tab="risk"><td class="mono b nowrap blue-t">${U.esc(c.number)}</td><td style="max-width:230px">${U.esc(c.title)}</td><td class="muted nowrap">${U.esc(c.program)}</td><td>${UI.prio(c.priority)}</td><td>${UI.person(c.engineer)}</td><td class="nowrap">${UI.stageName(c)}</td><td class="nowrap">${UI.dateCell(c.requiredDate, c)}</td><td>${UI.sched(c)}</td><td style="max-width:220px;font-size:12px">${U.esc(K.blocker(c))}</td><td>${UI.flags(c, 3)}</td></tr>`).join('') || '<tr><td colspan="10" class="empty">No changes raise this flag.</td></tr>'}</tbody></table></div></div>
        <div class="grid g-1-2 mt">
          <div class="panel"><div class="panel-h"><h3>Risk Matrix</h3><span class="hint">Open risks · category × rating</span>${RK.cell ? '<div class="right"><button class="btn xs" data-action="rkCell" data-c="">Clear</button></div>' : ''}</div><div class="panel-b">
            <table class="rmx"><thead><tr><th></th>${levels.map((l) => `<th style="text-align:center">${l}</th>`).join('')}</tr></thead>
            <tbody>${C.RISK_CATEGORIES.map((cat) => `<tr><th>${cat}</th>${levels.map((l) => {
              const n = risks.filter((x) => x.r.category === cat && x.r.rating === l).length;
              const on = RK.cell && RK.cell[0] === cat && RK.cell[1] === l;
              return `<td class="${n ? 'r' + l : 'r0'}" ${n ? `data-action="rkCell" data-c="${U.attr(cat + '|' + l)}"` : ''} style="${on ? 'outline:2px solid #fff' : ''}" data-tip="<b>${U.attr(cat)}</b><br>${l}: ${n} open risks">${n || ''}</td>`;
            }).join('')}</tr>`).join('')}</tbody></table>
            <div class="stat-row" style="margin-top:12px">${levels.slice().reverse().map((l) => `<div class="stat"><div class="s-l">${l}</div><div class="s-v ${l === 'Critical' ? 'red-t' : l === 'High' ? 'yellow-t' : ''}">${risks.filter((x) => x.r.rating === l).length}</div></div>`).join('')}</div>
          </div></div>
          <div class="panel"><div class="panel-h"><h3>Risk Register</h3><span class="hint">${RK.cell ? `${U.esc(RK.cell[0])} · ${RK.cell[1]} — ` : ''}${rlist.length} open risks</span></div>
            <div class="tbl-wrap" style="max-height:470px"><table class="tbl compact"><thead><tr><th>Change</th><th>Category</th><th>Rating</th><th>Description</th><th>Mitigation</th><th>Owner</th></tr></thead>
            <tbody>${rlist.map(({ r, c }) => `<tr class="row" data-action="open" data-id="${c.id}" data-tab="risk"><td class="mono b nowrap blue-t">${U.esc(c.number)}</td><td class="nowrap">${U.esc(r.category)}</td><td>${UI.risk(r.rating)}</td><td style="min-width:200px;font-size:12.5px">${U.esc(r.description)}</td><td style="min-width:180px;font-size:12px" class="muted">${U.esc(r.mitigation)}</td><td>${UI.person(r.owner)}</td></tr>`).join('') || '<tr><td colspan="6" class="empty">No open risks.</td></tr>'}</tbody></table></div></div>
        </div>`;
    },
  });
  E.act.rkFlag = (el) => {
    RK.flag = el.dataset.f;
    E.App.render();
  };
  E.act.rkCell = (el) => {
    RK.cell = el.dataset.c ? el.dataset.c.split('|') : null;
    E.App.render();
  };

  /* ======================= PM Command Center ======================= */
  V.pm = {
    title: 'PM Command Center',
    render() {
      const all = E.scoped();
      const open = all.filter(K.isOpen);
      const active = open.filter((c) => c.status !== 'Implemented');
      const today = U.today();
      const behind = active.filter((c) => ['Overdue', 'At Risk'].includes(K.schedule(c)));
      const overdue = active.filter((c) => K.schedule(c) === 'Overdue');
      const top = open.slice().sort((a, b) => K.score(b) - K.score(a)).slice(0, 10);
      const lead = open.filter(K.needsLeadership).sort((a, b) => K.score(b) - K.score(a));
      const ms = open.filter((c) => c.milestone && c.stage < 11).sort((a, b) => (a.milestone.date < b.milestone.date ? -1 : 1));
      const prod = open.filter((c) => c.productionImpact && c.stage < 11).sort((a, b) => K.score(b) - K.score(a));
      const cust = open.filter((c) => c.status === 'Awaiting Customer' || (c.customerApprovalRequired && c.stage === 6 && c.customerApproval !== 'Approved'));
      const supp = open.filter((c) => c.status === 'Awaiting Supplier' || (c.supplierDependency && c.approvals.some((a) => a.dept === 'supply' && a.status === 'Pending')));
      const releases = open.filter((c) => c.stage <= 8).map((c) => {
        // projected ECO release = stage due of current stage + remaining target days to stage 7
        let d = c.stageDue || today;
        for (let i = c.stage + 1; i <= 7; i++) d = U.addDays(d, C.STAGES[i].days);
        return { c, d: c.stage >= 7 ? (c.stageLog.find((s) => s.stage === 7) || {}).entered || d : d, released: c.stage >= 7 };
      }).filter((x) => !x.released && U.diff(x.d, today) <= 60).sort((a, b) => (a.d < b.d ? -1 : 1));
      const acts = open.flatMap((c) => c.actions.filter((a) => a.status === 'Open').map((a) => ({ a, c })));
      const byOwner = U.groupBy(acts, (x) => x.a.owner || 'Unassigned');
      const owners = Object.keys(byOwner).sort((a, b) => byOwner[b].filter((x) => x.a.due < today).length - byOwner[a].filter((x) => x.a.due < today).length || byOwner[b].length - byOwner[a].length);
      const costExp = open.map((c) => ({ c, k: K.costs(c) })).filter((x) => x.k.exposure > 0).sort((a, b) => b.k.exposure - a.k.exposure).slice(0, 8);
      const schedExp = active.filter((c) => K.slip(c) > 0 || K.daysLate(c) > 0).sort((a, b) => Math.max(K.slip(b), K.daysLate(b)) - Math.max(K.slip(a), K.daysLate(a))).slice(0, 8);
      const blockers = U.countBy(active, (c) => {
        const b = K.blocker(c);
        return /Overdue approval/.test(b) ? 'Overdue approvals' : /Awaiting .* decision/.test(b) ? 'Customer decision' : /supplier/i.test(b) ? 'Supplier input' : /No responsible/.test(b) ? 'No owner' : /assessment/.test(b) ? 'Technical assessment' : /Pending approval/.test(b) ? 'Approvals in progress' : /verification|Open action/.test(b) ? 'Open actions / V&V' : /hold/.test(b) ? 'On hold' : 'Stage work in progress';
      });
      const topBlock = Object.entries(blockers).sort((a, b) => b[1] - a[1]);
      const odActs = acts.filter((x) => x.a.due && x.a.due < today);
      const costTotal = U.sum(open, (c) => K.costs(c).est);
      const li = (c, right, meta) => `<div class="li" data-action="open" data-id="${c.id}"><div class="li-main"><div class="li-title"><span class="mono b">${U.esc(c.number)}</span> ${U.esc(c.title)}</div><div class="li-meta">${meta || `${U.esc(c.program)} · ${UI.stageName(c)}`}</div></div><div class="li-right">${right || UI.sched(c)}</div></div>`;
      const brief = [
        ['What is open?', `<b>${open.length}</b> open changes · ${U.uniq(open.map((c) => c.program)).length} programs`, 'goRegister', 'preset', 'open'],
        ['What is behind schedule?', `<b class="red-t">${overdue.length}</b> overdue · <b class="yellow-t">${behind.length - overdue.length}</b> at risk`, 'goRegister', 'schedule', 'Overdue'],
        ['What is preventing closure?', topBlock.slice(0, 2).map(([k, n]) => `${k} (<b>${n}</b>)`).join(' · ') || '—', 'nav', 'view', 'lifecycle'],
        ['Who owns outstanding actions?', `<b>${acts.length}</b> open actions · <b class="red-t">${odActs.length}</b> overdue · ${owners.length} owners`, 'pmScroll', 'to', 'pm-actions'],
        ['What requires customer approval?', `<b>${cust.length}</b> awaiting decision · <b>${open.filter((c) => c.customerApprovalRequired && c.customerApproval !== 'Approved').length}</b> require approval`, 'goRegister', 'preset', 'customer'],
        ['What is affecting production?', `<b>${prod.length}</b> changes impact production · <b class="red-t">${prod.filter((c) => K.flags(c).includes('production')).length}</b> at risk`, 'pmScroll', 'to', 'pm-prod'],
        ['Financial & schedule impact?', `<b>${U.money(costTotal, true)}</b> open NRE · <b>${U.sum(active, (c) => Math.max(0, K.slip(c)))}</b> slip-days`, 'nav', 'view', 'financial'],
        ['What needs leadership?', `<b class="red-t">${lead.length}</b> changes for escalation`, 'pmScroll', 'to', 'pm-esc'],
        ['What happens next?', `<b>${releases.length}</b> ECO releases in 60d · <b>${active.filter((c) => (K.stageDaysRemaining(c) ?? 99) <= 7).length}</b> stage gates due ≤7d`, 'pmScroll', 'to', 'pm-next'],
      ];
      return `<div class="page-head"><div><div class="eyebrow">Program Management</div><h1>Program Manager Command Center</h1><div class="sub">Situation brief, critical changes, escalations and accountable owners</div></div>
        <div class="actions"><button class="btn" data-action="report">${UI.icon('printer')} Generate Status Report</button></div></div>
        ${UI.filterBar()}
        <div class="panel"><div class="panel-h"><h3>Situation Brief</h3><span class="hint">The nine questions every program review asks · click to drill in</span></div>
          <div class="brief">${brief.map(([q, a, act, k, v]) => `<div class="brief-item" data-action="${act}" data-${k === 'view' ? 'view' : k === 'to' ? 'to' : 'key'}="${k === 'view' || k === 'to' ? v : k}" ${k !== 'view' && k !== 'to' ? `data-val="${v}"` : ''}><div class="q">${q}</div><div class="a">${a}</div></div>`).join('')}</div></div>
        <div class="grid g-2-1 mt">
          <div class="panel accent-red"><div class="panel-h"><h3>Top 10 Critical Engineering Changes</h3><span class="hint">Ranked by risk score (priority, risk, lateness, slip, production, flags)</span></div>
            <div class="tbl-wrap"><table class="tbl compact"><thead><tr><th>#</th><th>Change</th><th>Title</th><th>Owner</th><th>Stage</th><th>Preventing Closure</th><th class="num">Score</th></tr></thead>
            <tbody>${top.map((c, i) => `<tr class="row" data-action="open" data-id="${c.id}"><td><span class="rank ${i < 3 ? 'hot' : ''}">${i + 1}</span></td><td class="mono b nowrap blue-t">${U.esc(c.number)}<div>${UI.prio(c.priority)}</div></td><td style="max-width:240px">${U.esc(c.title)}<div class="muted" style="font-size:11.5px">${U.esc(c.program)}</div></td><td>${UI.person(c.engineer)}</td><td class="nowrap">${UI.stageName(c)}<div>${UI.sched(c)}</div></td><td style="max-width:220px;font-size:12px">${U.esc(K.blocker(c))}</td><td class="num"><span class="score ${K.score(c) > 90 ? 'red-t' : 'yellow-t'}">${K.score(c)}</span></td></tr>`).join('')}</tbody></table></div></div>
          <div class="panel"><div class="panel-h"><h3>What Is Preventing Closure</h3><span class="hint">Primary blocker, active changes</span></div><div class="panel-b">
            ${CH.slot({ type: 'hbar', height: Math.max(180, topBlock.length * 30 + 20), labels: topBlock.map((x) => x[0]), series: [{ name: 'Changes', values: topBlock.map((x) => x[1]), color: CH.SERIES[0] }] })}</div></div>
        </div>
        <div class="panel mt accent-red" id="pm-esc"><div class="panel-h"><h3>Executive Escalation — Leadership Intervention Required</h3><span class="hint">${lead.length} changes · recommended actions with accountable owners</span></div>
          <div class="panel-b">${lead.length ? `<div class="grid g2">${lead.map((c) => {
            const recs = E.recommend(c).slice(0, 3);
            return `<div class="esc-card"><div style="display:flex;gap:8px;align-items:flex-start"><div style="flex:1;min-width:0"><a class="mono b" data-action="open" data-id="${c.id}">${U.esc(c.number)}</a> ${UI.prio(c.priority)} ${c.escalated ? '<span class="pill red">Escalated</span>' : ''}
              <div style="margin-top:3px">${U.esc(c.title)}</div><div class="muted" style="font-size:12px;margin-top:2px">${U.esc(c.program)} · ${UI.stageName(c)} · ${K.daysLate(c) ? `<span class="red-t b">${K.daysLate(c)}d past due</span>` : `forecast ${U.fmt(c.forecastDate)}`}</div></div><span class="score red-t">${K.score(c)}</span></div>
              <div class="muted" style="font-size:12px;margin-top:6px"><b style="color:var(--text-2)">Issue:</b> ${U.esc(K.blocker(c))}${c.escalationNote ? ' — ' + U.esc(c.escalationNote) : ''}</div>
              ${recs.map((r) => `<div class="rec"><div>${U.esc(r.text)}</div><div class="muted" style="font-size:11.5px;margin-top:3px">Accountable: <b style="color:var(--text)">${U.esc(r.owner)}</b> · by ${U.fmt(r.due)}</div></div>`).join('')}
              <div style="display:flex;gap:6px;margin-top:8px"><button class="btn xs" data-action="pmToAction" data-id="${c.id}">${UI.icon('plus')} Add as action items</button><button class="btn xs ghost" data-action="open" data-id="${c.id}" data-tab="actions">Open actions</button></div></div>`;
          }).join('')}</div>` : '<div class="empty">No changes currently require leadership intervention.</div>'}</div></div>
        <div class="grid g3 mt">
          <div class="panel"><div class="panel-h"><h3>Changes Impacting Program Milestones</h3></div><div class="list">${ms.map((c) => li(c, `<div class="b ${U.diff(c.milestone.date, today) <= 14 ? 'red-t' : U.diff(c.milestone.date, today) <= 30 ? 'yellow-t' : ''}">${U.fmtShort(c.milestone.date)}</div><div class="muted" style="font-size:11px">${U.diff(c.milestone.date, today)}d</div>`, `${U.esc(c.milestone.name)} · ${UI.stageName(c)}`)).join('') || '<div class="empty">None.</div>'}</div></div>
          <div class="panel" id="pm-prod"><div class="panel-h"><h3>Changes Affecting Production Deliveries</h3></div><div class="list">${prod.map((c) => li(c, UI.sched(c), U.esc(c.financial.productionImpact))).join('') || '<div class="empty">None.</div>'}</div></div>
          <div class="panel"><div class="panel-h"><h3>Awaiting Customer Decisions</h3></div><div class="list">${cust.map((c) => {
            const a = c.approvals.find((x) => x.dept === 'customer') || {};
            const age = a.assigned ? U.diff(today, a.assigned) : null;
            return li(c, `<div class="b ${age > (a.target || 21) ? 'red-t' : ''}">${age != null ? age + 'd' : '—'}</div><div class="muted" style="font-size:11px">waiting</div>`, `${U.esc(c.customer)} · ${U.esc(a.reviewer || '')}`);
          }).join('') || '<div class="empty">None.</div>'}</div></div>
          <div class="panel"><div class="panel-h"><h3>Awaiting Supplier Responses</h3></div><div class="list">${supp.map((c) => li(c, UI.sched(c), U.esc(c.config.supplierChanges && c.config.supplierChanges !== 'None' ? c.config.supplierChanges : 'Supplier input pending'))).join('') || '<div class="empty">None.</div>'}</div></div>
          <div class="panel" id="pm-next"><div class="panel-h"><h3>Upcoming Engineering Releases</h3><span class="hint">Projected ECO release ≤ 60 days</span></div><div class="list">${releases.map(({ c, d }) => li(c, `<div class="b ${d < today ? 'red-t' : ''}">${U.fmtShort(d)}</div><div class="muted" style="font-size:11px">${U.diff(d, today)}d</div>`, `${UI.stageName(c)} · ${U.esc(c.stageOwner || 'Unassigned')}`)).join('') || '<div class="empty">None.</div>'}</div></div>
          <div class="panel"><div class="panel-h"><h3>Cost & Schedule Exposure</h3></div><div class="panel-b" style="padding-top:8px">
            <div class="section-title">Cost exposure (unrecovered NRE + annual recurring)</div>
            ${costExp.slice(0, 5).map((x) => `<div style="display:flex;gap:8px;align-items:center;padding:4px 0;cursor:pointer" data-action="open" data-id="${x.c.id}" data-tab="financial"><span class="mono" style="font-size:12px;width:118px">${U.esc(x.c.number)}</span><div class="bar-meter" style="flex:1"><i style="width:${(x.k.exposure / (costExp[0].k.exposure || 1)) * 100}%;background:var(--orange)"></i></div><b style="width:62px;text-align:right">${U.money(x.k.exposure, true)}</b></div>`).join('') || '<div class="muted">None</div>'}
            <div class="section-title">Schedule exposure (days late / forecast slip)</div>
            ${schedExp.slice(0, 5).map((c) => {
              const d = Math.max(K.slip(c), K.daysLate(c));
              return `<div style="display:flex;gap:8px;align-items:center;padding:4px 0;cursor:pointer" data-action="open" data-id="${c.id}"><span class="mono" style="font-size:12px;width:118px">${U.esc(c.number)}</span><div class="bar-meter" style="flex:1"><i style="width:${Math.min(100, (d / 45) * 100)}%;background:var(--red)"></i></div><b style="width:62px;text-align:right">${d}d</b></div>`;
            }).join('') || '<div class="muted">None</div>'}
          </div></div>
        </div>
        <div class="panel mt" id="pm-actions"><div class="panel-h"><h3>Open Action Items by Owner</h3><span class="hint">${acts.length} open · ${odActs.length} overdue</span></div>
          <div class="tbl-wrap" style="max-height:520px"><table class="tbl compact"><thead><tr><th>Owner</th><th class="num">Open</th><th class="num">Overdue</th><th>Action</th><th>Change</th><th>Due</th></tr></thead>
          <tbody>${owners.map((o) => {
            const items = byOwner[o].sort((a, b) => (a.a.due < b.a.due ? -1 : 1));
            const od = items.filter((x) => x.a.due < today).length;
            return items.map((x, i) => `<tr class="row" data-action="open" data-id="${x.c.id}" data-tab="actions">${i === 0 ? `<td rowspan="${items.length}" style="vertical-align:top;background:var(--panel)">${o === 'Unassigned' ? '<span class="red-t b">Unassigned</span>' : UI.person(o)}</td><td rowspan="${items.length}" class="num" style="vertical-align:top;background:var(--panel)">${items.length}</td><td rowspan="${items.length}" class="num ${od ? 'red-t b' : ''}" style="vertical-align:top;background:var(--panel)">${od}</td>` : ''}
              <td style="font-size:12.5px">${U.esc(x.a.text)}</td><td class="mono nowrap" style="font-size:12px">${U.esc(x.c.number)}</td><td class="nowrap">${x.a.due < today ? `<span class="red-t b">${U.fmtShort(x.a.due)} (${U.diff(today, x.a.due)}d late)</span>` : U.fmtShort(x.a.due)}</td></tr>`).join('');
          }).join('') || '<tr><td colspan="6" class="empty">No open action items.</td></tr>'}</tbody></table></div></div>`;
    },
  };
  E.act.nav = (el) => E.App.go(el.dataset.view);
  E.act.pmScroll = (el) => {
    const t = document.getElementById(el.dataset.to);
    if (t) t.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };
  E.act.pmToAction = (el) => {
    const c = S.get(el.dataset.id);
    const recs = E.recommend(c).slice(0, 3);
    S.mutate(c.id, (x) => {
      recs.forEach((r) => {
        if (!x.actions.some((a) => a.text === r.text && a.status === 'Open')) x.actions.push({ id: U.uid('ai'), text: r.text, owner: r.owner, due: r.due, status: 'Open', created: U.today(), closed: null });
      });
    }, 'Escalation Actions', `${recs.length} recommended escalation actions added`);
    UI.toast(`${recs.length} action items added to ${U.esc(c.number)}`);
  };

  /* ======================= Analytics ======================= */
  V.analytics = {
    title: 'Analytics & Reporting',
    render() {
      const list = E.scoped();
      const open = list.filter(K.isOpen);
      const today = U.today();
      const months = U.lastMonths(12);
      const progs = U.uniq(list.map((c) => c.program)).sort();
      const mEnd = (m) => (m === U.monthKey(today) ? today : U.monthEnd(m));
      const approvalCT = months.map((m) => {
        const v = list.flatMap((c) => c.approvals.filter((a) => a.completed && a.assigned && U.monthKey(a.completed) === m)).map((a) => U.diff(a.completed, a.assigned));
        return v.length ? Math.round(U.avg(v) * 10) / 10 : null;
      });
      const implCT = months.map((m) => {
        const v = list.filter((c) => c.status === 'Closed' && c.actualDate && U.monthKey(c.actualDate) === m).map((c) => {
          const e = c.stageLog.find((s) => s.stage === 7);
          return e ? U.diff(c.actualDate, e.entered) : null;
        }).filter((x) => x != null);
        return v.length ? Math.round(U.avg(v)) : null;
      });
      const totalCT = months.map((m) => {
        const v = list.filter((c) => c.status === 'Closed' && c.actualDate && U.monthKey(c.actualDate) === m).map(K.cycleTime);
        return v.length ? Math.round(U.avg(v)) : null;
      });
      const onTime = months.map((m) => {
        const cl = list.filter((c) => c.status === 'Closed' && c.actualDate && U.monthKey(c.actualDate) === m);
        return cl.length ? Math.round((cl.filter((c) => c.actualDate <= c.requiredDate).length / cl.length) * 100) : 0;
      });
      const engs = U.uniq(open.map((c) => c.engineer || 'Unassigned'));
      const owners = U.uniq([...open.map((c) => c.engineer || 'Unassigned'), ...open.flatMap((c) => c.actions.filter((a) => a.status === 'Open').map((a) => a.owner || 'Unassigned'))]);
      const work = owners.map((o) => ({ o, ch: open.filter((c) => (c.engineer || 'Unassigned') === o).length, ac: open.reduce((s, c) => s + c.actions.filter((a) => a.status === 'Open' && (a.owner || 'Unassigned') === o).length, 0) })).sort((a, b) => b.ch + b.ac - (a.ch + a.ac)).slice(0, 14);
      const panel = (title, hint, body, cls = '') => `<div class="panel ${cls}"><div class="panel-h"><h3>${title}</h3>${hint ? `<span class="hint">${hint}</span>` : ''}</div><div class="panel-b">${body}</div></div>`;
      return `<div class="page-head"><div><div class="eyebrow">Insight</div><h1>Analytics & Reporting</h1><div class="sub">Filter by customer, program, component, owner, date range and change type · click bars to drill into the register</div></div>
        <div class="actions"><button class="btn" data-action="exportCSV">${UI.icon('download')} Export CSV</button><button class="btn" data-action="exportXLS">${UI.icon('download')} Export Excel</button><button class="btn primary" data-action="report">${UI.icon('printer')} Status Report</button></div></div>
        ${UI.filterBar()}
        <div class="stat-row" style="margin-bottom:16px">
          <div class="stat"><div class="s-l">Records in scope</div><div class="s-v">${list.length}</div><div class="s-s">${open.length} open</div></div>
          <div class="stat"><div class="s-l">Avg approval cycle</div><div class="s-v">${U.num(U.avg(approvalCT.filter((x) => x != null)), 1)}<small class="muted"> d</small></div><div class="s-s">12-month mean</div></div>
          <div class="stat"><div class="s-l">Avg implementation cycle</div><div class="s-v">${U.num(U.avg(implCT.filter((x) => x != null)), 0)}<small class="muted"> d</small></div><div class="s-s">ECO release → closure</div></div>
          <div class="stat"><div class="s-l">On-time closure</div><div class="s-v">${(() => {
            const cl = list.filter((c) => c.status === 'Closed');
            return cl.length ? U.pct((cl.filter((c) => c.actualDate <= c.requiredDate).length / cl.length) * 100) : '—';
          })()}</div><div class="s-s">all closed changes</div></div>
          <div class="stat"><div class="s-l">Est. NRE in scope</div><div class="s-v">${U.money(U.sum(list, (c) => K.costs(c).est), true)}</div></div>
        </div>
        <div class="grid g3">
          ${panel('Engineering Changes by Program', 'Open vs closed', CH.slot({ type: 'bar', height: 250, stacked: true, rotate: true, labels: progs, series: [{ name: 'Open', values: progs.map((p) => open.filter((c) => c.program === p).length), color: CH.SERIES[0] }, { name: 'Closed', values: progs.map((p) => list.filter((c) => c.program === p && !K.isOpen(c)).length), color: CH.SERIES[2] }], click: { action: 'goRegister', key: 'program' } }))}
          ${panel('Changes by Lifecycle Stage', 'Open changes', CH.slot({ type: 'bar', height: 250, rotate: true, labels: C.STAGES.slice(0, 12).map((s) => s.short), series: [{ name: 'Open', values: C.STAGES.slice(0, 12).map((s, i) => open.filter((c) => c.stage === i).length), color: CH.SERIES[0] }], values: true, click: { action: 'goRegister', key: 'stage', values: Object.fromEntries(C.STAGES.map((s, i) => [s.short, i])) } }))}
          ${panel('Changes by Priority & Risk', 'Open changes', CH.slot({ type: 'bar', height: 250, labels: ['Critical', 'High', 'Medium', 'Low'], series: [{ name: 'Priority', values: ['Critical', 'High', 'Medium', 'Low'].map((p) => open.filter((c) => c.priority === p).length), color: CH.SERIES[0] }, { name: 'Risk level', values: ['Critical', 'High', 'Medium', 'Low'].map((p) => open.filter((c) => c.risk === p).length), color: CH.SERIES[1] }] }))}
        </div>
        <div class="grid g2 mt">
          ${panel('Monthly Submission Trend by Change Type', '12 months', CH.slot({ type: 'bar', height: 260, stacked: true, labels: months.map(U.monthLabel), series: C.TYPES.map((t, i) => ({ name: t, values: months.map((m) => list.filter((c) => c.type === t && U.monthKey(c.dateSubmitted) === m).length), color: CH.SERIES[i] })) }))}
          ${panel('Changes by Responsible Engineer', 'Open changes by priority', CH.slot({ type: 'hbar', height: Math.max(220, engs.length * 24 + 36), labels: engs.sort((a, b) => open.filter((c) => (c.engineer || 'Unassigned') === b).length - open.filter((c) => (c.engineer || 'Unassigned') === a).length), series: C.PRIORITIES.map((p, i) => ({ name: p, values: engs.map((e) => open.filter((c) => (c.engineer || 'Unassigned') === e && c.priority === p).length), color: CH.SERIES[i] })), click: { action: 'goRegister', key: 'owner' } }))}
        </div>
        <div class="grid g3 mt">
          ${panel('Average Approval Cycle Time', 'Days, by month completed', CH.slot({ type: 'line', height: 230, labels: months.map(U.monthLabel), series: [{ name: 'Approval cycle (days)', values: approvalCT, color: CH.SERIES[0] }], area: true }))}
          ${panel('Average Implementation & Total Cycle Time', 'Days, by month closed', CH.slot({ type: 'line', height: 230, labels: months.map(U.monthLabel), series: [{ name: 'Total cycle', values: totalCT, color: CH.SERIES[0] }, { name: 'ECO → close', values: implCT, color: CH.SERIES[1] }] }))}
          ${panel('On-Time Closure Percentage', '% of changes closed by required date', CH.slot({ type: 'bar', height: 230, labels: months.map(U.monthLabel), fmt: (v) => Math.round(v) + '%', series: [{ name: 'On-time %', values: onTime, colors: onTime.map((v) => (v >= 80 ? ST.good : v >= 60 ? ST.warning : v > 0 ? ST.critical : '#33415e')) }] }))}
        </div>
        <div class="grid g3 mt">
          ${panel('Overdue Change Trend', 'Open & past due at month end', CH.slot({ type: 'line', height: 230, labels: months.map(U.monthLabel), series: [{ name: 'Past due', values: months.map((m) => list.filter((c) => K.pastDueAt(c, mEnd(m))).length), color: ST.critical }, { name: 'Open', values: months.map((m) => list.filter((c) => K.openAt(c, mEnd(m))).length), color: CH.SERIES[0] }] }))}
          ${panel('Cost Impact by Program', 'Estimated NRE vs annual recurring Δ', CH.slot({ type: 'bar', height: 230, rotate: true, fmt: (v) => U.money(v, true), labels: progs, series: [{ name: 'Est. NRE', values: progs.map((p) => U.sum(list.filter((c) => c.program === p), (c) => K.costs(c).est)), color: CH.SERIES[0] }, { name: 'Annual recurring Δ', values: progs.map((p) => U.sum(list.filter((c) => c.program === p), (c) => K.costs(c).recurringAnnual)), color: CH.SERIES[1] }] }))}
          ${panel('Engineering Workload Distribution', 'Open changes owned + open action items', CH.slot({ type: 'hbar', height: Math.max(230, work.length * 22 + 36), labels: work.map((w) => w.o), series: [{ name: 'Changes owned', values: work.map((w) => w.ch), color: CH.SERIES[0] }, { name: 'Action items', values: work.map((w) => w.ac), color: CH.SERIES[2] }] }))}
        </div>`;
    },
  };

  /* ======================= Configuration Management ======================= */
  V.config = {
    title: 'Configuration Management',
    render() {
      const list = E.scoped();
      const open = list.filter(K.isOpen);
      const gaps = open.filter((c) => c.config.asDesigned !== c.config.asBuilt);
      const fai = open.filter((c) => c.config.faiRequired && c.config.faiStatus !== 'Complete');
      const custDocs = open.filter((c) => c.customerApprovalRequired && c.stage >= 7 && !/approval|CA-/i.test(c.config.customerDocs || ''));
      const noEvidence = open.filter((c) => c.stage >= 10 && /Not started|^$/i.test(c.config.verificationEvidence || ''));
      const audit = list
        .flatMap((c) => c.history.filter((h) => /Approv|Reject|Stage|Configuration|BOM|Status|Edited|Created/.test(h.action)).map((h) => ({ h, c })))
        .sort((a, b) => (String(a.h.ts) < String(b.h.ts) ? 1 : -1))
        .slice(0, 30);
      return `<div class="page-head"><div><div class="eyebrow">Configuration Control</div><h1>Aerospace Configuration Management</h1><div class="sub">Part, serial and aircraft effectivity traceability · baselines, revisions, BOM, verification evidence and as-designed vs. as-built</div></div></div>
        ${UI.filterBar()}
        <div class="stat-row" style="margin-bottom:16px">
          <div class="stat"><div class="s-l">Configuration items in scope</div><div class="s-v">${U.uniq(list.map((c) => c.partNumber)).length}</div><div class="s-s">part numbers</div></div>
          <div class="stat"><div class="s-l">As-designed ≠ as-built</div><div class="s-v yellow-t">${gaps.length}</div><div class="s-s">open configuration gaps</div></div>
          <div class="stat"><div class="s-l">FAI outstanding</div><div class="s-v ${fai.length ? 'yellow-t' : ''}">${fai.length}</div><div class="s-s">AS9102 required, not complete</div></div>
          <div class="stat"><div class="s-l">Missing customer approval docs</div><div class="s-v ${custDocs.length ? 'red-t' : ''}">${custDocs.length}</div><div class="s-s">ECO released without approval record</div></div>
          <div class="stat"><div class="s-l">Missing verification evidence</div><div class="s-v ${noEvidence.length ? 'red-t' : ''}">${noEvidence.length}</div><div class="s-s">at implementation stage</div></div>
        </div>
        <div class="panel"><div class="panel-h"><h3>Configuration Traceability Matrix</h3><span class="hint">Click a row to open its configuration record</span></div>
          <div class="tbl-wrap tall"><table class="tbl compact"><thead><tr><th class="sticky-col">Change</th><th>Part Number</th><th>Serial Applicability</th><th>Effectivity</th><th>Baseline</th><th>Drawing Rev</th><th>Spec Rev</th><th>SW / HW</th><th>BOM Δ</th><th>Supplier Change</th><th>Customer Docs</th><th>FAI</th><th>As-Designed</th><th>As-Built</th></tr></thead>
          <tbody>${list.filter((c) => K.isOpen(c) || U.diff(U.today(), c.actualDate || U.today()) <= 120).sort((a, b) => b.stage - a.stage).map((c) => {
            const g = c.config;
            const gap = g.asDesigned !== g.asBuilt;
            return `<tr class="row" data-action="open" data-id="${c.id}" data-tab="config"><td class="sticky-col mono b nowrap blue-t">${U.esc(c.number)}</td><td class="mono nowrap">${U.esc(c.partNumber)}</td><td class="nowrap">${U.esc(g.serialApplicability)}</td><td class="nowrap">${U.esc(g.effectivity)}</td><td class="mono nowrap" style="font-size:11.5px">${U.esc(g.baseline)}</td>
              <td class="mono nowrap" style="font-size:11.5px">${U.esc(g.drawingRev)}</td><td class="nowrap">${U.esc(g.specRev)}</td><td class="nowrap muted">${U.esc(g.swHwRev)}</td><td class="num">${(g.bomChanges || []).length}</td><td style="max-width:180px;font-size:12px" class="muted">${U.esc(g.supplierChanges)}</td>
              <td class="nowrap" style="font-size:12px">${U.esc(g.customerDocs)}</td><td>${g.faiRequired ? `<span class="pill ${g.faiStatus === 'Complete' ? 'green' : g.faiStatus === 'In Progress' ? 'blue' : 'yellow'}">${U.esc(g.faiStatus)}</span>` : '<span class="muted">N/A</span>'}</td>
              <td class="mono b">${U.esc(g.asDesigned)}</td><td class="mono b ${gap ? 'yellow-t' : 'green-t'}">${U.esc(g.asBuilt)}${gap ? ' ⚠' : ''}</td></tr>`;
          }).join('')}</tbody></table></div></div>
        <div class="grid g2 mt">
          <div class="panel accent-yellow"><div class="panel-h"><h3>Open Configuration Gaps</h3><span class="hint">As-built lagging as-designed</span></div>
            <div class="list">${gaps.map((c) => `<div class="li" data-action="open" data-id="${c.id}" data-tab="config"><div class="li-main"><div class="li-title"><span class="mono b">${U.esc(c.number)}</span> ${U.esc(c.partName)}</div><div class="li-meta"><span class="mono">${U.esc(c.partNumber)}</span> · ${U.esc(c.config.effectivity)} · ${UI.stageName(c)}</div></div><div class="li-right mono"><b>${U.esc(c.config.asDesigned)}</b> <span class="muted">vs</span> <b class="yellow-t">${U.esc(c.config.asBuilt)}</b></div></div>`).join('') || '<div class="empty">No configuration gaps.</div>'}</div></div>
          <div class="panel"><div class="panel-h"><h3>Configuration Audit Trail</h3><span class="hint">Latest 30 controlled events</span></div>
            <div class="list" style="max-height:420px;overflow:auto">${audit.map(({ h, c }) => `<div class="li" data-action="open" data-id="${c.id}" data-tab="history"><span class="rank">${UI.icon(/Reject/.test(h.action) ? 'x' : /Approv/.test(h.action) ? 'check' : /Stage/.test(h.action) ? 'right' : 'edit')}</span><div class="li-main"><div style="font-size:12.5px"><span class="mono b">${U.esc(c.number)}</span> · ${U.esc(h.action)}</div><div class="li-meta" style="display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${U.esc(h.detail)}</div></div><div class="li-right muted" style="font-size:11.5px">${U.esc(h.user)}<br>${U.fmtTs(h.ts)}</div></div>`).join('')}</div></div>
        </div>`;
    },
  };
})(window.ECM);
