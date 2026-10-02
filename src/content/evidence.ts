// Evidence register for public claims, partner marks and quotes. Public copy may only use what is recorded here.

export interface SupportMark {
  name: string;
  file: string;
  width: number;
  height: number;
  sourceUrl: string;
  retrievedAt: string;
  sha256: string;
  modification: string | null;
  approval: string;
}

/** Shown under the exact wording "With support from". Not a partnership, endorsement or customer claim. */
export const supportMarks: SupportMark[] = [
  {
    name: "Lightspeed India Partners",
    file: "/support/lightspeed-india.svg",
    width: 1807,
    height: 640,
    sourceUrl: "https://lsvp.com/wp-content/uploads/2023/08/LSVP-INDIA.svg",
    retrievedAt: "2026-10-02",
    sha256: "fbad1702883d31e88cca52b661c04f6c67f26aa2a482b76772e28ff57e2d4edc",
    modification: null,
    approval: "Logo use and relationship wording approved by the Knowvia founder, 2026-10-02.",
  },
  {
    name: "Plum",
    file: "/support/plum.svg",
    width: 316,
    height: 97,
    sourceUrl: "https://www.plumhq.com/ (header logo asset)",
    retrievedAt: "2026-10-02",
    sha256: "33611bb353dc9c01676ebcdd982d6164d791663f99b10cc96448cfdffcd8af62",
    modification: "Single-colour fill changed from #FFFAF2 (for dark backgrounds) to #1C1C1C for a light background.",
    approval: "Logo use and relationship wording approved by the Knowvia founder, 2026-10-02.",
  },
  {
    name: "Insurance Samadhan",
    file: "/support/insurance-samadhan.svg",
    width: 202,
    height: 40,
    sourceUrl: "https://www.insurancesamadhan.com/images/logo.svg",
    retrievedAt: "2026-10-02",
    sha256: "1004fa84900b2da72cbff4b516c496098ef77d0048b03aff80a29a710f65b3c7",
    modification: null,
    approval: "Logo use and relationship wording approved by the Knowvia founder, 2026-10-02.",
  },
];

export const researchClaim = {
  headline: "Shaped by 50+ family conversations",
  provenance:
    "Founder-reported count of conversations with families and benefits teams in 2026. A directional study that shaped the product, not a survey or a measure of demand.",
} as const;

export interface ApprovedQuote {
  quote: string;
  displayName: string;
  context: string;
  consentRecordedAt: string;
  imagePermission: boolean;
  audioPermission: boolean;
}

/** Empty until each quote has its own written approval of wording, display name and media use. */
export const approvedQuotes: ApprovedQuote[] = [];
