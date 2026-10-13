import type { Metadata } from "next";
import { OnboardingReading } from "@/components/onboarding/OnboardingReading";

export const metadata: Metadata = { title: "Reading your documents | Onboarding preview", robots: { index: false, follow: false } };

export default function Page() {
  return <OnboardingReading />;
}
