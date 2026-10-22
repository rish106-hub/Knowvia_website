import type { Metadata } from "next";
import { EvidenceScreen } from "@/components/app/evidence";

export const metadata: Metadata = { title: "Your cover" };

export default function CoverPage() {
  return <EvidenceScreen />;
}
