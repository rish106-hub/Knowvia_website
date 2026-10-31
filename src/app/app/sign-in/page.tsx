import type { Metadata } from "next";
import { SignInScreen, type SignInMode, type SignInReason } from "@/components/app/shell/SignInScreen";

export const metadata: Metadata = { title: "Sign in" };

// The start screen links here with mode=emergency, planned or asked. They become E, P and A for the Google redirect.
const MODES: Record<string, SignInMode> = { emergency: "E", planned: "P", asked: "A" };

export default async function SignInPage({ searchParams }: { searchParams: Promise<{ reason?: string | string[]; mode?: string | string[] }> }) {
  const { reason, mode } = await searchParams;
  const value = Array.isArray(reason) ? reason[0] : reason;
  const parsed: SignInReason = value === "expired" || value === "signed_out" || value === "failed" ? value : null;
  const modeValue = Array.isArray(mode) ? mode[0] : mode;
  return <SignInScreen reason={parsed} mode={MODES[modeValue ?? ""] ?? "P"} />;
}
