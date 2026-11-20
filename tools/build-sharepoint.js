#!/usr/bin/env node
/*
 * Builds a single self-contained HTML file for hosting in a SharePoint document library.
 *
 *   node tools/build-sharepoint.js [--out dist/ECM_Command_Center.html] [--with-demo]
 *
 * - Inlines css/app.css and every js/*.js (no external requests; system fonts).
 * - If data/records.local.js exists, its records are embedded as a JSON data block and become
 *   the file's dataset. The demo workspace is hidden unless --with-demo is passed.
 * - The output can re-save itself with updated data ("Save HTML for SharePoint" in the sidebar).
 *
 * Output may contain company data: dist/ is git-ignored. Do not commit or publish it publicly.
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '..');
const args = process.argv.slice(2);
const outArg = args.indexOf('--out');
const out = path.resolve(root, outArg >= 0 ? args[outArg + 1] : 'dist/ECM_Command_Center.html');
const withDemo = args.includes('--with-demo');
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');
const safeScript = (js) => js.replace(/<\/script/gi, '<\\/script');

let html = read('index.html');

// 1. drop external font requests (SharePoint/intranet friendly; falls back to Segoe UI etc.)
html = html.replace(/\s*<link rel="preconnect"[^>]*>/, '').replace(/\s*<link href="https:\/\/fonts\.googleapis[^>]*>/, '');

// 2. inline stylesheet
html = html.replace('<link rel="stylesheet" href="css/app.css" />', () => `<style>\n${read('css/app.css')}\n</style>`);

// 3. build embedded dataset from data/records.local.js (evaluated with the app's own model code)
let dataJson = '';
let count = 0;
const localPath = path.join(root, 'data/records.local.js');
if (fs.existsSync(localPath)) {
  const sandbox = { window: { ECM: {} }, document: { addEventListener() {} }, console };
  sandbox.window.window = sandbox.window;
  vm.createContext(sandbox);
  ['js/util.js', 'js/constants.js', 'js/seed.js', 'data/records.local.js', 'js/store.js'].forEach((f) =>
    vm.runInContext(read(f).replace(/window\.ECM/g, 'window.ECM'), sandbox, { filename: f })
  );
  const E = sandbox.window.ECM;
  E.store.meta.user = (E.LOCAL_WORKSPACE && E.LOCAL_WORKSPACE.user) || '';
  E.store.workspace = 'local';
  const changes = E.LOCAL_WORKSPACE.build();
  count = changes.length;
  dataJson = JSON.stringify({
    name: E.LOCAL_WORKSPACE.name,
    user: E.LOCAL_WORKSPACE.user || '',
    snapshotAt: new Date().toISOString(),
    publishedBy: 'build',
    changes,
  }).replace(/</g, '\\u003c');
}

const fileName = path.basename(out);
const loader = `<script id="ecm-data" type="application/json">${dataJson}</script>
  <script>
  (function (E) {
    E.FILE_NAME = ${JSON.stringify(fileName)};
    E.HIDE_DEMO = ${withDemo ? 'false' : 'true'};
    var el = document.getElementById('ecm-data');
    var t = el ? el.textContent.trim() : '';
    if (!t) return;
    try {
      var d = JSON.parse(t);
      if (d && d.changes) E.LOCAL_WORKSPACE = { name: d.name, user: d.user, snapshotAt: d.snapshotAt, publishedBy: d.publishedBy, build: function () { return JSON.parse(JSON.stringify(d.changes)); } };
    } catch (e) { console.error('ECM: embedded data block could not be read', e); }
  })(window.ECM);
  </script>`;

// 4. replace the optional local-records tag with the data block + loader
html = html.replace(/\s*<!-- Optional company records[^>]*-->\s*<script src="data\/records\.local\.js"[^>]*><\/script>/, () => '\n  ' + loader);

// 5. inline every app script
html = html.replace(/<script src="(js\/[^"]+)"><\/script>/g, (m, f) => `<script>/* ${f} */\n${safeScript(read(f))}\n</script>`);

if (/<script src=|<link rel="stylesheet" href=/.test(html)) throw new Error('Unresolved external reference left in output');
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, html);
console.log(`Wrote ${path.relative(root, out)} (${(html.length / 1024).toFixed(0)} KB) — ${count ? count + ' embedded records' : 'demo data only'}${count && !withDemo ? ', demo hidden' : ''}`);
