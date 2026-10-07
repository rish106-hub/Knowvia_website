// Register of third-party explainer videos. Each ID was checked against YouTube's oEmbed endpoint
// (HTTP 200, title and channel below) on the accessed date. The poster is YouTube's own thumbnail,
// saved under public/videos so that no request reaches YouTube until a visitor presses play.
// Inclusion is by topic only: no relationship with, or endorsement by, any publisher.

export interface ExplainerVideo {
  id: string;
  title: string;
  channel: string;
  publisherKind: "Regulator" | "Insurer" | "Financial education" | "Insurance advisory" | "Business news";
  topic: string;
  accessed: string;
}

export const explainerVideos = {
  bimaBharosa: {
    id: "hmhlAHlUxxw",
    title: "How to register your insurance policy related complaints | Bima Bharosa | IRDAI",
    channel: "IRDAI Connects",
    publisherKind: "Regulator",
    topic: "Where to escalate when an insurer does not resolve a complaint",
    accessed: "2026-10-06",
  },
  cashlessVsReimbursement: {
    id: "6VQXL8xq0Tc",
    title: "Health Insurance: Cashless vs Reimbursement Process ft. Ditto",
    channel: "Zerodha Varsity",
    publisherKind: "Financial education",
    topic: "How cashless and reimbursement claims differ",
    accessed: "2026-10-06",
  },
  roomRentLimit: {
    id: "P35DgFxFiAI",
    title: "Room Rent Limit in Health Insurance: Room Rent Limit Kya Hai?",
    channel: "Niva Bupa Health Insurance",
    publisherKind: "Insurer",
    topic: "What a room-rent limit is and why it matters",
    accessed: "2026-10-06",
  },
  superTopUp: {
    id: "eoq7k2PrlwE",
    title: "Top-Up vs Super Top-Up Health Insurance Policy",
    channel: "Ditto Insurance",
    publisherKind: "Insurance advisory",
    topic: "How top-up and super top-up deductibles work",
    accessed: "2026-10-06",
  },
  retainEmployerCover: {
    id: "7S6PyWRPcRo",
    title: "How To Retain Your Company's Health Insurance Policy Even After Switching Jobs",
    channel: "moneycontrol",
    publisherKind: "Business news",
    topic: "What can happen to employer cover when you change jobs",
    accessed: "2026-10-06",
  },
  claimsAwareness: {
    id: "DtwpUR5VNwY",
    title: "Empowering policyholders through awareness of claims process",
    channel: "Care Insurance",
    publisherKind: "Insurer",
    topic: "The steps of a health insurance claim",
    accessed: "2026-10-06",
  },
  portability: {
    id: "UHRvtYBUUaM",
    title: "What is Health Insurance Portability: How to Port a Health Insurance Policy",
    channel: "Niva Bupa Health Insurance",
    publisherKind: "Insurer",
    topic: "Moving a policy from one insurer to another",
    accessed: "2026-10-06",
  },
} as const satisfies Record<string, ExplainerVideo>;

export type ExplainerVideoKey = keyof typeof explainerVideos;

export function videoPoster(video: ExplainerVideo): string {
  return `/videos/${video.id}.jpg`;
}

/** One explainer per guide, only where a video covers the guide's topic. */
export const articleVideos: Partial<Record<string, ExplainerVideoKey>> = {
  "room-rent-limit": "roomRentLimit",
  "employer-cover-after-leaving-a-job": "retainEmployerCover",
  "super-top-up-deductible": "superTopUp",
  "cashless-vs-reimbursement": "cashlessVsReimbursement",
  "planned-hospital-admission": "claimsAwareness",
};
