# Design port

The home page, site navigation, footer and onboarding routes are generated from the approved Claude Design artboards in `design/claude-design/`. The design is the source of truth: change the artboard, then regenerate. Do not hand-edit the generated files.

```bash
python3 scripts/design-port/gen_site.py design/claude-design .
npm run check
```

What the generator does:

- `dc2jsx.py` turns each artboard's markup into JSX with the same inline styles. Fonts map to the `next/font` variables, `sc-for` and `sc-if` become `map` and conditional blocks, and `{{ holes }}` read from the artboard's view model.
- Editorial markers such as `[LEGAL REVIEW]`, `[CONSENT RE-CHECK]` and `[CONFIRM …]` are removed from the live text. `[CONTACT EMAIL]` becomes `NEXT_PUBLIC_CONTACT_EMAIL`. The open items stay tracked in the design repo.
- Each artboard's logic class is kept as `*-model.js` and runs through `useDcModel`. The landing model is then wired to `/api/waitlist` (real submits, with error states) and to the microphone for voice notes.
- `src/app/design.css` is the artboard's own stylesheet: hover states, keyframes, scroll-driven reveals and reduced motion.

Generated files:

| Area | Files |
|---|---|
| Home sections | `src/components/home/*Section.tsx`, `ClauseBand.tsx`, `FamilyQuote.tsx`, `HouseholdControl.tsx`, `landing-model.js` |
| Layout | `src/components/layout/SiteNav.tsx`, `SiteFooter.tsx` |
| Onboarding | `src/components/onboarding/*`, `src/app/onboarding/**/page.tsx` |
| Styles | `src/app/design.css` |

Hand-written: `LandingPage.tsx`, `DesignShell.tsx`, `src/lib/dc.ts`, `src/lib/dc-logic.js` and `src/lib/use-dc-model.ts`.
