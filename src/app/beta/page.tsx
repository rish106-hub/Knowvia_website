import type { Metadata } from "next";
import { BetaFlow } from "@/components/beta/BetaFlow";

export const metadata: Metadata = { title: "Read your policy", robots: { index: false, follow: false } };

export default function Page() {
  return <BetaFlow />;
}
