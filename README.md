# ECM Command Center — Aerospace Engineering Change Management

A single-page command center for tracking engineering changes (ECR, ECO, ECN, deviation, waiver)
across multiple aerospace programs, from identification to closure. It's built for program
managers, engineering managers, design, stress, test, quality, manufacturing, supply chain,
configuration management and leadership.

No build step and no dependencies: open `index.html`, or serve the folder (for example
`python3 -m http.server`) and browse to it. Data persists in browser local storage.

## Views

| View | What it answers |
|---|---|
| **Executive Dashboard** | 11 KPI cards with 30/90-day trend indicators, lifecycle pipeline, schedule health, program breakdown, submissions vs past-due trend, items due in 30 days, approval bottlenecks |
| **PM Command Center** | Situation brief (the 9 program-review questions), top 10 critical changes, what is preventing closure, leadership escalations with recommended actions and accountable owners, milestone/production/customer/supplier impacts, upcoming releases, cost and schedule exposure, open actions by owner |
| **Change Register** | Searchable, filterable, sortable master register with all required fields, column chooser, expandable rows, CSV / Excel export |
| **Lifecycle Workflow** | 13-stage pipeline; per-change progress track, current stage, owner, blocker, stage due date and days remaining; stage dwell time vs target |
| **Approval Tracking** | 10-function approval matrix (age vs target), overdue approvals, bottlenecks by function |
| **Technical Impact** | Impact heat map across 16 impact areas; per-change assessment with justification, evidence, risk assessment and validation activities |
| **Financial Impact** | NRE estimate vs actual by cost element, recurring impact, funding, cost recovery, schedule/production/contractual impact |
| **Risk & Escalation** | 8 automatic flags, category × rating risk matrix, risk register |
| **Analytics** | 12 interactive charts filtered by customer, program, component, owner, date range and type |
| **Configuration Mgmt** | Traceability matrix (serial/effectivity, baseline, drawing/spec rev, BOM, supplier, SW/HW, customer docs, verification, FAI, as-designed vs as-built) and configuration audit trail |

Each change record opens in a detail view with tabs for Overview, Lifecycle, Approvals, Technical
Impact, Financial, Risk, Configuration, Actions & Comments, and Audit Trail. From that view you can
create and edit records, change status, advance or revert a stage, assign owners, record
approvals and rejections (a rejection requires a comment), add actions, comments and risks,
and escalate to leadership. Every change is written to an append-only audit trail with the acting
user and a timestamp.

**Reports and data:** program status report (print/PDF or HTML), CSV export, a six-sheet Excel
workbook (register, approvals, financial, actions, risks, configuration), and JSON backup/restore.

## GPNL Margin View (`gpnl.html`)

A separate single-file page for Finance's monthly "NTR YTD GPNL" workbook. Open `gpnl.html`, drop the
.xlsx on it, and it rebuilds every report tab from the SAP line-item tab (`ZFCAGP Detail`): gross
profit by product line, program, customer, part and sales order, month or year to date, against the
Budget and Forecast tabs, with the tie-out to the ledger (`CO Summary`) and a list of data checks.

- The workbook is read in the browser with a built-in .xlsx reader. Nothing is uploaded and there are
  no dependencies.
- The last file loaded is remembered in that browser (IndexedDB). **Save data file** downloads
  `gpnl.local.js`; put it in `data/` and the page opens with that data. `data/*.local.js` is
  git-ignored: this repo is public, so never commit financial data.
- Product lines map to budget blocks in the `LINES` table near the top of the script. A new product
  line shows up under Checks until it is added there.

## Data and workspaces

- **Demo (sample data)**: fictional records generated relative to today's date.
- **Company records**: optional, loaded from `data/records.local.js`, which git ignores. See
  [`data/README.md`](data/README.md). This repo is public, so never commit real change data.

## Code layout

```
index.html          shell and script order
css/app.css         theme (dark navy/charcoal) and responsive layout
js/util.js          dates, formatting, helpers
js/constants.js     lifecycle stages, functions, impact areas, demo programs/people
js/seed.js          demo data generator
js/store.js         persistence, workspaces, audited mutations, KPIs/flags/scoring
js/charts.js        dependency-free SVG charts with tooltips
js/ui.js            badges, filter bar, dialogs, event delegation
js/record.js        change record view, tabs and edit forms
js/export.js        CSV, Excel, backup, status report
js/views-*.js       the ten views
js/app.js           routing, navigation, global search, user/workspace selection
```
