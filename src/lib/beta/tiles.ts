import type { CardTileData, SourceTier, TileBadge, TileId } from "./types";

export const TILE_ORDER: { id: TileId; title: string }[] = [
  { id: "sum_insured", title: "Sum insured left" },
  { id: "room_rent", title: "Room rent limit" },
  { id: "waiting_periods", title: "Waiting periods still running" },
  { id: "copay_deductible", title: "Co-pay and deductible" },
  { id: "exclusions", title: "Top exclusions for your household" },
  { id: "cashless", title: "Cashless hospitals in your city" },
];

export const BADGE_LABEL: Record<TileBadge, string> = {
  own_pdf: "From your policy",
  ida_wording: "From insurer wording",
  user_declaration: "You told us",
  not_checked: "Not checked yet",
  unknown: "Your documents don't say",
};

/** One place that turns a source tier and status into a badge. No source and no status means not checked yet. */
export function badgeFor(tier: SourceTier | null | undefined, status: string | null | undefined): TileBadge {
  if (status === "unknown") return "unknown";
  if (!tier) return "not_checked";
  return tier;
}

export function sourceLine(s: { page?: number | null; clause?: string | null }) {
  return [s.page ? `Page ${s.page}` : null, s.clause ? `Clause ${s.clause}` : null].filter(Boolean).join(", ");
}
export type { CardTileData };
