import type { Metadata } from "next";
import { OnboardingSharing } from "@/components/onboarding/OnboardingSharing";

export const metadata: Metadata = { title: "Choose what you share | Onboarding preview", robots: { index: false, follow: false } };

export default function Page() {
  return <OnboardingSharing />;
}
