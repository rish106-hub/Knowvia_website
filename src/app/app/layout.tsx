import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { AppShell } from "@/components/app/shell/AppShell";
import "../tokens.css";
import "@/components/app/ui/app.css";

// The authenticated app is invisible unless the BFF is on. Nothing under /app is public while APP_ENABLED is not "true".
export const metadata: Metadata = {
  title: { default: "Knowvia app", template: "%s | Knowvia" },
  robots: { index: false, follow: false },
};

export default async function AppLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  // Read the flag per request, never at build time, so turning the BFF on or off needs no rebuild.
  await connection();
  if (process.env.APP_ENABLED !== "true") notFound();
  return <AppShell>{children}</AppShell>;
}
