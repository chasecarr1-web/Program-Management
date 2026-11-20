# DESIGN.md: Chase Carr, program management portfolio

## Brief
- **Subject:** Chase Carr, aerospace program manager. Runs nacelle and thrust reverser programs for business jets: Falcon 2000EX (Dassault Aviation / Pratt & Whitney Canada) and Textron Aviation Citation Ascend and Latitude.
- **Audience:** hiring managers, aerospace and manufacturing leadership, recruiters, customers' program offices.
- **Job:** show how Chase runs a program (rhythm, discipline, tooling) and get a conversation started.
- **Language:** English. **Constraints:** no confidential program data. Every chart is illustrative; no real shortage counts, dates, part numbers, margins or customer contacts.

## Concepts (three territories)

| | A. Line of Balance (material) | B. Deploy (product) | C. The RAIL (process) |
|---|---|---|---|
| Idea | The site is a Line of Balance: scroll moves the status date, and the actual line steps up until it meets the plan | Scrolling deploys a thrust reverser: the translating sleeve slides aft and the cascade vanes reveal the work | Every section is an action item that closes from red to green as you read it |
| Anchor | the Line of Balance exports Chase runs every week to find shortages | the hardware his programs deliver | the rolling action item list that runs his week |
| Signature | a status-date hairline driven by scroll; the actual staircase posts deliveries and turns from amber to green when it reaches plan | sleeve translates on scroll, vanes become the project index | RAG dot transitions and the item strikes through |
| Screenshot | the hero: giant name over a precise plan curve with the actual line one step behind | a section drawing with the sleeve half open | a list of closed items |
| O / F / Fe / P | 4 / 5 / 5 / 2 | 5 / 4 / 2 / 2 | 3 / 5 / 5 / 3 |

**Pick A.** It fits best (the chart is literally how he manages), it can be drawn precisely in SVG with no GL, and it survives to the footer, case pages and 404. Steal from C: RAG status as the only accent colors, and the 404 as an action item with no owner.

## Concept card
```
Idea:        The site is a Line of Balance. As you scroll, the status date moves across the plan and the actual line steps up to meet it.
Metaphor:    a production Line of Balance chart: cumulative shipsets planned vs delivered, the gap is what you chase.
Signature:   the hero chart (sticky stage): scroll is the status date; the actual staircase posts one step per
             section and turns amber → green when it reaches plan. A thin balance strip at the bottom edge
             carries the same state on every page.
Emotion:     calm control. Precise, legible, a little satisfying when the line closes.
Motion verb: post and settle: things advance in discrete steps, like a delivery posting, then settle with expo.out.
Screenshot:  "CHASE CARR" set huge and expanded, the blue plan curve running under it, the black actual line one
             step behind, the status-date hairline with its readout.
```

## Art direction
**Palette** (whiteboard and marker, the 0800 shortage board):
| Role | Hex | Use |
|---|---|---|
| ground | `#f3f4f1` | whiteboard white, slightly cool |
| ink | `#141619` | black marker; all text |
| muted | `#555a60` | secondary text (AA on ground, 6.6:1) |
| line | `rgb(20 22 25 / 0.14)` | grid, hairlines |
| plan | `#1f48c9` | blue marker: the plan line, focus ring, inline link underline |
| red / amber / green | `#c0281f` / `#9a5b00` / `#16703f` | RAG status only, always paired with a text label |
| curtain | ink | transitions, loader |

**Type:** Archivo variable (wdth 62 to 125, wght 100 to 900). Display: wdth 125, wght 800, uppercase, tracking −0.035em, leading 0.86. Text: wdth 100, wght 400. Labels: wdth 75 semibold (condensed like chart axis labels). IBM Plex Mono 400/500 only for chart readouts and data (week numbers, counts), never for nav.

**Grid:** 12 columns, gutter fluid. Strong verticals at col 1, col 5 and col 9. Rhythm moods: tight (8u), normal (16u), airy (28u), full viewport.
**Shape:** radius 0 everywhere except the status dots (circles). **Motion language:** expo.out entries, expo.inOut curtains, steps of 0.12 s stagger for posting. One clock (gsap.ticker).

## Composition plan (home)
```
1 HERO / POSTER + STICKY CHART (190svh)
┌───────────────────────────────────────────────┐
│ Chase Carr            Programs  Rhythm  Contact│
│ CHASE                                          │
│ CARR        ╭──── plan (blue)                  │
│        ┌──┘╱      actual staircase (ink)       │
│     ┌──┘ ╱  │status date  Wk 34 · Behind 2     │
│ Program manager, nacelles & thrust reversers   │
└───────────────────────────────────────────────┘
2 INDEX LIST: Programs (rows: program / customer / scope / status dot)
3 TIMETABLE: The week (5 day columns, Mon to Fri, what posts each day)
4 STATEMENT: one sentence across 10 columns
5 ASYMMETRIC PAIR: Tools I build (list left col 1-4, text col 6-11)
6 FOOTER FINALE: "In balance." + email, chart closes green
```
Case page: poster title → meta row → case chart (its own plan/actual) → context / approach / rhythm / outcome → next program.
404: "No line item for this part number." with a flat chart.

## Micro-interactions (one per role)
- Nav: underline draws (current page keeps it).
- Program rows (primary): the row's mini balance bar posts to full and the title steps right by one column unit; ink fills the status label.
- CTA (email): fill floods from the pointer side.
- Inline links: plan-blue underline at rest that rises.
- Utility (socials, colophon): color only.

## Idle state
The concept moves at rest: the chart's crosshair follows the pointer with lag and reads plan vs actual at that week; when the pointer is still it breathes a few px around the status date (gsap.ticker, paused off screen, off under reduced motion).

## Genericness test (what changed)
- First draft was a dark "tech precise" theme with a mono everywhere: generic. Switched to the whiteboard palette from his actual morning board, and limited mono to data.
- First idea for transitions was the default wipe. Replaced with a staircase curtain: 6 columns rise one after another like deliveries posting.
- No eyebrow labels over every heading; section labels only where they carry data (week, count).

## Decisions from QA
- No loader. The first pass had one (3.0 s desktop, 4.8 s on a throttled phone, over budget). The opening moment is now the chart itself: the plan draws and deliveries post up to the status date, with the name visible at first paint.
- The opening status date is week 18, not 10: at week 10 the delivered line is flat and the frame is weak. The page reads as a recovery: red at the top, amber through the method, green at the footer.
- Status readout sits at the foot of the status line, where the chart is always empty, so it never collides with the name.
- The 404 holds still at rest on purpose (status pinned at week 0: nothing on the plan). Its life is in its links.
- Headings that are the LCP (home name, case titles, 404) render visible at first paint; only supporting copy uses line reveals.
