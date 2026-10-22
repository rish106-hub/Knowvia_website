import type { Metadata } from "next";
import { SignInScreen, type SignInReason } from "@/components/app/shell/SignInScreen";

export const metadata: Metadata = { title: "Sign in" };

export default async function SignInPage({ searchParams }: { searchParams: Promise<{ reason?: string | string[] }> }) {
  const { reason } = await searchParams;
  const value = Array.isArray(reason) ? reason[0] : reason;
  const parsed: SignInReason = value === "expired" || value === "signed_out" ? value : null;
  return <SignInScreen reason={parsed} />;
}
