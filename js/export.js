/* Exports: CSV, Excel (SpreadsheetML), JSON backup, program status report */
(function (E) {
  const { U, C, UI } = E;
  const K = E.calc;
  const S = E.store;
  const X = (E.Export = {});

  X.REGISTER_COLS = [
    ['Engineering Change Number', (c) => c.number],
    ['Change Title', (c) => c.title],
    ['Change Description', (c) => c.description],
    ['Change Type', (c) => c.type],
    ['Aircraft Program / Platform', (c) => c.program],
    ['Customer (OEM)', (c) => c.customer],
    ['Part Number', (c) => c.partNumber],
    ['Component', (c) => c.partName],
    ['Current Revision', (c) => c.currentRev],
    ['Proposed Revision', (c) => c.proposedRev],
    ['Originator', (c) => c.originator],
    ['Responsible Engineer', (c) => c.engineer || 'UNASSIGNED'],
    ['Program Manager', (c) => c.programManager],
    ['Priority', (c) => c.priority],
    ['Risk Level', (c) => c.risk],
    ['Current Status', (c) => c.status],
    ['Lifecycle Stage', (c) => `${c.stage + 1}. ${C.STAGES[c.stage].name}`],
    ['Stage Owner', (c) => c.stageOwner],
    ['Date Submitted', (c) => c.dateSubmitted],
    ['Required Completion Date', (c) => c.requiredDate],
    ['Forecast Completion Date', (c) => c.forecastDate],
    ['Actual Completion Date', (c) => c.actualDate || ''],
    ['Days Open', (c) => K.daysOpen(c)],
    ['Schedule Status', (c) => K.schedule(c)],
    ['Customer Approval Status', (c) => c.customerApproval],
    ['Implementation Status', (c) => c.implementationStatus],
    ['Primary Blocker', (c) => K.blocker(c)],
    ['Flags', (c) => K.flags(c).map((k) => K.FLAG_DEFS.find((f) => f.key === k).label).join('; ')],
    ['Est. NRE ($)', (c) => Math.round(K.costs(c).est)],
    ['Actual Cost ($)', (c) => Math.round(K.costs(c).act)],
    ['Recurring Delta ($/shipset)', (c) => c.financial.recurringDelta],
    ['Funding', (c) => c.financial.funding],
    ['Production Impact', (c) => (c.productionImpact ? 'Yes' : 'No')],
    ['Escalated', (c) => (c.escalated ? 'Yes' : 'No')],
  ];

  const csvCell = (v) => {
    const s = v == null ? '' : String(v);
    return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  X.csv = (filename, headers, rows) => {
    const body = [headers, ...rows].map((r) => r.map(csvCell).join(',')).join('\r\n');
    U.download(filename, '﻿' + body, 'text/csv;charset=utf-8');
  };

  const xmlEsc = (s) => String(s == null ? '' : s).replace(/[<>&"]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' }[c]));
  /** Multi-sheet Excel workbook (SpreadsheetML 2003; opens natively in Excel) */
  X.excel = (filename, sheets) => {
    const cell = (v) => {
      if (typeof v === 'number' && isFinite(v)) return `<Cell><Data ss:Type="Number">${v}</Data></Cell>`;
      return `<Cell><Data ss:Type="String">${xmlEsc(v)}</Data></Cell>`;
    };
    const ws = sheets
      .map(
        (sh) => `<Worksheet ss:Name="${xmlEsc(sh.name).slice(0, 31)}"><Table>
${sh.headers.map(() => '<Column ss:AutoFitWidth="1" ss:Width="120"/>').join('')}
<Row ss:StyleID="h">${sh.headers.map((h) => `<Cell><Data ss:Type="String">${xmlEsc(h)}</Data></Cell>`).join('')}</Row>
${sh.rows.map((r) => `<Row>${r.map(cell).join('')}</Row>`).join('\n')}
</Table><WorksheetOptions xmlns="urn:schemas-microsoft-com:office:excel"><FreezePanes/><FrozenNoSplit/><SplitHorizontal>1</SplitHorizontal><TopRowBottomPane>1</TopRowBottomPane></WorksheetOptions></Worksheet>`
      )
      .join('\n');
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
<Styles><Style ss:ID="h"><Font ss:Bold="1" ss:Color="#FFFFFF"/><Interior ss:Color="#1B3A6B" ss:Pattern="Solid"/></Style></Styles>
${ws}
</Workbook>`;
    U.download(filename, xml, 'application/vnd.ms-excel');
  };

  X.registerCSV = (list) => {
    X.csv(`ECM_Change_Register_${U.today()}.csv`, X.REGISTER_COLS.map((c) => c[0]), list.map((c) => X.REGISTER_COLS.map((col) => col[1](c))));
    UI.toast(`Exported ${list.length} changes to CSV`);
  };
  X.registerExcel = (list) => {
    const approvals = [];
    const actions = [];
    const risks = [];
    const config = [];
    list.forEach((c) => {
      c.approvals.filter((a) => a.required).forEach((a) =>
        approvals.push([c.number, C.DEPTS.find((d) => d.key === a.dept).name, a.reviewer, a.assigned || '', a.completed || '', K.approvalOverdue(a) ? 'Overdue' : a.status, K.approvalAge(a) ?? '', a.target, a.comments, a.actions])
      );
      c.actions.forEach((a) => actions.push([c.number, a.text, a.owner, a.due || '', a.status, a.status === 'Open' && a.due < U.today() ? 'Yes' : 'No']));
      c.risks.forEach((r) => risks.push([c.number, r.category, r.rating, r.description, r.mitigation, r.owner, r.status]));
      const g = c.config;
      config.push([c.number, c.partNumber, g.serialApplicability, g.effectivity, g.baseline, g.drawingRev, g.specRev, g.swHwRev, g.supplierChanges, g.customerDocs, g.verificationEvidence, g.faiRequired ? 'Yes' : 'No', g.faiStatus, g.asDesigned, g.asBuilt]);
    });
    const fin = list.map((c) => {
      const k = K.costs(c);
      const f = c.financial;
      return [c.number, c.program, f.laborHoursEst, f.laborHoursAct, Math.round(k.laborEst), Math.round(k.laborAct), f.materialEst, f.materialAct, f.toolingEst, f.toolingAct, f.supplierEst, f.supplierAct, f.testingEst, f.testingAct, Math.round(k.est), Math.round(k.act), Math.round(k.variance), f.recurringDelta, f.annualQty, f.funding, f.scheduleImpactDays, f.costRecovery, f.recoveryStatus];
    });
    X.excel(`ECM_Change_Register_${U.today()}.xls`, [
      { name: 'Change Register', headers: X.REGISTER_COLS.map((c) => c[0]), rows: list.map((c) => X.REGISTER_COLS.map((col) => col[1](c))) },
      { name: 'Approvals', headers: ['Change', 'Function', 'Reviewer', 'Assigned', 'Completed', 'Status', 'Age (days)', 'Target (days)', 'Comments', 'Outstanding Actions'], rows: approvals },
      { name: 'Financial', headers: ['Change', 'Program', 'Labor Hrs Est', 'Labor Hrs Act', 'Labor $ Est', 'Labor $ Act', 'Material Est', 'Material Act', 'Tooling Est', 'Tooling Act', 'Supplier Est', 'Supplier Act', 'Testing Est', 'Testing Act', 'Total Est', 'Total Act', 'Variance', 'Recurring Δ/shipset', 'Annual Qty', 'Funding', 'Schedule Impact (d)', 'Cost Recovery', 'Recovery Status'], rows: fin },
      { name: 'Action Items', headers: ['Change', 'Action', 'Owner', 'Due', 'Status', 'Overdue'], rows: actions },
      { name: 'Risk Register', headers: ['Change', 'Category', 'Rating', 'Description', 'Mitigation', 'Owner', 'Status'], rows: risks },
      { name: 'Configuration', headers: ['Change', 'Part Number', 'Serial Applicability', 'Effectivity', 'Baseline', 'Drawing Rev', 'Spec Rev', 'SW/HW Rev', 'Supplier Changes', 'Customer Docs', 'Verification Evidence', 'FAI Required', 'FAI Status', 'As-Designed', 'As-Built'], rows: config },
    ]);
    UI.toast(`Exported ${list.length} changes to Excel (6 worksheets)`);
  };

  X.backup = () => {
    U.download(`ECM_backup_${U.today()}.json`, JSON.stringify({ changes: S.changes, meta: S.meta, exportedAt: new Date().toISOString() }, null, 2), 'application/json');
    UI.toast('Backup downloaded');
  };
  X.restore = () => {
    const inp = document.createElement('input');
    inp.type = 'file';
    inp.accept = '.json,application/json';
    inp.onchange = () => {
      const f = inp.files[0];
      if (!f) return;
      const rd = new FileReader();
      rd.onload = () => {
        try {
          S.importJSON(JSON.parse(rd.result));
          UI.toast(`Restored ${S.changes.length} changes from backup`);
        } catch (e) {
          UI.toast('Import failed: ' + U.esc(e.message), true);
        }
      };
      rd.readAsText(f);
    };
    inp.click();
  };

  /* ---------------- Program status report ---------------- */
  X.reportHtml = (program) => {
    const all = S.changes.filter((c) => !program || c.program === program);
    const open = all.filter(K.isOpen);
    const today = U.today();
    const rg = (c) => {
      const s = K.schedule(c);
      return s === 'Overdue' ? 'R' : s === 'At Risk' ? 'Y' : s.startsWith('Closed') ? 'B' : 'G';
    };
    const pastDue = open.filter((c) => K.flags(c).includes('pastDue'));
    const closed90 = all.filter((c) => c.status === 'Closed' && c.actualDate && U.diff(today, c.actualDate) <= 90);
    const onTime = closed90.filter((c) => c.actualDate <= c.requiredDate).length;
    const cost = open.reduce((s, c) => s + K.costs(c).est, 0);
    const actual = open.reduce((s, c) => s + K.costs(c).act, 0);
    const lead = open.filter(K.needsLeadership).sort((a, b) => K.score(b) - K.score(a));
    const cust = open.filter((c) => c.status === 'Awaiting Customer' || (c.customerApprovalRequired && c.stage >= 6 && c.customerApproval !== 'Approved'));
    const top = open.slice().sort((a, b) => K.score(b) - K.score(a)).slice(0, 10);
    const actions = open.flatMap((c) => c.actions.filter((a) => a.status === 'Open').map((a) => ({ ...a, c }))).sort((a, b) => (a.due < b.due ? -1 : 1));
    const odActs = actions.filter((a) => a.due && a.due < today);
    const row = (c) => `<tr><td><b>${U.esc(c.number)}</b></td><td>${U.esc(c.title)}</td><td>${U.esc(c.partNumber)}</td><td>${c.stage + 1}. ${U.esc(C.STAGES[c.stage].short)}</td><td>${U.esc(c.status)}</td><td>${U.esc(c.engineer || 'UNASSIGNED')}</td><td>${U.fmt(c.requiredDate)}</td><td>${U.fmt(c.forecastDate)}</td><td><span class="rg ${rg(c)}">${K.schedule(c)}</span></td><td>${U.esc(K.blocker(c))}</td></tr>`;
    const head = '<tr><th>Change</th><th>Title</th><th>P/N</th><th>Stage</th><th>Status</th><th>Owner</th><th>Required</th><th>Forecast</th><th>Schedule</th><th>Preventing Closure</th></tr>';
    return `<div class="report">
      <div style="display:flex;justify-content:space-between;align-items:flex-end;border-bottom:3px solid #1b3a6b;padding-bottom:8px">
        <div><div style="font-size:10px;letter-spacing:.15em;color:#1b3a6b;font-weight:700">ENGINEERING CHANGE MANAGEMENT · PROGRAM STATUS REPORT</div>
        <h1>${U.esc(program || 'All Programs')}</h1>
        <div style="color:#555">${program ? U.esc((C.programByName(program) || {}).customer || '') + ' · ' : ''}Report date ${U.fmt(today)} · Prepared by ${U.esc(S.user())}</div></div>
        <div style="text-align:right;color:#555;font-size:10px">Baseline ${program ? U.esc((C.programByName(program) || {}).baseline || '') : 'Multiple'}<br>Data as of ${new Date().toLocaleString()}</div>
      </div>
      <h2>Executive Summary</h2>
      <div class="kpirow">
        <div class="kp">Open Changes<b>${open.length}</b></div>
        <div class="kp">Past Due<b style="color:#c62828">${pastDue.length}</b></div>
        <div class="kp">Awaiting Customer<b>${cust.length}</b></div>
        <div class="kp">On-Time Closure (90d)<b>${closed90.length ? Math.round((onTime / closed90.length) * 100) + '%' : '—'}</b></div>
        <div class="kp">Open NRE (Est / Act)<b>${U.money(cost, true)}</b><span style="color:#555">${U.money(actual, true)} actual</span></div>
      </div>
      <p style="margin-top:10px">${open.length} engineering changes are open; ${pastDue.length} are past their required date and ${open.filter((c) => K.schedule(c) === 'At Risk').length} are at risk.
        ${lead.length} change${lead.length === 1 ? '' : 's'} require${lead.length === 1 ? 's' : ''} leadership attention. ${odActs.length} action items are overdue.</p>
      ${lead.length ? `<h2>Leadership Escalations</h2><table><tr><th>Change</th><th>Title</th><th>Issue</th><th>Recommended Action</th><th>Accountable</th></tr>
        ${lead.map((c) => {
          const r = E.recommend(c)[0] || {};
          return `<tr><td><b>${U.esc(c.number)}</b></td><td>${U.esc(c.title)}</td><td>${U.esc(K.blocker(c))}${K.daysLate(c) ? ` (${K.daysLate(c)}d past due)` : ''}</td><td>${U.esc(r.text || '')}</td><td>${U.esc(r.owner || '')}</td></tr>`;
        }).join('')}</table>` : ''}
      <h2>Top Critical Changes</h2><table>${head}${top.map(row).join('')}</table>
      <h2>Changes Awaiting Customer Decision</h2>${cust.length ? `<table>${head}${cust.map(row).join('')}</table>` : '<p>None.</p>'}
      <h2>Overdue Action Items</h2>${odActs.length ? `<table><tr><th>Change</th><th>Action</th><th>Owner</th><th>Due</th><th>Days Late</th></tr>${odActs.map((a) => `<tr><td>${U.esc(a.c.number)}</td><td>${U.esc(a.text)}</td><td>${U.esc(a.owner || 'UNASSIGNED')}</td><td>${U.fmt(a.due)}</td><td>${U.diff(today, a.due)}</td></tr>`).join('')}</table>` : '<p>None.</p>'}
      <h2>Full Open Change Register</h2><table>${head}${open.sort((a, b) => (a.requiredDate < b.requiredDate ? -1 : 1)).map(row).join('')}</table>
      <p style="color:#777;font-size:10px;margin-top:16px">Generated by the Engineering Change Management Command Center. Schedule status: Overdue = past required date; At Risk = forecast beyond required or due within 14 days before manufacturing implementation.</p>
    </div>`;
  };

  X.openReport = () => {
    const progs = C.PROGRAMS.map((p) => p.name);
    const sel = E.filters.program || '';
    UI.dialog({
      title: 'Program Status Report',
      size: '',
      body: `<div style="display:flex;gap:10px;align-items:center;margin-bottom:12px">
        <span class="muted">Program</span><select class="inp" style="width:280px" id="rpt-prog">${U.options(progs, sel, { blank: 'All Programs' })}</select>
        <span class="muted" style="margin-left:auto;font-size:12px">Print → “Save as PDF” to distribute</span></div>
        <div class="report-preview" id="rpt-prev">${X.reportHtml(sel)}</div>`,
      foot: `<button class="btn" data-action="closeDialog">Close</button><button class="btn" data-action="rptDownload">${UI.icon('download')} Download HTML</button><button class="btn primary" data-action="rptPrint">${UI.icon('printer')} Print / Save PDF</button>`,
      onMount: (ov) =>
        ov.querySelector('#rpt-prog').addEventListener('change', (e) => {
          ov.querySelector('#rpt-prev').innerHTML = X.reportHtml(e.target.value);
        }),
    });
  };
  E.act.rptPrint = () => {
    const prog = U.$('#rpt-prog').value;
    U.$('#print-area').innerHTML = X.reportHtml(prog);
    window.print();
  };
  E.act.rptDownload = () => {
    const prog = U.$('#rpt-prog').value;
    const css = [...document.styleSheets]
      .map((s) => {
        try {
          return [...s.cssRules].map((r) => r.cssText).filter((t) => t.startsWith('.report')).join('\n');
        } catch (e) {
          return '';
        }
      })
      .join('\n');
    const html = `<!doctype html><html><head><meta charset="utf-8"><title>Program Status Report — ${U.esc(prog || 'All Programs')}</title><style>body{margin:0;font-family:Inter,Segoe UI,Arial,sans-serif}${css}</style></head><body>${X.reportHtml(prog)}</body></html>`;
    U.download(`Program_Status_Report_${(prog || 'All').replace(/[^A-Za-z0-9]+/g, '_')}_${U.today()}.html`, html, 'text/html');
  };
  /** Single-file build: download a copy of this page with the current data embedded, ready to upload to SharePoint. */
  X.publishHtml = () => {
    if (!E.PRISTINE_HTML) return UI.toast('Save-as-HTML is available in the single-file (SharePoint) build.', true);
    const snapshotAt = new Date().toISOString();
    const payload = { name: (E.LOCAL_WORKSPACE || {}).name || 'Engineering Changes', user: '', snapshotAt, publishedBy: S.user(), changes: S.changes };
    const json = JSON.stringify(payload).replace(/</g, '\\u003c');
    const html = E.PRISTINE_HTML.replace(/(<script id="ecm-data" type="application\/json">)[\s\S]*?(<\/script>)/, (m, a, b) => a + json + b);
    U.download(E.FILE_NAME || 'ECM_Command_Center.html', html, 'text/html');
    // this browser now matches the file being published
    if (E.LOCAL_WORKSPACE) E.LOCAL_WORKSPACE.snapshotAt = snapshotAt;
    S.meta.fileSnapshot = snapshotAt;
    S.save();
    UI.dialog({
      title: 'HTML file saved',
      body: `<p style="margin-top:0">Downloaded <b>${U.esc(E.FILE_NAME || 'ECM_Command_Center.html')}</b> with all ${S.changes.length} records as of now.</p>
        <ol style="padding-left:18px;color:var(--text-2);line-height:1.7"><li>In the SharePoint library, select the existing file → <b>Replace</b> (or upload and overwrite).</li><li>Everyone who opens the new file gets this data. Their own unpublished edits are kept as a backup in their browser.</li></ol>`,
      foot: '<button class="btn primary" data-action="closeDialog">Done</button>',
    });
  };
  E.act.publishHtml = () => X.publishHtml();
  E.act.report = () => X.openReport();
  E.act.backup = () => X.backup();
  E.act.restore = () => X.restore();
  E.act.resetDemo = () =>
    UI.confirm(S.workspace === 'local' ? 'Discard your edits in this browser and reload the records from the file?' : 'Reset all data to the demonstration dataset? All local edits will be lost. Consider downloading a backup first.', () => {
      E.store.reset();
      UI.toast('Demonstration data restored');
    }, 'Reset Data', true);
})(window.ECM);
