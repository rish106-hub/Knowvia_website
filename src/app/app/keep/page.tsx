import type { Metadata } from "next";
import { KeepConsentScreen } from "@/components/app/keep/KeepConsentScreen";

export const metadata: Metadata = { title: "Keep my documents" };

export default function KeepPage() {
  return <KeepConsentScreen />;
}
