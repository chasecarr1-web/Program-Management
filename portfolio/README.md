# Chase Carr: program management portfolio

A static Astro site built around a Line of Balance: scrolling moves the status date, and the delivered line steps up until it meets the plan at the footer. Concept, palette and decisions are in `DESIGN.md`.

## Run
```bash
npm install
npm run dev        # http://localhost:4321
npm run build      # static output in dist/
npm run preview
```

## Edit content
All copy lives in `src/data/site.ts`. Items marked `placeholder: true`, plus the comment block at the top of that file, need your review before publishing.

## Before you publish
1. Set the real domain in `astro.config.mjs` (`site`), `src/data/site.ts` (`url`) and `public/robots.txt`.
2. Replace the email and LinkedIn placeholders in `src/data/site.ts`.
3. Rewrite the case study copy in your own words, and clear anything that names programs or customers with your employer.
4. Rebuild, then regenerate `public/og.png` from the live hero if the hero changed.

## Deploy
Any static host serves `dist/`: `npx netlify deploy --prod --dir dist`, `npx vercel --prod`, `npx wrangler pages deploy dist`, or GitHub Pages with the official `withastro/action`.

## Structure
- `src/motion/lob.ts`: the illustrative plan and delivery model (no real data)
- `src/motion/balance.ts`: the driver; one value (status week) moves every chart and the bottom strip
- `src/motion/setup.ts`: page transition (six columns that post like deliveries), header behaviour, button fill
- `src/engine/`: scroll, reveals and page lifecycle (GSAP + Lenis on one clock)
