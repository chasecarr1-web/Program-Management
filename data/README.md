# Company records (local only)

This repository is **public**. Real engineering change data (EC forms, part numbers,
export-classified technical data, employee names, network paths) must never be committed.

The app looks for an optional file, `data/records.local.js`. If it exists, a second workspace
(named by the file) appears in the workspace selector next to the demo data.
`.gitignore` excludes `data/*.local.js`, `*.doc`, `*.docx` and `*.lnk` so these files stay out of git.

## File format

```js
(function (E) {
  E.LOCAL_WORKSPACE = {
    name: 'My CCB',          // label in the workspace selector
    user: 'J. Smith',        // default acting user (optional)
    build() {
      const c = E.store.blankChange();   // full record skeleton with every field
      Object.assign(c, {
        id: 'my_EC0001', number: 'EC0001', title: '...', type: 'ECO',
        program: 'Falcon 2000EX Nacelle', customer: 'Dassault Aviation',
        partNumber: '...', currentRev: '-', proposedRev: 'A',
        engineer: '...', stage: 4, status: 'Pending Approval',
        dateSubmitted: '2026-11-17', requiredDate: '2026-12-18', forecastDate: '2026-12-18',
        // optional extras shown on the Overview tab:
        dataNote: 'Which fields are placeholders',
        sourceLinks: [{ label: 'CCB folder', path: '\\\\server\\share\\...' }],
        form: { ecNumber, ecRev, changeClass, reason, priority, acceptance: [...], documents: [...], ecRevisions: [...] },
      });
      return [c];
    },
  };
})(window.ECM);
```

Edits made in the app are saved to the browser's local storage for that workspace. Records
whose number is new in the file are added on the next load; existing records keep their in-app
edits. Use **Reset** in the sidebar to reload a workspace from the file, and **Backup** / **Restore**
to move data between browsers.
