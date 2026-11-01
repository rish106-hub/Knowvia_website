import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { isDemoBuild } from "@/components/app/blocks/demo-env";
import { DemoDashboard } from "@/components/app/demo/DemoDashboard";
import { isDemoScenarioId } from "@/components/app/demo/demo-scenarios";
import { parseEntryMode } from "@/components/app/dashboard/view-model";

export const metadata: Metadata = { title: "Sample dashboard" };

// notFound unless the BFF is on (the /app layout), APP_DEMO_DATA is on and NODE_ENV is development or test (never production).
// Read per request, never at build time.
export default async function DemoPage({ params, searchParams }: { params: Promise<{ scenario: string }>; searchParams: Promise<{ mode?: string | string[] }> }) {
  await connection();
  if (!isDemoBuild(process.env)) notFound();
  const { scenario } = await params;
  if (!isDemoScenarioId(scenario)) notFound();
  const { mode } = await searchParams;
  return <DemoDashboard scenario={scenario} mode={parseEntryMode(Array.isArray(mode) ? mode[0] : mode)} />;
}
