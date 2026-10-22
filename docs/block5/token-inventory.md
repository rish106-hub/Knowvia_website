# Block 5 token inventory

Re-extracted in S0 from `design/claude-design/*.dc.html` (source), `src/app/design.css` (generated) and `src/app/globals.css` (hand-written), by counting case-insensitive hex occurrences. `themeColor` in `src/app/layout.tsx:21` is `#163F42`.

Result: all nine brand hex values from the research pack are present in the repo with identical values. No pack value differed, so no repo override was needed.

## Brand tokens

| Token | Hex | globals.css var | Main artboard | O1-O7 artboards | design.css | globals.css | Where used |
|---|---|---|---|---|---|---|---|
| Tide | `#163F42` | `--tide` | 90 | 84 | 5 | 1 | Primary text, headings, nav and footer ground, focus ring |
| Harbour | `#176F69` | `--harbour` | 26 | 28 | 4 | 1 | Primary button, links, switch on-state |
| Forest | `#0F4A3A` | `--forest` | 17 | 0 | 0 | 1 | Large numerals on the landing page |
| Mist | `#F3F7F6` | `--mist` | 11 | 12 | 1 | 1 | Page ground |
| Lime | `#C8E6A0` | `--lime` | 18 | 0 | 2 | 1 | Accent on dark ground, source-chip hover ring |
| Gold | `#E0A02B` | `--gold` | 10 | 21 | 1 | 1 | Focus halo, logo mark |
| Ink | `#1A3034` | `--ink` | 26 | 13 | 1 | 1 | Body text |
| Muted | `#55696D` | `--slate` | 40 | 57 | 0 | 1 | Secondary text, icons |
| Border | `#CFDCDA` | `--fog` | 18 | 40 | 1 | 1 | Card and row borders |

The bridge in `src/app/tokens.css` exposes these as `--kv-tide`, `--kv-harbour`, `--kv-forest`, `--kv-mist`, `--kv-lime`, `--kv-gold`, `--kv-ink`, `--kv-muted`, `--kv-border`. `globals.css` already has unprefixed `--tide`, `--harbour`, `--forest`, `--mist`, `--lime`, `--gold`, `--ink`, `--slate` (= Muted) and `--fog` (= Border); the `--kv-` prefix avoids a clash and keeps `/app` independent of the marketing stylesheet.

## Supporting colours already in the repo (used for the evidence-state tokens)

| Token | Hex | globals.css var | Main artboard | O1-O7 artboards | design.css | globals.css | Where used |
|---|---|---|---|---|---|---|---|
| Gold ink | `#7A5207` | `--gold-ink` | 17 | 18 | 4 | 1 | Unknown / not found: dashed border and text on Gold tint (O6, O7) |
| Gold tint | `#FBF1DD` | `--gold-tint` | 6 | 9 | 0 | 1 | Unknown / not found: ground (O6, O7) |
| Brick | `#A74335` | `--brick` | 4 | 3 | 0 | 1 | Error text and border (O5 oversize file) |
| Mist deep | `#E6EFEC` | `--mist-deep` | 17 | 11 | 0 | 1 | Chip and track ground |
| Harbour tint | `#E3F0EE` | `--harbour-tint` | 15 | 5 | 2 | 1 | Hover tint |
| Harbour hover | `#125A55` | `--harbour-hover` | 2 | 8 | 2 | 1 | Link and button hover |
| Rule | `#7B918E` | `--rule` | 8 | 7 | 0 | 1 | Dashed borders, select borders |
| Soft | `#DDF0DC` | `--soft` | 6 | 0 | 0 | 1 | Pale green panel on landing |
| Mint | `#A8DCCB` | `--mint` | 9 | 0 | 0 | 1 | Landing accent |
| Paper | `#FFFFFF` | `--paper` | 75 | 34 | 3 | 0 | Cards and inputs |

## Evidence-state tokens (new, no new hues)

State must differ by shape and wording as well as colour (audit rule 3). Colour is only one of three cues.

| Token | Resolves to | Pair with |
|---|---|---|
| `--state-confirmed` | Forest `#0F4A3A` on Soft `#DDF0DC` | solid border, check icon, word "Confirmed" |
| `--state-unknown` | Gold ink `#7A5207` on Gold tint `#FBF1DD` | dashed border, question icon, words "Not found" or "Not confirmed" |
| `--state-conflict` | Brick `#A74335` on Paper `#FFFFFF` | thick solid border, alert icon, word "Documents disagree" |
| `--state-pending` | Muted `#55696D` on Mist deep `#E6EFEC` | dotted border, clock icon, word "Waiting" |

Brick is the only state colour outside the nine brand values. It is already in the repo (`--brick`, O5 error). Wording above is a suggestion and needs legal and product review.

## Notes

- Counts include every occurrence, so inline styles repeated in a component count each time.
- Both fonts come from `next/font` in `src/app/layout.tsx:8-9` (`--font-display` Newsreader, `--font-body` Source Sans 3).
