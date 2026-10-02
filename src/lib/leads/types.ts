import type { leadAudiences, leadIntents, leadPlacements } from "./schema";

export type LeadAudience = (typeof leadAudiences)[number];
export type LeadIntent = (typeof leadIntents)[number];
export type LeadPlacement = (typeof leadPlacements)[number];
