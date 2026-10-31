import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { ConnectorSheet } from "@/components/app/blocks/ConnectorSheet";
import { isDemoBuild } from "@/components/app/blocks/demo-env";
import { isConnectorId } from "@/components/app/blocks/registry";

export const metadata: Metadata = { title: "Connect" };

export default async function ConnectorPage({ params }: { params: Promise<{ connectorId: string }> }) {
  // Read the flag per request, never at build time (the layout does the same for APP_ENABLED).
  await connection();
  const { connectorId } = await params;
  if (!isConnectorId(connectorId)) notFound();
  // Stub and later connectors exist only in demo builds. A real user gets a 404, not a sheet.
  if (connectorId !== "upload" && !isDemoBuild(process.env)) notFound();
  return <ConnectorSheet connectorId={connectorId} />;
}
