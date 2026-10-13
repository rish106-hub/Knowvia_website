import type { Metadata } from "next";
import { OnboardingComingUp } from "@/components/onboarding/OnboardingComingUp";

export const metadata: Metadata = { title: "What is coming up? | Onboarding preview", robots: { index: false, follow: false } };

export default function Page() {
  return <OnboardingComingUp />;
}
