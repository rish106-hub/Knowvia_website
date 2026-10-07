// Screen recordings of the synthetic walkthroughs, made by scripts/record-walkthroughs.mjs.
// Chapter start times (seconds) come from that script's output; re-record after changing either
// walkthrough and paste the new timings here.

export type WalkthroughJourney = "family" | "team";

export interface WalkthroughVideoMeta {
  title: string;
  caption: string;
  tryHref: string;
  duration: number;
  chapters: { label: string; start: number }[];
}

export const walkthroughVideos: Record<WalkthroughJourney, WalkthroughVideoMeta> = {
  family: {
    title: "The Rao household walkthrough",
    caption: "See 3 health plans become 1 household view.",
    tryHref: "/for-families#try-family",
    duration: 12.6,
    chapters: [
      { label: "Household cover", start: 0.3 },
      { label: "What we know", start: 2.8 },
      { label: "Hospital cost", start: 5.7 },
      { label: "Next steps", start: 8.6 },
    ],
  },
  team: {
    title: "The team walkthrough",
    caption: "See what employees know, what is missing and who handles it.",
    tryHref: "/for-employers#try-team",
    duration: 9.4,
    chapters: [
      { label: "Enrolment status", start: 0.3 },
      { label: "Employee questions", start: 2.6 },
      { label: "Who does what", start: 5.4 },
    ],
  },
};
