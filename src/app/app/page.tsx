import type { Metadata } from "next";
import { HomeScreen } from "@/components/app/shell/HomeScreen";
import { parseEntryMode } from "@/components/app/dashboard/view-model";

export const metadata: Metadata = { title: "Home" };

// `?mode=E` (care needed now) opens the dashboard with the emergency card on top. Anything else is the normal order.
export default async function AppHomePage({ searchParams }: { searchParams: Promise<{ mode?: string | string[] }> }) {
  const { mode } = await searchParams;
  return <HomeScreen mode={parseEntryMode(Array.isArray(mode) ? mode[0] : mode)} />;
}
