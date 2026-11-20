/* Change record modal: detail tabs, inline editing, create/edit form */
(function (E) {
  const { U, C, UI } = E;
  const K = E.calc;
  const S = E.store;
  const R = (E.Record = {});
  let cur = null; // { id, tab }

  R.TABS = [
    ['overview', 'Overview'],
    ['lifecycle', 'Lifecycle'],
    ['approvals', 'Approvals'],
    ['technical', 'Technical Impact'],
    ['financial', 'Financial'],
    ['risk', 'Risk'],
    ['config', 'Configuration'],
    ['actions', 'Actions & Comments'],
    ['history', 'Audit Trail'],
  ];

  R.isOpen = () => !!cur;
  R.open = (id, tab) => {
    cur = { id, tab: tab || (cur && cur.id === id ? cur.tab : 'overview') };
    R.render();
  };
  R.close = () => {
    cur = null;
    const ov = U.$('#rec-ov');
    if (ov) ov.remove();
    if (location.hash.includes('?')) history.replaceState(null, '', location.hash.split('?')[0]);
  };
  E.act.closeRecord = () => R.close();
  E.act.recTab = (el) => {
    cur.tab = el.dataset.tab;
    R.render();
  };

  R.render = function () {
    if (!cur) return;
    const c = S.get(cur.id);
    if (!c) return R.close();
    let ov = U.$('#rec-ov');
    let scroll = 0;
    if (ov) scroll = (U.$('.modal-b', ov) || {}).scrollTop || 0;
    else {
      ov = document.createElement('div');
      ov.id = 'rec-ov';
      ov.className = 'overlay';
      ov.addEventListener('mousedown', (e) => {
        if (e.target === ov) R.close();
      });
      document.body.appendChild(ov);
    }
    const fl = K.flags(c);
    const pendA = c.approvals.filter((a) => a.status === 'Pending').length;
    const odA = c.approvals.filter(K.approvalOverdue).length;
    const openAct = c.actions.filter((a) => a.status === 'Open').length;
    const openRisks = c.risks.filter((r) => r.status !== 'Closed').length;
    const tabCount = { approvals: pendA ? [pendA, odA > 0] : null, actions: openAct ? [openAct, false] : null, risk: openRisks ? [openRisks, false] : null };
    ov.innerHTML = `<div class="modal" role="dialog" aria-modal="true" aria-label="${U.attr(c.number)}">
      <div class="modal-h">
        <div class="top">
          <div style="flex:1;min-width:0">
            <div class="eyebrow">${U.esc(c.program)} · ${U.esc(c.customer)}</div>
            <h2><span class="mono">${U.esc(c.number)}</span> — ${U.esc(c.title)}</h2>
            <div class="meta">${UI.type(c.type)} ${UI.status(c.status)} ${UI.prio(c.priority)} <span class="muted">Risk</span> ${UI.risk(c.risk)} ${UI.sched(c)}
              <span class="muted">·</span><span class="muted">Stage ${c.stage + 1}/13: <b style="color:var(--text)">${U.esc(C.STAGES[c.stage].name)}</b></span>
              ${c.escalated ? '<span class="pill red">Escalated</span>' : ''}</div>
          </div>
          <button class="icon-btn" data-action="closeRecord" aria-label="Close">${UI.icon('x')}</button>
        </div>
        <div class="tabs">${R.TABS.map(([k, l]) => {
          const tc = tabCount[k];
          return `<button class="tab ${cur.tab === k ? 'active' : ''}" data-action="recTab" data-tab="${k}">${l}${tc ? `<span class="tc ${tc[1] ? 'red' : ''}">${tc[0]}</span>` : ''}</button>`;
        }).join('')}</div>
      </div>
      <div class="modal-b">
        ${R.controls(c)}
        ${fl.length ? `<div style="margin:-6px 0 14px">${UI.flags(c)}</div>` : ''}
        ${R.renderTab(c, cur.tab)}
      </div>
    </div>`;
    const mb = U.$('.modal-b', ov);
    if (mb) mb.scrollTop = scroll;
  };

  R.controls = function (c) {
    const open = K.isOpen(c);
    const engineers = U.uniq([...C.ENGINEERS, c.engineer]).sort();
    const owners = U.uniq([...C.ALL_PEOPLE, c.stageOwner]).sort();
    return `<div class="ctrl-bar">
      <div class="grp"><span class="muted">Status</span><select class="inp sm" data-change="recStatus" data-id="${c.id}" aria-label="Status">${U.options(C.STATUSES, c.status)}</select></div>
      <div class="sep"></div>
      <div class="grp"><span class="muted">Stage</span>
        <button class="btn sm" data-action="recStage" data-id="${c.id}" data-dir="-1" ${c.stage === 0 ? 'disabled' : ''} title="Revert to previous stage">${UI.icon('left')}</button>
        <button class="btn sm primary" data-action="recStage" data-id="${c.id}" data-dir="1" ${c.stage === 12 || c.status === 'Rejected' ? 'disabled' : ''}>Advance ${UI.icon('right')}</button></div>
      <div class="sep"></div>
      <div class="grp"><span class="muted">Responsible Eng.</span><input class="inp sm" style="width:150px" list="dl-people" placeholder="Unassigned" data-change="recField" data-field="engineer" data-id="${c.id}" value="${U.attr(c.engineer)}" aria-label="Responsible engineer"/></div>
      <div class="grp"><span class="muted">Stage Owner</span><input class="inp sm" style="width:150px" list="dl-people" placeholder="Unassigned" data-change="recField" data-field="stageOwner" data-id="${c.id}" value="${U.attr(c.stageOwner)}" aria-label="Stage owner"/></div>
      <div style="margin-left:auto" class="grp">
        ${open ? `<button class="btn sm ${c.escalated ? 'danger' : ''}" data-action="recEscalate" data-id="${c.id}">${UI.icon('flag')} ${c.escalated ? 'De-escalate' : 'Escalate'}</button>` : ''}
        <button class="btn sm" data-action="editChange" data-id="${c.id}">${UI.icon('edit')} Edit</button>
        <button class="btn sm ghost" data-action="deleteChange" data-id="${c.id}" title="Delete record">${UI.icon('trash')}</button>
      </div>
    </div>`;
  };

  R.renderTab = function (c, tab) {
    const fn = R.tabs[tab] || R.tabs.overview;
    return fn(c);
  };
  R.tabs = {};

  /* ---------------- Overview ---------------- */
  R.tabs.overview = function (c) {
    const cost = K.costs(c);
    const blocker = K.blocker(c);
    const open = K.isOpen(c);
    return `<div class="grid g-2-1">
      <div>
        <div class="section-title">Description</div>
        <p style="margin:0 0 6px;color:var(--text-2)">${U.esc(c.description) || '<span class="muted">No description.</span>'}</p>
        ${c.dataNote ? `<div class="callout yellow" style="margin-top:8px;font-size:12.5px"><b>Data completeness:</b> ${U.esc(c.dataNote)}</div>` : ''}
        ${(c.sourceLinks || []).length ? `<div style="margin-top:8px">${c.sourceLinks.map((l) => `<div style="display:flex;gap:8px;align-items:center;margin-top:4px;flex-wrap:wrap"><span class="muted" style="font-size:12px">${U.esc(l.label)}</span><code class="mono" style="font-size:11.5px;background:var(--bg-2);padding:3px 6px;border-radius:4px;border:1px solid var(--border);overflow-wrap:anywhere">${U.esc(l.path)}</code><button class="btn xs" data-action="copyText" data-text="${U.attr(l.path)}">Copy path</button></div>`).join('')}</div>` : ''}
        ${open ? `<div class="grid g2 mt">
          <div class="callout ${/Overdue|No responsible|hold|Awaiting/.test(blocker) ? 'red' : 'yellow'}"><div class="muted b" style="font-size:11px;text-transform:uppercase;letter-spacing:.08em">Preventing closure</div><div style="margin-top:4px">${U.esc(blocker)}</div></div>
          <div class="callout blue"><div class="muted b" style="font-size:11px;text-transform:uppercase;letter-spacing:.08em">Next step · ${UI.person(c.stageOwner)}</div><div style="margin-top:4px">${U.esc(K.nextStep(c))}</div></div>
        </div>` : ''}
        ${c.form ? R.formSection(c.form) : ''}
        <div class="section-title">Change Identification</div>
        <dl class="kv">
          <dt>Change Number</dt><dd class="mono">${U.esc(c.number)}</dd>
          <dt>Change Type</dt><dd>${UI.type(c.type)} <span class="muted">${C.TYPE_DESC[c.type] || ''}</span></dd>
          <dt>Aircraft Program</dt><dd>${U.esc(c.program)}</dd>
          <dt>Customer (OEM)</dt><dd>${U.esc(c.customer)}</dd>
          <dt>Component / Part Number</dt><dd><span class="mono">${U.esc(c.partNumber)}</span> — ${U.esc(c.partName)}</dd>
          <dt>Revision</dt><dd><span class="mono">${U.esc(c.currentRev)}</span> → <span class="mono b blue-t">${U.esc(c.proposedRev)}</span></dd>
          <dt>Originator</dt><dd>${UI.person(c.originator)}</dd>
          <dt>Responsible Engineer</dt><dd>${UI.person(c.engineer)}</dd>
          <dt>Program Manager</dt><dd>${UI.person(c.programManager)}</dd>
          <dt>Priority / Risk</dt><dd>${UI.prio(c.priority)} &nbsp; ${UI.risk(c.risk)}</dd>
        </dl>
      </div>
      <div>
        <div class="section-title">Schedule</div>
        <dl class="kv tight">
          <dt>Submitted</dt><dd>${U.fmt(c.dateSubmitted)}</dd>
          <dt>Required</dt><dd>${UI.dateCell(c.requiredDate, c)}</dd>
          <dt>Forecast</dt><dd>${UI.dateCell(c.forecastDate, c)} ${K.slip(c) > 0 && open ? `<span class="red-t">(+${K.slip(c)}d)</span>` : ''}</dd>
          <dt>Actual</dt><dd>${U.fmt(c.actualDate)}</dd>
          <dt>Days Open</dt><dd class="b">${K.daysOpen(c)}</dd>
          <dt>Schedule</dt><dd>${UI.sched(c)}</dd>
          <dt>Customer Approval</dt><dd>${UI.custAppr(c.customerApproval)}</dd>
          <dt>Implementation</dt><dd>${UI.impl(c.implementationStatus)}</dd>
          <dt>Milestone</dt><dd>${c.milestone ? `${U.esc(c.milestone.name)}<br><span class="muted">${U.fmt(c.milestone.date)} (${U.diff(c.milestone.date, U.today())}d)</span>` : '<span class="muted">None linked</span>'}</dd>
        </dl>
        <div class="section-title">Impact Summary</div>
        <dl class="kv tight">
          <dt>Est. NRE</dt><dd class="b">${U.money(cost.est)}</dd>
          <dt>Actual to date</dt><dd>${U.money(cost.act)} <span class="${cost.variance > 0 ? 'red-t' : 'green-t'}">(${cost.variance > 0 ? '+' : ''}${U.money(cost.variance, true)})</span></dd>
          <dt>Recurring Δ</dt><dd>${U.money(c.financial.recurringDelta)} / shipset</dd>
          <dt>Funding</dt><dd>${U.esc(c.financial.funding)}</dd>
          <dt>Production</dt><dd>${c.productionImpact ? '<span class="pill yellow">Impacts production</span>' : '<span class="muted">No impact</span>'}</dd>
          <dt>Supplier</dt><dd>${c.supplierDependency ? '<span class="pill orange">Supplier dependent</span>' : '<span class="muted">None</span>'}</dd>
        </dl>
        ${c.escalated ? `<div class="callout red mt"><b>Leadership escalation</b><div class="muted" style="margin-top:3px">${U.esc(c.escalationNote || '—')}</div></div>` : ''}
      </div>
    </div>`;
  };

  R.formSection = (f) => `<div class="section-title">EC Form · ${U.esc(f.ecNumber)} Rev ${U.esc(f.ecRev)}</div>
    <dl class="kv">
      <dt>Classification</dt><dd><b>${U.esc(f.changeClass)}</b></dd>
      <dt>Reason / Priority</dt><dd>${U.esc(f.reason)} · ${U.esc(f.priority)}</dd>
      <dt>Change source / Cost resp.</dt><dd>${U.esc(f.changeSource)} / ${U.esc(f.costResponsibility)}</dd>
      <dt>Schedule impact</dt><dd>${U.esc(f.scheduleImpact)}</dd>
      <dt>Interchangeability</dt><dd>${U.esc(f.interchangeability)}</dd>
      <dt>Effectivity / Retrofit</dt><dd>${U.esc(f.effectivity)} / ${U.esc(f.retrofit)}</dd>
      <dt>Highest assembly</dt><dd class="mono">${U.esc(f.highestAssembly)}</dd>
      <dt>Service bulletin</dt><dd>${U.esc(f.serviceBulletin)}</dd>
      <dt>Weight / CG effect</dt><dd>${U.esc(f.weightEffect)} / ${U.esc(f.cgEffect)}</dd>
      <dt>Cert. substantiation</dt><dd>${U.esc(f.certData)}</dd>
      <dt>Compliance statement</dt><dd>${U.esc(f.compliance)}</dd>
      <dt>Reference documents</dt><dd>${U.esc(f.references)}</dd>
      <dt>Export classification</dt><dd><span class="pill yellow nodot">ECCN ${U.esc(f.eccn)}</span></dd>
      <dt>Originator / Supervisor</dt><dd>${U.esc(f.originator)} / ${U.esc(f.supervisor)}</dd>
    </dl>
    ${(f.acceptance || []).length ? `<div class="panel" style="margin-top:12px"><table class="tbl compact"><thead><tr><th>Acceptance block</th><th>Signatures</th><th>Status</th></tr></thead><tbody>${f.acceptance.map((a) => `<tr><td class="b">${U.esc(a.block)}</td><td class="muted">${U.esc(a.roles)}</td><td><span class="pill ${a.status === 'Signed' ? 'green' : a.status === 'N/A' ? 'gray' : 'yellow'}">${U.esc(a.status)}</span></td></tr>`).join('')}</tbody></table></div>` : ''}
    ${(f.documents || []).length ? `<div class="panel" style="margin-top:12px"><table class="tbl compact"><thead><tr><th>Document / Part revised</th><th>Rev</th><th>Description</th></tr></thead><tbody>${f.documents.map((d) => `<tr><td class="mono">${U.esc(d.doc)}</td><td class="mono">${U.esc(d.rev)}</td><td>${U.esc(d.desc)}</td></tr>`).join('')}</tbody></table></div>` : ''}
    ${(f.ecRevisions || []).length ? `<div class="panel" style="margin-top:12px"><table class="tbl compact"><thead><tr><th>EC Rev</th><th>Date</th><th>Description</th></tr></thead><tbody>${f.ecRevisions.map((r) => `<tr><td class="mono b">${U.esc(r.rev)}</td><td class="nowrap">${U.fmt(r.date)}</td><td style="font-size:12.5px">${U.esc(r.description)}</td></tr>`).join('')}</tbody></table></div>` : ''}`;
  E.act.copyText = (el) => {
    const t = el.dataset.text;
    (navigator.clipboard ? navigator.clipboard.writeText(t) : Promise.reject()).then(
      () => UI.toast('Path copied — paste into File Explorer'),
      () => UI.toast('Copy failed — select the path text manually', true)
    );
  };

  /* ---------------- Lifecycle ---------------- */
  R.tabs.lifecycle = function (c) {
    const log = {};
    (c.stageLog || []).forEach((s) => (log[s.stage] = s.entered));
    const open = K.isOpen(c);
    const rem = K.stageDaysRemaining(c);
    const openActions = c.actions.filter((a) => a.status === 'Open');
    return `<div class="grid g-1-2">
      <div>
        <div class="section-title">Current Stage</div>
        <div class="callout ${rem != null && rem < 0 ? 'red' : 'blue'}">
          <div class="b" style="font-size:15px">${c.stage + 1}. ${U.esc(C.STAGES[c.stage].name)}</div>
          <dl class="kv tight" style="margin-top:8px">
            <dt>Owner</dt><dd>${UI.person(c.stageOwner)}</dd>
            <dt>Entered</dt><dd>${U.fmt(log[c.stage])}</dd>
            <dt>Stage due</dt><dd>${open ? `<input type="date" class="inp sm" style="width:150px" data-change="recField" data-field="stageDue" data-id="${c.id}" value="${U.attr(c.stageDue || '')}"/>` : '—'}</dd>
            <dt>Days remaining</dt><dd>${open ? UI.daysRem(rem) : '—'}</dd>
            <dt>Time in stage</dt><dd>${log[c.stage] ? U.diff(c.actualDate || U.today(), log[c.stage]) + ' days' : '—'}</dd>
          </dl>
        </div>
        <div class="section-title">Pending Actions</div>
        ${open ? `<div class="list" style="border:1px solid var(--border);border-radius:8px">
          <div class="li" style="cursor:default"><span class="rank">${UI.icon('right')}</span><div class="li-main"><div>${U.esc(C.STAGE_ACTIONS[c.stage])}</div><div class="li-meta">Stage exit criteria · ${U.esc(c.stageOwner || 'Unassigned')}</div></div></div>
          ${openActions.map((a) => `<div class="li" style="cursor:default"><span class="rank">${UI.icon('clock')}</span><div class="li-main"><div>${U.esc(a.text)}</div><div class="li-meta">${U.esc(a.owner || 'Unassigned')} · due ${UI.dateCell(a.due, c)}</div></div></div>`).join('')}
        </div>` : '<div class="muted">No pending actions — change is closed.</div>'}
        ${open && c.stage < 12 ? `<div class="section-title">Advance Stage</div>
          <div style="display:flex;gap:8px"><input class="inp" id="stage-note" placeholder="Transition note (optional)"/><button class="btn primary" data-action="recStage" data-id="${c.id}" data-dir="1">Advance</button></div>` : ''}
      </div>
      <div>
        <div class="section-title">Engineering Change Lifecycle</div>
        <div class="timeline">${C.STAGES.map((s, i) => {
          const done = i < c.stage || (c.stage === 12 && i === 12);
          const isCur = i === c.stage && open;
          const cls = done ? 'done' : isCur ? 'cur' + (rem != null && rem < 0 ? ' late' : '') : 'todo';
          const entered = log[i];
          const next = log[i + 1];
          const dur = entered ? U.diff(next || c.actualDate || U.today(), entered) : null;
          return `<div class="tl-item ${cls}"><span class="dot">${done ? UI.icon('check') : ''}</span>
            <div style="display:flex;gap:10px;align-items:baseline"><span class="tl-name">${i + 1}. ${U.esc(s.name)}</span>
            <span class="tl-meta" style="margin-left:auto">${entered ? U.fmt(entered) : ''}${dur != null && (done || isCur) && i < 12 ? ` · ${dur}d` : ''}</span></div>
            ${isCur ? `<div class="tl-card">${U.esc(C.STAGE_ACTIONS[i])}<div class="tl-meta" style="margin-top:4px">Owner: ${U.esc(c.stageOwner || 'Unassigned')} · ${rem != null ? (rem < 0 ? `<span class="red-t b">${-rem} days overdue</span>` : `${rem} days remaining`) : ''}</div></div>` : ''}
          </div>`;
        }).join('')}</div>
      </div>
    </div>`;
  };

  /* ---------------- Approvals ---------------- */
  R.tabs.approvals = function (c) {
    const rows = c.approvals
      .map((a) => {
        const d = C.DEPTS.find((x) => x.key === a.dept);
        const st = K.approvalState(a);
        const age = K.approvalAge(a);
        const od = K.approvalOverdue(a);
        const pill =
          st === 'approved' ? `<span class="pill green">${a.status}</span>` :
          st === 'rejected' ? '<span class="pill red">Rejected</span>' :
          st === 'overdue' ? '<span class="pill red">Overdue</span>' :
          st === 'pending' ? '<span class="pill blue">Pending</span>' :
          st === 'na' ? '<span class="pill gray nodot">N/A</span>' : '<span class="pill gray">Not Started</span>';
        return `<tr class="${od ? 'sel' : ''}">
          <td class="b nowrap">${d.name}</td>
          <td><label class="check"><input type="checkbox" data-change="apprRequired" data-id="${c.id}" data-dept="${a.dept}" ${a.required ? 'checked' : ''}/> ${a.required ? 'Yes' : 'No'}</label></td>
          <td>${a.required ? UI.person(a.reviewer, 'Unassigned') : '<span class="muted">—</span>'}</td>
          <td class="nowrap">${U.fmt(a.assigned)}</td>
          <td class="nowrap">${U.fmt(a.completed)}</td>
          <td>${pill}</td>
          <td class="num nowrap">${age != null ? `<span class="${od ? 'red-t b' : ''}">${age}d</span> <span class="muted">/ ${a.target}d</span>` : '<span class="muted">—</span>'}</td>
          <td style="min-width:180px;max-width:260px">${U.esc(a.comments) || '<span class="muted">—</span>'}</td>
          <td style="min-width:160px;max-width:240px">${a.actions && !['approved', 'na'].includes(st) ? `<span class="yellow-t">${U.esc(a.actions)}</span>` : '<span class="muted">—</span>'}</td>
          <td class="nowrap">${a.required ? `
            ${st !== 'approved' ? `<button class="btn xs success" data-action="apprQuick" data-id="${c.id}" data-dept="${a.dept}" data-st="Approved">Approve</button>
            <button class="btn xs danger" data-action="apprQuick" data-id="${c.id}" data-dept="${a.dept}" data-st="Rejected">Reject</button>` : ''}
            <button class="btn xs" data-action="apprEdit" data-id="${c.id}" data-dept="${a.dept}">Edit</button>` : ''}</td>
        </tr>`;
      })
      .join('');
    const req = c.approvals.filter((a) => a.required);
    const done = req.filter((a) => K.approvalState(a) === 'approved').length;
    return `<div class="stat-row" style="margin-bottom:14px">
        <div class="stat"><div class="s-l">Required approvals</div><div class="s-v">${req.length}</div></div>
        <div class="stat"><div class="s-l">Approved</div><div class="s-v green-t">${done}</div><div class="bar-meter" style="margin-top:6px"><i style="width:${req.length ? (done / req.length) * 100 : 0}%;background:var(--green)"></i></div></div>
        <div class="stat"><div class="s-l">Pending</div><div class="s-v blue-t">${req.filter((a) => a.status === 'Pending').length}</div></div>
        <div class="stat"><div class="s-l">Overdue</div><div class="s-v red-t">${req.filter(K.approvalOverdue).length}</div></div>
        <div class="stat"><div class="s-l">Rejected</div><div class="s-v">${req.filter((a) => a.status === 'Rejected').length}</div></div>
      </div>
      <div class="panel"><div class="tbl-wrap"><table class="tbl">
        <thead><tr><th>Function</th><th>Required</th><th>Assigned Reviewer</th><th>Date Assigned</th><th>Date Completed</th><th>Status</th><th class="num">Age / Target</th><th>Comments</th><th>Outstanding Actions</th><th></th></tr></thead>
        <tbody>${rows}</tbody></table></div></div>
      <p class="muted" style="margin-top:10px">Every approval, rejection and reassignment is written to the audit trail with user and timestamp.</p>`;
  };

  /* ---------------- Technical ---------------- */
  R.tabs.technical = function (c) {
    const t = c.technical;
    const groups = U.groupBy(C.IMPACTS, (i) => i.group);
    const vals = t.validations || [];
    return `<div class="stat-row" style="margin-bottom:6px">
        <div class="stat"><div class="s-l">Assessment</div><div class="s-v" style="font-size:15px">${t.assessmentComplete ? '<span class="pill green">Complete</span>' : '<span class="pill yellow">Incomplete</span>'}</div><div class="s-s">${t.assessedBy ? `${U.esc(t.assessedBy)} · ${U.fmt(t.assessedDate)}` : '&nbsp;'}</div></div>
        <div class="stat"><div class="s-l">Classification</div><div class="s-v" style="font-size:15px">${U.esc(t.classification)} change</div></div>
        <div class="stat"><div class="s-l">Weight Δ / shipset</div><div class="s-v">${t.weightDelta > 0 ? '+' : ''}${U.num(t.weightDelta, 2)} <small class="muted">lb</small></div></div>
        <div class="stat"><div class="s-l">Major impacts</div><div class="s-v red-t">${C.IMPACTS.filter((i) => c.impact[i.key].level === 'Major').length}</div></div>
        <div class="stat"><div class="s-l">Testing</div><div class="s-v" style="font-size:15px">${t.testingResolved ? '<span class="pill green">Resolved</span>' : '<span class="pill yellow">Open</span>'}</div></div>
      </div>
      <div id="tech-form">
      ${Object.entries(groups)
        .map(
          ([g, items]) => `<div class="section-title">${g}</div><div class="impact-grid">${items
            .map((i) => {
              const v = c.impact[i.key] || { level: 'None', notes: '' };
              return `<div class="impact-item ${v.level}"><div class="ih"><b>${i.name}</b>
                <select class="inp sm" data-change="impLevel" data-id="${c.id}" data-k="${i.key}" aria-label="${U.attr(i.name)} level">${U.options(C.IMPACT_LEVELS, v.level)}</select></div>
                <textarea class="inp" name="imp_${i.key}" placeholder="Assessment notes…">${U.esc(v.notes)}</textarea></div>`;
            })
            .join('')}</div>`
        )
        .join('')}
      <div class="section-title">Engineering Justification & Evidence</div>
      <div class="form-grid">
        <label class="fld span2"><span>Technical Justification</span><textarea class="inp" name="justification" rows="4">${U.esc(t.justification)}</textarea></label>
        <label class="fld span2"><span>Supporting Evidence</span><textarea class="inp" name="evidence" rows="4" placeholder="Analysis reports, test data, NCR/CAR references…">${U.esc(t.evidence)}</textarea></label>
        <label class="fld span2"><span>Risk Assessment</span><textarea class="inp" name="riskAssessment" rows="3">${U.esc(t.riskAssessment)}</textarea></label>
        <label class="fld span2"><span>Validation Plan</span><textarea class="inp" name="validationPlan" rows="3">${U.esc(t.validationPlan)}</textarea></label>
        <label class="fld"><span>Classification</span><select class="inp" name="classification">${U.options(U.uniq(['Major', 'Minor A', 'Minor B', 'Minor', t.classification]), t.classification)}</select></label>
        <label class="fld"><span>Weight Δ (lb / shipset)</span><input class="inp" type="number" step="0.01" name="weightDelta" value="${U.attr(t.weightDelta)}"/></label>
        <label class="fld" style="justify-content:flex-end"><span>&nbsp;</span><label class="check"><input type="checkbox" name="assessmentComplete" ${t.assessmentComplete ? 'checked' : ''}/> Technical assessment complete</label></label>
        <label class="fld" style="justify-content:flex-end"><span>&nbsp;</span><label class="check"><input type="checkbox" name="testingResolved" ${t.testingResolved ? 'checked' : ''}/> Testing requirements resolved</label></label>
      </div>
      <div style="display:flex;justify-content:flex-end;margin-top:12px"><button class="btn primary" data-action="saveTechnical" data-id="${c.id}">${UI.icon('check')} Save Technical Assessment</button></div>
      </div>
      <div class="section-title">Required Validation Activities</div>
      <div class="panel"><div class="tbl-wrap"><table class="tbl compact">
        <thead><tr><th>Activity</th><th>Method</th><th>Owner</th><th>Due</th><th>Status</th><th></th></tr></thead>
        <tbody>${vals.length ? vals.map((v) => `<tr><td>${U.esc(v.activity)}</td><td>${U.esc(v.method)}</td><td>${UI.person(v.owner)}</td><td>${UI.dateCell(v.due, v.status === 'Complete' ? null : c)}</td>
          <td><select class="inp sm" style="width:130px" data-change="valStatus" data-id="${c.id}" data-vid="${v.id}">${U.options(['Open', 'In Progress', 'Complete'], v.status)}</select></td>
          <td><button class="icon-btn" data-action="valDelete" data-id="${c.id}" data-vid="${v.id}" title="Remove">${UI.icon('trash')}</button></td></tr>`).join('') : '<tr><td colspan="6" class="empty">No validation activities defined.</td></tr>'}</tbody>
      </table></div>
      <div class="tbl-foot" id="val-form" style="gap:8px;flex-wrap:wrap">
        <input class="inp sm" style="flex:2;min-width:180px" name="activity" placeholder="New validation activity…"/>
        <select class="inp sm" style="width:120px" name="method">${U.options(['Test', 'Analysis', 'Inspection', 'Similarity', 'Demonstration'])}</select>
        <input class="inp sm" style="width:150px" list="dl-people" name="owner" placeholder="Owner"/>
        <input class="inp sm" style="width:150px" type="date" name="due"/>
        <button class="btn sm" data-action="valAdd" data-id="${c.id}">${UI.icon('plus')} Add</button>
      </div></div>`;
  };

  /* ---------------- Financial ---------------- */
  R.tabs.financial = function (c) {
    const f = c.financial;
    const k = K.costs(c);
    const line = (label, ek, ak, money = true) => {
      const e = f[ek] || 0;
      const a = f[ak] || 0;
      const v = a - e;
      return `<tr><td>${label}</td>
        <td class="num"><input class="inp sm" style="width:120px;text-align:right" type="number" name="${ek}" value="${e}"/></td>
        <td class="num"><input class="inp sm" style="width:120px;text-align:right" type="number" name="${ak}" value="${a}"/></td>
        <td class="num ${v > 0 ? 'red-t' : 'green-t'}">${v > 0 ? '+' : ''}${money ? U.money(v) : U.num(v)}</td>
        <td style="width:140px"><div class="bar-meter"><i style="width:${Math.min(100, e ? (a / e) * 100 : 0)}%;background:${a > e ? 'var(--red)' : 'var(--blue)'}"></i></div></td></tr>`;
    };
    return `<div class="stat-row" style="margin-bottom:14px">
        <div class="stat"><div class="s-l">Estimated NRE</div><div class="s-v">${U.money(k.est)}</div></div>
        <div class="stat"><div class="s-l">Actual to date</div><div class="s-v">${U.money(k.act)}</div><div class="s-s">${k.est ? U.pct((k.act / k.est) * 100) : '—'} of estimate</div></div>
        <div class="stat"><div class="s-l">Variance</div><div class="s-v ${k.variance > 0 ? 'red-t' : 'green-t'}">${k.variance > 0 ? '+' : ''}${U.money(k.variance)}</div></div>
        <div class="stat"><div class="s-l">Annual recurring impact</div><div class="s-v ${k.recurringAnnual > 0 ? 'red-t' : 'green-t'}">${U.money(k.recurringAnnual)}</div><div class="s-s">${U.money(f.recurringDelta)} × ${f.annualQty}/yr</div></div>
        <div class="stat"><div class="s-l">Potential recovery</div><div class="s-v green-t">${U.money(f.costRecovery)}</div><div class="s-s">${U.esc(f.recoveryStatus)}</div></div>
      </div>
      <div id="fin-form">
      <div class="grid g2">
        <div class="panel"><div class="panel-h"><h3>Estimated vs. Actual Cost</h3><span class="hint">Labor @ ${U.money(f.laborRate || C.LABOR_RATE)}/hr</span></div>
          <div class="tbl-wrap"><table class="tbl compact">
          <thead><tr><th>Cost Element</th><th class="num">Estimate</th><th class="num">Actual</th><th class="num">Variance</th><th>Burn</th></tr></thead>
          <tbody>
            ${line('Engineering labor (hrs)', 'laborHoursEst', 'laborHoursAct', false)}
            <tr><td class="muted">Engineering labor ($)</td><td class="num muted">${U.money(k.laborEst)}</td><td class="num muted">${U.money(k.laborAct)}</td><td class="num muted">${U.money(k.laborAct - k.laborEst)}</td><td></td></tr>
            ${line('Material', 'materialEst', 'materialAct')}
            ${line('Tooling', 'toolingEst', 'toolingAct')}
            ${line('Supplier', 'supplierEst', 'supplierAct')}
            ${line('Testing', 'testingEst', 'testingAct')}
          </tbody>
          <tfoot><tr><td>Total Non-Recurring</td><td class="num">${U.money(k.est)}</td><td class="num">${U.money(k.act)}</td><td class="num ${k.variance > 0 ? 'red-t' : 'green-t'}">${k.variance > 0 ? '+' : ''}${U.money(k.variance)}</td><td></td></tr></tfoot>
          </table></div></div>
        <div class="panel"><div class="panel-h"><h3>Program & Business Impact</h3></div><div class="panel-b">
          <div class="form-grid" style="grid-template-columns:1fr 1fr">
            <label class="fld"><span>Recurring Δ ($ / shipset)</span><input class="inp" type="number" name="recurringDelta" value="${f.recurringDelta}"/></label>
            <label class="fld"><span>Annual Quantity</span><input class="inp" type="number" name="annualQty" value="${f.annualQty}"/></label>
            <label class="fld"><span>Funding</span><select class="inp" name="funding">${U.options(C.FUNDING, f.funding)}</select></label>
            <label class="fld"><span>Schedule Impact (days)</span><input class="inp" type="number" name="scheduleImpactDays" value="${f.scheduleImpactDays}"/></label>
            <label class="fld"><span>Potential Cost Recovery ($)</span><input class="inp" type="number" name="costRecovery" value="${f.costRecovery}"/></label>
            <label class="fld"><span>Recovery Status</span><select class="inp" name="recoveryStatus">${U.options(['N/A', 'Proposed', 'In Negotiation', 'Approved', 'Denied', 'Invoiced'], f.recoveryStatus)}</select></label>
            <label class="fld" style="grid-column:1/-1"><span>Production Impact</span><textarea class="inp" name="productionImpact" rows="2">${U.esc(f.productionImpact)}</textarea></label>
            <label class="fld" style="grid-column:1/-1"><span>Contractual Impact</span><textarea class="inp" name="contractualImpact" rows="2">${U.esc(f.contractualImpact)}</textarea></label>
            <label class="fld"><span>Labor Rate ($/hr)</span><input class="inp" type="number" name="laborRate" value="${f.laborRate || C.LABOR_RATE}"/></label>
          </div>
        </div></div>
      </div>
      <div style="display:flex;justify-content:flex-end;margin-top:12px"><button class="btn primary" data-action="saveFinancial" data-id="${c.id}">${UI.icon('check')} Save Financial Impact</button></div>
      </div>`;
  };

  /* ---------------- Risk ---------------- */
  R.tabs.risk = function (c) {
    const fl = K.flags(c);
    return `<div class="section-title">Automatic Flags</div>
      ${fl.length ? `<div class="grid g2">${fl.map((k) => {
        const d = K.FLAG_DEFS.find((x) => x.key === k);
        return `<div class="callout ${d.sev}"><b>${d.label}</b><div class="muted" style="font-size:12px">${d.desc}</div></div>`;
      }).join('')}</div>` : '<div class="callout green">No automatic risk flags raised for this change.</div>'}
      <div class="section-title">Risk Register</div>
      <div class="panel"><div class="tbl-wrap"><table class="tbl compact">
        <thead><tr><th>Category</th><th>Rating</th><th>Risk Description</th><th>Mitigation</th><th>Owner</th><th>Status</th><th></th></tr></thead>
        <tbody>${c.risks.length ? c.risks.map((r) => `<tr>
          <td class="b nowrap">${U.esc(r.category)}</td>
          <td><select class="inp sm" style="width:110px" data-change="riskField" data-field="rating" data-id="${c.id}" data-rid="${r.id}">${U.options(C.RISK_LEVELS, r.rating)}</select></td>
          <td style="min-width:220px">${U.esc(r.description)}</td>
          <td style="min-width:200px" class="muted">${U.esc(r.mitigation)}</td>
          <td>${UI.person(r.owner)}</td>
          <td><select class="inp sm" style="width:115px" data-change="riskField" data-field="status" data-id="${c.id}" data-rid="${r.id}">${U.options(['Open', 'Mitigating', 'Closed'], r.status)}</select></td>
          <td><button class="icon-btn" data-action="riskDelete" data-id="${c.id}" data-rid="${r.id}" title="Remove">${UI.icon('trash')}</button></td></tr>`).join('') : '<tr><td colspan="7" class="empty">No risks recorded.</td></tr>'}
        </tbody></table></div>
        <div class="tbl-foot" id="risk-form" style="flex-wrap:wrap;gap:8px">
          <select class="inp sm" style="width:200px" name="category">${U.options(C.RISK_CATEGORIES)}</select>
          <select class="inp sm" style="width:110px" name="rating">${U.options(C.RISK_LEVELS, 'Medium')}</select>
          <input class="inp sm" style="flex:2;min-width:180px" name="description" placeholder="Risk description"/>
          <input class="inp sm" style="flex:2;min-width:160px" name="mitigation" placeholder="Mitigation"/>
          <input class="inp sm" style="width:150px" list="dl-people" name="owner" placeholder="Owner" value="${U.attr(c.programManager || c.engineer)}"/>
          <button class="btn sm" data-action="riskAdd" data-id="${c.id}">${UI.icon('plus')} Add Risk</button>
        </div></div>`;
  };

  /* ---------------- Configuration ---------------- */
  R.tabs.config = function (c) {
    const g = c.config;
    const mismatch = g.asDesigned !== g.asBuilt;
    const trail = c.history.filter((h) => /Approv|Reject/.test(h.action));
    const field = (label, name, val, span) => `<label class="fld ${span || ''}"><span>${label}</span><input class="inp" name="${name}" value="${U.attr(val)}"/></label>`;
    return `<div class="grid g-2-1">
      <div id="cfg-form">
        <div class="section-title">Traceability</div>
        <div class="form-grid">
          <label class="fld"><span>Part Number</span><input class="inp mono" value="${U.attr(c.partNumber)}" disabled/></label>
          ${field('Serial Number Applicability', 'serialApplicability', g.serialApplicability)}
          ${field('Aircraft Effectivity', 'effectivity', g.effectivity)}
          ${field('Configuration Baseline', 'baseline', g.baseline)}
          ${field('Drawing Revision', 'drawingRev', g.drawingRev, 'span2')}
          ${field('Engineering Specification Rev', 'specRev', g.specRev)}
          ${field('Software / Hardware Revision', 'swHwRev', g.swHwRev)}
          ${field('Approved Supplier Changes', 'supplierChanges', g.supplierChanges, 'span2')}
          ${field('Customer Approval Documentation', 'customerDocs', g.customerDocs, 'span2')}
          ${field('Verification Evidence', 'verificationEvidence', g.verificationEvidence, 'span4')}
          <label class="fld"><span>First Article Inspection</span><select class="inp" name="faiStatus">${U.options(['N/A', 'Planned', 'In Progress', 'Complete', 'Rejected'], g.faiStatus)}</select></label>
          <label class="fld" style="justify-content:flex-end"><span>&nbsp;</span><label class="check"><input type="checkbox" name="faiRequired" ${g.faiRequired ? 'checked' : ''}/> FAI required (AS9102)</label></label>
          ${field('As-Designed Rev', 'asDesigned', g.asDesigned)}
          ${field('As-Built Rev', 'asBuilt', g.asBuilt)}
        </div>
        <div style="display:flex;justify-content:flex-end;margin-top:12px"><button class="btn primary" data-action="saveConfig" data-id="${c.id}">${UI.icon('check')} Save Configuration</button></div>
        <div class="section-title">Bill of Materials Changes</div>
        <div class="panel"><div class="tbl-wrap"><table class="tbl compact"><thead><tr><th>Action</th><th>Part Number</th><th>Description</th><th class="num">Qty</th><th></th></tr></thead>
          <tbody>${(g.bomChanges || []).map((b, i) => `<tr><td><span class="pill ${b.action === 'Add' ? 'green' : b.action === 'Delete' ? 'red' : 'blue'}">${U.esc(b.action)}</span></td><td class="mono">${U.esc(b.pn)}</td><td>${U.esc(b.desc)}</td><td class="num">${b.qty}</td><td><button class="icon-btn" data-action="bomDelete" data-id="${c.id}" data-i="${i}">${UI.icon('trash')}</button></td></tr>`).join('') || '<tr><td colspan="5" class="empty">No BOM changes.</td></tr>'}</tbody></table></div>
          <div class="tbl-foot" id="bom-form" style="gap:8px;flex-wrap:wrap">
            <select class="inp sm" style="width:100px" name="action">${U.options(['Add', 'Revise', 'Delete', 'Supersede'])}</select>
            <input class="inp sm mono" style="width:180px" name="pn" placeholder="Part number"/>
            <input class="inp sm" style="flex:1;min-width:140px" name="desc" placeholder="Description"/>
            <input class="inp sm" style="width:70px" type="number" name="qty" value="1"/>
            <button class="btn sm" data-action="bomAdd" data-id="${c.id}">${UI.icon('plus')} Add</button>
          </div></div>
      </div>
      <div>
        <div class="section-title">As-Designed vs. As-Built</div>
        <div class="cmp"><div class="side"><h4>As-Designed</h4><div class="rev">${U.esc(g.asDesigned || '—')}</div></div><div class="arrow">${UI.icon('arrowR')}</div>
          <div class="side" style="${mismatch ? 'border-color:rgba(244,180,37,.5)' : 'border-color:rgba(34,179,90,.5)'}"><h4>As-Built</h4><div class="rev ${mismatch ? 'yellow-t' : 'green-t'}">${U.esc(g.asBuilt || '—')}</div></div></div>
        <div class="callout ${mismatch ? 'yellow' : 'green'}" style="margin-top:8px;font-size:12.5px">${mismatch ? 'Configuration gap: as-built lags as-designed until production cut-in and CM update complete.' : 'As-built matches as-designed configuration.'}</div>
        <div class="section-title">Revision History</div>
        <div class="panel"><table class="tbl compact"><thead><tr><th>Rev</th><th>Date</th><th>Change</th><th>Description</th></tr></thead>
          <tbody>${(g.revHistory || []).slice().reverse().map((r) => `<tr><td class="mono b">${U.esc(r.rev)}</td><td class="nowrap">${U.fmt(r.date)}</td><td class="mono">${U.esc(r.change)}</td><td class="muted">${U.esc(r.description)}</td></tr>`).join('') || '<tr><td colspan="4" class="empty">No revision history.</td></tr>'}</tbody></table></div>
        <div class="section-title">Approval Audit Trail</div>
        <div class="panel"><div class="list">${trail.length ? trail.slice().reverse().map((h) => `<div class="li" style="cursor:default"><span class="rank ${h.action === 'Rejected' ? 'hot' : ''}">${UI.icon(h.action === 'Rejected' ? 'x' : h.action === 'Approval Requested' ? 'clock' : 'check')}</span><div class="li-main"><div style="font-size:12.5px">${U.esc(h.detail)}</div><div class="li-meta">${U.esc(h.user)} · ${U.fmtTs(h.ts)}</div></div></div>`).join('') : '<div class="empty">No approval activity yet.</div>'}</div></div>
      </div>
    </div>`;
  };

  /* ---------------- Actions & comments ---------------- */
  R.tabs.actions = function (c) {
    const acts = c.actions.slice().sort((a, b) => (a.status === b.status ? (a.due < b.due ? -1 : 1) : a.status === 'Open' ? -1 : 1));
    return `<div class="grid g-2-1">
      <div>
        <div class="section-title">Action Items</div>
        <div class="panel"><div class="tbl-wrap"><table class="tbl compact"><thead><tr><th></th><th>Action</th><th>Owner</th><th>Due</th><th>Status</th><th></th></tr></thead>
          <tbody>${acts.map((a) => {
            const late = a.status === 'Open' && a.due && a.due < U.today();
            return `<tr><td><input type="checkbox" style="accent-color:var(--green)" data-change="actionToggle" data-id="${c.id}" data-aid="${a.id}" ${a.status === 'Closed' ? 'checked' : ''} aria-label="Complete"/></td>
              <td style="${a.status === 'Closed' ? 'text-decoration:line-through;color:var(--muted)' : ''}">${U.esc(a.text)}</td>
              <td><input class="inp sm" style="width:150px" list="dl-people" placeholder="Unassigned" data-change="actionOwner" data-id="${c.id}" data-aid="${a.id}" value="${U.attr(a.owner)}"/></td>
              <td class="nowrap"><input type="date" class="inp sm" style="width:140px;${late ? 'border-color:var(--red);color:#ff9a9a' : ''}" data-change="actionDue" data-id="${c.id}" data-aid="${a.id}" value="${U.attr(a.due || '')}"/></td>
              <td>${a.status === 'Closed' ? '<span class="pill green">Closed</span>' : late ? '<span class="pill red">Overdue</span>' : '<span class="pill blue">Open</span>'}</td>
              <td><button class="icon-btn" data-action="actionDelete" data-id="${c.id}" data-aid="${a.id}">${UI.icon('trash')}</button></td></tr>`;
          }).join('') || '<tr><td colspan="6" class="empty">No action items.</td></tr>'}</tbody></table></div>
          <div class="tbl-foot" id="act-form" style="gap:8px;flex-wrap:wrap">
            <input class="inp sm" style="flex:2;min-width:200px" name="text" placeholder="New action item…"/>
            <input class="inp sm" style="width:160px" list="dl-people" name="owner" placeholder="Owner" value="${U.attr(c.stageOwner || c.engineer)}"/>
            <input class="inp sm" style="width:150px" type="date" name="due" value="${U.addDays(U.today(), 7)}"/>
            <button class="btn sm primary" data-action="actionAdd" data-id="${c.id}">${UI.icon('plus')} Add Action</button>
          </div></div>
      </div>
      <div>
        <div class="section-title">Comments</div>
        <div class="panel"><div class="panel-b">
          <textarea class="inp" id="comment-text" rows="3" placeholder="Add a comment as ${U.attr(S.user())}…"></textarea>
          <div style="display:flex;justify-content:flex-end;margin-top:8px"><button class="btn sm primary" data-action="commentAdd" data-id="${c.id}">${UI.icon('msg')} Post Comment</button></div>
          <div style="margin-top:8px">${c.comments.slice().reverse().map((m) => `<div class="comment"><span class="avatar">${U.initials(m.author)}</span><div><div class="c-h"><b>${U.esc(m.author)}</b> · ${U.fmtTs(m.date)}</div><div style="margin-top:2px">${U.esc(m.text)}</div></div></div>`).join('') || '<div class="empty">No comments yet.</div>'}</div>
        </div></div>
      </div>
    </div>`;
  };

  /* ---------------- History ---------------- */
  R.tabs.history = function (c) {
    const h = c.history.slice().reverse();
    return `<div style="display:flex;align-items:center;margin-bottom:10px"><span class="muted">${h.length} audit entries · immutable log of every change to this record</span>
      <button class="btn sm" style="margin-left:auto" data-action="exportAudit" data-id="${c.id}">${UI.icon('download')} Export Audit Trail</button></div>
      <div class="panel"><div class="tbl-wrap tall"><table class="tbl compact"><thead><tr><th>Timestamp</th><th>User</th><th>Action</th><th>Detail</th></tr></thead>
      <tbody>${h.map((x) => `<tr><td class="nowrap mono" style="font-size:11.5px">${U.fmtTs(x.ts)}</td><td class="nowrap">${U.esc(x.user)}</td><td class="nowrap"><span class="pill ${/Reject|Delete/.test(x.action) ? 'red' : /Approv|Closed/.test(x.action) ? 'green' : /Escalat/.test(x.action) ? 'orange' : 'blue'} nodot">${U.esc(x.action)}</span></td><td>${U.esc(x.detail)}</td></tr>`).join('')}</tbody></table></div></div>`;
  };

  /* =============== Actions =============== */
  const reRender = () => R.render();

  E.chg.recStatus = (el) => {
    S.setStatus(el.dataset.id, el.value);
    UI.toast(`Status updated to <b>${U.esc(el.value)}</b>`);
  };
  E.act.recStage = (el) => {
    const c = S.get(el.dataset.id);
    const dir = Number(el.dataset.dir);
    const note = (U.$('#stage-note') || {}).value || '';
    const target = c.stage + dir;
    if (dir > 0 && c.stage === 3 && !c.technical.assessmentComplete) {
      return UI.confirm('The technical impact assessment is not marked complete. Advance to Cross-Functional Review anyway? This will be flagged.', () => doStage(c, target, note), 'Advance anyway');
    }
    if (dir > 0 && c.stage === 6 && c.customerApprovalRequired && c.customerApproval !== 'Approved') {
      return UI.confirm(`Customer approval is <b>${U.esc(c.customerApproval)}</b>. Release ECO without recorded customer approval?`, () => doStage(c, target, note), 'Release anyway');
    }
    if (dir > 0 && target === 12 && c.actions.some((a) => a.status === 'Open')) {
      return UI.confirm('This change still has open action items. Close the change anyway?', () => doStage(c, target, note), 'Close change');
    }
    doStage(c, target, note);
  };
  function doStage(c, target, note) {
    S.setStage(c.id, target, note);
    UI.toast(`${U.esc(c.number)} moved to <b>${U.esc(C.STAGES[Math.max(0, Math.min(12, target))].name)}</b>`);
  }
  E.chg.recField = (el) => {
    const f = el.dataset.field;
    const v = el.value;
    S.mutate(el.dataset.id, (c) => {
      if (c[f] === v) return false;
      c._prev = c[f];
      c[f] = v;
    }, f === 'engineer' ? 'Owner Assigned' : f === 'stageOwner' ? 'Stage Owner Assigned' : 'Field Updated', (c) => {
      const prev = c._prev;
      delete c._prev;
      const label = { engineer: 'Responsible engineer', stageOwner: 'Stage owner', stageDue: 'Stage due date' }[f] || f;
      return `${label}: ${prev || '—'} → ${v || '—'}`;
    });
  };
  E.act.recEscalate = (el) => {
    const c = S.get(el.dataset.id);
    if (c.escalated) {
      S.mutate(c.id, (x) => {
        x.escalated = false;
      }, 'De-escalated', 'Removed from leadership escalation');
      return;
    }
    UI.dialog({
      title: `Escalate ${U.esc(c.number)}`,
      body: `<label class="fld"><span>Escalation reason / ask of leadership</span><textarea class="inp" id="esc-note" rows="4">${U.esc(c.escalationNote)}</textarea></label>`,
      foot: `<button class="btn" data-action="closeDialog">Cancel</button><button class="btn danger" data-action="doEscalate" data-id="${c.id}">${UI.icon('flag')} Escalate</button>`,
    });
  };
  E.act.doEscalate = (el) => {
    const note = U.$('#esc-note').value.trim();
    UI.closeDialog();
    S.mutate(el.dataset.id, (x) => {
      x.escalated = true;
      x.escalationNote = note;
    }, 'Escalated', `Escalated to leadership${note ? ': ' + note : ''}`);
    UI.toast('Change escalated to leadership');
  };
  E.act.deleteChange = (el) => {
    const c = S.get(el.dataset.id);
    UI.confirm(`Permanently delete <b>${U.esc(c.number)}</b>? This removes the record and its audit trail from local storage.`, () => {
      R.close();
      S.remove(c.id);
      UI.toast(`${U.esc(c.number)} deleted`);
    }, 'Delete', true);
  };

  /* approvals */
  E.chg.apprRequired = (el) => {
    S.mutate(el.dataset.id, (c) => {
      const a = c.approvals.find((x) => x.dept === el.dataset.dept);
      a.required = el.checked;
      if (!a.required) a.status = 'N/A';
      else if (a.status === 'N/A') {
        a.status = c.stage >= 4 ? 'Pending' : 'Not Started';
        if (c.stage >= 4) a.assigned = U.today();
        a.reviewer = a.reviewer || K.defaultReviewer(c, a.dept);
      }
    }, 'Approval Requirement', `${C.DEPTS.find((d) => d.key === el.dataset.dept).name} approval ${el.checked ? 'required' : 'not required'}`);
  };
  E.act.apprQuick = (el) => openApprovalDialog(el.dataset.id, el.dataset.dept, el.dataset.st);
  E.act.apprEdit = (el) => openApprovalDialog(el.dataset.id, el.dataset.dept);
  function openApprovalDialog(id, dept, preset) {
    const c = S.get(id);
    const a = c.approvals.find((x) => x.dept === dept);
    const d = C.DEPTS.find((x) => x.key === dept);
    const pool = dept === 'customer' ? [(C.programByName(c.program) || {}).custRep, a.reviewer] : C.PEOPLE[dept] || C.ALL_PEOPLE;
    const status = preset || (a.status === 'Not Started' ? 'Pending' : a.status);
    UI.dialog({
      title: `${d.name} — ${U.esc(c.number)}`,
      body: `<div class="form-grid" id="appr-form" style="grid-template-columns:1fr 1fr">
        <label class="fld"><span>Assigned Reviewer</span><input class="inp" list="dl-people" name="reviewer" placeholder="Unassigned" value="${U.attr(a.reviewer || K.defaultReviewer(c, dept))}"/></label>
        <label class="fld"><span>Decision / Status</span><select class="inp" name="status">${U.options(C.APPROVAL_STATUS.filter((s) => s !== 'N/A'), status)}</select></label>
        <label class="fld"><span>Date Assigned</span><input class="inp" type="date" name="assigned" value="${U.attr(a.assigned || U.today())}"/></label>
        <label class="fld"><span>Target (days)</span><input class="inp" type="number" name="target" value="${a.target}"/></label>
        <label class="fld" style="grid-column:1/-1"><span>Comments ${preset === 'Rejected' ? '(required for rejection)' : ''}</span><textarea class="inp" name="comments" rows="3">${U.esc(a.comments)}</textarea></label>
        <label class="fld" style="grid-column:1/-1"><span>Outstanding Actions</span><input class="inp" name="actions" value="${U.attr(a.actions)}"/></label>
        </div>
        <p class="muted" style="margin:10px 0 0;font-size:12px">Recorded as <b>${U.esc(S.user())}</b> on ${U.fmt(U.today())}.</p>`,
      foot: `<button class="btn" data-action="closeDialog">Cancel</button><button class="btn ${status === 'Rejected' ? 'danger' : 'primary'}" data-action="apprSave" data-id="${id}" data-dept="${dept}">Record Decision</button>`,
    });
  }
  E.act.apprSave = (el) => {
    const f = UI.readForm(U.$('#appr-form'));
    if (f.status === 'Rejected' && !f.comments.trim()) {
      UI.toast('A comment is required to record a rejection.', true);
      return;
    }
    UI.closeDialog();
    const dn = C.DEPTS.find((d) => d.key === el.dataset.dept).name;
    let actionName = 'Approval Updated';
    S.mutate(el.dataset.id, (c) => {
      const a = c.approvals.find((x) => x.dept === el.dataset.dept);
      const was = a.status;
      a.reviewer = f.reviewer;
      a.status = f.status;
      a.assigned = f.assigned || a.assigned || U.today();
      a.target = Number(f.target) || a.target;
      a.comments = f.comments;
      a.actions = f.actions;
      a.required = true;
      const decided = ['Approved', 'Approved w/ Comments', 'Rejected'].includes(f.status);
      a.completed = decided ? (was === f.status && a.completed ? a.completed : U.today()) : null;
      actionName = f.status === 'Rejected' ? 'Rejected' : decided ? 'Approved' : 'Approval Requested';
      if (el.dataset.dept === 'customer') {
        c.customerApproval = f.status === 'Rejected' ? 'Rejected' : decided ? 'Approved' : 'Submitted';
      }
    }, null);
    const c = S.get(el.dataset.id);
    const a = c.approvals.find((x) => x.dept === el.dataset.dept);
    S.log(c, actionName, `${dn}: ${a.status}${a.reviewer ? ' by ' + a.reviewer : ''}${a.comments ? ' — ' + a.comments : ''}`);
    S.save();
    S.emit();
    UI.toast(`${dn} decision recorded: <b>${U.esc(a.status)}</b>`);
  };

  /* technical */
  E.chg.impLevel = (el) => {
    const name = C.IMPACTS.find((i) => i.key === el.dataset.k).name;
    S.mutate(el.dataset.id, (c) => {
      c._prev = c.impact[el.dataset.k].level;
      c.impact[el.dataset.k].level = el.value;
    }, 'Impact Assessed', (c) => {
      const p = c._prev;
      delete c._prev;
      return `${name}: ${p} → ${el.value}`;
    });
  };
  E.act.saveTechnical = (el) => {
    const f = UI.readForm(U.$('#tech-form'));
    S.mutate(el.dataset.id, (c) => {
      C.IMPACTS.forEach((i) => (c.impact[i.key].notes = f['imp_' + i.key] || ''));
      const t = c.technical;
      ['justification', 'evidence', 'riskAssessment', 'validationPlan', 'classification'].forEach((k) => (t[k] = f[k]));
      t.weightDelta = Number(f.weightDelta) || 0;
      if (f.assessmentComplete && !t.assessmentComplete) {
        t.assessedBy = S.user();
        t.assessedDate = U.today();
      }
      t.assessmentComplete = f.assessmentComplete;
      t.testingResolved = f.testingResolved;
    }, 'Technical Assessment Updated', 'Technical impact assessment saved');
    UI.toast('Technical assessment saved');
  };
  E.act.valAdd = (el) => {
    const f = UI.readForm(U.$('#val-form'));
    if (!f.activity.trim()) return UI.toast('Enter a validation activity.', true);
    S.mutate(el.dataset.id, (c) => {
      c.technical.validations = c.technical.validations || [];
      c.technical.validations.push({ id: U.uid('va'), activity: f.activity.trim(), method: f.method, owner: f.owner, due: f.due, status: 'Open' });
    }, 'Validation Added', `Validation activity added: ${f.activity.trim()}`);
  };
  E.chg.valStatus = (el) => {
    S.mutate(el.dataset.id, (c) => {
      const v = c.technical.validations.find((x) => x.id === el.dataset.vid);
      c._n = v.activity;
      v.status = el.value;
      if (c.technical.validations.every((x) => x.status === 'Complete')) c.technical.testingResolved = true;
    }, 'Validation Updated', (c) => {
      const n = c._n;
      delete c._n;
      return `${n}: ${el.value}`;
    });
  };
  E.act.valDelete = (el) =>
    S.mutate(el.dataset.id, (c) => {
      c.technical.validations = c.technical.validations.filter((x) => x.id !== el.dataset.vid);
    }, 'Validation Removed', 'Validation activity removed');

  /* financial */
  E.act.saveFinancial = (el) => {
    const f = UI.readForm(U.$('#fin-form'));
    S.mutate(el.dataset.id, (c) => {
      Object.entries(f).forEach(([k, v]) => {
        c.financial[k] = typeof c.financial[k] === 'number' || ['laborHoursEst', 'laborHoursAct', 'materialEst', 'materialAct', 'toolingEst', 'toolingAct', 'supplierEst', 'supplierAct', 'testingEst', 'testingAct', 'recurringDelta', 'annualQty', 'scheduleImpactDays', 'costRecovery', 'laborRate'].includes(k) ? Number(v) || 0 : v;
      });
    }, 'Financial Impact Updated', () => `Financial impact saved (est. NRE ${U.money(K.costs(S.get(el.dataset.id)).est)})`);
    UI.toast('Financial impact saved');
  };

  /* risk */
  E.chg.riskField = (el) =>
    S.mutate(el.dataset.id, (c) => {
      const r = c.risks.find((x) => x.id === el.dataset.rid);
      c._n = r.category;
      r[el.dataset.field] = el.value;
    }, 'Risk Updated', (c) => {
      const n = c._n;
      delete c._n;
      return `${n} risk ${el.dataset.field} → ${el.value}`;
    });
  E.act.riskAdd = (el) => {
    const f = UI.readForm(U.$('#risk-form'));
    if (!f.description.trim()) return UI.toast('Enter a risk description.', true);
    S.mutate(el.dataset.id, (c) => {
      c.risks.push({ id: U.uid('rk'), category: f.category, rating: f.rating, description: f.description.trim(), mitigation: f.mitigation.trim(), owner: f.owner, status: 'Open' });
    }, 'Risk Added', `${f.category} risk added (${f.rating}): ${f.description.trim()}`);
  };
  E.act.riskDelete = (el) =>
    S.mutate(el.dataset.id, (c) => {
      c.risks = c.risks.filter((x) => x.id !== el.dataset.rid);
    }, 'Risk Removed', 'Risk removed from register');

  /* config */
  E.act.saveConfig = (el) => {
    const f = UI.readForm(U.$('#cfg-form'));
    S.mutate(el.dataset.id, (c) => {
      Object.entries(f).forEach(([k, v]) => {
        if (k in c.config || k === 'faiRequired') c.config[k] = v;
      });
    }, 'Configuration Updated', 'Configuration traceability record saved');
    UI.toast('Configuration saved');
  };
  E.act.bomAdd = (el) => {
    const f = UI.readForm(U.$('#bom-form'));
    if (!f.pn.trim()) return UI.toast('Enter a part number.', true);
    S.mutate(el.dataset.id, (c) => {
      c.config.bomChanges = c.config.bomChanges || [];
      c.config.bomChanges.push({ action: f.action, pn: f.pn.trim(), desc: f.desc.trim(), qty: Number(f.qty) || 1 });
    }, 'BOM Updated', `BOM ${f.action}: ${f.pn.trim()} ${f.desc.trim()}`);
  };
  E.act.bomDelete = (el) =>
    S.mutate(el.dataset.id, (c) => {
      const b = c.config.bomChanges.splice(Number(el.dataset.i), 1)[0];
      c._n = b ? b.pn : '';
    }, 'BOM Updated', (c) => {
      const n = c._n;
      delete c._n;
      return `BOM line removed: ${n}`;
    });

  /* actions & comments */
  E.act.actionAdd = (el) => {
    const f = UI.readForm(U.$('#act-form'));
    if (!f.text.trim()) return UI.toast('Enter an action description.', true);
    S.mutate(el.dataset.id, (c) => {
      c.actions.push({ id: U.uid('ai'), text: f.text.trim(), owner: f.owner, due: f.due, status: 'Open', created: U.today(), closed: null });
    }, 'Action Added', `Action added: ${f.text.trim()} (owner ${f.owner || 'unassigned'}, due ${f.due || '—'})`);
  };
  E.chg.actionToggle = (el) =>
    S.mutate(el.dataset.id, (c) => {
      const a = c.actions.find((x) => x.id === el.dataset.aid);
      a.status = el.checked ? 'Closed' : 'Open';
      a.closed = el.checked ? U.today() : null;
      c._n = a.text;
    }, el.checked ? 'Action Closed' : 'Action Reopened', (c) => {
      const n = c._n;
      delete c._n;
      return n;
    });
  E.chg.actionOwner = (el) =>
    S.mutate(el.dataset.id, (c) => {
      const a = c.actions.find((x) => x.id === el.dataset.aid);
      a.owner = el.value;
      c._n = a.text;
    }, 'Action Reassigned', (c) => {
      const n = c._n;
      delete c._n;
      return `${n} → ${el.value || 'unassigned'}`;
    });
  E.chg.actionDue = (el) =>
    S.mutate(el.dataset.id, (c) => {
      const a = c.actions.find((x) => x.id === el.dataset.aid);
      a.due = el.value;
      c._n = a.text;
    }, 'Action Due Date', (c) => {
      const n = c._n;
      delete c._n;
      return `${n} due ${el.value}`;
    });
  E.act.actionDelete = (el) =>
    S.mutate(el.dataset.id, (c) => {
      c.actions = c.actions.filter((x) => x.id !== el.dataset.aid);
    }, 'Action Removed', 'Action item removed');
  E.act.commentAdd = (el) => {
    const t = U.$('#comment-text').value.trim();
    if (!t) return;
    S.mutate(el.dataset.id, (c) => {
      c.comments.push({ id: U.uid('cm'), author: S.user(), date: new Date().toISOString(), text: t });
    }, 'Comment Added', t.length > 80 ? t.slice(0, 80) + '…' : t);
  };

  /* =============== Create / edit form =============== */
  R.form = function (c, isNew) {
    const engineers = U.uniq([...C.ENGINEERS, c.engineer]).sort();
    const pms = U.uniq([...C.PEOPLE.pm, c.programManager]);
    return `<div class="form-grid" id="ec-form">
      <label class="fld"><span>Change Type</span><select class="inp" name="type">${C.TYPES.map((t) => `<option value="${t}" ${c.type === t ? 'selected' : ''}>${t} — ${C.TYPE_DESC[t]}</option>`).join('')}</select></label>
      <label class="fld"><span>Change Number</span><input class="inp mono" name="number" value="${U.attr(c.number)}" placeholder="Auto-assigned"/></label>
      <label class="fld"><span>Priority</span><select class="inp" name="priority">${U.options(C.PRIORITIES, c.priority)}</select></label>
      <label class="fld"><span>Risk Level</span><select class="inp" name="risk">${U.options(C.RISK_LEVELS, c.risk)}</select></label>
      <label class="fld span4"><span>Change Title *</span><input class="inp" name="title" value="${U.attr(c.title)}" required/></label>
      <label class="fld span4"><span>Change Description / Problem Statement</span><textarea class="inp" name="description" rows="3">${U.esc(c.description)}</textarea></label>
      <label class="fld span2"><span>Aircraft Program / Platform</span><select class="inp" name="program" data-change="formProgram">${U.options(C.PROGRAMS.map((p) => p.name), c.program)}</select></label>
      <label class="fld span2"><span>Customer (OEM)</span><input class="inp" name="customer" value="${U.attr(c.customer)}"/></label>
      <label class="fld"><span>Part Number *</span><input class="inp mono" name="partNumber" value="${U.attr(c.partNumber)}"/></label>
      <label class="fld"><span>Component Name</span><input class="inp" name="partName" value="${U.attr(c.partName)}"/></label>
      <label class="fld"><span>Current Revision</span><input class="inp mono" name="currentRev" value="${U.attr(c.currentRev)}"/></label>
      <label class="fld"><span>Proposed Revision</span><input class="inp mono" name="proposedRev" value="${U.attr(c.proposedRev)}"/></label>
      <label class="fld"><span>Originator</span><input class="inp" list="dl-people" name="originator" value="${U.attr(c.originator)}"/></label>
      <label class="fld"><span>Responsible Engineer</span><input class="inp" list="dl-people" name="engineer" placeholder="Unassigned" value="${U.attr(c.engineer)}"/></label>
      <label class="fld"><span>Program Manager</span><input class="inp" list="dl-people" name="programManager" placeholder="Unassigned" value="${U.attr(c.programManager)}"/></label>
      <label class="fld"><span>Status</span><select class="inp" name="status">${U.options(C.STATUSES, c.status)}</select></label>
      <label class="fld"><span>Date Submitted</span><input class="inp" type="date" name="dateSubmitted" value="${U.attr(c.dateSubmitted)}"/></label>
      <label class="fld"><span>Required Completion</span><input class="inp" type="date" name="requiredDate" value="${U.attr(c.requiredDate)}"/></label>
      <label class="fld"><span>Forecast Completion</span><input class="inp" type="date" name="forecastDate" value="${U.attr(c.forecastDate)}"/></label>
      <label class="fld"><span>Actual Completion</span><input class="inp" type="date" name="actualDate" value="${U.attr(c.actualDate || '')}"/></label>
      <label class="fld"><span>Customer Approval</span><select class="inp" name="customerApproval">${U.options(C.CUSTOMER_APPROVAL, c.customerApproval)}</select></label>
      <label class="fld"><span>Implementation Status</span><select class="inp" name="implementationStatus">${U.options(C.IMPL_STATUS, c.implementationStatus)}</select></label>
      <label class="fld"><span>Contractual Milestone</span><input class="inp" name="msName" value="${U.attr(c.milestone ? c.milestone.name : '')}" placeholder="e.g. Shipset 48 Delivery"/></label>
      <label class="fld"><span>Milestone Date</span><input class="inp" type="date" name="msDate" value="${U.attr(c.milestone ? c.milestone.date : '')}"/></label>
      <div class="span4" style="display:flex;gap:22px;flex-wrap:wrap;padding-top:4px">
        <label class="check"><input type="checkbox" name="customerApprovalRequired" ${c.customerApprovalRequired ? 'checked' : ''}/> Customer approval required</label>
        <label class="check"><input type="checkbox" name="productionImpact" ${c.productionImpact ? 'checked' : ''}/> Impacts production schedule / deliveries</label>
        <label class="check"><input type="checkbox" name="supplierDependency" ${c.supplierDependency ? 'checked' : ''}/> Dependent on supplier input</label>
      </div>
      ${isNew ? '<p class="muted span4" style="margin:0;font-size:12px">New records enter the lifecycle at stage 2 (ECR Submitted). Standard approvals (Design, Quality, CM, Program Mgmt, Customer) are pre-assigned; adjust in the Approvals tab.</p>' : ''}
    </div>`;
  };
  E.chg.formProgram = (el) => {
    const p = C.programByName(el.value);
    const root = U.$('#ec-form');
    if (p && root) {
      root.querySelector('[name=customer]').value = p.customer;
      const pm = { F2KEX: 'V. Morgan', ASC: 'W. Chen', LAT: 'W. Chen', G700: 'J. Harlow', '737': 'J. Harlow', KC46: 'V. Morgan' }[p.key];
      const sel = root.querySelector('[name=programManager]');
      if (sel && pm && S.workspace !== 'local') sel.value = pm;
    }
  };
  E.act.newChange = () => {
    const c = S.blankChange();
    const p = E.filters.program ? C.programByName(E.filters.program) : null;
    if (p) {
      c.program = p.name;
      c.customer = p.customer;
    }
    if (S.workspace !== 'local') c.programManager = { 'Falcon 2000EX Nacelle': 'V. Morgan', 'Citation Ascend Thrust Reverser': 'W. Chen', 'Citation Latitude Thrust Reverser': 'W. Chen', 'G700 Interior Structures': 'J. Harlow', '737 MAX Composite Fairings': 'J. Harlow', 'KC-46 Ducting & Brackets': 'V. Morgan' }[c.program];
    UI.dialog({
      title: 'New Engineering Change',
      size: 'narrow',
      body: R.form(c, true),
      foot: `<button class="btn" data-action="closeDialog">Cancel</button><button class="btn primary" data-action="saveNew">${UI.icon('plus')} Create Change</button>`,
    });
    R._draft = c;
  };
  function applyForm(c, f) {
    ['type', 'title', 'description', 'program', 'customer', 'partNumber', 'partName', 'currentRev', 'proposedRev', 'originator', 'engineer', 'programManager', 'priority', 'risk', 'dateSubmitted', 'requiredDate', 'forecastDate', 'customerApproval', 'implementationStatus', 'customerApprovalRequired', 'productionImpact', 'supplierDependency'].forEach((k) => {
      if (k in f) c[k] = typeof f[k] === 'string' ? f[k].trim() : f[k];
    });
    if (f.number && f.number.trim()) c.number = f.number.trim();
    c.actualDate = f.actualDate || null;
    c.milestone = f.msName && f.msDate ? { name: f.msName.trim(), date: f.msDate } : null;
    if (!c.customerApprovalRequired) {
      c.customerApproval = 'Not Required';
      const ca = c.approvals.find((a) => a.dept === 'customer');
      if (ca) {
        ca.required = false;
        ca.status = 'N/A';
      }
    } else {
      const ca = c.approvals.find((a) => a.dept === 'customer');
      if (ca && !ca.required) {
        ca.required = true;
        ca.status = 'Not Started';
      }
      if (c.customerApproval === 'Not Required') c.customerApproval = 'Not Submitted';
    }
  }
  function validate(f) {
    if (!f.title.trim()) return 'Change title is required.';
    if (!f.partNumber.trim()) return 'Part number is required.';
    if (f.requiredDate && f.dateSubmitted && f.requiredDate < f.dateSubmitted) return 'Required date cannot be before submitted date.';
    return null;
  }
  E.act.saveNew = () => {
    const f = UI.readForm(U.$('#ec-form'));
    const err = validate(f);
    if (err) return UI.toast(err, true);
    const c = R._draft;
    applyForm(c, f);
    c.status = f.status;
    if (c.status === 'Identified') {
      c.stage = 0;
      c.stageLog = [{ stage: 0, entered: c.dateSubmitted }];
    }
    c.stageLog.forEach((s) => (s.entered = c.dateSubmitted));
    c.approvals.forEach((a) => {
      if (a.required) a.reviewer = K.defaultReviewer(c, a.dept);
    });
    S.create(c);
    UI.closeDialog();
    UI.toast(`Created <b>${U.esc(c.number)}</b>`);
    R.open(c.id, 'overview');
  };
  E.act.editChange = (el) => {
    const c = S.get(el.dataset.id);
    UI.dialog({
      title: `Edit ${U.esc(c.number)}`,
      size: 'narrow',
      body: R.form(c, false),
      foot: `<button class="btn" data-action="closeDialog">Cancel</button><button class="btn primary" data-action="saveEdit" data-id="${c.id}">${UI.icon('check')} Save Changes</button>`,
    });
  };
  E.act.saveEdit = (el) => {
    const f = UI.readForm(U.$('#ec-form'));
    const err = validate(f);
    if (err) return UI.toast(err, true);
    const c = S.get(el.dataset.id);
    const before = U.clone(c);
    applyForm(c, f);
    const changed = [];
    const labels = { title: 'Title', description: 'Description', type: 'Type', program: 'Program', customer: 'Customer', partNumber: 'Part number', partName: 'Component', currentRev: 'Current rev', proposedRev: 'Proposed rev', originator: 'Originator', engineer: 'Responsible engineer', programManager: 'Program manager', priority: 'Priority', risk: 'Risk', dateSubmitted: 'Submitted', requiredDate: 'Required date', forecastDate: 'Forecast date', actualDate: 'Actual date', customerApproval: 'Customer approval', implementationStatus: 'Implementation', number: 'Number', productionImpact: 'Production impact', supplierDependency: 'Supplier dependency', customerApprovalRequired: 'Customer approval required' };
    Object.keys(labels).forEach((k) => {
      if (JSON.stringify(before[k]) !== JSON.stringify(c[k])) changed.push(k === 'description' ? 'Description updated' : `${labels[k]}: ${before[k] ?? '—'} → ${c[k] ?? '—'}`);
    });
    if (JSON.stringify(before.milestone) !== JSON.stringify(c.milestone)) changed.push(`Milestone: ${c.milestone ? c.milestone.name + ' ' + c.milestone.date : 'removed'}`);
    UI.closeDialog();
    if (f.status !== c.status) S.setStatus(c.id, f.status);
    if (changed.length) {
      S.log(c, 'Record Edited', changed.join('; '));
      S.save();
      S.emit();
      UI.toast('Changes saved');
    } else if (f.status === before.status) UI.toast('No changes to save');
  };

  E.act.exportAudit = (el) => {
    const c = S.get(el.dataset.id);
    E.Export.csv(`${c.number}_audit_trail.csv`, ['Timestamp', 'User', 'Action', 'Detail'], c.history.map((h) => [h.ts, h.user, h.action, h.detail]));
  };

  E.store.onChange(reRender);
})(window.ECM);
