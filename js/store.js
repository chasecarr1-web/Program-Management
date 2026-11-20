/* State, persistence, derived calculations, filtering and audited mutations */
(function (E) {
  const { U, C } = E;

  const S = (E.store = {
    changes: [],
    meta: { user: 'V. Morgan', createdAt: null, version: C.APP_VERSION },
    listeners: [],
  });

  /* ---------------- Persistence & workspaces ---------------- */
  // Workspaces keep datasets separate: 'demo' (fictional sample data shipped with the app)
  // and 'local' (records from data/*.local.js — never committed to source control).
  S.storageOk = true;
  S.workspaces = () => {
    const w = [{ key: 'demo', name: 'Demo (sample data)' }];
    if (E.LOCAL_WORKSPACE) w.unshift({ key: 'local', name: E.LOCAL_WORKSPACE.name });
    return w;
  };
  const wsKey = () => `${C.STORAGE_KEY}.${S.workspace}`;
  const seedFor = (ws) => (ws === 'local' && E.LOCAL_WORKSPACE ? E.LOCAL_WORKSPACE.build() : E.generateSeed());
  S.load = function () {
    let ws = null;
    try {
      ws = localStorage.getItem(C.STORAGE_KEY + '.workspace');
    } catch (e) {}
    if (!S.workspaces().some((w) => w.key === ws)) ws = S.workspaces()[0].key;
    S.workspace = ws;
    let data = null;
    try {
      const raw = localStorage.getItem(wsKey());
      if (raw) data = JSON.parse(raw);
    } catch (e) {
      S.storageOk = false;
    }
    if (data && Array.isArray(data.changes)) {
      S.changes = data.changes;
      S.meta = Object.assign(S.meta, data.meta || {});
      // pick up records added to the local data file since this browser last loaded it
      if (ws === 'local' && E.LOCAL_WORKSPACE) {
        const have = new Set(S.changes.map((c) => c.number));
        E.LOCAL_WORKSPACE.build().forEach((c) => {
          if (!have.has(c.number)) S.changes.push(c);
        });
      }
    } else {
      S.changes = seedFor(ws);
      S.meta.createdAt = new Date().toISOString();
      if (ws === 'local' && E.LOCAL_WORKSPACE) S.meta.user = E.LOCAL_WORKSPACE.user || 'Local User';
    }
    S.save();
  };
  S.save = function () {
    try {
      localStorage.setItem(wsKey(), JSON.stringify({ changes: S.changes, meta: S.meta }));
      localStorage.setItem(C.STORAGE_KEY + '.workspace', S.workspace);
      S.storageOk = true;
    } catch (e) {
      S.storageOk = false;
    }
  };
  S.switchWorkspace = function (ws) {
    S.workspace = ws;
    try {
      localStorage.setItem(C.STORAGE_KEY + '.workspace', ws);
    } catch (e) {}
    S.load();
    S.emit();
  };
  S.reset = function () {
    S.changes = seedFor(S.workspace);
    S.meta.createdAt = new Date().toISOString();
    S.save();
    S.emit();
  };
  S.importJSON = function (obj) {
    if (!obj || !Array.isArray(obj.changes)) throw new Error('File does not contain a changes array.');
    S.changes = obj.changes;
    S.meta = Object.assign(S.meta, obj.meta || {});
    S.save();
    S.emit();
  };
  S.onChange = (fn) => S.listeners.push(fn);
  S.emit = () => S.listeners.forEach((fn) => fn());

  S.get = (id) => S.changes.find((c) => c.id === id);
  /** People known to the current workspace (demo directory only in the demo workspace) */
  S.people = () => {
    const names = S.changes.flatMap((c) => [c.originator, c.engineer, c.programManager, c.stageOwner, ...c.approvals.map((a) => a.reviewer), ...c.actions.map((a) => a.owner), ...c.risks.map((r) => r.owner)]);
    return U.uniq([...(S.workspace === 'demo' ? C.ALL_PEOPLE : []), ...names, S.meta.user]).sort();
  };
  S.user = () => S.meta.user || 'Unknown User';

  /* ---------------- Audited mutations ---------------- */
  S.log = function (c, action, detail, extra) {
    c.history.push({ id: U.uid('h'), ts: new Date().toISOString(), user: S.user(), action, detail, ...(extra || {}) });
  };
  /** Apply fn to change and record an audit entry. fn may return false to cancel. */
  S.mutate = function (id, fn, action, detail, extra) {
    const c = S.get(id);
    if (!c) return;
    const r = fn(c);
    if (r === false) return;
    if (action) S.log(c, action, typeof detail === 'function' ? detail(c) : detail, extra);
    S.save();
    S.emit();
    return c;
  };

  S.nextNumber = function (type) {
    const y = new Date().getFullYear();
    const prefix = { ECR: 'ECR', ECO: 'ECO', ECN: 'ECN', Deviation: 'DEV', Waiver: 'WVR' }[type] || 'ECR';
    let max = 100;
    S.changes.forEach((c) => {
      const m = /^[A-Z]+-(\d{4})-(\d+)$/.exec(c.number || '');
      if (m && Number(m[1]) === y) max = Math.max(max, Number(m[2]));
    });
    return `${prefix}-${y}-${String(max + 1).padStart(4, '0')}`;
  };

  S.blankChange = function () {
    const today = U.today();
    const c = {
      id: U.uid('ec'),
      number: '',
      title: '',
      description: '',
      type: 'ECR',
      program: C.PROGRAMS[0].name,
      customer: C.PROGRAMS[0].customer,
      partNumber: '',
      partName: '',
      currentRev: '',
      proposedRev: '',
      originator: S.user(),
      engineer: '',
      programManager: '',
      priority: 'Medium',
      risk: 'Medium',
      stage: 1,
      status: 'ECR Submitted',
      dateSubmitted: today,
      requiredDate: U.addDays(today, 60),
      forecastDate: U.addDays(today, 60),
      actualDate: null,
      customerApprovalRequired: true,
      customerApproval: 'Not Submitted',
      implementationStatus: 'Not Started',
      productionImpact: false,
      supplierDependency: false,
      escalated: false,
      escalationNote: '',
      milestone: null,
      stageLog: [
        { stage: 0, entered: today },
        { stage: 1, entered: today },
      ],
      stageOwner: '',
      stageDue: U.addDays(today, C.STAGES[1].days),
      approvals: C.DEPTS.map((d) => ({
        dept: d.key,
        required: ['design', 'quality', 'cm', 'pm', 'customer'].includes(d.key),
        reviewer: '',
        assigned: null,
        completed: null,
        status: ['design', 'quality', 'cm', 'pm', 'customer'].includes(d.key) ? 'Not Started' : 'N/A',
        comments: '',
        actions: '',
        target: d.target,
      })),
      impact: Object.fromEntries(C.IMPACTS.map((i) => [i.key, { level: 'TBD', notes: '' }])),
      technical: {
        justification: '',
        evidence: '',
        riskAssessment: '',
        validationPlan: '',
        validations: [],
        weightDelta: 0,
        classification: 'Minor',
        assessmentComplete: false,
        assessedBy: '',
        assessedDate: '',
        testingResolved: false,
      },
      financial: {
        laborHoursEst: 0,
        laborHoursAct: 0,
        laborRate: C.LABOR_RATE,
        materialEst: 0,
        materialAct: 0,
        toolingEst: 0,
        toolingAct: 0,
        supplierEst: 0,
        supplierAct: 0,
        testingEst: 0,
        testingAct: 0,
        recurringDelta: 0,
        annualQty: 0,
        funding: 'Internally Funded',
        scheduleImpactDays: 0,
        productionImpact: '',
        contractualImpact: '',
        costRecovery: 0,
        recoveryStatus: 'N/A',
      },
      risks: [],
      config: {
        serialApplicability: '',
        effectivity: '',
        baseline: C.PROGRAMS[0].baseline,
        drawingRev: '',
        specRev: '',
        bomChanges: [],
        supplierChanges: 'None',
        swHwRev: 'N/A',
        customerDocs: 'Pending submittal',
        verificationEvidence: 'Not started',
        faiRequired: false,
        faiStatus: 'N/A',
        asDesigned: '',
        asBuilt: '',
        revHistory: [],
      },
      actions: [],
      comments: [],
      history: [],
    };
    return c;
  };

  S.create = function (c) {
    c.number = c.number || S.nextNumber(c.type);
    if (!c.stageOwner) c.stageOwner = E.calc.defaultStageOwner(c, c.stage);
    c.config.asDesigned = c.config.asDesigned || c.currentRev;
    c.config.asBuilt = c.config.asBuilt || c.currentRev;
    c.config.drawingRev = c.config.drawingRev || (c.partNumber ? `${c.partNumber} Rev ${c.currentRev} → ${c.proposedRev}` : '');
    const p = C.programByName(c.program);
    if (p) c.config.baseline = p.baseline;
    S.changes.unshift(c);
    S.log(c, 'Created', `${c.type} created: ${c.title}`, { field: 'status', to: c.status });
    S.save();
    S.emit();
    return c;
  };

  S.remove = function (id) {
    S.changes = S.changes.filter((c) => c.id !== id);
    S.save();
    S.emit();
  };

  /** Move a change to a lifecycle stage, logging the transition and updating dependent fields */
  S.setStage = function (id, stage, note) {
    const c = S.get(id);
    if (!c) return;
    {
      {
        stage = Math.max(0, Math.min(12, stage));
        if (stage === c.stage) return;
        const today = U.today();
        const from = c.stage;
        c.stageLog = (c.stageLog || []).filter((s) => s.stage < stage || s.stage <= from).filter((s) => s.stage <= stage);
        if (!c.stageLog.find((s) => s.stage === stage)) c.stageLog.push({ stage, entered: today });
        else c.stageLog.find((s) => s.stage === stage).entered = today;
        c.stage = stage;
        const def = C.STAGES[stage];
        if (!['On Hold'].includes(c.status) || stage === 12) c.status = def.status;
        c.stageOwner = E.calc.defaultStageOwner(c, stage);
        c.stageDue = stage === 12 ? null : U.addDays(today, def.days);
        c.implementationStatus = stage < 7 ? 'Not Started' : stage < 9 ? 'Planning' : stage < 11 ? 'In Progress' : 'Complete';
        if (stage >= 4) {
          c.approvals.forEach((a) => {
            if (a.dept !== 'customer' && a.required && a.status === 'Not Started') {
              a.status = 'Pending';
              a.assigned = today;
              a.reviewer = a.reviewer || E.calc.defaultReviewer(c, a.dept);
            }
          });
        }
        if (stage >= 6 && c.customerApprovalRequired) {
          const ca = c.approvals.find((a) => a.dept === 'customer');
          if (ca && ca.status === 'Not Started') {
            ca.status = 'Pending';
            ca.assigned = today;
            ca.reviewer = ca.reviewer || (C.programByName(c.program) || {}).custRep || 'Customer';
          }
          if (c.customerApproval === 'Not Submitted') c.customerApproval = 'Submitted';
        }
        if (stage >= 7) c.config.asDesigned = c.proposedRev || c.config.asDesigned;
        if (stage >= 11) c.config.asBuilt = c.proposedRev || c.config.asBuilt;
        if (stage === 11 && c.proposedRev && !(c.config.revHistory || []).some((r) => r.change === c.number)) {
          c.config.revHistory = c.config.revHistory || [];
          c.config.revHistory.push({ rev: c.proposedRev, date: today, change: c.number, description: c.title, by: S.user() });
        }
        if (stage === 12) {
          c.actualDate = today;
          c.forecastDate = today;
        } else if (from === 12) {
          c.actualDate = null;
        }
        S.log(c, stage > from ? 'Stage Advanced' : 'Stage Reverted', `${C.STAGES[from].name} → ${def.name}${note ? ' — ' + note : ''}`, { field: 'status', to: c.status, stage });
      }
    }
    S.save();
    S.emit();
    return c;
  };

  S.setStatus = function (id, status) {
    const c = S.get(id);
    if (!c || c.status === status) return;
    const from = c.status;
    c.status = status;
    if (status === 'Closed') {
      c.actualDate = c.actualDate || U.today();
      if (c.stage !== 12) {
        c.stageLog.push({ stage: 12, entered: U.today() });
        c.stage = 12;
        c.stageDue = null;
      }
    }
    if (status === 'Rejected') {
      c.actualDate = c.actualDate || U.today();
      c.stageDue = null;
    }
    if (!C.CLOSED_STATUSES.includes(status) && C.CLOSED_STATUSES.includes(from)) c.actualDate = null;
    S.log(c, 'Status Changed', `${from} → ${status}`, { field: 'status', from, to: status });
    S.save();
    S.emit();
  };

  /* ---------------- Calculations ---------------- */
  const K = (E.calc = {});

  K.defaultReviewer = (c, dept) => {
    if (S.workspace === 'local') return dept === 'pm' ? c.programManager || '' : '';
    if (dept === 'pm') return c.programManager;
    if (dept === 'customer') return (C.programByName(c.program) || {}).custRep || 'Customer';
    const list = C.PEOPLE[dept] || [];
    return list[(c.number || '').length % Math.max(1, list.length)] || '';
  };
  K.defaultStageOwner = (c, stage) => {
    if (stage >= 12) return '';
    const role = C.STAGES[stage].owner;
    if (S.workspace === 'local') return role === 'originator' ? c.originator : role === 'pm' ? c.programManager || '' : c.engineer || '';
    if (role === 'originator') return c.originator;
    if (role === 'engineer') return c.engineer || '';
    if (role === 'pm') return c.programManager || '';
    const list = C.PEOPLE[role] || [];
    return list[(c.number || c.id || '').length % Math.max(1, list.length)] || '';
  };

  K.isOpen = (c) => !C.CLOSED_STATUSES.includes(c.status);
  K.isComplete = (c) => !K.isOpen(c) || c.status === 'Implemented';
  K.daysOpen = (c) => U.diff(c.actualDate || U.today(), c.dateSubmitted);
  K.cycleTime = (c) => (c.actualDate ? U.diff(c.actualDate, c.dateSubmitted) : null);
  K.daysLate = (c) => {
    const ref = c.actualDate || U.today();
    return Math.max(0, U.diff(ref, c.requiredDate));
  };
  K.slip = (c) => (c.forecastDate && c.requiredDate ? U.diff(c.forecastDate, c.requiredDate) : 0);

  /** Schedule status: Complete | Late Close | Overdue | At Risk | On Track */
  K.schedule = (c) => {
    const today = U.today();
    if (c.status === 'Rejected') return 'Rejected';
    if (c.status === 'Closed') return c.actualDate && c.actualDate <= c.requiredDate ? 'Closed On Time' : 'Closed Late';
    if (c.requiredDate < today) return 'Overdue';
    if (K.slip(c) > 0) return 'At Risk';
    if (U.diff(c.requiredDate, today) <= 14 && c.stage < 10) return 'At Risk';
    return 'On Track';
  };
  K.schedClass = (s) =>
    ({ Overdue: 'red', 'At Risk': 'yellow', 'On Track': 'blue', 'Closed On Time': 'green', 'Closed Late': 'gray', Rejected: 'gray' }[s] || 'gray');

  K.stageDaysRemaining = (c) => (c.stageDue ? U.diff(c.stageDue, U.today()) : null);

  K.approvalAge = (a) => (a.assigned ? U.diff(a.completed || U.today(), a.assigned) : null);
  K.approvalOverdue = (a) => a.status === 'Pending' && a.assigned && U.diff(U.today(), a.assigned) > (a.target || 7);
  K.approvalState = (a) => {
    if (!a.required || a.status === 'N/A') return 'na';
    if (a.status === 'Rejected') return 'rejected';
    if (a.status === 'Approved' || a.status === 'Approved w/ Comments') return 'approved';
    if (a.status === 'Pending') return K.approvalOverdue(a) ? 'overdue' : 'pending';
    return 'notstarted';
  };

  K.costs = (c) => {
    const f = c.financial || {};
    const rate = f.laborRate || C.LABOR_RATE;
    const laborEst = (f.laborHoursEst || 0) * rate;
    const laborAct = (f.laborHoursAct || 0) * rate;
    const est = laborEst + (f.materialEst || 0) + (f.toolingEst || 0) + (f.supplierEst || 0) + (f.testingEst || 0);
    const act = laborAct + (f.materialAct || 0) + (f.toolingAct || 0) + (f.supplierAct || 0) + (f.testingAct || 0);
    return {
      laborEst,
      laborAct,
      est,
      act,
      variance: act - est,
      recurringAnnual: (f.recurringDelta || 0) * (f.annualQty || 0),
      recovery: f.costRecovery || 0,
      exposure: Math.max(0, est - (f.costRecovery || 0)) + Math.max(0, (f.recurringDelta || 0) * (f.annualQty || 0)),
    };
  };

  /** Automatic risk / escalation flags */
  K.FLAG_DEFS = [
    { key: 'pastDue', label: 'Past due', sev: 'red', desc: 'Required completion date has passed' },
    { key: 'noOwner', label: 'No assigned owner', sev: 'red', desc: 'No responsible engineer assigned' },
    { key: 'approvalOverdue', label: 'Approval beyond target', sev: 'red', desc: 'One or more reviews pending beyond target days' },
    { key: 'production', label: 'Impacts production schedule', sev: 'yellow', desc: 'Change affects production cut-in or deliveries and is at risk' },
    { key: 'noTIA', label: 'Technical assessment incomplete', sev: 'yellow', desc: 'Past impact assessment stage without a completed TIA' },
    { key: 'testing', label: 'Unresolved testing', sev: 'yellow', desc: 'ECO released with open test / qualification requirements' },
    { key: 'custMissing', label: 'Missing customer approval', sev: 'red', desc: 'Customer approval required but not yet granted at or past customer review' },
    { key: 'milestone', label: 'Approaching contractual milestone', sev: 'yellow', desc: 'Linked contractual milestone within 30 days' },
  ];
  K.flags = (c) => {
    if (!K.isOpen(c)) return [];
    const today = U.today();
    const f = [];
    if (c.requiredDate < today && c.status !== 'Implemented') f.push('pastDue');
    if (!c.engineer) f.push('noOwner');
    if (c.approvals.some(K.approvalOverdue)) f.push('approvalOverdue');
    if (c.productionImpact && c.stage < 11 && ['Overdue', 'At Risk'].includes(K.schedule(c))) f.push('production');
    if (c.stage >= 4 && !(c.technical || {}).assessmentComplete) f.push('noTIA');
    const tl = ((c.impact || {}).testing || {}).level;
    const ql = ((c.impact || {}).qualification || {}).level;
    if (c.stage >= 7 && c.stage < 11 && !(c.technical || {}).testingResolved && [tl, ql].some((l) => l === 'Moderate' || l === 'Major')) f.push('testing');
    if (c.customerApprovalRequired && c.stage >= 6 && c.customerApproval !== 'Approved') f.push('custMissing');
    if (c.milestone && c.milestone.date && U.diff(c.milestone.date, today) <= 30 && U.diff(c.milestone.date, today) >= -7 && c.stage < 11) f.push('milestone');
    return f;
  };

  const PW = { Critical: 40, High: 25, Medium: 10, Low: 0 };
  const RW = { Critical: 30, High: 20, Medium: 8, Low: 0 };
  K.score = (c) => {
    if (!K.isOpen(c)) return 0;
    let s = (PW[c.priority] || 0) + (RW[c.risk] || 0);
    s += Math.min(30, K.daysLate(c));
    s += Math.min(20, Math.max(0, K.slip(c)));
    if (c.productionImpact) s += 15;
    if (c.escalated) s += 15;
    const fl = K.flags(c);
    s += fl.length * 4;
    if (fl.includes('milestone')) s += 8;
    s += c.approvals.filter(K.approvalOverdue).length * 5;
    return Math.round(s);
  };
  K.needsLeadership = (c) =>
    K.isOpen(c) &&
    c.status !== 'Implemented' &&
    (c.escalated ||
      K.daysLate(c) > 7 ||
      (c.priority === 'Critical' && ['Overdue', 'At Risk'].includes(K.schedule(c))) ||
      (c.productionImpact && K.daysLate(c) > 0) ||
      c.approvals.filter(K.approvalOverdue).length >= 2);

  /** What is preventing closure — primary blocker text */
  K.blocker = (c) => {
    if (!K.isOpen(c)) return '';
    if (c.status === 'On Hold') return 'On hold — decision required';
    if (!c.engineer) return 'No responsible engineer assigned';
    const od = c.approvals.filter(K.approvalOverdue);
    if (od.length) return `Overdue approval: ${od.map((a) => C.DEPTS.find((d) => d.key === a.dept).short).join(', ')}`;
    if (c.status === 'Awaiting Customer' || (c.stage === 6 && c.customerApproval !== 'Approved')) return `Awaiting ${c.customer} decision`;
    if (c.status === 'Awaiting Supplier') return 'Awaiting supplier input';
    if (c.stage >= 4 && !c.technical.assessmentComplete) return 'Technical impact assessment incomplete';
    const pend = c.approvals.filter((a) => a.status === 'Pending');
    if (pend.length) return `Pending approval: ${pend.map((a) => C.DEPTS.find((d) => d.key === a.dept).short).join(', ')}`;
    const openVal = (c.technical.validations || []).filter((v) => v.status !== 'Complete');
    if (c.stage >= 9 && openVal.length) return `Open verification: ${openVal[0].activity}`;
    const oa = c.actions.filter((a) => a.status === 'Open');
    if (oa.length) return `Open action: ${oa[0].text}`;
    return C.STAGE_ACTIONS[c.stage];
  };

  K.nextStep = (c) => (K.isOpen(c) ? C.STAGE_ACTIONS[c.stage] : '—');

  /** Status of a change as of a past date, replaying the audit history */
  K.statusAt = (c, date) => {
    if (c.dateSubmitted > date && (c.stageLog[0] || {}).entered > date) return null;
    let st = null;
    for (const h of c.history) {
      if (h.field === 'status' && String(h.ts).slice(0, 10) <= date) st = h.to;
    }
    return st;
  };
  K.openAt = (c, date) => {
    const s = c.dateSubmitted <= date;
    const closed = c.actualDate && c.actualDate <= date && !(c.status === 'Implemented');
    return s && !closed;
  };
  K.pastDueAt = (c, date) => K.openAt(c, date) && c.requiredDate < date && c.status !== 'Implemented';

  /* ---------------- Global filters ---------------- */
  E.filters = { search: '', customer: '', program: '', part: '', owner: '', type: '', from: '', to: '', status: '', priority: '', risk: '', schedule: '', flag: '', stage: '', openOnly: '' };
  E.resetFilters = () => Object.keys(E.filters).forEach((k) => (E.filters[k] = ''));

  E.applyFilters = function (list, f = E.filters, opts = {}) {
    const q = (f.search || '').trim().toLowerCase();
    return list.filter((c) => {
      if (f.customer && c.customer !== f.customer) return false;
      if (f.program && c.program !== f.program) return false;
      if (f.part && !(c.partNumber || '').toLowerCase().includes(f.part.toLowerCase())) return false;
      if (f.owner && ![c.engineer, c.programManager, c.stageOwner, c.originator].includes(f.owner)) return false;
      if (f.type && c.type !== f.type) return false;
      if (f.from && c.dateSubmitted < f.from) return false;
      if (f.to && c.dateSubmitted > f.to) return false;
      if (opts.ignoreLocal) return true;
      if (f.status && c.status !== f.status) return false;
      if (f.priority && c.priority !== f.priority) return false;
      if (f.risk && c.risk !== f.risk) return false;
      if (f.schedule && K.schedule(c) !== f.schedule) return false;
      if (f.flag && !K.flags(c).includes(f.flag)) return false;
      if (f.stage !== '' && f.stage != null && String(c.stage) !== String(f.stage)) return false;
      if (f.openOnly === 'open' && !K.isOpen(c)) return false;
      if (f.openOnly === 'closed' && K.isOpen(c)) return false;
      if (q) {
        const hay = [c.number, c.title, c.description, c.partNumber, c.partName, c.program, c.customer, c.engineer, c.originator, c.programManager, c.status, c.type]
          .join(' ')
          .toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  };
  /** Changes filtered only by the global dimension filters (customer/program/part/owner/type/date) */
  E.scoped = () => E.applyFilters(S.changes, E.filters, { ignoreLocal: true });
})(window.ECM);
