# Block 5 S0 copy changes

Every string below was changed in the artboard under `design/claude-design/` and the generated components were regenerated with `python3 scripts/design-port/gen_site.py design/claude-design .`. Reason for all of them: the backend cannot back the old claim today (audit R4, R5, D6, D7). Wording is a proposal. Needs legal review: yes, for every entry.

| Screen | Old | New | Reason | Needs legal review |
|---|---|---|---|---|
| O5 Upload | Drop a PDF or photo here, or choose a file | Drop a PDF here, or choose a file | Backend accepts only `application/pdf` | yes |
| O5 Upload | PDF, JPG or PNG, up to 15 MB each | PDF, up to 15 MB each | Backend accepts only PDF, 15 MiB (D6) | yes |
| O5 Upload | file input `accept=".pdf,.jpg,.jpeg,.png"` | `accept=".pdf,application/pdf"` | Filter must match what the backend accepts | n/a (behaviour) |
| O5 Upload | example row "Papa renewal photos.png" (18.4 MB), same in the Remove label | "Papa renewal scan.pdf" | Example must not show an unsupported file type | yes |
| O5 Upload | This file is over 15 MB. Try a PDF instead of photos. | This file is over 15 MB. Try a smaller PDF. | Photos are not accepted | yes |
| O5 Upload | Files are encrypted. Only people you allow can see them. (with a lock icon) | Only add documents you are allowed to share. (lock icon removed) | No sharing or invite endpoint exists, and the lock icon would still imply a security promise. Encryption claims need verification before they return | yes |
| O6 Reading | You can leave this page. We will email you when it is ready. | Keep this page open while we read your documents. | No email transport exists, and the client has to poll for the OCR result | yes |
| O4 Sharing | Invites sent. Until they confirm, we suggest: cover amount shared, medical details private. | Nothing is shared with them until each adult agrees. We suggest: cover amount shared, medical details private. | No invitation endpoint exists, so no invite has been sent | yes |
| O4 Sharing | Maa, Papa and your sister decide for themselves | Maa, Papa and your brother decide for themselves | Consistency: O3 and O7 list "Brother" (the household has no sister). Source fix in the artboard | no |
| O3 People | Adults you add get an invite to confirm what they share. | Each adult chooses what they share about themselves. | No member or invite endpoint exists | yes |

## Not changed, needs product or legal decision

Landing page is out of scope for S0. These are listed so they are not forgotten (audit R11, R12, D7).

| Where | Text | Problem |
|---|---|---|
| `design/claude-design/Main.dc.html` (stories block, "17 days", `StoriesSection.tsx`) | "The window to keep cover after leaving a job" shown with a 17-day count and "Seventeen days, the last one closed" | A specific figure Block 4 does not compute |
| `Main.dc.html` landing model (`landing-model.js`), "Cash" row | "You know how much cash to keep ready, and why." | Block 4 does not estimate cash to keep ready |
| `Main.dc.html` FAQ "How is my data kept safe?" | "Your documents are encrypted, and each adult controls who sees what. We do not sell your data." | Same unverified encryption and per-adult sharing claims as O5/O4 |
| `Main.dc.html` hero help | "Knowvia is not open yet. We will email you the day it is." | Confirm an email is actually sent at launch |
| `O1-Start.dc.html` | "We will send a one-time code, so there is no password to remember." and the "Send code" button | OTP sign-in is not implemented (D1) |
| `O5-Upload.dc.html` | "We will tell you exactly what to ask for." (skip path) | Promise with no backing feature; the skip link also points at a missing `Extra-States.dc.html` and is mapped to `/onboarding/your-cover` as a placeholder |
| `src/app/privacy/page.tsx:166` | "encryption in transit and at rest where appropriate" | Privacy notice is hand-written; confirm against the real deployment |
