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
    file: "/support/lightspeed-india.png",
    width: 904,
    height: 320,
    sourceUrl: "https://lsvp.com/wp-content/uploads/2023/08/LSVP-INDIA.svg",
    retrievedAt: "2026-10-06",
    sha256: "b17eb32108a6a873e990aa5e6a0994f234671c94eaa767d36137ee6b163cb424",
    modification: "Rasterized from the approved source SVG to a transparent PNG; artwork unchanged.",
    approval: "Logo use and relationship wording approved by the Knowvia founder, 2026-10-02.",
  },
  {
    name: "Plum",
    file: "/support/plum.png",
    width: 632,
    height: 194,
    sourceUrl: "https://cdn.prod.website-files.com/63413ad4dec8a91fe53f4fb0/6875d6002f4ee75eaa3bed48_plum%20logo.svg",
    retrievedAt: "2026-10-06",
    sha256: "9e77cbbb3e87f4f1fdc8bc628f323bd4eecc74fb7313a2290fcd98eb2187233f",
    modification: "Rasterized from the approved source SVG to a transparent PNG; artwork unchanged.",
    approval: "Logo use and relationship wording approved by the Knowvia founder, 2026-10-02.",
  },
  {
    name: "Insurance Samadhan",
    file: "/support/insurance-samadhan.png",
    width: 808,
    height: 160,
    sourceUrl: "https://www.insurancesamadhan.com/images/logo.svg",
    retrievedAt: "2026-10-06",
    sha256: "8f36314264e1599f12c5b21da34cbe425ccc8b7c66a8ab3fcc7f14f2450a09d0",
    modification: "Rasterized from the approved source SVG to a transparent PNG; artwork unchanged.",
    approval: "Logo use and relationship wording approved by the Knowvia founder, 2026-10-02.",
  },
];

export const researchClaim = {
  headline: "Shaped by 50+ family conversations",
  note:
    "The founder spoke with 50+ families and benefits teams in 2026. Those conversations shaped what Knowvia shows and how it works.",
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
